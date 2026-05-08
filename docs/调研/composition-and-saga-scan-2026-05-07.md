# 调研：组合、Saga 与补偿事务 2026-05-07

本文记录本轮多能力组合边界参考的外部来源。

## 参考来源

- Microsoft Compensating Transaction pattern: https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction
- AWS Step Functions error handling: https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html
- Temporal Durable Execution docs: https://docs.temporal.io/temporal
- Saga pattern background: https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf

## 对 OpenCap 的影响

### Compensation 不是普通 rollback

Microsoft 的补偿事务模式强调，补偿逻辑通常是业务特定的，不一定能恢复到原始状态，也不一定按逆序执行。OpenCap 不应该把 compensation 描述成通用 rollback。

OpenCap 决策：compensation 是独立 Capability invocation，需要独立 policy、consent 和 audit。

### Workflow error handling 很强，但会改变产品边界

AWS Step Functions 和 Temporal 都证明了 workflow runtime 的价值，但它们也说明 workflow 是一个完整产品类别。OpenCap V1 不应把 workflow runtime 混进核心。

OpenCap 决策：V1 只保留 composition evidence 和 future profile，不实现 workflow DSL。

### Saga 适合长事务，但需要持久状态和补偿语义

Saga 要求每一步都有明确状态和补偿路径。OpenCap 当前的 audit/evidence 体系可以为 future saga profile 做准备，但不能承诺跨 Capability 事务。

OpenCap 决策：未来 composition profile 先做证据和边界，不先做自动执行。

## 新增文档

- `docs/设计/composition-boundary-v1.md`
- `docs/生态/capability-graph-v1.md`
- `docs/设计/multi-step-execution-boundary.md`
- `docs/运营/composition-failure-runbook.md`

## 后续问题

- 是否引入 `compositionId` audit 字段。
- 是否允许 Host 提供 planHash。
- Compensation capability 是否需要单独 trust level。
- Composition profile 是否属于 v0.3 之后。
