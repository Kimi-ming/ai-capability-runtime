# 用量证据 V1

本文定义 OpenCap 如何证明某个用量统计来自真实 invocation，而不是随意累加的计数器。

## 证据链

```text
Invocation Audit Log
  -> Execution Evidence
  -> Usage Event
  -> 用量摘要
  -> Future Export / Cloud Sync
```

用量摘要必须能回溯到 invocation id 或聚合窗口。

## 最小字段

```ts
type UsageEvidenceV1 = {
  schema: "opencap.usage_event.v1";
  eventId: string;
  invocationId: string;
  capabilityId: string;
  capabilityVersion: string;
  outcome: string;
  requestStarted: boolean;
  dryRun: boolean;
  httpRequestCount: number;
  intentCount: 1;
  retryAttempt: number;
  durationMs?: number;
  quotaDecision?: string;
  budgetDecision?: string;
  lifecycleStatus?: string;
  sourceAuditHash: string;
  generatedAt: string;
  policyEffect: "none";
  billingEffect: "none";
};
```

## 聚合规则

- success、blocked、failed、unknown 分开统计。
- dry-run 与真实执行分开统计。
- read/write/send/financial 分开统计。
- revoked/deprecated capability 的 usage 单独标记。
- retryAttempt 不应被误算为多个用户 intent，除非明确按 request 计量。
- usage event 保留 `sourceAuditHash`，但不复制 audit 中的 redacted input 或 credential redacted summary。

## 不变量

- usage event 不包含 input/output 原文。
- usage event 不包含 secret。
- usage event 不直接作为账单记录。
- future billing 必须说明从 usage event 到 billable event 的转换规则。

## 测试要求

- blocked invocation 生成 usage event，但 requestStarted=false。
- dry-run usage 与 real execution 分开。
- retryAttempt 不重复计费。
- revoked capability usage 可被查询。
- sourceAuditHash 能关联 audit record。
- usage event 固定 `policyEffect=none` 和 `billingEffect=none`。

## 关联任务

- T198：usage event schema。
- T205：usage export format。
- T207：usage evidence conformance tests。
