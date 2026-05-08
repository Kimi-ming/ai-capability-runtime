# 协议定位：MCP、A2A、OpenAPI 与 OpenCap

本文定义 OpenCap 与外部协议的关系，避免实现时把项目变成某个协议的简单包装。

检索日期：2026-05-07。

## 结论

OpenCap 不是 MCP 替代品，也不是 A2A 替代品。OpenCap 是能力治理层：它把能力定义、安装、权限、确认、执行、审计和验证放在 Runtime 中，再通过协议适配暴露给不同 Host。

```text
MCP 负责 Host 与 tool/resource/prompt 的交互协议。
A2A 负责 Agent 与 Agent 的通信和任务协作。
OpenAPI 负责描述 HTTP API。
OpenCap 负责把真实能力变成可治理的 AI-callable Capability。
```

## MCP 映射

MCP 官方规范把 Tools 定义为可被模型调用的服务端能力，并要求服务端声明 `tools` capability。Tools 适合映射 OpenCap V1 Capability。

OpenCap 映射规则：

| OpenCap | MCP |
| --- | --- |
| InstalledCapability | tool |
| manifest id | stable tool name |
| manifest input | `inputSchema` |
| manifest output | `outputSchema` / structured result |
| InvocationResult | `tools/call` result |
| confirmation required | elicitation 或 structured `confirmation_required` |
| audit log | OpenCap 本地日志，不属于 MCP 协议本身 |

重要约束：

- MCP Tools 是 model-controlled，敏感操作应保留人类确认。
- OpenCap MCP Bridge 不做 policy 决策，所有调用交给 Runtime。
- STDIO 模式不得使用会污染协议流的终端 prompt。
- Tool annotations 只能作为提示信息，不能作为安全事实。

参考：MCP Tools 规范：https://modelcontextprotocol.io/specification/2025-06-18/server/tools

## MCP Authorization 对 OpenCap 的影响

MCP HTTP transport 的 authorization 设计基于 OAuth 2.1、受保护资源元数据、动态客户端注册和 resource indicators。规范还明确要求 access token 使用 Bearer header，禁止 token 放在 URI query 中，并要求 token audience binding。

OpenCap V1 的策略：

- 本地 STDIO Runtime 使用环境变量读取下游 API token。
- V1 不实现完整 MCP HTTP authorization server。
- 禁止把 MCP client token 透传给下游 API。
- 未来 remote runtime 必须单独设计 OAuth resource server 边界。

参考：MCP Authorization：https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization

## MCP Elicitation 对确认流程的影响

MCP Elicitation 允许 server 通过 client 请求用户补充结构化信息或作出选择。规范要求 server 不得用 elicitation 请求敏感信息，并建议应用清楚展示由哪个 server 请求信息。

OpenCap V1 的策略：

- `ask` 决策可映射到 elicitation，但只用于确认，不用于收集 token。
- Host 不支持 elicitation 时，返回 structured `confirmation_required`。
- 确认内容必须包含 capability、risk、输入摘要和目标资源。

参考：MCP Elicitation：https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation

## OpenAI Apps SDK 对 OpenCap 的影响

OpenAI Apps SDK 构建在 MCP 之上，用于让开发者把应用逻辑和 UI 带入 ChatGPT。它说明 MCP 正在成为 AI App 的重要连接面。

OpenCap 的策略：

- 不和 Apps SDK 竞争 UI 或 app experience。
- OpenCap 可以作为 Apps SDK/MCP server 背后的能力治理层。
- OpenCap 的 manifest、policy 和 audit 应保持 Host-neutral。

参考：OpenAI Apps SDK Help：https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk

## A2A 对 OpenCap 的影响

A2A 关注不同 Agent 系统之间的发现、通信、消息、任务和 artifact 协作。它适合 Agent-to-Agent，而 OpenCap V1 适合 Host-to-Capability。

未来关系：

```text
A2A Agent
  -> 使用 OpenCap Runtime 调用 Capability
  -> 或把 OpenCap capability summary 暴露为 AgentCard 的能力描述
```

OpenCap V1 不实现 A2A server，但应保持对象命名和审计模型足够清晰，便于未来对接 AgentCard、Task、Message、Artifact 等概念。

参考：A2A specification：https://a2a-protocol.org/latest/specification/

## OpenAPI 对 OpenCap 的影响

OpenAPI 描述 HTTP API，使人和机器可以在不看源码的情况下理解服务能力。OpenCap V1 的 HTTP Capability 可以看作更窄、更偏执行治理的 manifest。

未来 adapter：

```text
OpenAPI Operation
  -> candidate Capability
  -> human selects operation
  -> generated manifest
  -> policy/risk review
  -> registry PR
```

OpenCap 不应直接把整个 OpenAPI 文档自动暴露给 AI。必须有人类选择、权限收敛和风险标记。

参考：OpenAPI 3.1.2：https://spec.openapis.org/oas/v3.1.2.html

## 设计规则

- Protocol-compatible，不 vendor-locked。
- Runtime policy 是安全边界，协议 metadata 不是安全边界。
- 对外协议层可以扩展，但 Runtime invocation pipeline 不应复制多套。
- V1 只实现 MCP server side tools，不实现 resources/prompts。
- A2A、OpenAPI、Apps SDK 都是生态接口，不改变 V1 HTTP-only 主路径。
