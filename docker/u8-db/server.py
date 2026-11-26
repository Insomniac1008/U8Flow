#!/usr/bin/env python3
"""
Yongyou U8 Read-Only Database Query & MCP Sidecar for U8Flow / RAGFlow.
- Admin/Member REST API under /api/* (proxied via Nginx /u8-db-api/*, authenticated via u8-rbac /me)
- Private-network MCP Streamable-HTTP endpoint at /mcp (for RAGFlow Chat / Agent AI tool calling)
"""
import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlparse

import mcp_handler
import mssql_driver
import storage
from u8_presets import DEFAULT_U8_WHITELIST

PORT = int(os.environ.get("U8_DB_PORT", "9395"))
RBAC_API = os.environ.get("U8_RBAC_API_URL", "http://u8-rbac:9390").rstrip("/")
MCP_PUBLIC_URL = os.environ.get("U8_DB_MCP_URL", "http://u8-db:9395/mcp")
MCP_SUGGESTED_NAME = os.environ.get("U8_DB_MCP_NAME", "u8_database_readonly")


def resolve_rbac_user(auth_header: str) -> Optional[Dict[str, Any]]:
    if not auth_header:
        return None
    req = urllib.request.Request(
        f"{RBAC_API}/me",
        headers={"Authorization": auth_header},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if body.get("code") == 0 and isinstance(body.get("data"), dict):
                return body["data"]
    except Exception:
        return None
    return None


def fetch_rbac_departments(auth_header: str) -> List[Dict[str, str]]:
    """Fetch distinct departments + names from u8-rbac (admin only)."""
    if not auth_header:
        return []
    req = urllib.request.Request(
        f"{RBAC_API}/policies",
        headers={"Authorization": auth_header},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if body.get("code") != 0:
                return []
            dept_names = body.get("dept_names") or {}
            codes = sorted(
                {
                    str(item.get("dept") or "").strip()
                    for item in (body.get("data") or [])
                    if str(item.get("dept") or "").strip()
                }
            )
            return [
                {"code": c, "name": dept_names.get(c, c)}
                for c in codes
            ]
    except Exception:
        return []


def user_can_access_connection(user: Dict[str, Any], conn_cfg: Dict[str, Any]) -> bool:
    if user.get("is_admin"):
        return True
    if not conn_cfg.get("enabled"):
        return False
    allowed_depts = conn_cfg.get("allowed_depts") or []
    if not allowed_depts:
        return True
    user_dept = str(user.get("dept") or "").strip()
    return user_dept in allowed_depts


def sanitize_connection_for_member(conn_cfg: Dict[str, Any], is_admin: bool) -> Dict[str, Any]:
    out = dict(conn_cfg)
    out.pop("password", None)
    if not is_admin:
        # Hide raw DB username/host from non-admin members while keeping helpful display metadata
        out["username"] = "只读账号"
    return out


class U8DBHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    def send_json(self, code: int, obj: Any, extra_headers: Optional[Dict[str, str]] = None):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def send_empty(self, code: int, extra_headers: Optional[Dict[str, str]] = None):
        self.send_response(code)
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def read_json_body(self) -> Any:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            return {}
        if length > 2 * 1024 * 1024:
            raise ValueError("request body too large")
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def require_user(self) -> Optional[Dict[str, Any]]:
        auth = self.headers.get("Authorization", "")
        user = resolve_rbac_user(auth)
        if not user:
            self.send_json(401, {"code": 401, "message": "未登录或登录态已失效，请重新登录"})
            return None
        return user

    def require_admin(self) -> Optional[Dict[str, Any]]:
        user = self.require_user()
        if not user:
            return None
        if not user.get("is_admin"):
            self.send_json(403, {"code": 403, "message": "仅团队管理员可执行此操作"})
            return None
        return user

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path == "/healthz":
            self.send_json(200, {"status": "ok", "service": "u8-db"})
            return

        if path == "/api/meta":
            user = self.require_user()
            if not user:
                return
            auth = self.headers.get("Authorization", "")
            is_admin = bool(user.get("is_admin"))
            exposed_count = sum(
                1
                for c in storage.list_connections()
                if c.get("enabled") and c.get("mcp_exposed")
            )
            self.send_json(
                200,
                {
                    "code": 0,
                    "data": {
                        "email": user.get("email", ""),
                        "nickname": user.get("nickname", ""),
                        "dept": user.get("dept", ""),
                        "is_admin": is_admin,
                        "mcp": {
                            "url": MCP_PUBLIC_URL,
                            "suggested_name": MCP_SUGGESTED_NAME,
                            "server_type": "streamable-http",
                            "exposed_connections": exposed_count,
                            "tools": mcp_handler.MCP_TOOLS,
                        },
                        "default_whitelist": DEFAULT_U8_WHITELIST,
                        "departments": fetch_rbac_departments(auth) if is_admin else [],
                    },
                },
            )
            return

        if path == "/api/connections":
            user = self.require_user()
            if not user:
                return
            is_admin = bool(user.get("is_admin"))
            all_conns = storage.list_connections(include_password=False)
            visible = [
                sanitize_connection_for_member(c, is_admin)
                for c in all_conns
                if user_can_access_connection(user, c)
            ]
            self.send_json(200, {"code": 0, "data": visible})
            return

        if path.startswith("/api/connections/") and path.endswith("/tables"):
            user = self.require_user()
            if not user:
                return
            conn_id = path[len("/api/connections/") : -len("/tables")].strip("/")
            conn_cfg = storage.get_connection(conn_id, include_password=True)
            if not conn_cfg or not user_can_access_connection(user, conn_cfg):
                self.send_json(403, {"code": 403, "message": "无权访问该 U8 数据库连接"})
                return
            keyword = (qs.get("keyword") or [""])[0]
            show_all = (qs.get("all") or ["0"])[0] in ("1", "true") and bool(
                user.get("is_admin")
            )
            try:
                tables = mssql_driver.list_tables(
                    conn_cfg, keyword=keyword, ignore_whitelist=show_all
                )
                self.send_json(200, {"code": 0, "data": tables})
            except Exception as e:
                self.send_json(500, {"code": 500, "message": f"拉取表清单失败：{e}"})
            return

        if path.startswith("/api/connections/") and path.endswith("/columns"):
            user = self.require_user()
            if not user:
                return
            conn_id = path[len("/api/connections/") : -len("/columns")].strip("/")
            conn_cfg = storage.get_connection(conn_id, include_password=True)
            if not conn_cfg or not user_can_access_connection(user, conn_cfg):
                self.send_json(403, {"code": 403, "message": "无权访问该 U8 数据库连接"})
                return
            table_name = (qs.get("table") or [""])[0]
            try:
                cols = mssql_driver.describe_table(
                    conn_cfg,
                    table_name,
                    ignore_whitelist=bool(user.get("is_admin"))
                    and (qs.get("all") or ["0"])[0] in ("1", "true"),
                )
                self.send_json(200, {"code": 0, "data": cols})
            except PermissionError as pe:
                self.send_json(403, {"code": 403, "message": str(pe)})
            except Exception as e:
                self.send_json(500, {"code": 500, "message": f"获取字段信息失败：{e}"})
            return

        if path == "/api/templates":
            user = self.require_user()
            if not user:
                return
            self.send_json(200, {"code": 0, "data": storage.list_templates()})
            return

        if path == "/api/audit-logs":
            user = self.require_user()
            if not user:
                return
            limit = int((qs.get("limit") or ["100"])[0])
            source = (qs.get("source") or [""])[0]
            status = (qs.get("status") or [""])[0]
            conn_id = (qs.get("connection_id") or [""])[0]
            actor_filter = None if user.get("is_admin") else user.get("email", "")
            logs = storage.list_query_audit_logs(
                limit=limit,
                actor_email=actor_filter,
                source=source or None,
                status=status or None,
                connection_id=conn_id or None,
            )
            self.send_json(200, {"code": 0, "data": logs})
            return

        self.send_json(404, {"code": 404, "message": "not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Private Docker network MCP Streamable-HTTP endpoint
        if path == "/mcp":
            try:
                body = self.read_json_body()
            except Exception as e:
                self.send_json(
                    400,
                    {
                        "jsonrpc": "2.0",
                        "id": None,
                        "error": {"code": -32700, "message": f"Parse error: {e}"},
                    },
                )
                return
            sid = self.headers.get("Mcp-Session-Id")
            status_code, resp_body, resp_sid = mcp_handler.handle_mcp_jsonrpc(body, sid)
            headers = {"Mcp-Session-Id": resp_sid} if resp_sid else None
            if resp_body is None:
                self.send_empty(status_code, extra_headers=headers)
            else:
                self.send_json(status_code, resp_body, extra_headers=headers)
            return

        try:
            body = self.read_json_body()
        except Exception as e:
            self.send_json(400, {"code": 400, "message": f"请求体 JSON 无效：{e}"})
            return

        if path == "/api/connections":
            admin = self.require_admin()
            if not admin:
                return
            ok, res = storage.create_connection(body, admin.get("email", ""))
            if not ok:
                self.send_json(400, {"code": 400, "message": res})
                return
            self.send_json(200, {"code": 0, "data": res, "message": "已创建 U8 数据库连接"})
            return

        if path == "/api/connections/test-draft":
            admin = self.require_admin()
            if not admin:
                return
            cfg = dict(body or {})
            # If editing an existing connection without re-entering password, reuse stored password
            edit_id = str(cfg.get("id") or "").strip()
            if edit_id and (not cfg.get("password") or cfg.get("password") == "********"):
                existing = storage.get_connection(edit_id, include_password=True)
                if existing:
                    cfg["password"] = existing.get("password", "")
            result = mssql_driver.test_connection(cfg)
            self.send_json(200, {"code": 0, "data": result})
            return

        if path.startswith("/api/connections/") and path.endswith("/test"):
            user = self.require_user()
            if not user:
                return
            conn_id = path[len("/api/connections/") : -len("/test")].strip("/")
            conn_cfg = storage.get_connection(conn_id, include_password=True)
            if not conn_cfg or not user_can_access_connection(user, conn_cfg):
                self.send_json(403, {"code": 403, "message": "无权测试该连接"})
                return
            result = mssql_driver.test_connection(conn_cfg)
            storage.update_connection_test_status(
                conn_id, bool(result.get("ok")), str(result.get("message") or "")
            )
            self.send_json(200, {"code": 0, "data": result})
            return

        if path == "/api/query":
            user = self.require_user()
            if not user:
                return
            conn_id = str(body.get("connection_id") or "").strip()
            sql = str(body.get("sql") or "")
            max_rows_override = body.get("max_rows")
            conn_cfg = storage.get_connection(conn_id, include_password=True)
            if not conn_cfg:
                self.send_json(404, {"code": 404, "message": "未找到指定的 U8 数据库连接"})
                return
            if not user_can_access_connection(user, conn_cfg):
                self.send_json(
                    403,
                    {"code": 403, "message": "当前账号所属部门无权查询该 U8 账套，请联系管理员授权"},
                )
                return
            try:
                res = mssql_driver.execute_readonly_query(
                    conn_cfg, sql, max_rows_override=max_rows_override
                )
                storage.record_query_audit(
                    actor_email=user.get("email", ""),
                    actor_name=user.get("nickname", ""),
                    source="ui",
                    connection_id=conn_cfg["id"],
                    connection_name=conn_cfg["name"],
                    sql_text=sql,
                    status="ok",
                    row_count=res["row_count"],
                    duration_ms=res["duration_ms"],
                )
                self.send_json(200, {"code": 0, "data": res})
            except PermissionError as pe:
                storage.record_query_audit(
                    actor_email=user.get("email", ""),
                    actor_name=user.get("nickname", ""),
                    source="ui",
                    connection_id=conn_cfg["id"],
                    connection_name=conn_cfg["name"],
                    sql_text=sql,
                    status="blocked",
                    error_message=str(pe),
                )
                self.send_json(403, {"code": 403, "message": str(pe)})
            except Exception as e:
                storage.record_query_audit(
                    actor_email=user.get("email", ""),
                    actor_name=user.get("nickname", ""),
                    source="ui",
                    connection_id=conn_cfg["id"],
                    connection_name=conn_cfg["name"],
                    sql_text=sql,
                    status="error",
                    error_message=str(e),
                )
                self.send_json(500, {"code": 500, "message": f"查询执行失败：{e}"})
            return

        if path == "/api/templates":
            admin = self.require_admin()
            if not admin:
                return
            ok, res = storage.create_template(body, admin.get("email", ""))
            if not ok:
                self.send_json(400, {"code": 400, "message": res})
                return
            self.send_json(200, {"code": 0, "data": res, "message": "已保存查询模板"})
            return

        self.send_json(404, {"code": 404, "message": "not found"})

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        admin = self.require_admin()
        if not admin:
            return
        try:
            body = self.read_json_body()
        except Exception as e:
            self.send_json(400, {"code": 400, "message": f"请求体 JSON 无效：{e}"})
            return

        if path.startswith("/api/connections/"):
            conn_id = path[len("/api/connections/") :].strip("/")
            ok, res = storage.update_connection(conn_id, body)
            if not ok:
                self.send_json(400, {"code": 400, "message": res})
                return
            self.send_json(200, {"code": 0, "data": res, "message": "已更新 U8 数据库连接"})
            return

        self.send_json(404, {"code": 404, "message": "not found"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # MCP Streamable-HTTP session termination
        if path == "/mcp":
            self.send_empty(200)
            return

        admin = self.require_admin()
        if not admin:
            return

        if path.startswith("/api/connections/"):
            conn_id = path[len("/api/connections/") :].strip("/")
            if storage.delete_connection(conn_id):
                self.send_json(200, {"code": 0, "message": "已删除连接"})
            else:
                self.send_json(404, {"code": 404, "message": "连接不存在"})
            return

        if path.startswith("/api/templates/"):
            tpl_id = path[len("/api/templates/") :].strip("/")
            ok, msg = storage.delete_template(tpl_id)
            if ok:
                self.send_json(200, {"code": 0, "message": "已删除模板"})
            else:
                self.send_json(400, {"code": 400, "message": msg})
            return

        self.send_json(404, {"code": 404, "message": "not found"})


if __name__ == "__main__":
    storage.init_db()
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), U8DBHandler)
    print(f"u8-db listening on :{PORT}, rbac={RBAC_API}, db={storage.DB_PATH}", flush=True)
    srv.serve_forever()
