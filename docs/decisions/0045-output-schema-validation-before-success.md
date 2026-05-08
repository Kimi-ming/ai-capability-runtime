# 架构决策 0045：输出 Schema 校验通过后才能暴露 Success

日期：2026-05-08

状态：已接受

## 背景

Capability manifest 声明 output schema 是对 Host、模型、用户和开发者的契约。如果 provider 返回结构不符合该 schema，而 Runtime 仍然标记 success，后续模型可能基于错误结构继续行动。

## 决策

当 Capability 声明 output schema 时，Runtime 必须在返回 success 前验证 structured output。校验失败时返回 `OutputValidationError` 或等价 failed result，并记录 validation evidence。

## 影响

- T054 output normalization 必须包含 output schema validation。
- MCP `structuredContent` 必须符合 output schema。
- output selector 和 redaction 不能绕过 schema 语义。
