# OpenCap V1 Architecture Convergence Design

## 背景

OpenCap V1 已经完成大量 Runtime、policy、audit、secret、egress、result envelope、trust 和 conformance 基础能力，但当前项目仍缺少一个能证明产品价值的端到端主链路。`docs/TASKS.md` 中的 T070 完整 MCP server 仍处于阻塞状态，T205 Usage export format 因依赖 T198 Usage event schema 被标记阻塞，T206/T207 也缺少明确验收标准和专项验证。

本设计把后续开发收敛为三条互相支撑的架构线：

1. MCP 主链路闭环。
2. Usage、Evidence 和 Problem Details 证据线。
3. 整体架构文档与任务队列重整。

目标不是扩大 V1 范围，而是把已经完成的 Runtime 能力连成一个可运行、可解释、可验证的 V1 最小闭环。

## 目标

OpenCap V1 Architecture Convergence 的目标是让 OpenCap 从一组分散的 Runtime 能力推进为一个真实可接入的本地治理 Runtime：

```text
MCP Host
  -> OpenCap MCP Bridge
  -> Runtime Kernel
  -> Policy / Egress / Quota / Consent Gates
  -> Secret Resolver
  -> HTTP Executor
  -> Result Envelope
  -> MCP or CLI Adapter
  -> Audit + Usage Evidence + Conformance
```

完成后，项目应能说明并验证：

- AI Host 可以通过 MCP 发现已安装 Capability。
- MCP `tools/call` 只能通过 Runtime Kernel 调用 Capability。
- Runtime 在 secret resolution 和 HTTP execution 前完成 policy、egress、quota 和 consent gate。
- `ask` 在 MCP 无确认通道时返回 `confirmation_required`，不得使用终端 prompt。
- 外部 provider raw response 不直接进入 MCP result，必须经过 Result Envelope、output validation、redaction 和 sanitizer。
- Usage evidence 只记录 non-billing usage 证据，不保存 input、output 或 secret 原文。
- quota/rate 类错误有稳定 problem details，可被 CLI、MCP 和 audit/usage evidence 复用。
- conformance record 能证明 MCP、usage、error 和 audit 相关主路径。

## 非目标

本设计不引入以下能力：

- Console UI。
- Cloud Runtime。
- 多租户。
- 完整 OAuth flow。
- 计费或结算。
- 任意本地命令执行。
- MCP resources、prompts、sampling、roots。
- A2A server。
- Capability 签名强制验证。

Usage 线只定义本地 non-billing evidence，不能把 OpenCap 变成 commerce 或 billing 系统。

## 架构原则

### Runtime 核心不依赖 MCP

`@opencap/runtime` 继续持有调用生命周期和安全边界。MCP 只适配协议输入输出，不读取 secret、不执行 HTTP、不决定 allow/ask/deny、不写 audit。

### 所有调用先过 Gate

调用顺序必须保持：

```text
load capability
  -> validate input
  -> classify and minimize input
  -> evaluate data egress
  -> evaluate quota/budget/rate gates
  -> evaluate policy
  -> handle confirmation
  -> resolve secrets
  -> execute or dry-run
  -> normalize output
  -> validate output
  -> sanitize and redact result
  -> build Result Envelope
  -> write audit and usage evidence
  -> adapt to CLI/MCP
```

任何被 deny、block、confirmation_required、quota_exceeded、rate_limited、failed 或 unknown 的调用都必须产生可脱敏审计证据。

### Evidence 不能代替 Policy

Trust Card、Quality Score、Usage Event、Problem Details、Conformance Record 都只能作为 evidence。它们不能把 `ask` 改成 `allow`，不能覆盖 `deny`，不能绕过 data egress deny、outbound block、secret ordering、revoked/malicious block 或 audit preflight。

### V1 只支持 HTTP Capability

MCP server 暴露的工具仍来自已安装的 `type: http` Capability。V1 不支持本地命令 Capability、MCP proxy Capability 或 OpenAPI adapter 自动执行。

