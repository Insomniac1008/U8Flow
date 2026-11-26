import { Badge } from '@/components/ui/badge';
import { Button, ButtonLoading } from '@/components/ui/button';
import message from '@/components/ui/message';
import { Routes } from '@/routes';
import mcpServerService, {
  listMcpServers,
} from '@/services/mcp-server-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ExternalLink,
  Plug,
  RefreshCw,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import type { U8DbMeta } from './types';

interface McpPanelProps {
  meta: U8DbMeta;
}

export function McpPanel({ meta }: McpPanelProps) {
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState(false);
  const [testing, setTesting] = useState(false);

  const { data: mcpList = [], refetch } = useQuery({
    queryKey: ['u8-db-mcp-status'],
    queryFn: async () => {
      const resp = await listMcpServers({ page: 1, page_size: 100 });
      return resp?.data?.data?.mcp_servers || [];
    },
  });

  const registeredServer = mcpList.find(
    (s: { url?: string; name?: string }) =>
      s.url === meta.mcp.url || s.name === meta.mcp.suggested_name,
  );

  const handleRegisterMcp = async () => {
    setRegistering(true);
    try {
      const testResp = await mcpServerService.test({
        name: meta.mcp.suggested_name,
        url: meta.mcp.url,
        server_type: meta.mcp.server_type,
        headers: {},
        variables: {},
      });
      if (testResp?.data?.code !== 0) {
        message.error(
          testResp?.data?.message ||
            '连接 U8 MCP 服务失败，请确认 u8-db 容器正常运行且已开启 ALLOW_ANY_HOST=1',
        );
        return;
      }

      const discoveredTools = testResp.data.data || [];
      const toolsMap: Record<string, unknown> = {};
      for (const tool of discoveredTools) {
        if (tool?.name) {
          toolsMap[tool.name] = tool;
        }
      }

      const createResp = await mcpServerService.create({
        name: meta.mcp.suggested_name,
        url: meta.mcp.url,
        server_type: meta.mcp.server_type,
        headers: {},
        variables: { tools: toolsMap },
      });

      if (createResp?.data?.code === 0) {
        message.success(
          `已自动接入「集成 → MCP」，共发现 ${discoveredTools.length} 个 U8 只读查询工具`,
        );
        await refetch();
        void queryClient.invalidateQueries({ queryKey: ['listMcpServer'] });
      } else {
        message.error(createResp?.data?.message || '注册 MCP 服务器失败');
      }
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '接入 MCP 失败');
    } finally {
      setRegistering(false);
    }
  };

  const handleRetestMcp = async () => {
    if (!registeredServer?.id) return;
    setTesting(true);
    try {
      const resp = await mcpServerService.test({
        mcp_id: registeredServer.id,
        name: registeredServer.name,
        url: registeredServer.url,
        server_type: registeredServer.server_type,
        headers: {},
        variables: registeredServer.variables || {},
      });
      if (resp?.data?.code === 0) {
        const count = (resp.data.data || []).length;
        message.success(`MCP 连通正常，已检测到 ${count} 个可用 U8 查询工具`);
      } else {
        message.error(resp?.data?.message || '检测失败');
      }
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '检测失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Status Banner */}
      <div className="rounded-2xl border border-border-button bg-bg-card/70 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Plug className="size-5 text-accent-primary" />
            <h3 className="text-base font-semibold text-text-primary">
              U8 只读数据库 MCP 服务（AI 自然语言实时查库）
            </h3>
            {registeredServer ? (
              <Badge className="bg-state-success/15 text-state-success border-state-success/30 gap-1">
                <CheckCircle2 className="size-3.5" />
                已接入 MCP
              </Badge>
            ) : (
              <Badge variant="secondary">尚未注册到 MCP</Badge>
            )}
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            仅在 Docker 内网监听{' '}
            <code className="px-1.5 py-0.5 rounded bg-bg-input text-text-primary">
              {meta.mcp.url}
            </code>{' '}
            （Streamable HTTP，不对外网暴露）。接入后，员工在「应用 →
            对话」或「工作室 → 智能体」挂载{' '}
            <code className="px-1.5 py-0.5 rounded bg-bg-input text-text-primary">
              {registeredServer?.name || meta.mcp.suggested_name}
            </code>{' '}
            即可用自然语言实时查询已开放的 U8 账套（当前已开放{' '}
            <strong className="text-text-primary">
              {meta.mcp.exposed_connections}
            </strong>{' '}
            个连接）。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {registeredServer ? (
            <>
              <ButtonLoading
                type="button"
                variant="outline"
                size="sm"
                loading={testing}
                onClick={() => void handleRetestMcp()}
              >
                <RefreshCw className="size-3.5" />
                检测连通性
              </ButtonLoading>
              <Button
                asLink
                to={`${Routes.Integrations}${Routes.Mcp}`}
                size="sm"
              >
                <ExternalLink className="size-3.5" />
                前往 MCP 管理
              </Button>
            </>
          ) : meta.is_admin ? (
            <ButtonLoading
              type="button"
              loading={registering}
              onClick={() => void handleRegisterMcp()}
            >
              <Sparkles className="size-4" />
              一键注册并测试到 MCP
            </ButtonLoading>
          ) : (
            <Badge variant="secondary">请联系团队管理员一键接入 MCP</Badge>
          )}
        </div>
      </div>

      {/* Tool Catalog */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary flex items-center gap-1.5">
          <Wrench className="size-4 text-accent-primary" />
          已内置的 4 个 U8 只读 MCP 工具
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {meta.mcp.tools.map((tool) => (
            <div
              key={tool.name}
              className="rounded-xl border border-border-button bg-bg-card/60 p-4 space-y-1.5"
            >
              <div className="font-mono text-sm font-medium text-accent-primary">
                {tool.name}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Examples */}
      <div className="rounded-2xl border border-border-button bg-bg-card/50 p-4 space-y-2.5">
        <div className="text-sm font-medium text-text-primary">
          在对话 / 智能体中如何提问？
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-text-secondary leading-relaxed">
          <li>
            确保上方已点击「一键注册并测试到 MCP」，且至少有一个 U8
            账套连接开启了「开放给 AI（MCP 工具）」。
          </li>
          <li>
            打开任意对话助手或智能体设置，在 <strong>MCP 工具</strong> 中勾选{' '}
            <code>{registeredServer?.name || meta.mcp.suggested_name}</code>。
          </li>
          <li>
            直接自然语言提问，例如：
            <span className="text-text-primary">
              「帮我查一下当前现存量低于 20 的存货清单」「汇总本月前 10
              大客户的销售订单金额」「查询 1122 应收账款科目最新一期期末余额」
            </span>
            。AI 会先自动查白名单表结构，再生成安全的只读 T-SQL
            查询并返回汇总结果。
          </li>
        </ol>
      </div>
    </div>
  );
}
