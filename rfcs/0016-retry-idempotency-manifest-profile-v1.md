# RFC 0016：Retry and Idempotency Manifest Profile V1

## 状态

草案

## 摘要

Retry and Idempotency Manifest Profile V1 定义 OpenCap 未来如何在 Capability Manifest 中声明 retry policy、idempotency key 和 reconcile hint。该 profile 不改变当前 Runtime 默认行为：V1 默认不自动 retry，写操作默认不可安全重复，timeout after request 必须视为 unknown outcome。

核心原则：只有当错误可重试且操作可安全重复时，Runtime 才能自动 retry。幂等声明必须来自 manifest、provider 文档和人工 review，不能由模型、Host 或 HTTP method 猜测。

## 背景

OpenCap 已有 `evaluateHttpRetryPolicy()` 纯 decision helper，用于固定 V1 安全边界：

- 默认 `automatic: false`。
- `maxAttempts: 1`。
- retryable status 默认包含 408、429、500、502、503、504。
- 非幂等写操作不自动 retry。
- request 已发出后的 timeout 写操作返回 `unknown_outcome_requires_reconcile`。
- idempotency key 只以 hash 形式进入 evidence。

当前缺口是 manifest 层还没有稳定字段来表达 provider 文档支持的 idempotency key、conditional request 或 external reconcile 规则。

参考：

- IETF HTTPAPI Idempotency-Key draft-07：<https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header>
- MDN Idempotency-Key header：<https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Idempotency-Key>

## Profile 标识

```text
opencap.retry_idempotency.manifest.v1
```

该 profile 只定义 future manifest 字段草案和 Runtime 解释边界。它不表示：

- 当前 HTTP executor 已实现 automatic retry loop。
- provider 一定支持 `Idempotency-Key`。
- write/financial/destructive operation 可以因为有 retry profile 而绕过 confirmation。
- retry evidence 可以替代 audit、usage evidence 或 reconcile evidence。

## 目标

- 定义 manifest 中 retry 和 idempotency 的最小字段草案。
- 保持默认不自动 retry。
- 明确 non-idempotent write 的保护规则。
- 明确 timeout after request 的 unknown/reconcile 语义。
- 明确 idempotency key 的生成、绑定和脱敏证据边界。

## 非目标

- 不实现 HTTP executor retry loop。
- 不实现 provider-specific idempotency cache。
- 不提供 exactly-once 语义。
- 不阻止用户明确重复执行。
- 不跨机器或跨 Runtime 去重。
- 不定义 billing retry 规则。

## 术语

| 术语 | 定义 |
| --- | --- |
| retryable error | 适合重试的错误，例如 408、429、部分 5xx 或临时网络错误。 |
| repeatable operation | 重复请求不会造成额外不可接受副作用的操作。 |
| idempotency key | provider 用于识别同一 logical operation 的请求键。 |
| payload binding | idempotency key 与请求 payload digest 绑定，防止同一 key 用于不同 payload。 |
| reconcile hint | unknown outcome 后用于查询或人工恢复的 provider request id、resource key 或 query template。 |

## Manifest 字段草案

```yaml
execution:
  retry:
    automatic: false
    max_attempts: 1
    retryable_status:
      - 408
      - 429
      - 500
      - 502
      - 503
      - 504
    backoff:
      strategy: exponential_jitter
      initial_ms: 500
      max_ms: 5000
    respect_retry_after: true
  idempotency:
    mode: none
    key:
      source: runtime_generated
      header: Idempotency-Key
      bind_to_payload: true
    reconcile:
      strategy: manual
      hint: Check provider dashboard or query by client reference.
```

### `execution.retry`

| 字段 | 类型 | 默认 | 规则 |
| --- | --- | --- | --- |
| `automatic` | boolean | `false` | 默认为 false；true 也必须同时满足 retryable error 和 repeatable operation。 |
| `max_attempts` | integer | `1` | 包含首次尝试；必须大于等于 1。 |
| `retryable_status` | number[] | `[408,429,500,502,503,504]` | 只定义候选错误，不保证一定 retry。 |
| `backoff.strategy` | enum | `exponential_jitter` | future executor 使用；当前只作为 profile metadata。 |
| `backoff.initial_ms` | integer | `500` | 必须为正数。 |
| `backoff.max_ms` | integer | `5000` | 必须大于等于 initial。 |
| `respect_retry_after` | boolean | `true` | provider 429/503 有 Retry-After 时应记录并尊重。 |

### `execution.idempotency`

| 字段 | 类型 | 默认 | 规则 |
| --- | --- | --- | --- |
| `mode` | enum | `none` | `none`、`method`、`provider_key`、`conditional`、`external_reconcile`。 |
| `key.source` | enum | 无 | `runtime_generated`、`input_field`、`fixed_prefix_runtime_suffix`。 |
| `key.header` | string | `Idempotency-Key` | 仅 provider 文档明确支持时允许。 |
| `key.input_field` | string | 无 | 仅 source 为 `input_field` 时使用，值不得模型生成 secret。 |
| `key.bind_to_payload` | boolean | `true` | true 时 audit 记录 payload digest，不记录 payload 原文。 |
| `reconcile.strategy` | enum | `manual` | `manual`、`provider_lookup`、`none`。 |
| `reconcile.hint` | string | 无 | Runtime-generated 或 reviewer-written safe text。 |

