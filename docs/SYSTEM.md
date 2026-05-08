# SYSTEM：OpenCap 体系蓝图

本文把 OpenCap V1 的产品、协议、Runtime、安全、Registry、发布和开源治理串成一个完整系统。阅读顺序从本文开始，再进入具体文档。

## 北极星

OpenCap 的目标不是让某一个 Agent 更聪明，而是让所有 AI Host 都能以可治理的方式调用真实世界能力。

```text
模型负责理解意图。
Host 负责承载交互。
OpenCap 负责能力治理。
外部服务负责真实执行。
用户和组织负责授权边界。
```

## 四十八个子系统

| 子系统 | 目标 | 关键文档 | V1 产物 |
| --- | --- | --- | --- |
| 产品定位 | 明确为什么存在 | `docs/product/strategy.md` | 非 Agent、非 Marketplace 的定位 |
| 用户场景 | 明确为谁解决什么 | `docs/product/use-cases.md` | V1 主路径用例 |
| Capability 标准 | 统一能力描述 | `docs/capability-manifest.md` | manifest schema |
| Capability 生命周期 | 治理状态机 | `docs/product/capability-lifecycle.md` | Draft -> Audited |
| Runtime 核心 | 安全执行能力 | `docs/design/runtime-contracts.md` | invoke pipeline |
| HTTP 执行 | 调用外部 API | `docs/design/http-execution-v1.md` | body/auth/outbound 规则 |
| Policy DSL | 执行前决策 | `docs/design/policy-dsl-v1.md` | default/rules YAML |
| Audit Log | 事后追踪 | `docs/design/audit-log-v1.md` | SQLite log schema |
| Registry 治理 | 供应链入口 | `docs/security/supply-chain-governance.md` | review + CI + trust |
| 发布运营 | 可持续推进 | `docs/operations/operating-model.md` | 任务、ADR、风险、发布门禁 |
| CLI 契约 | 稳定开发者体验 | `docs/design/cli-contract-v1.md` | 命令/输出/exit code |
| 本地状态 | 可测试可删除状态 | `docs/design/local-state-v1.md` | state dir 结构 |
| MCP 接口 | Host 兼容表面 | `docs/design/mcp-interface-v1.md` | tools/list + tools/call |
| 错误模型 | 一致失败语义 | `docs/design/error-model-v1.md` | OpenCapError 分类 |
| 隐私保留 | 本地数据边界 | `docs/security/privacy-retention-v1.md` | 脱敏和保留规则 |
| 能力分类 | Registry 可导航性 | `docs/ecosystem/capability-taxonomy.md` | 分类和粒度规则 |
| Host 兼容 | 跨 Host 稳定性 | `docs/ecosystem/host-compatibility-matrix.md` | 兼容性记录模板 |
| 开源边界 | OSS 与 Cloud 分工 | `docs/ecosystem/open-core-boundary.md` | open-core 约束 |
| 社区协作 | 外部贡献路径 | `docs/community/contributor-journey.md` | contributor journey |
| 可观测指标 | 质量和生态反馈 | `docs/operations/observability-metrics-v1.md` | 本地指标和未来 OTel 映射 |
| 版本兼容 | 长期演进秩序 | `docs/spec/versioning-and-compatibility.md` | SemVer 和公共契约 |
| Manifest 演进 | Schema 可迁移 | `docs/spec/manifest-evolution.md` | schema 演进规则 |
| Registry 分发 | 可验证安装来源 | `docs/ecosystem/registry-distribution.md` | Git-based V1 registry |
| SDK/Adapter 边界 | 防止范围膨胀 | `docs/design/sdk-and-adapter-boundary.md` | V1 非阻塞边界 |
| 发布供应链 | 可验证发布 | `docs/operations/package-publishing-v1.md` | npm/provenance 预案 |
| Capability 包 | 稳定 Registry 单元 | `docs/design/capability-package-v1.md` | package 目录契约 |
| 确认与同意 | 可审计授权语义 | `docs/design/confirmation-and-consent-v1.md` | consent request/receipt |
| 互操作 Profile | 兼容性证据化 | `docs/ecosystem/interoperability-profiles.md` | MCP/Registry profile |
| 一致性测试 | 生态可验证 | `docs/quality/conformance-suite-v1.md` | conformance groups |
| Agentic 风险 | 安全风险转测试 | `docs/security/agentic-risk-mapping.md` | risk-to-control map |
| 身份授权 | 明确代表谁调用 | `docs/security/identity-and-auth-model.md` | identity/auth boundary |
| Secret Resolver | 安全解析凭据 | `docs/design/secret-resolver-v1.md` | env provider 契约 |
| 凭据生命周期 | 凭据创建/轮换/撤销 | `docs/operations/credential-lifecycle.md` | runbook |
| 最小权限评审 | 防止过宽 scopes | `docs/security/least-privilege-review.md` | review checklist |
| 远程 OAuth 边界 | 防止未来授权混乱 | `docs/ecosystem/oauth-and-remote-runtime-boundary.md` | future auth profile 边界 |
| 执行语义 | 表达副作用和结果状态 | `docs/design/execution-semantics-v1.md` | outcome/state model |
| 重试与幂等 | 防止重复副作用 | `docs/design/retry-and-idempotency-v1.md` | retry/idempotency rules |
| 失败恢复 | 状态未知时指导恢复 | `docs/operations/failure-recovery-runbook.md` | recovery runbook |
| 执行证据 | 证明调用发生了什么 | `docs/quality/execution-evidence-v1.md` | evidence fields |
| 组合边界 | 防止滑向 Agent Builder | `docs/design/composition-boundary-v1.md` | composition invariants |
| 能力图 | 描述能力关系和风险放大 | `docs/ecosystem/capability-graph-v1.md` | graph metadata 草案 |
| 多步执行 | 定义 step outcome 和补偿边界 | `docs/design/multi-step-execution-boundary.md` | multi-step outcome model |
| 组合失败恢复 | 指导 partial/unknown/manual review | `docs/operations/composition-failure-runbook.md` | recovery runbook |
| 组合调研 | Saga/workflow 边界依据 | `docs/research/composition-and-saga-scan-2026-05-07.md` | research notes |
| Trust 模型 | 把信任变成证据摘要 | `docs/ecosystem/trust-model-v1.md` | trust level rules |
| Capability Advisory | 处理能力漏洞和恶意风险 | `docs/security/capability-advisory-process.md` | advisory lifecycle |
| Deprecation/Revocation | 能力弃用、下架、撤销 | `docs/ecosystem/capability-deprecation-and-revocation.md` | lifecycle terminal states |
| Quality Score | 解释能力成熟度 | `docs/quality/capability-quality-score.md` | scoring rubric |

