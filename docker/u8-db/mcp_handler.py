"""
Standard MCP Streamable-HTTP (spec 2025-03-26) JSON-RPC 2.0 handler for Yongyou U8 DB queries.
Designed to be 100% compatible with RAGFlow's internal/mcp/client/mcp_client.go & mcp_call.go.
"""
import json
import uuid
from typing import Any, Dict, List, Optional, Tuple

import mssql_driver
import storage

MCP_PROTOCOL_VERSION = "2025-03-26"
MCP_SERVER_NAME = "u8-db-readonly-mcp"
MCP_SERVER_VERSION = "1.0.0"

MCP_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "u8_list_connections",
        "description": (
            "列出当前已启用且开放给 AI 查询的用友 U8 SQL Server 账套连接清单。"
            "在查询 U8 业务数据（库存、客户、供应商、订单、总账科目余额等）前，请先调用此工具获取可用的 connection_id 与白名单表信息。"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    },
    {
        "name": "u8_list_tables",
        "description": (
            "列出指定用友 U8 账套中允许只读查询的表和视图（受管理员白名单过滤）。"
            "支持按关键字搜索表名或表说明，帮助快速定位 U8 业务表（如 CurrentStock、Inventory、Customer、SO_SOMain、GL_accsum）。"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "connection_id": {
                    "type": "string",
                    "description": "U8 账套连接 ID（由 u8_list_connections 返回；若仅配置了 1 个连接可省略）",
                },
                "keyword": {
                    "type": "string",
                    "description": "可选的表名或中文说明过滤关键字（如 Stock、Customer、SO）",
                },
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "u8_describe_table",
        "description": (
            "查看指定用友 U8 表或视图的字段列表（字段名、数据类型、长度、是否可空及中文注释）。"
            "在编写 T-SQL 查询前务必先调用此工具核对真实字段名，避免字段拼写错误。"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "connection_id": {
                    "type": "string",
                    "description": "U8 账套连接 ID（若仅配置了 1 个连接可省略）",
                },
                "table_name": {
                    "type": "string",
                    "description": "表名或视图名，例如 CurrentStock、dbo.Inventory、SO_SOMain",
                },
            },
            "required": ["table_name"],
            "additionalProperties": False,
        },
    },
    {
        "name": "u8_query_sql",
        "description": (
            "在指定的用友 U8 SQL Server 账套上执行只读 T-SQL SELECT 查询。"
            "强制仅允许单条 SELECT / WITH 查询，自动应用防锁表 READ UNCOMMITTED 隔离、表/视图白名单校验与返回行数限制（建议使用 TOP 50）。"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "connection_id": {
                    "type": "string",
                    "description": "U8 账套连接 ID（若仅配置了 1 个连接可省略）",
                },
                "sql": {
                    "type": "string",
                    "description": "合法的 SQL Server T-SQL 只读 SELECT 查询语句（禁止写操作，建议带 TOP N）",
                },
                "max_rows": {
                    "type": "integer",
                    "description": "本次最大返回行数（不超过连接上限，默认 100）",
                },
            },
            "required": ["sql"],
            "additionalProperties": False,
        },
    },
]


def _get_exposed_connections(include_password: bool = False) -> List[Dict[str, Any]]:
    return [
        c
        for c in storage.list_connections(include_password=include_password)
        if c.get("enabled") and c.get("mcp_exposed")
    ]


def _resolve_mcp_connection(connection_id: Optional[str]) -> Tuple[Optional[Dict[str, Any]], str]:
    exposed = _get_exposed_connections(include_password=True)
    if not exposed:
        return None, "当前尚未配置任何已启用且开放给 AI 查询的 U8 数据库连接，请先在「集成 → U8 数据库」中添加并启用连接。"
    cid = (connection_id or "").strip()
    if not cid:
        if len(exposed) == 1:
            return exposed[0], ""
        ids = ", ".join(f"{c['id']} ({c['name']})" for c in exposed)
        return None, f"存在多个可用 U8 连接，请明确传入 connection_id：{ids}"
    for c in exposed:
        if c["id"] == cid or c["name"] == cid:
            return c, ""
    return None, f"未找到可用的 U8 连接「{cid}」，或该连接未开启 AI MCP 开放开关。"


