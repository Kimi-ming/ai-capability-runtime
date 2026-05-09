# 结果信封 V1

本文定义 OpenCap Runtime 如何把一次 Capability 调用的结果封装成稳定、可审计、可传给 MCP Host 的 Result Envelope。

## 为什么需要 Result Envelope

外部 API 响应不是直接给模型看的内容。它可能包含：

- provider 原始错误文本。
- 用户或第三方写入的间接 prompt injection。
- 过大的 JSON/text。
- secret-like 字段。
- 与 manifest output schema 不一致的数据。
- 状态未知或部分成功语义。

Result Envelope 是 Runtime 的输出边界：它把 raw provider response 转成结构化结果、红线、证据摘要和 Host 兼容输出。

## V1 Result Envelope

```ts
type ResultEnvelopeV1 = {
  envelopeVersion: "opencap.result_envelope.v1";
  invocationId: string;
  capabilityId: string;
  status:
    | "success"
    | "dry_run"
    | "blocked"
    | "confirmation_required"
    | "failed"
    | "unknown";
  outcome: string;
  isError: boolean;
  structuredContent?: unknown;
  textSummary?: string;
  warnings: ResultWarningV1[];
  evidence: ResultEvidenceSummaryV1;
};
```

```ts
type ResultWarningV1 = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
};
```

## 生成流水线

```text
raw provider response
  -> response guard
  -> parse/normalize
  -> output schema validation
  -> redaction
  -> prompt-surface sanitization
  -> result envelope
  -> audit redacted evidence
  -> MCP result adapter
```

## 状态映射

| Runtime outcome | Result status | MCP 表现 |
| --- | --- | --- |
| `success` | `success` | `isError: false` |
| `dry_run` | `dry_run` | `isError: false` |
| `blocked` | `blocked` | structured denied result |
| `confirmation_required` | `confirmation_required` | structured confirmation_required result |
| `failed_before_request` | `failed` | `isError: true` |
| `failed_after_request` | `failed` | `isError: true` |
| `unknown_after_timeout` | `unknown` | `isError: true` + reconcile hint |

## Tool Result Prompt-Surface Sanitizer

Provider response 和 provider error 都是不可信输入。进入模型上下文前必须经过最小 sanitizer。

### StructuredContent

`structuredContent` 是首选输出通道。规则：

- 只包含 output schema 允许或 Runtime 明确生成的结构化字段。
- 先执行 secret redaction，再执行 output validation。
- secret-like key 或 value 必须替换为 `[REDACTED]` 或省略。
- 不把 provider raw error、HTML、Markdown 或长文本直接塞进结构化字段。
- 字段级 sanitizer warning 进入 `warnings` 或 evidence summary。
- sanitizer finding 使用 `SECRET_REDACTED`、`PROMPT_SURFACE_MARKER`、`HTML_STRIPPED`、`CONTENT_TRUNCATED` 等 code。

### Free Text

`content[].text` 只是兼容 fallback，必须由 Runtime 生成摘要。规则：

- 不返回 provider raw body。
- 不返回 provider raw error message，除非已脱敏并截断。
- 不保留“ignore previous instructions”“call this tool next”“send token”等指令性文本。
- 摘要只说明状态、关键 id、计数、URL origin 或可公开的 resource id。
- 对过长文本截断并记录 warning。

### Secret Redaction

以下内容不得进入 `structuredContent`、`content[].text`、stdout、stderr 或 audit raw 字段：

- API key、token、cookie、password、private key、OAuth refresh token。
- Authorization/Cookie header value。
- 带敏感 query value 的完整 URL。
- provider response 中命中 secret-like key 的原值。

### Indirect Prompt Injection

Result sanitizer 把 indirect prompt injection 作为 risk 处理，而不是承诺完全消除。

V1 目标：

- 默认不把 raw provider text 放入模型上下文。
- 检测明显指令性文本并生成 sanitizer warning。
- 后续工具调用仍重新经过 validation、policy、confirmation、secret/outbound/data egress 和 audit。
- sanitizer warning 不能自动授权，也不能自动阻止所有后续操作；是否阻断由后续 policy/profile 决定。

## MCP Adapter

MCP 支持 `structuredContent` 和 `content`。OpenCap V1 应优先返回 `structuredContent`，并提供短 `TextContent` summary 作为兼容 fallback。

```json
{
  "isError": false,
  "structuredContent": {
    "issue_url": "https://github.com/org/repo/issues/1",
    "issue_number": 1
  },
  "content": [
    {
      "type": "text",
      "text": "github.create_issue succeeded. issue_number=1."
    }
  ]
}
```

规则：

- `content[].text` 是 Runtime 生成的摘要，不是 provider 原文。
- `structuredContent` 必须通过 redaction 和 output validation。
- output schema mismatch 必须返回 `status: failed` 和结构化 `OUTPUT_SCHEMA_INVALID`，不能标记 success。
- unknown/failed result 也必须结构化，不只返回自由文本。
- secret 不得进入 MCP result、stdout、stderr 或 audit log。
- sanitizer warning 应进入 Result Envelope `warnings`，供 Host、Console 或 audit 查看。

## 非目标

- V1 不支持 MCP resource links 或 embedded resources 作为默认结果。
- V1 不尝试证明 provider 返回内容为真。
- V1 不把 result summary 当成用户确认。
- V1 不让模型解释 raw provider response 后再决定执行状态。

## 关联任务

- T220：Result Envelope implementation。
- T222：MCP structuredContent adapter。
- T225：oversized result handling。
