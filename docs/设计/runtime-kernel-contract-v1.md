# Runtime Kernel 公共契约 V1

本文定义 OpenCap Runtime Kernel 的公共契约。它是 `docs/设计/整体系统设计-v1.md` 中 Runtime Kernel 的工程化展开，也是后续 TypeScript 类型、CLI/MCP adapter、测试和审计实现的对齐依据。

## 目标

Runtime Kernel 必须让所有入口共享同一套调用模型：

```text
CLI invoke
MCP tools/call
未来 HTTP API
未来 Console action
        ↓
Runtime Kernel public contract
        ↓
同一条 validation / gate / consent / secret / execution / audit pipeline
```

目标不是一次实现所有模块，而是先固定模块之间的语言，避免后续各入口重复发明自己的请求、结果、错误和证据格式。

## 非目标

- 不定义 MCP protocol message 细节。
- 不定义 Console UI shape。
- 不定义远程 Runtime OAuth flow。
- 不定义 workflow/agent planning。
- 不把 provider SDK 类型暴露为 Runtime 公共类型。

## 包边界

| 包 | 可以依赖 | 不应依赖 |
| --- | --- | --- |
| `@opencap/runtime` | `@opencap/spec`、Node 标准库、内部 adapter 接口 | `@opencap/mcp`、具体 Host SDK、UI package |
| `@opencap/mcp` | `@opencap/runtime` public contract | Runtime 私有模块、secret resolver 内部类型 |
| `@opencap/cli` | `@opencap/runtime` public contract、`@opencap/spec` | MCP protocol 类型作为核心调用模型 |

结论：Runtime public contract 是核心包对外唯一稳定的调用语言。

## 顶层接口

```ts
export interface RuntimeKernel {
  loadInstalledCapabilities(context: RuntimeContext): Promise<InstalledCapability[]>;
  getCapability(identity: CapabilitySelector, context: RuntimeContext): Promise<InstalledCapability>;
  planInvocation(request: InvocationRequest, context: RuntimeContext): Promise<InvocationPlan>;
  invoke(request: InvocationRequest, context: RuntimeContext): Promise<ResultEnvelope>;
}
```

### 设计约束

- `invoke` 是唯一允许执行外部副作用的入口。
- `planInvocation` 不解析 secret、不发外部请求。
- `loadInstalledCapabilities` 不做 policy 决策。
- 所有入口必须提供 `RuntimeContext`，不能隐式读取全局 Host 状态。

## RuntimeContext

```ts
export interface RuntimeContext {
  stateDir: string;
  now: () => Date;
  environment: RuntimeEnvironment;
  channel: InvocationChannel;
  host?: HostDescriptor;
  dryRunDefault?: boolean;
}

export type InvocationChannel = "cli" | "mcp" | "api" | "test";

export interface HostDescriptor {
  id: string;
  name?: string;
  version?: string;
  profile?: string;
  capabilities?: HostCapability[];
}

export type HostCapability =
  | "mcp.tools"
  | "mcp.elicitation"
  | "structuredContent"
  | "interactiveTerminal";
```

### 规则

- `channel` 影响确认方式和结果适配，但不影响安全门禁。
- `host.capabilities` 只能说明 Host 能显示什么，不能降低 Runtime policy。
- `test` channel 只能用于单元测试和 conformance，不得隐式放宽权限。

## RuntimeEnvironment

```ts
export interface RuntimeEnvironment {
  env: Record<string, string | undefined>;
  cwd: string;
  platform: NodeJS.Platform;
  processId?: number;
}
```

### 规则

- Secret Resolver 只能通过 `RuntimeEnvironment.env` 读取 manifest 声明的 env var。
- dry-run 默认不读取 secret 原值。
- `cwd` 只用于路径解析和 evidence，不作为授权来源。

## CapabilityIdentity

