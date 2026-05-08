# 决策 0005：V1 只支持 HTTP 能力

日期：2026-05-07

## 状态

已接受

## 背景

最初的概念中包含未来 Capability 类型：

- `http`
- `mcp`
- `local`

但 V1 需求和实现里程碑聚焦 HTTP execution。当前 execution schema 也只适合 HTTP。

## 决策

OpenCap V1 在 Runtime 和稳定 schema 中只支持 `type: http`。

`mcp` 和 `local` Capability 是路线图项目，必须经过单独设计审查后才能成为合法 Registry 条目。

## 影响

V1 实现应：

- 只校验 HTTP Capability
- 拒绝 `type: mcp` 和 `type: local`
- 保留 MCP proxy 和 local execution adapter 目录作为规划占位
- 后续通过 RFC 引入条件 schema validation

这样可以避免 V1 假装支持还没审查过的执行模式。