## 架构线 1：MCP 主链路闭环

### 范围

MCP 主链路的目标是把 `opencap serve --mcp` 从骨架变成真实 stdio server，并复用已有 `@opencap/mcp` helper：

- stable tool name mapping。
- collision detection。
- tool projection builder。
- tools/list projection。
- tools/call routing helper。
- Result Envelope to MCP result adapter。
- `confirmation_required` result format。

### 组件边界

`@opencap/cli` 负责启动命令：

```text
opencap serve --mcp --state-dir <path>
```

`@opencap/mcp` 负责 MCP server lifecycle：

- 从 Runtime 加载 installed capabilities。
- 生成 MCP `tools/list` 响应。
- 接收 `tools/call` 请求。
- 将 mapped tool name 反查为 capability id。
- 调用 Runtime invocation entrypoint。
- 将 Result Envelope 适配为 MCP tool result。

`@opencap/runtime` 负责：

- input validation。
- gate evaluation。
- confirmation orchestration。
- secret resolution。
- HTTP execution。
- audit logging。
- result envelope。

### MCP 调用数据流

```text
Host tools/list
  -> MCP server loadInstalledCapabilities()
  -> projectCapabilitiesToMcpTools()
  -> return tool definitions

Host tools/call(name, arguments)
  -> reverse lookup capability id
  -> runtime.invoke({ channel: "mcp", host, capabilityId, input })
  -> ResultEnvelopeV1
  -> resultEnvelopeToMcpToolCallResult()
  -> Host
```

### 确认策略

V1 初始 MCP server 不启用 elicitation。Runtime 返回 `ask` 时，MCP result 必须是 `confirmation_required`：

```json
{
  "status": "confirmation_required",
  "capability_id": "github.create_issue",
  "risk": "write",
  "message": "This capability requires human confirmation before execution."
}
```

该路径不得向 stdout 打印 prompt，不得读取 stdin 作为用户确认，不得因为 CLI `--yes` 或环境变量而在 MCP 模式自动确认。

### MCP 验收

- `opencap serve --mcp` 能启动 stdio MCP server。
- `tools/list` 只暴露 installed capabilities，不暴露 registry 未安装能力。
- tool name collision 在启动或 list 阶段 fail fast。
- `tools/call` 通过 Runtime invoke，不直接执行 HTTP。
- `ask` 返回 `confirmation_required` 且不执行 executor。
- deny/block/failed/unknown/success 均走 Result Envelope adapter。
- stdout 只包含 MCP 协议消息，日志写 stderr。

## 架构线 2：Usage、Evidence 和 Problem Details

### 范围

Usage 线解决 T198、T205、T206、T207 的依赖顺序：

1. T198 定义 Usage Event schema。
2. T206 定义 quota/rate problem details。
3. T205 定义 Usage export format。
4. T207 增加 Usage evidence conformance tests。

T205 不能早于 T198，因为 export format 不能反向固定尚未定义的 usage event 字段。

### Usage Event V1

UsageEventV1 是本地证据对象，不是账单对象。建议最小字段：

```text
schema_version
event_id
timestamp
runtime_instance_id
channel
host
capability_id
capability_version
invocation_id
audit_log_id
policy_decision
gate_status
execution_status
usage_subject
usage_metric
usage_quantity
usage_unit
quota_policy_id
rate_limit_policy_id
problem_type
redaction_profile
input_hash
result_envelope_id
```

禁止字段：

- raw input。
- raw output。
- secret value。
- Authorization header value。
- provider token。
- full provider response body。

UsageEventV1 可以引用 audit log、Result Envelope digest 和 problem details type，但不能复制敏感原文。

### Problem Details V1

Quota/rate 类错误使用稳定 problem details，便于 CLI、MCP、audit 和 usage evidence 共享。

建议类型：

```text
urn:opencap:problem:quota-exceeded
urn:opencap:problem:rate-limited
urn:opencap:problem:budget-exceeded
urn:opencap:problem:provider-rate-limited
```

建议字段：

