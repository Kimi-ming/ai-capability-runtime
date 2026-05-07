# 决策 0004：MCP 确认策略

日期：2026-05-07

## 状态

已接受

## 背景

OpenCap V1 对高风险调用需要 `ask` 决策。第一个写操作 demo `github.create_issue` 使用：

```yaml
permissions:
  - resource: github.issue
    action: create
    risk: write
    confirmation: ask
```

Runtime 会通过 `opencap serve --mcp` 暴露能力。MCP Server 常通过 STDIO 通信，任意终端 prompt 都可能破坏协议流。

## 决策

OpenCap 不会在 MCP `ask` 决策中使用终端 prompt。

V1 行为：

- MCP 模式下，如果 client 支持 elicitation，可以通过 MCP client 请求确认。
- MCP 模式下，如果 elicitation 不可用，返回结构化 `confirmation_required`，并且不执行 Capability。
- 非 MCP CLI 模式下，可以使用终端 prompt。
- 被拒绝或未确认的调用仍然写入日志。

## 影响

Runtime 必须知道调用 channel：

- `cli`
- `mcp`
- future `http`

Policy Engine 只负责给出 `allow`、`ask`、`deny`。channel-specific confirmation handler 负责解决 `ask`。

这样可以保持策略评估和用户交互解耦。
