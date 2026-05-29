# 中文文档中心

本文是 OpenCap 文档的第一入口。项目当前处于 V1 前期架构设计和实现准备阶段，文档数量较多，阅读时不要从文件树随机打开，而应按本文路径进入。

## 先读这 8 份

| 顺序 | 文档 | 作用 |
| --- | --- | --- |
| 1 | [体系蓝图](SYSTEM.md) | 了解 OpenCap 是什么、由哪些子系统组成。 |
| 2 | [整体系统设计 V1](设计/整体系统设计-v1.md) | 理解五个平面、三条链路和 Runtime Kernel。 |
| 3 | [Runtime Kernel 公共契约 V1](设计/runtime-kernel-contract-v1.md) | 理解 CLI、MCP 和未来入口共享的运行时公共语言。 |
| 4 | [OpenCap 术语表](术语表.md) | 对齐 Capability、Runtime、Registry、policy、provenance 等术语。 |
| 5 | [产品规格](SPEC.md) | 明确 V1 做什么、不做什么。 |
| 6 | [架构总览](ARCHITECTURE.md) | 了解 Runtime、CLI、MCP、Registry 的边界。 |
| 7 | [当前状态交接](HANDOFF.md) | 接手当前工作，知道最近完成了什么。 |
| 8 | [开发任务总表](TASKS.md) | 选择下一项可执行任务。 |
| 9 | [验证策略](TESTING.md) | 知道任务完成前要跑哪些验证。 |

## 按目的阅读

### 我想理解这个项目

- [项目介绍](概览/introduction.md)
- [产品战略](产品/strategy.md)
- [用户场景](产品/use-cases.md)
- [OpenCap 术语表](术语表.md)
- [体系蓝图](SYSTEM.md)
- [路线图](ROADMAP.md)

### 我要开始开发

- [开发环境](教程/开发环境.md)
- [第一次贡献 OpenCap](教程/first-contribution.md)
- [当前状态交接](HANDOFF.md)
- [开发任务总表](TASKS.md)
- [开发工作流](WORKFLOW.md)
- [V1 实施计划](规划/v1-implementation-plan.md)
- [验证策略](TESTING.md)
- [发布成熟度门禁](运营/release-readiness.md)
- [Release Checklist](releases/release-checklist.md)
- [Alpha Release Checklist](releases/alpha-checklist.md)
- [npm Trusted Publishing Workflow 草案](运营/npm-trusted-publishing-workflow.md)

### 我要审查架构

- [整体系统设计 V1](设计/整体系统设计-v1.md)
- [Runtime Kernel 公共契约 V1](设计/runtime-kernel-contract-v1.md)
- [整体设计二次审查](评审/整体设计二次审查-2026-05-08.md)
- [架构总览](ARCHITECTURE.md)
- [运行时契约](设计/runtime-contracts.md)
- [Interoperability Profile Evidence Record Schema](生态/interoperability-evidence-record-schema.md)
- [领域模型](设计/domain-model.md)
- [架构决策索引](DECISIONS.md)
- [RFC 模板](../rfcs/TEMPLATE.md)
- [风险登记](RISKS.md)
- [需求-任务-测试追踪矩阵](规划/traceability-matrix.md)

### 我要实现 V1 主路径

- [能力清单](规范/capability-manifest.md)
- [版本和兼容性策略](规范/versioning-and-compatibility.md)
- [Runtime Kernel 公共契约 V1](设计/runtime-kernel-contract-v1.md)
- [命令行契约 V1](设计/cli-contract-v1.md)
- [本地状态 V1](设计/local-state-v1.md)
- [策略 DSL V1](设计/policy-dsl-v1.md)
- [审计日志 V1](设计/audit-log-v1.md)
- [HTTP 执行设计 V1](设计/http-execution-v1.md)
- [MCP 接口 V1](设计/mcp-interface-v1.md)
- [连接 MCP Host 手动测试指南](教程/connect-mcp-host.md)
- [MCP Elicitation Profile V1 RFC](../rfcs/0010-mcp-elicitation-profile-v1.md)
- [A2A Agent Card Mapping Profile V1 RFC](../rfcs/0011-a2a-agent-card-mapping-v1.md)
- [Remote Runtime OAuth Profile V1 RFC](../rfcs/0012-remote-runtime-oauth-profile-v1.md)
- [Registry Index Signing V1 RFC](../rfcs/0013-registry-index-signing-v1.md)
- [Registry Index、Cache 和 Sync Profile V1 RFC](../rfcs/0014-registry-index-cache-sync-v1.md)
- [OpenAPI Adapter Profile V1 RFC](../rfcs/0015-openapi-adapter-profile-v1.md)
- [Retry and Idempotency Manifest Profile V1 RFC](../rfcs/0016-retry-idempotency-manifest-profile-v1.md)
- [Duplicate Invocation Detector V1 草案](设计/duplicate-invocation-detector-v1.md)
- [Composition Profile V1 RFC](../rfcs/0017-composition-profile-v1.md)
- [Plan Hash 与 Evidence Chain V1 草案](设计/plan-hash-evidence-chain-v1.md)
- [Capability Graph Metadata V1 RFC](../rfcs/0018-capability-graph-metadata-v1.md)

