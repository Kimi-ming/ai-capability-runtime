# RFC 0017：Composition Profile V1

## 状态

草案

## 摘要

Composition Profile V1 定义 OpenCap 未来如何表达多步 Capability invocation 的组合上下文、step evidence、plan hash 和失败恢复语义。该 profile 不把 OpenCap 变成 Agent、workflow runtime 或低代码编排器；它只让外部 Host/Agent 发起的多个单步 invocation 可以被 Runtime 审计、关联和恢复。

核心原则：组合不是一个大授权。每个 step 都必须独立经过 validation、policy、consent、secret resolver、outbound/data egress、execution 和 audit。

## 背景

OpenCap V1 已经建立单步 Capability invocation 的安全闭环，并已为未来组合落下若干基础证据：

- `compositionContext` audit evidence：composition id、parent invocation、step metadata、initiator、plan hash 和 `policyEffect=none`。
- `inputProvenance` evidence：tool-derived input、source invocation、source result digest 和 transformations。
- `execution` evidence：step outcome、side-effect kind、provider request id、retry attempt 和 reconcile hint。
- duplicate/retry/reconcile 草案：避免 unknown outcome 被误重试或重复扩大副作用。

Composition profile 需要把这些字段组织成 profile 级约束，避免未来实现把组合误做成 workflow runtime 或 workflow-level consent。

相关决策：

- `docs/决策/0032-no-built-in-workflow-runtime-v1.md`
- `docs/决策/0033-step-level-policy-consent-audit.md`
- `docs/决策/0034-compensation-is-a-capability.md`

## Profile 标识

```text
opencap.composition.profile.v1
```

该 profile 表示一组 invocation 可以用共同 composition context 关联。它不表示：

- OpenCap 会规划、调度或重试整个 plan。
- Host 可以用一次 consent 覆盖所有 step。
- 上游 step 的 allow/consent/trust 结论会传递给下游 step。
- plan hash 证明计划正确、完整或安全。
- compensation 是自动 rollback。

## 目标

- 定义 composition context、step record、plan hash 和 evidence chain 的最小 profile。
- 固定 step-level policy/consent/audit 不变量。
- 定义 composition outcome 与 step outcome 的关系。
- 定义 unknown、partial、blocked、failed 和 compensation 场景的恢复语义。
- 给 CLI/MCP/未来 Host adapter 和 conformance suite 提供统一 profile 语言。

## 非目标

- 不实现 workflow DSL。
- 不实现自动调度、条件分支、循环、定时器或并发执行。
- 不实现跨 step 事务、exactly-once、自动 rollback 或自动 compensation。
- 不定义 UI workflow builder。
- 不让 Registry 声明“组合一定正确”。
- 不把 profile 暴露成模型可自由修改的授权通道。

## 术语

| 术语 | 定义 |
| --- | --- |
| composition | 一组由外部 Host/Agent 关联的单步 Capability invocation。 |
| step | composition 中的单次 Capability invocation。 |
| plan hash | 外部计划的稳定摘要，只用于 evidence correlation，不保存 raw plan。 |
| parent invocation | 派生当前 step 的上游 invocation。 |
| composition outcome | 多个 step 的汇总状态，不覆盖单个 step outcome。 |
| compensation | 独立 Capability invocation，用于处理已发生副作用后的修正动作。 |

## Context shape

Host 或 adapter 可以在调用 Runtime 时提供可选 composition context。当前 Runtime audit evidence 已支持等价字段：

```ts
interface CompositionContextV1 {
  profile: "opencap.composition.profile.v1";
  compositionId: string;
  parentInvocationId?: string;
  stepId?: string;
  stepIndex?: number;
  stepName?: string;
  initiatedBy: "host" | "user" | "runtime" | "external_agent";
  planHash?: string;
  policyEffect: "none";
}
```

字段规则：