## Idempotency 模式

| 模式 | 语义 | 自动 retry 条件 |
| --- | --- | --- |
| `none` | 没有幂等保证 | 不允许写操作自动 retry。 |
| `method` | HTTP method 本身幂等 | GET/HEAD/OPTIONS/PUT/DELETE 且 side effect 可接受。 |
| `provider_key` | provider 支持 idempotency key | 必须有 key、payload binding 和 provider 文档引用。 |
| `conditional` | 条件请求，例如 ETag/If-Match | 必须声明条件字段，失败时不重试。 |
| `external_reconcile` | unknown 后通过 provider 查询确认 | 不自动 retry 写操作，只生成 reconcile evidence。 |

## Runtime 解释规则

Runtime 在 future retry loop 中必须按以下顺序判断：

```text
classify error
  -> determine request started / outcome
  -> determine side effect kind
  -> evaluate idempotency mode
  -> evaluate retry policy
  -> if allowed, generate retry evidence
  -> execute retry attempt
  -> audit every attempt
```

当前 Runtime helper 已覆盖 decision/evidence，HTTP executor 暂不执行自动 retry loop。

## 安全规则

- `automatic: true` 不能绕过 policy、confirmation、quota/budget/rate、outbound、secret resolver 或 audit。
- write、financial、destructive operation 默认不可重复。
- timeout after request 的写操作必须进入 unknown/reconcile，不能假装未执行。
- idempotency key 不写入 audit 原文，只记录 `sha256:<prefix>`。
- payload binding 只记录 digest，不保存 payload 原文。
- Retry-After、RateLimit-Reset 只能作为 evidence，不授权再次执行。
- 同一 key 绑定不同 payload 必须 deny 或 warning，不得自动 retry。

## 示例

### 默认不自动 retry

```yaml
execution:
  retry:
    automatic: false
    max_attempts: 1
  idempotency:
    mode: none
```

### Provider key 支持的写操作

```yaml
execution:
  retry:
    automatic: true
    max_attempts: 2
    retryable_status: [408, 429, 500, 502, 503, 504]
    respect_retry_after: true
  idempotency:
    mode: provider_key
    key:
      source: runtime_generated
      header: Idempotency-Key
      bind_to_payload: true
    reconcile:
      strategy: provider_lookup
      hint: Query provider by client reference before retrying manually after unknown outcome.
```

该示例不包含真实 token、provider request id、payload、用户数据或生产日志。

## Audit 和 Evidence

Retry evidence 应包含：

- retryAttempt。
- maxAttempts。
- retryableError。
- operationRepeatable。
- reasonCode。
- idempotencyMode。
- idempotencyKeyHash。
- payloadDigest。
- retryAfterMs / retryAfterAt。
- reconcileHint。

不得包含：

- idempotency key 原文。
- request payload 原文。
- response body 原文。
- secret/token/cookie/Authorization。
- provider raw logs。

## 兼容性和迁移

- 该 RFC 是 future profile，不改变当前 manifest schema。
- 若未来加入 schema，字段应位于 `execution.retry` 和 `execution.idempotency`，旧 Runtime 可忽略未知字段或通过 schema version gate 拒绝。
- `0.x` 阶段可以引入 breaking schema change，但必须同步 versioning 文档和 migration notes。
- MCP result shape 不因 retry profile 改变；adapter 仍接收 Runtime Result Envelope。

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

未来实现 manifest schema 时还必须添加：

- provider_key 模式缺 key header 失败。
- `automatic: true` + `mode: none` + write risk 失败或 warning。
- idempotency key 原文不进入 audit/result/logs。
- timeout after request 写操作返回 unknown/reconcile。
- same key different payload 产生 deny/warning。

## 发布和运维

- RFC 合并后仍是草案，不进入 alpha completed feature。
- 当前 Runtime helper 可作为 profile 行为参考，但 HTTP executor 不执行 retry loop。
- 实现前必须更新 manifest schema、authoring lint、registry review checklist 和 conformance suite。
- 发布说明必须明确 OpenCap 不提供 exactly-once 语义。

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
| 默认对 5xx/429 自动 retry | 对写操作可能造成重复副作用，违背安全默认值。 |
| 只根据 HTTP method 判断幂等 | provider 语义和业务副作用可能不同，method 不足以授权 retry。 |
| 在 audit 中保存 idempotency key 原文 | key 可能关联真实业务请求，应只保存 hash。 |

## 开放问题

- manifest schema 是否应在 V1 前加入 retry/idempotency 字段，还是保持 RFC 到 v0.4/v0.5。
- `input_field` key source 是否允许用户提供，还是只允许 runtime-generated。
- provider lookup reconcile 是否应由独立 capability 表达。
- 是否需要将 payload digest 纳入 Invocation Ledger。

## 决策结果

评审结束后填写：

- 结论：
- 接受/拒绝日期：
- 后续 ADR：
- 后续任务：
