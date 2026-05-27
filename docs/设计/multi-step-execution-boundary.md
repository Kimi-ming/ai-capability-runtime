# 多步执行边界

本文定义未来多步执行、Saga、补偿和组合失败恢复如何与 OpenCap Runtime 交互。

## 基本判断

多步执行不是“一个大调用”。它是一串独立 invocation，每一步都有自己的权限、确认、凭据、执行证据和失败语义。

```text
composition_id: c_123
  step 1: github.create_issue
  step 2: notion.create_page
  step 3: slack.send_message
```

每一步都可能成功、失败、阻塞或未知。

## Saga 与 Compensation

分布式系统中，长事务通常不能靠强事务回滚，而要用 compensation。OpenCap 的对应原则：

- compensation 是新的 Capability invocation。
- compensation 不保证恢复原状态。
- compensation 需要独立 permissions、policy、consent、audit。
- compensation 本身也可能失败。
- compensation 步骤不一定按原步骤逆序执行。

## Composition Outcome

组合整体 outcome 不能覆盖 step outcome。

| Composition Outcome | 含义 |
| --- | --- |
| `completed` | 所有 required steps 成功 |
| `blocked` | 某一步被 policy/consent 阻止 |
| `failed` | 某一步明确失败，且无继续路径 |
| `unknown` | 某一步 timeout unknown，整体状态未知 |
| `partial` | 一些步骤成功，一些步骤未完成 |
| `compensating` | 正在执行补偿步骤 |
| `manual_review_required` | 需要人处理 |

## 组合失败规则

- 任一步 `unknown_after_timeout`，组合整体至少是 `unknown`。
- 任一步 destructive/financial/send 失败后，不自动 compensation。
- compensation capability 必须在 registry 中独立声明。
- 用户不能只确认“执行整个计划”就跳过高风险步骤确认。

## Plan Hash

未来 Host 可以传入 plan hash：

```ts
type CompositionPlan = {
  compositionId: string;
  steps: Array<{ capabilityId: string; inputHash: string }>;
  planHash: string;
};
```

OpenCap 可以把 planHash 写入 audit，证明每一步属于同一计划。但 V1 不验证计划正确性。

当前 Runtime audit event 已支持 `compositionContext`，包含 `compositionId`、`parentInvocationId`、`stepId`、`stepIndex`、`stepName`、`initiatedBy`、`planHash` 和 `policyEffect=none`。这些字段只做 evidence correlation；不能让 policy 自动 allow，不能替代 step-level consent，也不能保存 raw plan。

## Derived Input Evidence Chain

当某一步的 input 来自上一步工具结果时，新的 invocation 不能继承上一步的授权结论。Runtime evidence 必须记录：

- `inputSource=tool_derived`。
- `derivedFromInvocationId`：上游 invocation id。
- `sourceResultDigest`：上游 result 的稳定 digest。
- `inputHash`：派生后新 input 的稳定 hash。
- `transformations`：例如 `field_mapping`、`minimization`、`redaction`。

派生 input 仍然必须重新执行 input classification、field-level egress map、Data Egress Policy Gate 和 confirmation。`sourceResultDigest` 只是可追踪性证据，不是授权凭证，也不允许跳过下游 policy。

## 测试要求

- step-level deny 不执行后续 runtime step。
- unknown step 使 composition outcome unknown。
- compensation 需要新的 consent。
- planHash 只作为 evidence，不作为授权。
- compositionId 不得让 policy 自动 allow。

## 关联任务

- T175：composition context audit fields。
- T177：step-level consent tests。
- T182：compensation capability review rules。
