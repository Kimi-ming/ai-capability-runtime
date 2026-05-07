# 用户场景：OpenCap V1

本文把 OpenCap 的目标用户、使用场景和验收结果系统化，避免任务实现时偏离真实价值。

## 角色

### Capability 作者

把一个现有 API、数据源或业务动作包装成 AI 可调用的 Capability。

关心：manifest 是否好写、错误是否清楚、测试是否可跑、发布流程是否明确。

### Host 集成者

在 ChatGPT、Claude、Cursor、自研 Agent 或企业内部 Host 中接入 OpenCap Runtime。

关心：MCP tool 是否稳定、调用结果是否结构化、失败是否可解释、确认流程是否不破坏协议。

### 平台/安全工程师

负责控制 AI 可以调用什么、何时需要确认、调用后能否追踪。

关心：权限声明、策略默认值、密钥处理、审计日志、风险分级和 registry review。

### 最终用户

不直接写 manifest，但会授权 AI 调用能力并承担结果。

关心：AI 要做什么、风险是什么、能不能拒绝、出事后能不能追溯。

## V1 用户任务

| 编号 | 角色 | 当我想要 | 我需要 | 成功信号 |
| --- | --- | --- | --- | --- |
| JOB-01 | Capability 作者 | 把 GitHub Issue API 暴露给 AI | 一个可校验 manifest 和示例 | `opencap validate` 通过 |
| JOB-02 | Capability 作者 | 发布能力到开源 registry | 明确的目录、README、测试和评审要求 | PR 能被 CI 检查 |
| JOB-03 | Host 集成者 | 一次性接入多个能力 | 一个 OpenCap MCP Server | Host 中出现稳定 tool 列表 |
| JOB-04 | 平台/安全工程师 | 默认拦住危险动作 | 本地 policy 文件和风险等级 | write/financial/destructive 默认 ask/deny |
| JOB-05 | 最终用户 | 知道 AI 要调用什么 | 清晰确认内容 | 能允许一次、拒绝或后续固定策略 |
| JOB-06 | 平台/安全工程师 | 调用后可追踪 | 脱敏审计日志 | `opencap logs` 能说明谁调用了什么 |

## V1 主路径场景

### UC-001：校验 Capability

输入：一个 Capability 目录。

流程：

```text
opencap validate registry/developer-tools/github.create_issue
```

验收：schema 校验成功；非法字段显示文件路径和字段路径；失败返回非 0 exit code。

### UC-002：安装 Capability

输入：registry 中的 Capability id。

流程：

```text
opencap install github.create_issue
opencap list
```

验收：能力复制到 `opencap.local/installed/<id>/`；列表显示 id、version、type、risk、trust。

### UC-003：CLI dry-run 调用

输入：能力 id 和 input JSON。

流程：

```text
opencap invoke github.create_issue --dry-run --input examples/github-issue-capability/input.json
```

验收：Runtime 完成输入校验、策略决策、URL/body 渲染预览，不发真实请求，并写审计日志。

### UC-004：MCP Host 调用写操作

输入：Host 发起 MCP `tools/call`。

流程：

```text
Host -> opencap serve --mcp -> Runtime -> Policy -> Confirmation -> HTTP Executor -> Audit Log
```

验收：写操作默认需要确认；MCP STDIO 下不出现终端 prompt；不支持 elicitation 时返回 `confirmation_required`。

### UC-005：查看调用日志

输入：本地状态目录。

流程：

```text
opencap logs
```

验收：显示近期调用、策略决策、状态、耗时和错误摘要；不泄露 token、secret、password、authorization 等敏感字段。

## V1 反场景

这些场景不能进入 V1 主路径：

- 让 AI 任意执行本地 shell 命令。
- 通过 OpenCap 托管用户账号和 OAuth 完整授权流。
- 提供 marketplace 排名、推荐和付费交易。
- 做通用 Agent 编排和多 Agent 协作。
- 把 OpenCap 设计成只能服务某一个 Host 的插件系统。

## 场景到任务的对应

| 场景 | 主要任务 |
| --- | --- |
| UC-001 | T001, T002, T003 |
| UC-002 | T010, T011, T012, T013 |
| UC-003 | T030, T031, T040, T041, T050, T051, T060 |
| UC-004 | T032, T052, T070, T071, T072, T073, T090 |
| UC-005 | T040, T041, T042, T092 |
