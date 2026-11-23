#!/usr/bin/env python3
"""
Lightweight RBAC Sidecar for RAGFlow + Yongyou U8 Team Control.
Uses Python stdlib only (~20 MB RAM). Persists policies & audit logs in SQLite.
"""
import csv
import io
import json
import os
import sqlite3
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("RBAC_PORT", "9390"))
RAGFLOW_API = os.environ.get("RAGFLOW_API_URL", "http://ragflow-cpu:9380")
OWNER_EMAIL = os.environ.get("U8_TEAM_OWNER", "caiaijun@u8.local").strip().lower()
EXTRA_ADMIN_EMAILS = {
    e.strip().lower()
    for e in os.environ.get("U8_TEAM_ADMINS", "").split(",")
    if e.strip()
}
DB_PATH = os.environ.get("RBAC_DB_PATH", "/data/rbac.db")

MODULES = ["chats", "searches", "datasets", "files", "agents", "models"]
VALID_LEVELS = {"none", "read", "write"}

DEFAULT_MEMBER_POLICY = {
    "chats": "write",
    "searches": "write",
    "datasets": "read",
    "files": "read",
    "agents": "read",
    "models": "read",
}

OWNER_POLICY = {m: "write" for m in MODULES}

SEED_EMPLOYEES = [
    ("02009", "王丽娟", "01", "wanglijuan@u8.local"),
    ("02010", "黄华", "0701", "huanghua@u8.local"),
    ("04138", "曹志钦", "04", "caozhiqin@u8.local"),
    ("04139", "陈方良", "0701", "chenfangliang@u8.local"),
    ("05040", "王永平", "02", "wangyongping@u8.local"),
    ("06028", "刘宝军", "02", "liubaojun@u8.local"),
    ("06172", "王维", "03", "wangwei@u8.local"),
    ("06201", "王志敏", "03", "wangzhimin@u8.local"),
    ("06398", "阮干泰", "01", "ruangantai@u8.local"),
    ("07172", "程伟", "02", "chengwei@u8.local"),
    ("08196", "黄磊", "05", "huanglei@u8.local"),
    ("08590", "刘妹", "06", "liumei@u8.local"),
    ("09630", "王素琴", "0701", "wangsuqin@u8.local"),
    ("10029", "蔡爱君", "08", "caiaijun@u8.local"),
    ("10035", "李燕", "04", "liyan@u8.local"),
    ("10113", "陆美芬", "0701", "lumeifen@u8.local"),
    ("10547", "徐凤娟", "02", "xufengjuan@u8.local"),
    ("15525", "王丹丹", "03", "wangdandan@u8.local"),
    ("18129", "李梦丽", "02", "limengli@u8.local"),
    ("18393", "吴秋霞", "02", "wuqiuxia@u8.local"),
    ("19633", "高丹昱", "04", "gaodanyu@u8.local"),
    ("23235", "朱媛", "01", "zhuyuan@u8.local"),
]

