import { Badge } from '@/components/ui/badge';
import { ButtonLoading } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { U8DbAuditLog } from './types';

interface AuditPanelProps {
  logs: U8DbAuditLog[];
  loading: boolean;
  isAdmin: boolean;
  onRefresh: (filters: { source?: string; status?: string }) => void;
}

function formatTs(ts: number): string {
  if (!ts) return '-';
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function AuditPanel({
  logs,
  loading,
  isAdmin,
  onRefresh,
}: AuditPanelProps) {
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');

  const triggerRefresh = (nextSource = source, nextStatus = status) => {
    onRefresh({
      source: nextSource || undefined,
      status: nextStatus || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="text-text-secondary">
            {isAdmin
              ? '全团队 U8 查询审计记录（最近 2000 条）'
              : '我的 U8 查询记录'}
          </span>
          <select
            className="h-8 rounded-lg border border-border-button bg-bg-input px-2.5 text-xs text-text-primary outline-none"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              triggerRefresh(e.target.value, status);
            }}
          >
            <option value="">全部来源</option>
            <option value="ui">Web 在线试查</option>
            <option value="mcp">AI MCP 调用</option>
          </select>
          <select
            className="h-8 rounded-lg border border-border-button bg-bg-input px-2.5 text-xs text-text-primary outline-none"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              triggerRefresh(source, e.target.value);
            }}
          >
            <option value="">全部状态</option>
            <option value="ok">查询成功</option>
            <option value="blocked">安全拦截</option>
            <option value="error">执行失败</option>
          </select>
        </div>

        <ButtonLoading
          type="button"
          size="sm"
          variant="outline"
          loading={loading}
          onClick={() => triggerRefresh()}
        >
          <RefreshCw className="size-3.5" />
          刷新日志
        </ButtonLoading>
      </div>

      <div className="rounded-xl border border-border-default overflow-hidden">
        <Table rootClassName="rounded-xl max-h-[55vh] overflow-auto scrollbar-auto">
          <TableHeader className="bg-bg-title">
            <TableRow className="hover:bg-bg-title">
              <TableHead className="h-11 px-3 text-xs whitespace-nowrap">
                时间
              </TableHead>
              <TableHead className="h-11 px-3 text-xs whitespace-nowrap">
                执行人
              </TableHead>
              <TableHead className="h-11 px-3 text-xs whitespace-nowrap">
                来源
              </TableHead>
              <TableHead className="h-11 px-3 text-xs whitespace-nowrap">
                账套连接
              </TableHead>
              <TableHead className="h-11 px-3 text-xs whitespace-nowrap">
                SQL 语句
              </TableHead>
              <TableHead className="h-11 px-3 text-xs whitespace-nowrap">
                结果
              </TableHead>
              <TableHead className="h-11 px-3 text-xs whitespace-nowrap">
                状态 / 说明
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-bg-base">
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-xs text-text-secondary"
                >
                  暂无 U8 数据库查询审计记录
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap tabular-nums text-text-secondary">
                    {formatTs(log.created_at)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap">
                    <div className="text-text-primary">
                      {log.actor_name || log.actor_email}
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      {log.actor_email}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap">
                    <Badge variant="secondary" className="text-[11px]">
                      {log.source === 'mcp' ? 'AI MCP' : 'Web 试查'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {log.connection_name || log.connection_id}
                  </TableCell>
                  <TableCell
                    className="px-3 py-2.5 text-xs font-mono max-w-[340px] truncate"
                    title={log.sql_text}
                  >
                    {log.sql_text}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap tabular-nums text-text-secondary">
                    {log.status === 'ok'
                      ? `${log.row_count} 行 · ${log.duration_ms}ms`
                      : '-'}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs max-w-[260px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {log.status === 'ok' ? (
                        <Badge className="bg-state-success/15 text-state-success border-state-success/30 text-[11px] whitespace-nowrap shrink-0">
                          成功
                        </Badge>
                      ) : log.status === 'blocked' ? (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px] whitespace-nowrap shrink-0">
                          已拦截
                        </Badge>
                      ) : (
                        <Badge className="bg-state-error/15 text-state-error border-state-error/30 text-[11px] whitespace-nowrap shrink-0">
                          失败
                        </Badge>
                      )}
                      {log.error_message && (
                        <span
                          className="text-[11px] text-text-secondary truncate min-w-0"
                          title={log.error_message}
                        >
                          {log.error_message}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
