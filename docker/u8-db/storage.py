"""
SQLite storage and password-at-rest encryption for u8-db sidecar.
Uses Python stdlib only (sqlite3, hashlib, hmac, base64, os.urandom).
"""
import base64
import hashlib
import hmac
import json
import os
import sqlite3
import threading
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

from u8_presets import BUILTIN_U8_TEMPLATES, DEFAULT_U8_WHITELIST

DB_PATH = os.environ.get("U8_DB_DATA_PATH", "/data/u8_db.db")
SECRET_PATH = os.environ.get("U8_DB_SECRET_PATH", "/data/.secret_key")
DB_LOCK = threading.Lock()
_SECRET_KEY_CACHE: Optional[bytes] = None


def _get_secret_key() -> bytes:
    global _SECRET_KEY_CACHE
    if _SECRET_KEY_CACHE is not None:
        return _SECRET_KEY_CACHE
    env_secret = os.environ.get("U8_DB_SECRET_KEY", "").strip()
    if env_secret:
        _SECRET_KEY_CACHE = hashlib.sha256(env_secret.encode("utf-8")).digest()
        return _SECRET_KEY_CACHE
    parent = os.path.dirname(SECRET_PATH)
    if parent:
        os.makedirs(parent, exist_ok=True)
    if os.path.exists(SECRET_PATH):
        with open(SECRET_PATH, "rb") as f:
            raw = f.read().strip()
            if len(raw) >= 32:
                _SECRET_KEY_CACHE = hashlib.sha256(raw).digest()
                return _SECRET_KEY_CACHE
    raw = os.urandom(32)
    fd = os.open(SECRET_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        os.write(fd, raw)
    finally:
        os.close(fd)
    _SECRET_KEY_CACHE = hashlib.sha256(raw).digest()
    return _SECRET_KEY_CACHE


def _keystream(key: bytes, nonce: bytes, length: int) -> bytes:
    blocks = []
    counter = 0
    total = 0
    while total < length:
        blk = hmac.new(
            key, nonce + counter.to_bytes(4, "big"), hashlib.sha256
        ).digest()
        blocks.append(blk)
        total += len(blk)
        counter += 1
    return b"".join(blocks)[:length]


def encrypt_secret(plaintext: str) -> str:
    if not plaintext:
        return ""
    key = _get_secret_key()
    nonce = os.urandom(16)
    pt = plaintext.encode("utf-8")
    ks = _keystream(key, nonce, len(pt))
    ct = bytes(a ^ b for a, b in zip(pt, ks))
    mac = hmac.new(key, b"u8db-v1:" + nonce + ct, hashlib.sha256).digest()
    return "enc:v1:" + base64.urlsafe_b64encode(nonce + mac + ct).decode("ascii")


def decrypt_secret(ciphertext: str) -> str:
    if not ciphertext:
        return ""
    if not ciphertext.startswith("enc:v1:"):
        return ciphertext
    key = _get_secret_key()
    blob = base64.urlsafe_b64decode(ciphertext[len("enc:v1:") :].encode("ascii"))
    if len(blob) < 48:
        raise ValueError("invalid encrypted payload")
    nonce, mac, ct = blob[:16], blob[16:48], blob[48:]
    expected = hmac.new(key, b"u8db-v1:" + nonce + ct, hashlib.sha256).digest()
    if not hmac.compare_digest(mac, expected):
        raise ValueError("encrypted credential integrity check failed")
    ks = _keystream(key, nonce, len(ct))
    pt = bytes(a ^ b for a, b in zip(ct, ks))
    return pt.decode("utf-8")


def init_db(db_path: Optional[str] = None):
    global DB_PATH
    if db_path:
        DB_PATH = db_path
    parent = os.path.dirname(DB_PATH)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                host TEXT NOT NULL,
                port INTEGER NOT NULL DEFAULT 1433,
                instance_name TEXT NOT NULL DEFAULT '',
                database_name TEXT NOT NULL,
                username TEXT NOT NULL,
                password_enc TEXT NOT NULL DEFAULT '',
                encrypt INTEGER NOT NULL DEFAULT 0,
                trust_cert INTEGER NOT NULL DEFAULT 1,
                readonly_intent INTEGER NOT NULL DEFAULT 1,
                read_uncommitted INTEGER NOT NULL DEFAULT 1,
                max_rows INTEGER NOT NULL DEFAULT 200,
                query_timeout INTEGER NOT NULL DEFAULT 15,
                whitelist_enabled INTEGER NOT NULL DEFAULT 1,
                allowed_objects TEXT NOT NULL DEFAULT '[]',
                allowed_depts TEXT NOT NULL DEFAULT '[]',
                enabled INTEGER NOT NULL DEFAULT 1,
                mcp_exposed INTEGER NOT NULL DEFAULT 1,
                last_test_status TEXT NOT NULL DEFAULT 'untested',
                last_test_message TEXT NOT NULL DEFAULT '',
                last_test_at INTEGER NOT NULL DEFAULT 0,
                created_by TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS query_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT '自定义',
                description TEXT NOT NULL DEFAULT '',
                sql_text TEXT NOT NULL,
                is_builtin INTEGER NOT NULL DEFAULT 0,
                created_by TEXT NOT NULL DEFAULT '',
                updated_at INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS query_audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_email TEXT NOT NULL DEFAULT '',
                actor_name TEXT NOT NULL DEFAULT '',
                source TEXT NOT NULL DEFAULT 'ui',
                connection_id TEXT NOT NULL DEFAULT '',
                connection_name TEXT NOT NULL DEFAULT '',
                sql_text TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'ok',
                row_count INTEGER NOT NULL DEFAULT 0,
                duration_ms INTEGER NOT NULL DEFAULT 0,
                error_message TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        now = int(time.time())
        for tpl in BUILTIN_U8_TEMPLATES:
            conn.execute(
                """
                INSERT OR IGNORE INTO query_templates
                (id, name, category, description, sql_text, is_builtin, created_by, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, 'system', ?)
                """,
                (
                    tpl["id"],
                    tpl["name"],
                    tpl["category"],
                    tpl["description"],
                    tpl["sql_text"],
                    now,
                ),
            )
        conn.commit()
        conn.close()


def _parse_json_list(raw: str) -> List[str]:
    try:
        val = json.loads(raw or "[]")
        if isinstance(val, list):
            return [str(x).strip() for x in val if str(x).strip()]
    except Exception:
        pass
    return []


def _row_to_connection(row: Tuple[Any, ...], include_password: bool = False) -> Dict[str, Any]:
    pwd_enc = row[8] or ""
    item = {
        "id": row[0],
        "name": row[1],
        "description": row[2],
        "host": row[3],
        "port": row[4],
        "instance_name": row[5],
        "database_name": row[6],
        "username": row[7],
        "has_password": bool(pwd_enc),
        "encrypt": bool(row[9]),
        "trust_cert": bool(row[10]),
        "readonly_intent": bool(row[11]),
        "read_uncommitted": bool(row[12]),
        "max_rows": row[13],
        "query_timeout": row[14],
        "whitelist_enabled": bool(row[15]),
        "allowed_objects": _parse_json_list(row[16]),
        "allowed_depts": _parse_json_list(row[17]),
        "enabled": bool(row[18]),
        "mcp_exposed": bool(row[19]),
        "last_test_status": row[20],
        "last_test_message": row[21],
        "last_test_at": row[22],
        "created_by": row[23],
        "created_at": row[24],
        "updated_at": row[25],
    }
    if include_password:
        item["password"] = decrypt_secret(pwd_enc) if pwd_enc else ""
    return item


_CONN_COLUMNS = (
    "id, name, description, host, port, instance_name, database_name, username, "
    "password_enc, encrypt, trust_cert, readonly_intent, read_uncommitted, "
    "max_rows, query_timeout, whitelist_enabled, allowed_objects, allowed_depts, "
    "enabled, mcp_exposed, last_test_status, last_test_message, last_test_at, "
    "created_by, created_at, updated_at"
)


def list_connections(include_password: bool = False) -> List[Dict[str, Any]]:
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            f"SELECT {_CONN_COLUMNS} FROM connections ORDER BY updated_at DESC, created_at DESC"
        ).fetchall()
        conn.close()
    return [_row_to_connection(r, include_password=include_password) for r in rows]


