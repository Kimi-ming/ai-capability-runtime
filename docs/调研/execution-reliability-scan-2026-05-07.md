# 调研：执行可靠性与副作用安全 2026-05-07

本文记录本轮执行语义、幂等、重试和失败恢复体系补充参考的外部来源。

## 参考来源

- RFC 9110 HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110
- IETF Idempotency-Key draft: https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
- Stripe Idempotent Requests: https://docs.stripe.com/api/idempotent_requests
- Google Cloud Storage Retry Strategy: https://cloud.google.com/storage/docs/retry-strategy
- OpenTelemetry HTTP semantic conventions: https://opentelemetry.io/docs/specs/semconv/http/http-spans/

## 对 OpenCap 的影响

### HTTP method 只能提供默认线索

HTTP 规范区分 safe 和 idempotent methods，但实际业务操作是否安全仍取决于 provider endpoint。OpenCap 不能只靠 GET/POST 判断风险。

OpenCap 决策：manifest permissions 和 execution semantics 必须共同决定 retry 和 outcome。

### 幂等键是写操作容错的关键，但不是通用能力

IETF Idempotency-Key 仍是草案；Stripe 等 provider 已有成熟实践。OpenCap 应支持 provider_key 模式，但不能默认所有 API 都支持。

OpenCap 决策：V1 不自动 retry 写操作；后续通过 RFC 引入 idempotency manifest fields。

### Retry 必须同时看错误类型和幂等性

Google Cloud retry 文档强调，retry 是否安全取决于响应和请求幂等性。无条件 retry 非幂等操作会造成重复副作用。

OpenCap 决策：V1 只记录 retry recommendation，不对写操作自动 retry。

### 可观测性需要表达 retry/resend

OpenTelemetry HTTP semantic conventions 包含 request resend count 等概念。OpenCap 的本地 audit log 可以先记录 retryAttempt，为后续 OTel 映射做准备。

## 新增文档

- `docs/设计/execution-semantics-v1.md`
- `docs/设计/retry-and-idempotency-v1.md`
- `docs/运营/failure-recovery-runbook.md`
- `docs/质量/execution-evidence-v1.md`

## 后续问题

- 是否在 manifest schema 中加入 `execution.effects`。
- 是否支持 provider-specific idempotency key。
- 是否实现 duplicate invocation detector。
- 是否支持 reconcile capability hint。