## 系统闭环

```text
Capability author
  -> writes manifest.yml
  -> opencap validate
  -> registry review and tests
  -> user installs capability
  -> runtime exposes MCP tool
  -> host calls tool
  -> input validation
  -> policy decision
  -> confirmation if needed
  -> secret resolution
  -> HTTP execution or dry-run
  -> audit log
  -> logs/review/iteration
```

## 信任边界

```text
Untrusted / Semi-trusted
- AI model output
- MCP tool arguments
- third-party manifest descriptions
- external API responses

Trusted Computing Base V1
- schema validator
- runtime invoke pipeline
- policy engine
- confirmation handler
- consent request/receipt builder
- secret resolver
- audit logger

Governance Surface
- registry review
- ADRs
- risk register
- release gates
- CI checks
```

## 不变量

- Capability 必须先安装，Runtime 才能调用。
- 所有调用必须经过同一条 Runtime pipeline。
- Policy Engine 不做交互，Confirmation Handler 不做执行。
- Secret Resolver 不把密钥原文交给日志或工具输出。
- `deny` 和未确认的 `ask` 不得解析密钥、不得执行。
- Host/client/input token 不得作为下游 provider token 使用。
- V1 secret 只来自 manifest 声明的 env var。
- V1 不自动重试非幂等写操作。
- 请求发出后的 timeout 必须标为未知结果，而不是未执行。
- 多步组合中的每一步都必须独立 policy、consent 和 audit。
- Compensation 是独立 Capability，不是隐式 rollback。
- 写操作审计不可用时不得执行。
- 任意 URL 能力默认高风险，需要 outbound policy 兜底。
- Registry trust level 不能覆盖用户本地 policy。
- Revoked capability 必须保留可寻址记录，不能从历史中静默消失。
- Quality Score 不能绕过 risk、policy 和 consent。

## V1 关键收敛决策

