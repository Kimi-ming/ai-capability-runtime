# 架构决策 0051：策略变更 是可审计本地对象

日期：2026-05-08

状态：已接受

## 背景

Policy 决定 AI 能否调用真实世界能力。若 policy 文件被修改但没有版本、digest、变更记录和回滚语义，OpenCap 无法解释行为变化。

## 决策

OpenCap 将 policy set 和 policy change 作为本地可审计对象。每次激活 policy 都应记录 digest、revision、diff summary、验证状态和激活时间。历史不能静默删除。

## 影响

- V1 本地 state 需要 policy ledger 或等价记录。
- future policy bundle 必须有 revision/digest/activation semantics。
- failed policy activation 不覆盖当前 active policy。
