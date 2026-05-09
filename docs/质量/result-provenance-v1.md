# 结果来源与污染标记 V1

本文定义 OpenCap 如何记录工具结果来自哪里、经过哪些转换，以及哪些字段是 untrusted provider data。

## 为什么需要 Result Provenance

用户和维护者需要知道：

- 结果来自哪个 provider/origin。
- 请求是否发出、何时返回。
- 哪些字段来自 provider，哪些字段由 Runtime 生成。
- 输出是否经过 redaction、sanitization、truncation、schema validation。
- 模型看到的内容和 audit 记录能否对应。

## Taint Labels

V1 使用简单污染标记：

| Label | 含义 |
| --- | --- |
| `runtime_generated` | Runtime 生成的状态、摘要、风险提示 |
| `provider_untrusted` | 外部 API 响应字段 |
| `user_supplied` | 用户输入或从 input 派生 |
| `secret_redacted` | 原始内容含 secret-like 值，已脱敏 |
| `sanitized_text` | 原始文本被摘要、截断或清理 |

Taint label 不是安全认证。它只解释数据来源和处理方式。

当前 Runtime 已在 Result Envelope evidence 中记录 `resultContentDigest` 和 `resultProvenance`。digest 基于已经脱敏/净化的 `structuredContent`，不是 provider raw output。

## Provenance 字段

```ts
type ResultProvenanceV1 = {
  provider?: string;
  targetOrigin?: string;
  resourceType?: string;
  resourceId?: string;
  providerRequestId?: string;
  receivedAt?: string;
  httpStatus?: number;
  contentDigest?: string;
  outputSchemaVersion?: string;
  transformations: string[];
  taint: Record<string, string[]>;
};
```

## Content Digest

Runtime 可以对 redacted normalized output 计算 digest：

```text
content_digest = sha256(canonical_json(redacted_structured_content))
```

用途：

- 证明 audit 记录和 MCP result 对应。
- 不保存原文时仍能追踪变化。
- conformance suite 验证 sanitizer/normalizer 的稳定性。

## Evidence Chain

```text
request evidence
  -> response evidence
  -> output validation evidence
  -> sanitization evidence
  -> result provenance
  -> result envelope
```

## 测试要求

- structuredContent 字段标记 provider_untrusted 或 runtime_generated。
- redacted 字段标记 secret_redacted。
- sanitized text 有 transformation record。
- digest 不基于 secret 原文。
- failed/unknown result 也有 provenance summary。

## 关联任务

- T224：result provenance/evidence。
- T230：taint label tests。
- T173：execution evidence conformance record。
