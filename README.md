# OpenCap

OpenCap 是一个面向 AI 原生应用的开源能力层。

它让开发者可以把 API、工具、数据源和业务服务定义成 AI 可调用的 Capability，并通过统一的本地或自托管 Runtime 完成安装、授权、调用、审计和验证。

OpenCap 不做智能体，不做聊天入口，也不做一个中心化工具市场。它要做的是 AI 时代的能力标准、运行时、注册表和开发者工具链。

## 为什么需要 OpenCap

大模型越来越会推理，但模型本身不能安全地直接操作真实世界。它仍然需要访问：

- API 和 SaaS 工具
- 私有数据源
- 用户账户权限
- 密钥和凭据
- 写操作和外部消息发送
- 调用日志和审计记录
- 能力验证与信任信息

OpenCap 提供：

- Capability Manifest 标准
- 本地优先的 Capability Runtime
- MCP 兼容的工具暴露方式
- 权限策略
- 调用日志
- Git-based Capability Registry
- 开发者 CLI 和 SDK 基础

## 设计原则

1. 能力优先，而不是智能体优先。
2. 本地优先，云端可选。
3. 默认受权限约束。
4. 每一次调用都必须可审计。
5. 兼容开放协议，不绑定单一厂商。
6. Registry 由社区治理。

## 核心流程

```text
Capability Manifest
        |
OpenCap CLI
        |
OpenCap Registry
        |
OpenCap Runtime
        |
MCP-compatible Host
        |
External API call
        |
Audit Log
```

## 仓库结构

```text
docs/        项目文档、需求、架构、审查和决策记录
rfcs/        标准和运行时行为的设计提案
packages/    spec、cli、runtime、mcp、sdk 和 adapters
apps/        本地 Console 与未来 Registry Web
registry/    Git-based 社区 Capability Registry
examples/    Capability 示例和 MCP Host 配置示例
```

## V1 范围

V1 要证明一个最小闭环：

```text
开发者写 manifest.yml
        |
opencap validate
        |
opencap install
        |
opencap serve --mcp
        |
AI Host 调用工具
        |
OpenCap 检查策略
        |
OpenCap 执行 HTTP Capability
        |
OpenCap 写入审计日志
```

V1 只支持 `type: http` 的 Capability。`mcp` 和 `local` 类型留到后续 RFC。

第一批示例能力：

- `github.create_issue`
- `github.search_repo`
- `vercel.get_deployments`
- `http.request_demo`

## 快速开始

当前仓库已经包含 V1 项目骨架和文档。第一阶段实现目标是 CLI 和 Runtime 闭环。

```bash
pnpm install
pnpm validate
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
```

Runtime 实现后，MCP Host 可以这样加载 OpenCap：

```json
{
  "mcpServers": {
    "opencap": {
      "command": "opencap",
      "args": ["serve", "--mcp"]
    }
  }
}
```

## 关键文档

- [体系蓝图](docs/SYSTEM.md)
- [互操作 Profiles](docs/ecosystem/interoperability-profiles.md)
- [确认与同意模型 V1](docs/design/confirmation-and-consent-v1.md)
- [Capability Package V1](docs/design/capability-package-v1.md)
- [Conformance Suite V1](docs/quality/conformance-suite-v1.md)
- [Agentic 风险映射](docs/security/agentic-risk-mapping.md)
- [版本和兼容性策略](docs/spec/versioning-and-compatibility.md)
- [Manifest 演进策略](docs/spec/manifest-evolution.md)
- [Registry 分发模型](docs/ecosystem/registry-distribution.md)
- [SDK 和 Adapter 边界](docs/design/sdk-and-adapter-boundary.md)
- [包发布策略 V1](docs/operations/package-publishing-v1.md)
- [签名和 Provenance 路线图](docs/security/signing-and-provenance-roadmap.md)
- [质量门禁](docs/quality/quality-gates.md)
- [Maintainer Guide](docs/community/maintainer-guide.md)
- [CHANGELOG](CHANGELOG.md)
- [Capability 分类体系](docs/ecosystem/capability-taxonomy.md)
- [Host 兼容性矩阵](docs/ecosystem/host-compatibility-matrix.md)
- [开源核心与未来 Cloud 边界](docs/ecosystem/open-core-boundary.md)
- [贡献者路径](docs/community/contributor-journey.md)
- [Capability 评审清单](docs/community/capability-review-checklist.md)
- [RFC 流程](docs/community/rfc-process.md)
- [可观测性和指标 V1](docs/operations/observability-metrics-v1.md)
- [Open Questions](docs/planning/open-questions.md)
- [CLI 契约 V1](docs/design/cli-contract-v1.md)
- [本地状态 V1](docs/design/local-state-v1.md)
- [配置模型 V1](docs/design/configuration-v1.md)
- [MCP 接口 V1](docs/design/mcp-interface-v1.md)
- [错误模型 V1](docs/design/error-model-v1.md)
- [隐私与数据保留 V1](docs/security/privacy-retention-v1.md)
- [CI 和安全基线](docs/operations/ci-security-baseline.md)
- [V1 实施计划](docs/planning/v1-implementation-plan.md)
- [HTTP 执行设计 V1](docs/design/http-execution-v1.md)
- [Policy DSL V1](docs/design/policy-dsl-v1.md)
- [Audit Log V1](docs/design/audit-log-v1.md)
- [Registry Test Format V1](docs/design/registry-test-format-v1.md)
- [Outbound Policy V1](docs/security/outbound-policy-v1.md)
- [供应链治理](docs/security/supply-chain-governance.md)
- [项目运行模型](docs/operations/operating-model.md)
- [风险和治理补充调研](docs/research/risk-governance-scan-2026-05-07.md)
- [产品战略](docs/product/strategy.md)
- [用户场景](docs/product/use-cases.md)
- [Capability 生命周期](docs/product/capability-lifecycle.md)
- [领域模型](docs/design/domain-model.md)
- [Runtime 契约](docs/design/runtime-contracts.md)
- [协议定位](docs/protocols/protocol-positioning.md)
- [威胁模型](docs/security/threat-model.md)
- [发布门禁](docs/operations/release-readiness.md)
- [协议生态补充调研](docs/research/protocol-scan-2026-05-07.md)
- [项目介绍](docs/introduction.md)
- [快速入门](docs/getting-started.md)
- [Capability Manifest](docs/capability-manifest.md)
- [权限模型](docs/permission-model.md)
- [Runtime 架构](docs/runtime-architecture.md)
- [Registry 指南](docs/registry-guidelines.md)
- [安全模型](docs/security-model.md)
- [路线图](docs/ROADMAP.md)
- [V1 需求](docs/planning/v1-requirements.md)
- [V1 架构](docs/planning/v1-architecture.md)
- [技术方案审查](docs/reviews/technical-plan-review-2026-05-07.md)
- [开发任务总表](docs/TASKS.md)
- [测试策略](docs/TESTING.md)
- [当前状态交接](docs/HANDOFF.md)
- [文档地图](docs/INDEX.md)
- [开发工作流](docs/WORKFLOW.md)
- [需求追踪矩阵](docs/planning/traceability-matrix.md)
- [V1 里程碑门禁](docs/planning/v1-milestones.md)
- [风险登记](docs/RISKS.md)
- [术语表](docs/GLOSSARY.md)

## 开源治理

- [贡献指南](CONTRIBUTING.md)
- [治理说明](GOVERNANCE.md)
- [安全政策](SECURITY.md)
- [行为准则](CODE_OF_CONDUCT.md)

## License

MIT
