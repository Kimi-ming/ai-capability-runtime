# RFC 0020：Commerce Profile V1

## 状态

草案

## 元数据

| 字段 | 内容 |
| --- | --- |
| 作者 | OpenCap maintainers |
| 创建日期 | 2026-05-27 |
| 目标阶段 | V1 后续 |
| 相关任务 | T203 |
| 相关文档 | `rfcs/0019-paid-capability-manifest-v1.md`, `docs/生态/paid-capability-and-commerce-boundary.md`, `docs/运营/usage-metering-v1.md`, `docs/设计/quota-and-budget-policy-v1.md`, `docs/决策/0040-commerce-profile-is-future-boundary.md` |
| 替代或废弃 | 无 |

## 摘要

本文定义 future Commerce Profile 的协议边界。Commerce Profile 不是 V1 Runtime 主路径的一部分，也不是 paid capability manifest metadata 的替代品。它用于未来 Cloud、Marketplace 或外部 commerce adapter 表达购买授权、价格锁定、billable event 转换、结算、退款和争议证据。

OpenCap OSS V1 仍然只提供本地 policy、consent、quota/budget、audit 和 non-billing usage event。任何购买、扣费、结算、税务、发票、退款、争议或 payout 都必须留在 future commerce profile 或外部商业系统内。

## Profile 标识

```text
opencap.commerce_profile.v1
```

该 profile 表示一个 future commerce layer 可以围绕 Capability invocation 生成商业授权和交易证据。它不表示：

- Runtime 可以跳过 policy、consent 或 financial spend gate。
- Paid manifest metadata 已经完成商家验证或购买授权。
- `opencap.usage_event.v1` 可以直接成为账单记录。
- OpenCap OSS V1 会保存 payment credential、customer secret 或 checkout session secret。
- Registry trust、quality score、paid status 或 sponsored placement 可以影响安全决策。

## 目标

- 定义 future commerce profile 的 artifact 分层和最小字段。
- 明确 paid metadata、usage event、financial consent 和 commerce transaction evidence 的关系。
- 定义 billable event 转换的安全前提，防止 V1 usage event 被误当作 invoice line item。
- 规定 purchase authorization、price quote、settlement、refund 和 dispute evidence 的边界。
- 保持 OSS Runtime local-first，Cloud/Marketplace 不成为本地执行的硬依赖。

## 非目标

- 不修改当前 V1 manifest schema。
- 不实现 checkout、payment、tax、invoice、settlement、refund、dispute 或 payout。
- 不定义具体支付网络、processor SDK、connected account 或 revenue share。
- 不把 Commerce Profile 作为 Capability 执行授权来源。
- 不允许 manifest、audit、usage event 或 policy file 保存 payment credential。

## 分层模型

```text
Capability Manifest
  - static paid metadata
  - estimate-only pricing hint
  - merchant display metadata
  - billingEffect: none

OpenCap OSS Runtime
  - policy
  - explicit consent
  - financial spend gate
  - audit log
  - usage event
  - billingEffect: none

Future Commerce Profile
  - merchant identity evidence
  - price quote and price lock
  - purchase authorization receipt
  - billable event conversion
  - settlement/refund/dispute evidence

Future Cloud/Marketplace
  - billing account
  - tax and invoice
  - payout and revenue share
  - fraud controls
  - commercial discovery
```

## Artifact taxonomy

Commerce Profile 至少包含以下 future artifact。每个 artifact 都必须有独立 schema、version、subject、merchant、capability reference、created timestamp 和 evidence hash。

| Artifact | Schema | 作用 | V1 OSS 影响 |
| --- | --- | --- | --- |
| Commerce profile descriptor | `opencap.commerce_profile.v1` | 描述商家、支付 rail、支持的 Capability、条款和 adapter 边界 | 无执行影响 |
| Price quote | `opencap.commerce.price_quote.v1` | 记录价格、货币、数量、过期时间和 quote source | 不改变 budget gate |
| Purchase authorization receipt | `opencap.commerce.purchase_authorization.v1` | 记录用户对 quote/capability/merchant 的明确授权 | 不能替代 Runtime consent |
| Billable event | `opencap.commerce.billable_event.v1` | 从 usage event 和 authorization 派生未来计费候选 | 不能由 V1 usage event 单独生成 |
| Settlement evidence | `opencap.commerce.settlement_evidence.v1` | 记录 processor/merchant settlement 状态 | 不进入 OSS ledger |
| Refund/dispute evidence | `opencap.commerce.refund_dispute.v1` | 记录退款、撤销、争议和处理状态 | 不改变原始 audit log |

## Commerce profile descriptor

Descriptor 草案：