```ts
export interface CapabilityIdentity {
  id: string;
  version: string;
  packagePath: string;
  manifestPath: string;
  manifestDigest?: string;
  packageDigest?: string;
  registryCommit?: string;
  lifecycle?: CapabilityLifecycleState;
}

export type CapabilityLifecycleState =
  | "draft"
  | "listed"
  | "tested"
  | "audited"
  | "deprecated"
  | "yanked"
  | "revoked";

export interface CapabilitySelector {
  id: string;
  version?: string;
}
```

### 规则

- `id + version + manifestDigest` 是一次调用审计里的能力身份。
- `packagePath` 是本地路径证据，不是 trust 证据。
- `revoked` 能力必须可寻址，但默认不能执行。

## InstalledCapability

```ts
export interface InstalledCapability {
  identity: CapabilityIdentity;
  manifest: CapabilityManifest;
  install: InstallMetadata;
  trust?: TrustSummary;
  derived: DerivedCapabilityMetadata;
}

export interface InstallMetadata {
  installedAt: string;
  source: "registry" | "local" | "test";
  sourceRef?: string;
}

export interface TrustSummary {
  level: "unverified" | "listed" | "tested" | "maintainer_verified" | "official";
  advisories?: string[];
  reviewDigest?: string;
}

export interface DerivedCapabilityMetadata {
  riskSummary: RiskSummary;
  toolName?: string;
  modelVisibleSummary?: string;
}
```

### 规则

- `derived` 由 Runtime 生成，可以缓存，但不能成为 manifest 的替代品。
- `modelVisibleSummary` 必须经过 metadata lint。
- `trust.level` 只解释证据，不改变 policy decision。

## InvocationRequest

```ts
export interface InvocationRequest {
  capability: CapabilitySelector;
  input: unknown;
  requestId?: string;
  dryRun?: boolean;
  idempotencyKey?: string;
  caller?: CallerDescriptor;
  metadata?: Record<string, unknown>;
}

export interface CallerDescriptor {
  userId?: string;
  sessionId?: string;
  agentId?: string;
  hostInvocationId?: string;
}
```

### 规则

- `input` 在 schema validation、classification 和 minimization 前全部视为不可信。
- `requestId` 由 Runtime 可补齐，并进入 audit。
- `metadata` 不得参与授权，除非后续 RFC 明确把某字段纳入 policy input。
- Host/client/user token 不得出现在 `InvocationRequest` 里作为 provider credential。

## InvocationPlan

```ts
export interface InvocationPlan {
  requestId: string;
  capability: CapabilityIdentity;
  channel: InvocationChannel;
  validatedInput: unknown;
  inputClassification: InputClassificationResult;
  egressMap: EgressMap;
  gates: GateDecision[];
  execution?: PlannedExecution;
  confirmation?: ConsentRequest;
  auditPreview: AuditPreview;
}
```

### 规则

- `InvocationPlan` 可以展示给用户和测试，但必须脱敏。
- `execution` 只能在 pre-secret gates 通过后生成最终请求形态。
- `confirmation` 出现时，Runtime 不得继续执行。

## GateDecision

T268 固定 Runtime Gate public contract 和 `GateDecision` 执行语义。Gate 是 Runtime pipeline 中产生 allow/ask/deny/block/redact 决策的统一接口，data egress、risk policy、quota/budget、outbound、lifecycle、audit preflight 等都应向这个形状靠拢。

```ts
export type RuntimeGateId =
  | "input_validation"
  | "data_egress"
  | "risk_policy"
  | "confirmation"
  | "secret"
  | "outbound"
  | "audit_preflight"
  | "lifecycle"
  | "quota"
  | "budget"
  | "output_validation"
  | (string & {});

export type GateStage = "pre_secret" | "pre_execution" | "post_execution";
export type GateDecisionKind = "allow" | "ask" | "deny" | "block" | "redact";
export type GateTerminalStatus = "confirmation_required" | "denied" | "blocked";

export interface GateDecision<Evidence = unknown> {
  gateId: RuntimeGateId;
  stage: GateStage;
  decision: GateDecisionKind;
  reasonCode: string;
  summary: string;
  evidence: Evidence;
  hardBoundary: boolean;
  traceId?: string;
}

export interface GateDecisionSemantics {
  secretResolutionAllowed: boolean;
  executionAllowed: boolean;
  confirmationRequired: boolean;
  transformedInputRequired: boolean;
  terminalStatus?: GateTerminalStatus;
}

export interface RuntimeGate<Input = unknown, Evidence = unknown> {
  gateId: RuntimeGateId;
  stage: GateStage;
  evaluate(input: Input): GateDecision<Evidence> | Promise<GateDecision<Evidence>>;
}
```