### 我要处理安全和治理

- [威胁模型](安全/threat-model.md)
- [权限模型](安全/permission-model.md)
- [身份与授权模型](安全/identity-and-auth-model.md)
- [Secret Resolver V1](设计/secret-resolver-v1.md)
- [GitHub fine-grained token 设置指南](教程/github-fine-grained-token-setup.md)
- [数据外发策略](设计/data-egress-policy-v1.md)
- [策略决策追踪](设计/policy-decision-trace-v1.md)
- [策略生命周期与变更控制](运营/policy-lifecycle-and-change-control.md)
- [能力安全公告流程](安全/capability-advisory-process.md)
- [能力弃用、下架与撤销](生态/capability-deprecation-and-revocation.md)
- [包发布策略 V1](运营/package-publishing-v1.md)
- [签名和来源证明路线图](安全/signing-and-provenance-roadmap.md)
- [Policy 事故响应手册](运营/policy-incident-runbook.md)

### 我要贡献 Capability 或 Registry 条目

- 先用 `opencap init <capability-id> --category <name> --output <dir>` 生成本地 V1 HTTP Capability 初稿，再按作者教程检查 manifest、README、registry test 和安全边界。
- 用 `opencap registry search <query> --registry registry` 和 `opencap registry show <capability-id> --registry registry` 做本地发现与审查；这两个命令不安装、不授权、不改变 policy，也不会把未安装 Capability 暴露给 MCP Host。
- 用 `opencap registry advisory list --registry registry` 查看本地 Registry 公告，可加 `--capability`、`--severity`、`--status` 做本地筛选；用 `opencap registry advisory show <advisory-id> --registry registry` 查看单条公告详情；用 `opencap advisory check --state-dir <path> --registry registry --capability <id> --severity <level> --status <status>` 检查本地已安装能力是否命中公告并收敛 evidence。这些命令只产生 evidence/告警，不自动卸载、不授权、不修改 policy。
- [编写一个 Capability](教程/write-a-capability.md)
- [GitHub fine-grained token 设置指南](教程/github-fine-grained-token-setup.md)
- [评审一个 Capability PR](教程/review-a-capability.md)
- [Registry 供应链 Review 工作流](社区/registry-supply-chain-review.md)
- [Registry 指南](社区/registry-guidelines.md)
- [Registry 根目录说明](../registry/README.md)
- [能力分类体系](生态/capability-taxonomy.md)
- [能力图 V1](生态/capability-graph-v1.md)
- [Registry Graph Index V1 草案](生态/registry-graph-index-v1.md)
- [Capability Graph Metadata V1 RFC](../rfcs/0018-capability-graph-metadata-v1.md)
- [风险放大评审清单](社区/risk-amplification-review-checklist.md)
- [Compensation Capability 评审规则](社区/compensation-capability-review-rules.md)
- [Paid Capability Manifest Metadata V1 RFC](../rfcs/0019-paid-capability-manifest-v1.md)
- [Commerce Profile V1 RFC](../rfcs/0020-commerce-profile-v1.md)
- [能力包结构](设计/capability-package-v1.md)
- [能力评审清单](社区/capability-review-checklist.md)
- [贡献者路径](社区/contributor-journey.md)

## 文档分层

| 层级 | 目录 | 职责 |
| --- | --- | --- |
| 入口层 | `README.md`、`docs/README.md`、`docs/INDEX.md` | 帮读者找到正确文档。 |
| 产品层 | `docs/产品/`、`docs/SPEC.md`、`docs/ROADMAP.md` | 解释目标、范围、用户和阶段。 |
| 架构层 | `docs/ARCHITECTURE.md`、`docs/设计/`、`docs/生态/` | 定义系统边界、模块契约和生态规则。 |
| 安全层 | `docs/安全/`、`docs/RISKS.md` | 定义威胁、控制和安全不变量。 |
| 质量层 | `docs/质量/`、`docs/TESTING.md` | 定义验证、证据和一致性测试。 |
| 运营层 | `docs/运营/` | 定义发布、故障恢复、凭据和运行流程。 |
| 规划层 | `docs/规划/`、`docs/TASKS.md`、`docs/HANDOFF.md` | 管理任务、里程碑、交接和追踪。 |
| 决策层 | `docs/DECISIONS.md`、`docs/决策/`、`rfcs/` | 保留长期架构取舍。 |
| 调研层 | `docs/调研/`、`docs/评审/` | 保留外部参考和阶段性审查，不作为实现契约。 |

## 语言规则

项目文档默认使用中文。协议名、包名、命令、字段名、错误码、文件路径和标准名可以保留英文，例如 `MCP`、`Capability`、`manifest.yml`、`opencap validate`。

新增或修改文档时请遵守 [中文文档规范](社区/documentation-governance.md)。