- `compositionId` 是本地 correlation id，不是 authorization token。
- `parentInvocationId` 只说明派生关系，不能继承上游授权。
- `stepIndex` 只用于排序和展示；Runtime 不保证按顺序执行。
- `stepName` 必须是安全 label，不得包含 raw user instruction、secret、token 或 provider raw response。
- `planHash` 只保存 hash，不保存 raw plan。
- `policyEffect` 必须为 `none`。

## Step record

Composition profile 的最小 step record 由现有 evidence 组成：

```ts
interface CompositionStepRecordV1 {
  profile: "opencap.composition.profile.v1";
  compositionContext: CompositionContextV1;
  capabilityIdentityKey: string;
  inputHash: string;
  inputProvenance?: {
    inputSource: "user_supplied" | "model_generated" | "tool_derived" | "runtime_generated";
    derivedFromInvocationId?: string;
    sourceResultDigest?: string;
  };
  policyDecision: "allow" | "ask" | "deny";
  consentDecision?: "approved" | "rejected" | "unavailable" | "expired";
  executionOutcome?: "success" | "blocked" | "failed_before_request" | "failed_after_request" | "unknown_after_timeout" | "partial";
  requestStarted?: boolean;
  reconcileHint?: string;
}
```

Step record 可以由 audit log、Result Envelope evidence 和 future interop evidence record 共同生成。它不得要求 Runtime 保存 input/output 原文。

## Composition outcome

Composition outcome 是汇总视图，不能覆盖 step outcome。

| Outcome | 条件 |
| --- | --- |
| `completed` | 所有 required step 都成功。 |
| `blocked` | 某个 required step 被 policy、consent、quota/budget、outbound 或 lifecycle gate 阻断。 |
| `failed` | 某个 required step 明确失败，且无继续路径。 |
| `unknown` | 任一步 request 已开始但 outcome unknown。 |
| `partial` | 部分 step 成功，部分 step 未执行、失败或被阻断。 |
| `compensating` | 用户正在执行独立 compensation capability。 |
| `manual_review_required` | 需要人工判断外部状态或补偿关系。 |

Runtime 可以生成 step evidence，但不需要在 V1 维护 composition state machine。Future CLI/Console 可以从 audit log 聚合 outcome。

## Runtime pipeline

每个 step 必须独立进入 Runtime pipeline：

```text
validate manifest/input
  -> attach optional compositionContext evidence
  -> compute input hash and input provenance
  -> policy and local gates
  -> confirmation / consent
  -> audit preflight
  -> secret resolver
  -> outbound / data egress gates
  -> execution
  -> audit result
```

Profile 不允许以下捷径：

- composition-level allow 覆盖 step-level deny/ask。
- plan hash 覆盖 policy revision、trust level、quota/budget、data egress 或 outbound policy。
- parent invocation 的 consent 覆盖 child step consent。
- compensation step 复用原 step consent。

## MCP / Host 行为

MCP adapter 可以把 composition context 作为 Runtime-private metadata 传入 Runtime，但不得把它作为模型可自由编辑的 tool schema 字段。若 Host 不支持安全 metadata channel，composition context 可以缺省；Runtime 仍按单步 invocation 执行。

MCP `tools/call` 返回的 Result Envelope 不因 profile 改变 shape。Future adapter 可以在 `_meta` 或 evidence summary 中展示 `compositionId`、`stepId` 和 `planHash`，但不能展示 raw plan、secret 或 provider raw output。

## Failure and recovery

- `unknown_after_timeout` step 会让 composition outcome 至少为 `unknown`。
- downstream step 不应在 required upstream step unknown 时自动执行，除非 future profile 明确声明 independent step 并仍经过 policy/consent。
- retry 必须遵守 Retry/Idempotency Manifest Profile；非幂等写操作不自动 retry。
- duplicate invocation detector 可以阻断 unknown pending 的重复写 step。
- compensation 必须是独立 Capability invocation，并重新进入 policy/consent/audit。

