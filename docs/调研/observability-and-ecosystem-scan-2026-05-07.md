# 可观测性和生态补充调研

日期：2026-05-07

## 参考来源

- OpenTelemetry GenAI semantic conventions：https://opentelemetry.io/docs/specs/semconv/gen-ai/
- OpenTelemetry GenAI metrics：https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-metrics/
- OpenTelemetry GenAI agent spans：https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/
- OpenSSF Scorecard Action：https://github.com/ossf/scorecard-action

## 发现

OpenTelemetry 已经在定义 GenAI operations、metrics、agent spans 和 MCP 相关语义约定，但 GenAI 语义仍处于 development。OpenCap V1 应避免过早承诺稳定 OTel exporter，但应让 audit log 字段具备未来映射空间。

OpenSSF Scorecard Action 对 GitHub Token 权限、触发方式和发布结果有安全要求。OpenCap 的 CI 安全基线应该先从最小权限和基础 checks 开始，再逐步打开 Scorecard。

## 对 OpenCap 的影响

- 新增 `docs/运营/observability-metrics-v1.md`。
- 在 CI 安全基线中保留 OpenSSF Scorecard，但不让它阻塞早期 T001。
- V1 继续坚持默认不上传遥测。
- audit log 字段保持可映射，但不追逐 unstable semconv。
