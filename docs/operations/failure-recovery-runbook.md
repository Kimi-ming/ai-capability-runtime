# Failure Recovery Runbook：失败恢复手册

本文定义 OpenCap 在真实执行失败、超时或状态未知时如何指导用户和维护者恢复。

## 恢复原则

- 先判断请求是否已经发出。
- 再判断外部服务是否可能产生副作用。
- 不把 timeout 简化成失败。
- 不自动重复高风险操作。
- 优先 reconcile，再 retry。

## 常见场景

### 请求前失败

例子：

- manifest validation failed
- policy denied
- confirmation declined
- secret missing
- outbound policy blocked

语义：未发出外部请求。

处理：

1. 修正输入、策略或配置。
2. 重新执行。
3. audit log 保留失败原因。

### 请求后 provider 返回 4xx

例子：

- 401 unauthorized
- 403 forbidden
- 404 repo not found
- 422 validation failed

语义：请求已发出，provider 明确拒绝或无法处理。

处理：

1. 不自动 retry。
2. 检查凭据权限、资源 ID、输入字段。
3. 如果 provider 返回 request id，记录在 audit 中。

### 请求后 provider 返回 5xx/429

语义：可能是临时错误。

处理：

1. 如果是只读或幂等操作，可以按 retry policy 重试。
2. 如果是写操作，先检查 provider 是否支持 idempotency key。
3. 如果没有幂等保证，返回用户可见的 retry warning。

### 请求超时或连接断开

语义：状态未知。外部服务可能已经执行。

处理：

1. 标记 outcome 为 `unknown_after_timeout`。
2. 不自动重试写操作。
3. 使用 reconcile hint 查询外部状态。
4. 若确认未执行，再由用户决定是否重试。

## Reconcile

Reconcile 是“确认外部状态”的动作，不是补偿动作。

示例：

- 创建 GitHub Issue 超时后，用 title/body hash 搜索最近创建的 issue。
- 发送 Slack 消息超时后，用 timestamp 或 external id 查询。
- 创建部署超时后，用 provider deployment list 查询。

V1 可以先把 reconcile 作为文档提示，不要求自动执行。

## Compensation

Compensation 是“修正已经发生的副作用”。它比 retry 更危险。

V1 不自动 compensation。后续如果支持，必须满足：

- compensation capability 独立声明 permissions。
- 需要新的 policy 和 consent。
- 原 invocation 和 compensation invocation 都写 audit。
- 不把 compensation 描述为 rollback guarantee。

## 用户提示模板

### Unknown after timeout

```text
OpenCap sent the request, but did not receive a final response before timeout.
The external service may have completed the operation.
Do not retry automatically unless you can confirm the operation did not happen.
```

### Non-idempotent retry blocked

```text
This operation may create duplicate side effects.
OpenCap did not retry it automatically.
Check the external service or use a reconcile capability before retrying.
```

## 审计要求

每个失败恢复场景至少记录：

- invocation id
- capability id
- request_started yes/no
- outcome
- status/error category
- retry recommendation
- reconcile hint
- provider request id if available

## 关联任务

- T168：unknown outcome audit tests。
- T171：duplicate invocation detector 草案。
- T172：reconcile hint manifest field。
