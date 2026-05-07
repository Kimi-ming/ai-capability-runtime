# 协议生态补充调研

日期：2026-05-07

本文记录本轮体系化设计参考的外部协议事实。外部链接只作为设计输入，OpenCap 的最终实现以本仓库 SPEC、ARCHITECTURE 和 ADR 为准。

## 参考来源

- MCP Tools 规范：https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- MCP Authorization 规范：https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
- MCP Elicitation 规范：https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation
- MCP Security Best Practices：https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices
- OpenAI Apps SDK Help：https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk
- A2A latest specification：https://a2a-protocol.org/latest/specification/
- Linux Foundation A2A 2026 adoption note：https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year
- OpenAPI 3.1.2：https://spec.openapis.org/oas/v3.1.2.html

## 对 OpenCap 的关键影响

### MCP Tools 强化了 OpenCap 的 Host-facing 选择

MCP Tools 是模型可发现和调用的外部动作表面。OpenCap V1 把 InstalledCapability 映射成 MCP tool 是合理主路径。

设计影响：

- `input` 必须稳定映射到 MCP `inputSchema`。
- `output` 应准备映射到 MCP `outputSchema` 或 structured result。
- tool call 必须保留人类确认和审计能力。

### MCP Authorization 要求 OpenCap 避免 token passthrough

MCP Authorization 对 HTTP transport 的 token audience、resource parameter 和 Bearer token 使用有明确要求，也强调 MCP server 不应接受或转发错误 audience 的 token。

设计影响：

- V1 本地 Runtime 只用 env credential 调下游 API。
- `MCP client token -> downstream API token` 不能偷懒透传。
- remote runtime 必须重新设计 auth boundary，不能复用 V1 env 方案。

### MCP Elicitation 是确认流程的一个可选实现，不是唯一依赖

Elicitation 可以让 server 请求用户提供结构化响应，但不是所有 Host 都支持。规范还强调不得用它请求敏感信息。

设计影响：

- `ask` 可以走 elicitation。
- 不支持时返回 `confirmation_required`。
- token、password、API key 不通过 elicitation 收集。

### Apps SDK 说明 OpenCap 应保持 Host-neutral

OpenAI Apps SDK 建立在 MCP 上，目标是把应用带入 ChatGPT。OpenCap 应该为这类 MCP app 提供背后的能力治理层，而不是做 ChatGPT-only app 框架。

设计影响：

- manifest 和 runtime 不写死 OpenAI 专属字段。
- 后续可以提供 Apps SDK 示例，但不能把它作为核心依赖。

### A2A 说明 Agent 协作会成为上层协议

A2A 关注 Agent 发现、消息、任务和 artifact。OpenCap 不做 Agent-to-Agent 通信，但可以成为 Agent 调用真实能力的底层 Runtime。

设计影响：

- V1 不实现 A2A。
- 领域模型保留 `host`、`channel`、`request_id`，未来可映射 A2A task context。
- Capability Trust Card 未来可被 A2A AgentCard 引用。

### OpenAPI 是 adapter 输入，不是安全边界

OpenAPI 可以帮助生成候选 Capability，但完整 API 文档通常权限过宽、操作过多，不能直接暴露给模型。

设计影响：

- OpenAPI adapter 必须是半自动流程。
- 生成后必须经过 manifest review、risk labeling 和 policy。
- V1 不阻塞 OpenAPI adapter。

## 本轮新增体系文档

- `docs/product/strategy.md`
- `docs/product/use-cases.md`
- `docs/product/capability-lifecycle.md`
- `docs/design/domain-model.md`
- `docs/design/runtime-contracts.md`
- `docs/protocols/protocol-positioning.md`
- `docs/security/threat-model.md`
- `docs/operations/release-readiness.md`
