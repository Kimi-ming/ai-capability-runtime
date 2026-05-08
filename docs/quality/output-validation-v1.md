# Output Validation V1：输出校验与归一化

本文定义 OpenCap 如何把 provider response 归一化为 Capability output，并用 manifest `output` schema 验证。

## 核心原则

输入要校验，输出也要校验。外部 API 响应属于 untrusted data，即使 provider 是可信 SaaS，也可能返回错误结构、恶意文本、过大内容或敏感字段。

## V1 输出流水线

```text
HTTP response
  -> status interpretation
  -> size limit
  -> content-type handling
  -> JSON/text parse
  -> output selector / raw normalized JSON
  -> manifest output schema validation
  -> redaction
  -> result envelope
```

## 输出形态

| 响应 | V1 行为 |
| --- | --- |
| 2xx JSON | 解析 JSON，尝试映射到 output schema |
| 2xx text | 返回 text summary，标记 `unstructured_output` warning |
| 非 2xx JSON | 生成 structured execution error |
| 非 2xx text | 生成 redacted error summary |
| 过大响应 | 阻断或截断，记录 warning/evidence |
| schema mismatch | 不标记 success，返回 `OutputValidationError` |

## Output Schema 语义

Manifest `output` 是 Runtime 对外承诺的能力结果形状。只要工具声明了 output schema：

- Runtime 必须验证 structured output。
- 不符合 schema 的响应不得作为 `success` 暴露给 Host。
- schema validation finding 进入 audit/evidence。
- redacted 字段不能破坏 required field 语义；如破坏则返回 warning 或 error。

## Output Selector 草案

V1 可以先返回 raw normalized JSON。后续可加入：

```yaml
output_mapping:
  issue_url: "$.html_url"
  issue_number: "$.number"
```

规则：

- selector 不能读取 headers 中的 secret。
- selector 缺失 required field 时失败。
- selector 输出仍需通过 output schema。

## 大小和类型限制

默认建议：

```yaml
result_limits:
  max_json_bytes: 1048576
  max_text_chars: 8000
  max_array_items: 500
```

V1 实现可以先用固定默认值，后续再暴露 policy。

## 测试要求

- 2xx JSON 且符合 output schema -> success。
- 2xx JSON 但缺 required output 字段 -> OutputValidationError。
- provider response 包含 secret-like 字段 -> redacted。
- 超大文本 -> truncated/blocked warning。
- 非 2xx error body 不直接透传 provider 原文。

## 关联任务

- T054：output normalization。
- T221：output schema validation。
- T224：result provenance/evidence。
- T225：oversized result handling。
