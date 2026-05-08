# 审计日志 V1

本文定义 OpenCap V1 的审计日志语义、字段、失败策略和隐私规则。

## 目标

- 每次 Capability 调用可追踪。
- 成功、失败、拒绝、确认缺失都能看到。
- 不把密钥或敏感字段写入日志。
- 支持 `opencap logs` 做本地查询。
- 为未来 OpenTelemetry/export 留字段空间。

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
| `duration_ms` | integer | 耗时 |
| `input_hash` | text | 原始输入稳定 hash |
| `input_redacted_json` | text | 脱敏输入 |
| `input_data_classes_json` | text | 输入数据分类摘要 |
| `egress_decision` | text | allow/ask/deny/redact |
| `egress_target_origin` | text | 外发目标 origin |
| `output_redacted_json` | text | 脱敏输出 |
| `resolved_url` | text | 脱敏 URL |
| `error` | text | 错误摘要 |

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
- egress deny 不产生 request_started。
- egress evidence 不含 input 原文或 secret-like value。
- policy trace 不含 input 原文或 secret-like value。
- override/breakglass 生效时写入 override_id 和 trace summary。
- 非 read-only 审计不可用时 executor 不被调用。