### 规则

- `allow` 允许继续 secret resolution 和 execution。
- `ask` 表示需要 consent，不等于 allow；它可以进入 confirmation，但不得直接 execution。
- `deny` 表示 policy 或用户策略拒绝；不得解析 secret，不得 execution，结果映射为 `denied`。
- `block` 表示系统硬阻断，例如 revoked、audit preflight failure、private network deny；不得解析 secret，不得 execution，结果映射为 `blocked`。
- `redact` 表示必须生成 transformed input 后重新校验；在完成转换前不得解析 secret 或 execution。
- `hardBoundary: true` 不能被 override 或 breakglass 绕过。
- `createGateDecision()` 对 `block` 默认设置 `hardBoundary=true`，其他决策默认 `false`，但调用方可以显式声明更严格的 hard boundary。
- `gateDecisionSemantics()` 是公共语义 helper，adapter、future gate registry 和 conformance tests 应以它为准，不在各模块重复解释 decision。

## Ledger 存储接口

T269 固定四类账本的 public contract。Ledger 是可查询的本地证据边界，不是原文归档；V1 可以用 JSONL、SQLite 或 YAML evidence record 实现，但外部模块应依赖 `@opencap/runtime` 导出的接口。

```ts
export type LedgerRecordKind =
  | "capability"
  | "policy"
  | "invocation"
  | "compatibility";

export interface LedgerRecordBase<Kind extends LedgerRecordKind> {
  ledgerVersion: "opencap.ledger_record.v1";
  recordKind: Kind;
  recordId: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeLedgerStore
  extends CapabilityLedgerStore,
    PolicyLedgerStore,
    InvocationLedgerStore,
    CompatibilityLedgerStore {}
```

### 账本职责

| 账本 | 记录对象 | 最小查询 |
| --- | --- | --- |
| Capability Ledger | installed/updated/lifecycle/advisory/trust 事件 | 按 capability id 查询最新记录 |
| Policy Ledger | activation/rollback/failed activation/override 事件 | 按 policy set 查询 active 记录 |
| Invocation Ledger | request、capability、channel、status、gate decisions、policy trace、audit id | 按 request id 查询调用记录 |
| Compatibility Ledger | Host、profile、OpenCap commit、capability、checks、evidence ref | 按 host/profile 查询最新记录 |

### 规则

- Ledger record 必须是 append-only 语义；更新状态时追加新记录，不删除历史。
- `recordId` 由 Runtime helper 生成，使用 `ledger_cap_`、`ledger_pol_`、`ledger_inv_`、`ledger_compat_` 前缀。
- 账本只保存 digest、hash、摘要、状态、证据引用和已脱敏 metadata。
- 不保存 manifest 原文、policy 原文、input 原文、provider raw output、secret value 或 Authorization header value。
- 具体存储实现可以分散在已安装能力 metadata、policy JSONL、SQLite audit log 和 compatibility YAML/JSON record 中，但查询接口必须维持同一语义。

## ConsentRequest 和 ConsentReceipt

```ts
export interface ConsentRequest {
  consentId: string;
  requestId: string;
  capability: CapabilityIdentity;
  actionSummary: string;
  riskSummary: RiskSummary;
  egressSummary: EgressSummary;
  policyReason: string;
  expiresAt?: string;
}

export interface ConsentReceipt {
  consentId: string;
  decision: "approved" | "rejected" | "unavailable" | "expired";
  decidedAt: string;
  channel: InvocationChannel;
  actor?: CallerDescriptor;
}
```

### 规则

