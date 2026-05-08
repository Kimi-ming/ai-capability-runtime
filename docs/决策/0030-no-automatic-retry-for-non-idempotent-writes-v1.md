# 架构决策 0030：V1 不自动重试非幂等写操作

日期：2026-05-07

状态：已接受

## 背景

OpenCap 会代表 AI Host 调用真实世界 API。写操作在超时、连接断开或 5xx 时可能已经产生副作用。如果 Runtime 自动重试非幂等写操作，可能重复创建 issue、重复发送消息或重复付款。

## 决策

V1 不自动重试非幂等写操作。POST/PATCH 默认视为非幂等，除非 manifest 和 provider 文档明确声明 idempotency 机制。

## 影响

- HTTP executor V1 默认 `max_attempts = 1`。
- 写操作超时返回 `unknown_after_timeout`。
- Runtime 可以记录 retry recommendation，但不自动执行。
- 后续 idempotency key 支持必须走 RFC。
