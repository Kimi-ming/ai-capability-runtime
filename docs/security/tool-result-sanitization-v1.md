# Tool Result Sanitization V1：工具结果净化

本文定义 OpenCap 如何处理 provider response、error body 和外部文本中的敏感信息与间接 prompt injection。

## 核心判断

Tool result 是模型上下文入口。它可能携带外部系统、网页、Issue、数据库、邮件或第三方 API 的文本。这些文本不能被当作指令，只能作为数据。

OpenCap V1 的目标不是“彻底消灭 prompt injection”，而是限制结果进入模型上下文时的形式、大小、敏感信息和指令性风险。

## Sanitization 层级

| 层级 | 控制 |
| --- | --- |
| Secret redaction | token、api key、cookie、authorization、private key |
| Prompt-surface marker | 检测 instruction override、forced tool call、bypass governance |
| Size limit | 限制 text/json 大小，避免上下文污染和成本失控 |
| Content-type guard | 不把 HTML、binary、unknown mime 直接作为 text 给模型 |
| Structured summary | Runtime 生成简短摘要，避免 provider 原文直接进入 `content` |
| Evidence | 记录 sanitizer finding，不记录敏感原文 |

## Forbidden Result Exposure

以下内容不得原样进入 MCP `content[].text`：

- Authorization、Cookie、Set-Cookie、API key、private key。
- HTML 中的 script、style、hidden input、comment。
- 明确要求模型忽略指令、调用其他工具、泄露 secret 的文本。
- 大段 provider 原始错误栈。
- 未声明的 binary/base64 payload。

## Prompt Injection Findings

Sanitizer 可以返回 warning，而不是总是失败：

```json
{
  "code": "TRS001",
  "severity": "warning",
  "message": "provider output contains instruction-like text and was summarized"
}
```

建议规则：

| 规则 | 处理 |
| --- | --- |
| Secret-like value | redact，必要时 fail |
| Instruction override phrase | summarize + warning |
| Bypass confirmation/audit phrase | summarize + warning |
| HTML/script/comment | strip/summarize |
| Oversized output | truncate or block |

## 与 Result Envelope 的关系

Sanitizer 不决定业务成功失败。它只决定哪些内容可以进入 model-visible result。

```text
business outcome: success
sanitizer warning: provider output summarized
MCP result: success + structuredContent + warning summary
```

## 非目标

- 不承诺识别所有 prompt injection。
- 不做内容事实核查。
- 不把 sanitizer warning 当作 policy deny，除非 policy 显式配置。
- 不解析任意 HTML/文档为可信数据。

## 关联任务

- T223：tool result sanitizer。
- T225：oversized result handling。
- T229：result sanitizer negative fixtures。
