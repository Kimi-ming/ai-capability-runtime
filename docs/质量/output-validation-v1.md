# 输出校验与归一化 V1

本文定义 OpenCap 如何把 provider response 归一化为 Capability output，并用 manifest `output` schema 验证。

## 核心原则

输入要校验，输出也要校验。外部 API 响应属于 untrusted data，即使 provider 是可信 SaaS，也可能返回错误结构、恶意文本、过大内容或敏感字段。

## V1 输出流水线

```text
HTTP response
  -> status interpretation
  -> response size guard
  -> content-type handling
  -> JSON/text parse
  -> output selector / raw normalized JSON
  -> redaction and prompt-surface sanitization
  -> result size limit
  -> manifest output schema validation
  -> Result Envelope evidence
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

## Output Selector V1

Output Selector V1 见 `../../rfcs/0005-output-selector-v1.md`。它定义从 provider JSON body 到 manifest `output` schema 的受限字段投影机制。

示例：

```yaml
output_mapping:
  issue_url:
    from: "$.html_url"
  issue_number:
    from: "$.number"
```

规则：

- selector 只能读取 provider JSON body，不能读取 headers、request input、env、Secret Resolver、audit 或 Runtime context。
- selector 语法是受限 JSONPath 子集，不支持 wildcard、filter、script、function、recursive descent 或 transform。
- selector path 或 output field 命中 token/secret/password/api_key/authorization/cookie/credential/private_key 等 secret-like 片段时，manifest lint 或 Runtime preflight 必须拒绝或要求安全审查。
- selector 缺失 required output field 时返回 failed Result Envelope，建议错误码为 `OUTPUT_SELECTOR_MISSING_REQUIRED`。
- selector 输出仍需经过 redaction、sanitization、result size limit 和 manifest output schema validation。
- schema mismatch 必须返回 `OUTPUT_SCHEMA_INVALID`，不能静默 coerce 或标记 success。

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
- 2xx JSON 但缺 required output 字段 -> `OUTPUT_SELECTOR_MISSING_REQUIRED` 或 `OUTPUT_SCHEMA_INVALID` failed envelope。
- selector 不能读取 secret-like path；provider response 包含 secret-like 字段 -> redacted。
- 超大文本 -> truncated/blocked warning。
- 非 2xx error body 不直接透传 provider 原文。

## 关联任务

- T054：output normalization。
- T221：output schema validation。
- T224：result provenance/evidence。
- T225：oversized result handling。
- T227：output selector RFC。
