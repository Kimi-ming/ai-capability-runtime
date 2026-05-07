# ADR 0022：SDK 和 Adapter 边界

日期：2026-05-07

状态：已接受

## 背景

OpenCap repo 有 SDK 和 adapters 目录，但 V1 主路径是 manifest + runtime。如果 SDK/adapters 过早进入核心，会拖慢可信闭环。

## 决策

V1 主路径不依赖 SDK 或 adapters。Manifest 是事实契约。SDK 和 OpenAPI/MCP proxy/local command adapters 都是 V1 后增强，不能绕过 validation/policy/audit。

## 影响

- SDK 不阻塞 V1。
- OpenAPI adapter 需要 RFC。
- Local command adapter 必须先有 sandbox 设计。

