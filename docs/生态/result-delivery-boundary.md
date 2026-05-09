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

## 安全边界声明

OpenCap V1 的安全结论由 Runtime 持有，Host 只负责接收和展示投递结果。具体含义：

- Host 是否展示 `outputSchema`，不能替代 Runtime output validation。
- Host 是否保留 `structuredContent`，不能替代 Runtime redaction、sanitization、size limit 和 provenance evidence。
- Host 是否把 `content[].text` 放回模型上下文，不会获得 provider raw body，因为该字段只允许 Runtime-generated summary。
- Host 是否正确展示 `isError`，不能改变 audit outcome、policy decision、confirmation decision 或 retry/reconcile 语义。
- 如果 Host 忽略 `structuredContent`，OpenCap 只损失机器可读细节展示，不损失授权、审计或脱敏边界；调试时以 Result Envelope 和 audit log 为准。

因此，Host compatibility record 是互操作证据，不是安全授权证据。任何 Host smoke 只能证明“该 Host 当时如何显示/保留字段”，不能降低 Runtime gate、Policy Engine、Secret Resolver、Data Egress Gate、Outbound Gate 或 Audit Logger 的要求。

## CLI 投递策略

CLI 可以展示更多调试信息，但仍然：

- 默认不打印 secret。
- 默认不打印完整 provider raw response。
- `--json` 输出 Result Envelope 子集。
- `--verbose` 只能展示 redacted evidence。

## Resource Delivery Profile V1

Resource Delivery Profile V1 见 `../../rfcs/0006-resource-delivery-profile-v1.md`。它定义未来大结果、resource links 和 embedded resources 的投递与读取边界。

默认策略：

- large result 默认 `summary + handle`，不把完整 provider raw body 直接塞进 `structuredContent` 或 `content[].text`。
- resource handle 不是授权，只是定位符；读取 resource 必须重新经过 ownership/lifecycle、policy、data egress、sanitizer、size/media type gate 和 audit。
- resource content 进入模型前仍需 sanitizer，HTML/script/log/Markdown 等 provider text 不能绕过 prompt-surface 边界。
- embedded resource 默认关闭；启用前必须有 Host compatibility record、media type gate、size gate 和 redaction evidence。
- Host 不支持 resource links 时，adapter 只能返回 Runtime summary 和 handle metadata，不得退化为直接投递完整内容。

未来若支持 MCP resources/resource links，推荐 handle 形状为：

```text
opencap://invocations/{invocationId}/resources/{resourceId}
```

该 URI 不应是公开可访问 URL，也不能被其他 Capability 当成 credential 使用。

## 关联任务

- T222：MCP structuredContent adapter。
- T226：Host result compatibility records。
- T228：Resource delivery profile RFC。
- T231：CLI result envelope output。