```yaml
schema: opencap.commerce_profile.v1
profile_id: cp_example
merchant:
  id: merchant_example
  display_name: Example Provider
  country: US
  identity_evidence:
    type: registry_review | signed_statement | external_processor
    reference: https://example.com/.well-known/opencap-commerce.json
payment_rail:
  type: external_processor | marketplace_account | custom_adapter
  provider: stripe
capabilities:
  - id: github.create_issue
    version: 1.0.0
    paid_manifest_profile: opencap.paid_capability.manifest.v1
terms_url: https://example.com/terms
pricing_url: https://example.com/pricing
requires_explicit_purchase_authorization: true
policyEffect: none
runtimeDependency: optional
```

Field rules:

- `schema` 必须等于 `opencap.commerce_profile.v1`。
- `profile_id` 在 commerce system 内唯一，但不能作为 Runtime trust signal。
- `merchant.identity_evidence` 是 commerce review evidence，不代表 OpenCap OSS 背书。
- `payment_rail` 只能描述 future adapter，不得包含 secret、card token、customer secret 或 checkout session secret。
- `capabilities[].paid_manifest_profile` 必须引用 `opencap.paid_capability.manifest.v1` 或 future compatible profile。
- `terms_url` 和 `pricing_url` 必须是 HTTPS URL，不得包含 token、customer id 或 query secret。
- `requires_explicit_purchase_authorization` 必须默认为 true。
- `policyEffect` 必须固定为 `none`。
- `runtimeDependency` 必须为 `optional`，旧 Runtime 可以忽略该 profile。

## Price quote

Price quote 是购买授权前的价格证据，不能直接扣费：

```yaml
schema: opencap.commerce.price_quote.v1
quote_id: quote_123
profile_id: cp_example
merchant_id: merchant_example
capability_id: github.create_issue
unit: invocation
quantity: 1
amount: "0.02"
currency: USD
tax_estimate:
  amount: "0.00"
  currency: USD
expires_at: "2026-05-27T12:00:00Z"
source: external_processor
quote_hash: sha256:...
billingEffect: none
```

Quote rules:

- `amount` 必须用 decimal string，避免 float rounding。
- `currency` 必须是 ISO 4217 code。
- `expires_at` 过期后不得用于 purchase authorization。
- `quote_hash` 只能 hash safe metadata，不包含 payment credential。
- Quote 不能替代本地 spend budget。Budget gate 仍以 local policy 为准。
- `billingEffect` 在 quote 阶段必须为 `none`。

## Purchase authorization receipt

Purchase authorization receipt 记录用户对明确 quote 的商业授权，但不能替代 Runtime consent：

```yaml
schema: opencap.commerce.purchase_authorization.v1
authorization_id: auth_123
profile_id: cp_example
quote_id: quote_123
subject: local_user
merchant_id: merchant_example
capability_id: github.create_issue
max_amount: "0.02"
currency: USD
approved_at: "2026-05-27T12:00:05Z"
expires_at: "2026-05-27T12:05:05Z"
confirmation_channel: cloud_ui | host_ui | external_checkout
user_consent_hash: sha256:...
policyEffect: none
```

Authorization rules:

- 必须绑定 `quote_id`、`merchant_id`、`capability_id`、`max_amount` 和 `currency`。
- 必须有明确 confirmation channel。
- 必须有过期时间。
- 不能授权无限金额、无限次数或隐藏 merchant。
- 不能降低 Capability `risk`，也不能绕过 `evaluateFinancialConsentSpendGate()`。
- `policyEffect` 必须固定为 `none`。Runtime policy decision 仍由本地 policy engine 产生。

## Billable event conversion

Future commerce system 只能在同时具备以下证据时生成 billable event：

- 一条 `opencap.usage_event.v1`。
- 一条未过期且匹配 capability/merchant/amount 上限的 purchase authorization receipt。
- 一条与 authorization 绑定的 price quote。
- 一条成功或可计费 outcome 的转换规则。
- 一条不会复制 input/output/secret 的 safe evidence hash。

Billable event 草案：

```yaml
schema: opencap.commerce.billable_event.v1
billable_event_id: be_123
usage_event_id: ue_123
authorization_id: auth_123
quote_id: quote_123
merchant_id: merchant_example
capability_id: github.create_issue
amount: "0.02"
currency: USD
conversion_rule: success_invocation_v1
source_usage_hash: sha256:...
billingEffect: external_profile
```

Conversion rules:

- `blocked`、`denied`、`dry_run` 和 `failed_before_request` 默认不可计费。
- `unknown_after_timeout`、`partial` 和 `failed_after_request` 必须由 profile 显式定义是否可计费，并要求 review。
- `retryAttempt > 0` 不能自动产生新的 user intent；是否计费必须绑定同一 authorization 的 quantity/rule。
- `source_usage_hash` 不能包含 raw input、raw output、full URL query、Authorization header、cookie 或 provider response。
- V1 `opencap.usage_event.v1` 固定 `billingEffect=none`；只有 future commerce profile 可以派生 `billingEffect=external_profile` 的 billable event。

