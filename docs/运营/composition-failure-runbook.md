# 组合失败恢复手册

本文定义未来多步能力组合失败时，维护者和用户应该如何处理。

## 恢复原则

- 先看 step outcome，不先看整体 outcome。
- 先 reconcile unknown step，再考虑 retry 或 compensation。
- 不自动补偿高风险步骤。
- 把每个补偿动作当作新的能力调用。
- 需要人工确认时宁可停止，不要继续扩大副作用。

## 场景 1：中间步骤被 policy deny

处理：

1. 停止后续自动步骤。
2. 审计记录 compositionId 和 denied step。
3. 向用户展示已经完成的步骤。
4. 由用户决定是否继续、修改 policy、或手动处理。

## 场景 2：某一步 timeout unknown

处理：

1. 标记 composition outcome 为 `unknown`。
2. 不自动执行后续依赖步骤。
3. 使用该 step 的 reconcile hint 查询外部状态。
4. 若确认已完成，再由用户决定是否继续后续步骤。
5. 若确认未完成，再由用户决定是否重试。

## 场景 3：后续 external_send 失败

例子：Issue 创建成功，但 Slack 发送失败。

处理：

1. 不删除 Issue。
2. 记录 partial outcome。
3. 提示用户可手动重试 Slack step。
4. 如果需要取消 Issue，必须调用独立 compensation capability，并重新确认。

## 场景 4：补偿失败

处理：

1. 标记 composition outcome 为 `manual_review_required`。
2. 输出所有已成功步骤和失败补偿步骤。
3. 保留 provider request id 和 resource url。
4. 不继续自动尝试 destructive compensation。

## 用户提示模板

```text
This multi-step operation is partially complete.
OpenCap will not automatically undo completed steps.
Review the completed steps and choose whether to continue, retry a failed step, or run a separate compensation capability.
```

## 审计要求

Composition audit evidence 应包含：

- composition id
- step id
- parent invocation id
- step outcome
- composition outcome
- plan hash if provided
- compensation relation if any

当前 Runtime 可在 audit event 的 `compositionContext` 中持久化 composition id、parent invocation id、step id/index/name、initiator、plan hash 和 `policyEffect=none`。这些字段只用于关联失败步骤和后续人工恢复，不代表 workflow-level authorization。

## 关联任务

- T175：composition context audit fields。
- T178：plan hash and evidence chain 草案。
- T182：compensation capability review rules。
