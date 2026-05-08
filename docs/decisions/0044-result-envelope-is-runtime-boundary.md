# ADR 0044：Result Envelope 是 Runtime 输出边界

日期：2026-05-08

状态：已接受

## 背景

OpenCap 调用外部 API 后，provider response 不能直接成为 MCP result。它可能包含敏感字段、错误结构、间接 prompt injection、超大文本或未知结果语义。

## 决策

OpenCap V1 使用 Runtime-owned Result Envelope 作为输出边界。HTTP executor 只产生 raw/normalized execution result，Runtime 必须经过 output validation、redaction、sanitization 和 evidence summary 后，再交给 MCP/CLI adapter。

## 影响

- MCP result shape 由 Result Envelope adapter 生成。
- `content[].text` 默认是 Runtime summary，不是 provider 原文。
- failed/unknown/blocked 也必须结构化输出。
