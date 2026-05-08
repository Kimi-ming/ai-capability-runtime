# 架构决策 0046：Provider 原始输出 默认不进入模型上下文

日期：2026-05-08

状态：已接受

## 背景

外部 API、网页、Issue、邮件和数据库文本可能包含间接 prompt injection、敏感信息或上下文污染。如果 provider raw output 直接进入 MCP `content[].text`，模型可能把外部数据误当作指令。

## 决策

OpenCap V1 默认不把 provider raw output 放入 model-visible text。Runtime 生成短摘要，并优先使用 structuredContent。需要暴露大段原文或资源时，未来走 resource delivery profile，并继续受 sanitizer、policy 和 audit 约束。

## 影响

- MCP adapter 需要生成 Runtime summary。
- Tool result sanitizer 成为 V1 安全主线。
- Host result compatibility 需要记录 structuredContent 和 text fallback 行为。
