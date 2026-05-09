# MCP 接口 V1

本文定义 OpenCap MCP Bridge 在 V1 中暴露哪些能力、如何映射 Capability、如何处理确认和错误。

## 范围

V1 只实现 MCP server-side tools：

- `tools/list`
- `tools/call`

V1 不实现：

- Resources。
- Prompts。
- Sampling。
- Roots。
- Remote HTTP MCP authorization。
- A2A。

## Tool Name 映射

Capability id：

```text
github.create_issue
```

MCP tool name：

```text
github_create_issue
```

规则：

- `.` 替换为 `_`。
- 保留小写字母、数字和下划线。
- 启动时检测冲突。
- 冲突时 fail fast，不随机改名。

## Tool Definition

MCP tool 字段：

| MCP 字段 | 来源 |
| --- | --- |
| `name` | 映射后的 tool name |
| `title` | manifest `name` |
| `description` | Runtime-generated tool projection description |
| `inputSchema` | manifest `input` |
| `outputSchema` | manifest `output`，如 SDK 支持 |

description 必须由 Runtime tool projection builder 生成，包含简短风险提示；安全判断不能依赖 description。第三方 manifest description 只能作为通过 lint 后的 safe summary 候选。

## Tool Call 路由

```text
MCP tools/call
  -> tool name reverse lookup capability id
  -> runtime.invoke({ channel: "mcp", host, input })
  -> Result Envelope
  -> MCP result adapter
```

MCP Bridge 不直接：

- 读 secret。
- 执行 HTTP。
- 决定 allow/ask/deny。
- 写 audit log。

## 确认策略

V1 默认：

- Runtime 返回 `ask` 时，MCP Bridge 检查 Host 是否支持 elicitation。
- 初始实现可以先不启用 elicitation，统一返回 `confirmation_required`。
- 不支持确认时不得执行。

结构化结果：

```json
{
  "status": "confirmation_required",
  "capability_id": "github.create_issue",
  "risk": "write",
  "message": "This capability requires human confirmation before execution."
}
```

未来支持 elicitation 时，只能请求确认，不得请求 token、password、API key。

## STDIO 输出规则

- stdout：只写 MCP 协议消息。
- stderr：启动日志、warning、debug。
- 不使用终端 prompt。
- 不打印 secret。

## 错误映射

| Runtime 错误 | MCP 表现 |
| --- | --- |
| UnknownCapability | JSON-RPC invalid params 或 tool result error |
| ValidationError | tool result `isError: true` |
| PolicyDenied | structured denied result |
| ConfirmationRequired | structured confirmation_required result |
| ExecutionError | tool result `isError: true` |
| InternalError | JSON-RPC internal error |

V1 应优先让业务/执行失败作为 tool result，协议级错误只用于协议本身错误。


## Result Envelope 映射

V1 MCP Bridge 不直接返回 provider raw response。Runtime 先生成 `ResultEnvelopeV1`，MCP Bridge 再适配：

- `structuredContent` 来自 Result Envelope 的 structured content。
- `content[].text` 是 Runtime-generated summary，不回退到 provider raw output。
- `isError` 来自 envelope `isError`。
- unknown/failed/blocked/confirmation_required 都返回结构化结果。

如果 Host 不支持或不展示 structuredContent，OpenCap 仍只提供短摘要，不能退回到 provider raw text。
