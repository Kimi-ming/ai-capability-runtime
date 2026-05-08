# 架构决策 0033：组合中的每一步都必须独立 策略、Consent、审计

日期：2026-05-07

状态：已接受

## 背景

多步组合会放大风险。一次“允许整个计划”如果覆盖所有步骤，可能导致用户没有看到关键写操作、外发消息或破坏性操作。

## 决策

未来任何组合 profile 中，每一步 Capability invocation 都必须独立经过 validation、policy、consent、secret resolution、execution 和 audit。

## 影响

- workflow-level consent 不能默认替代 step-level consent。
- compositionId 和 planHash 只作为 evidence，不作为授权。
- 高风险步骤仍然需要独立确认。
