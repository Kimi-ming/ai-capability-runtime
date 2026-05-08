# 中文文档规范

本文定义 OpenCap 文档如何组织、命名和维护。目标是让新人、维护者和 AI 代理都能快速找到事实来源。

## 基本原则

1. 中文优先：正文、标题、说明、模板默认使用中文。
2. 术语稳定：技术专有名词可以保留英文，但第一次出现时尽量解释。
3. 入口克制：README 和索引只负责导航，不堆全部细节。
4. 分层明确：产品、架构、安全、质量、运营、任务、决策分开维护。
5. 合并优先：更新旧文档，不重复创建同义文档。
6. 事实可追踪：影响实现的设计必须进入任务、风险、测试或 ADR。

## 允许保留英文的情况

以下内容不强行翻译：

- 协议和标准名：`MCP`、`OpenAPI`、`A2A`、`JSON Schema`。
- 项目核心术语：`Capability`、`Runtime`、`Registry`、`Host`。
- 文件名、包名、命令、字段名：`manifest.yml`、`@opencap/runtime`、`opencap invoke`、`policy_trace_json`。
- 风险等级、枚举值和代码常量：`read_only`、`external_send`、`allow`、`deny`。

## 文档类型

| 类型 | 读者问题 | 应放位置 | 示例 |
| --- | --- | --- | --- |
| 教程 | 我第一次怎么跑通？ | `docs/getting-started.md`、`examples/` | 快速开始、示例能力。 |
| 操作指南 | 我要完成一个具体任务怎么办？ | `docs/operations/`、`docs/community/` | 发布、凭据、贡献流程。 |
| 参考 | 字段、接口、契约是什么？ | `docs/design/`、`docs/spec/` | Runtime 契约、CLI 契约、Manifest。 |
| 解释 | 为什么这样设计？ | `docs/product/`、`docs/ecosystem/`、`docs/research/` | 战略、生态边界、调研。 |

## 文件组织规则

- `docs/README.md`：中文文档中心，给所有读者使用。
- `docs/INDEX.md`：维护者索引，说明每个目录职责和更新规则。
- `docs/SYSTEM.md`：系统总蓝图，只记录稳定的全局结构。
- `docs/TASKS.md`：开发任务源，不放长篇背景。
- `docs/HANDOFF.md`：当前状态，不替代任务表和决策文档。
- `docs/research/`：只放调研和参考，不作为实现契约。
- `docs/decisions/`：只放已接受或明确状态的决策。

## 新增文档检查清单

新增文档前先确认：

- 现有文档是否可以更新，而不是新增。
- 文档属于教程、操作指南、参考、解释中的哪一类。
- 是否需要同步 `docs/README.md` 或 `docs/INDEX.md`。
- 是否产生新任务，需要同步 `docs/TASKS.md`。
- 是否产生新风险，需要同步 `docs/RISKS.md`。
- 是否产生长期取舍，需要新增 ADR。
- 是否影响验证方式，需要同步 `docs/TESTING.md`。

## 命名规则

- 文档标题使用中文，必要时保留英文术语作为括号或后缀。
- 文件名可以继续使用英文短横线，保证链接稳定和跨平台友好。
- 不使用临时标题，例如“补充说明”“新的想法”“待整理”。
- 调研文档必须带日期，格式为 `主题-scan-YYYY-MM-DD.md` 或中文标题内写日期。

## 清理规则

当文档变多时，优先做四件事：

1. 把 README 中的长列表收敛到 `docs/README.md`。
2. 把重复背景合并进 `docs/SYSTEM.md` 或对应设计文档。
3. 把阶段性调研放在 `docs/research/`，不要混入主路径文档。
4. 在 `docs/HANDOFF.md` 只保留当前接手需要的信息，避免替代历史日志。
