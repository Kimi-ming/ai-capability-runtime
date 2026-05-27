# 文档索引

本文是 OpenCap 文档的维护者索引。第一次阅读请先看 [中文文档中心](README.md)。

## 当前结论

- OpenCap 文档统一使用中文为主。
- `docs/README.md` 是读者入口。
- `docs/INDEX.md` 是维护者索引。
- `docs/HANDOFF.md` 只记录当前状态。
- `docs/TASKS.md` 是开发任务源。
- `docs/决策/` 和 `rfcs/` 记录长期决策，不放临时想法。
- `docs/调研/` 只保留调研和参考，不作为实现契约。

## 核心入口

| 文档 | 职责 | 什么时候更新 |
| --- | --- | --- |
| [中文文档中心](README.md) | 面向新人和维护者的阅读入口 | 文档结构、阅读路径变化时 |
| [OpenCap 术语表](术语表.md) | 统一 Capability、Runtime、Registry、policy、provenance 等高频术语 | 新增 profile、schema 字段、安全边界或治理概念时 |
| [中文文档规范](社区/documentation-governance.md) | 语言、分层、命名和清理规则 | 文档治理规则变化时 |
| [体系蓝图](SYSTEM.md) | 全局系统结构和子系统列表 | 新增子系统或全局不变量变化时 |
| [产品规格](SPEC.md) | V1 范围和产品正确性 | 行为、范围或验收口径变化时 |
| [整体系统设计 V1](设计/整体系统设计-v1.md) | 五个平面、三条链路、Runtime Kernel 和生态闭环 | 总体架构模型、扩展边界或生态阶段变化时 |
| [Runtime Kernel 公共契约 V1](设计/runtime-kernel-contract-v1.md) | Runtime 对 CLI/MCP/未来入口暴露的公共 request/result/error/evidence 语言 | Runtime public types、adapter 边界或 gate 顺序变化时 |
| [整体设计二次审查](评审/整体设计二次审查-2026-05-08.md) | 工程缺口、补强路线和成熟度评分 | 大设计补强、实现前架构审查或阶段复盘时 |
| [架构总览](ARCHITECTURE.md) | 模块边界和主调用链 | Runtime/CLI/MCP/Registry 边界变化时 |
| [开发任务总表](TASKS.md) | 任务队列和验收标准 | 每次新增、拆分、完成任务时 |
| [当前状态交接](HANDOFF.md) | 当前阶段、验证、下一步 | 每次任务结束时 |
| [验证策略](TESTING.md) | 可运行验证和测试计划 | 命令、测试范围、缺口变化时 |
| [Policy 事故响应手册](运营/policy-incident-runbook.md) | 策略误放开、override 滥用和紧急阻断恢复流程 | 事故响应流程、policy rollback 或 advisory/revocation 联动变化时 |
| [GitHub fine-grained token 设置指南](教程/github-fine-grained-token-setup.md) | `github.create_issue` 示例能力的最小权限 token 设置流程 | GitHub token 权限、凭据边界或示例能力认证方式变化时 |
| [风险放大评审清单](社区/risk-amplification-review-checklist.md) | Registry PR 中识别跨能力组合、外发、destructive、financial 和 credential scope 风险放大 | Capability graph marker、Registry review 或组合风险规则变化时 |
| [Compensation Capability 评审规则](社区/compensation-capability-review-rules.md) | Registry PR 中评审撤销、取消、退款、关闭和修正类补偿能力 | Compensation 语义、组合失败恢复或 Capability review 规则变化时 |
| [Registry Graph Index V1 草案](生态/registry-graph-index-v1.md) | 定义 future graph index envelope、节点/边 entry、默认过滤和 cache 边界 | Capability graph index、Registry discovery 或组合风险 inspection 变化时 |
| [Paid Capability Manifest Metadata V1 RFC](../rfcs/0019-paid-capability-manifest-v1.md) | 定义 future paid capability manifest metadata 和 non-billing 边界 | Paid metadata、commerce profile 或 usage/billing 边界变化时 |
| [版本和兼容性策略](规范/versioning-and-compatibility.md) | Package、schema 和 Registry 兼容规则 | 版本、发布或公共契约变化时 |
| [发布成熟度门禁](运营/release-readiness.md) | v0.1-v1.0 release maturity gate matrix | 发布阶段、hard gate、release notes 或发布承诺变化时 |
| [Release Checklist](releases/release-checklist.md) | 发布前逐项操作和 evidence 记录格式 | 发布流程、验证命令或 release evidence 变化时 |
| [Alpha Release Checklist](releases/alpha-checklist.md) | Alpha 发布前门禁 | 发布范围、阻断项或发布流程变化时 |
| [包发布策略 V1](运营/package-publishing-v1.md) | npm package 发布范围、顺序、provenance 和不发布条件 | 包范围、发布顺序或 trusted publishing 策略变化时 |
| [npm Trusted Publishing Workflow 草案](运营/npm-trusted-publishing-workflow.md) | npm trusted publishing/OIDC 发布草案 | npm provider、workflow、provenance 或 release evidence 变化时 |
| [决策索引](DECISIONS.md) | 已接受 ADR 总览 | 新增或调整 ADR 时 |
| [RFC 模板](../rfcs/TEMPLATE.md) | 新 RFC 的复制模板 | RFC 章节、评审要求或证据格式变化时 |
| [风险登记](RISKS.md) | High/Medium/Low 风险 | 发现、缓解或关闭风险时 |

