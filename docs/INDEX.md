# 文档索引

本文是 OpenCap 文档的维护者索引。第一次阅读请先看 [中文文档中心](README.md)。

## 当前结论

- OpenCap 文档统一使用中文为主。
- `docs/README.md` 是读者入口。
- `docs/INDEX.md` 是维护者索引。
- `docs/HANDOFF.md` 只记录当前状态。
- `docs/TASKS.md` 是开发任务源。
- `docs/decisions/` 和 `rfcs/` 记录长期决策，不放临时想法。
- `docs/research/` 只保留调研和参考，不作为实现契约。

## 核心入口

| 文档 | 职责 | 什么时候更新 |
| --- | --- | --- |
| [中文文档中心](README.md) | 面向新人和维护者的阅读入口 | 文档结构、阅读路径变化时 |
| [中文文档规范](community/documentation-governance.md) | 语言、分层、命名和清理规则 | 文档治理规则变化时 |
| [体系蓝图](SYSTEM.md) | 全局系统结构和子系统列表 | 新增子系统或全局不变量变化时 |
| [产品规格](SPEC.md) | V1 范围和产品正确性 | 行为、范围或验收口径变化时 |
| [架构总览](ARCHITECTURE.md) | 模块边界和主调用链 | Runtime/CLI/MCP/Registry 边界变化时 |
| [开发任务总表](TASKS.md) | 任务队列和验收标准 | 每次新增、拆分、完成任务时 |
| [当前状态交接](HANDOFF.md) | 当前阶段、验证、下一步 | 每次任务结束时 |
| [验证策略](TESTING.md) | 可运行验证和测试计划 | 命令、测试范围、缺口变化时 |
| [决策索引](DECISIONS.md) | 已接受 ADR 总览 | 新增或调整 ADR 时 |
| [风险登记](RISKS.md) | High/Medium/Low 风险 | 发现、缓解或关闭风险时 |

## 目录职责

| 目录 | 类型 | 职责 |
| --- | --- | --- |
| `docs/overview/` | 解释 | 项目介绍和总体背景。 |
| `docs/guides/` | 教程 | 快速开始和学习路径。 |
| `docs/product/` | 解释 | 产品定位、用户场景、能力生命周期。 |
| `docs/spec/` | 参考 | Manifest、版本、兼容性等规范演进。 |
| `docs/design/` | 参考 | 运行时、命令行、MCP、策略、审计、HTTP、结果等模块契约。 |
| `docs/security/` | 参考/解释 | 威胁模型、安全边界、数据治理、供应链、凭据和最小权限。 |
| `docs/ecosystem/` | 解释 | 注册表、互操作、信任、发现选择、商业边界等生态规则。 |
| `docs/quality/` | 参考 | 一致性测试、质量门禁、证据、校验和 provenance。 |
| `docs/operations/` | 操作指南 | 发布、凭据、故障恢复、计量和运行手册。 |
| `docs/community/` | 操作指南 | 贡献者、维护者、RFC、Registry 和文档治理流程。 |
| `docs/planning/` | 规划 | 需求、里程碑、实施计划、开放问题和追踪矩阵。 |
| `docs/decisions/` | 决策 | 已接受 ADR。 |
| `docs/research/` | 调研 | 外部参考和阶段性研究，不能单独作为实现依据。 |
| `docs/reviews/` | 审查 | 阶段性技术审查。 |
| `rfcs/` | 决策前草案 | 需要社区讨论或兼容性评估的提案。 |
| `examples/` | 教程/示例 | 示例能力和 Host 配置。 |
| `registry/` | Registry 条目 | Git-based 能力注册表源数据。 |

## 阅读路径

### 新人 15 分钟路径

1. [README](../README.md)
2. [中文文档中心](README.md)
3. [体系蓝图](SYSTEM.md)
4. [当前状态交接](HANDOFF.md)
5. [开发任务总表](TASKS.md)

### 架构评审路径

1. [架构总览](ARCHITECTURE.md)
2. [运行时契约](design/runtime-contracts.md)
3. [决策索引](DECISIONS.md)
4. [风险登记](RISKS.md)
5. [一致性测试体系](quality/conformance-suite-v1.md)

### 实现任务路径

1. [当前状态交接](HANDOFF.md)
2. [开发任务总表](TASKS.md)
3. 当前任务引用的 `docs/design/` 或 `docs/security/` 文档
4. [验证策略](TESTING.md)
5. [开发工作流](WORKFLOW.md)

## 维护规则

- 新增主路径文档时，同步 `docs/README.md` 和本文件。
- 新增长期设计取舍时，同步 `docs/DECISIONS.md`。
- 新增安全风险时，同步 `docs/RISKS.md`。
- 新增实现工作时，同步 `docs/TASKS.md`。
- 修改命令、测试、构建或验证流程时，同步 `docs/TESTING.md`。
- 每轮任务结束时，同步 `docs/HANDOFF.md`，并提交推送。

## 文件归位原则

`docs/` 根目录只保留核心入口、状态和治理文件；教程、参考、规范、模板和说明文档必须放入对应子目录。后续如果继续移动文件，必须同步更新 `docs/README.md`、本文件、`docs/TASKS.md`、`docs/HANDOFF.md` 和所有引用链接，并运行文档闭环检查。
