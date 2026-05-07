# INDEX：项目文档地图

本文是 OpenCap 的文档导航入口。新人、维护者和 AI 代理都应从这里判断该读什么、该更新什么。

## 文档分层

```text
README.md
  -> docs/INDEX.md
      -> docs/SYSTEM.md
      -> docs/product/strategy.md
      -> docs/product/use-cases.md
      -> docs/product/capability-lifecycle.md
      -> docs/ecosystem/capability-taxonomy.md
      -> docs/ecosystem/host-compatibility-matrix.md
      -> docs/ecosystem/open-core-boundary.md
      -> docs/SPEC.md
      -> docs/ARCHITECTURE.md
      -> docs/design/domain-model.md
      -> docs/design/runtime-contracts.md
      -> docs/design/cli-contract-v1.md
      -> docs/design/local-state-v1.md
      -> docs/design/configuration-v1.md
      -> docs/design/mcp-interface-v1.md
      -> docs/design/error-model-v1.md
      -> docs/design/http-execution-v1.md
      -> docs/design/policy-dsl-v1.md
      -> docs/design/audit-log-v1.md
      -> docs/design/registry-test-format-v1.md
      -> docs/protocols/protocol-positioning.md
      -> docs/security/threat-model.md
      -> docs/security/outbound-policy-v1.md
      -> docs/security/supply-chain-governance.md
      -> docs/security/privacy-retention-v1.md
      -> docs/operations/release-readiness.md
      -> docs/operations/ci-security-baseline.md
      -> docs/operations/observability-metrics-v1.md
      -> docs/community/contributor-journey.md
      -> docs/community/capability-review-checklist.md
      -> docs/community/rfc-process.md
      -> docs/planning/v1-implementation-plan.md
      -> docs/planning/open-questions.md
      -> docs/operations/operating-model.md
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
2. `docs/SYSTEM.md`
3. `docs/introduction.md`
4. `docs/product/strategy.md`
5. `docs/product/use-cases.md`
6. `docs/SPEC.md`
7. `docs/ARCHITECTURE.md`
8. `docs/ROADMAP.md`

### 准备开始开发

1. `AGENTS.md`
2. `docs/HANDOFF.md`
3. `docs/TASKS.md`
4. `docs/TESTING.md`
5. 当前任务涉及的 SPEC/ARCHITECTURE/DECISIONS

### 做技术评审

1. `docs/reviews/technical-plan-review-2026-05-07.md`
2. `docs/protocols/protocol-positioning.md`
3. `docs/security/threat-model.md`
4. `docs/DECISIONS.md`
5. `docs/RISKS.md`
6. `docs/planning/traceability-matrix.md`

### 做发布准备

1. `docs/ROADMAP.md`
2. `docs/planning/v1-milestones.md`
3. `docs/TESTING.md`
4. `docs/TASKS.md`
5. `docs/HANDOFF.md`

## 文档职责

| 文档 | 职责 | 什么时候更新 |
| --- | --- | --- |
| `docs/SYSTEM.md` | 全局体系蓝图和子系统地图 | 新增子系统或关键不变量变化时 |
| `docs/product/strategy.md` | 产品定位、战略边界、系统分层 | 定位或商业/生态判断变化时 |
| `docs/product/use-cases.md` | 用户角色、场景、用户任务 | 用户场景或验收口径变化时 |
| `docs/product/capability-lifecycle.md` | Capability 治理状态机 | install/review/audit 状态变化时 |
| `docs/ecosystem/capability-taxonomy.md` | Capability 分类和粒度 | Registry 分类或命名规则变化时 |
| `docs/ecosystem/host-compatibility-matrix.md` | Host 兼容性记录 | MCP Host 测试结果变化时 |
| `docs/ecosystem/open-core-boundary.md` | OSS 与未来 Cloud 边界 | 商业化或托管能力边界变化时 |
| `docs/SPEC.md` | 产品正确性、V1 范围、功能需求 | 行为或范围变化时 |
| `docs/ARCHITECTURE.md` | 模块边界、数据流、约束 | 包职责、数据流、边界变化时 |
| `docs/design/domain-model.md` | 领域对象和不变量 | 类型、状态对象、日志字段变化时 |
| `docs/design/cli-contract-v1.md` | CLI 命令、输出、exit code 契约 | CLI 行为变化时 |
| `docs/design/local-state-v1.md` | 本地状态路径和文件结构 | state dir 或 install 行为变化时 |
| `docs/design/configuration-v1.md` | 配置来源和优先级 | flag/env/config 变化时 |
| `docs/design/mcp-interface-v1.md` | MCP tools 映射和确认策略 | MCP bridge 行为变化时 |
| `docs/design/error-model-v1.md` | 错误分类和映射 | 错误类型或 exit code 变化时 |
| `docs/design/runtime-contracts.md` | Runtime 模块契约 | invoke pipeline 或模块接口变化时 |
| `docs/design/http-execution-v1.md` | HTTP body/auth/outbound 执行规则 | HTTP manifest 或 executor 变化时 |
| `docs/design/policy-dsl-v1.md` | 本地 policy 文件格式 | Policy parser/engine 变化时 |
| `docs/design/audit-log-v1.md` | 审计日志 schema 和失败策略 | 日志字段、脱敏或存储变化时 |
| `docs/design/registry-test-format-v1.md` | Registry tests 格式 | tests schema 或 CI 行为变化时 |
| `docs/protocols/protocol-positioning.md` | 外部协议定位 | MCP/A2A/OpenAPI/App SDK 策略变化时 |
| `docs/security/threat-model.md` | 威胁模型和控制措施 | 新攻击面、新安全控制、风险变化时 |
| `docs/security/outbound-policy-v1.md` | 出站网络安全策略 | HTTP 网络边界变化时 |
| `docs/security/supply-chain-governance.md` | Registry 和发布供应链治理 | CI、review、release provenance 变化时 |
| `docs/security/privacy-retention-v1.md` | 隐私和数据保留 | 日志保留、数据删除或脱敏规则变化时 |
| `docs/operations/release-readiness.md` | 发布门禁 | alpha/beta/v1 发布条件变化时 |
| `docs/operations/ci-security-baseline.md` | CI 和开源安全基线 | GitHub Actions 或安全检查变化时 |
| `docs/operations/observability-metrics-v1.md` | 可观测性和指标 | audit/metrics/OTel 映射变化时 |
| `docs/community/contributor-journey.md` | 贡献者路径 | 贡献流程变化时 |
| `docs/community/capability-review-checklist.md` | Capability PR 评审 | Registry review 规则变化时 |
| `docs/community/rfc-process.md` | RFC 流程 | 设计治理流程变化时 |
| `docs/operations/operating-model.md` | 项目运行模型 | 团队协作或任务规则变化时 |
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
