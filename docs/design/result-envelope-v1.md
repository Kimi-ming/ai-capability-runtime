# Result Envelope V1：工具结果信封

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
- unknown/failed result 也必须结构化，不只返回自由文本。
- secret 不得进入 MCP result、stdout、stderr 或 audit log。

## 非目标

- V1 不支持 MCP resource links 或 embedded resources 作为默认结果。
- V1 不尝试证明 provider 返回内容为真。
- V1 不把 result summary 当成用户确认。
- V1 不让模型解释 raw provider response 后再决定执行状态。

## 关联任务

- T220：Result Envelope implementation。
- T222：MCP structuredContent adapter。
- T225：oversized result handling。
