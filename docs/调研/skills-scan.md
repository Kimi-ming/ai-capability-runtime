# 技能调研

日期：2026-05-07

本文记录 OpenCap 早期架构阶段使用或评估过的 skills 和工作流。

## 已使用的本地 Skills

### find-skills

用途：

- 搜索 MCP、runtime、安全和架构相关的 agent skills。

结果：

- `mapbox/mapbox-agent-skills@mapbox-mcp-runtime-patterns` 相关，安装量 418。
- `omer-metin/skills-for-antigravity@mcp-security` 相关，但安装量较低。
- `hack23/cia@mcp-gateway-security` 相关，但安装量较低。

决策：

- 暂不安装新 skill。
- 架构决策优先依据官方 MCP、OpenAI、A2A、OPA 和 OpenTelemetry 文档。
- 如果后续需要 MCP Runtime 实现模式，再评估 `mapbox-mcp-runtime-patterns`。

### documentation-writer

用途：

- 用 Diátaxis 思路组织文档。

映射：

- 教程：`docs/教程/getting-started.md`
- 操作指南：`docs/社区/registry-guidelines.md`
- 参考：`docs/规范/capability-manifest.md`
- 解释：`docs/概览/introduction.md`、`docs/设计/runtime-architecture.md`、`docs/安全/security-model.md`

### openai-docs

用途：

- 评估 Apps SDK、AgentKit、Agents SDK、MCP connectors 和安全建议时，优先使用 OpenAI 官方文档。

OpenCap 影响：

- OpenCap 应能对接 OpenAI 生态里的 MCP/App 表面。
- 但 OpenCap 不应成为 OpenAI-only 项目。

## 后续可能新增的 Skills

可考虑新增或创建：

- MCP 实现审查
- Runtime 安全审查
- Policy Engine 设计
- Registry 提交流程评审
- OpenTelemetry instrumentation
- CLI UX 评审

## 内部团队角色

在专门 skills 出现前，设计评审时使用这些工作角色：

- 产品架构：范围和用户价值
- 协议架构：MCP/A2A/OpenAPI 兼容性
- 安全评审：auth、policy、secrets、audit
- Runtime 工程：本地状态、执行、安装流程
- DX 评审：CLI、examples、docs、贡献流程