```text
type
title
status
detail
instance
reason_code
capability_id
gate_id
policy_id
retry_after_ms
reset_at
usage_metric
usage_limit
usage_remaining
redaction_profile
```

`detail` 必须是 Runtime-generated summary，不能包含 input/output/secret 原文。HTTP status 只用于表达问题语义，MCP tool result 仍通过 Result Envelope 表达 `isError` 和 structuredContent。

### Usage Export V1

Usage export 在 T198 后实现，支持 JSONL 和 JSON envelope：

```text
jsonl: one UsageEventV1 per line
json: { export_version, generated_at, filters, events, redaction_profile }
```

导出必须支持 capability、time range、channel、host、status 过滤。导出结果默认脱敏，不支持导出 secret 或 provider raw payload。

### Usage 验收

- Usage event schema 有类型定义、schema 或 validator。
- quota/rate/budget gate 产生 problem details。
- usage event 能关联 invocation/audit/result evidence。
- export format 不包含敏感原文。
- conformance record 覆盖 quota pre-secret、rate limit evidence、problem details、export redaction 和 audit 关联。

## 架构线 3：整体架构与任务队列重整

### 文档职责

本线把项目文档从“已完成任务堆叠”重整为“下一阶段架构路线”：

- `docs/ARCHITECTURE.md`：加入 Architecture Convergence 主路径，明确 MCP、Usage、Conformance 的关系。
- `docs/规划/v1-architecture.md`：更新实现顺序，MCP 闭环优先，Usage evidence 紧随其后。
- `docs/TASKS.md`：补齐 T206/T207 验收标准和验证方式，明确 T198 前移用于解除 T205 阻塞。
- `docs/HANDOFF.md`：记录当前推荐路线和下一步任务。
- `docs/TESTING.md`：在实现任务时同步新增 MCP integration、problem details、usage conformance 验证。

### 任务重排

建议将后续任务整理为一个 Architecture Convergence 小队列：

```text
AC-1: T070 MCP TypeScript SDK selection and server integration
AC-2: T198 Usage event schema
AC-3: T206 Problem details for quota/rate errors
AC-4: T205 Usage export format
AC-5: T207 Usage evidence conformance tests
```

如果 T070 因网络或依赖安装授权继续阻塞，可以先执行 AC-2 和 AC-3，但不能把 Usage export 或 conformance 宣称为完整 V1 闭环完成。

### 文档验收

- T206/T207 不再是无验收标准任务。
- T205 阻塞原因继续保留，直到 T198 完成。
- Handoff 明确下一阶段不是继续散点 P2，而是 Architecture Convergence。
- 架构文档不宣称尚未实现的 MCP server 已完成。

## 错误处理

### MCP 协议错误

只在协议本身错误时返回 JSON-RPC protocol error，例如 malformed request 或 unknown method。Capability 不存在、input validation、policy denied、confirmation required、quota exceeded、provider failed 等业务错误优先作为 MCP tool result 返回。

### Runtime 错误

Runtime 错误统一进入 Result Envelope，并带上 Runtime-generated summary、problem details 或 reason code。MCP/CLI adapter 不复制错误模型，只适配 Runtime 结果。

### Quota 和 Rate 错误

Quota/rate 类错误在 secret resolution 前可被本地 gate 阻断；provider 429 在 HTTP response 后归一化为 provider-rate-limited problem details。两类错误都必须写 audit，能生成 usage evidence，但不能泄露 provider raw headers 中的敏感值。

## 测试策略

### 单元测试

- `@opencap/mcp`：server handler、tools/list、tools/call、confirmation_required、Result Envelope adapter。
- `@opencap/runtime`：UsageEventV1 helper、problem details builder、quota/rate gate evidence。
- `@opencap/spec`：Usage event schema、usage export schema、conformance record validation。
- `@opencap/cli`：`serve --mcp` command snapshot 和 error exit behavior。

### 集成测试

