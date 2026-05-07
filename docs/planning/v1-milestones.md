# V1 Milestones：阶段门禁

本文把 `docs/TASKS.md` 的任务组织成阶段。每个阶段都有进入条件、退出条件和验证门禁。

## M0：开发体系完成

状态：已完成

目标：仓库具备持续开发所需文档体系。

包含任务：

- T110 中文文档体系
- T111 开发任务体系

退出条件：

- 核心文档完整
- `check_docs.py` 通过
- `next_task.py` 能识别下一项任务

## M1：Manifest Validation

目标：Capability manifest 可以被 CLI 和 CI 稳定校验。

任务：

- T001 `opencap validate` 接真实 schema 校验
- T002 可复用 manifest validator API
- T003 schema 单元测试
- T004 registry test case schema

进入条件：

- 依赖可以安装
- 当前 schema 明确 V1 HTTP-only

退出条件：

- `opencap validate <path>` 可用
- registry 示例全部通过校验
- 非法 manifest 有明确错误
- CI 可以运行 validate

验证门禁：

```bash
pnpm install
pnpm validate
pnpm --filter @opencap/spec test
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
```

## M2：Local Install/List

目标：Capability 可以安装到本地状态并被 Runtime 发现。

任务：

- T010 本地状态路径 helper
- T011 `opencap install <id>`
- T012 `opencap list`
- T020 Installed Capability Loader
- T022 本地状态初始化

退出条件：

- 能安装 `github.create_issue`
- 能列出已安装能力
- state dir 可测试、可覆盖、可删除
- 重复 id 和找不到 id 有明确错误

## M3：Policy + Audit

目标：任何调用都先决策、后执行、必留日志。

任务：

- T030 policy parser
- T031 Policy Engine
- T032 Confirmation Handler
- T033 ask/deny audit
- T040 audit log storage
- T041 redaction/hash
- T042 `opencap logs`

退出条件：

- allow/ask/deny 行为稳定
- deny 不执行 executor
- ask 在 MCP channel 不使用终端 prompt
- 成功、失败、拒绝都写日志
- 日志不包含 secret 原文

## M4：HTTP Invoke

目标：不接 MCP 时，CLI 能 dry-run 和真实执行 HTTP Capability。

任务：

- T050 URL template renderer
- T051 dry-run executor
- T052 HTTP executor
- T053 HTTP body manifest 设计
- T054 output normalization
- T055 arbitrary URL 风险处理
- T060 `opencap invoke --dry-run`
- T061 真实 `opencap invoke`
- T062 示例 input 文件

退出条件：

- dry-run 可显示请求计划
- read_only 调用可真实执行
- write 调用默认 ask
- GitHub issue 请求 body 设计明确

## M5：MCP Bridge

目标：AI Host 可以通过 MCP 使用 OpenCap。

任务：

- T070 选择 MCP TypeScript SDK
- T071 tools/list
- T072 tools/call
- T073 confirmation_required 格式
- T074 MCP Host 手动测试文档
- T021 tool name 映射和冲突检测

退出条件：

- Host 能发现 installed tools
- tool input schema 正确
- MCP 调用会进入 Runtime
- `ask` 无 elicitation 时不会执行
- STDIO 不输出非协议文本

## M6：GitHub Issue Demo

目标：跑通第一个真实写操作。

依赖：M1-M5 完成。

退出条件：

- `github.create_issue` 可创建 issue
- 默认策略不会静默执行写操作
- 审计日志完整记录
- README 快速开始能按真实命令执行

## M7：Registry 贡献体验

目标：外部开发者能提交 Capability。

任务：

- T080 Registry manifest CI
- T081 Capability Review Checklist
- T082 Registry README
- T083 Issue/PR templates
- T005 manifest authoring guide

## M8：Alpha Release

目标：发布可试用 alpha。

任务：

- T100 workspace build/test
- T101 CI 基础通过
- T120 alpha release checklist
- T121 CHANGELOG
- T122 版本策略
- T123 npm 发布预案

Alpha 退出条件：

- 文档说明已知限制
- 核心 smoke test 可跑
- GitHub issue demo 可复现
- Registry 至少 4 个示例能力可校验
