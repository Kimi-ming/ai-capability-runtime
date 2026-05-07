# ADR 0014：MCP Interface V1

日期：2026-05-07

状态：已接受

## 背景

OpenCap V1 需要通过 MCP 暴露已安装 Capability，但 MCP Host 对 elicitation 和 output schema 的支持程度可能不同。必须先定义兼容策略。

## 决策

V1 只实现 MCP server-side tools：`tools/list` 和 `tools/call`。

Capability id 到 tool name 使用稳定映射：`.` 替换为 `_`，启动时检测冲突。

确认策略：

- 初始实现可以统一返回 structured `confirmation_required`。
- 后续如果 SDK/Host 支持 elicitation，再 feature-gate 启用。
- 不得使用终端 prompt。

## 影响

- MCP Bridge 不做 policy、secret、executor。
- 所有 tool call 必须路由 Runtime。
- `confirmation_required` 成为 V1 稳定结果格式。
