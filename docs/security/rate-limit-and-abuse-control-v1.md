# Rate Limit and Abuse Control V1：限流与滥用控制

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

### Provider rate limit

外部 provider 返回 429 或 RateLimit headers。Runtime 应记录 provider 的 rate limit evidence，并避免自动重试非幂等操作。

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