DB_LOCK = threading.Lock()
CACHE_LOCK = threading.Lock()
TOKEN_CACHE = {}  # token -> (expires_at, user_dict)
TOKEN_CACHE_TTL = 45.0
TOKEN_CACHE_MAX = 500


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS member_policies (
                email TEXT PRIMARY KEY,
                emp_no TEXT NOT NULL DEFAULT '',
                name TEXT NOT NULL DEFAULT '',
                dept TEXT NOT NULL DEFAULT '',
                chats TEXT NOT NULL DEFAULT 'write',
                searches TEXT NOT NULL DEFAULT 'write',
                datasets TEXT NOT NULL DEFAULT 'read',
                files TEXT NOT NULL DEFAULT 'read',
                agents TEXT NOT NULL DEFAULT 'read',
                models TEXT NOT NULL DEFAULT 'read',
                is_admin INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        # Auto-migrate existing DBs that don't have is_admin column yet
        cols = {row[1] for row in conn.execute("PRAGMA table_info(member_policies)").fetchall()}
        if "is_admin" not in cols:
            conn.execute("ALTER TABLE member_policies ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dept_names (
                dept_code TEXT PRIMARY KEY,
                dept_name TEXT NOT NULL DEFAULT ''
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_email TEXT NOT NULL DEFAULT '',
                actor_name TEXT NOT NULL DEFAULT '',
                action TEXT NOT NULL DEFAULT '',
                target TEXT NOT NULL DEFAULT '',
                detail TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        now = int(time.time())
        for emp_no, name, dept, email in SEED_EMPLOYEES:
            em = email.lower()
            is_owner = em == OWNER_EMAIL
            is_admin = 1 if (is_owner or em in EXTRA_ADMIN_EMAILS) else 0
            pol = OWNER_POLICY if is_admin else DEFAULT_MEMBER_POLICY
            conn.execute(
                """
                INSERT OR IGNORE INTO member_policies
                (email, emp_no, name, dept, chats, searches, datasets, files, agents, models, is_admin, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    em,
                    emp_no,
                    name,
                    dept,
                    pol["chats"],
                    pol["searches"],
                    pol["datasets"],
                    pol["files"],
                    pol["agents"],
                    pol["models"],
                    is_admin,
                    now,
                ),
            )
        # Ensure primary owner always has is_admin=1
        conn.execute("UPDATE member_policies SET is_admin = 1 WHERE email = ?", (OWNER_EMAIL,))
        conn.commit()
        conn.close()


def is_admin_email(email: str) -> bool:
    em = (email or "").strip().lower()
    if not em:
        return False
    if em == OWNER_EMAIL or em in EXTRA_ADMIN_EMAILS:
        return True
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        row = conn.execute(
            "SELECT is_admin FROM member_policies WHERE email = ?",
            (em,),
        ).fetchone()
        conn.close()
    return bool(row and row[0])


def ensure_member_exists(email: str, nickname: str = ""):
    """Auto-register newly signed-in RAGFlow users so they appear in the Team Permissions table."""
    em = (email or "").strip().lower()
    if not em:
        return
    now = int(time.time())
    is_admin = 1 if (em == OWNER_EMAIL or em in EXTRA_ADMIN_EMAILS) else 0
    pol = OWNER_POLICY if is_admin else DEFAULT_MEMBER_POLICY
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            """
            INSERT OR IGNORE INTO member_policies
            (email, emp_no, name, dept, chats, searches, datasets, files, agents, models, is_admin, updated_at)
            VALUES (?, '', ?, '其他', ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                em,
                (nickname or "").strip() or em.split("@")[0],
                pol["chats"],
                pol["searches"],
                pol["datasets"],
                pol["files"],
                pol["agents"],
                pol["models"],
                is_admin,
                now,
            ),
        )
        conn.commit()
        conn.close()


def record_audit(actor_email: str, actor_name: str, action: str, target: str, detail: str):
    now = int(time.time())
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            """
            INSERT INTO audit_logs (actor_email, actor_name, action, target, detail, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (actor_email or "", actor_name or "", action, target, detail, now),
        )
        # Keep audit table bounded to latest 2000 rows
        conn.execute(
            """
            DELETE FROM audit_logs WHERE id NOT IN (
                SELECT id FROM audit_logs ORDER BY id DESC LIMIT 2000
            )
            """
        )
        conn.commit()
        conn.close()


def list_audit_logs(limit: int = 100) -> list:
    lim = max(1, min(int(limit or 100), 500))
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            """
            SELECT id, actor_email, actor_name, action, target, detail, created_at
            FROM audit_logs
            ORDER BY id DESC
            LIMIT ?
            """,
            (lim,),
        ).fetchall()
        conn.close()
    return [
        {
            "id": r[0],
            "actor_email": r[1],
            "actor_name": r[2],
            "action": r[3],
            "target": r[4],
            "detail": r[5],
            "created_at": r[6],
        }
        for r in rows
    ]


def get_policy_for_email(email: str) -> dict:
    em = (email or "").strip().lower()
    if em == OWNER_EMAIL or em in EXTRA_ADMIN_EMAILS:
        return dict(OWNER_POLICY)
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        row = conn.execute(
            "SELECT chats, searches, datasets, files, agents, models, is_admin FROM member_policies WHERE email = ?",
            (em,),
        ).fetchone()
        conn.close()
    if not row:
        return dict(DEFAULT_MEMBER_POLICY)
    if row[6]:
        return dict(OWNER_POLICY)
    return dict(zip(MODULES, row[:6]))


def get_dept_names() -> dict:
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute("SELECT dept_code, dept_name FROM dept_names").fetchall()
        conn.close()
    return {r[0]: r[1] for r in rows if r[1]}


def set_dept_name(dept_code: str, dept_name: str):
    code = (dept_code or "").strip()
    name = (dept_name or "").strip()
    if not code:
        return
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        if not name:
            conn.execute("DELETE FROM dept_names WHERE dept_code = ?", (code,))
        else:
            conn.execute(
                "INSERT INTO dept_names (dept_code, dept_name) VALUES (?, ?) "
                "ON CONFLICT(dept_code) DO UPDATE SET dept_name = excluded.dept_name",
                (code, name),
            )
        conn.commit()
        conn.close()


def list_all_policies() -> list:
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            """
            SELECT email, emp_no, name, dept, chats, searches, datasets, files, agents, models, is_admin, updated_at
            FROM member_policies
            ORDER BY dept ASC, emp_no ASC, email ASC
            """
        ).fetchall()
        conn.close()
    result = []
    for r in rows:
        em = r[0].lower()
        is_primary_owner = em == OWNER_EMAIL
        is_adm = bool(is_primary_owner or em in EXTRA_ADMIN_EMAILS or r[10])
        result.append(
            {
                "email": r[0],
                "emp_no": r[1],
                "name": r[2],
                "dept": r[3],
                "is_owner": is_primary_owner,
                "is_admin": is_adm,
                "permissions": dict(OWNER_POLICY) if is_adm else {
                    "chats": r[4],
                    "searches": r[5],
                    "datasets": r[6],
                    "files": r[7],
                    "agents": r[8],
                    "models": r[9],
                },
                "updated_at": r[11],
            }
        )
    return result


def _clean_perms(perms: dict) -> dict:
    clean = {}
    for m in MODULES:
        v = str((perms or {}).get(m, DEFAULT_MEMBER_POLICY[m])).lower()
        clean[m] = v if v in VALID_LEVELS else DEFAULT_MEMBER_POLICY[m]
    return clean


def upsert_user_policy(
    email: str,
    perms: dict = None,
    name: str = None,
    emp_no: str = None,
    dept: str = None,
    is_admin: bool = None,
):
    em = (email or "").strip().lower()
    if not em:
        return False, "email required"
    is_primary = em == OWNER_EMAIL
    now = int(time.time())
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        existing = conn.execute(
            "SELECT email, emp_no, name, dept, chats, searches, datasets, files, agents, models, is_admin "
            "FROM member_policies WHERE email = ?",
            (em,),
        ).fetchone()
        if existing:
            cur_perms = dict(zip(MODULES, existing[4:10]))
            clean = _clean_perms(perms) if perms is not None else cur_perms
            new_emp_no = existing[1] if emp_no is None else str(emp_no).strip()
            new_name = existing[2] if name is None else (str(name).strip() or existing[2])
            new_dept = existing[3] if dept is None else (str(dept).strip() or "其他")
            new_admin = 1 if is_primary else (existing[10] if is_admin is None else (1 if is_admin else 0))
            if is_primary:
                clean = dict(OWNER_POLICY)
            conn.execute(
                """
                UPDATE member_policies
                SET emp_no=?, name=?, dept=?, chats=?, searches=?, datasets=?, files=?, agents=?, models=?, is_admin=?, updated_at=?
                WHERE email=?
                """,
                (
                    new_emp_no,
                    new_name,
                    new_dept,
                    clean["chats"],
                    clean["searches"],
                    clean["datasets"],
                    clean["files"],
                    clean["agents"],
                    clean["models"],
                    new_admin,
                    now,
                    em,
                ),
            )
        else:
            clean = dict(OWNER_POLICY) if is_primary else _clean_perms(perms or DEFAULT_MEMBER_POLICY)
            new_emp_no = "" if emp_no is None else str(emp_no).strip()
            new_name = (str(name).strip() if name else "") or em.split("@")[0]
            new_dept = (str(dept).strip() if dept else "") or "其他"
            new_admin = 1 if (is_primary or is_admin) else 0
            conn.execute(
                """
                INSERT INTO member_policies
                (email, emp_no, name, dept, chats, searches, datasets, files, agents, models, is_admin, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    em,
                    new_emp_no,
                    new_name,
                    new_dept,
                    clean["chats"],
                    clean["searches"],
                    clean["datasets"],
                    clean["files"],
                    clean["agents"],
                    clean["models"],
                    new_admin,
                    now,
                ),
            )
        conn.commit()
        conn.close()
    return True, "ok"


def delete_user_policy(email: str):
    em = (email or "").strip().lower()
    if not em:
        return False, "email required"
    if em == OWNER_EMAIL:
        return False, "不可删除主负责人账号"
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.execute("DELETE FROM member_policies WHERE email = ?", (em,))
        deleted = cur.rowcount
        conn.commit()
        conn.close()
    if deleted == 0:
        return False, "未找到该成员"
    return True, "ok"


def update_dept_policy(dept: str, perms: dict, partial: bool = False) -> int:
    """
    If partial=True, only update the modules present in `perms`.
    Otherwise update all 6 modules.
    Skips primary owner and admins.
    """
    now = int(time.time())
    if partial:
        updates = {}
        for m, v in (perms or {}).items():
            if m in MODULES and str(v).lower() in VALID_LEVELS:
                updates[m] = str(v).lower()
        if not updates:
            return 0
    else:
        updates = _clean_perms(perms)

    set_clause = ", ".join([f"{m}=?" for m in updates.keys()]) + ", updated_at=?"
    values = list(updates.values()) + [now]

    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        if dept == "__ALL__":
            cur = conn.execute(
                f"UPDATE member_policies SET {set_clause} WHERE email != ? AND is_admin = 0",
                values + [OWNER_EMAIL],
            )
        else:
            cur = conn.execute(
                f"UPDATE member_policies SET {set_clause} WHERE dept = ? AND email != ? AND is_admin = 0",
                values + [dept, OWNER_EMAIL],
            )
        affected = cur.rowcount
        conn.commit()
        conn.close()
    return affected


def resolve_user(auth_header: str):
    if not auth_header:
        return None
    now = time.time()
    with CACHE_LOCK:
        cached = TOKEN_CACHE.get(auth_header)
        if cached and cached[0] > now:
            return cached[1]
    req = urllib.request.Request(
        f"{RAGFLOW_API}/api/v1/users/me",
        headers={"Authorization": auth_header},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if body.get("code") == 0 and isinstance(body.get("data"), dict):
                data = body["data"]
                user = {
                    "id": data.get("id", ""),
                    "email": (data.get("email") or "").strip().lower(),
                    "nickname": data.get("nickname") or "",
                }
                if user["email"]:
                    with CACHE_LOCK:
                        # Evict expired entries if cache grows large
                        if len(TOKEN_CACHE) >= TOKEN_CACHE_MAX:
                            expired = [k for k, v in TOKEN_CACHE.items() if v[0] <= now]
                            for k in expired:
                                TOKEN_CACHE.pop(k, None)
                            if len(TOKEN_CACHE) >= TOKEN_CACHE_MAX:
                                # Drop oldest 25% entries
                                oldest = sorted(TOKEN_CACHE.items(), key=lambda kv: kv[1][0])[: TOKEN_CACHE_MAX // 4]
                                for k, _ in oldest:
                                    TOKEN_CACHE.pop(k, None)
                        TOKEN_CACHE[auth_header] = (now + TOKEN_CACHE_TTL, user)
                    return user
    except Exception:
        return None
    return None


def classify_request(path: str, method: str):
    """
    Returns (module, required_level) or (None, None) if always allowed.
    required_level is 'read' or 'write'.
    """
    m = method.upper()
    is_read = m in ("GET", "HEAD", "OPTIONS")
    p = path.split("?", 1)[0]

    # Always allow public / auth / system / admin / self-profile
    if (
        p.startswith("/api/v1/admin")
        or p.startswith("/api/v1/system")
        or p.startswith("/api/v1/auth")
        or p.startswith("/api/v1/settings")
        or p == "/api/v1/language"
        or p == "/api/v1/users"
        or p == "/api/v1/users/me"
        or p == "/api/v1/users/me/admin"
        or p == "/api/v1/users/me/meta"
        or (p == "/api/v1/users/me/models" and is_read)
    ):
        return None, None

    # Team membership mutations -> owner/admin only
    if p.startswith("/api/v1/tenants"):
        return (None, None) if is_read else ("__owner_only__", "write")

    # Models / Providers write protection (GET always allowed so Chat/Search work)
    if (
        p == "/api/v1/users/me/models"
        or p.startswith("/api/v1/providers")
        or p.startswith("/api/v1/models")
        or p.startswith("/api/v1/all-models")
    ):
        return (None, None) if is_read else ("models", "write")

    # Chats
    if (
        p.startswith("/api/v1/chats")
        or p.startswith("/api/v1/chat")
        or p.startswith("/api/v1/openai")
    ):
        return "chats", ("read" if is_read else "write")

    # Searches & Retrieval
    if p.startswith("/api/v1/searches") or p == "/api/v1/retrieval":
        return "searches", ("read" if is_read else "write")

    # Datasets & Documents
    if p.startswith("/api/v1/datasets") or p.startswith("/api/v1/documents"):
        if p.endswith("/search"):
            return "datasets", "read"
        return "datasets", ("read" if is_read else "write")

    # Files & Folders & Skills
    if (
        p.startswith("/api/v1/files")
        or p.startswith("/api/v1/workspace-files")
        or p.startswith("/api/v1/folders")
        or p.startswith("/api/v1/workspaces")
        or p.startswith("/api/v1/skills")
    ):
        return "files", ("read" if is_read else "write")

    # Agents, Pipelines, Memories
    if (
        p.startswith("/api/v1/agents")
        or p.startswith("/api/v1/pipelines")
        or p.startswith("/api/v1/tasks")
        or p.startswith("/api/v1/memories")
        or p.startswith("/api/v1/messages")
    ):
        return "agents", ("read" if is_read else "write")

    return None, None


def level_allows(actual: str, required: str) -> bool:
    order = {"none": 0, "read": 1, "write": 2}
    return order.get(actual, 0) >= order.get(required, 1)


class RBACHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Quiet normal 200 auth logs to save disk/CPU
        pass

    def send_json(self, code: int, obj: dict):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def send_csv(self, filename: str, content: str):
        raw = ("\ufeff" + content).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def require_admin(self):
        user = resolve_user(self.headers.get("Authorization", ""))
        if not user or not is_admin_email(user["email"]):
            self.send_json(403, {"code": 403, "message": "仅团队管理员可操作权限"})
            return None
        return user

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path == "/healthz":
            self.send_json(200, {"status": "ok", "owner": OWNER_EMAIL})
            return

        if path == "/auth":
            self.handle_auth_subrequest()
            return

        if path == "/me":
            user = resolve_user(self.headers.get("Authorization", ""))
            if not user:
                self.send_json(401, {"code": 401, "message": "未登录"})
                return
            ensure_member_exists(user["email"], user.get("nickname", ""))
            is_primary = user["email"] == OWNER_EMAIL
            is_adm = is_admin_email(user["email"])
            self.send_json(
                200,
                {
                    "code": 0,
                    "data": {
                        "email": user["email"],
                        "nickname": user["nickname"],
                        "is_owner": is_adm,  # backward-compatible flag for frontend admin entry
                        "is_primary_owner": is_primary,
                        "is_admin": is_adm,
                        "owner_email": OWNER_EMAIL,
                        "permissions": get_policy_for_email(user["email"]),
                    },
                },
            )
            return

        if path == "/policies":
            if not self.require_admin():
                return
            self.send_json(
                200,
                {"code": 0, "data": list_all_policies(), "dept_names": get_dept_names()},
            )
            return

        if path == "/policies/export":
            if not self.require_admin():
                return
            fmt = (qs.get("format") or ["csv"])[0].lower()
            policies = list_all_policies()
            dept_map = get_dept_names()
            if fmt == "json":
                self.send_json(200, {"code": 0, "data": policies, "dept_names": dept_map})
                return
            buf = io.StringIO()
            writer = csv.writer(buf)
            writer.writerow(
                ["emp_no", "name", "dept_code", "dept_name", "email", "is_admin"] + MODULES
            )
            for p in policies:
                perms = p.get("permissions") or {}
                writer.writerow(
                    [
                        p["emp_no"],
                        p["name"],
                        p["dept"],
                        dept_map.get(p["dept"], ""),
                        p["email"],
                        "1" if p["is_admin"] else "0",
                    ]
                    + [perms.get(m, "read") for m in MODULES]
                )
            self.send_csv("u8_rbac_policies.csv", buf.getvalue())
            return

        if path == "/audit-logs":
            if not self.require_admin():
                return
            limit = int((qs.get("limit") or ["100"])[0])
            self.send_json(200, {"code": 0, "data": list_audit_logs(limit)})
            return

        self.send_json(404, {"code": 404, "message": "not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        actor = self.require_admin()
        if not actor:
            return
        try:
            body = self.read_json_body()
        except Exception as e:
            self.send_json(400, {"code": 400, "message": f"invalid json: {e}"})
            return

        if path == "/policies/user":
            email = str(body.get("email", "")).strip().lower()
            if not email or "@" not in email:
                self.send_json(400, {"code": 400, "message": "请输入有效邮箱"})
                return
            ok, msg = upsert_user_policy(
                email=email,
                perms=body.get("permissions"),
                name=body.get("name"),
                emp_no=body.get("emp_no"),
                dept=body.get("dept"),
                is_admin=body.get("is_admin"),
            )
            if not ok:
                self.send_json(400, {"code": 400, "message": msg})
                return
            record_audit(
                actor["email"],
                actor["nickname"],
                "add_user",
                email,
                json.dumps(
                    {
                        "name": body.get("name", ""),
                        "emp_no": body.get("emp_no", ""),
                        "dept": body.get("dept", ""),
                        "is_admin": bool(body.get("is_admin")),
                    },
                    ensure_ascii=False,
                ),
            )
            self.send_json(200, {"code": 0, "message": "已添加成员"})
            return

        self.send_json(404, {"code": 404, "message": "not found"})

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        actor = self.require_admin()
        if not actor:
            return

        try:
            body = self.read_json_body()
        except Exception as e:
            self.send_json(400, {"code": 400, "message": f"invalid json: {e}"})
            return

        if path == "/policies/user":
            email = str(body.get("email", "")).strip().lower()
            if not email:
                self.send_json(400, {"code": 400, "message": "email required"})
                return
            # Only primary owner can toggle other people's admin flag
            req_admin = body.get("is_admin") if "is_admin" in body else None
            if req_admin is not None and actor["email"] != OWNER_EMAIL:
                self.send_json(403, {"code": 403, "message": "仅主负责人可调整管理员身份"})
                return
            ok, msg = upsert_user_policy(
                email=email,
                perms=body.get("permissions") if "permissions" in body else None,
                name=body.get("name") if "name" in body else None,
                emp_no=body.get("emp_no") if "emp_no" in body else None,
                dept=body.get("dept") if "dept" in body else None,
                is_admin=req_admin,
            )
            if not ok:
                self.send_json(400, {"code": 400, "message": msg})
                return
            detail_obj = {}
            for k in ("name", "emp_no", "dept", "is_admin", "permissions"):
                if k in body:
                    detail_obj[k] = body[k]
            record_audit(
                actor["email"],
                actor["nickname"],
                "update_user",
                email,
                json.dumps(detail_obj, ensure_ascii=False),
            )
            self.send_json(200, {"code": 0, "message": "已保存成员权限"})
            return

        if path == "/policies/dept":
            dept = str(body.get("dept", "")).strip()
            perms = body.get("permissions") or {}
            partial = bool(body.get("partial", False))
            if not dept:
                self.send_json(400, {"code": 400, "message": "dept required"})
                return
            affected = update_dept_policy(dept, perms, partial=partial)
            record_audit(
                actor["email"],
                actor["nickname"],
                "update_dept",
                dept,
                json.dumps({"affected": affected, "permissions": perms}, ensure_ascii=False),
            )
            self.send_json(
                200,
                {"code": 0, "message": f"已批量更新 {affected} 位成员权限", "affected": affected},
            )
            return

        if path == "/dept-names":
            dept_code = str(body.get("dept_code", "")).strip()
            dept_name = str(body.get("dept_name", "")).strip()
            if not dept_code:
                self.send_json(400, {"code": 400, "message": "dept_code required"})
                return
            set_dept_name(dept_code, dept_name)
            record_audit(
                actor["email"],
                actor["nickname"],
                "rename_dept",
                dept_code,
                dept_name or "(恢复默认)",
            )
            self.send_json(
                200,
                {"code": 0, "message": "部门名称已保存", "dept_names": get_dept_names()},
            )
            return

        self.send_json(404, {"code": 404, "message": "not found"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)
        actor = self.require_admin()
        if not actor:
            return

        if path == "/policies/user":
            email = (qs.get("email") or [""])[0].strip().lower()
            if not email:
                try:
                    body = self.read_json_body()
                    email = str(body.get("email", "")).strip().lower()
                except Exception:
                    email = ""
            ok, msg = delete_user_policy(email)
            if not ok:
                self.send_json(400, {"code": 400, "message": msg})
                return
            record_audit(actor["email"], actor["nickname"], "delete_user", email, "")
            self.send_json(200, {"code": 0, "message": "已移除成员"})
            return

        self.send_json(404, {"code": 404, "message": "not found"})

    def handle_auth_subrequest(self):
        orig_uri = self.headers.get("X-Original-URI", "")
        orig_method = self.headers.get("X-Original-Method", "GET")
        auth_header = self.headers.get("Authorization", "")

        module, req_level = classify_request(orig_uri, orig_method)
        if module is None:
            self.send_response(200)
            self.end_headers()
            return

        # Unauthenticated requests pass through to RAGFlow's own AuthMiddleware (which returns 401)
        if not auth_header:
            self.send_response(200)
            self.end_headers()
            return

        user = resolve_user(auth_header)
        if not user:
            # Invalid/expired token: let RAGFlow handle its normal 401 response
            self.send_response(200)
            self.end_headers()
            return

        if is_admin_email(user["email"]):
            self.send_response(200)
            self.end_headers()
            return

        if module == "__owner_only__":
            self.send_response(403)
            self.end_headers()
            return

        pol = get_policy_for_email(user["email"])
        actual = pol.get(module, "none")
        if level_allows(actual, req_level):
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(403)
            self.end_headers()


if __name__ == "__main__":
    init_db()
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), RBACHandler)
    print(f"u8-rbac listening on :{PORT}, owner={OWNER_EMAIL}, db={DB_PATH}", flush=True)
    srv.serve_forever()
