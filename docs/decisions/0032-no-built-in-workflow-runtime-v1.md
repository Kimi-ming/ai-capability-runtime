# ADR 0032：V1 不内置 Workflow Runtime

日期：2026-05-07

状态：已接受

## 背景

OpenCap 的定位是能力层和运行时治理，不是 Agent Builder 或通用工作流平台。多步编排会引入状态机、分支、循环、定时器、重试、补偿和持久执行，范围远超 V1。

## 决策

V1 不内置 workflow runtime。OpenCap 只保证单步 Capability invocation 的安全闭环，并为未来组合保留 audit/evidence 扩展点。

## 影响

- 外部 Host/Agent 可以连续调用多个 Capability，但每一步都必须独立通过 Runtime pipeline。
- V1 不提供 workflow DSL。
- 未来 composition profile 必须通过 RFC。
