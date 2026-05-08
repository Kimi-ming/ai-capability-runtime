# 架构决策 0023：Consent 是 运行时 拥有的可审计对象

日期：2026-05-07

状态：已接受

## 背景

OpenCap 的核心价值之一是让 AI 调用真实能力时保持用户授权边界。只依赖 Host 文案或模型自然语言会导致确认语义不可控，也难以审计。

## 决策

V1 把 consent 建模为 Runtime-owned object。`ask` 决策必须产生 Consent Request；用户或 Host 的结果必须转成 Consent Receipt；receipt 写入 audit log。

MCP STDIO 无确认通道时返回 `confirmation_required`，不执行真实请求。

## 影响

- Policy Engine 不负责交互。
- Confirmation Handler 不负责执行。
- Consent summary 必须由 Runtime 根据 manifest、policy 和输入生成。
- 后续 MCP elicitation 只是 consent channel，不是新的执行捷径。