## 目录职责

| 目录 | 类型 | 职责 |
| --- | --- | --- |
| `docs/概览/` | 解释 | 项目介绍和总体背景。 |
| `docs/教程/` | 教程 | 快速开始和学习路径。 |
| `docs/产品/` | 解释 | 产品定位、用户场景、能力生命周期。 |
| `docs/规范/` | 参考 | Manifest、版本、兼容性等规范演进。 |
| `docs/设计/` | 参考 | 运行时、命令行、MCP、策略、审计、HTTP、结果等模块契约。 |
| `docs/安全/` | 参考/解释 | 威胁模型、安全边界、数据治理、供应链、凭据和最小权限。 |
| `docs/生态/` | 解释 | 注册表、互操作、信任、发现选择、商业边界等生态规则。 |
| `docs/质量/` | 参考 | 一致性测试、质量门禁、证据、校验和 provenance。 |
| `docs/运营/` | 操作指南 | 发布、凭据、故障恢复、计量和运行手册。 |
| `docs/社区/` | 操作指南 | 贡献者、维护者、RFC、Registry 和文档治理流程。 |
| `docs/规划/` | 规划 | 需求、里程碑、实施计划、开放问题和追踪矩阵。 |
| `docs/决策/` | 决策 | 已接受 ADR。 |
| `docs/调研/` | 调研 | 外部参考和阶段性研究，不能单独作为实现依据。 |
| `docs/评审/` | 审查 | 阶段性技术审查。 |
| `rfcs/` | 决策前草案 | 需要社区讨论或兼容性评估的提案。 |
| `examples/` | 教程/示例 | 示例能力和 Host 配置。 |
| `registry/` | Registry 条目 | Git-based 能力注册表源数据。 |

## 阅读路径

### 新人 15 分钟路径

1. [README](../README.md)
2. [中文文档中心](README.md)
3. [OpenCap 术语表](术语表.md)
4. [第一次贡献 OpenCap](教程/first-contribution.md)
5. [体系蓝图](SYSTEM.md)
6. [当前状态交接](HANDOFF.md)
7. [开发任务总表](TASKS.md)

### 架构评审路径

1. [整体系统设计 V1](设计/整体系统设计-v1.md)
2. [Runtime Kernel 公共契约 V1](设计/runtime-kernel-contract-v1.md)
3. [OpenCap 术语表](术语表.md)
4. [整体设计二次审查](评审/整体设计二次审查-2026-05-08.md)
5. [架构总览](ARCHITECTURE.md)
6. [运行时契约](设计/runtime-contracts.md)
7. [Interoperability Profile Evidence Record Schema](生态/interoperability-evidence-record-schema.md)
8. [决策索引](DECISIONS.md)
9. [风险登记](RISKS.md)
10. [一致性测试体系](质量/conformance-suite-v1.md)

