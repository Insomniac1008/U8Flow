import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLoading } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import message from '@/components/ui/message';
import { Segmented } from '@/components/ui/segmented';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ClipboardList,
  Database,
  Edit3,
  Play,
  Plug,
  PlugZap,
  Plus,
  ShieldCheck,
  Terminal,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { ProfileSettingWrapperCard } from '../components/user-setting-header';
import { u8DbApi } from './api';
import { AuditPanel } from './audit-panel';
import { ConnectionModal } from './connection-modal';
import { McpPanel } from './mcp-panel';
import { QueryWorkbench } from './query-workbench';
import type { U8DbConnection } from './types';

type ActiveTab = 'connections' | 'workbench' | 'mcp' | 'audit';

export default function U8DatabasePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('connections');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConn, setEditingConn] = useState<U8DbConnection | null>(null);
  const [selectedConnId, setSelectedConnId] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [auditFilters, setAuditFilters] = useState<{
    source?: string;
    status?: string;
  }>({});

  const {
    data: meta,
    isLoading: metaLoading,
    error: metaError,
  } = useQuery({
    queryKey: ['u8-db', 'meta'],
    queryFn: () => u8DbApi.getMeta(),
  });

  const { data: connections = [], refetch: refetchConnections } = useQuery({
    queryKey: ['u8-db', 'connections'],
    queryFn: () => u8DbApi.listConnections(),
    enabled: Boolean(meta),
  });

  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['u8-db', 'templates'],
    queryFn: () => u8DbApi.listTemplates(),
    enabled: Boolean(meta),
  });

  const {
    data: auditLogs = [],
    isFetching: auditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['u8-db', 'audit', auditFilters],
    queryFn: () => u8DbApi.listAuditLogs({ limit: 150, ...auditFilters }),
    enabled: Boolean(meta),
  });

  const isAdmin = Boolean(meta?.is_admin);

  const handleTestSaved = async (conn: U8DbConnection) => {
    setTestingId(conn.id);
    try {
      const res = await u8DbApi.testConnection(conn.id);
      if (res.ok) {
        message.success(`${conn.name} 连通正常（${res.latency_ms}ms）`);
      } else {
        message.error(res.message);
      }
      await refetchConnections();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '测试失败');
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteConn = async (conn: U8DbConnection) => {
    try {
      await u8DbApi.deleteConnection(conn.id);
      message.success(`已删除连接「${conn.name}」`);
      await refetchConnections();
      void queryClient.invalidateQueries({ queryKey: ['u8-db', 'meta'] });
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  const openCreateModal = () => {
    setEditingConn(null);
    setModalOpen(true);
  };

  const openEditModal = (conn: U8DbConnection) => {
    setEditingConn(conn);
    setModalOpen(true);
  };

  const jumpToWorkbench = (conn: U8DbConnection) => {
    setSelectedConnId(conn.id);
    setActiveTab('workbench');
  };

  return (
    <ProfileSettingWrapperCard
      header={
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-medium text-text-primary flex items-center gap-2.5">
              <Database className="size-6 text-accent-primary" />
              用友 U8 数据库
              <Badge
                variant="secondary"
                className="text-xs font-normal gap-1 align-middle"
              >
                <ShieldCheck className="size-3.5 text-state-success" />
                强制只读 SELECT
              </Badge>
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              连接用友 U8 SQL Server 账套库，支持白名单管控、在线只读试查与
              AI（MCP）自然语言实时查数
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab('mcp')}
            >
              <Plug className="size-4" />
              AI / MCP 对接
            </Button>
            {isAdmin && (
              <Button type="button" onClick={openCreateModal}>
                <Plus className="size-4" />
                新建 U8 连接
              </Button>
            )}
          </div>
        </header>
      }
    >
      <div className="h-full p-5 overflow-x-hidden overflow-y-auto scrollbar-auto space-y-5">
        {metaLoading ? (
          <div className="py-16 text-center text-sm text-text-secondary">
            正在加载 U8 数据库集成服务...
          </div>
        ) : metaError || !meta ? (
          <div className="rounded-2xl border border-state-error/30 bg-state-error/10 p-6 text-sm text-state-error space-y-1.5">
            <div className="font-medium">
              无法连接 U8 数据库查询服务（u8-db）
            </div>
            <div className="text-xs opacity-90">
              {metaError instanceof Error
                ? metaError.message
                : '请确认 Docker 中的 u8-db 容器已启动且 Nginx /u8-db-api/ 代理已生效。'}
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Segmented Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented
                rounded="xl"
                value={activeTab}
                onChange={(val) => {
                  const next = val as ActiveTab;
                  setActiveTab(next);
                  if (next === 'audit') {
                    void refetchAudit();
                  }
                }}
                options={[
                  {
                    value: 'connections',
                    label: (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Database className="size-4" />
                        账套连接 ({connections.length})
                      </span>
                    ),
                  },
                  {
                    value: 'workbench',
                    label: (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Terminal className="size-4" />
                        在线只读试查
                      </span>
                    ),
                  },
                  {
                    value: 'mcp',
                    label: (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Plug className="size-4" />
                        AI / MCP 对接
                      </span>
                    ),
                  },
                  {
                    value: 'audit',
                    label: (
                      <span className="flex items-center gap-1.5 text-sm">
                        <ClipboardList className="size-4" />
                        查询审计日志
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            {/* Tab 1: Connections */}
            {activeTab === 'connections' && (
              <div className="space-y-5">
                {connections.length === 0 ? (
                  <Card className="border-border-button bg-bg-card/60">
                    <CardContent className="p-8 space-y-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-medium text-text-primary">
                            尚未配置用友 U8 账套连接
                          </h3>
                          <p className="text-sm text-text-secondary">
                            支持 SQL Server 2008 R2 / 2012 / 2014 / 2016 / 2019
                            / 2022。配置后即可在此在线只读查数，并一键接入「集成
                            → MCP」供大模型对话实时查询。
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            type="button"
                            className="shrink-0"
                            onClick={openCreateModal}
                          >
                            <Plus className="size-4" />
                            立即配置第一个 U8 连接
                          </Button>
                        )}
                      </div>

                      <div className="rounded-xl border border-border-button/80 bg-bg-input/60 p-4 space-y-2 text-xs text-text-secondary">
                        <div className="font-medium text-text-primary">
                          推荐：在 U8 SQL Server 中创建专用只读账号（示例
                          T-SQL）
                        </div>
                        <pre className="font-mono text-[11px] leading-relaxed overflow-x-auto text-text-primary/90">
                          {`-- 1. 创建只读登录名（建议仅授予 db_datareader 或指定业务视图 SELECT 权限）
CREATE LOGIN u8_ai_readonly WITH PASSWORD = 'StrongPassword#2026', CHECK_POLICY = OFF;
USE UFDATA_001_2026;
CREATE USER u8_ai_readonly FOR LOGIN u8_ai_readonly;
ALTER ROLE db_datareader ADD MEMBER u8_ai_readonly;`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {connections.map((conn) => (
                      <Card
                        key={conn.id}
                        className="border-border-button bg-bg-card/70 hover:border-accent-primary/40 transition-colors"
                      >
                        <CardContent className="p-5 space-y-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-text-primary truncate">
                                  {conn.name}
                                </h3>
                                {!conn.enabled && (
                                  <Badge variant="secondary">已停用</Badge>
                                )}
                                {conn.last_test_status === 'ok' ? (
                                  <Badge className="bg-state-success/15 text-state-success border-state-success/30 gap-1 text-[11px]">
                                    <CheckCircle2 className="size-3" />
                                    已连通
                                  </Badge>
                                ) : conn.last_test_status === 'error' ? (
                                  <Badge className="bg-state-error/15 text-state-error border-state-error/30 gap-1 text-[11px]">
                                    <XCircle className="size-3" />
                                    连接异常
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-[11px]"
                                  >
                                    未测试
                                  </Badge>
                                )}
                              </div>
                              {conn.description && (
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                  {conn.description}
                                </p>
                              )}
                            </div>

                            {conn.mcp_exposed && conn.enabled && (
                              <Badge className="bg-accent-primary/15 text-accent-primary border-accent-primary/30 text-[11px] shrink-0">
                                MCP 已开放
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs rounded-xl bg-bg-input/60 border border-border-button/60 p-3">
                            <div>
                              <span className="text-text-secondary">
                                服务器：
                              </span>
                              <span className="font-mono text-text-primary">
                                {conn.host}
                                {conn.instance_name
                                  ? `\\${conn.instance_name}`
                                  : `:${conn.port}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">
                                账套库：
                              </span>
                              <span className="font-mono text-text-primary">
                                {conn.database_name}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">
                                安全管控：
                              </span>
                              <span className="text-text-primary">
                                {conn.whitelist_enabled
                                  ? `白名单 ${conn.allowed_objects.length} 表`
                                  : '全库只读'}
                                {conn.read_uncommitted ? ' · 防锁表' : ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">
                                权限范围：
                              </span>
                              <span className="text-text-primary">
                                {conn.allowed_depts.length === 0
                                  ? '全员可查'
                                  : `${conn.allowed_depts.length} 个部门`}
                              </span>
                            </div>
                          </div>

                          {conn.last_test_message && (
                            <div
                              className="text-[11px] text-text-secondary truncate"
                              title={conn.last_test_message}
                            >
                              最近检测：{conn.last_test_message}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => jumpToWorkbench(conn)}
                                disabled={!conn.enabled}
                              >
                                <Play className="size-3.5" />
                                在线试查
                              </Button>
                              <ButtonLoading
                                type="button"
                                size="sm"
                                variant="outline"
                                loading={testingId === conn.id}
                                onClick={() => void handleTestSaved(conn)}
                              >
                                <PlugZap className="size-3.5" />
                                测试连接
                              </ButtonLoading>
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditModal(conn)}
                                >
                                  <Edit3 className="size-3.5" />
                                  编辑
                                </Button>
                                <ConfirmDeleteDialog
                                  title={`确认删除连接「${conn.name}」？`}
                                  onOk={async () => {
                                    await handleDeleteConn(conn);
                                  }}
                                >
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    className="text-text-secondary hover:text-state-error hover:bg-state-error-5"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </ConfirmDeleteDialog>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: SQL Workbench */}
            {activeTab === 'workbench' && (
              <QueryWorkbench
                connections={connections.filter((c) => c.enabled)}
                selectedConnId={selectedConnId}
                onSelectConn={setSelectedConnId}
                templates={templates}
                isAdmin={isAdmin}
                onTemplatesChanged={() => void refetchTemplates()}
                onQueryExecuted={() => void refetchAudit()}
              />
            )}

            {/* Tab 3: MCP Integration */}
            {activeTab === 'mcp' && <McpPanel meta={meta} />}

            {/* Tab 4: Audit Logs */}
            {activeTab === 'audit' && (
              <AuditPanel
                logs={auditLogs}
                loading={auditLoading}
                isAdmin={isAdmin}
                onRefresh={(next) => {
                  setAuditFilters(next);
                  void refetchAudit();
                }}
              />
            )}
          </>
        )}
      </div>

      {modalOpen && meta && (
        <ConnectionModal
          key={editingConn?.id || 'new'}
          open={modalOpen}
          editing={editingConn}
          defaultWhitelist={meta.default_whitelist}
          departments={meta.departments}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            void refetchConnections();
            void queryClient.invalidateQueries({ queryKey: ['u8-db', 'meta'] });
          }}
        />
      )}
    </ProfileSettingWrapperCard>
  );
}
