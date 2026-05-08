# Policy Simulation and Diff V1：策略模拟与差异评估

本文定义 OpenCap 如何在策略变更生效前评估它会放开或收紧哪些调用。

## 背景

AI Runtime 的危险变更往往不是新代码，而是策略从 ask/deny 变成 allow。尤其是 write、external_send、destructive、financial、secret_access、data egress 相关规则，必须在生效前知道影响范围。

## Simulation Inputs

V1 可以使用固定 fixture 和本地 installed capabilities：

```ts
type PolicySimulationInputV1 = {
  policyBefore?: string;
  policyAfter: string;
  capabilities: string[];
  scenarios: PolicyScenarioV1[];
};
```

```ts
type PolicyScenarioV1 = {
  id: string;
  capabilityId: string;
  risk: string;
  dataClasses: string[];
  targetOrigin: string;
  expectedDecision?: string;
};
```

## Diff Categories

| Category | 含义 | 默认处理 |
| --- | --- | --- |
| `new_allow` | 原 ask/deny，现在 allow | warning 或 block broad allow |
| `new_deny` | 原 allow/ask，现在 deny | info/warning |
| `ask_to_allow` | 人类确认被移除 | high warning |
| `deny_to_ask` | 阻断变成人类确认 | warning |
| `data_egress_relaxed` | 敏感数据外发被放开 | high warning/block |
| `financial_relaxed` | 金融操作变宽 | block unless explicit override |

## Broad Allow 检测

Broad allow 示例：

```yaml
rules:
  - match:
      risk: write
    decision: allow
```

高风险 broad allow：

- risk 为 `write`、`external_send`、`destructive`、`financial`。
- data class 为 `secret_like`、`pii`、`source_code`、`financial_data`、`health_data`。
- target origin 为 wildcard 或未限定。
- lifecycle/trust/advisory 未限定。

## Simulation Report

```json
{
  "ok": false,
  "findings": [
    {
      "severity": "error",
      "code": "POLSIM001",
      "message": "new allow for external_send with pii data",
      "scenario_id": "slack.send_message.pii"
    }
  ]
}
```

## 测试要求

- ask -> allow 产生 diff finding。
- deny -> allow 对 destructive 产生 error。
- data_egress secret_like allow 产生 error。
- unchanged policy 产生 empty diff。
- simulation report 不含 input 原文。

## 关联任务

- T253：policy simulation/diff。
- T254：broad allow safety checks。
- T260：policy conformance tests。
