# 开源核心与未来 Cloud 边界

本文定义 OpenCap OSS 和未来 CapHub Cloud 的边界，避免开源项目从一开始就被设计成中心化平台。

## 原则

- 开源核心必须能独立运行。
- 本地 Runtime、Manifest、Policy、Audit、Registry 工具链属于开源核心。
- Cloud 只能增强协作、托管和企业治理，不能成为 V1 主路径依赖。

## OpenCap OSS

必须开源并可本地使用：

- Capability Manifest schema。
- CLI。
- Local Runtime。
- MCP Bridge。
- Policy Engine。
- Local Audit Log。
- Git-based Registry。
- Registry validation tooling。
- Capability review process。
- SDK 基础。

## Future CapHub Cloud

可商业化的托管能力：

- 托管 Registry 搜索和索引。
- 团队 workspace。
- 企业 policy 管理。
- 远程 audit export。
- 组织级 Trust Card。
- 维护者验证。
- 使用量统计。
- 付费能力和结算。
- 企业 SSO/RBAC。

## 不可越界

Cloud 不应成为这些能力的唯一实现：

- 安装和运行 Capability。
- 本地 policy。
- 本地 audit log。
- schema validation。
- MCP serving。

否则 OpenCap 会变成 hosted marketplace，而不是开放能力层。

## 许可证和治理含义

V1 使用 MIT license。未来如果出现 Cloud 功能，必须保持：

- 开源核心贡献不需要 Cloud 账号。
- Registry PR 不需要商业授权。
- 本地 Runtime 不依赖远程遥测。
- 安全修复优先进入 OSS。