## Settlement、refund 和 dispute

Settlement evidence 只记录 future commerce system 的外部状态，不修改 OpenCap 原始 audit/usage event：

```yaml
schema: opencap.commerce.settlement_evidence.v1
settlement_id: set_123
billable_event_id: be_123
processor_reference_hash: sha256:...
status: pending | settled | failed | reversed
created_at: "2026-05-27T12:01:00Z"
updated_at: "2026-05-27T12:02:00Z"
```

Refund/dispute evidence 草案：

```yaml
schema: opencap.commerce.refund_dispute.v1
case_id: case_123
billable_event_id: be_123
type: refund | dispute | cancellation
status: opened | accepted | rejected | resolved
reason_code: duplicate | failed_service | user_request | processor_error
created_at: "2026-05-27T12:03:00Z"
updated_at: "2026-05-27T12:04:00Z"
```

Rules:

- Refund/dispute 不得删除或重写原始 audit log。
- Settlement/refund/dispute evidence 不得保存 raw payment credential。
- 争议处理状态不能改变 Runtime 对原始 invocation 的 policy/audit 事实。
- Future Cloud 可以聚合这些 evidence；OSS Runtime 只需要能引用外部 evidence hash。

## Runtime 边界

Commerce Profile 不改变 Runtime pipeline：

```text
validate input
  -> policy
  -> consent
  -> quota/budget/financial gates
  -> secret resolver
  -> outbound/data egress
  -> execution
  -> audit
  -> usage event
```

Boundary rules:

- Runtime 不因存在 Commerce Profile 而自动允许执行。
- Runtime 不因 purchase authorization 而跳过 explicit consent。
- Runtime 不因 quote/paid status 而降低 financial、external_send、destructive 或 credential risk。
- Secret Resolver 不读取 payment credential。
- Audit/usage event 仍可在没有 Cloud/Marketplace 的离线环境中工作。

## Registry 和 review 边界

Registry 可以在 future index 中暴露 commerce profile link，但必须：

- 与 safety trust、quality score、lifecycle 和 advisory 分开展示。
- 默认 discovery/ranking 不把 paid status 当作安全信号。
- 阻断含 payment credential、customer secret、checkout session secret 的 profile。
- 阻断声称 OpenCap OSS 自动购买、扣费、退款、发票或 payout 的文案。
- 要求 financial action 仍独立声明 `financial` risk 和 spend gate。

## 兼容与迁移

- V1 Runtime 可以完全忽略 Commerce Profile。
- V1 usage event、audit log 和 policy schema 不需要为了 Commerce Profile 修改。
- Future Runtime/Cloud adapter 可以通过外部 evidence hash 关联 commerce artifacts。
- 旧 paid manifest metadata 仍是 display/review metadata；升级到 Commerce Profile 必须重新生成 quote 和 purchase authorization。
- Commerce Profile schema 进入实现阶段前，必须先完成 lint、conformance 和 negative tests。

## 验证计划

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
pnpm validate
git diff --check
```

Future implementation tests:

- Commerce profile cannot change Runtime policy decision。
- Purchase authorization cannot bypass financial spend gate。
- Blocked、denied、dry-run 和 failed-before-request usage events cannot become billable events by default。
- Retry usage does not create a new billable user intent unless quantity/rule explicitly allows it。
- Payment credential shaped fields fail metadata lint。
- Settlement/refund/dispute evidence cannot mutate source audit/usage event。

## 发布和运维

- Release notes 必须说明 Commerce Profile 是 future boundary，不进入 V1 OSS 主路径。
- Cloud/Marketplace 文档必须单独说明 purchase authorization、tax/invoice、settlement、refund、dispute 和 payout 责任。
- OSS docs 必须继续把 usage event 表述为 non-billing evidence。
- Security review 必须覆盖 payment credential leakage、merchant spoofing、quote tampering 和 dispute evidence integrity。

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
| 让 manifest `commerce` 字段直接完成购买 | manifest 是公开静态 metadata，不适合承载动态授权和交易证据。 |
| 把 usage event 直接转为账单行 | 缺少 quote、用户授权、商家身份、税务、退款和争议证据。 |
| 把 Cloud billing 做成本地 Runtime 依赖 | 破坏 local-first 和离线执行能力。 |
| 让 paid status 影响 policy | 混淆商业展示与安全决策。 |

## 开放问题

- Commerce Profile descriptor 是否应进入 Registry graph index，还是单独 projection。
- Merchant identity evidence 是否需要签名格式和 root of trust。
- Billable conversion rule 是否由 Cloud profile 定义，还是需要 OSS conformance schema。
- Refund/dispute evidence 是否需要与 compensation capability evidence 互相引用。

## 决策结果

评审结束后填写。
