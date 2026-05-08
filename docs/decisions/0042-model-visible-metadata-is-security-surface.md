# ADR 0042：模型可见元数据是安全表面

日期：2026-05-08

状态：已接受

## 背景

OpenCap 不做 Agent，但它会把 Capability 暴露给 Agent/Host。模型可见的工具描述、schema 字段描述和工具结果文本都可能成为间接 prompt injection、schema poisoning 或 tool poisoning 载体。

## 决策

OpenCap 将 model-visible metadata 视为安全表面。V1 对 manifest name、description、input/output schema descriptions 执行 lint，并把 tool result prompt-surface sanitizer 作为后续任务。

## 影响

- `opencap validate` 和 Registry CI 应包含 metadata lint。
- prompt injection 风险不只写在威胁模型里，必须进入测试夹具。
- description 不能作为 policy 或 consent 的授权来源。
