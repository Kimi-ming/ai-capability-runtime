# Duplicate Invocation Detector V1 草案

## 状态

草案。

## 摘要

Duplicate Invocation Detector V1 定义 OpenCap 未来如何在本地 Runtime 中识别短时间内重复的 Capability invocation，并在 secret resolution 和真实 HTTP execution 前给出 evidence、warning、ask 或 reconcile-required decision。

该 detector 不是 exactly-once 系统，不提供跨机器去重，也不阻止用户明确再次执行。它的目标是把 AI Host、模型策略、用户重复点击或超时后的重复调用变成可见、可审计、可确认的 Runtime decision。

## 目标

- 识别同一 Capability identity、同一输入摘要和同一执行语义下的近期重复调用。
- 在写操作、高风险、financial 或 destructive 调用重复时升级为 `ask` 或 `reconcile_required`。
- 对 request 已发出但 outcome unknown 的写操作，优先要求 reconcile，而不是再次执行。
- 生成脱敏 evidence，供 audit、Result Envelope、Problem Details、usage evidence 和未来 conformance suite 复用。
- 保持 Runtime policy、consent、quota/budget、outbound、secret resolver 和 audit 的既有顺序与边界。

## 非目标

- 不实现 exactly-once delivery。
- 不跨机器、跨用户或跨 Runtime state dir 去重。
- 不把 duplicate detector 结果当作 provider idempotency guarantee。
- 不自动合并、取消或补偿已经发生的外部副作用。
- 不保存 input/output 原文、secret、Authorization header、provider raw response 或 provider raw log。
- 不替代用户明确确认、policy decision、financial spend gate 或 provider reconcile。

## 触发位置

Future Runtime pipeline 中，detector 应位于 input hash 和 policy context 已经形成之后、secret resolution 之前：

```text
validate manifest/input
  -> resolve capability identity
  -> compute input hash / execution fingerprint
  -> evaluate policy and risk gates
  -> evaluate duplicate invocation detector
  -> confirmation / consent if needed
  -> audit preflight
  -> secret resolver
  -> outbound policy
  -> HTTP execution
  -> audit result
```

detector 不能把 `deny` 降级为 `ask` 或 `allow`。它只能在原本可继续的 invocation 上增加 warning、要求确认，或在 unknown outcome 未 reconcile 时阻断重复写操作。

## 匹配键

最小匹配键由以下字段组成：

| 字段 | 说明 |
| --- | --- |
| `capabilityIdentityKey` | `id@version#manifestDigest`，来自 Capability identity contract。 |
| `executionFingerprint` | HTTP method、target origin、path template、side-effect kind 和 risk kind 的稳定摘要。 |
| `inputHash` | 现有 Runtime input hash，不保存 input 原文。 |
| `policySetId` / `policyRevision` | 用于区分策略变更前后的相同输入。 |
| `idempotencyMode` | `none`、`method`、`provider_key`、`conditional` 或 `external_reconcile`。 |
| `consentSubject` | Runtime-owned consent subject 摘要，例如 action、target origin 和 risk。 |

匹配键默认只在本地 state dir 内生效。未来 remote runtime 可以把它扩展为 tenant-scoped key，但仍不能跨租户或跨用户共享原始输入。

## 匹配类型

| 类型 | 条件 | 默认行为 |
| --- | --- | --- |
| `exact_recent` | capability identity、execution fingerprint 和 input hash 完全相同，且仍在窗口内 | read-only 记录 warning；write/high-risk 进入 `ask`。 |
| `unknown_outcome_pending` | 先前相同写操作已 requestStarted，但 outcome 为 `unknown_after_timeout` 且没有 reconcile evidence | 阻断自动再次执行，返回 `reconcile_required`。 |
| `same_idempotency_key_different_payload` | provider idempotency key hash 相同，但 payload digest 不同 | `deny` 或 hard warning，禁止自动 retry。 |
| `rapid_repetition` | 同一 capability identity 和 execution fingerprint 在短窗口内多次出现，但 input hash 不同 | 记录 throttle-style warning；是否 ask 由 risk 和 local policy 决定。 |
| `no_match` | 无近期匹配 | 不改变原 decision，只记录 detector evidence。 |

## 默认窗口

默认窗口是 implementation guidance，不是协议保证：

| 场景 | 窗口 | 行为 |
| --- | --- | --- |
| read-only | 30 秒 | 允许继续，记录 `exact_recent` warning。 |
| write medium/high risk | 5 分钟 | 要求新的 Runtime consent。 |
| financial/destructive | 24 小时 | 要求 explicit consent；若 previous outcome unknown，必须 reconcile。 |
| unknown outcome pending | 直到有 reconcile evidence 或用户明确 override | 不自动执行重复写操作。 |

窗口必须可由 local policy 收紧。policy 可以把 warning 升级为 ask/deny，但不能把 unknown write 的 reconcile requirement 降级为 silent allow。

