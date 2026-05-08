# 结果投递边界

本文定义 OpenCap 在不同 Host 和协议能力下如何投递工具结果，避免把 Host 兼容差异误当作安全边界。

## 核心原则

Result Envelope 是 OpenCap 的稳定边界。MCP、CLI、未来 HTTP API 都只是不同投递适配器。

```text
Runtime Result Envelope
  -> MCP adapter
  -> CLI adapter
  -> future HTTP/Cloud adapter
```

## MCP V1 投递策略

MCP V1 优先：

- `structuredContent`：结构化结果。
- `content[].text`：Runtime 生成的短摘要。
- `isError`：表达工具执行错误，不滥用 JSON-RPC protocol error。

不默认使用：

- resource links。
- embedded resources。
- image/audio/binary content。
- provider raw HTML/text。

## Host 兼容差异

不同 Host 对以下字段支持可能不同：

- outputSchema 是否展示。
- structuredContent 是否保留。
- content text 是否再次进入模型上下文。
- tool error 是否向用户可见。
- annotations / `_meta` 是否保留。

OpenCap 的安全承诺不能依赖 Host 正确处理这些字段。Runtime 必须先完成 validation、redaction、sanitization，再投递。

## CLI 投递策略

CLI 可以展示更多调试信息，但仍然：

- 默认不打印 secret。
- 默认不打印完整 provider raw response。
- `--json` 输出 Result Envelope 子集。
- `--verbose` 只能展示 redacted evidence。

## Future Resource Delivery

未来若支持 MCP resources/resource links：

- resource URI 必须受 outbound/resource policy 管理。
- resource content 进入模型前仍需 sanitizer。
- large result 应默认落地到本地 state，并只给 summary + handle。
- handle 不是授权，读取 resource 仍需 policy。

## 关联任务

- T222：MCP structuredContent adapter。
- T226：Host result compatibility records。
- T231：CLI result envelope output。