| 决策 | 状态 |
| --- | --- |
| V1 只支持 `type: http` | 已接受 |
| Audit log 使用 SQLite | 已接受 |
| Capability 生命周期作为治理主线 | 已接受 |
| HTTP body 使用 `execution.body.fields` 模板 | 已接受 |
| API key placement 必须显式声明 | 已接受 |
| Policy DSL 使用顶层 `default/rules` | 已接受 |
| 非只读调用审计失败时阻断执行 | 已接受 |
| 任意用户输入 URL 需要 outbound policy | 已接受 |
| State dir 默认 `<cwd>/opencap.local`，可由 flag/env 覆盖 | 已接受 |
| MCP V1 只实现 tools，确认不可用时返回 `confirmation_required` | 已接受 |
| CLI/Runtime/MCP 使用统一错误模型 | 已接受 |
| V1 默认不上传遥测，只保留本地 audit log | 已接受 |
| OSS 核心必须能独立运行，Cloud 不得成为主路径依赖 | 已接受 |
| 大型设计变化走 RFC，接受后进入 ADR | 已接受 |
| `0.x` 可快速演进但 breaking changes 必须记录 | 已接受 |
| V1 Registry 默认 Git-based，本地 install 不做远程下载 | 已接受 |
| SDK/adapters 不阻塞 V1，且不能绕过 validation/policy/audit | 已接受 |
| npm 发布优先 trusted publishing 和 provenance | 已接受 |
| Consent 是 Runtime 拥有的可审计对象 | 已接受 |
| 兼容性声明必须绑定 Interoperability Profile | 已接受 |
| Capability Package V1 使用目录契约 | 已接受 |
| Agentic 风险必须映射为控制和测试 | 已接受 |
| V1 只实现 env-based downstream credentials | 已接受 |
| 禁止 token passthrough | 已接受 |
| 远程 Runtime OAuth 必须走新 Profile | 已接受 |
| V1 不自动重试非幂等写操作 | 已接受 |
| 请求发出后的超时是未知结果 | 已接受 |
| V1 不内置 Workflow Runtime | 已接受 |
| 组合中的每一步都必须独立 Policy、Consent、Audit | 已接受 |
| Compensation 是独立 Capability，不是隐式 Rollback | 已接受 |
| Trust Level 是证据摘要，不是 Policy | 已接受 |
| Revoked Capability 必须保留可寻址记录 | 已接受 |
| Quality Score 不能绕过风险 | 已接受 |

## 设计成熟度

| 层 | 当前状态 | 下一步 |
| --- | --- | --- |
| 产品定位 | 清晰 | 保持 README/SPEC 同步 |
| Manifest 标准 | 基础完成 | T001/T002 接入真实校验 |
| HTTP 执行 | 设计收敛 | T053/T052 实现 body/auth |
| Policy | 设计收敛 | T030/T031 实现 parser/engine |
| Audit | 设计收敛 | T040/T041/T042 实现 SQLite 和脱敏 |
| MCP | 边界清晰 | T070/T073 做 SDK spike |
| Registry | 规则清晰 | T080/T081/T129 实现 CI/review |
| 发布治理 | 清晰 | T126 做 release checklist |
| CLI 契约 | 清晰 | T001/T013 按契约实现 |
| 本地状态 | 清晰 | T010/T014 实现 helper |
| MCP 接口 | 清晰 | T070-T073 实现 bridge |
| 错误模型 | 清晰 | T013/T137 实现错误测试 |
| 生态分类 | 清晰 | T140/T141 落到 registry docs |
| Host 兼容 | 框架清晰 | T127 维护矩阵 |
| 社区协作 | 清晰 | PR/issue templates 已添加 |
| 可观测指标 | 边界清晰 | V1 从 audit log 派生 |
| 版本兼容 | 清晰 | CHANGELOG 已添加 |
| Manifest 演进 | 清晰 | T001/T003 后继续收紧 schema |
| Registry 分发 | 清晰 | V1 保持 Git-based |
| SDK/Adapter | 边界清晰 | V1 不阻塞主路径 |
| 发布供应链 | 清晰 | T123 制定 npm trusted publishing workflow |
| Capability 包 | 清晰 | T151 做 package lint |
| 确认与同意 | 清晰 | T152 落入 audit 字段和测试 |
| 互操作 Profile | 清晰 | T154 维护 evidence records |
| 一致性测试 | 清晰 | T153 建立 suite skeleton |
| Agentic 风险 | 清晰 | T155 转成 abuse-case smoke tests |
| 身份授权 | 清晰 | T159/T163 按边界实现或 RFC |
| Secret Resolver | 清晰 | T159 实现 env provider |
| 凭据生命周期 | 清晰 | T162/T165 补操作验证和指南 |
| 最小权限评审 | 清晰 | T161 接入 Registry lint/review |
| 远程 OAuth 边界 | 清晰 | T163 走 RFC，不进 V1 主路径 |
| 执行语义 | 清晰 | T167 落入类型和 audit 字段 |
| 重试与幂等 | 清晰 | T169 走 manifest RFC |
| 失败恢复 | 清晰 | T172 增加 reconcile hint |
| 执行证据 | 清晰 | T173 接入 conformance record |
| 组合边界 | 清晰 | T176 走 composition profile RFC |
| 能力图 | 清晰 | T179 定义 graph metadata RFC |
| 多步执行 | 清晰 | T175/T178 增加 evidence chain |
| 组合失败恢复 | 清晰 | T182 定义 compensation review rules |
| 组合调研 | 完成 | 后续 RFC 参考 |
| Trust 模型 | 清晰 | T185/T195 落到 Trust Card |
| Capability Advisory | 清晰 | T187/T189 进入 registry/runtime 检查 |
| Deprecation/Revocation | 清晰 | T191/T192 落到 install/list/invoke |
| Quality Score | 清晰 | T194/T196 防止覆盖 policy |
