# 限流与滥用控制 V1

本文定义 OpenCap V1 如何防止 Capability 被模型、Host 或用户误用成刷请求、刷消息、刷成本或 DoS 触发器。

## Abuse 场景

- 模型陷入循环，反复调用同一工具。
- Host 重试 unknown outcome，导致重复写操作。
- 任意 URL capability 被用于扫内网或大量请求外部域名。
- external_send capability 被用于刷消息。
- financial capability 被用于重复支付或创建订单。

## 控制层

| 控制 | 位置 | 目的 |
| --- | --- | --- |
| Policy | 执行前 | 风险决策 |
| Quota/Budget | 执行前 | 本地额度和预算 |
| Rate Limit | 执行前/执行后 | 频率控制 |
| Outbound Policy | HTTP 前 | 网络边界 |
| Duplicate Detector | Future | 重复调用提示 |
| Advisory/Revocation | 安装/执行前 | 阻断危险能力 |

## Rate Limit Source

OpenCap 可以处理两类限流：

### Local rate limit

本地策略限制调用频率：

```yaml
rate_limits:
  rules:
    - match:
        capability_id: slack.send_message
      limit:
        count: 5
        window: 10m
      decision: ask
```

当前 Runtime 提供 `evaluateAbuseThrottleGate()` 纯 gate helper，用于把本地 usage snapshot 转成统一 `GateDecision`。它不直接读写 audit log 或本地状态；调用方需要传入按 capability/risk/channel/window 聚合后的 count。

实现边界：

- stage 固定为 `pre_secret`，因此超限 `deny` 会阻断 Secret Resolver 和 HTTP execution。
- `ask` 映射为 confirmation required；`warn` 作为 allow gate 返回但保留 evidence。
- evidence 记录 rule id、decision、window、limit、current count、remaining 和哈希化 throttle key。
- evidence 不记录 input/output/secret 原文，也不记录 usage key 原文。
- `defaultExternalSendAbuseThrottleRule()` 提供 `external_send` 默认低频 ask 基线：3 calls / 1m。

### Provider rate limit

外部 provider 返回 429 或 RateLimit headers。Runtime 应记录 provider 的 rate limit evidence，并避免自动重试非幂等操作。

当前 Runtime HTTP executor 会在 provider 返回 429 时把 `providerRateLimit` 放入结构化 `HTTP_ERROR`：

- `providerStatus=429`
- `Retry-After` 秒数或 HTTP date 派生出的 retry recommendation。
- `RateLimit-Reset` 派生出的 reset timestamp。
- 白名单 header 名称：`retry-after`、`ratelimit-reset`。

Rate limit evidence 不记录 provider header 原文，不保存 secret-like header 名称或值。429 仍是 request 已发出后的 HTTP execution result，不被建模为 policy deny；是否 retry 继续由 retry policy / idempotency 语义决定。

## 429 处理

- 记录 status 429。
- 如果有 Retry-After 或 RateLimit reset 信息，记录为 retry recommendation。
- 不自动 retry 写操作。
- 不把 429 当作 policy deny。

## Problem Details

未来 CLI/API 可以用 RFC 9457 Problem Details 风格表达 quota/rate limit 错误：

```json
{
  "type": "https://opencap.dev/problems/quota-exceeded",
  "title": "Quota exceeded",
  "status": 429,
  "detail": "github.create_issue exceeded 20 calls in 1d",
  "capability_id": "github.create_issue"
}
```

## Abuse Evidence

Audit/usage event 应记录：

- rate limit rule id
- current count/window
- provider 429 status
- retry recommendation
- blocked/warned/asked decision

## 测试要求

- local rate limit deny 不执行。
- local rate limit ask 无确认通道时阻塞。
- provider 429 不自动 retry 写操作。
- RateLimit headers 不写入 secret 字段。
- external_send 默认建议更低 quota。

## 关联任务

- T200：provider rate limit handling。
- T201：local abuse throttle。
- T206：problem details for quota/rate errors。
