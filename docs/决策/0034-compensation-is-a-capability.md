# 架构决策 0034：补偿动作是独立能力，不是隐式回滚

日期：2026-05-07

状态：已接受

## 背景

真实世界 API 调用通常无法用数据库事务回滚。补偿动作具有业务语义，也可能失败或产生新的副作用。

## 决策

OpenCap 把 compensation 建模为独立 Capability invocation。它需要自己的 manifest、permissions、policy、consent 和 audit log。

## 影响

- Runtime 不自动执行隐式 rollback。
- Compensation capability 需要 registry review。
- 用户界面不能承诺“自动恢复原状态”。
