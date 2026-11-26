export interface U8DbToolDef {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

export interface U8DbDepartment {
  code: string;
  name: string;
}

export interface U8DbMeta {
  email: string;
  nickname: string;
  dept: string;
  is_admin: boolean;
  mcp: {
    url: string;
    suggested_name: string;
    server_type: string;
    exposed_connections: number;
    tools: U8DbToolDef[];
  };
  default_whitelist: string[];
  departments: U8DbDepartment[];
}

export interface U8DbConnection {
  id: string;
  name: string;
  description: string;
  host: string;
  port: number;
  instance_name: string;
  database_name: string;
  username: string;
  has_password: boolean;
  encrypt: boolean;
  trust_cert: boolean;
  readonly_intent: boolean;
  read_uncommitted: boolean;
  max_rows: number;
  query_timeout: number;
  whitelist_enabled: boolean;
  allowed_objects: string[];
  allowed_depts: string[];
  enabled: boolean;
  mcp_exposed: boolean;
  last_test_status: 'ok' | 'error' | 'untested';
  last_test_message: string;
  last_test_at: number;
  created_by: string;
  created_at: number;
  updated_at: number;
}

export interface U8DbConnectionDraft {
  id?: string;
  name: string;
  description: string;
  host: string;
  port: number;
  instance_name: string;
  database_name: string;
  username: string;
  password: string;
  encrypt: boolean;
  trust_cert: boolean;
  readonly_intent: boolean;
  read_uncommitted: boolean;
  max_rows: number;
  query_timeout: number;
  whitelist_enabled: boolean;
  allowed_objects: string[];
  allowed_depts: string[];
  enabled: boolean;
  mcp_exposed: boolean;
}

export interface U8DbTestResult {
  ok: boolean;
  latency_ms: number;
  server_version: string;
  database_name: string;
  current_user: string;
  message: string;
}

export interface U8DbTableInfo {
  schema: string;
  name: string;
  qualified_name: string;
  type: 'TABLE' | 'VIEW' | string;
  description: string;
}

export interface U8DbColumnInfo {
  name: string;
  data_type: string;
  max_length: number | null;
  nullable: boolean;
  description: string;
}

export interface U8DbQueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
  truncated: boolean;
  max_rows: number;
  duration_ms: number;
  referenced_objects: string[];
}

export interface U8DbTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  sql_text: string;
  is_builtin: boolean;
  created_by: string;
  updated_at: number;
}

export interface U8DbAuditLog {
  id: number;
  actor_email: string;
  actor_name: string;
  source: 'ui' | 'mcp' | string;
  connection_id: string;
  connection_name: string;
  sql_text: string;
  status: 'ok' | 'blocked' | 'error' | string;
  row_count: number;
  duration_ms: number;
  error_message: string;
  created_at: number;
}
