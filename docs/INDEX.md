# INDEX：项目文档地图

本文是 OpenCap 的文档导航入口。新人、维护者和 AI 代理都应从这里判断该读什么、该更新什么。

## 文档分层

```text
README.md
  -> docs/INDEX.md
      -> docs/SPEC.md
      -> docs/ARCHITECTURE.md
      -> docs/TASKS.md
      -> docs/TESTING.md
      -> docs/HANDOFF.md
      -> docs/DECISIONS.md
      -> docs/WORKFLOW.md
      -> docs/planning/traceability-matrix.md
      -> docs/planning/v1-milestones.md
      -> docs/RISKS.md
```

## 按角色阅读

### 第一次了解项目

1. `README.md`
2. `docs/introduction.md`
3. `docs/SPEC.md`
4. `docs/ARCHITECTURE.md`
5. `docs/ROADMAP.md`

### 准备开始开发

1. `AGENTS.md`
2. `docs/HANDOFF.md`
3. `docs/TASKS.md`
4. `docs/TESTING.md`
5. 当前任务涉及的 SPEC/ARCHITECTURE/DECISIONS

### 做技术评审

1. `docs/reviews/technical-plan-review-2026-05-07.md`
2. `docs/DECISIONS.md`
3. `docs/RISKS.md`
4. `docs/planning/traceability-matrix.md`

### 做发布准备

1. `docs/ROADMAP.md`
2. `docs/planning/v1-milestones.md`
3. `docs/TESTING.md`
4. `docs/TASKS.md`
5. `docs/HANDOFF.md`

## 文档职责

| 文档 | 职责 | 什么时候更新 |
| --- | --- | --- |
| `docs/SPEC.md` | 产品正确性、V1 范围、功能需求 | 行为或范围变化时 |
| `docs/ARCHITECTURE.md` | 模块边界、数据流、约束 | 包职责、数据流、边界变化时 |
| `docs/TASKS.md` | 执行任务队列 | 每次任务开始/完成/阻塞时 |
| `docs/TESTING.md` | 验证命令和测试策略 | 新增测试、跳过验证、命令变化时 |
| `docs/HANDOFF.md` | 当前状态和下一步 | 每次任务结束时 |
| `docs/DECISIONS.md` | 决策索引 | 新增 ADR 时 |
| `docs/WORKFLOW.md` | 开发流程 | 团队协作方式变化时 |
| `docs/RISKS.md` | 风险登记 | 发现、缓解或关闭风险时 |
| `docs/planning/traceability-matrix.md` | 需求-任务-测试追踪 | 新增需求或任务重排时 |
| `docs/planning/v1-milestones.md` | 阶段门禁 | 里程碑范围变化时 |

## 更新规则

- 任务完成但文档没更新，任务不能标记为完成。
- 验证没跑，任务不能标记为 `[x]`。
- 设计取舍会影响后续实现时，必须补 ADR。
- 发现风险时，补 `docs/RISKS.md`，不要只写在聊天里。
- 每次提交前至少运行 `git diff --check`。
