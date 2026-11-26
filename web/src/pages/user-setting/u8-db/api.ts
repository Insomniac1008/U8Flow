import { getAuthorization } from '@/utils/authorization-util';
import type {
  U8DbAuditLog,
  U8DbColumnInfo,
  U8DbConnection,
  U8DbConnectionDraft,
  U8DbMeta,
  U8DbQueryResult,
  U8DbTableInfo,
  U8DbTemplate,
  U8DbTestResult,
} from './types';

const BASE = '/u8-db-api';

export class U8DbApiError extends Error {
  status: number;
  code: number;

  constructor(message: string, status: number, code: number) {
    super(message);
    this.name = 'U8DbApiError';
    this.status = status;
    this.code = code;
  }
}

async function u8DbRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const auth = getAuthorization();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (auth) {
    headers.Authorization = auth;
  }

  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await resp.text();
  let parsed: { code?: number; message?: string; data?: T } = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new U8DbApiError(
      text || `请求失败（HTTP ${resp.status}）`,
      resp.status,
      resp.status,
    );
  }

  if (!resp.ok || (typeof parsed.code === 'number' && parsed.code !== 0)) {
    throw new U8DbApiError(
      parsed.message || `请求失败（HTTP ${resp.status}）`,
      resp.status,
      parsed.code ?? resp.status,
    );
  }

  return parsed.data as T;
}

export const u8DbApi = {
  getMeta: () => u8DbRequest<U8DbMeta>('/meta'),

  listConnections: () => u8DbRequest<U8DbConnection[]>('/connections'),

  createConnection: (draft: U8DbConnectionDraft) =>
    u8DbRequest<U8DbConnection>('/connections', {
      method: 'POST',
      body: JSON.stringify(draft),
    }),

  updateConnection: (id: string, draft: Partial<U8DbConnectionDraft>) =>
    u8DbRequest<U8DbConnection>(`/connections/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(draft),
    }),

  deleteConnection: (id: string) =>
    u8DbRequest<void>(`/connections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  testConnection: (id: string) =>
    u8DbRequest<U8DbTestResult>(`/connections/${encodeURIComponent(id)}/test`, {
      method: 'POST',
    }),

  testDraftConnection: (draft: Partial<U8DbConnectionDraft>) =>
    u8DbRequest<U8DbTestResult>('/connections/test-draft', {
      method: 'POST',
      body: JSON.stringify(draft),
    }),

  listTables: (id: string, keyword = '', showAll = false) => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (showAll) params.set('all', '1');
    const qs = params.toString();
    return u8DbRequest<U8DbTableInfo[]>(
      `/connections/${encodeURIComponent(id)}/tables${qs ? `?${qs}` : ''}`,
    );
  },

  describeTable: (id: string, table: string, showAll = false) => {
    const params = new URLSearchParams({ table });
    if (showAll) params.set('all', '1');
    return u8DbRequest<U8DbColumnInfo[]>(
      `/connections/${encodeURIComponent(id)}/columns?${params.toString()}`,
    );
  },

  executeQuery: (connectionId: string, sql: string, maxRows?: number) =>
    u8DbRequest<U8DbQueryResult>('/query', {
      method: 'POST',
      body: JSON.stringify({
        connection_id: connectionId,
        sql,
        ...(maxRows ? { max_rows: maxRows } : {}),
      }),
    }),

  listTemplates: () => u8DbRequest<U8DbTemplate[]>('/templates'),

  createTemplate: (payload: {
    name: string;
    category: string;
    description: string;
    sql_text: string;
  }) =>
    u8DbRequest<U8DbTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteTemplate: (id: string) =>
    u8DbRequest<void>(`/templates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  listAuditLogs: (params?: {
    limit?: number;
    source?: string;
    status?: string;
    connection_id?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.source) sp.set('source', params.source);
    if (params?.status) sp.set('status', params.status);
    if (params?.connection_id) sp.set('connection_id', params.connection_id);
    const qs = sp.toString();
    return u8DbRequest<U8DbAuditLog[]>(`/audit-logs${qs ? `?${qs}` : ''}`);
  },
};
