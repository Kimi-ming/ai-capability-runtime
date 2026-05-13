# 配额与预算策略 V1

本文定义 OpenCap 如何在执行前应用本地配额、预算和频率限制。它补充 Policy Engine，但不取代风险策略。

## 为什么需要配额和预算

AI Host 可能重复调用工具、循环调用工具，或在模型错误时触发大量外部请求。即使每次调用本身安全，也可能造成：

- API 配额耗尽。
- Provider 费用上升。
- 外部系统被刷屏。
- 审计日志膨胀。
- 用户失去控制感。

## 决策位置

Quota/Budget Gate 必须在 Secret Resolver 和 Executor 之前：

```text
validate input
  -> policy decision
  -> consent if needed
  -> quota/budget gate
  -> secret resolver
  -> executor
  -> audit/usage event
```

如果 quota/budget 阻断，不得解析 secret，不得执行 HTTP。

当前 Runtime 已提供纯 gate helper：

```ts
evaluateQuotaBudgetGate(context, policy)
evaluateFinancialConsentSpendGate(context, policy)
```

该 helper 输出统一 `GateDecision`，`stage` 固定为 `pre_secret`。V1 先覆盖 count-based quota 和本地 budget deny/ask/warn evidence，不在 helper 内读取 input/output/secret 原文，也不执行真实扣费或汇率换算。`deny` 的 gate semantics 会阻断 secret resolution 和 execution；`ask` 映射为 confirmation required；`warn` 作为 allow gate 返回，但保留 `quotaDecision=warn` evidence。

`evaluateFinancialConsentSpendGate()` 是 financial profile 的组合门禁 helper：非 financial risk 直接 allow；financial risk 必须先有 approved consent，否则返回 `FINANCIAL_CONSENT_REQUIRED` ask；approved consent 后仍会检查本地 spend budget，budget deny/ask/warn 不能被 trust level 或 quality score 绕过。该 helper 只输出 consent/spend cap evidence，不执行支付、扣费、汇率换算或 secret resolution。

## Policy 草案

```yaml
quotas:
  rules:
    - match:
        capability_id: github.create_issue
      limit:
        count: 20
        window: 1d
      decision: ask

budgets:
  rules:
    - match:
        risk: financial
      limit:
        amount: 50
        currency: USD
        window: 1d
      decision: deny
```

V1 可以先只实现 count-based quota，不实现 money budget。

## 决策类型

| Decision | 含义 |
| --- | --- |
| `allow` | 未超限 |
| `warn` | 接近阈值，继续执行但记录警告 |
| `ask` | 需要确认 |
| `deny` | 阻断执行 |

## Spend Budget

Spend budget 只有在 paid capability 或 financial capability 进入 profile 后才可执行。V1 可以定义字段，但不做真实扣费或汇率换算。

## Local-first 规则

- 本地 quota/budget 文件属于 OSS core。
- Cloud 可以同步组织级策略，但不能成为本地执行的唯一策略来源。
- 本地 policy 优先于 registry trust 和 quality score。

## 审计字段

```ts
type QuotaBudgetEvidence = {
  quotaRuleId?: string;
  quotaDecision?: 'allow' | 'warn' | 'ask' | 'deny';
  quotaWindow?: string;
  quotaRemaining?: number;
  budgetRuleId?: string;
  budgetDecision?: 'allow' | 'warn' | 'ask' | 'deny';
};
```

## 测试要求

- quota deny 不调用 Secret Resolver。
- quota ask 在无确认通道时返回 confirmation_required。
- financial risk 默认必须有 explicit consent。
- trust level/quality score 不能绕过 budget deny。
- usage event 记录 quota/budget decision。

## 关联任务

- T199：quota/budget policy gates。
- T204：financial consent/spend cap tests。
- T206：quota exceeded problem details。
