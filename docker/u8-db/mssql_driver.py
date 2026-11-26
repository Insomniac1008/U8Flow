"""
Microsoft SQL Server (Yongyou U8) read-only connection & execution adapter using python-tds.
Compatible with SQL Server 2008 R2 / 2012 / 2014 / 2016 / 2017 / 2019 / 2022.
"""
import datetime
import decimal
import ssl
import time
import uuid
from typing import Any, Dict, List, Optional

from sql_guard import is_object_allowed, validate_readonly_sql

try:
    import pytds  # type: ignore
except ImportError:  # pragma: no cover - allows unit tests on host without pytds
    pytds = None


def _serialize_cell(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, decimal.Decimal):
        return str(value)
    if isinstance(value, datetime.datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, datetime.date):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, datetime.time):
        return value.strftime("%H:%M:%S")
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (bytes, bytearray, memoryview)):
        raw = bytes(value)
        if len(raw) <= 32:
            return "0x" + raw.hex()
        return f"0x{raw[:16].hex()}...({len(raw)} bytes)"
    return str(value)


def _open_connection(cfg: Dict[str, Any]):
    if pytds is None:
        raise RuntimeError("未安装 python-tds 驱动，请在 Docker 容器中运行 u8-db 服务")

    host = str(cfg.get("host") or "").strip()
    instance_name = str(cfg.get("instance_name") or "").strip()
    port = int(cfg.get("port") or 1433)
    database = str(cfg.get("database_name") or "").strip()
    username = str(cfg.get("username") or "").strip()
    password = str(cfg.get("password") or "")
    query_timeout = max(3, min(int(cfg.get("query_timeout") or 15), 60))
    encrypt = bool(cfg.get("encrypt", False))
    trust_cert = bool(cfg.get("trust_cert", True))
    readonly_intent = bool(cfg.get("readonly_intent", True))

    server_addr = f"{host}\\{instance_name}" if instance_name else host
    kwargs: Dict[str, Any] = {
        "dsn": server_addr,
        "database": database,
        "user": username,
        "password": password,
        "timeout": query_timeout,
        "login_timeout": min(query_timeout, 10),
        "autocommit": True,
        "appname": "U8Flow-ReadOnly",
        "readonly": readonly_intent,
    }
    if not instance_name:
        kwargs["port"] = port

    if encrypt:
        if trust_cert:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            kwargs["tls_ctx"] = ctx
        else:
            kwargs["cafile"] = ssl.get_default_verify_paths().cafile or True
        kwargs["validate_host"] = not trust_cert
    else:
        kwargs["cafile"] = None

    return pytds.connect(**kwargs)


def test_connection(cfg: Dict[str, Any]) -> Dict[str, Any]:
    start = time.monotonic()
    conn = None
    try:
        conn = _open_connection(cfg)
        cur = conn.cursor()
        cur.execute("SELECT @@VERSION, DB_NAME(), SYSTEM_USER")
        row = cur.fetchone()
        latency_ms = int((time.monotonic() - start) * 1000)
        version_line = str(row[0]).splitlines()[0] if row and row[0] else ""
        return {
            "ok": True,
            "latency_ms": latency_ms,
            "server_version": version_line,
            "database_name": str(row[1]) if row and row[1] else cfg.get("database_name", ""),
            "current_user": str(row[2]) if row and row[2] else cfg.get("username", ""),
            "message": f"连接成功（{latency_ms}ms）— {version_line}",
        }
    except Exception as e:
        latency_ms = int((time.monotonic() - start) * 1000)
        return {
            "ok": False,
            "latency_ms": latency_ms,
            "server_version": "",
            "database_name": cfg.get("database_name", ""),
            "current_user": cfg.get("username", ""),
            "message": f"连接失败：{e}",
        }
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


