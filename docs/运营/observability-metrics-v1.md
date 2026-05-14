# 可观测性和指标 V1

本文定义 OpenCap V1 的本地指标和未来 OpenTelemetry 映射。V1 先做本地审计日志，不引入远程遥测。

## 原则

- V1 默认不上传遥测。
- 本地 audit log 是最小可观测性基础。
- 字段命名尽量方便未来映射到 OpenTelemetry。
- 指标不能泄露输入、输出或 secret。

## V1 本地指标

可以从 SQLite audit log 派生：

| 指标 | 来源 | 用途 |
| --- | --- | --- |
| invocation count | invocations rows | 调用量 |
| success rate | status | 稳定性 |
| denied count | decision/status | policy 效果 |
| confirmation required count | status | Host 确认能力缺口 |
| duration p50/p95 | duration_ms | 性能 |
| capability error rate | capability_id + status | 质量 |
| outbound blocked count | error/status | 安全事件 |

## 本地指标命令草案

本节是未来 CLI 命令草案，当前不表示命令已经实现。V1 仍以 `opencap logs` 和 `opencap decision-log export` 为已实现入口；`opencap metrics` 后续只允许从本地 SQLite audit log 的脱敏字段派生汇总。

建议命令：

```bash
opencap metrics summary --state-dir opencap.local --since 2026-05-14T00:00:00.000Z --until 2026-05-14T23:59:59.999Z
opencap metrics summary --state-dir opencap.local --capability github.create_issue --json
opencap metrics capabilities --state-dir opencap.local --json
opencap metrics security --state-dir opencap.local --json
```

### `opencap metrics summary`

目标：输出当前筛选窗口内的整体健康度。

输入参数草案：

| 参数 | 含义 |
| --- | --- |
| `--state-dir <path>` | 读取本地 `logs.sqlite`，优先级沿用 CLI 全局 state dir 规则 |
| `--since <iso-time>` | 只统计该时间之后的 audit event |
| `--until <iso-time>` | 只统计该时间之前的 audit event |
| `--capability <id>` | 限定 Capability id |
| `--json` | 输出机器可读 JSON |

人类输出草案：

```text
OpenCap local metrics
window: 2026-05-14T00:00:00.000Z..2026-05-14T23:59:59.999Z
invocations: 42
status: executed=18 dry_run=12 blocked=8 denied=4
policy decisions: allow=18 ask=20 deny=4
confirmation required: 8
outbound blocked: 2
duration_ms: p50=128 p95=940
```

JSON 输出草案：

```json
{
  "window": {
    "since": "2026-05-14T00:00:00.000Z",
    "until": "2026-05-14T23:59:59.999Z"
  },
  "invocationsTotal": 42,
  "statusCounts": {
    "executed": 18,
    "dry_run": 12,
    "blocked": 8,
    "denied": 4
  },
  "policyDecisionCounts": {
    "allow": 18,
    "ask": 20,
    "deny": 4
  },
  "confirmationRequiredTotal": 8,
  "outboundBlockedTotal": 2,
  "durationMs": {
    "p50": 128,
    "p95": 940
  }
}
```

### `opencap metrics capabilities`

目标：按 Capability 聚合调用质量，不输出 input/output 原文。

建议字段：

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| `capabilityId` | `capability_id` | 原值可显示 |
| `invocationsTotal` | row count | 调用量 |
| `statusCounts` | `status` | executed/dry_run/blocked/denied |
| `policyDecisionCounts` | `decision` | allow/ask/deny |
| `errorRate` | error-like status / total | blocked/denied/failed/unknown 的比例 |
| `durationMs.p50/p95` | `duration_ms` | 忽略空值 |
| `lastSeenAt` | `timestamp` | 最近一次调用 |

### `opencap metrics security`

目标：给本地用户和安全工程师快速查看安全相关事件密度。

建议字段：

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| `deniedTotal` | `decision=deny` 或 `status=denied` | policy deny 总数 |
| `confirmationRequiredTotal` | `confirmation_status=confirmation_required` 或 `status=blocked` + reason | Host/CLI 确认缺口 |
| `outboundBlockedTotal` | `outbound_decision=block` | outbound policy 阻断 |
| `dataEgressDeniedTotal` | `egress_decision=deny` | data egress policy 阻断 |
| `secretMissingTotal` | `error` / structured error code | env secret 缺失 |
| `auditPreflightFailedTotal` | `error` / status | audit 写路径不可用 |

### 隐私边界

`opencap metrics` 不得输出以下字段，即使使用 `--json`：

- `input_redacted_json`
- `output_redacted_json`
- `egress_redacted_preview_json`
- credential redacted hash 或 env var value
- provider raw body、Authorization/Cookie header、URL query value
- policy 文件原文或用户输入原文

允许输出的字段必须是计数、比例、duration 统计、Capability id、status、decision、reason code、target origin 这类 operational metadata。未来如果加入 `--verbose`，也只能增加字段名和 reason code，不能增加用户数据。

## 未来 OpenTelemetry 映射

OpenTelemetry 已有 GenAI spans、metrics、events 和 MCP 相关语义约定，但 GenAI 部分仍处于 development 状态。OpenCap V1 不直接承诺稳定 OTel exporter。

未来可映射：

| OpenCap 字段 | OTel 候选 |
| --- | --- |
| capability_id | tool/function name 或 custom attribute |
| channel | transport/protocol attribute |
| host | client/app attribute |
| duration_ms | operation duration |
| status/error | status/error.type |
| risk/decision | custom OpenCap attributes |

## Product Metrics

开源项目层面可跟踪：

- 有效 Capability 数。
- 通过测试的 Capability 数。
- 外部贡献者数量。
- 首次贡献成功时间。
- Alpha smoke test 成功率。
- Host compatibility 覆盖数量。

## 非目标

V1 不实现：

- 远程 telemetry。
- 用户行为分析。
- 自动上报。
- 付费/计量指标。
- OTel exporter。

这些属于 V1 后能力。
