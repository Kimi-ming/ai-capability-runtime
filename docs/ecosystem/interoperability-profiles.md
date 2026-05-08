# 互操作配置：OpenCap 兼容性声明规则

本文定义 OpenCap 如何声明和验证与 AI Host、MCP、未来 A2A/Apps SDK 生态的互操作性。核心原则：兼容性不能靠 README 口头承诺，必须由 profile、测试记录和证据组成。

## 为什么需要 Profile

OpenCap 不是单一 Host，也不控制模型或前端交互。不同 Host 对 MCP tools、确认交互、错误展示、输出结构和工具名限制的实现会不一样。如果没有互操作 profile，OpenCap 很容易变成“在一个 Host 上可用，在另一个 Host 上行为未知”的项目。

Profile 用来回答三件事：

- 这个能力面向哪个协议或 Host 表面。
- 需要满足哪些最小行为。
- 用什么测试记录证明满足。

## Profile 等级

| 等级 | 含义 | 证据 |
| --- | --- | --- |
| Draft | 设计存在，但没有完整测试记录 | 设计文档或 RFC |
| Experimental | 能在一个实现中跑通 | 手工 smoke record |
| Compatible | 有稳定测试记录，失败语义明确 | conformance record |
| Verified | 经过 release gate 和维护者复核 | release evidence + maintainer sign-off |

## V1 必须支持的 Profile

### `opencap.mcp.tools.v1`

目标：OpenCap Runtime 能通过 MCP STDIO 暴露已安装 Capability。

要求：

- 支持 `tools/list`。
- 支持 `tools/call` 路由到 Runtime invoke pipeline。
- tool name 从 Capability id 稳定映射，不允许冲突静默覆盖。
- tool description 必须来自 Runtime tool projection，并包含风险和权限摘要。
- tool input schema 必须来自 manifest input schema。
- tool call 参数必须被视为不可信输入，进入 Runtime 前重新校验。
- 错误必须映射到 `docs/design/error-model-v1.md`。

### `opencap.mcp.consent.v1`

目标：在 MCP Host 不支持确认交互时，OpenCap 仍然保持安全边界。

要求：

- `ask` 决策在无确认通道时返回 `confirmation_required`。
- Runtime 不向 STDOUT 打印交互式 prompt。
- 未确认前不解析 secret，不执行 HTTP。
- 返回结果必须包含 capability id、risk、input hash、需要确认的原因。
- 审计日志必须记录 blocked/confirmation_required 结果。

### `opencap.registry.package.v1`

目标：Registry 中的 Capability 目录结构可被 CLI、CI 和 reviewer 共同理解。

要求：

- 包含 `manifest.yml`。
- 包含面向人的 `README.md`。
- 包含至少一个 `tests/*.yml` dry-run 或 validation test。
- 权限、风险、auth、execution 必须在 manifest 中显式声明。
- 不允许依赖隐藏脚本完成安全关键行为。

### `opencap.host.record.v1`

目标：每个 Host 的兼容性不是结论，而是一条可追踪记录。

记录字段：

```yaml
host: claude-desktop
host_version: unknown
opencap_version: 0.1.0-dev
profile: opencap.mcp.tools.v1
capability: github.create_issue
date: 2026-05-07
result: pass
checks:
  tools_list: pass
  tools_call_dry_run: pass
  confirmation_required: pass
notes: MCP Host does not provide native confirmation in this test.
```

## Future Profile

### `opencap.mcp.elicitation.future`

MCP 2025-11-25 已经把 elicitation 作为客户端能力之一。OpenCap 后续可以把 `ask` 映射到 Host 原生 elicitation，但 V1 不依赖它。

边界：

- form 模式只用于非敏感结构化输入。
- OAuth、密钥、外部登录必须使用 URL 或 Host 专门机制。
- elicitation 结果仍要进入 Runtime policy 和 audit，不得绕过。

### `opencap.a2a.discovery.future`

A2A 面向 Agent 间发现、任务和协作。OpenCap 后续可以把 Capability package 映射成 Agent Card/Skill 风格的发现信息，但 V1 不实现 A2A runtime。

边界：

- OpenCap Capability 不是 Agent。
- A2A adapter 只能暴露能力元数据和调用入口。
- 远程 Agent 身份和授权必须另走 RFC。

### `opencap.apps-sdk.future`

OpenAI Apps SDK 面向 ChatGPT 内应用分发，并使用 MCP server 作为工具表面。OpenCap 后续可作为应用背后的 Capability Runtime，但 V1 不绑定 ChatGPT 入口。

## 互操作不变量

- Host 兼容性不能降低 Runtime policy。
- Host 文案不能替代 OpenCap consent summary。
- 外部协议 adapter 不能绕过 validation、policy、confirmation、secret resolver、audit logger。
- 一个 profile 通过，不代表所有 profile 通过。
- compatibility record 必须记录日期、版本、Host、profile 和失败项。

## 关联任务

- T070-T073：MCP tools/list 和 tools/call。
- T142：Host compatibility test records。
- T153：Conformance suite skeleton。
- T154：Host 兼容性 evidence records。
- T156：MCP elicitation RFC。
- T157：A2A Agent Card mapping RFC。
