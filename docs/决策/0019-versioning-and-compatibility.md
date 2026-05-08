# 架构决策 0019：版本和兼容性策略

日期：2026-05-07

状态：已接受

## 背景

OpenCap 的公共契约包括 manifest schema、CLI、Policy DSL、Audit log、MCP result shape 和 package exports。没有版本策略会让生态集成无法判断升级风险。

## 决策

OpenCap 采用 SemVer 思路。`0.x` 阶段允许快速演进，但破坏性变化仍必须记录在 CHANGELOG，并在影响较大时写 ADR/RFC。

公共契约定义见 `docs/规范/versioning-and-compatibility.md`。

## 影响

- V1 前也要记录 breaking changes。
- Manifest 和 Capability version 都使用 SemVer。
- 发布前必须更新 CHANGELOG。
