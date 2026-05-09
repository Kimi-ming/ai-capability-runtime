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
| [决策索引](DECISIONS.md) | 已接受 ADR 总览 | 新增或调整 ADR 时 |
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
3. [体系蓝图](SYSTEM.md)
4. [当前状态交接](HANDOFF.md)
5. [开发任务总表](TASKS.md)

### 架构评审路径

1. [整体系统设计 V1](设计/整体系统设计-v1.md)
2. [Runtime Kernel 公共契约 V1](设计/runtime-kernel-contract-v1.md)
3. [整体设计二次审查](评审/整体设计二次审查-2026-05-08.md)
4. [架构总览](ARCHITECTURE.md)
5. [运行时契约](设计/runtime-contracts.md)
6. [决策索引](DECISIONS.md)
7. [风险登记](RISKS.md)
8. [一致性测试体系](质量/conformance-suite-v1.md)

### 实现任务路径

1. [当前状态交接](HANDOFF.md)
2. [开发任务总表](TASKS.md)
3. 当前任务引用的 `docs/设计/` 或 `docs/安全/` 文档
4. [整体系统设计 V1](设计/整体系统设计-v1.md) 中对应平面和链路
5. [验证策略](TESTING.md)
6. [连接 MCP Host 手动测试指南](教程/connect-mcp-host.md)
7. [开发工作流](WORKFLOW.md)

### Capability 贡献评审路径

1. [编写一个 Capability](教程/write-a-capability.md)
2. [评审一个 Capability PR](教程/review-a-capability.md)
3. [注册表指南](社区/registry-guidelines.md)
4. [能力评审清单](社区/capability-review-checklist.md)

## 维护规则

- 新增主路径文档时，同步 `docs/README.md` 和本文件。
- 新增长期设计取舍时，同步 `docs/DECISIONS.md`。
- 新增安全风险时，同步 `docs/RISKS.md`。
- 新增实现工作时，同步 `docs/TASKS.md`。
- 修改命令、测试、构建或验证流程时，同步 `docs/TESTING.md`。
- 每轮任务结束时，同步 `docs/HANDOFF.md`，并提交推送。

## 文件归位原则

`docs/` 根目录只保留核心入口、状态和治理文件；教程、参考、规范、模板和说明文档必须放入对应子目录。后续如果继续移动文件，必须同步更新 `docs/README.md`、本文件、`docs/TASKS.md`、`docs/HANDOFF.md` 和所有引用链接，并运行文档闭环检查。