### 实现任务路径

1. [第一次贡献 OpenCap](教程/first-contribution.md)
2. [当前状态交接](HANDOFF.md)
3. [开发任务总表](TASKS.md)
4. 当前任务引用的 `docs/设计/` 或 `docs/安全/` 文档
5. [整体系统设计 V1](设计/整体系统设计-v1.md) 中对应平面和链路
6. [验证策略](TESTING.md)
7. [连接 MCP Host 手动测试指南](教程/connect-mcp-host.md)
8. [MCP Elicitation Profile V1 RFC](../rfcs/0010-mcp-elicitation-profile-v1.md)
9. [A2A Agent Card Mapping Profile V1 RFC](../rfcs/0011-a2a-agent-card-mapping-v1.md)
10. [Remote Runtime OAuth Profile V1 RFC](../rfcs/0012-remote-runtime-oauth-profile-v1.md)
11. [Registry Index Signing V1 RFC](../rfcs/0013-registry-index-signing-v1.md)
12. [Registry Index、Cache 和 Sync Profile V1 RFC](../rfcs/0014-registry-index-cache-sync-v1.md)
13. [OpenAPI Adapter Profile V1 RFC](../rfcs/0015-openapi-adapter-profile-v1.md)
14. [Retry and Idempotency Manifest Profile V1 RFC](../rfcs/0016-retry-idempotency-manifest-profile-v1.md)
15. [Duplicate Invocation Detector V1 草案](设计/duplicate-invocation-detector-v1.md)
16. [Composition Profile V1 RFC](../rfcs/0017-composition-profile-v1.md)
17. [Plan Hash 与 Evidence Chain V1 草案](设计/plan-hash-evidence-chain-v1.md)
18. [Capability Graph Metadata V1 RFC](../rfcs/0018-capability-graph-metadata-v1.md)
19. [开发工作流](WORKFLOW.md)
20. [Release Checklist](releases/release-checklist.md)
21. [Alpha Release Checklist](releases/alpha-checklist.md)
22. [发布成熟度门禁](运营/release-readiness.md)
23. [版本和兼容性策略](规范/versioning-and-compatibility.md)

### Capability 贡献评审路径

1. [编写一个 Capability](教程/write-a-capability.md)
2. [GitHub fine-grained token 设置指南](教程/github-fine-grained-token-setup.md)
3. [评审一个 Capability PR](教程/review-a-capability.md)
4. [Registry 供应链 Review 工作流](社区/registry-supply-chain-review.md)
5. [注册表指南](社区/registry-guidelines.md)
6. [能力分类体系](生态/capability-taxonomy.md)
7. [能力图 V1](生态/capability-graph-v1.md)
8. [Registry Graph Index V1 草案](生态/registry-graph-index-v1.md)
9. [风险放大评审清单](社区/risk-amplification-review-checklist.md)
10. [Compensation Capability 评审规则](社区/compensation-capability-review-rules.md)
11. [Paid Capability Manifest Metadata V1 RFC](../rfcs/0019-paid-capability-manifest-v1.md)
12. [能力评审清单](社区/capability-review-checklist.md)

## 维护规则

- 新增主路径文档时，同步 `docs/README.md` 和本文件。
- 新增高频术语、profile id、schema 字段或安全边界时，同步 `docs/术语表.md`。
- 新增长期设计取舍时，同步 `docs/DECISIONS.md`。
- 新增安全风险时，同步 `docs/RISKS.md`。
- 新增实现工作时，同步 `docs/TASKS.md`。
- 修改命令、测试、构建或验证流程时，同步 `docs/TESTING.md`。
- 每轮任务结束时，同步 `docs/HANDOFF.md`，并提交推送。

## 文件归位原则

`docs/` 根目录只保留核心入口、状态和治理文件；教程、参考、规范、模板和说明文档必须放入对应子目录。后续如果继续移动文件，必须同步更新 `docs/README.md`、本文件、`docs/TASKS.md`、`docs/HANDOFF.md` 和所有引用链接，并运行文档闭环检查。