def list_tables(
    cfg: Dict[str, Any],
    keyword: str = "",
    ignore_whitelist: bool = False,
) -> List[Dict[str, Any]]:
    conn = None
    try:
        conn = _open_connection(cfg)
        cur = conn.cursor()
        if cfg.get("read_uncommitted", True):
            cur.execute("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")
        cur.execute(
            """
            SELECT
                s.name AS schema_name,
                o.name AS object_name,
                CASE o.type WHEN 'V' THEN 'VIEW' ELSE 'TABLE' END AS object_type,
                CAST(ISNULL(ep.value, N'') AS NVARCHAR(400)) AS description
            FROM sys.objects o WITH (NOLOCK)
            INNER JOIN sys.schemas s WITH (NOLOCK) ON o.schema_id = s.schema_id
            LEFT JOIN sys.extended_properties ep WITH (NOLOCK)
                ON ep.major_id = o.object_id AND ep.minor_id = 0 AND ep.name = N'MS_Description'
            WHERE o.type IN ('U', 'V') AND o.is_ms_shipped = 0
            ORDER BY CASE o.type WHEN 'V' THEN 0 ELSE 1 END, s.name, o.name
            """
        )
        rows = cur.fetchall()
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    kw = (keyword or "").strip().lower()
    wl_enabled = bool(cfg.get("whitelist_enabled", True)) and not ignore_whitelist
    allowed_objects = cfg.get("allowed_objects") or []

    results: List[Dict[str, Any]] = []
    for r in rows:
        schema_name = str(r[0] or "dbo")
        obj_name = str(r[1] or "")
        obj_type = str(r[2] or "TABLE")
        desc = str(r[3] or "")
        qualified = f"{schema_name}.{obj_name}"
        if wl_enabled and not is_object_allowed(qualified, allowed_objects):
            continue
        if kw and kw not in obj_name.lower() and kw not in desc.lower():
            continue
        results.append(
            {
                "schema": schema_name,
                "name": obj_name,
                "qualified_name": qualified,
                "type": obj_type,
                "description": desc,
            }
        )
    return results


def describe_table(
    cfg: Dict[str, Any],
    table_name: str,
    ignore_whitelist: bool = False,
) -> List[Dict[str, Any]]:
    raw = (table_name or "").strip()
    if not raw:
        raise ValueError("表名不能为空")

    parts = [p.strip().strip("[]\"") for p in raw.split(".") if p.strip()]
    if len(parts) == 2:
        schema_name, bare_name = parts[0], parts[1]
    elif len(parts) == 1:
        schema_name, bare_name = "dbo", parts[0]
    else:
        raise ValueError(f"无效的表名：{table_name}")

    wl_enabled = bool(cfg.get("whitelist_enabled", True)) and not ignore_whitelist
    if wl_enabled and not is_object_allowed(f"{schema_name}.{bare_name}", cfg.get("allowed_objects") or []):
        raise PermissionError(f"表/视图「{bare_name}」不在允许查询白名单中")

    conn = None
    try:
        conn = _open_connection(cfg)
        cur = conn.cursor()
        if cfg.get("read_uncommitted", True):
            cur.execute("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")
        cur.execute(
            """
            SELECT
                c.name AS column_name,
                t.name AS data_type,
                c.max_length,
                c.is_nullable,
                CAST(ISNULL(ep.value, N'') AS NVARCHAR(400)) AS description
            FROM sys.columns c WITH (NOLOCK)
            INNER JOIN sys.objects o WITH (NOLOCK) ON c.object_id = o.object_id
            INNER JOIN sys.schemas s WITH (NOLOCK) ON o.schema_id = s.schema_id
            INNER JOIN sys.types t WITH (NOLOCK) ON c.user_type_id = t.user_type_id
            LEFT JOIN sys.extended_properties ep WITH (NOLOCK)
                ON ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.name = N'MS_Description'
            WHERE s.name = %s AND o.name = %s AND o.type IN ('U', 'V')
            ORDER BY c.column_id
            """,
            (schema_name, bare_name),
        )
        rows = cur.fetchall()
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    return [
        {
            "name": str(r[0]),
            "data_type": str(r[1]),
            "max_length": int(r[2]) if r[2] is not None else None,
            "nullable": bool(r[3]),
            "description": str(r[4] or ""),
        }
        for r in rows
    ]


def execute_readonly_query(
    cfg: Dict[str, Any],
    sql: str,
    max_rows_override: Optional[int] = None,
) -> Dict[str, Any]:
    ok, err_msg, referenced = validate_readonly_sql(
        sql,
        whitelist_enabled=bool(cfg.get("whitelist_enabled", True)),
        allowed_objects=cfg.get("allowed_objects") or [],
    )
    if not ok:
        raise PermissionError(err_msg)

    conn_max = int(cfg.get("max_rows") or 200)
    limit = conn_max
    if max_rows_override is not None:
        try:
            limit = max(1, min(int(max_rows_override), conn_max))
        except Exception:
            limit = conn_max

    start = time.monotonic()
    conn = None
    try:
        conn = _open_connection(cfg)
        cur = conn.cursor()
        if cfg.get("read_uncommitted", True):
            cur.execute("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")
        cur.execute(sql.strip().rstrip(";"))
        desc = cur.description or []
        columns = [str(col[0] or f"col_{idx + 1}") for idx, col in enumerate(desc)]
        fetched = cur.fetchmany(limit + 1) if desc else []
        truncated = len(fetched) > limit
        rows_raw = fetched[:limit]
        rows = [[_serialize_cell(cell) for cell in r] for r in rows_raw]
        duration_ms = int((time.monotonic() - start) * 1000)
        return {
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "truncated": truncated,
            "max_rows": limit,
            "duration_ms": duration_ms,
            "referenced_objects": referenced,
        }
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
