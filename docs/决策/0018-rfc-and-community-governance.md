# 架构决策 0018：RFC 与社区治理流程

日期：2026-05-07

状态：已接受

## 背景

OpenCap 是生态型基础设施，未来会出现 schema、policy、runtime、protocol adapter 等影响面很大的设计变化。仅靠 issue 评论不足以承载这些决策。

## 决策

较大设计变化使用 RFC，已接受结果进入 ADR。Capability 普通提交走 review checklist，不需要 RFC。

需要 RFC 的变化包括：

- 新 Capability type。
- A2A 或新协议适配。
- Remote Runtime。
- OAuth 完整 flow。
- 破坏性 schema 变化。
- Registry signature/trust 模型。

## 影响

- 新增 `docs/社区/rfc-process.md`。
- 设计争议从 PR 评论升级到 RFC。
- ADR 保持最终决策索引。
