# V1 架构

OpenCap V1 是本地优先的 Capability Runtime 和工具链。它的产品定位不是 Agent、聊天入口、模型路由或 marketplace，而是 AI Host 和真实 API 之间的能力治理与安全执行层。

V1 成功标准是：开发者可以在本地安装 `github.create_issue`，通过 MCP Host 发起调用，OpenCap 在执行前完成 policy、egress、quota、confirmation 和 secret 隔离，在执行后返回 Result Envelope 并写入脱敏 audit/usage evidence。

## 产品分层

```text
AI Host
  ChatGPT / Claude / Cursor / 企业内部 Agent
        |
Interop Gateway
  MCP V1 / future A2A / future OpenAPI / future HTTP API
        |
Local Runtime
  install / load / validate / policy / confirmation / secret / execute / audit
        |
Capability Standard + Trust Evidence
  manifest / schema / registry review / conformance / advisory / revocation
        |
External APIs
  GitHub / Slack / Vercel / 内部 API / 数据源
```

Runtime 是唯一执行内核。CLI、MCP 和未来 Console/API 只能作为 adapter 进入 Runtime public contract，不能绕过 Runtime 自己执行 HTTP、读取 secret、决定 policy 或写 audit。

## 系统边界

```text
MCP-compatible Host
        |
        | MCP tool list / tool call
        v
OpenCap MCP Bridge
        |
        v
OpenCap Runtime
  - Capability Loader
  - Input Validator
  - Input Classifier
  - Data Egress Gate
  - Quota/Budget/Rate Gates
  - Policy Engine
  - Confirmation Handler
  - Secret Resolver
  - HTTP Executor
  - Result Envelope Builder
  - Audit Logger
  - Usage Evidence Writer
        |
        v
External APIs
```

## 本地状态

V1 状态目录：

```text
opencap.local/
  installed/
    github.create_issue/
      manifest.yml
  policies.yml
  logs.sqlite
```

该目录不提交到 git。

## 包职责

### `@opencap/spec`

负责：

- manifest TypeScript 类型
- JSON Schema
- manifest validation

### `@opencap/cli`

负责：

- `opencap validate`
- `opencap install`
- `opencap list`
- `opencap invoke`
- `opencap serve --mcp`
- `opencap logs`

### `@opencap/runtime`

负责：

- 本地状态路径
- 已安装 Capability 加载
- 策略评估
- 确认流程协调
- 密钥解析
- 调用生命周期
- 审计日志

### `@opencap/mcp`

负责：

- 将 Capability manifest 映射成 MCP tools
- MCP server 生命周期
- 将 tool call 路由到 runtime invocation

### `@opencap/sdk`

V1 不依赖 SDK 成立。当前 `@opencap/sdk` 只提供 manifest authoring helper，用于定义和校验 HTTP Capability Manifest draft；它不是 Runtime plugin/executor API，不接受 `run()` handler，不安装、不执行、不读取 secret、不写 state dir、不触网，也不改变 policy、audit 或 trust。

## 调用生命周期

```text
1. Host 调用 MCP tool。
2. MCP bridge 将 tool name 映射回 Capability id。
3. Runtime 加载 manifest。
4. Runtime 校验输入。
5. Runtime 对输入做分类、最小化和 field-level egress map。
6. Runtime 先执行 data egress、quota、budget 和 rate gates。
7. Runtime 将权限声明交给 Policy Engine。
8. Policy Engine 返回 allow / ask / deny，并生成 redacted decision trace。
9. Confirmation Handler 处理 ask；MCP 无确认通道时返回 `confirmation_required`。
10. Runtime 解析声明过的 env secret。
11. HTTP Executor 执行请求或生成 dry-run plan。
12. Runtime 校验、归一化、脱敏和 sanitizer 处理 provider output。
13. Runtime 生成 Result Envelope。
14. Audit Logger 记录调用；适用时写入 usage/evidence record。
15. MCP bridge 或 CLI adapter 返回结构化结果。
```

## Policy Engine V1

V1 使用简单 YAML 策略：

```yaml
default: ask
rules:
  - match:
      risk: read_only
    decision: allow
  - match:
      risk: write
    decision: ask
  - match:
      risk: destructive
    decision: deny
```

设计上应保留未来接入 OPA/Rego 的空间。

## Audit Log V1

SQLite 日志字段：

```text
id
timestamp
host
channel
capability_id
capability_version
risk
decision
confirmation_status
status
duration_ms
input_hash
input_redacted_json
output_redacted_json
resolved_url
error
```

命名尽量方便未来映射到 OpenTelemetry。

## 安全约束

- 默认决策是 `ask`
- V1 不执行破坏性本地命令
- 密钥不得写入日志
- 所有外部请求必须有 timeout
- Runtime 必须在服务端校验输入
- 禁止 token passthrough
- MCP STDIO 模式不得使用终端 prompt
- Evidence、Trust Card、Quality Score、Usage Event 和 Conformance Record 不能改变 policy decision
- Provider raw response 不得直接返回给 MCP Host

## 实现顺序

历史 V1 基础顺序仍是 validate -> install/list -> policy -> audit -> HTTP executor -> CLI invoke -> MCP bridge -> GitHub issue demo。当前基础能力已大部分完成，下一阶段进入 Architecture Convergence：

1. 解除 T070 阻塞，选择 MCP TypeScript SDK，并完成 `opencap serve --mcp` 最小 stdio server。
2. 用已安装 Capability 生成 MCP `tools/list`，并确保只暴露 installed capabilities。
3. 将 MCP `tools/call` 路由到 Runtime invocation，`ask` 在无 elicitation 时返回 `confirmation_required`。
4. 以 `github.create_issue` 跑通 Host -> MCP -> Runtime -> HTTP -> Audit 的 V1 demo。
5. 完成 T198 Usage Event schema，明确 non-billing evidence 字段和敏感原文禁止项。
6. 完成 T206 quota/rate Problem Details，并让本地 gate 和 provider 429 共享稳定错误结构。
7. 恢复并完成 T205 Usage export format，再完成 T207 Usage evidence conformance tests。

若 T070 因外部依赖安装继续阻塞，可以先推进 T198 和 T206；但不能把 MCP 主链路或 V1 demo 宣称为已完成。
