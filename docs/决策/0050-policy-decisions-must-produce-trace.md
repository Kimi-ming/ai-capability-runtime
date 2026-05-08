# 架构决策 0050：策略决策 必须产生 追踪记录

日期：2026-05-08

状态：已接受

## 背景

OpenCap 的多个 gate 会产生 allow/ask/deny/block。只记录最终 decision 不足以解释为什么执行或阻断，也无法在事故后回放策略行为。

## 决策

每个 policy/gate decision 必须产生 redacted decision trace。Trace 至少包含 policy set、revision、gate、matched rule、default 是否生效、reason code 和 evaluated facts summary。

## 影响

- audit log 需要 policy trace 字段。
- CLI 后续可实现 `--explain`。
- trace 不得包含 input 原文或 secret-like value。
