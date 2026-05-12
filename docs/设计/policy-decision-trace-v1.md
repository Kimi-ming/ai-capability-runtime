# 策略决策追踪 V1

本文定义 OpenCap Runtime 如何解释一次 allow/ask/deny/redact/block 决策的来源。

## 为什么需要 Decision Trace

Policy Engine 不能只返回一个字符串。如果用户问“为什么这次调用被允许/阻止”，维护者必须能回答：

- 使用了哪个 policy 文件或 policy bundle。
- 匹配了哪条规则。
- 哪些输入事实参与了匹配。
- 哪些 gate 先于 policy 阻断。
- fallback/default 为什么生效。
- 这次决策是否因为 override/breakglass 改变。

## Trace 对象

```ts
type PolicyDecisionTraceV1 = {
  traceVersion: "opencap.policy_trace.v1";
  invocationId: string;
  policySetId: string;
  policyRevision: string;
  gate: "data_egress" | "risk_policy" | "quota" | "budget" | "outbound" | "lifecycle";
  decision: "allow" | "ask" | "deny" | "redact" | "block";
  matchedRuleId?: string;
  defaultDecisionUsed: boolean;
  evaluatedFacts: string[];
  reasonCode: string;
  humanReadableSummary: string;
  secretResolutionAllowed: boolean;
  executionAllowed: boolean;
  override?: PolicyOverrideSummaryV1;
};
```

## Evaluated Facts

V1 trace 不保存完整 input 原文，只保存事实名和脱敏摘要：

```json
{
  "evaluatedFacts": [
    "capability_id=github.create_issue",
    "risk=write",
    "data_class=source_code",
    "target_origin=https://api.github.com"
  ]
}
```

## Gate 顺序

每个 gate 都可以产生 trace：

```text
input classification
  -> data egress trace
  -> risk policy trace
  -> quota/budget trace
  -> outbound trace
  -> lifecycle/advisory trace
```

最终 invocation 可以有多个 trace，但只能有一个有效决策摘要。

## 有效决策摘要

```ts
type EffectiveDecisionSummaryV1 = {
  finalDecision: "allow" | "ask" | "deny" | "block";
  blockingGate?: string;
  traceIds: string[];
  confirmationRequired: boolean;
  secretResolutionAllowed: boolean;
  executionAllowed: boolean;
};
```

## Runtime 实现状态

截至 2026-05-12，`@opencap/runtime` 已新增 `PolicyDecisionTraceV1` 公共类型和 `POLICY_TRACE_VERSION`：

- `evaluatePolicy()` 会在 `PolicyEvaluationResult.decisionTrace` 中返回 risk policy trace。
- `evaluateDataEgressPolicy()` 会在 `DataEgressDecisionResult.decisionTrace` 中返回 data egress trace。
- trace 包含 `policySetId`、`policyRevision`、`gate`、`decision`、`matchedRuleId`、`defaultDecisionUsed`、`evaluatedFacts`、`reasonCode`、`secretResolutionAllowed` 和 `executionAllowed`。
- `AuditEvent.policyTrace` 已接入内存审计和 SQLite `policy_trace_json` 持久化。
- CLI 直接写入的 dry-run/blocked 审计事件会携带 risk policy trace；data egress audit 会携带 data egress trace。
- trace 只记录 capability、risk、resource/action、provider、target origin、data classes 和字段 path/destination 等脱敏事实，不保存 input 原文或 secret value。

## MCP/CLI 暴露

- CLI 可以在 `--explain` 中展示 trace summary。
- MCP result 只返回简短 reason code，不返回内部 policy 全量内容。
- audit log 保存 redacted trace JSON。

## 测试要求

- matched rule id 进入 trace。
- default decision used 进入 trace。
- deny trace 中 `secretResolutionAllowed=false`。
- override trace 不覆盖 data egress deny。
- trace 不含 input 原文或 secret-like value。

## 关联任务

- T249：policy decision trace。
- T250：policy explain CLI。
- T259：decision log export。