def get_connection(conn_id: str, include_password: bool = False) -> Optional[Dict[str, Any]]:
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        row = conn.execute(
            f"SELECT {_CONN_COLUMNS} FROM connections WHERE id = ?",
            (conn_id,),
        ).fetchone()
        conn.close()
    return _row_to_connection(row, include_password=include_password) if row else None


def _clamp_int(val: Any, default: int, lo: int, hi: int) -> int:
    try:
        n = int(val)
    except Exception:
        return default
    return max(lo, min(hi, n))


def _clean_str_list(val: Any) -> List[str]:
    if isinstance(val, str):
        items = [x.strip() for x in val.replace("\r", "\n").replace(",", "\n").split("\n")]
    elif isinstance(val, list):
        items = [str(x).strip() for x in val]
    else:
        items = []
    seen = set()
    out = []
    for item in items:
        if item and item.lower() not in seen:
            seen.add(item.lower())
            out.append(item)
    return out


def create_connection(payload: Dict[str, Any], actor_email: str) -> Tuple[bool, Any]:
    name = str(payload.get("name") or "").strip()
    host = str(payload.get("host") or "").strip()
    database_name = str(payload.get("database_name") or "").strip()
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    if not name:
        return False, "请输入连接名称"
    if not host:
        return False, "请输入 SQL Server 主机地址"
    if not database_name:
        return False, "请输入 U8 账套数据库名（如 UFDATA_001_2026）"
    if not username:
        return False, "请输入数据库只读账号"

    conn_id = f"u8-{uuid.uuid4().hex[:10]}"
    now = int(time.time())
    port = _clamp_int(payload.get("port"), 1433, 1, 65535)
    max_rows = _clamp_int(payload.get("max_rows"), 200, 1, 1000)
    query_timeout = _clamp_int(payload.get("query_timeout"), 15, 3, 60)
    allowed_objects = _clean_str_list(
        payload.get("allowed_objects")
        if "allowed_objects" in payload
        else DEFAULT_U8_WHITELIST
    )
    allowed_depts = _clean_str_list(payload.get("allowed_depts", []))
    pwd_enc = encrypt_secret(password) if password else ""

    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            f"INSERT INTO connections ({_CONN_COLUMNS}) VALUES ({','.join(['?'] * 26)})",
            (
                conn_id,
                name,
                str(payload.get("description") or "").strip(),
                host,
                port,
                str(payload.get("instance_name") or "").strip(),
                database_name,
                username,
                pwd_enc,
                1 if payload.get("encrypt", False) else 0,
                1 if payload.get("trust_cert", True) else 0,
                1 if payload.get("readonly_intent", True) else 0,
                1 if payload.get("read_uncommitted", True) else 0,
                max_rows,
                query_timeout,
                1 if payload.get("whitelist_enabled", True) else 0,
                json.dumps(allowed_objects, ensure_ascii=False),
                json.dumps(allowed_depts, ensure_ascii=False),
                1 if payload.get("enabled", True) else 0,
                1 if payload.get("mcp_exposed", True) else 0,
                "untested",
                "",
                0,
                actor_email or "",
                now,
                now,
            ),
        )
        conn.commit()
        conn.close()
    return True, get_connection(conn_id)