def _format_markdown_table(columns: List[str], rows: List[List[Any]]) -> str:
    if not columns:
        return "（查询成功，无返回列）"
    if not rows:
        return "（查询成功，返回 0 行数据）"

    def esc(val: Any) -> str:
        s = "" if val is None else str(val)
        return s.replace("|", "\\|").replace("\r", " ").replace("\n", " ")

    lines = [
        "| " + " | ".join(esc(c) for c in columns) + " |",
        "| " + " | ".join("---" for _ in columns) + " |",
    ]
    for r in rows:
        lines.append("| " + " | ".join(esc(cell) for cell in r) + " |")
    return "\n".join(lines)


def _tool_result(text: str, is_error: bool = False) -> Dict[str, Any]:
    return {
        "content": [{"type": "text", "text": text}],
        "isError": is_error,
    }


def _call_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    args = arguments if isinstance(arguments, dict) else {}

    if name == "u8_list_connections":
        exposed = _get_exposed_connections(include_password=False)
        if not exposed:
            return _tool_result(
                "当前暂无已启用且开放给 AI 查询的用友 U8 数据库连接。请联系管理员在「集成 → U8 数据库」中配置并启用。"
            )
        summary = [
            {
                "connection_id": c["id"],
                "name": c["name"],
                "description": c["description"],
                "database_name": c["database_name"],
                "whitelist_enabled": c["whitelist_enabled"],
                "allowed_objects_sample": c["allowed_objects"][:30],
                "max_rows": c["max_rows"],
                "last_test_status": c["last_test_status"],
            }
            for c in exposed
        ]
        return _tool_result(json.dumps(summary, ensure_ascii=False, indent=2))

    if name == "u8_list_tables":
        conn_cfg, err = _resolve_mcp_connection(args.get("connection_id"))
        if not conn_cfg:
            return _tool_result(err, is_error=True)
        keyword = str(args.get("keyword") or "").strip()
        try:
            tables = mssql_driver.list_tables(conn_cfg, keyword=keyword, ignore_whitelist=False)
        except Exception as e:
            return _tool_result(f"获取表清单失败：{e}", is_error=True)
        if not tables:
            return _tool_result(
                f"账套「{conn_cfg['name']}」中未匹配到允许查询的表或视图（keyword={keyword!r}）。"
            )
        capped = tables[:120]
        rows = [[t["qualified_name"], t["type"], t["description"]] for t in capped]
        md = _format_markdown_table(["表/视图名", "类型", "说明"], rows)
        extra = f"\n\n（共匹配 {len(tables)} 个对象，已展示前 {len(capped)} 个）" if len(tables) > len(capped) else f"\n\n（共 {len(tables)} 个对象）"
        return _tool_result(f"账套：**{conn_cfg['name']}** (`{conn_cfg['database_name']}`)\n\n{md}{extra}")

    if name == "u8_describe_table":
        conn_cfg, err = _resolve_mcp_connection(args.get("connection_id"))
        if not conn_cfg:
            return _tool_result(err, is_error=True)
        table_name = str(args.get("table_name") or "").strip()
        if not table_name:
            return _tool_result("请传入 table_name 参数", is_error=True)
        try:
            cols = mssql_driver.describe_table(conn_cfg, table_name, ignore_whitelist=False)
        except Exception as e:
            return _tool_result(f"获取字段信息失败：{e}", is_error=True)
        if not cols:
            return _tool_result(f"未在账套「{conn_cfg['name']}」中找到表或视图「{table_name}」。", is_error=True)
        rows = [
            [
                c["name"],
                c["data_type"],
                "" if c["max_length"] is None else c["max_length"],
                "是" if c["nullable"] else "否",
                c["description"],
            ]
            for c in cols
        ]
        md = _format_markdown_table(["字段名", "类型", "长度", "可空", "说明"], rows)
        return _tool_result(f"表/视图：**{table_name}**（账套：{conn_cfg['name']}）\n\n{md}")

    if name == "u8_query_sql":
        conn_cfg, err = _resolve_mcp_connection(args.get("connection_id"))
        if not conn_cfg:
            return _tool_result(err, is_error=True)
        sql = str(args.get("sql") or "").strip()
        max_rows_override = args.get("max_rows", 100)
        try:
            res = mssql_driver.execute_readonly_query(
                conn_cfg, sql, max_rows_override=max_rows_override
            )
            storage.record_query_audit(
                actor_email="mcp-agent@u8.local",
                actor_name="AI MCP 工具调用",
                source="mcp",
                connection_id=conn_cfg["id"],
                connection_name=conn_cfg["name"],
                sql_text=sql,
                status="ok",
                row_count=res["row_count"],
                duration_ms=res["duration_ms"],
            )
            md = _format_markdown_table(res["columns"], res["rows"])
            trunc_note = (
                f"（结果已按上限 {res['max_rows']} 行截断，可加 WHERE 或 TOP 条件缩小范围）"
                if res["truncated"]
                else ""
            )
            header = (
                f"账套：**{conn_cfg['name']}** (`{conn_cfg['database_name']}`) · "
                f"返回 **{res['row_count']}** 行 · 耗时 {res['duration_ms']}ms {trunc_note}"
            )
            return _tool_result(f"{header}\n\n{md}")
        except PermissionError as pe:
            storage.record_query_audit(
                actor_email="mcp-agent@u8.local",
                actor_name="AI MCP 工具调用",
                source="mcp",
                connection_id=conn_cfg["id"],
                connection_name=conn_cfg["name"],
                sql_text=sql,
                status="blocked",
                error_message=str(pe),
            )
            return _tool_result(str(pe), is_error=True)
        except Exception as e:
            storage.record_query_audit(
                actor_email="mcp-agent@u8.local",
                actor_name="AI MCP 工具调用",
                source="mcp",
                connection_id=conn_cfg["id"],
                connection_name=conn_cfg["name"],
                sql_text=sql,
                status="error",
                error_message=str(e),
            )
            return _tool_result(f"SQL 执行失败：{e}", is_error=True)

    return _tool_result(f"未知的 MCP 工具：{name}", is_error=True)


