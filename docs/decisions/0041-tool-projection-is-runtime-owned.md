# ADR 0041：MCP Tool Projection 由 Runtime 拥有

日期：2026-05-08

状态：已接受

## 背景

MCP `tools/list` 暴露的 tool name、title、description 和 schema 会进入 Host 和模型上下文。如果 Runtime 直接透传第三方 manifest description，恶意或误导性文案可能影响模型选择工具或填写参数。

## 决策

OpenCap V1 的 MCP Tool Projection 由 Runtime 生成。Manifest description 只是 safe summary 的候选输入，必须先通过 model-visible metadata lint，再进入固定模板。

README、远程文档和自由格式 Registry 文案不进入 V1 model-visible projection。

## 影响

- `@opencap/mcp` 需要 projection builder。
- tools/list description 必须使用 Runtime 模板。
- projection hash 可进入 audit/evidence。
- Capability review 需要检查模型可见字段。
