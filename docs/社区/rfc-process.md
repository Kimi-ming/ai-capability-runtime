# 提案流程

本文定义 OpenCap 如何处理较大的设计变化。

## 什么时候需要 RFC

需要 RFC：

- 新 Capability type。
- 新协议适配，例如 A2A。
- Policy DSL 重大变化。
- Remote Runtime。
- OAuth 完整 flow。
- Registry trust/signature 模型。
- 破坏性 schema 变更。

不需要 RFC：

- 小型 bug fix。
- 文档澄清。
- 不改变契约的内部重构。
- 新增普通 Registry Capability。

## RFC 文件位置

```text
rfcs/NNNN-title.md
```

## RFC 模板

复制 `rfcs/TEMPLATE.md`，命名为 `rfcs/NNNN-title.md`，再按提案内容填写。模板要求覆盖：

- 状态和元数据：作者、创建日期、目标阶段、相关任务、ADR 和文档。
- 摘要、背景、目标、非目标和术语。
- 设计、示例、安全隐私、兼容迁移、验证计划和发布运维。
- 替代方案、开放问题和最终决策结果。

RFC 示例不允许包含真实 token、私有 URL、用户数据、生产日志或 provider raw response。

## RFC 到 ADR

RFC 是提案，ADR 是已接受决策。一个 RFC 被接受后，应补充或链接对应 ADR。

## 决策规则

- 安全边界变化必须有安全评审。
- Manifest schema 变化必须有迁移策略。
- Runtime pipeline 变化必须更新 `docs/设计/runtime-contracts.md`。
- 协议适配变化必须更新 `docs/协议/protocol-positioning.md`。
