# 架构决策 0016：V1 可观测性边界

日期：2026-05-07

状态：已接受

## 背景

OpenCap 需要可观测性，但默认上传遥测会破坏本地优先和隐私预期。OpenTelemetry GenAI 语义仍在发展，过早承诺 exporter 会增加兼容负担。

## 决策

V1 只提供本地 audit log 和可从日志派生的本地指标。V1 不默认上传遥测，不实现 OTel exporter。

字段命名尽量保持未来可映射，但 OpenCap 自己的 audit schema 是 V1 事实标准。

## 影响

- `logs.sqlite` 是 V1 可观测性基础。
- 未来 OTel exporter 需要单独 ADR/RFC。
- 文档必须明确默认无远程遥测。