## Audit 和 Evidence

Composition profile 依赖以下 evidence：

- `compositionContext`：composition id、step metadata、initiator、plan hash、`policyEffect=none`。
- `inputProvenance`：derived input 来源和 source result digest。
- `execution`：step outcome、requestStarted、provider request id、reconcile hint。
- `consent receipt`：每个 ask step 的独立 consent evidence。
- `policyTrace`：每个 step 的 policySetId、policyRevision、matched rule 和 reason code。

更细的 plan hash 和 evidence chain 组织方式见 `docs/设计/plan-hash-evidence-chain-v1.md`。该草案把 profile evidence 聚合为只读链路，并明确 `planHash`、`parentInvocationId`、`sourceResultDigest` 和 `sourceAuditHash` 均为 evidence correlation，不是 policy authority。

不得包含：

- raw plan。
- raw input/output。
- model chain-of-thought 或自由计划文本。
- secret、token、cookie、Authorization。
- provider raw response、raw logs 或 private URLs beyond existing redacted evidence。

## 示例

```yaml
composition:
  profile: opencap.composition.profile.v1
  composition_id: cmp_release_update
  plan_hash: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
steps:
  - step_id: create_issue
    step_index: 0
    capability_id: github.create_issue
    input_hash: sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    required: true
  - step_id: send_slack_update
    step_index: 1
    capability_id: slack.send_message
    parent_invocation_id: inv_create_issue
    required: false
```

该示例只展示 profile metadata，不包含真实 provider URL、token、用户正文、生产日志或 provider response。

## 兼容性和迁移

- 当前 Runtime 已支持 `compositionContext` audit evidence；profile RFC 不要求新增 workflow runtime。
- 旧 Runtime 可以忽略 composition context，仍按单步 invocation 执行。
- SQLite audit schema 已通过新增 JSON 列迁移 composition context；后续如果拆成列，需要保留 JSON 兼容读取。
- MCP result shape 不改变；Host compatibility claim 必须说明是否保留 Runtime-private composition metadata。
- `0.x` 阶段可调整 profile 字段，但必须同步 docs、conformance 和 release notes。

## 验证计划

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
pnpm validate
```

Future implementation tests:

- `compositionContext` does not affect policy allow/ask/deny.
- child step with `parentInvocationId` still requires independent consent when policy asks.
- unknown required step marks composition summary as unknown.
- compensation step uses independent capability identity、policy、consent 和 audit。
- evidence export contains hashes and ids, not raw plan/input/output/secret。

## 发布和运维

- RFC 合并后仍为草案，不作为 alpha workflow feature 宣称。
- Release notes 必须说明 OpenCap 不提供 workflow runtime、automatic composition 或 rollback guarantee。
- Compatibility evidence 必须区分 “Runtime records composition context” 和 “Host preserves/displays composition context”。
- Runbook 应继续把 partial/unknown composition 导向 manual review、reconcile 和独立 compensation capability。

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
| 在 V1 内置 workflow runtime | 会把 OpenCap 推向 Agent/automation platform，扩大范围并削弱 Capability Runtime 定位。 |
| workflow-level consent 覆盖所有 step | 高风险 step 可能被隐藏，违背 step-level policy/consent/audit 决策。 |
| 保存 raw plan 便于调试 | raw plan 可能含用户数据、业务上下文、secret 或模型输出，应只保存 hash 和安全 label。 |
| compensation 自动 rollback | 外部 API 副作用不可保证可逆，compensation 必须是独立 Capability。 |

## 开放问题

- `planHash` 是否需要固定 canonical JSON 格式，还是保持 Host-provided digest。
- composition summary 是否应落入独立 conformance record。
- optional step、parallel step 和 independent step 是否需要 profile 子版本。
- CLI/Console 是否需要 `opencap composition inspect` 聚合 audit records。

## 决策结果

评审结束后填写。
