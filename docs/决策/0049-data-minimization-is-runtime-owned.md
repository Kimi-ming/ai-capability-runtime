# 架构决策 0049：数据最小化由 运行时 拥有

日期：2026-05-08

状态：已接受

## 背景

如果模型或 Host 自由决定发送哪些字段，OpenCap 就无法稳定证明“只发送了必要数据”。Capability manifest 的 execution mapping 已经定义 URL/body/query/header 如何从 input 渲染，这应成为最小化依据。

## 决策

OpenCap Runtime 负责数据最小化。Runtime 只发送 execution mapping 引用的字段，不把整个 input 自动外发；确认、dry-run 和 audit 使用 Runtime-generated redacted egress preview。

## 影响

- T050/T053/T054 相关实现必须保留 field-level egress map。
- 未引用字段不得进入 request body/query/header。
- dry-run 输出必须展示 redacted egress preview。
