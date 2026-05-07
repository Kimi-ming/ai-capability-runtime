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
