# 审计日志 V1

本文定义 OpenCap V1 的审计日志语义、字段、失败策略和隐私规则。

## 目标

- 每次 Capability 调用可追踪。
- 成功、失败、拒绝、确认缺失都能看到。
- 不把密钥或敏感字段写入日志。
- 支持 `opencap logs` 做本地查询。
- 为未来 OpenTelemetry/export 留字段空间。

## 当前最小实现

当前 Runtime 已有 `AuditLogger` 接口、`InMemoryAuditLogger` 和 `SqliteAuditLogger`。SQLite 实现使用 Node 内置 `node:sqlite`，会自动创建最小 `invocations` 表，并支持写入事件与查询最近记录。审计事件可保存 `input_hash`、`input_redacted_json`、`request_started` 和 Data Egress evidence。当前 Node 对该模块仍会打印 ExperimentalWarning。

## 存储

V1 使用 SQLite：

```text
opencap.local/logs.sqlite
```

ADR：`docs/决策/0006-sqlite-audit-log-v1.md`。

## 表：invocations

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text | request/log id |
| `timestamp` | text | ISO timestamp |
| `channel` | text | `cli` / `mcp` |
| `host` | text | Host 标识，可为空 |
| `capability_id` | text | Capability id |
| `capability_version` | text | version |
| `risk` | text | 聚合风险 |
| `decision` | text | allow/ask/deny |
| `matched_rule_id` | text | policy rule id |
| `policy_set_id` | text | policy set id，可为空 |
| `policy_revision` | text | active policy revision，可为空 |
| `policy_trace_json` | text | redacted decision trace JSON |
| `override_id` | text | 本次生效的 override/breakglass id，可为空 |
| `confirmation_status` | text | not_required/accepted/declined/unavailable |
| `status` | text | success/error/denied/confirmation_required/dry_run |
| `request_started` | integer | 是否已经发起 provider request，egress deny 必须为 `0` |
| `duration_ms` | integer | 耗时 |
| `input_hash` | text | 原始输入稳定 hash |
| `input_redacted_json` | text | 脱敏输入 |
| `input_data_classes_json` | text | 输入数据分类摘要 |
| `egress_decision` | text | allow/ask/deny/redact |
| `egress_data_classes_json` | text | 本次外发涉及的数据类别数组 |
| `egress_target_origin` | text | 外发目标 origin |
| `egress_matched_rule_id` | text | 命中的 data egress policy rule id |
| `egress_redacted_preview_json` | text | 外发预览的脱敏 JSON |
| `output_redacted_json` | text | 脱敏输出 |
| `resolved_url` | text | 脱敏 URL |
| `tool_projection_version` | text | MCP tool projection 版本，例如 `opencap.mcp.tool-projection.v1` |
| `tool_projection_hash` | text | 模型可见 tool projection 的稳定 SHA-256 hash |
| `tool_projection_hash_algorithm` | text | projection hash 算法，V1 为 `sha256` |
| `error` | text | 错误摘要 |


## 隐私分级

审计字段按默认可记录程度分为四级：

| 等级 | 默认行为 | 示例 |
| --- | --- | --- |
| `public_metadata` | 可记录原值 | `capability_id`、`version`、`channel`、`status`、`policy_decision` |
| `operational_metadata` | 可记录原值，但避免包含用户内容 | `duration_ms`、`matched_rule_id`、`outbound_decision`、`body_kind` |
| `redacted_user_data` | 只能记录脱敏摘要或 hash | tool input、provider output、URL query、错误响应摘要 |
| `never_record_secret` | 永不记录原文 | token、api key、Authorization、Cookie、password、private key、OAuth refresh token |

默认写入策略：

- `public_metadata` 和 `operational_metadata` 可以直接进入 SQLite。
- `redacted_user_data` 必须先经过 redaction、classification 或 hashing。
- `never_record_secret` 只能记录 env var 名称、存在性、缺失状态或 `[REDACTED]`。
- 任何字段一旦无法判断等级，按 `redacted_user_data` 处理。

## 字段隐私表

| 字段 | 隐私等级 | V1 记录方式 |
| --- | --- | --- |
| `id` | `public_metadata` | 原值 |
| `timestamp` | `public_metadata` | 原值 |
| `channel` | `public_metadata` | 原值 |
| `capability_id` | `public_metadata` | 原值 |
| `status` | `public_metadata` | 原值 |
| `policy_decision` | `public_metadata` | 原值 |
| `confirmation_status` | `public_metadata` | 原值 |
| `request_started` | `operational_metadata` | 原值；egress deny 为 `false` |
| `matched_rule_id` | `operational_metadata` | 原值 |
| `resolved_url` | `redacted_user_data` | origin/path 可记录，query 必须脱敏或省略 |
| `input_hash` | `redacted_user_data` | SHA-256 hash |
| `input_redacted_json` | `redacted_user_data` | redacted JSON |
| `output_redacted_json` | `redacted_user_data` | redacted JSON |
| `error` | `redacted_user_data` | 错误 code 和脱敏 message |
| `egress_decision` | `operational_metadata` | 原值 |
| `egress_data_classes_json` | `operational_metadata` | 数据类别名称数组，不含字段原文 |
| `egress_target_origin` | `operational_metadata` | origin 原值 |
| `egress_matched_rule_id` | `operational_metadata` | 原值 |
| `egress_redacted_preview_json` | `redacted_user_data` | redacted preview JSON，不含 secret 原文 |
| `policy_trace_json` | `redacted_user_data` | 不含 input 原文 |
| `override_id` | `operational_metadata` | 原值 |
| provider request id | `operational_metadata` | 原值，除非 provider 文档声明包含 secret |
| `tool_projection_version` | `operational_metadata` | 原值 |
| `tool_projection_hash` | `operational_metadata` | `sha256:<hex>`，不包含用户输入或 secret |
| `tool_projection_hash_algorithm` | `operational_metadata` | 原值，例如 `sha256` |
| env var name | `operational_metadata` | 只记录名称，例如 `GITHUB_TOKEN` |
| env var value | `never_record_secret` | 永不记录 |
| Authorization/Cookie header | `never_record_secret` | 永不记录原文 |