def update_connection(conn_id: str, payload: Dict[str, Any]) -> Tuple[bool, Any]:
    existing = get_connection(conn_id, include_password=True)
    if not existing:
        return False, "连接不存在"

    name = str(payload.get("name", existing["name"]) or "").strip()
    host = str(payload.get("host", existing["host"]) or "").strip()
    database_name = str(
        payload.get("database_name", existing["database_name"]) or ""
    ).strip()
    username = str(payload.get("username", existing["username"]) or "").strip()
    if not name or not host or not database_name or not username:
        return False, "名称、主机、账套库名和用户名不能为空"

    # Keep existing password if omitted or masked
    incoming_pwd = payload.get("password")
    if incoming_pwd is None or incoming_pwd == "" or incoming_pwd == "********":
        pwd_to_store = existing["password"]
    else:
        pwd_to_store = str(incoming_pwd)
    pwd_enc = encrypt_secret(pwd_to_store) if pwd_to_store else ""

    port = _clamp_int(payload.get("port", existing["port"]), 1433, 1, 65535)
    max_rows = _clamp_int(payload.get("max_rows", existing["max_rows"]), 200, 1, 1000)
    query_timeout = _clamp_int(
        payload.get("query_timeout", existing["query_timeout"]), 15, 3, 60
    )
    allowed_objects = (
        _clean_str_list(payload.get("allowed_objects"))
        if "allowed_objects" in payload
        else existing["allowed_objects"]
    )
    allowed_depts = (
        _clean_str_list(payload.get("allowed_depts"))
        if "allowed_depts" in payload
        else existing["allowed_depts"]
    )
    now = int(time.time())

    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            """
            UPDATE connections SET
                name=?, description=?, host=?, port=?, instance_name=?,
                database_name=?, username=?, password_enc=?,
                encrypt=?, trust_cert=?, readonly_intent=?, read_uncommitted=?,
                max_rows=?, query_timeout=?, whitelist_enabled=?,
                allowed_objects=?, allowed_depts=?, enabled=?, mcp_exposed=?,
                updated_at=?
            WHERE id=?
            """,
            (
                name,
                str(payload.get("description", existing["description"]) or "").strip(),
                host,
                port,
                str(payload.get("instance_name", existing["instance_name"]) or "").strip(),
                database_name,
                username,
                pwd_enc,
                1 if payload.get("encrypt", existing["encrypt"]) else 0,
                1 if payload.get("trust_cert", existing["trust_cert"]) else 0,
                1 if payload.get("readonly_intent", existing["readonly_intent"]) else 0,
                1 if payload.get("read_uncommitted", existing["read_uncommitted"]) else 0,
                max_rows,
                query_timeout,
                1 if payload.get("whitelist_enabled", existing["whitelist_enabled"]) else 0,
                json.dumps(allowed_objects, ensure_ascii=False),
                json.dumps(allowed_depts, ensure_ascii=False),
                1 if payload.get("enabled", existing["enabled"]) else 0,
                1 if payload.get("mcp_exposed", existing["mcp_exposed"]) else 0,
                now,
                conn_id,
            ),
        )
        conn.commit()
        conn.close()
    return True, get_connection(conn_id)