def handle_mcp_jsonrpc(
    payload: Any, session_id: Optional[str] = None
) -> Tuple[int, Optional[Dict[str, Any]], Optional[str]]:
    """
    Process a single JSON-RPC 2.0 MCP Streamable-HTTP request.
    Returns: (http_status, json_body_or_None, response_session_id_or_None)
    """
    if not isinstance(payload, dict):
        return (
            400,
            {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32600, "message": "Invalid Request"},
            },
            session_id,
        )

    req_id = payload.get("id")
    method = str(payload.get("method") or "")
    params = payload.get("params") or {}

    # Notifications have no id and expect HTTP 202 with empty body
    if method.startswith("notifications/"):
        return 202, None, session_id

    if method == "initialize":
        new_sid = session_id or uuid.uuid4().hex
        return (
            200,
            {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": MCP_PROTOCOL_VERSION,
                    "capabilities": {"tools": {}},
                    "serverInfo": {
                        "name": MCP_SERVER_NAME,
                        "version": MCP_SERVER_VERSION,
                    },
                },
            },
            new_sid,
        )

    if method == "ping":
        return 200, {"jsonrpc": "2.0", "id": req_id, "result": {}}, session_id

    if method == "tools/list":
        return (
            200,
            {"jsonrpc": "2.0", "id": req_id, "result": {"tools": MCP_TOOLS}},
            session_id,
        )

    if method == "tools/call":
        tool_name = str(params.get("name") or "")
        arguments = params.get("arguments") or {}
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except Exception:
                arguments = {}
        result = _call_tool(tool_name, arguments)
        return (
            200,
            {"jsonrpc": "2.0", "id": req_id, "result": result},
            session_id,
        )

    return (
        200,
        {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        },
        session_id,
    )
