# 调研：互操作与 Agentic Security 2026-05-07

本文记录本轮体系化补充参考的外部方向。用途是帮助 OpenCap 做边界判断，不把外部协议误当成产品路线。

## 参考来源

- MCP 2025-11-25 Tools specification: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- MCP 2025-11-25 Elicitation specification: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
- A2A latest specification: https://a2aproject.github.io/A2A/latest/specification/
- OpenAI Apps SDK: https://developers.openai.com/apps-sdk
- OWASP Agentic AI guidance: https://genai.owasp.org/
- Careful adoption of agentic AI services: https://www.cyber.gov.au/business-government/secure-design/artificial-intelligence/careful-adoption-of-agentic-ai-services

## 对 OpenCap 的影响

### MCP 正在从工具调用走向更完整交互

MCP 的 tools 能力仍然是 V1 最现实的 Host 接入面。Elicitation 的出现说明 Host 原生确认/补充输入会越来越重要，但不同 Host 的支持节奏不一定一致。

OpenCap 决策：V1 不依赖 elicitation。无确认通道时返回 `confirmation_required`，后续通过 RFC 设计 MCP elicitation profile。

### A2A 更适合未来跨 Agent 发现和任务协作

A2A 的 Agent Card/Task 结构说明，未来 AI 能力生态会需要更标准的发现和协作元数据。

OpenCap 决策：V1 不把 Capability 包装成 Agent。未来只考虑 adapter/profile，把 Capability 元数据映射到 A2A discovery 表面。

### Apps SDK 强化了 MCP server 作为应用背后工具层的趋势

Apps SDK 让开发者构建 ChatGPT 内应用，并以 MCP server 提供工具表面。这支持 OpenCap 的判断：不要抢 Host 入口，而要做好能力层和运行时。

OpenCap 决策：Apps SDK 是未来分发/Host profile，不是 V1 主路径依赖。

### Agentic AI 安全正在变成独立治理主题

OWASP 和政府网络安全机构都在把 agentic AI 的自主行为、工具使用、权限边界、监控和供应链作为专门风险来处理。

OpenCap 决策：即使 OpenCap 不做 Agent，也必须把 agentic risk 映射到 policy、consent、audit、outbound policy、package review 和 conformance tests。

## 新增文档

- `docs/ecosystem/interoperability-profiles.md`
- `docs/design/confirmation-and-consent-v1.md`
- `docs/design/capability-package-v1.md`
- `docs/quality/conformance-suite-v1.md`
- `docs/security/agentic-risk-mapping.md`

## 后续问题

- MCP elicitation profile 是否进入 v0.2。
- A2A adapter 是否只做 discovery，不做 remote execution。
- Conformance record 是否需要签名。
- Trust Card 是否应由 CI 自动生成。
