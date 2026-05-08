# 架构决策 0006：V1 审计日志使用 SQLite

日期：2026-05-07

状态：已接受

## 背景

OpenCap V1 必须记录每次 Capability 调用，包括成功、失败、拒绝、阻塞和确认缺失。审计日志需要支持 `opencap logs` 查询，也需要保留未来导出到 OpenTelemetry 或远程系统的空间。

候选方案：

- append-only JSONL
- SQLite
- 直接 OpenTelemetry exporter

## 决策

V1 使用 SQLite 作为默认本地审计日志存储，文件位于：

```text
opencap.local/logs.sqlite
```

日志 schema 以 `InvocationLog` 为核心，字段见 `docs/SPEC.md` 和 `docs/设计/domain-model.md`。

## 原因

SQLite 适合 V1：

- 本地单文件，易删除和备份。
- 支持查询、排序和过滤。
- 不需要运行额外服务。
- 比 JSONL 更适合 `opencap logs` 的后续筛选。
- 未来可以导出为 JSONL、OTel logs 或远程审计系统。

## 影响

- `@opencap/runtime` 需要一个窄接口 `AuditLogger`，不要让 SQLite 细节泄露到调用生命周期中。
- 测试要使用临时 state dir 和临时 SQLite 文件。
- 日志写入失败时的执行策略要在实现前明确。安全默认：写操作审计不可用时不执行。
- 未来如果引入 append-only 签名日志，可以作为 SQLite 之外的增强，而不是替换 V1。
