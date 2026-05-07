# 生态调研

日期：2026-05-07

本文记录影响 OpenCap V1 的外部标准、产品和设计信号。

## 调研问题

如果 OpenCap 要成为开源基础设施，而不是另一个 Agent、市场或聊天 UI，它应该处在 AI 原生生态的哪一层？

## 调研来源

- OpenAI Apps SDK: https://developers.openai.com/apps-sdk
- OpenAI Apps SDK MCP server concept: https://developers.openai.com/apps-sdk/concepts/mcp-server
- OpenAI Apps SDK security and privacy: https://developers.openai.com/apps-sdk/guides/security-privacy
- OpenAI Agents SDK: https://platform.openai.com/docs/guides/agents-sdk/
- OpenAI Agent Builder / AgentKit: https://platform.openai.com/docs/guides/agent-builder
- MCP server primitives: https://modelcontextprotocol.io/specification/2025-11-25/server/index
- MCP official registry: https://modelcontextprotocol.io/registry/about
- MCP elicitation: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
- MCP authorization: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- MCP security best practices: https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
- A2A official specification: https://a2a-protocol.org/dev/specification/
- Google A2A announcement: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- Open Policy Agent: https://www.openpolicyagent.org/docs/latest
- OpenTelemetry semantic conventions: https://opentelemetry.io/docs/specs/semconv/

## 核心发现

### MCP 是工具和上下文协议

MCP 定义了 Host 和模型使用的服务端原语：

- Prompts 由用户控制
- Resources 由应用控制
- Tools 由模型控制

OpenCap 的 Capability 主要对应 tool-like actions，未来可以扩展资源和提示元数据。

### 官方 MCP Registry 是元数据层，不是 Runtime 治理层

官方 MCP Registry 是公开 MCP Server 的元数据仓库，重点是发现、命名空间、安装元数据和 server 配置。

这说明 OpenCap 不应该做简单目录，而应该补 runtime governance：

- 安装选中的 Capability
- 应用本地策略
- 管理密钥
- 执行或代理调用
- 记录审计日志
- 暴露稳定 Host-facing gateway

### Apps SDK 证明 MCP 正在成为 App 基底

OpenAI Apps SDK 用 MCP 同步 server、model 和 UI。一个最小 app server 会列出 tools、处理 tool calls，并返回结构化内容或组件。

OpenCap 不应该和 Apps SDK 竞争，而应该治理 app 或 agent host 可以调用的 tool surface。

### 安全是产品表面，不是实现细节

OpenAI Apps SDK 文档强调最小权限、显式用户同意、服务端校验、审计日志、脱敏，以及不可逆操作的人类确认。

MCP 授权也带来约束：

- STDIO transport 应从环境读取凭据
- HTTP transport 应遵循 MCP authorization
- token 必须 audience-bound 并被校验
- 禁止 token passthrough
- OAuth flow 应使用 PKCE 和 metadata discovery

OpenCap V1 不应该假装解决全部 auth 模式。它应从本地 env-based credentials 开始，并单独记录未来 HTTP authorization 设计。

### A2A 是互补协议，不是竞争对象

A2A 解决独立 Agent 之间的通信、任务生命周期、artifact、streaming 和安全协作。

OpenCap 应定位在 A2A 之下或旁边：

```text
A2A: agent-to-agent collaboration
MCP: host-to-tool/resource protocol
OpenCap: capability runtime, permission, install, audit, verification
```

### 策略和遥测应复用成熟心智模型

Open Policy Agent 将策略决策和策略执行分离。OpenCap V1 不引入 Rego，但应借鉴架构：

```text
Policy Enforcement Point: runtime executor
Policy Decision Point: policy engine
Input: host, capability, permissions, arguments, user, environment
Decision: allow, ask, deny
```

OpenTelemetry 提供 traces、logs、metrics 和生成式 AI 操作的共享语言。OpenCap V1 先使用简单本地日志 schema，但字段命名应便于未来导出到 OTel。

## 战略结论

OpenCap 应该是：

```text
Capability Manifest + Local Runtime + Policy Engine + Audit Log + Registry Toolchain
```

OpenCap 不应该是：

```text
MCP server directory
Agent marketplace
Chat UI
Agent builder
Centralized API marketplace
Hosted-only automation platform
```

## V1 设计方向

V1 优先验证一个可信本地闭环：

```text
manifest.yml
  -> opencap validate
  -> opencap install
  -> opencap serve --mcp
  -> host calls github_create_issue
  -> runtime checks policy
  -> runtime asks or blocks
  -> runtime executes HTTP call
  -> runtime writes invocation log
```

架构应为后续留下空间：

- MCP registry compatibility
- A2A agent capability cards
- OpenAPI adapter
- OPA/Rego-style policy
- OpenTelemetry export