def update_connection_test_status(conn_id: str, ok: bool, message: str):
    now = int(time.time())
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            """
            UPDATE connections
            SET last_test_status=?, last_test_message=?, last_test_at=?
            WHERE id=?
            """,
            ("ok" if ok else "error", (message or "")[:500], now, conn_id),
        )
        conn.commit()
        conn.close()


def delete_connection(conn_id: str) -> bool:
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.execute("DELETE FROM connections WHERE id = ?", (conn_id,))
        conn.commit()
        conn.close()
    return cur.rowcount > 0


def list_templates() -> List[Dict[str, Any]]:
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            """
            SELECT id, name, category, description, sql_text, is_builtin, created_by, updated_at
            FROM query_templates
            ORDER BY is_builtin DESC, category ASC, updated_at DESC
            """
        ).fetchall()
        conn.close()
    return [
        {
            "id": r[0],
            "name": r[1],
            "category": r[2],
            "description": r[3],
            "sql_text": r[4],
            "is_builtin": bool(r[5]),
            "created_by": r[6],
            "updated_at": r[7],
        }
        for r in rows
    ]


def create_template(payload: Dict[str, Any], actor_email: str) -> Tuple[bool, Any]:
    name = str(payload.get("name") or "").strip()
    sql_text = str(payload.get("sql_text") or "").strip()
    if not name or not sql_text:
        return False, "模板名称与 SQL 不能为空"
    tpl_id = f"tpl-{uuid.uuid4().hex[:10]}"
    now = int(time.time())
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            """
            INSERT INTO query_templates
            (id, name, category, description, sql_text, is_builtin, created_by, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            """,
            (
                tpl_id,
                name,
                str(payload.get("category") or "自定义").strip() or "自定义",
                str(payload.get("description") or "").strip(),
                sql_text,
                actor_email or "",
                now,
            ),
        )
        conn.commit()
        conn.close()
    return True, {
        "id": tpl_id,
        "name": name,
        "category": str(payload.get("category") or "自定义").strip() or "自定义",
        "description": str(payload.get("description") or "").strip(),
        "sql_text": sql_text,
        "is_builtin": False,
        "created_by": actor_email or "",
        "updated_at": now,
    }


