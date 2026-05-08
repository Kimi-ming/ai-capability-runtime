# AI 代理协作说明

本文件给所有参与 OpenCap 的 AI 代理和开发者使用。目标是让每次开发都能从文档开始、以验证结束，并把状态写回仓库。

## 项目定位

OpenCap 是面向 AI 原生应用的开源 Capability Runtime 和治理层。

它不做 Agent，不做聊天入口，不做中心化 marketplace。它提供：

- Capability Manifest 标准
- 本地优先 Runtime
- MCP 兼容网关
- 权限策略
- 审计日志
- Git-based Registry
- CLI/SDK 工具链

## 工作原则

1. 先读 `docs/TASKS.md`，再动代码。
2. 只做当前任务需要的最小可验证改动。
3. 每个任务都必须有验收标准和验证方式。
4. 不绕过权限模型和审计模型。
5. 不把 `.env`、token、`opencap.local/`、数据库日志提交进仓库。
6. 每次任务结束后更新任务状态、handoff，并提交推送。
7. 面向读者的文档默认使用中文；协议名、命令、字段名和包名可以保留英文。

## 常用入口

- 中文文档中心：`docs/README.md`
- 文档维护规则：`docs/documentation-governance.md`
- 当前任务队列：`docs/TASKS.md`
- 当前状态交接：`docs/HANDOFF.md`
- 产品规格：`docs/SPEC.md`
- 架构总览：`docs/ARCHITECTURE.md`
- 测试策略：`docs/TESTING.md`
- 决策索引：`docs/DECISIONS.md`
- V1 详细需求：`docs/planning/v1-requirements.md`
- V1 详细架构：`docs/planning/v1-architecture.md`
- 技术方案审查：`docs/reviews/technical-plan-review-2026-05-07.md`

## 开发循环

```text
读 docs/TASKS.md
  -> 选择第一个 ready 且未阻塞任务
  -> 阅读相关 SPEC/ARCHITECTURE/DECISIONS
  -> 实现最小改动
  -> 运行 docs/TESTING.md 中对应验证
  -> 更新 TASKS/HANDOFF/必要文档
  -> git commit
  -> git push
```

## 状态标记

- `[ ]` 未开始
- `[~]` 进行中
- `[x]` 已完成且已验证
- `[!]` 阻塞
- `[?]` 需要产品或架构确认

## V1 实现约束

- V1 只支持 `type: http` Capability。
- MCP `ask` 决策不能使用终端 prompt。
- 所有调用必须先经过 policy，再执行。
- 被拒绝、阻塞、未确认的调用也要写审计日志。
- `http.request_demo` 是示例，不应作为默认可信安装能力。
