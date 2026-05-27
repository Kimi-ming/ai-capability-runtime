# RFC 0019：Paid Capability Manifest Metadata V1

## 状态

草案

## 元数据

| 字段 | 内容 |
| --- | --- |
| 作者 | OpenCap maintainers |
| 创建日期 | 2026-05-27 |
| 目标阶段 | V1 后续 |
| 相关任务 | T202 |
| 相关文档 | `docs/生态/paid-capability-and-commerce-boundary.md`, `docs/运营/usage-metering-v1.md`, `docs/质量/usage-evidence-v1.md`, `docs/设计/quota-and-budget-policy-v1.md` |
| 替代或废弃 | 无 |

## 摘要

本文定义 future paid capability manifest metadata。该 metadata 只描述 Capability 的商业展示、价格提示和 future commerce profile 依赖，不执行购买、扣费、结算、退款或发票流程。

OpenCap V1 仍然不做 paid capability、marketplace、billing、tax、invoice、settlement 或 payout。Usage event 仍是 non-billing evidence；paid metadata 不能把 usage event 变成账单记录。

## Profile 标识

```text
opencap.paid_capability.manifest.v1
```

该 profile 表示 manifest 可以声明 future paid capability metadata。它不表示：

- 用户已经购买或授权付费。
- Capability 可以被执行。
- Usage event 可以直接作为 invoice line item。
- Registry trust、quality score、ranking 或 paid status 可以改变 Runtime policy。
- OpenCap OSS V1 会处理信用卡、钱包、银行账户、结算或税务。

## 目标

- 定义 future `commerce` manifest metadata 的最小字段。
- 区分 paid capability metadata、financial risk 和 usage evidence。
- 固定 `policyEffect=none` 和 `billingEffect=none` 边界。
- 为 T203 Commerce Profile RFC 提供 manifest 输入。
- 防止 Registry、Host 或模型把 paid metadata 误用为授权、排名或账单依据。

## 非目标

- 不修改当前 V1 manifest schema。
- 不实现 purchase、checkout、invoice、settlement、refund、dispute 或 payout。
- 不定义 marketplace ranking、sponsored placement 或 revenue share。
- 不让 Capability manifest 存储 payment credential、customer id、card token 或 checkout session secret。
- 不把 provider financial action 自动等同于 paid capability。

## Paid vs Financial

Paid capability 和 financial capability 是不同概念：

| 概念 | 含义 | Runtime 影响 |
| --- | --- | --- |
| paid capability | 使用该 Capability 可能需要付费或商业授权 | V1 无执行影响，metadata only |
| financial capability | Capability 会支付、扣费、下单、退款或转账 | 必须触发 financial risk、explicit consent 和 spend gate |

一个 paid capability 可能只是读取付费 API，因此不一定是 `financial` risk。一个免费 capability 也可能执行付款，因此必须是 `financial` risk。

## Metadata shape

Future manifest extension 草案：

```yaml
commerce:
  profile: opencap.paid_capability.manifest.v1
  mode: free | paid | external
  pricing:
    unit: invocation | request | result | subscription | external
    amount: 0.02
    currency: USD
    estimate_only: true
  merchant:
    name: Example Provider
    id: merchant_example
    country: US
  requires_commerce_profile: true
  terms_url: https://example.com/terms
  pricing_url: https://example.com/pricing
  policyEffect: none
  billingEffect: none
```

Field rules:

- `profile` 必须等于 `opencap.paid_capability.manifest.v1`。
- `mode` 可为 `free`、`paid` 或 `external`。
- `pricing.amount` 只能作为展示或 estimate，不能作为账单来源。
- `pricing.currency` 必须是 ISO 4217 code。
- `estimate_only` 在 V1 后续必须默认为 true。
- `merchant` 是展示 metadata，不代表 OpenCap 已验证商家身份。
- `requires_commerce_profile=true` 表示需要 future T203 profile 才能执行商业授权。
- `terms_url` / `pricing_url` 必须是 HTTPS URL，不得包含 token、customer id 或 query secret。
- `policyEffect` 必须固定为 `none`。
- `billingEffect` 必须固定为 `none`。

## Manifest review rules

Registry review 必须检查：

- Paid metadata 不降低 manifest `risk`。
- Paid metadata 不覆盖 lifecycle、advisory、trust level、quality score 或 policy。
- Paid metadata 不诱导模型“优先选择付费能力”。
- README 不要求用户把 payment credential 写入 manifest/input/env。
- `financial` action 仍独立声明 financial risk、explicit consent 和 spend cap 需求。
- `external` mode 必须说明 OpenCap 不处理外部结算。

阻断条件：

- manifest 包含 card number、bank account、wallet private key、payment token 或 customer secret。
- pricing text 承诺 OpenCap OSS 会自动结算、退款或发票。
- paid status 被描述为 trust/safety signal。
- usage event 被描述为 billable event 或 invoice line item。
- paid metadata 被模型可见文本用于强制 tool choice、绕过 consent 或绕过 budget。

## Usage event 边界

`opencap.usage_event.v1` 可以被 future commerce profile 引用，但 V1 usage event 仍然：

- `billingEffect=none`。
- 不含 input/output/secret。
- 不含 payment credential。
- 不代表购买授权。
- 不代表 invoice line item。
- 不能独立驱动 payout 或 settlement。

Future billable event 必须由 T203 commerce profile 单独定义转换规则、用户授权、merchant identity 和 settlement evidence。

## Runtime 边界

Paid metadata 不改变 Runtime pipeline：

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

如果 Capability 本身是 `financial` risk，必须继续经过 `evaluateFinancialConsentSpendGate()` 等本地边界。Paid metadata 不能让 non-financial capability 获得付款权限，也不能让 financial capability 跳过 explicit consent。

## 兼容与迁移

- 当前 V1 schema 不实现 `commerce` 字段。
- Future schema 增加该字段时必须保持 optional，旧 manifest 不需要修改。
- 旧 Runtime 可以忽略该字段。
- Registry index 可以显示 paid metadata，但默认 discovery/ranking 不能把 paid status 与 safety metadata 混合。
- T203 commerce profile 必须另行定义 purchase authorization、settlement evidence、refund/dispute 和 cloud/marketplace 边界。

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

- `commerce.policyEffect` other than `none` fails schema/lint。
- `commerce.billingEffect` other than `none` fails schema/lint。
- payment credential shaped fields fail metadata lint。
- paid metadata cannot lower financial/destructive/external_send risk。
- usage event export keeps `billingEffect=none` unless future commerce profile explicitly converts it。

## 发布和运维

- Release notes 必须说明 paid metadata is display/review metadata only。
- Registry maintainers must reject paid metadata that implies OpenCap OSS performs checkout or settlement。
- Any future marketplace/cloud rollout must document OSS/Cloud split, user authorization, merchant identity and dispute/refund handling。

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
| V1 直接加入 paid manifest schema | 会把本地 Runtime 主路径拖入商业结算范围。 |
| 把 usage event 当账单记录 | 缺少用户授权、价格锁定、税务、退款和结算证据。 |
| paid status 参与 ranking/trust | 会混淆商业展示与安全信号。 |
| 在 manifest 中保存 checkout secret | 违反 secret boundary 和 Registry 公开 review 模型。 |

## 开放问题

- `pricing.unit` 是否需要更严格枚举，还是由 T203 commerce profile 扩展。
- Merchant identity 是否应绑定签名或 registry review evidence。
- Paid metadata 是否进入 Registry index，还是单独 commerce projection。
- 是否需要独立 `paid_capability` lint group。

## 决策结果

评审结束后填写。
