# Plan Hash 与 Evidence Chain V1 草案

本文定义 OpenCap 未来在多步 composition 中如何记录 plan hash 和 evidence chain。它是 `opencap.composition.profile.v1` 的补充设计，不引入 workflow runtime，也不让 plan hash 成为授权凭据。

## 目标

- 让同一 composition 中的 step 可以被审计关联。
- 让派生 input、policy、consent、execution 和 recovery evidence 能形成可检查链路。
- 避免保存 raw plan、raw input、raw output、secret 或模型自由计划文本。
- 明确 plan hash、parent invocation 和 source result digest 都只用于 evidence correlation。
- 为未来 CLI/Console 的只读 composition inspection 和 conformance record 预留统一语言。

## 非目标

- 不定义 workflow DSL、planner、scheduler、并发执行、循环或条件分支。
- 不验证 Host/Agent 的计划是否正确、完整或安全。
- 不把 composition-level approval 作为 step-level consent。
- 不让 plan hash、composition id、parent invocation 或 source result digest 覆盖 policy、consent、quota/budget、outbound、data egress、lifecycle、secret resolver 或 audit gate。
- 不保存 raw plan，也不把模型 chain-of-thought 写入审计。

## Plan Hash

`planHash` 是 Host 或未来 canonicalizer 生成的稳定摘要。它只证明某个 step 声称属于同一个外部计划，不证明计划本身可信。

V1 规则：

- 字段格式必须是 `sha256:<64 hex>`。
- Runtime 可以记录 `planHash`，但不解析 raw plan。
- Runtime 不因为 `planHash` 相同就合并、跳过或放宽任何 gate。
- `planHash` 不能作为 policy fact 中的 allow 条件。
- 如果 Host 无法通过安全 metadata channel 传递 `planHash`，该字段可以缺省。

允许的 hash 输入由 Host 或 future profile 定义。推荐只包含安全计划元数据，例如 step id、capability identity key、input hash、required flag 和 declared dependency，不包含用户正文、provider response、secret、token、private URL 或模型自由文本。

## Evidence Chain

Evidence chain 是从 audit log、Result Envelope evidence、consent receipt 和 future interop evidence 聚合出的只读链路。它不是新的存储事务，也不是执行状态机。

```ts
type PlanHashEvidenceV1 = {
  profile: "opencap.plan_hash_evidence_chain.v1";
  planHash?: string;
  planHashAlgorithm?: "sha256";
  planHashSource: "host_supplied" | "runtime_canonicalized" | "absent";
  policyEffect: "none";
};

type EvidenceChainLinkV1 = {
  profile: "opencap.plan_hash_evidence_chain.v1";
  invocationId: string;
  compositionId?: string;
  stepId?: string;
  stepIndex?: number;
  parentInvocationId?: string;
  capabilityIdentityKey: string;
  inputHash: string;
  planHash?: string;
  inputProvenance?: {
    inputSource: "user_supplied" | "model_generated" | "tool_derived" | "runtime_generated";
    derivedFromInvocationId?: string;
    sourceResultDigest?: string;
    transformations?: string[];
  };
  policyTrace?: {
    policySetId?: string;
    policyRevision?: string;
    decision: "allow" | "ask" | "deny";
    matchedRuleId?: string;
  };
  consentReceipt?: {
    consentId: string;
    decision: "approved" | "rejected" | "unavailable" | "expired";
    inputHash: string;
    policyRuleId?: string;
  };
  execution?: {
    outcome: "success" | "blocked" | "failed_before_request" | "failed_after_request" | "unknown_after_timeout" | "partial";
    requestStarted: boolean;
    providerRequestId?: string;
    reconcileHint?: string;
  };
  sourceAuditHash?: string;
  policyEffect: "none";
};

type CompositionEvidenceChainV1 = {
  profile: "opencap.plan_hash_evidence_chain.v1";
  compositionId: string;
  planHash?: string;
  links: EvidenceChainLinkV1[];
  summary: {
    outcome: "completed" | "blocked" | "failed" | "unknown" | "partial" | "compensating" | "manual_review_required";
    requiredUnknown: boolean;
    compensationStarted: boolean;
  };
  policyEffect: "none";
};
```

这些类型是草案语言，不要求当前 Runtime 立即新增 public API。

## 链路不变量

- 每个 `EvidenceChainLinkV1` 对应一次独立 invocation。
- child step 的 `parentInvocationId` 不继承 parent 的 policy、consent、trust、quota 或 credential。
- `sourceResultDigest` 只证明派生来源，不授权下游外发。
- `planHash` 不改变 step 的 policy decision，也不能让 `ask` 变成 `allow`。
- `consentReceipt.inputHash` 必须绑定当前 step input，不能复用 parent step input hash。
- `unknown_after_timeout` 会把 required downstream execution 推入 manual review 或 reconcile，不自动继续危险 step。
- compensation 是新的 evidence chain branch，必须使用独立 capability identity、policy、consent 和 audit event。

## Audit 映射

当前 Runtime 已有足够的基础 evidence：

- `compositionContext`：`compositionId`、`parentInvocationId`、`stepId`、`stepIndex`、`stepName`、`initiatedBy`、`planHash` 和 `policyEffect=none`。
- `inputProvenance`：`inputHash`、`inputSource`、`derivedFromInvocationId`、`sourceResultDigest` 和 transformations。
- `policyTrace`：policy set、revision、decision、matched rule 和 reason code。
- consent receipt：`consentId`、decision、channel、subject、input hash 和 policy rule id。
- execution evidence：outcome、requestStarted、provider request id、retry attempt、idempotency key hash 和 reconcile hint。

Future aggregation 可以为每个 audit event 计算 `sourceAuditHash`，用于证明链路记录来自某个脱敏 audit record。`sourceAuditHash` 不应包含 raw input/output/secret。

## CLI / Console 行为

未来只读 inspection 可以从 audit log 聚合：

```bash
opencap composition inspect <composition-id>
```

输出应展示 step id、capability id、policy decision、consent decision、execution outcome、plan hash 和 recovery hint。输出不得展示 raw plan、raw input、provider raw output、secret、Authorization、Cookie 或未脱敏 URL query。

## 失败与恢复

- 如果某个 required step 是 `unknown_after_timeout`，composition summary 至少是 `unknown`。
- 如果 manifest 提供 `execution.reconcile`，inspection 可以提示 manual/provider lookup，但不能自动 retry。
- 如果 duplicate invocation detector 命中 `unknown_outcome_pending`，后续同类写操作应被阻断或要求确认，并写入 audit。
- 如果用户选择 compensation，compensation step 从新的 invocation 开始，形成新的 chain link。

## 验证计划

当前草案的验证方式：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
pnpm validate
git diff --check
```

Future implementation tests：

- `planHash` 不能影响 policy allow/ask/deny。
- evidence chain export 不包含 raw plan、raw input、raw output 或 secret。
- derived input step 会重新分类、重新 egress policy，并生成新的 input hash。
- required upstream `unknown_after_timeout` 会让 composition summary 标记为 `unknown` 或 `manual_review_required`。
- compensation step 使用新的 consent receipt 和新的 audit event。

## 关联文档

- `rfcs/0017-composition-profile-v1.md`
- `docs/设计/multi-step-execution-boundary.md`
- `docs/设计/composition-boundary-v1.md`
- `docs/质量/input-provenance-v1.md`
- `docs/设计/audit-log-v1.md`
- `docs/运营/composition-failure-runbook.md`
