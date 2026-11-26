#!/usr/bin/env python3
"""Unit tests for docker/u8-db SQL firewall, encrypted storage, and MCP protocol."""
import os
import tempfile
import unittest
from unittest.mock import patch

import mcp_handler
import storage
from sql_guard import validate_readonly_sql


class TestSqlGuard(unittest.TestCase):
    def test_allows_select_with_whitelist(self):
        ok, err, objs = validate_readonly_sql(
            "SELECT TOP 20 cInvCode, cInvName FROM dbo.Inventory WITH (NOLOCK) WHERE cInvName <> 'DROP TABLE';",
            whitelist_enabled=True,
            allowed_objects=["Inventory", "CurrentStock"],
        )
        self.assertTrue(ok, err)
        self.assertEqual(objs, ["dbo.Inventory"])

    def test_allows_cte_and_wildcard_views(self):
        sql = """
        -- 查库存视图
        WITH stock_cte AS (
            SELECT cInvCode, iQuantity FROM [dbo].[v_u8_stock_summary]
        )
        SELECT * FROM stock_cte JOIN Inventory i ON stock_cte.cInvCode = i.cInvCode
        """
        ok, err, objs = validate_readonly_sql(
            sql,
            whitelist_enabled=True,
            allowed_objects=["v_u8_*", "Inventory"],
        )
        self.assertTrue(ok, err)
        self.assertIn("dbo.v_u8_stock_summary", objs)
        self.assertIn("Inventory", objs)

    def test_blocks_write_and_ddl_and_multi_statement(self):
        bad_queries = [
            "DELETE FROM Inventory WHERE 1=1",
            "UPDATE Inventory SET cInvName = 'x'",
            "INSERT INTO Inventory (cInvCode) VALUES ('1')",
            "SELECT * INTO #tmp FROM Inventory",
            "SELECT 1; DROP TABLE Inventory",
            "EXEC sp_executesql N'SELECT 1'",
            "SELECT * FROM Inventory /* trick */ ; WAITFOR DELAY '0:0:5'",
            "DBCC CHECKDB",
        ]
        for sql in bad_queries:
            ok, err, _ = validate_readonly_sql(
                sql, whitelist_enabled=False, allowed_objects=[]
            )
            self.assertFalse(ok, f"Expected blocked: {sql}")
            self.assertTrue(len(err) > 0)

    def test_blocks_non_whitelisted_table(self):
        ok, err, objs = validate_readonly_sql(
            "SELECT * FROM CurrentStock cs JOIN UA_User u ON 1=1",
            whitelist_enabled=True,
            allowed_objects=["CurrentStock"],
        )
        self.assertFalse(ok)
        self.assertIn("UA_User", err)
        self.assertIn("UA_User", objs)

    def test_blocks_comma_join_bypass(self):
        ok, err, _ = validate_readonly_sql(
            "SELECT * FROM Inventory i, UA_User u WHERE i.cInvCode = '1'",
            whitelist_enabled=True,
            allowed_objects=["Inventory"],
        )
        self.assertFalse(ok)
        self.assertIn("UA_User", err)

    def test_blocks_cross_database_query(self):
        ok, err, _ = validate_readonly_sql(
            "SELECT * FROM UFDATA_999_2025.dbo.Inventory",
            whitelist_enabled=True,
            allowed_objects=["Inventory"],
        )
        self.assertFalse(ok)
        self.assertIn("跨库", err)


class TestStorageAndMcp(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        storage._SECRET_KEY_CACHE = None
        storage.SECRET_PATH = os.path.join(self.tmpdir.name, ".secret_key")
        storage.init_db(os.path.join(self.tmpdir.name, "u8_db.db"))

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_connection_crud_and_password_encryption(self):
        ok, created = storage.create_connection(
            {
                "name": "主账套2026",
                "host": "192.168.1.50",
                "port": 1433,
                "database_name": "UFDATA_001_2026",
                "username": "u8_readonly",
                "password": "SuperSecret#Password!",
                "allowed_objects": ["Inventory", "CurrentStock"],
            },
            "caiaijun@u8.local",
        )
        self.assertTrue(ok, created)
        self.assertNotIn("password", created)
        self.assertTrue(created["has_password"])

        full = storage.get_connection(created["id"], include_password=True)
        self.assertEqual(full["password"], "SuperSecret#Password!")

        # Masked password on update must preserve stored secret
        ok2, updated = storage.update_connection(
            created["id"], {"name": "主账套2026-新", "password": "********"}
        )
        self.assertTrue(ok2)
        self.assertEqual(updated["name"], "主账套2026-新")
        full2 = storage.get_connection(created["id"], include_password=True)
        self.assertEqual(full2["password"], "SuperSecret#Password!")

    def test_mcp_streamable_http_protocol(self):
        # 1. initialize
        code, body, sid = mcp_handler.handle_mcp_jsonrpc(
            {"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {}}
        )
        self.assertEqual(code, 200)
        self.assertTrue(bool(sid))
        self.assertEqual(body["result"]["protocolVersion"], "2025-03-26")

        # 2. notifications/initialized
        code, body, _ = mcp_handler.handle_mcp_jsonrpc(
            {"jsonrpc": "2.0", "method": "notifications/initialized"}, sid
        )
        self.assertEqual(code, 202)
        self.assertIsNone(body)

        # 3. tools/list
        code, body, _ = mcp_handler.handle_mcp_jsonrpc(
            {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, sid
        )
        self.assertEqual(code, 200)
        tool_names = [t["name"] for t in body["result"]["tools"]]
        self.assertEqual(
            tool_names,
            ["u8_list_connections", "u8_list_tables", "u8_describe_table", "u8_query_sql"],
        )

        # 4. Create exposed connection and call u8_query_sql (mocking driver execution)
        _, created = storage.create_connection(
            {
                "name": "测试账套",
                "host": "10.0.0.10",
                "database_name": "UFDATA_001_2026",
                "username": "ro",
                "password": "pw",
                "allowed_objects": ["Inventory"],
                "mcp_exposed": True,
            },
            "caiaijun@u8.local",
        )
        # Blocked write SQL via MCP should return isError=True and log 'blocked'
        code, body, _ = mcp_handler.handle_mcp_jsonrpc(
            {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {
                    "name": "u8_query_sql",
                    "arguments": {
                        "connection_id": created["id"],
                        "sql": "DELETE FROM Inventory",
                    },
                },
            },
            sid,
        )
        self.assertEqual(code, 200)
        self.assertTrue(body["result"]["isError"])
        logs = storage.list_query_audit_logs(source="mcp", status="blocked")
        self.assertEqual(len(logs), 1)

        # Successful mocked query via MCP
        with patch.object(
            mcp_handler.mssql_driver,
            "execute_readonly_query",
            return_value={
                "columns": ["cInvCode", "cInvName"],
                "rows": [["0101", "标准件A"]],
                "row_count": 1,
                "truncated": False,
                "max_rows": 100,
                "duration_ms": 12,
                "referenced_objects": ["Inventory"],
            },
        ):
            code, body, _ = mcp_handler.handle_mcp_jsonrpc(
                {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "tools/call",
                    "params": {
                        "name": "u8_query_sql",
                        "arguments": {
                            "connection_id": created["id"],
                            "sql": "SELECT TOP 10 cInvCode, cInvName FROM Inventory",
                        },
                    },
                },
                sid,
            )
            self.assertEqual(code, 200)
            self.assertFalse(body["result"]["isError"])
            self.assertIn("标准件A", body["result"]["content"][0]["text"])


if __name__ == "__main__":
    unittest.main()
