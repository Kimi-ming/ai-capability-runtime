# 用量计量 V1

本文定义 OpenCap V1 如何记录本地用量。V1 的 usage metering 是本地可观测和安全控制基础，不是账单系统。

## 目标

Usage metering 用来回答：

- 哪个 Capability 被调用了多少次。
- 哪些调用成功、失败、阻塞、未知。
- 每次调用消耗了多少本地 Runtime 时间和外部请求次数。
- 是否触发 quota、budget、rate limit 或 abuse control。
- 未来是否能导出到 Cloud/账单系统，但 V1 不直接计费。

## 非目标

V1 不做：

- 付费账单。
- 商家结算。
- 交易授权。
- 税务和发票。
- 多租户 usage aggregation。
- paid capability marketplace。

## Usage Event

V1 可以从 audit log 派生 usage event，也可以未来写入独立表。

```ts
type UsageEventV1 = {
  schema: 'opencap.usage_event.v1';
  eventId: string;
  invocationId: string;
  capabilityId: string;
  capabilityVersion: string;
  provider?: string;
  category?: string;
  subject: 'local_user' | 'unknown';
  channel: 'cli' | 'mcp' | 'console' | 'api';
  startedAt: string;
  completedAt?: string;
  generatedAt: string;
  outcome: 'success' | 'blocked' | 'failed_before_request' | 'failed_after_request' | 'unknown_after_timeout' | 'partial' | 'dry_run';
  status: 'executed' | 'dry_run' | 'blocked' | 'denied';
  risk: string;
  requestStarted: boolean;
  dryRun: boolean;
  httpRequestCount: number;
  intentCount: 1;
  retryAttempt: number;
  durationMs?: number;
  quotaDecision?: 'allowed' | 'blocked' | 'warned';
  budgetDecision?: 'allowed' | 'blocked' | 'warned';
  lifecycleStatus?: string;
  sourceAuditHash: string;
  policyEffect: 'none';
  billingEffect: 'none';
};
```

当前 `@opencap/runtime` 导出 `createUsageEventFromAuditEvent(auditEvent, options)` 和 `USAGE_EVENT_SCHEMA`。该 helper 从 audit event 派生 usage event，只保留可聚合 metadata、retry attempt、requestStarted、dry-run 状态和 `sourceAuditHash`，不复制 input/output 原文、credential redaction 字段或 provider raw response。

## Usage Event 与 Audit Log 的区别

| 项 | Audit Log | Usage Event |
| --- | --- | --- |
| 目的 | 追踪安全和执行证据 | 聚合用量和额度 |
| 粒度 | invocation 证据完整 | 可聚合摘要 |
| 敏感性 | 可能包含脱敏 input hash | 不含 input/output |
| 删除策略 | 遵守 privacy retention | 可更短保留 |
| 是否账单 | 否 | V1 仍然否 |

## 计量维度

V1 推荐维度：

- capability id
- capability version
- category
- provider
- risk
- channel
- outcome
- request started yes/no
- dry-run yes/no
- retry attempt
- source audit hash
- quota/budget decision
- duration bucket
- lifecycle status

不记录：

- secret 原文
- input/output 原文
- Authorization header
- full URL query
- 用户私有数据

## 本地命令草案

```bash
opencap usage summary --since 7d
opencap usage capability github.create_issue
opencap usage export --format jsonl
```

V1 不要求立刻实现这些命令，但 audit schema 应避免未来无法派生。

## Usage Export

未来导出格式应是 append-only JSONL：

```json
{"schema":"opencap.usage_event.v1","eventId":"ue_123","capabilityId":"github.create_issue","outcome":"success","risk":"write","durationMs":1200,"billingEffect":"none"}
```

导出必须默认不含 input/output。

## 关联任务

- T198：usage event schema。
- T205：usage export format。
- T143：从 audit log 派生本地指标命令草案。
