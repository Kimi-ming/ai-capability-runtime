# Retry and Idempotency V1：重试与幂等

本文定义 OpenCap V1 对自动重试、幂等键和重复调用的处理原则。

## 基本原则

- 只有同时满足“错误可重试”和“操作可安全重复”时，Runtime 才能自动 retry。
- 写操作默认不自动 retry。
- POST/PATCH 默认不幂等。
- 幂等声明必须来自 manifest 或 provider 文档，不能由模型猜测。
- 超时后的状态可能未知，不能假装没有副作用。

## 错误分类

| 错误 | 默认可重试 | 说明 |
| --- | --- | --- |
| DNS/连接临时错误 | yes | 仅当操作幂等或未发出请求 |
| HTTP 408 | yes | 请求超时 |
| HTTP 429 | yes | 需要 backoff，尊重 Retry-After |
| HTTP 500/502/503/504 | yes | 仅幂等操作自动 retry |
| HTTP 400/401/403/404 | no | 配置、权限或资源问题 |
| schema validation error | no | 请求前失败 |
| policy denied | no | 安全决策 |

参考 Google Cloud retry guidance：是否安全 retry 取决于响应类型和操作幂等性。

## Idempotency 模式

| 模式 | 含义 | V1 状态 |
| --- | --- | --- |
| `none` | 无幂等保证 | 默认 |
| `method` | HTTP method 本身幂等 | GET/HEAD/OPTIONS/PUT/DELETE 参考 |
| `provider_key` | provider 支持 Idempotency-Key 或等价机制 | RFC 草案 |
| `conditional` | 需要 ETag、If-Match、version 等前置条件 | 后续 |
| `external_reconcile` | 通过查询确认是否已发生 | 后续 |

## Idempotency-Key

IETF HTTPAPI 工作组的 Idempotency-Key 草案定义了用于让 POST/PATCH 等非幂等方法具备容错重试能力的请求头。该草案仍是 Internet-Draft，OpenCap 可以参考，但不能把它当成所有 provider 都支持的事实。

OpenCap 规则：

- provider 文档明确支持时才能发送 `Idempotency-Key`。
- key 必须和 invocation/request payload 绑定。
- 同一个 key 不得用于不同 payload。
- audit log 只记录 key hash，不记录完整 key。
- key 生成默认使用 invocation id 或 UUID。

## Host 重复调用

即使 Runtime 不自动 retry，AI Host 也可能因为模型策略或用户再次请求而重复调用同一个 tool。

V1 防线：

- audit log 记录 input hash。
- consent receipt 绑定 invocation id 和 input hash。
- future duplicate detector 可以提示“类似调用已发生”。

不做：

- V1 不提供 exactly-once 语义。
- V1 不阻止用户明确再次执行。
- V1 不跨机器去重。

## Retry Policy 草案

```yaml
execution:
  retry:
    automatic: false
    max_attempts: 1
    backoff:
      strategy: exponential_jitter
      initial_ms: 500
      max_ms: 5000
    retryable_status:
      - 408
      - 429
      - 500
      - 502
      - 503
      - 504
```

V1 默认：

```yaml
automatic: false
max_attempts: 1
```

## Retry-After

当 provider 返回 `Retry-After` 时，Runtime 可以把它记录为 recommendation。V1 不需要自动等待执行，但后续 retry engine 应尊重它。

## 测试要求

- POST 无 idempotency 声明时不自动 retry。
- GET 在显式 retry policy 下可 retry 408/429/5xx。
- 401/403 不 retry。
- timeout after request 返回 unknown，不自动 retry 写操作。
- idempotency key 不写入明文日志。
- 相同 idempotency key + 不同 payload 被拒绝或报警。

## 关联任务

- T169：retry/idempotency manifest RFC。
- T170：retry policy tests。
- T171：duplicate invocation detector 草案。
