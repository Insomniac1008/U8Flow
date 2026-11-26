import { Badge } from '@/components/ui/badge';
import { Button, ButtonLoading } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import message from '@/components/ui/message';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Database,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { u8DbApi } from './api';
import type {
  U8DbConnection,
  U8DbConnectionDraft,
  U8DbDepartment,
  U8DbTableInfo,
  U8DbTestResult,
} from './types';

interface ConnectionModalProps {
  open: boolean;
  editing: U8DbConnection | null;
  defaultWhitelist: string[];
  departments: U8DbDepartment[];
  onClose: () => void;
  onSaved: () => void;
}

function buildInitialDraft(
  editing: U8DbConnection | null,
  defaultWhitelist: string[],
): U8DbConnectionDraft {
  if (editing) {
    return {
      id: editing.id,
      name: editing.name,
      description: editing.description,
      host: editing.host,
      port: editing.port,
      instance_name: editing.instance_name,
      database_name: editing.database_name,
      username: editing.username,
      password: '',
      encrypt: editing.encrypt,
      trust_cert: editing.trust_cert,
      readonly_intent: editing.readonly_intent,
      read_uncommitted: editing.read_uncommitted,
      max_rows: editing.max_rows,
      query_timeout: editing.query_timeout,
      whitelist_enabled: editing.whitelist_enabled,
      allowed_objects: editing.allowed_objects,
      allowed_depts: editing.allowed_depts,
      enabled: editing.enabled,
      mcp_exposed: editing.mcp_exposed,
    };
  }
  return {
    name: '',
    description: '',
    host: '',
    port: 1433,
    instance_name: '',
    database_name: '',
    username: '',
    password: '',
    encrypt: false,
    trust_cert: true,
    readonly_intent: true,
    read_uncommitted: true,
    max_rows: 200,
    query_timeout: 15,
    whitelist_enabled: true,
    allowed_objects: [...defaultWhitelist],
    allowed_depts: [],
    enabled: true,
    mcp_exposed: true,
  };
}

