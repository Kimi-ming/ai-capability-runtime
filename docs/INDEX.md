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
      -> docs/ecosystem/registry-distribution.md
      -> docs/ecosystem/interoperability-profiles.md
      -> docs/ecosystem/oauth-and-remote-runtime-boundary.md
      -> docs/ecosystem/capability-graph-v1.md
      -> docs/ecosystem/trust-model-v1.md
      -> docs/ecosystem/capability-deprecation-and-revocation.md
      -> docs/ecosystem/paid-capability-and-commerce-boundary.md
      -> docs/ecosystem/discovery-and-selection-boundary.md
      -> docs/ecosystem/result-delivery-boundary.md
      -> docs/SPEC.md
      -> docs/spec/versioning-and-compatibility.md
      -> docs/spec/manifest-evolution.md
      -> docs/ARCHITECTURE.md
      -> docs/design/domain-model.md
      -> docs/design/runtime-contracts.md
      -> docs/design/cli-contract-v1.md
      -> docs/design/local-state-v1.md
      -> docs/design/configuration-v1.md
      -> docs/design/mcp-interface-v1.md
      -> docs/design/error-model-v1.md
      -> docs/design/sdk-and-adapter-boundary.md
      -> docs/design/capability-package-v1.md
      -> docs/design/confirmation-and-consent-v1.md
      -> docs/design/secret-resolver-v1.md
      -> docs/design/execution-semantics-v1.md
      -> docs/design/retry-and-idempotency-v1.md
      -> docs/design/quota-and-budget-policy-v1.md
      -> docs/design/tool-projection-v1.md
      -> docs/design/result-envelope-v1.md
      -> docs/design/composition-boundary-v1.md
      -> docs/design/multi-step-execution-boundary.md
      -> docs/design/http-execution-v1.md
      -> docs/design/policy-dsl-v1.md
      -> docs/design/audit-log-v1.md
      -> docs/design/registry-test-format-v1.md
      -> docs/protocols/protocol-positioning.md
      -> docs/security/threat-model.md
      -> docs/security/outbound-policy-v1.md
      -> docs/security/supply-chain-governance.md
      -> docs/security/privacy-retention-v1.md
      -> docs/security/signing-and-provenance-roadmap.md
      -> docs/security/agentic-risk-mapping.md
      -> docs/security/identity-and-auth-model.md
      -> docs/security/least-privilege-review.md
      -> docs/security/capability-advisory-process.md
      -> docs/security/rate-limit-and-abuse-control-v1.md
      -> docs/security/prompt-surface-security-v1.md
      -> docs/security/tool-result-sanitization-v1.md
      -> docs/operations/release-readiness.md
      -> docs/operations/package-publishing-v1.md
      -> docs/operations/credential-lifecycle.md
      -> docs/operations/failure-recovery-runbook.md
      -> docs/operations/composition-failure-runbook.md
      -> docs/operations/ci-security-baseline.md
      -> docs/operations/observability-metrics-v1.md
      -> docs/operations/usage-metering-v1.md
      -> docs/community/contributor-journey.md
      -> docs/community/capability-review-checklist.md
      -> docs/community/rfc-process.md
      -> docs/community/maintainer-guide.md
      -> docs/quality/quality-gates.md
      -> docs/quality/conformance-suite-v1.md
      -> docs/quality/execution-evidence-v1.md
      -> docs/quality/capability-quality-score.md
      -> docs/quality/usage-evidence-v1.md
      -> docs/quality/model-visible-metadata-lint-v1.md
      -> docs/quality/output-validation-v1.md
      -> docs/quality/result-provenance-v1.md
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
7. `docs/security/agentic-risk-mapping.md`
8. `docs/quality/conformance-suite-v1.md`
9. `docs/security/identity-and-auth-model.md`
10. `docs/security/least-privilege-review.md`

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
| `docs/ecosystem/registry-distribution.md` | Registry 分发模型 | 安装来源、索引、镜像、签名策略变化时 |
| `docs/ecosystem/interoperability-profiles.md` | Host/协议互操作 profile | 兼容性声明、Host 记录或协议 profile 变化时 |
| `docs/ecosystem/oauth-and-remote-runtime-boundary.md` | 远程 Runtime OAuth 边界 | HTTP/Cloud/remote runtime 授权设计变化时 |
| `docs/ecosystem/capability-graph-v1.md` | 能力图 | provider/resource/output 关系和组合风险变化时 |
| `docs/ecosystem/trust-model-v1.md` | Trust 模型 | trust level、Trust Card 或升级/降级规则变化时 |
| `docs/ecosystem/capability-deprecation-and-revocation.md` | 能力弃用和撤销 | deprecated/yanked/revoked 状态或 runtime 行为变化时 |
| `docs/ecosystem/paid-capability-and-commerce-boundary.md` | 付费能力和商业边界 | paid capability、commerce profile 或结算边界变化时 |
| `docs/ecosystem/discovery-and-selection-boundary.md` | 能力发现和选择边界 | discovery、ranking、selection evidence 或自动安装边界变化时 |
| `docs/ecosystem/result-delivery-boundary.md` | 结果投递边界 | MCP/CLI/未来 API 的 result adapter 或 Host result 行为变化时 |
| `docs/SPEC.md` | 产品正确性、V1 范围、功能需求 | 行为或范围变化时 |
| `docs/spec/versioning-and-compatibility.md` | 版本和公共契约兼容性 | 公共契约或版本策略变化时 |
| `docs/spec/manifest-evolution.md` | Manifest schema 演进 | schema 迁移或新 capability type 变化时 |
| `docs/ARCHITECTURE.md` | 模块边界、数据流、约束 | 包职责、数据流、边界变化时 |
| `docs/design/domain-model.md` | 领域对象和不变量 | 类型、状态对象、日志字段变化时 |
| `docs/design/cli-contract-v1.md` | CLI 命令、输出、exit code 契约 | CLI 行为变化时 |
| `docs/design/local-state-v1.md` | 本地状态路径和文件结构 | state dir 或 install 行为变化时 |
| `docs/design/configuration-v1.md` | 配置来源和优先级 | flag/env/config 变化时 |
| `docs/design/mcp-interface-v1.md` | MCP tools 映射和确认策略 | MCP bridge 行为变化时 |
| `docs/design/error-model-v1.md` | 错误分类和映射 | 错误类型或 exit code 变化时 |
| `docs/design/sdk-and-adapter-boundary.md` | SDK 和 Adapter 边界 | SDK/adapters 进入主路径或新增类型时 |
| `docs/design/capability-package-v1.md` | Capability package 目录契约 | Registry package 结构或 Trust Card 变化时 |
| `docs/design/confirmation-and-consent-v1.md` | 确认与同意模型 | policy ask、confirmation channel 或 audit receipt 变化时 |
| `docs/design/secret-resolver-v1.md` | 密钥解析器契约 | auth provider、secret placement 或 resolver 行为变化时 |
| `docs/design/execution-semantics-v1.md` | 执行语义 | outcome、side effect、request_started 或状态模型变化时 |
| `docs/design/retry-and-idempotency-v1.md` | 重试与幂等 | retry policy、idempotency key 或重复调用规则变化时 |
| `docs/design/quota-and-budget-policy-v1.md` | 配额与预算策略 | quota/budget gate、spend cap 或策略字段变化时 |
| `docs/design/tool-projection-v1.md` | 模型可见工具投影 | MCP tools/list metadata、projection hash 或 tool description 模板变化时 |
| `docs/design/result-envelope-v1.md` | 工具结果信封 | Result Envelope、MCP result shape、structuredContent 或 result status 变化时 |
| `docs/design/composition-boundary-v1.md` | 组合边界 | composition profile、workflow 边界或组合不变量变化时 |
| `docs/design/multi-step-execution-boundary.md` | 多步执行边界 | step outcome、composition outcome 或 compensation 变化时 |
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
| `docs/security/signing-and-provenance-roadmap.md` | 签名和 provenance 路线 | 发布签名、SBOM、registry signing 变化时 |
| `docs/security/agentic-risk-mapping.md` | Agentic 风险映射 | Agentic abuse cases、控制或测试映射变化时 |
| `docs/security/identity-and-auth-model.md` | 身份与授权模型 | Host、Runtime、provider 或凭据边界变化时 |
| `docs/security/least-privilege-review.md` | 最小权限评审 | auth scopes、provider 权限或 Registry review 变化时 |
| `docs/security/capability-advisory-process.md` | Capability 安全公告流程 | advisory、漏洞披露、恶意能力处理变化时 |
| `docs/security/rate-limit-and-abuse-control-v1.md` | 限流与滥用控制 | local/provider rate limit、abuse throttle 或 429 语义变化时 |
| `docs/security/prompt-surface-security-v1.md` | 模型可见提示面安全 | tool description、schema description、result text 或 prompt-surface 控制变化时 |
| `docs/security/tool-result-sanitization-v1.md` | 工具结果净化 | provider response、error body、HTML/text 或 indirect prompt injection 控制变化时 |
| `docs/operations/release-readiness.md` | 发布门禁 | alpha/beta/v1 发布条件变化时 |
| `docs/operations/package-publishing-v1.md` | npm 包发布策略 | package 发布、trusted publishing 变化时 |
| `docs/operations/credential-lifecycle.md` | 凭据生命周期 Runbook | token 创建、轮换、撤销或泄露响应流程变化时 |
| `docs/operations/failure-recovery-runbook.md` | 失败恢复手册 | timeout、unknown outcome、reconcile 或 compensation 流程变化时 |
| `docs/operations/composition-failure-runbook.md` | 组合失败恢复 | partial/unknown composition、manual review 或补偿流程变化时 |
| `docs/operations/ci-security-baseline.md` | CI 和开源安全基线 | GitHub Actions 或安全检查变化时 |
| `docs/operations/observability-metrics-v1.md` | 可观测性和指标 | audit/metrics/OTel 映射变化时 |
| `docs/operations/usage-metering-v1.md` | 用量计量 | usage event、usage summary 或 export 变化时 |
| `docs/community/contributor-journey.md` | 贡献者路径 | 贡献流程变化时 |
| `docs/community/capability-review-checklist.md` | Capability PR 评审 | Registry review 规则变化时 |
| `docs/community/rfc-process.md` | RFC 流程 | 设计治理流程变化时 |
| `docs/community/maintainer-guide.md` | 维护者手册 | review、release、安全响应规则变化时 |
| `docs/quality/quality-gates.md` | 质量门禁 | milestone gate 或 release gate 变化时 |
| `docs/quality/conformance-suite-v1.md` | 一致性测试体系 | conformance profile、测试分组或 release evidence 变化时 |
| `docs/quality/execution-evidence-v1.md` | 执行证据 | audit evidence、request/response/outcome 字段变化时 |
| `docs/quality/capability-quality-score.md` | 能力质量评分 | score rubric、Trust Card 质量维度变化时 |
| `docs/quality/usage-evidence-v1.md` | 用量证据 | usage event 与 audit/evidence 关联规则变化时 |
| `docs/quality/model-visible-metadata-lint-v1.md` | 模型可见元数据 lint | description lint、schema text lint 或 negative fixtures 变化时 |
| `docs/quality/output-validation-v1.md` | 输出校验 | output schema validation、normalization、selector 或 size limit 变化时 |
| `docs/quality/result-provenance-v1.md` | 结果来源 | result provenance、taint label、content digest 或 transformation evidence 变化时 |
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