- 使用临时 state dir 安装 `github.create_issue`。
- 启动 MCP stdio server 的 handler 或 test harness。
- 调用 tools/list，断言 tool metadata 来自 installed capability。
- 调用 write capability，断言无 elicitation 时返回 `confirmation_required`，executor 未执行。
- 调用 deny/block fixture，断言 Result Envelope adapter 不返回 provider raw output。

### 文档验证

每个实现任务结束后运行：

```text
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
git diff --check
pnpm validate
pnpm build
pnpm lint
pnpm test
```

在当前 Codex 沙箱中，root `pnpm test` 的 CLI smoke/snapshot/error tests 可能因 `tsx` 本地 IPC pipe 触发 `listen EPERM`，需要脱沙箱运行验证。

## 实施顺序

### Phase 1：文档和任务收敛

1. 将本设计保存为 Superpowers spec。
2. 更新 `docs/TASKS.md`，为 T206/T207 添加验收标准和验证方式。
3. 更新 `docs/HANDOFF.md`，记录 Architecture Convergence 路线。
4. 必要时更新 `docs/ARCHITECTURE.md` 和 `docs/规划/v1-architecture.md` 的下一阶段说明。

### Phase 2：MCP server 闭环

1. 解除 T070 阻塞：选择 MCP TypeScript SDK，记录依赖和边界。
2. 接入最小 stdio server。
3. 复用现有 tool projection 和 route helper。
4. 增加 CLI `serve --mcp` 验证。
5. 增加 MCP integration smoke。

### Phase 3：Usage 和 Problem Details

1. 实现 T198 Usage event schema。
2. 实现 T206 quota/rate problem details。
3. 解除并实现 T205 usage export format。
4. 实现 T207 usage evidence conformance tests。

### Phase 4：V1 Demo 和 Release Readiness

1. 用 `github.create_issue` 做 Host -> MCP -> Runtime -> HTTP -> Audit demo。
2. 更新 README quickstart，明确 MCP demo 和安全边界。
3. 更新 release readiness，判断 `@opencap/mcp` 是否可以进入 alpha candidate。

## 风险与缓解

### MCP SDK 选择仍阻塞

缓解：先记录 SDK 选择标准和 adapter 边界；若无法安装依赖，先实现 handler-level integration，不宣称完整 server 已完成。

### 三线并行导致范围膨胀

缓解：所有任务都绑定 V1 闭环。Usage 只做 non-billing evidence，Problem Details 只覆盖 quota/rate/budget/provider-rate，Composition/Commerce 不进入本阶段实现。

### 文档再次领先实现

缓解：架构文档必须标明状态。已实现、设计中、阻塞、未来扩展分开描述。每个完成任务必须有测试或明确验证缺口。

### Evidence 与 Policy 边界混淆

缓解：所有 evidence schema 都必须包含 `policyEffect: none` 或等价语义说明；测试覆盖 evidence 不能放宽 policy。

## 成功标准

Architecture Convergence 阶段完成时，OpenCap 应满足：

- `opencap serve --mcp` 有可验证的最小 server 行为。
- MCP tools/list 和 tools/call 能通过 Runtime 主路径。
- write capability 在 MCP 无确认通道时稳定返回 `confirmation_required`。
- quota/rate/budget/provider-rate 错误有稳定 problem details。
- Usage event schema 和 export format 不包含敏感原文。
- Usage evidence conformance record 能通过 validator。
- `docs/TASKS.md`、`docs/HANDOFF.md`、`docs/ARCHITECTURE.md` 与真实实现状态一致。

## 自检

- 无占位符：本文没有使用占位词或未定义的未来步骤作为验收内容。
- 范围收敛：本设计只覆盖 MCP 主链路、Usage/Evidence/Problem Details 和架构任务重整，不引入 Console、Cloud、Billing 或 Composition 实现。
- 边界一致：Runtime 仍是安全决策和执行内核；MCP、CLI 只做 adapter。
- 依赖顺序一致：T198 先于 T205；T070 是 MCP server 闭环的依赖；T206/T207 需要补验收标准后再执行。
