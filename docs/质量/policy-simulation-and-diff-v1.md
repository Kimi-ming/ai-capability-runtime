# 策略模拟与差异评估 V1

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

## V1 实现状态

T253 已实现最小可运行闭环：

- Runtime 导出 `simulatePolicyDiff(input)`。
- 输入支持 `policyBefore`、`policyAfter` 和 `scenarios`；`policyBefore` 缺省时使用默认 ask。
- Scenario 使用 `capabilityId`、`resource`、`action`、`risk`、`dataClasses` 和 `targetOrigin` 计算前后策略决策。
- Report finding 只包含 scenario id、capability id、risk、前后 decision、data class 和 target origin，不携带 `inputPreview` 或 input 原文。
- CLI 提供 `opencap policy simulate --before <path> --after <path> --scenarios <path> [--json]`。

当前差异类别：

| Category | V1 状态 | 说明 |
| --- | --- | --- |
| `new_allow` | 已实现 | `deny -> allow`。`destructive`/`financial` 为 error，其余为 warning。 |
| `new_deny` | 已实现 | `allow/ask -> deny`，默认为 info。 |
| `ask_to_allow` | 已实现 | 人类确认被移除，默认为 warning；高危风险为 error。 |
| `deny_to_ask` | 已实现 | 阻断变成人类确认，默认为 warning。 |
| `data_egress_relaxed` | 已实现 | 敏感 data class 从非 allow 变成 allow 时为 error。 |
| `financial_relaxed` | 已实现 | 金融风险从非 allow 变成 allow 时为 error。 |

场景文件示例：

```yaml
scenarios:
  - id: slack.send_message.pii
    capabilityId: slack.send_message
    resource: slack.message
    action: send
    risk: external_send
    dataClasses:
      - pii
    targetOrigin: https://slack.com
```

后续 T254 会继续把 broad allow 的静态安全检查接入 validator/simulation，使高风险宽泛 allow 在 activation 前成为可阻断 finding。
