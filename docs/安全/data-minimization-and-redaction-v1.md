# 数据最小化与脱敏 V1

本文定义 OpenCap 在发送 tool input 前如何尽量减少外发数据，并在确认、日志和结果中使用脱敏摘要。

## 核心原则

模型可能会把过多上下文塞进 tool input。OpenCap 不应默认把“模型给了什么”完整发送出去。Runtime 必须尽可能按 manifest execution mapping 只发送必要字段。

## 最小化规则

- 只发送 execution.url/body/query/header 中声明引用的 input 字段。
- 不把整个 input 自动作为 body，除非 manifest 明确声明。
- path/query/body/header 的字段 destination 必须可追踪。
- 可选字段缺失时省略，不填入空字符串。
- 未被 execution mapping 引用的 input 字段不得外发。

## Runtime 实现状态

当前 `@opencap/runtime` 导出：

```ts
buildFieldLevelEgressMap(manifest, input, classification)
minimizeInputByEgressMap(input, map)
buildRedactedEgressPreview(options)
```

V1 最小化流程：

1. 根据 HTTP manifest 的 `execution.url` 和 `execution.body.fields` 生成 field-level egress map。
2. 根据 egress map 从 input 中提取最小化 input 视图。
3. 未被引用的字段不会进入 minimized input。
4. 缺失的 optional body field 会被省略。
5. 不会因为没有 body mapping 就把整个 input 自动作为 body。

当前实现不记录字段值以外的额外副本；测试会确保 unused secret 不进入 minimized result。

Redacted egress preview 已实现：

- 展示 `targetOrigin`。
- 展示 `fieldsSent`、destination、data classes 和 redacted 状态。
- `secret_like`、`source_code`、`internal_url`、`financial_data` 使用 `[redacted:...]` 替换。
- `pii` 使用局部遮蔽。
- `free_text_unknown` 和超长文本会摘要化，不展示完整原文。

## Redaction Rules

V1 默认脱敏：

- 字段名含 `token`、`secret`、`password`、`cookie`、`authorization`。
- JWT-like string。
- private key blocks。
- email 可部分遮蔽。
- 大段 text 可摘要或截断。

## Confirmation Preview

确认摘要展示：

```text
Target: https://api.github.com
Capability: github.create_issue
Data classes: free_text_unknown, source_code
Fields sent: title, body, labels
Redacted fields: none
```

不展示：

- secret 原文。
- 完整大段 body。
- Authorization header。

## Redact vs Deny

| 情况 | 默认 |
| --- | --- |
| secret_like in ordinary input | deny |
| pii in write/send | ask |
| source_code with secret_like | deny or redact+ask |
| source_code without secret_like | ask |
| free_text_unknown large | ask + summarize |

## 测试要求

- 未引用 input 字段不进入 rendered body。
- token-like input 不进入 preview/audit/request。
- confirmation preview 展示 fields sent 和 data classes。
- redaction 后仍需重新验证 body schema。
- `--dry-run` 展示 redacted egress preview。

## 关联任务

- T242：input minimization by execution mapping。
- T243：redacted egress preview。
- T244：dry-run egress preview。