- Consent 文案由 Runtime 生成，不由模型或 Host 自由生成。
- `approved` 只对本次 request 有效，除非后续 policy change 明确记录。
- MCP 无确认通道时必须返回 `unavailable`，并生成 `confirmation_required` ResultEnvelope。

## SecretHandle

```ts
export interface SecretHandle {
  id: string;
  provider: "env";
  placement: "header" | "query" | "body";
  redactedPreview: string;
}
```

### 规则

- `SecretHandle` 不暴露 secret 原文。
- Executor 可以在内部使用 handle 解析出的值，但不得把值返回给 ResultEnvelope 或 AuditRecord。
- Secret Resolver 只能在所有 `pre_secret` gate 通过后运行。

## ResultEnvelope

```ts
export interface ResultEnvelope<Output = unknown> {
  requestId: string;
  capability: CapabilityIdentity;
  status: ResultStatus;
  channel: InvocationChannel;
  output?: Output;
  error?: RuntimeError;
  evidence: ResultEvidence;
  audit: AuditWriteResult;
}

export type ResultStatus =
  | "success"
  | "dry_run"
  | "confirmation_required"
  | "denied"
  | "blocked"
  | "failed"
  | "unknown_after_timeout";
```

### 规则

- MCP、CLI、未来 API 都只能从 `ResultEnvelope` 适配输出。
- Provider raw output 默认不直接进入 `output`。
- 声明 output schema 的 Capability 必须通过 output validation 才能返回 `success`。
- audit 写入失败时，非只读调用不得返回 `success`。

## RuntimeError

```ts
export interface RuntimeError {
  code: string;
  category:
    | "user_input"
    | "policy"
    | "confirmation"
    | "secret"
    | "execution"
    | "output_validation"
    | "audit"
    | "internal";
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}
```

### 规则

- `message` 可以给用户看，但必须避免 secret 和 provider raw sensitive body。
- `details` 默认不进入模型上下文。
- `retryable` 不能让 Runtime 自动重试非幂等写操作。

## Evidence 对象

```ts
export interface ResultEvidence {
  policyTraceIds: string[];
  gateDecisions: GateDecision[];
  inputHash?: string;
  outputHash?: string;
  execution?: ExecutionEvidence;
  provenance?: ResultProvenance;
}

export interface AuditWriteResult {
  status: "written" | "skipped" | "failed";
  auditId?: string;
  error?: string;
}
```

### 规则

- Evidence 必须可脱敏后写入 audit。
- Evidence 是 trust/quality/profile 的输入，不是执行授权来源。
- `skipped` 只允许在 dry-run 或明确 non-auditable test 场景出现。

## Adapter 映射

| Adapter | 输入 | 输出 | 约束 |
| --- | --- | --- | --- |
| CLI | CLI args + JSON input file | human text + optional JSON | 不重新实现 policy；只格式化 ResultEnvelope |
| MCP | `tools/call` args | MCP tool result | 不写 stdout prompt；ask 映射为 confirmation_required |
| Future API | HTTP request | HTTP response | 不绕过 RuntimeContext 和 audit |
| Future Console | UI action | UI state | 只消费 Card/Envelope，不直接读 secret |

## 最小实现顺序

1. 在 `@opencap/runtime` 定义 public contract 类型。
2. 把现有 `InvocationRequest/InvocationResult` 迁移为新契约的最小子集。
3. `@opencap/cli` 和 `@opencap/mcp` 只依赖 public contract。
4. 为 ResultEnvelope 和 RuntimeError 添加 snapshot tests。
5. 后续 T268 再把 Gate 接口和 gate registry 补齐。

## 验收标准

- Runtime public contract 能表达完整调用生命周期。
- CLI/MCP 不需要自定义另一套 request/result/error 类型。
- Secret、audit、policy、consent、egress 的顺序可以从类型关系中看出。
- Future adapters 可以扩展 channel，但不能绕过 `invoke`。
- 本文的类型能直接迁移到 `packages/runtime/src/contracts.ts` 或等价文件。