## Detector decision

Future helper 可以输出以下结构化 decision：

```ts
type DuplicateInvocationDecision =
  | "allow_no_match"
  | "allow_with_warning"
  | "ask_duplicate_confirmation"
  | "deny_reconcile_required"
  | "deny_idempotency_conflict";
```

### 语义

- `allow_no_match`：没有近期匹配，不改变原 Runtime decision。
- `allow_with_warning`：允许继续，但 audit/result 记录重复调用提示。
- `ask_duplicate_confirmation`：需要 Runtime-owned consent，确认摘要必须包含近期调用时间、risk 和 target origin。
- `deny_reconcile_required`：存在 unknown outcome pending，必须先通过 provider lookup、manual review 或 compensation path 处理。
- `deny_idempotency_conflict`：同一 idempotency key 绑定不同 payload，禁止自动 retry 或静默执行。

## Evidence 字段

Duplicate detector evidence 应只包含脱敏摘要：

```ts
interface DuplicateInvocationEvidenceV1 {
  schemaVersion: "opencap.duplicate_invocation.v1";
  detectorDecision: DuplicateInvocationDecision;
  matchKind: "no_match" | "exact_recent" | "unknown_outcome_pending" | "same_idempotency_key_different_payload" | "rapid_repetition";
  capabilityIdentityKey: string;
  executionFingerprintHash: string;
  inputHash: string;
  windowMs: number;
  priorInvocationHash?: string;
  priorOutcome?: "success" | "failed" | "blocked" | "unknown_after_timeout";
  priorRequestStarted?: boolean;
  priorConsentDecision?: "approved" | "rejected" | "unavailable";
  idempotencyMode?: string;
  idempotencyKeyHash?: string;
  payloadDigest?: string;
  policySetId?: string;
  policyRevision?: string;
  reasonCode: string;
  policyEffect: "none" | "raise_to_ask" | "deny_until_reconcile";
}
```

不得包含：

- input/output 原文。
- secret、token、cookie、Authorization。
- provider request/response body 原文。
- provider idempotency key 原文。
- user free-text confirmation 原文。

## Consent 和 UX 边界

当 detector 返回 `ask_duplicate_confirmation` 时，Runtime-owned confirmation summary 应回答三件事：

- 这次调用和哪类近期调用相似。
- 近期调用的 outcome、requestStarted 和时间窗口。
- 继续执行可能造成的副作用。

Host 或模型不能替代该 summary。MCP Host 没有确认通道时仍返回 `confirmation_required`，不得在终端里 prompt，也不得解析 secret。

## Audit 和 storage

detector 可以先基于 SQLite audit log 的 recent query 实现，不要求独立数据库。为了性能，后续可增加本地 append-only duplicate index，但 index 只能保存 hash、时间戳、outcome、policy revision、consent decision 和 evidence ref。

每次 detector decision 都必须写入 audit：

- `allow_no_match` 也要记录，便于解释为什么没有阻断。
- blocked、ask、warning 和 unknown/reconcile 都要记录。
- audit preflight 失败时不能执行 detector 之后的 secret/execution 步骤。

## 与 retry/idempotency 的关系

- retry policy 判断“同一次 Runtime 控制下是否可重试”。
- duplicate detector 判断“新的 invocation 是否疑似重复外部副作用”。
- provider idempotency key 是 provider 能力，不是 OpenCap 去重保证。
- timeout after request 的写操作优先进入 unknown/reconcile；detector 不应把它转换成 retry。

## 与 usage evidence 的关系

usage event 应记录 detector decision，但不能因为检测到重复就自动删除用量记录。推荐口径：

- blocked before request：`billable=false`，`requestStarted=false`。
- duplicate ask but not approved：`billable=false`。
- approved duplicate and executed：独立 usage event，关联 `priorInvocationHash`。
- retry attempt：仍由 retry evidence 标记，避免被 duplicate detector 当作独立 Host invocation。

## 验证计划

草案阶段验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
pnpm validate
```

未来实现阶段测试：

- exact recent read-only duplicate 只产生 warning，不执行 secret 前阻断。
- exact recent write duplicate 升级为 `ask_duplicate_confirmation`。
- unknown write outcome pending 返回 `deny_reconcile_required`，且不解析 secret、不调用 fetch。
- same idempotency key different payload 返回 `deny_idempotency_conflict`。
- evidence、audit、Result Envelope 和 usage event 不包含 input/output/secret/provider raw response。
- MCP 无确认通道时返回 `confirmation_required`。

## 开放问题

- 是否需要为 detector decision 增加 Problem Details type，例如 `duplicate-invocation-requires-confirmation`。
- local policy 是否应提供 `duplicate_window` DSL。
- remote runtime 场景下 duplicate key 是否绑定 user、tenant、Host 或 session。
- reconcile evidence 是否应由 T172 的 manifest field 直接引用。