## Debug / Diagnostic 模式

V1 可以预留 debug 或 diagnostic 模式，但必须满足：

- 默认关闭。
- 只能由本地用户显式开启，不能由 Host、模型或 Capability manifest 开启。
- 开启状态必须写入 audit event 或本地诊断日志。
- 仍然不能记录 `never_record_secret` 原文。
- 仍然不能绕过 redaction 对 token、password、authorization、cookie、credential 类字段的处理。
- 不能把 debug 输出写到 MCP stdio stdout。

Debug 模式可以增加：

- 更完整的 policy trace。
- redaction 前后的字段名列表，但不能包含字段原值。
- outbound target 分类原因。
- provider response headers 的非敏感白名单字段。

Debug 模式不能增加：

- request/response body 原文。
- Authorization header。
- API key、OAuth token、cookie、private key。
- 未脱敏 URL query。
- 用户输入中被分类为 secret、credential、internal_url 或 sensitive_text 的值。

## 后续实现要求

后续实现应把隐私等级变成代码中的集中规则，而不是分散在各个 logger 调用点：

1. 新增 audit field privacy map。
2. URL redaction 独立成 helper，默认删除或脱敏 query value。
3. output redaction 复用 input redaction，并补 provider response 专用测试。
4. debug 模式只能通过本地配置或 CLI flag 开启。
5. SQLite 写入前执行最后一道 audit redaction guard。
6. 测试覆盖 secret-like key、header、query、provider output 和 error message。

## Data Egress Audit 实现状态

当前 Runtime 导出：

```ts
createDataEgressAuditEvent(context, decision, channel, timestamp?)
recordDataEgressDecision(logger, context, decision, channel, timestamp?)
```

Data Egress audit event 会记录：

- `egressDecision`。
- `egressDataClasses`。
- `egressTargetOrigin`。
- `egressMatchedRuleId`。
- `egressRedactedPreviewJson`。
- `requestStarted=false`。

当 Data Egress Gate 返回 `deny` 时，事件状态为 `denied`，`policyDecision=deny`，`confirmationStatus=denied`，并且不会记录 input 原文或 secret-like value。SQLite logger 会把这些字段持久化到 `invocations` 表，并在打开既有数据库时补齐缺失列。

## 脱敏规则

字段名包含以下片段时默认脱敏：

- `token`
- `secret`
- `password`
- `api_key`
- `authorization`
- `cookie`
- `credential`

URL 脱敏：

- query string 默认不记录完整值。
- 如果 query key 命中敏感字段，值替换为 `[REDACTED]`。
- Authorization header 永不记录。

## Hash 规则

`input_hash` 使用稳定 JSON 序列化后计算 SHA-256。

目的：

- 可判断两次调用输入是否相同。
- 不需要保存完整敏感输入。

`tool_projection_hash` 使用 MCP projection builder 对模型可见 tool definition 进行稳定 JSON 序列化后计算 SHA-256。hash 输入包含：

- `projectionVersion`
- `capabilityId`
- `toolName`
- `title`
- Runtime-generated `description`
- `inputSchema`
- `outputSchema`

用途：

- 证明一次 MCP tool 调用对应的是哪一版模型可见 tool metadata。
- 当 description、input schema 或 output schema 改变时，hash 必须改变。
- hash 只记录 projection 元数据，不记录用户输入、provider output 或 secret。

## 审计失败策略

V1 安全默认：

- `read_only` 调用：审计日志不可用时可以返回 warning 并继续，前提是 policy 明确 allow。
- 非 `read_only` 调用：审计日志不可用时不得执行外部请求。
- dry-run：审计失败时返回错误，不伪装成功。

原因：写操作如果不能审计，就违背 OpenCap 的核心承诺。

## `opencap logs` V1 输出

最小字段：

```text
time status decision capability risk duration host
```

详细模式可显示：

```text
matched_rule_id
confirmation_status
input_hash
resolved_url
error
```

## 测试要求

- success 写日志。
- deny 写日志。
- confirmation_required 写日志。
- validation error 写日志。
- secret 字段脱敏。
- input hash 稳定。
- tool projection hash 稳定，且 description/schema 改变时 hash 改变。
- egress deny 不产生 request_started。
- egress evidence 不含 input 原文或 secret-like value。
- policy trace 不含 input 原文或 secret-like value。
- override/breakglass 生效时写入 override_id 和 trace summary。
- 非 read-only 审计不可用时 executor 不被调用。
