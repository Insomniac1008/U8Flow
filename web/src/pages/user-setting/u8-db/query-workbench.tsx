import { Badge } from '@/components/ui/badge';
import { Button, ButtonLoading } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import message from '@/components/ui/message';
import { Segmented } from '@/components/ui/segmented';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  BookmarkPlus,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileCode2,
  Play,
  RefreshCw,
  ShieldAlert,
  Table2,
  Trash2,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { U8DbApiError, u8DbApi } from './api';
import type {
  U8DbColumnInfo,
  U8DbConnection,
  U8DbQueryResult,
  U8DbTableInfo,
  U8DbTemplate,
} from './types';

interface QueryWorkbenchProps {
  connections: U8DbConnection[];
  selectedConnId: string;
  onSelectConn: (id: string) => void;
  templates: U8DbTemplate[];
  isAdmin: boolean;
  onTemplatesChanged: () => void;
  onQueryExecuted: () => void;
}

function downloadCsv(result: U8DbQueryResult, filename: string) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    result.columns.map(esc).join(','),
    ...result.rows.map((r) => r.map(esc).join(',')),
  ];
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function QueryWorkbench({
  connections,
  selectedConnId,
  onSelectConn,
  templates,
  isAdmin,
  onTemplatesChanged,
  onQueryExecuted,
}: QueryWorkbenchProps) {
  const activeConn =
    connections.find((c) => c.id === selectedConnId) || connections[0] || null;
  const effectiveConnId = activeConn?.id || '';

  const [sidebarTab, setSidebarTab] = useState<'templates' | 'schema'>(
    'templates',
  );
  const [sql, setSql] = useState(
    templates[0]?.sql_text ||
      'SELECT TOP 50 cInvCode AS 存货编码, cInvName AS 存货名称, cInvStd AS 规格型号\nFROM Inventory WITH (NOLOCK)\nORDER BY cInvCode',
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<U8DbQueryResult | null>(null);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    blocked: boolean;
  } | null>(null);

  // Schema explorer state
  const [tableKeyword, setTableKeyword] = useState('');
  const [tables, setTables] = useState<U8DbTableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tablesLoadedFor, setTablesLoadedFor] = useState('');
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [columnsMap, setColumnsMap] = useState<
    Record<string, U8DbColumnInfo[]>
  >({});
  const [loadingCols, setLoadingCols] = useState<string | null>(null);

  // Save custom template mini-bar
  const [savingTplMode, setSavingTplMode] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState('自定义查询');

  const handleLoadTables = useCallback(
    async (connId: string, kw = tableKeyword) => {
      if (!connId) return;
      setLoadingTables(true);
      try {
        const list = await u8DbApi.listTables(connId, kw, false);
        setTables(list);
        setTablesLoadedFor(connId);
      } catch (e: unknown) {
        message.error(e instanceof Error ? e.message : '加载表清单失败');
      } finally {
        setLoadingTables(false);
      }
    },
    [tableKeyword],
  );

  const handleToggleTable = async (tbl: U8DbTableInfo) => {
    if (expandedTable === tbl.qualified_name) {
      setExpandedTable(null);
      return;
    }
    setExpandedTable(tbl.qualified_name);
    if (!effectiveConnId || columnsMap[tbl.qualified_name]) return;
    setLoadingCols(tbl.qualified_name);
    try {
      const cols = await u8DbApi.describeTable(
        effectiveConnId,
        tbl.qualified_name,
        false,
      );
      setColumnsMap((prev) => ({ ...prev, [tbl.qualified_name]: cols }));
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '读取字段失败');
    } finally {
      setLoadingCols(null);
    }
  };

  const handleRun = async () => {
    if (!effectiveConnId) {
      message.warning('请先在「账套连接」中添加至少一个 U8 数据库连接');
      return;
    }
    if (!sql.trim()) {
      message.warning('请输入只读 SELECT 查询语句');
      return;
    }
    setRunning(true);
    setErrorInfo(null);
    try {
      const res = await u8DbApi.executeQuery(effectiveConnId, sql);
      setResult(res);
      onQueryExecuted();
    } catch (e: unknown) {
      setResult(null);
      if (e instanceof U8DbApiError) {
        setErrorInfo({ message: e.message, blocked: e.status === 403 });
      } else {
        setErrorInfo({
          message: e instanceof Error ? e.message : '执行失败',
          blocked: false,
        });
      }
      onQueryExecuted();
    } finally {
      setRunning(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!tplName.trim() || !sql.trim()) {
      message.warning('请输入模板名称与 SQL');
      return;
    }
    try {
      await u8DbApi.createTemplate({
        name: tplName.trim(),
        category: tplCategory.trim() || '自定义查询',
        description: `自定义 U8 只读模板`,
        sql_text: sql.trim(),
      });
      message.success('已保存为常用查询模板');
      setTplName('');
      setSavingTplMode(false);
      onTemplatesChanged();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '保存模板失败');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await u8DbApi.deleteTemplate(id);
      message.success('已删除自定义模板');
      onTemplatesChanged();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  if (connections.length === 0) {
    return (
      <div className="rounded-2xl border border-border-button bg-bg-card/50 p-10 text-center space-y-2">
        <Database className="size-10 mx-auto text-text-secondary/60" />
        <div className="text-base font-medium text-text-primary">
          暂无可用的 U8 数据库连接
        </div>
        <p className="text-sm text-text-secondary">
          请先在「账套连接」标签页创建并测试一个 U8 SQL Server
          只读连接后再使用在线试查。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-button bg-bg-card/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-text-secondary">
            目标账套：
          </span>
          <select
            className="h-9 rounded-lg border border-border-button bg-bg-input px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
            value={effectiveConnId}
            onChange={(e) => {
              onSelectConn(e.target.value);
              setTables([]);
              setTablesLoadedFor('');
              setColumnsMap({});
              setExpandedTable(null);
            }}
          >
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.database_name})
              </option>
            ))}
          </select>
          {activeConn && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                仅 SELECT 只读
              </Badge>
              {activeConn.whitelist_enabled && (
                <Badge variant="secondary" className="text-xs">
                  白名单 {activeConn.allowed_objects.length} 项
                </Badge>
              )}
              {activeConn.read_uncommitted && (
                <Badge variant="secondary" className="text-xs">
                  防锁表 NOLOCK
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                上限 {activeConn.max_rows} 行
              </Badge>
            </div>
          )}
        </div>

        {isAdmin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSavingTplMode((v) => !v)}
          >
            <BookmarkPlus className="size-3.5" />
            存为模板
          </Button>
        )}
      </div>

      {savingTplMode && isAdmin && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent-primary/30 bg-accent-primary/5 px-4 py-2.5">
          <Input
            className="w-52 h-8 text-xs"
            placeholder="模板名称，如：本月大客户销售汇总"
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
          />
          <Input
            className="w-36 h-8 text-xs"
            placeholder="分类"
            value={tplCategory}
            onChange={(e) => setTplCategory(e.target.value)}
          />
          <Button size="sm" onClick={handleSaveTemplate}>
            保存模板
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSavingTplMode(false)}
          >
            取消
          </Button>
        </div>
      )}

      {/* Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Templates & Schema Explorer */}
        <div className="lg:col-span-4 rounded-2xl border border-border-button bg-bg-card/60 flex flex-col overflow-hidden max-h-[68vh]">
          <div className="p-3 border-b border-border-button/70">
            <Segmented
              rounded="xl"
              value={sidebarTab}
              onChange={(val) => {
                const next = val as 'templates' | 'schema';
                setSidebarTab(next);
                if (
                  next === 'schema' &&
                  effectiveConnId &&
                  tablesLoadedFor !== effectiveConnId
                ) {
                  void handleLoadTables(effectiveConnId);
                }
              }}
              options={[
                {
                  value: 'templates',
                  label: (
                    <span className="flex items-center gap-1.5 text-xs">
                      <FileCode2 className="size-3.5" />
                      U8 模板 ({templates.length})
                    </span>
                  ),
                },
                {
                  value: 'schema',
                  label: (
                    <span className="flex items-center gap-1.5 text-xs">
                      <Table2 className="size-3.5" />
                      表与视图
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {sidebarTab === 'templates' ? (
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-auto p-3 space-y-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group rounded-xl border border-border-button/80 bg-bg-base/50 p-3 hover:border-accent-primary/50 hover:bg-bg-card transition-colors cursor-pointer"
                  onClick={() => setSql(tpl.sql_text)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {tpl.name}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {tpl.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {tpl.category}
                      </Badge>
                      {isAdmin && !tpl.is_builtin && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-text-secondary hover:text-state-error"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteTemplate(tpl.id);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="p-2.5 flex items-center gap-2 border-b border-border-button/50">
                <Input
                  className="h-8 text-xs"
                  placeholder="搜索允许查询的表或视图..."
                  value={tableKeyword}
                  onChange={(e) => setTableKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleLoadTables(effectiveConnId, tableKeyword);
                    }
                  }}
                />
                <ButtonLoading
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={loadingTables}
                  onClick={() =>
                    void handleLoadTables(effectiveConnId, tableKeyword)
                  }
                >
                  <RefreshCw className="size-3.5" />
                </ButtonLoading>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-auto p-2 space-y-1">
                {tables.length === 0 ? (
                  <div className="text-xs text-text-secondary text-center py-8 px-3">
                    {loadingTables
                      ? '正在从 U8 SQL Server 拉取表结构...'
                      : '点击右上角刷新按钮从已连通的 U8 账套拉取白名单内的表与视图'}
                  </div>
                ) : (
                  tables.map((tbl) => {
                    const isOpen = expandedTable === tbl.qualified_name;
                    const cols = columnsMap[tbl.qualified_name] || [];
                    return (
                      <div
                        key={tbl.qualified_name}
                        className="rounded-lg border border-border-button/60 bg-bg-base/40"
                      >
                        <div
                          className="flex items-center justify-between gap-2 px-2.5 py-2 cursor-pointer hover:bg-bg-card/80"
                          onClick={() => void handleToggleTable(tbl)}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isOpen ? (
                              <ChevronDown className="size-3.5 shrink-0 text-text-secondary" />
                            ) : (
                              <ChevronRight className="size-3.5 shrink-0 text-text-secondary" />
                            )}
                            <span className="text-xs font-mono text-text-primary truncate">
                              {tbl.name}
                            </span>
                            {tbl.type === 'VIEW' && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1 py-0"
                              >
                                VIEW
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="auto"
                            variant="ghost"
                            className="text-[11px] px-1.5 py-0.5 text-accent-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSql(
                                `SELECT TOP 50 *\nFROM ${tbl.qualified_name} WITH (NOLOCK)`,
                              );
                            }}
                          >
                            试查
                          </Button>
                        </div>
                        {tbl.description && (
                          <div className="px-7 pb-1.5 text-[11px] text-text-secondary truncate">
                            {tbl.description}
                          </div>
                        )}
                        {isOpen && (
                          <div className="border-t border-border-button/50 px-3 py-2 space-y-1 bg-bg-input/40">
                            {loadingCols === tbl.qualified_name ? (
                              <div className="text-[11px] text-text-secondary">
                                加载字段中...
                              </div>
                            ) : cols.length === 0 ? (
                              <div className="text-[11px] text-text-secondary">
                                未获取到字段信息
                              </div>
                            ) : (
                              cols.map((col) => (
                                <div
                                  key={col.name}
                                  className="flex items-center justify-between gap-2 text-[11px]"
                                >
                                  <span className="font-mono text-text-primary truncate">
                                    {col.name}
                                  </span>
                                  <span className="text-text-secondary shrink-0">
                                    {col.data_type}
                                    {col.description
                                      ? ` · ${col.description}`
                                      : ''}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: SQL Editor & Result Grid */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-w-0">
          <div className="rounded-2xl border border-border-button bg-bg-card/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-text-primary">
                T-SQL 只读查询编辑器
                <span className="ml-2 text-xs font-normal text-text-secondary">
                  快捷键 Ctrl + Enter 执行
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSql('')}
                >
                  清空
                </Button>
                <ButtonLoading
                  type="button"
                  size="sm"
                  loading={running}
                  onClick={() => void handleRun()}
                >
                  <Play className="size-3.5" />
                  执行只读查询
                </ButtonLoading>
              </div>
            </div>

            <Textarea
              rows={7}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void handleRun();
                }
              }}
              placeholder="输入 SQL Server 只读 SELECT 查询语句，例如：SELECT TOP 50 * FROM Inventory WITH (NOLOCK)"
              className="font-mono text-xs leading-relaxed bg-bg-input text-text-primary"
            />
          </div>

          {errorInfo && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm flex items-start gap-2.5 ${
                errorInfo.blocked
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-state-error/40 bg-state-error/10 text-state-error'
              }`}
            >
              {errorInfo.blocked ? (
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 break-all">{errorInfo.message}</div>
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-border-button bg-bg-card/60 p-4 space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">
                    查询结果
                  </span>
                  <Badge variant="secondary">共 {result.row_count} 行</Badge>
                  <Badge variant="secondary">耗时 {result.duration_ms}ms</Badge>
                  {result.truncated && (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                      已达上限 {result.max_rows} 行，建议加 WHERE / TOP 条件
                    </Badge>
                  )}
                </div>
                {result.rows.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadCsv(
                        result,
                        `u8_query_${activeConn?.database_name || 'result'}.csv`,
                      )
                    }
                  >
                    <Download className="size-3.5" />
                    导出 CSV
                  </Button>
                )}
              </div>

              <div className="rounded-xl border border-border-default overflow-hidden">
                <Table rootClassName="rounded-xl max-h-[42vh] overflow-auto scrollbar-auto">
                  <TableHeader className="bg-bg-title">
                    <TableRow className="hover:bg-bg-title">
                      {result.columns.map((col, idx) => (
                        <TableHead
                          key={`${col}-${idx}`}
                          className="h-10 px-3 text-xs whitespace-nowrap"
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-bg-base">
                    {result.rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={Math.max(1, result.columns.length)}
                          className="h-20 text-center text-text-secondary text-xs"
                        >
                          查询成功，未返回任何数据行
                        </TableCell>
                      </TableRow>
                    ) : (
                      result.rows.map((row, rIdx) => (
                        <TableRow key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <TableCell
                              key={cIdx}
                              className="px-3 py-2 text-xs whitespace-nowrap max-w-[320px] truncate tabular-nums"
                              title={cell === null ? 'NULL' : String(cell)}
                            >
                              {cell === null ? (
                                <span className="text-text-secondary/50 italic">
                                  NULL
                                </span>
                              ) : (
                                String(cell)
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
