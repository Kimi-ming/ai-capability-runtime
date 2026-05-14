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
- 错误必须映射到 `docs/设计/error-model-v1.md`。

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
host_version: 1.3561.0
opencap_version: 0.1.0-dev
opencap_commit: <git-sha>
profile: opencap.mcp.tools.v1
capability: github.create_issue
test_date: 2026-05-09
result: pass | fail | pending-smoke
tool_metadata:
  title: supported | ignored | pending-smoke
  description: supported | ignored | pending-smoke
  output_schema: supported | ignored | pending-smoke
  annotations: supported | ignored | not-implemented | pending-smoke
  meta: supported | ignored | not-implemented | pending-smoke
checks:
  tools_list: pass
  tools_call_dry_run: pass
  confirmation_required: pass
notes: MCP Host does not provide native confirmation in this test.
```

记录要求：

- 每条 compatibility record 必须绑定 Host 名称、Host version、OpenCap commit 和 test date。
- 字段支持情况必须逐项记录，不能用“兼容 MCP”一笔带过。
- `annotations` 和 `_meta` 只能作为 Host hint 或未来兼容性信息，不能降低 Runtime policy、confirmation 或 audit 要求。

当前 Host 矩阵维护在 `docs/生态/host-compatibility-matrix.md`。矩阵区分自动化 adapter 证据和真实 Host smoke 证据；Claude Desktop/Cursor 在完成手动 smoke 前保持 `pending-smoke`，自定义 MCP client 由 OpenCap helper tests 作为自动化证据。

### `opencap.host.evidence.v1`

目标：把 compatibility record 的结论拆成可复核的证据条目。Host record 回答“这个 Host/profile 当前结论是什么”；evidence record 回答“这个结论基于哪类证据、从哪里来、有什么限制”。

记录字段：

```yaml
id: evidence-2026-05-14-custom-mcp-client-tools-tests
profile: opencap.mcp.tools.v1
host_record: hostrec-2026-05-14-custom-mcp-client-tools-v1
host: custom-mcp-client
host_version: opencap-helper-tests-0.1.0-dev
opencap_version: 0.1.0-dev
opencap_commit: <git-sha>
observed_at: 2026-05-14
evidence_kind: automated-test | manual-smoke | version-detection | runtime-contract | known-gap
result: pass | fail | pending-smoke | not-run
source:
  command: pnpm --filter @opencap/mcp test
  paths:
    - packages/mcp/src/index.test.ts
privacy:
  stores_raw_input: false
  stores_raw_output: false
  stores_secret: false
limitations:
  - Not a third-party Host UI smoke.
```

记录要求：

- 每条 evidence record 必须绑定 profile、Host record、Host version、OpenCap commit、观察日期和证据类型。
- `automated-test` 只能证明 OpenCap adapter/runtime contract，不能替代真实第三方 Host UI smoke。
- `version-detection` 只能证明本机识别到 Host version，不能证明 `tools/list`、`tools/call` 或 result 展示通过。
- 证据路径可以指向测试文件、命令、手工 smoke 记录或 release artifact；不得保存 input/output 原文、secret、provider raw body。
- T271 会把本节收敛成跨 profile 的统一 evidence record schema；在此之前，Host 兼容性先使用本节字段作为最小口径。

## Future Profile

### `opencap.mcp.elicitation.future`

MCP 2025-11-25 已经把 elicitation 作为客户端能力之一。OpenCap 后续可以把 `ask` 映射到 Host 原生 elicitation，但 V1 不依赖它。

边界：

- form 模式只用于非敏感结构化输入。
- OAuth、密钥、外部登录必须使用 URL 或 Host 专门机制。
- elicitation 结果仍要进入 Runtime policy 和 audit，不得绕过。

草案 profile 见 `rfcs/0010-mcp-elicitation-profile-v1.md`。该 RFC 把当前 future profile 收敛为 `opencap.mcp.elicitation.v1`，但在 MCP adapter 真正实现、Host smoke evidence 通过前，OpenCap 仍保持 `confirmation_required` 安全默认行为。

### `opencap.a2a.discovery.future`

A2A 面向 Agent 间发现、任务和协作。OpenCap 后续可以把 Capability package 映射成 Agent Card/Skill 风格的发现信息，但 V1 不实现 A2A runtime。

边界：

- OpenCap Capability 不是 Agent。
- A2A adapter 只能暴露能力元数据和调用入口。
- 远程 Agent 身份和授权必须另走 RFC。

草案 profile 见 `rfcs/0011-a2a-agent-card-mapping-v1.md`。该 RFC 定义 `opencap.a2a.agent_card_mapping.v1`，把一个 OpenCap Runtime deployment 映射为 A2A Agent Card，并把已安装 Capability 映射为 Agent Skill；在 A2A adapter、远程授权和真实 client smoke 完成前，OpenCap 仍不宣称实现 A2A server。

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
- T271：统一 Interoperability Profile evidence record schema。
