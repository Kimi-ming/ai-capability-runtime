# ADR 0017：开源核心与未来 Cloud 边界

日期：2026-05-07

状态：已接受

## 背景

OpenCap 的长期方向可能出现托管版或企业版。如果不开源核心边界，项目容易从开放能力层滑向中心化市场。

## 决策

Capability Manifest、CLI、Local Runtime、MCP Bridge、Policy Engine、Local Audit Log、Git-based Registry tooling 和基础 SDK 属于 OpenCap OSS 核心。

未来 Cloud 可以提供托管 registry、团队 workspace、企业 policy、远程 audit、维护者验证和商业结算，但不能成为本地 Runtime 主路径依赖。

## 影响

- V1 不引入 Cloud 依赖。
- README 和战略文档保持 local-first。
- 商业化设计不得破坏 OSS 可独立运行。

