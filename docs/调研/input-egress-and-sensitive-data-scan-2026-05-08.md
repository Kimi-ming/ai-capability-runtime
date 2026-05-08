# 调研：输入外发与敏感数据治理 2026-05-08

本文记录本轮输入数据治理、外发策略、分类和数据最小化参考的外部来源。

## 参考来源

- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- OWASP MCP Top 10: https://owasp.org/www-project-mcp-top-10/
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- OpenAI Apps SDK Security and Privacy: https://developers.openai.com/apps-sdk/教程/security-privacy
- OpenAI Function Calling help: https://help.openai.com/en/articles/8555517-function-calling-in-the-openai-api

## 对 OpenCap 的影响

### Sensitive data disclosure 不只发生在日志里

OWASP LLM 风险把敏感信息泄露作为核心风险。OpenCap 已经设计了 audit redaction 和 secret resolver，但还需要治理“tool input 被发送到外部 provider”这个外发路径。

OpenCap 决策：Input classification 和 Data Egress Gate 进入 Runtime 主路径。

### MCP 生态需要防止 over-sharing 和 token 问题

OWASP MCP Top 10 提到 token passthrough、over-privileged tools、over-sharing 和 context leakage 等风险。OpenCap 已经禁止 token passthrough，但普通 input 仍可能包含敏感上下文。

OpenCap 决策：tool input 在 schema validation 后仍必须分类、最小化和外发审查。

### Data minimization 是隐私和安全共同要求

NIST AI RMF 和 OpenAI Apps SDK 安全隐私指南都强调数据治理、最小化、透明和控制。OpenCap 的 local-first Runtime 应默认在本地完成分类和确认，不把 input 上传给云端分类器。

OpenCap 决策：数据最小化和确认摘要由 Runtime 生成，不交给模型自由表述。

## 新增文档

- `docs/安全/input-data-governance-v1.md`
- `docs/安全/data-classification-v1.md`
- `docs/设计/data-egress-policy-v1.md`
- `docs/质量/input-provenance-v1.md`
- `docs/安全/data-minimization-and-redaction-v1.md`

## 后续问题

- manifest 是否加入 `x-opencap-data-class` schema hint。
- 组织级 data policy 是否进入 v0.2。
- 是否提供可插拔 DLP provider profile。
- dry-run egress preview 是否成为 V1 CLI 必选输出。
