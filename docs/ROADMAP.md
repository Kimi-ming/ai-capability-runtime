# 开发路线图

本文是执行级路线图。更概念性的版本见 `docs/roadmap.md`。

## 当前阶段

阶段：V1 前期实现准备

目标：把现有架构文档转为可执行任务队列，并从 CLI/规范/runtime 的最小闭环开始实现。

## M0：项目执行底座

目标：让仓库可以持续开发。

交付物：

- `docs/TASKS.md`
- `docs/SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
- `docs/HANDOFF.md`
- `AGENTS.md`

完成标准：

- 后续任务可以从 `docs/TASKS.md` 直接选择
- 验证方式在 `docs/TESTING.md` 中可查
- 当前状态在 `docs/HANDOFF.md` 中可恢复

## M1：Spec 和 CLI 骨架可用

目标：开发者能校验 Capability。

交付物：

- `opencap validate`
- manifest discovery
- schema validation helper
- 可读错误输出
- validation tests

## M2：本地安装和列表

目标：开发者能安装和查看本地 Capability。

交付物：

- `opencap install <id>`
- `opencap list`
- `opencap.local/installed`
- 重复 id 检测
- install/list tests

## M3：Policy 和 Audit

目标：调用前可决策，调用后可审计。

交付物：

- policy parser
- policy evaluator
- default policy
- audit log schema
- redaction/hash helpers
- `opencap logs`

## M4：HTTP Executor 和 CLI Invoke

目标：在不接 MCP 的情况下跑通 Capability 调用。

交付物：

- URL template renderer
- HTTP executor
- env API key resolver
- timeout
- dry-run
- `opencap invoke`

## M5：MCP Bridge

目标：Host 可以通过 MCP 看见并调用 Capability。

交付物：

- MCP server
- tool description
- tool name collision detection
- confirmation_required result
- MCP tool call -> runtime invoke

## M6：GitHub Issue Demo

目标：跑通第一个真实写操作。

交付物：

- `github.create_issue` 调用成功
- write policy ask/confirmation 行为正确
- audit log 可查
- README 快速开始更新

## M7：Registry 和贡献流程增强

目标：让外部贡献 Capability 更容易。

交付物：

- registry test format
- registry CI validation
- Capability review checklist
- issue/PR templates
- example capability authoring guide

## M8：V1 发布准备

目标：打出可试用的 V1 alpha。

交付物：

- release checklist
- changelog
- smoke tests
- install docs
- known limitations