export function ConnectionModal({
  open,
  editing,
  defaultWhitelist,
  departments,
  onClose,
  onSaved,
}: ConnectionModalProps) {
  const [draft, setDraft] = useState<U8DbConnectionDraft>(() =>
    buildInitialDraft(editing, defaultWhitelist),
  );
  const [whitelistText, setWhitelistText] = useState(() =>
    (editing ? editing.allowed_objects : defaultWhitelist).join('\n'),
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<U8DbTestResult | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveredTables, setDiscoveredTables] = useState<U8DbTableInfo[]>([]);

  const parseWhitelist = (text: string) =>
    text
      .split(/[\r\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleTest = async () => {
    if (
      !draft.host.trim() ||
      !draft.database_name.trim() ||
      !draft.username.trim()
    ) {
      message.warning('请先填写主机地址、账套库名和只读账号');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await u8DbApi.testDraftConnection({
        ...draft,
        allowed_objects: parseWhitelist(whitelistText),
      });
      setTestResult(res);
      if (res.ok) {
        message.success(`连接测试成功（${res.latency_ms}ms）`);
      } else {
        message.error(res.message);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : '测试连接失败';
      setTestResult({
        ok: false,
        latency_ms: 0,
        server_version: '',
        database_name: draft.database_name,
        current_user: draft.username,
        message: errMsg,
      });
      message.error(errMsg);
    } finally {
      setTesting(false);
    }
  };

  const handleDiscoverTables = async () => {
    if (!editing?.id) {
      message.info('请先保存连接后再从数据库自动拉取表/视图列表');
      return;
    }
    setDiscovering(true);
    try {
      const list = await u8DbApi.listTables(editing.id, '', true);
      setDiscoveredTables(list);
      if (list.length === 0) {
        message.info('未扫描到用户表或视图');
      }
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '拉取表清单失败');
    } finally {
      setDiscovering(false);
    }
  };

  const toggleObjectInWhitelist = (name: string) => {
    const current = parseWhitelist(whitelistText);
    const exists = current.some((x) => x.toLowerCase() === name.toLowerCase());
    const next = exists
      ? current.filter((x) => x.toLowerCase() !== name.toLowerCase())
      : [...current, name];
    setWhitelistText(next.join('\n'));
  };

  const toggleDept = (code: string) => {
    setDraft((prev) => {
      const exists = prev.allowed_depts.includes(code);
      return {
        ...prev,
        allowed_depts: exists
          ? prev.allowed_depts.filter((c) => c !== code)
          : [...prev.allowed_depts, code],
      };
    });
  };

  const handleSave = async () => {
    if (
      !draft.name.trim() ||
      !draft.host.trim() ||
      !draft.database_name.trim() ||
      !draft.username.trim()
    ) {
      message.warning('请填写连接名称、主机地址、U8 账套库名和只读账号');
      return;
    }
    setSaving(true);
    try {
      const payload: U8DbConnectionDraft = {
        ...draft,
        allowed_objects: parseWhitelist(whitelistText),
      };
      if (editing) {
        await u8DbApi.updateConnection(editing.id, payload);
        message.success('已更新 U8 数据库连接');
      } else {
        await u8DbApi.createConnection(payload);
        message.success('已创建 U8 数据库连接');
      }
      onSaved();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const parsedCurrentWhitelist = new Set(
    parseWhitelist(whitelistText).map((s) => s.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Database className="size-5 text-accent-primary" />
            {editing ? '编辑用友 U8 数据库连接' : '新建用友 U8 数据库连接'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            连接 Microsoft SQL Server
            账套库（建议配置专用只读账号与只读视图，服务端强制仅放行单条 SELECT
            查询）
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-auto pr-1 space-y-5 py-1">
          {/* Basic & Server Info */}
          <section className="rounded-xl border border-border-button bg-bg-card/60 p-4 space-y-4">
            <h4 className="text-sm font-medium text-text-primary">
              1. SQL Server 账套连接参数
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>连接名称 *</Label>
                <Input
                  placeholder="例如：用友 U8 主账套（2026）"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>备注说明</Label>
                <Input
                  placeholder="例如：001 账套财务与库存只读库"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>SQL Server 主机 IP / 域名 *</Label>
                <Input
                  placeholder="例如：192.168.1.50 或 host.docker.internal"
                  value={draft.host}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, host: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>端口</Label>
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    value={draft.port}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        port: Number(e.target.value) || 1433,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>实例名（可选）</Label>
                  <Input
                    placeholder="默认留空"
                    value={draft.instance_name}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, instance_name: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>U8 账套数据库名 *</Label>
                <Input
                  placeholder="例如：UFDATA_001_2026"
                  value={draft.database_name}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, database_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>只读登录账号 *</Label>
                <Input
                  placeholder="例如：u8_ai_readonly"
                  autoComplete="off"
                  value={draft.username}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, username: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>
                  登录密码{' '}
                  {editing?.has_password && (
                    <span className="text-xs text-text-secondary font-normal">
                      （已加密保存，留空表示不修改原密码）
                    </span>
                  )}
                </Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    editing?.has_password
                      ? '••••••••（留空保持原密码）'
                      : '输入 SQL Server 登录密码'
                  }
                  value={draft.password}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
            </div>

            {testResult && (
              <div
                className={`rounded-xl border px-3.5 py-2.5 text-xs flex items-start gap-2 ${
                  testResult.ok
                    ? 'border-state-success/30 bg-state-success/10 text-state-success'
                    : 'border-state-error/30 bg-state-error/10 text-state-error'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="size-4 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 break-all">{testResult.message}</div>
              </div>
            )}
          </section>

          {/* Switches & Limits */}
          <section className="rounded-xl border border-border-button bg-bg-card/60 p-4 space-y-4">
            <h4 className="text-sm font-medium text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent-primary" />
              2. 安全策略与防锁表控制
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border-button/70 px-3 py-2.5">
                <div>
                  <div className="font-medium text-text-primary">
                    启用此连接
                  </div>
                  <div className="text-xs text-text-secondary">
                    关闭后无法通过在线试查或 AI 查询
                  </div>
                </div>
                <Switch
                  checked={draft.enabled}
                  onCheckedChange={(v) =>
                    setDraft((p) => ({ ...p, enabled: v }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border-button/70 px-3 py-2.5">
                <div>
                  <div className="font-medium text-text-primary">
                    开放给 AI（MCP 工具）
                  </div>
                  <div className="text-xs text-text-secondary">
                    允许对话与智能体通过只读 MCP 实时查数
                  </div>
                </div>
                <Switch
                  checked={draft.mcp_exposed}
                  onCheckedChange={(v) =>
                    setDraft((p) => ({ ...p, mcp_exposed: v }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border-button/70 px-3 py-2.5">
                <div>
                  <div className="font-medium text-text-primary">
                    防锁表隔离（READ UNCOMMITTED）
                  </div>
                  <div className="text-xs text-text-secondary">
                    强烈建议开启，避免查询阻塞 U8 开单与过账
                  </div>
                </div>
                <Switch
                  checked={draft.read_uncommitted}
                  onCheckedChange={(v) =>
                    setDraft((p) => ({ ...p, read_uncommitted: v }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border-button/70 px-3 py-2.5">
                <div>
                  <div className="font-medium text-text-primary">
                    启用 TLS 加密传输
                  </div>
                  <div className="text-xs text-text-secondary">
                    内网旧版 SQL Server 2008 R2 / 2012 请保持关闭
                  </div>
                </div>
                <Switch
                  checked={draft.encrypt}
                  onCheckedChange={(v) =>
                    setDraft((p) => ({ ...p, encrypt: v }))
                  }
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label>单次最大返回行数（1–1000）</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={draft.max_rows}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      max_rows: Number(e.target.value) || 200,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>单次查询超时（3–60 秒）</Label>
                <Input
                  type="number"
                  min={3}
                  max={60}
                  value={draft.query_timeout}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      query_timeout: Number(e.target.value) || 15,
                    }))
                  }
                />
              </div>
            </div>
          </section>

          {/* Table/View Whitelist */}
          <section className="rounded-xl border border-border-button bg-bg-card/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-medium text-text-primary">
                  3. 表与视图白名单
                </h4>
                <Switch
                  checked={draft.whitelist_enabled}
                  onCheckedChange={(v) =>
                    setDraft((p) => ({ ...p, whitelist_enabled: v }))
                  }
                />
                <span className="text-xs text-text-secondary">
                  {draft.whitelist_enabled
                    ? '已启用白名单保护'
                    : '已关闭（放行全部表）'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setWhitelistText(defaultWhitelist.join('\n'))}
                >
                  恢复 U8 默认表
                </Button>
                {editing && (
                  <ButtonLoading
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={discovering}
                    onClick={handleDiscoverTables}
                  >
                    <RefreshCw className="size-3.5" />
                    从库拉取表/视图
                  </ButtonLoading>
                )}
              </div>
            </div>

            {draft.whitelist_enabled && (
              <>
                <p className="text-xs text-text-secondary">
                  每行填写一个允许查询的表名或视图名，支持通配符（如{' '}
                  <code>v_u8_*</code> 表示放行所有自定义 U8 只读视图）。
                </p>
                <Textarea
                  rows={5}
                  className="font-mono text-xs bg-bg-input text-text-primary"
                  value={whitelistText}
                  onChange={(e) => setWhitelistText(e.target.value)}
                  placeholder="Inventory&#10;CurrentStock&#10;v_u8_*"
                />

                {discoveredTables.length > 0 && (
                  <div className="rounded-lg border border-border-button p-2.5 max-h-40 overflow-y-auto scrollbar-auto space-y-1">
                    <div className="text-xs text-text-secondary mb-1">
                      点击勾选加入/移出白名单（共扫描到{' '}
                      {discoveredTables.length} 个对象）：
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {discoveredTables.slice(0, 150).map((t) => {
                        const checked =
                          parsedCurrentWhitelist.has(t.name.toLowerCase()) ||
                          parsedCurrentWhitelist.has(
                            t.qualified_name.toLowerCase(),
                          );
                        return (
                          <button
                            key={t.qualified_name}
                            type="button"
                            onClick={() => toggleObjectInWhitelist(t.name)}
                            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                              checked
                                ? 'border-accent-primary bg-accent-primary/15 text-accent-primary'
                                : 'border-border-button bg-bg-input text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {t.type === 'VIEW' ? '[视图] ' : ''}
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Department RBAC */}
          {departments.length > 0 && (
            <section className="rounded-xl border border-border-button bg-bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-text-primary">
                  4. 部门访问授权（联动 U8 团队权限）
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {draft.allowed_depts.length === 0
                    ? '全部已登录成员可查'
                    : `仅限 ${draft.allowed_depts.length} 个部门`}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">
                不勾选任何部门时，团队内所有已登录成员均可在线只读查询此连接；勾选后仅对应部门成员与团队管理员可见可查。
              </p>
              <div className="flex flex-wrap gap-3">
                {departments.map((dept) => {
                  const checked = draft.allowed_depts.includes(dept.code);
                  return (
                    <label
                      key={dept.code}
                      className="flex items-center gap-2 text-xs cursor-pointer rounded-lg border border-border-button/80 px-2.5 py-1.5 hover:bg-bg-input"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleDept(dept.code)}
                      />
                      <span>
                        {dept.name}
                        {dept.name !== dept.code ? ` (${dept.code})` : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <DialogFooter className="border-t border-border-button/60 pt-4 flex items-center justify-between sm:justify-between">
          <ButtonLoading
            type="button"
            variant="outline"
            loading={testing}
            onClick={handleTest}
          >
            <PlugZap className="size-4" />
            测试连接
          </ButtonLoading>
          <div className="flex items-center gap-2.5">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <ButtonLoading type="button" loading={saving} onClick={handleSave}>
              保存连接
            </ButtonLoading>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
