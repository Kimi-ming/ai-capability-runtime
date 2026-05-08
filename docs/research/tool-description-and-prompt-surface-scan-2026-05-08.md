# 调研：工具描述、提示面与工具投毒 2026-05-08

本文记录本轮模型可见工具元数据、prompt surface 和能力发现边界参考的外部来源。

## 参考来源

- MCP Tools specification: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- OWASP MCP Top 10: https://owasp.org/www-project-mcp-top-10/
- OpenAI Function Calling help: https://help.openai.com/en/articles/8555517-function-calling-in-the-openai-api

## 对 OpenCap 的影响

### MCP tools/list 是模型可见执行面

MCP tools 设计为 model-controlled。Tool definition 包含 name、title、description、inputSchema、outputSchema 和 annotations，MCP 规范也强调 tool input validation、access controls、rate limit、output sanitization、user confirmation 和 audit。

OpenCap 决策：MCP tool projection 必须由 Runtime 生成，不能把第三方描述原样作为安全边界。

### Prompt injection 不只来自用户 prompt

OWASP LLM Top 10 把 prompt injection 作为核心风险。对 OpenCap 来说，manifest description、schema description 和 tool result 都可能成为间接 prompt injection 载体。

OpenCap 决策：model-visible metadata 是 security surface。

### MCP 生态出现 Tool Poisoning 风险词汇

OWASP MCP Top 10 仍处于早期/社区治理阶段，但它明确提出 token mismanagement、tool poisoning、context injection、lack of audit 等风险。OpenCap 已覆盖 token/audit/permission，现在需要补齐 tool metadata 和 prompt surface 治理。

OpenCap 决策：工具发现和选择证据不能授权执行。

### Structured tool schemas 有价值但不是完整安全边界

OpenAI function calling/Structured Outputs 说明 schema 可以约束工具调用参数，但应用仍需要检测和处理边界情况。OpenCap 应继续坚持 deterministic validation、policy 和 audit，而不是信任模型生成的参数。

## 新增文档

- `docs/design/tool-projection-v1.md`
- `docs/security/prompt-surface-security-v1.md`
- `docs/ecosystem/discovery-and-selection-boundary.md`
- `docs/quality/model-visible-metadata-lint-v1.md`

## 后续问题

- tool projection hash 是否进入 audit log V1 schema。
- model-visible metadata lint 是否属于 `opencap validate` 默认行为。
- Host 是否能返回 selection reason，及其隐私边界。
- output sanitizer 是 V1 必选还是 conformance 增强。