def delete_template(tpl_id: str) -> Tuple[bool, str]:
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        row = conn.execute(
            "SELECT is_builtin FROM query_templates WHERE id = ?", (tpl_id,)
        ).fetchone()
        if not row:
            conn.close()
            return False, "模板不存在"
        if row[0]:
            conn.close()
            return False, "内置 U8 模板不可删除"
        conn.execute("DELETE FROM query_templates WHERE id = ?", (tpl_id,))
        conn.commit()
        conn.close()
    return True, "ok"


def record_query_audit(
    actor_email: str,
    actor_name: str,
    source: str,
    connection_id: str,
    connection_name: str,
    sql_text: str,
    status: str,
    row_count: int = 0,
    duration_ms: int = 0,
    error_message: str = "",
):
    now = int(time.time())
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            """
            INSERT INTO query_audit_logs
            (actor_email, actor_name, source, connection_id, connection_name,
             sql_text, status, row_count, duration_ms, error_message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                actor_email or "",
                actor_name or "",
                source or "ui",
                connection_id or "",
                connection_name or "",
                (sql_text or "")[:4000],
                status or "ok",
                int(row_count or 0),
                int(duration_ms or 0),
                (error_message or "")[:1000],
                now,
            ),
        )
        conn.execute(
            """
            DELETE FROM query_audit_logs WHERE id NOT IN (
                SELECT id FROM query_audit_logs ORDER BY id DESC LIMIT 2000
            )
            """
        )
        conn.commit()
        conn.close()


def list_query_audit_logs(
    limit: int = 100,
    actor_email: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    connection_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    lim = max(1, min(int(limit or 100), 500))
    clauses = []
    params: List[Any] = []
    if actor_email:
        clauses.append("actor_email = ?")
        params.append(actor_email.strip().lower())
    if source and source in ("ui", "mcp"):
        clauses.append("source = ?")
        params.append(source)
    if status and status in ("ok", "blocked", "error"):
        clauses.append("status = ?")
        params.append(status)
    if connection_id:
        clauses.append("connection_id = ?")
        params.append(connection_id)

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    params.append(lim)
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            f"""
            SELECT id, actor_email, actor_name, source, connection_id, connection_name,
                   sql_text, status, row_count, duration_ms, error_message, created_at
            FROM query_audit_logs
            {where_sql}
            ORDER BY id DESC
            LIMIT ?
            """,
            params,
        ).fetchall()
        conn.close()
    return [
        {
            "id": r[0],
            "actor_email": r[1],
            "actor_name": r[2],
            "source": r[3],
            "connection_id": r[4],
            "connection_name": r[5],
            "sql_text": r[6],
            "status": r[7],
            "row_count": r[8],
            "duration_ms": r[9],
            "error_message": r[10],
            "created_at": r[11],
        }
        for r in rows
    ]
