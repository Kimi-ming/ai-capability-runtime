# ADR 0024：兼容性声明必须绑定 Interoperability Profile

日期：2026-05-07

状态：已接受

## 背景

OpenCap 面向多个 AI Host 和协议。不同 Host 对 MCP tool、确认交互、错误展示和输出结构的支持不一致。泛泛声明“兼容 MCP”不足以指导用户。

## 决策

OpenCap 以后声明兼容性时，必须说明 profile、Host、版本、测试日期和证据。V1 profile 从 `opencap.mcp.tools.v1`、`opencap.mcp.consent.v1`、`opencap.registry.package.v1` 开始。

## 影响

- Host compatibility matrix 必须记录 profile。
- Release note 不能笼统写“支持所有 Host”。
- 未来 A2A/Apps SDK 进入项目时也要先定义 profile。
