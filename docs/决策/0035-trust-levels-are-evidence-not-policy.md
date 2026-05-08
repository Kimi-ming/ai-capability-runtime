# 架构决策 0035：信任等级 是证据摘要，不是 策略

日期：2026-05-08

状态：已接受

## 背景

OpenCap 需要展示 Capability 的信任状态，但如果 trust level 能直接放行高风险能力，就会破坏本地 policy 和用户确认边界。

## 决策

Trust level 只表达可验证事实和治理状态。它不能覆盖本地 policy，不能让高风险能力自动执行，也不能替代用户确认。

## 影响

- `verified` 仍然需要按 risk 走 policy。
- Trust Card 必须注明不是安全保证。
- Quality Score 也不能覆盖 policy。
