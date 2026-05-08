# 调研：结果治理与输出边界 2026-05-08

本文记录本轮工具结果治理、输出校验、结果净化和投递边界参考的外部来源。

## 参考来源

- MCP Tools specification: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- OpenAI Function Calling and Structured Outputs help: https://help.openai.com/en/articles/8555517-function-calling-in-the-openai-api
- OpenAI Structured Outputs announcement: https://openai.com/index/introducing-structured-outputs-in-the-api/
- OWASP Top 10 for LLM Applications 2025: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- OWASP MCP Top 10: https://owasp.org/www-project-mcp-top-10/

## 对 OpenCap 的影响

### MCP Tool Result 有结构化和非结构化两条路径

MCP tools/call result 可以包含 `content`，也可以包含 `structuredContent`；当工具声明 output schema 时，server 必须提供符合 schema 的 structured result，client 也应验证。MCP 安全建议还明确提到 server 要 sanitize tool outputs，client 要 validate tool results。

OpenCap 决策：Result Envelope 是 Runtime 稳定边界，MCP 只是投递适配器。

### Schema 有帮助，但不能替代 Runtime 边界

OpenAI Structured Outputs 和 function calling 说明 schema 能显著提升结构化参数/输出可靠性，但应用仍需要处理 JSON/schema 之外的边界和异常。OpenCap 因此把 output validation、redaction、sanitization 和 evidence 放在 Runtime，而不是交给模型。

OpenCap 决策：输出不通过 schema validation 时不得作为 success 暴露。

### Tool result 是间接 prompt injection 入口

OWASP LLM Top 10 将 prompt injection 作为核心风险；MCP Top 10 也提到 tool poisoning、context injection、over-sharing 等风险。对 OpenCap 来说，外部 API 返回文本如果直接进入模型上下文，会形成 result poisoning。

OpenCap 决策：provider raw text 不直接进入 MCP `content[].text`，先生成 Runtime summary。

## 新增文档

- `docs/design/result-envelope-v1.md`
- `docs/quality/output-validation-v1.md`
- `docs/security/tool-result-sanitization-v1.md`
- `docs/quality/result-provenance-v1.md`
- `docs/ecosystem/result-delivery-boundary.md`

## 后续问题

- output selector 是否进入 V1 schema。
- Result Envelope 是否作为 package public export。
- MCP Host 对 structuredContent 的真实兼容性。
- 大结果是否落地本地 state，并通过 handle 引用。
