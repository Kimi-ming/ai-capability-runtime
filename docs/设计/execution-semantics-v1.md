# 执行语义 V1

本文定义 OpenCap Runtime 如何理解一次 Capability 调用的执行语义。它回答：这个调用是不是只读、是否有副作用、失败后能否重试、超时后状态是否未知，以及审计日志应如何表达这些事实。

## 为什么需要执行语义

AI Host 调用工具时，最危险的状态不是简单的成功或失败，而是：

- 请求已经发出，但客户端超时。
- 外部服务创建了资源，但 Runtime 没收到响应。
- Host 重试同一个 tool call，导致重复创建。
- 写操作部分成功，后续步骤失败。
- 审计日志只有错误文本，无法判断真实副作用。

OpenCap 必须把这些情况作为一等状态，而不是把它们藏在 HTTP executor 里。

## 执行分类

| 分类 | 含义 | 默认重试 |
| --- | --- | --- |
| `read` | 只读查询，不请求外部状态变化 | 可按 retry policy 重试 |
| `write` | 创建或修改资源 | 默认不自动重试 |
| `send` | 对外发送消息、通知、邮件 | 默认不自动重试 |
| `destructive` | 删除、覆盖、不可逆操作 | 不自动重试 |
| `financial` | 支付、扣费、交易 | 不自动重试，必须人工确认 |
| `code_execution` | 执行代码或命令 | 不自动重试 |

风险等级来自 `permissions.risk`，但 executor 还需要生成 execution semantics summary。

## Invocation 状态机

```text
planned
  -> policy_allowed
  -> consent_granted
  -> secret_resolved
  -> request_started
  -> response_received
  -> output_normalized
  -> audited
```

失败或阻塞状态：

```text
validation_failed
policy_denied
confirmation_required
confirmation_declined
secret_missing
request_failed
request_timeout_unknown
response_unparseable
audit_failed
```

`request_timeout_unknown` 很重要：它不是普通失败。它表示 OpenCap 不知道外部服务是否已经执行了副作用。

## Outcome 分类

| Outcome | 含义 | 用户语义 |
| --- | --- | --- |
| `success` | 外部服务返回成功，output 已归一化 | 操作完成 |
| `blocked` | policy/consent 阻止执行 | 未执行 |
| `failed_before_request` | 请求未发出前失败 | 未执行 |
| `failed_after_request` | 请求发出后收到失败响应 | 可能未完成，取决于 provider |
| `unknown_after_timeout` | 请求发出后超时或连接断开 | 状态未知，需要 reconcile |
| `partial` | 多步能力部分完成 | 需要补偿或人工处理 |

V1 HTTP Capability 通常是单步能力，但仍要记录 `unknown_after_timeout`。

## HTTP Method 映射

HTTP 规范中，GET/HEAD/OPTIONS 是 safe；GET/HEAD/OPTIONS/PUT/DELETE 通常是 idempotent；POST/PATCH 不保证幂等。OpenCap 不应只根据 method 猜测业务安全性，但 method 是默认线索。

| Method | 默认 safe | 默认 idempotent | OpenCap 默认 |
| --- | --- | --- | --- |
| GET | yes | yes | 可重试读操作 |
| HEAD | yes | yes | 可重试读操作 |
| OPTIONS | yes | yes | 可重试读操作 |
| PUT | no | yes | 需 manifest 明确 risk |
| DELETE | no | yes | destructive，不自动重试 |
| POST | no | no | 不自动重试，除非声明 idempotency |
| PATCH | no | no | 不自动重试，除非声明 idempotency |

## Manifest 扩展草案

V1 schema 可以先不实现，但设计应预留：

```yaml
execution:
  method: POST
  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues
  timeout_ms: 10000
  effects:
    kind: write
    idempotency:
      mode: provider_key
      header: Idempotency-Key
      key_template: "{{invocation_id}}"
    retry:
      automatic: false
      retryable_status:
        - 408
        - 429
        - 500
        - 502
        - 503
        - 504
    reconcile:
      capability: github.search_issue_by_title
```

## V1 决策

V1 不自动重试写操作。V1 可以记录 retry recommendation，但不执行自动 retry。

允许：

- 只读 GET dry-run 和真实调用按显式 retry policy 重试。
- 写操作超时后返回 `unknown_after_timeout`。
- 审计日志记录 provider request id、response status、timeout、retry recommendation。

禁止：

- POST/PATCH 写操作默认自动重试。
- Host 因 tool call error 自动重新调用时绕过 Runtime 去重。
- timeout 被描述成“失败且未执行”。
- 无 idempotency key 的金融、发送、创建类操作自动 retry。

## 审计字段

Runtime 已在 `@opencap/runtime` public contract 中导出 execution outcome、side-effect kind 和 execution evidence 类型，并提供 `createHttpExecutionEvidence()` 从 HTTP execution result 与 permissions 生成 evidence。HTTP execution audit event、Result Envelope evidence 和 SQLite audit logger 都会保存同一组语义字段。

Audit log 记录的核心字段：

```ts
type ExecutionEvidence = {
  outcome: 'success' | 'blocked' | 'failed_before_request' | 'failed_after_request' | 'unknown_after_timeout' | 'partial';
  sideEffectKind: 'read' | 'write' | 'send' | 'destructive' | 'financial' | 'code_execution';
  requestStartedAt?: string;
  responseReceivedAt?: string;
  providerRequestId?: string;
  httpStatus?: number;
  retryAttempt: number;
  idempotencyKeyHash?: string;
  reconcileHint?: string;
};
```

## 测试要求

- policy deny 不产生 request_started。
- secret missing 不产生 request_started。
- HTTP timeout after request 产生 `unknown_after_timeout`。
- POST 默认 retryAttempt 为 0。
- GET 可按显式 retry policy 记录 retryAttempt。
- provider request id 进入 audit，但不进入 secret 字段。
- dry-run 不产生外部 request evidence。

## 关联任务

- T052：HTTP executor。
- T060：invoke dry-run。
- T132：audit failure preflight。
- T167：execution semantics types。
- T168：unknown outcome audit tests。
- T169：retry/idempotency manifest RFC。
