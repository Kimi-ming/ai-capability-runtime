# 中文文档中心

本文是 OpenCap 文档的第一入口。项目当前处于 V1 前期架构设计和实现准备阶段，文档数量较多，阅读时不要从文件树随机打开，而应按本文路径进入。

## 先读这 6 份

| 顺序 | 文档 | 作用 |
| --- | --- | --- |
| 1 | [体系蓝图](SYSTEM.md) | 了解 OpenCap 是什么、由哪些子系统组成。 |
| 2 | [产品规格](SPEC.md) | 明确 V1 做什么、不做什么。 |
| 3 | [架构总览](ARCHITECTURE.md) | 了解 Runtime、CLI、MCP、Registry 的边界。 |
| 4 | [当前状态交接](HANDOFF.md) | 接手当前工作，知道最近完成了什么。 |
| 5 | [开发任务总表](TASKS.md) | 选择下一项可执行任务。 |
| 6 | [验证策略](TESTING.md) | 知道任务完成前要跑哪些验证。 |

## 按目的阅读

### 我想理解这个项目

- [项目介绍](introduction.md)
- [产品战略](product/strategy.md)
- [用户场景](product/use-cases.md)
- [体系蓝图](SYSTEM.md)
- [路线图](ROADMAP.md)

### 我要开始开发

- [当前状态交接](HANDOFF.md)
- [开发任务总表](TASKS.md)
- [开发工作流](WORKFLOW.md)
- [V1 实施计划](planning/v1-implementation-plan.md)
- [验证策略](TESTING.md)

### 我要审查架构

- [架构总览](ARCHITECTURE.md)
- [运行时契约](design/runtime-contracts.md)
- [领域模型](design/domain-model.md)
- [架构决策索引](DECISIONS.md)
- [风险登记](RISKS.md)
- [需求-任务-测试追踪矩阵](planning/traceability-matrix.md)

### 我要实现 V1 主路径

- [能力清单](capability-manifest.md)
- [命令行契约 V1](design/cli-contract-v1.md)
- [本地状态 V1](design/local-state-v1.md)
- [策略 DSL V1](design/policy-dsl-v1.md)
- [审计日志 V1](design/audit-log-v1.md)
- [HTTP 执行设计 V1](design/http-execution-v1.md)
- [MCP 接口 V1](design/mcp-interface-v1.md)

### 我要处理安全和治理

- [威胁模型](security/threat-model.md)
- [权限模型](permission-model.md)
- [身份与授权模型](security/identity-and-auth-model.md)
- [Secret Resolver V1](design/secret-resolver-v1.md)
- [数据外发策略](design/data-egress-policy-v1.md)
- [策略决策追踪](design/policy-decision-trace-v1.md)
- [策略生命周期与变更控制](operations/policy-lifecycle-and-change-control.md)

### 我要贡献 Capability 或 Registry 条目

- [Registry 指南](registry-guidelines.md)
- [能力包结构](design/capability-package-v1.md)
- [能力评审清单](community/capability-review-checklist.md)
- [贡献者路径](community/contributor-journey.md)

## 文档分层

| 层级 | 目录 | 职责 |
| --- | --- | --- |
| 入口层 | `README.md`、`docs/README.md`、`docs/INDEX.md` | 帮读者找到正确文档。 |
| 产品层 | `docs/product/`、`docs/SPEC.md`、`docs/ROADMAP.md` | 解释目标、范围、用户和阶段。 |
| 架构层 | `docs/ARCHITECTURE.md`、`docs/design/`、`docs/ecosystem/` | 定义系统边界、模块契约和生态规则。 |
| 安全层 | `docs/security/`、`docs/RISKS.md` | 定义威胁、控制和安全不变量。 |
| 质量层 | `docs/quality/`、`docs/TESTING.md` | 定义验证、证据和一致性测试。 |
| 运营层 | `docs/operations/` | 定义发布、故障恢复、凭据和运行流程。 |
| 规划层 | `docs/planning/`、`docs/TASKS.md`、`docs/HANDOFF.md` | 管理任务、里程碑、交接和追踪。 |
| 决策层 | `docs/DECISIONS.md`、`docs/decisions/`、`rfcs/` | 保留长期架构取舍。 |
| 调研层 | `docs/research/`、`docs/reviews/` | 保留外部参考和阶段性审查，不作为实现契约。 |

## 语言规则

项目文档默认使用中文。协议名、包名、命令、字段名、错误码、文件路径和标准名可以保留英文，例如 `MCP`、`Capability`、`manifest.yml`、`opencap validate`。

新增或修改文档时请遵守 [中文文档规范](documentation-governance.md)。
