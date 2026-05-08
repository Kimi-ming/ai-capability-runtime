# 调研：Usage、Commerce 与 Abuse Control 2026-05-08

本文记录本轮用量计量、配额预算、限流和商业边界参考的外部来源。

## 参考来源

- Stripe usage-based billing / meters: https://docs.stripe.com/billing/subscriptions/usage-based
- OpenAI Agentic Commerce Protocol: https://developers.openai.com/commerce
- Google Agent Payments Protocol AP2: https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol
- IETF RateLimit header fields draft: https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
- RFC 9457 Problem Details for HTTP APIs: https://www.rfc-editor.org/rfc/rfc9457.html

## 对 OpenCap 的影响

### Usage metering 和 billing 不能混为一谈

Stripe 的 usage-based billing 使用 meter events 和计费周期，但 OpenCap V1 的本地 usage event 只用于可观测、限额和未来导出。它不是 invoice line item。

OpenCap 决策：usage event 不是 billing record。

### Agentic commerce 需要独立交易协议和授权

OpenAI ACP 和 Google AP2 都说明 agentic commerce 不是简单 API 调用，它涉及用户授权、商家、支付和交易证据。OpenCap 未来可以接 commerce profile，但不能把支付混进 V1 capability execution。

OpenCap 决策：paid capability/commerce profile 走 future RFC。

### Rate limit 应有标准化错误语义

RateLimit headers 草案和 Problem Details 提供了表达限流和错误详情的方向。OpenCap 可以先把 quota/rate limit 错误标准化，为 CLI/API/MCP 输出做准备。

OpenCap 决策：quota/budget/rate limit 是执行前 gate，并进入 audit/usage evidence。

## 新增文档

- `docs/operations/usage-metering-v1.md`
- `docs/design/quota-and-budget-policy-v1.md`
- `docs/security/rate-limit-and-abuse-control-v1.md`
- `docs/ecosystem/paid-capability-and-commerce-boundary.md`
- `docs/quality/usage-evidence-v1.md`

## 后续问题

- Usage event 是否进入 SQLite 独立表。
- Quota policy 是否和 Policy DSL 合并。
- Financial capability 是否进入 V1 schema 测试。
- Paid capability manifest 是否必须等待 commerce profile。
