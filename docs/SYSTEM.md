# 体系蓝图：OpenCap

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

## 整体设计模型

OpenCap 的总体设计收敛为五个平面：标准面定义 Capability，控制面管理策略和授权，执行面承载 Runtime Kernel，信任面沉淀审计和证据，互操作面适配 MCP、CLI 和未来 A2A/Apps SDK/OpenAPI。详细模型见 `docs/设计/整体系统设计-v1.md`。

## 核心子系统

| 子系统 | 目标 | 关键文档 | V1 产物 |
| --- | --- | --- | --- |
| 产品定位 | 明确为什么存在 | `docs/产品/strategy.md` | 非 Agent、非 Marketplace 的定位 |
| 用户场景 | 明确为谁解决什么 | `docs/产品/use-cases.md` | V1 主路径用例 |
| Capability 标准 | 统一能力描述 | `docs/规范/capability-manifest.md` | manifest schema |
| Capability 生命周期 | 治理状态机 | `docs/产品/capability-lifecycle.md` | Draft -> Audited |
| 整体系统设计 | 收敛五个平面和生态闭环 | `docs/设计/整体系统设计-v1.md` | Runtime Kernel + ledgers/cards model |
| 整体设计审查 | 找出工程化缺口和补强路线 | `docs/评审/整体设计二次审查-2026-05-08.md` | T267-T276 follow-up tasks |
| Runtime 核心 | 安全执行能力 | `docs/设计/runtime-contracts.md` | invoke pipeline |
| Runtime Kernel 公共契约 | 统一 CLI/MCP/未来入口的调用语言 | `docs/设计/runtime-kernel-contract-v1.md` | RuntimeKernel、InvocationRequest、ResultEnvelope、GateDecision 形状 |
| HTTP 执行 | 调用外部 API | `docs/设计/http-execution-v1.md` | body/auth/outbound 规则 |
| Policy DSL | 执行前决策 | `docs/设计/policy-dsl-v1.md` | default/rules YAML |
| Policy Decision Trace | 解释每次策略决策 | `docs/设计/policy-decision-trace-v1.md` | redacted trace object |
| Policy 生命周期 | 策略版本、激活和回滚 | `docs/运营/policy-lifecycle-and-change-control.md` | policy ledger |
| Policy Simulation | 上线前评估策略影响 | `docs/质量/policy-simulation-and-diff-v1.md` | simulation report |
| Policy Override | 约束临时放行和 breakglass | `docs/安全/policy-override-and-breakglass-v1.md` | override record |
| Audit Log | 事后追踪 | `docs/设计/audit-log-v1.md` | SQLite log schema |
| Registry 治理 | 供应链入口 | `docs/安全/supply-chain-governance.md` | review + CI + trust |
| 发布运营 | 可持续推进 | `docs/运营/operating-model.md` | 任务、ADR、风险、发布门禁 |
| CLI 契约 | 稳定开发者体验 | `docs/设计/cli-contract-v1.md` | 命令/输出/exit code |
| 本地状态 | 可测试可删除状态 | `docs/设计/local-state-v1.md` | state dir 结构 |
| MCP 接口 | Host 兼容表面 | `docs/设计/mcp-interface-v1.md` | tools/list + tools/call |
| 错误模型 | 一致失败语义 | `docs/设计/error-model-v1.md` | OpenCapError 分类 |
| 隐私保留 | 本地数据边界 | `docs/安全/privacy-retention-v1.md` | 脱敏和保留规则 |
| 能力分类 | Registry 可导航性 | `docs/生态/capability-taxonomy.md` | 分类和粒度规则 |
| Host 兼容 | 跨 Host 稳定性 | `docs/生态/host-compatibility-matrix.md` | 兼容性记录模板 |
| 开源边界 | OSS 与 Cloud 分工 | `docs/生态/open-core-boundary.md` | open-core 约束 |
| 社区协作 | 外部贡献路径 | `docs/社区/contributor-journey.md` | contributor journey |
| 可观测指标 | 质量和生态反馈 | `docs/运营/observability-metrics-v1.md` | 本地指标和未来 OTel 映射 |
| 版本兼容 | 长期演进秩序 | `docs/规范/versioning-and-compatibility.md` | SemVer 和公共契约 |
| Manifest 演进 | Schema 可迁移 | `docs/规范/manifest-evolution.md` | schema 演进规则 |
| Registry 分发 | 可验证安装来源 | `docs/生态/registry-distribution.md` | Git-based V1 registry |
| SDK/Adapter 边界 | 防止范围膨胀 | `docs/设计/sdk-and-adapter-boundary.md` | V1 非阻塞边界 |
| 发布供应链 | 可验证发布 | `docs/运营/package-publishing-v1.md` | npm/provenance 预案 |
| Capability 包 | 稳定 Registry 单元 | `docs/设计/capability-package-v1.md` | package 目录契约 |
| 确认与同意 | 可审计授权语义 | `docs/设计/confirmation-and-consent-v1.md` | consent request/receipt |
| 互操作 Profile | 兼容性证据化 | `docs/生态/interoperability-profiles.md` | MCP/Registry profile |
| 一致性测试 | 生态可验证 | `docs/质量/conformance-suite-v1.md` | conformance groups |
| Agentic 风险 | 安全风险转测试 | `docs/安全/agentic-risk-mapping.md` | risk-to-control map |
| 身份授权 | 明确代表谁调用 | `docs/安全/identity-and-auth-model.md` | identity/auth boundary |
| Secret Resolver | 安全解析凭据 | `docs/设计/secret-resolver-v1.md` | env provider 契约 |
| 凭据生命周期 | 凭据创建/轮换/撤销 | `docs/运营/credential-lifecycle.md` | runbook |
| 最小权限评审 | 防止过宽 scopes | `docs/安全/least-privilege-review.md` | review checklist |
| 远程 OAuth 边界 | 防止未来授权混乱 | `docs/生态/oauth-and-remote-runtime-boundary.md` | future auth profile 边界 |
| 执行语义 | 表达副作用和结果状态 | `docs/设计/execution-semantics-v1.md` | outcome/state model |
| 重试与幂等 | 防止重复副作用 | `docs/设计/retry-and-idempotency-v1.md` | retry/idempotency rules |
| 失败恢复 | 状态未知时指导恢复 | `docs/运营/failure-recovery-runbook.md` | recovery runbook |
| 执行证据 | 证明调用发生了什么 | `docs/质量/execution-evidence-v1.md` | evidence fields |
| 组合边界 | 防止滑向 Agent Builder | `docs/设计/composition-boundary-v1.md` | composition invariants |
| 能力图 | 描述能力关系和风险放大 | `docs/生态/capability-graph-v1.md` | graph metadata 草案 |
| 多步执行 | 定义 step outcome 和补偿边界 | `docs/设计/multi-step-execution-boundary.md` | multi-step outcome model |
| 组合失败恢复 | 指导 partial/unknown/manual review | `docs/运营/composition-failure-runbook.md` | recovery runbook |
| 组合调研 | Saga/workflow 边界依据 | `docs/调研/composition-and-saga-scan-2026-05-07.md` | research notes |
| Trust 模型 | 把信任变成证据摘要 | `docs/生态/trust-model-v1.md` | trust level rules |
| Capability Advisory | 处理能力漏洞和恶意风险 | `docs/安全/capability-advisory-process.md` | advisory lifecycle |
| Deprecation/Revocation | 能力弃用、下架、撤销 | `docs/生态/capability-deprecation-and-revocation.md` | lifecycle terminal states |
| Quality Score | 解释能力成熟度 | `docs/质量/capability-quality-score.md` | scoring rubric |
| 用量计量 | 本地 usage evidence | `docs/运营/usage-metering-v1.md` | usage event model |
| 配额预算 | 执行前额度和预算 gate | `docs/设计/quota-and-budget-policy-v1.md` | quota/budget policy |
| 限流滥用 | 防止循环调用和刷请求 | `docs/安全/rate-limit-and-abuse-control-v1.md` | abuse controls |
| 商业边界 | paid capability/commerce profile 边界 | `docs/生态/paid-capability-and-commerce-boundary.md` | future commerce boundary |
| 用量证据 | 证明用量来自 invocation | `docs/质量/usage-evidence-v1.md` | usage evidence chain |
| Tool Projection | 生成模型可见工具元数据 | `docs/设计/tool-projection-v1.md` | MCP tool projection |
| Prompt Surface | 治理工具描述和结果注入 | `docs/安全/prompt-surface-security-v1.md` | prompt-surface controls |
| 发现选择边界 | 区分发现、选择和授权 | `docs/生态/discovery-and-selection-boundary.md` | discovery boundary |
| 元数据 Lint | 检查模型可见文案 | `docs/质量/model-visible-metadata-lint-v1.md` | metadata lint rules |
| Result Envelope | 统一 Runtime 输出边界 | `docs/设计/result-envelope-v1.md` | result envelope |
| 输出校验 | 验证 provider response 符合 output schema | `docs/质量/output-validation-v1.md` | output validation |
| 结果净化 | 净化 tool result prompt surface | `docs/安全/tool-result-sanitization-v1.md` | result sanitizer |
| 结果来源 | 记录结果来源和污染标记 | `docs/质量/result-provenance-v1.md` | result provenance |
| 结果投递 | 适配 MCP/CLI/未来协议输出 | `docs/生态/result-delivery-boundary.md` | delivery adapters |
| 输入数据治理 | 管理 tool input 外发风险 | `docs/安全/input-data-governance-v1.md` | input governance |
| 数据分类 | 识别 secret/PII/source/internal URL | `docs/安全/data-classification-v1.md` | classification rules |
| Data Egress Policy | 执行前判断什么数据发给谁 | `docs/设计/data-egress-policy-v1.md` | egress gate |
| 输入来源证据 | 记录 input provenance 和 egress map | `docs/质量/input-provenance-v1.md` | input provenance |
| 数据最小化 | 只外发 execution mapping 引用字段 | `docs/安全/data-minimization-and-redaction-v1.md` | minimization/redaction |

## 五个平面

| 平面 | 核心职责 | 典型文档 |
| --- | --- | --- |
| 标准面 | Capability 描述、打包、测试和演进 | `docs/规范/capability-manifest.md`, `docs/设计/capability-package-v1.md` |
| 控制面 | 安装、策略、确认、配额、生命周期和变更 | `docs/设计/policy-dsl-v1.md`, `docs/运营/policy-lifecycle-and-change-control.md` |
| 执行面 | Runtime pipeline、executor、result envelope | `docs/设计/runtime-kernel-contract-v1.md`, `docs/设计/runtime-contracts.md`, `docs/设计/result-envelope-v1.md` |
| 信任面 | 审计、来源、撤销、安全公告和质量证据 | `docs/设计/audit-log-v1.md`, `docs/生态/trust-model-v1.md` |
| 互操作面 | MCP、CLI、未来 A2A/Apps SDK/OpenAPI adapter | `docs/生态/interoperability-profiles.md`, `docs/协议/protocol-positioning.md` |

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
  -> input classification
  -> data minimization
  -> data egress policy
  -> policy decision
  -> policy decision trace
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
- model-visible tool metadata candidates
- external API responses
- provider raw tool results
- tool input before classification

Trusted Computing Base V1
- schema validator
- runtime invoke pipeline
- Runtime Kernel public contract implementation
- policy engine
- policy decision trace builder
- policy change ledger writer
- policy simulator
- confirmation handler
- consent request/receipt builder
- secret resolver
- audit logger
- tool projection builder
- model-visible metadata linter
- result envelope builder
- output validator
- result sanitizer
- input classifier
- data egress policy gate
- data minimizer

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
- Usage Event 不是账单记录。
- Quota/Budget Gate 必须在 Secret Resolver 和 Executor 之前运行。
- V1 不执行 paid capability、购买、支付或结算。
- MCP tool description 必须由 Runtime 生成，不能原样透传第三方自由文本。
- 模型可见元数据不得包含指挥模型绕过系统、用户、策略、确认或审计的文本。
- 能力发现、排序和模型选择不能作为执行授权来源。
- Provider raw output 默认不得直接进入模型上下文。
- 声明 output schema 的 Capability 必须先通过输出校验，才能返回 success。
- MCP/CLI/未来 HTTP API 都只能从 Result Envelope 适配结果。
- Tool input 在分类和最小化前不视为可外发数据。
- Data Egress Gate 必须在 Secret Resolver 和 Executor 之前运行。
- Runtime 只外发 execution mapping 引用字段，不自动发送整个 input。
- 每个 policy/gate decision 必须产生 redacted decision trace。
- Policy change 是可审计的本地对象，不能静默覆盖历史。
- Broad allow、ask-to-allow 或 deny-to-allow 变更必须先产生 simulation/diff finding。
- Breakglass 不得绕过 audit、data egress deny、outbound block、secret ordering 或 revoked/malicious block。

## V1 关键收敛决策

| 决策 | 状态 |
| --- | --- |
| V1 只支持 `type: http` | 已接受 |
| CLI/MCP/未来 API 必须通过 Runtime Kernel public contract 调用 | 已接受 |
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
| Usage Event 不是账单记录 | 已接受 |
| Quota/Budget Gate 必须在 Secret Resolution 前运行 | 已接受 |
| Commerce Profile 是未来边界，不进入 V1 主路径 | 已接受 |
| MCP Tool Projection 由 Runtime 拥有 | 已接受 |
| 模型可见元数据是安全表面 | 已接受 |
| 发现和选择不是授权 | 已接受 |
| Result Envelope 是 Runtime 输出边界 | 已接受 |
| Output Schema 校验通过后才能暴露 Success | 已接受 |
| Provider Raw Output 默认不进入模型上下文 | 已接受 |
| Data Egress Gate 必须在 Secret Resolution 前运行 | 已接受 |
| Tool Input 分类前视为不可信数据 | 已接受 |
| 数据最小化由 Runtime 拥有 | 已接受 |
| Policy Decision 必须产生 Trace | 已接受 |
| Policy 变更是可审计对象 | 已接受 |
| Broad Allow 需要模拟和差异评估 | 已接受 |
| Breakglass 不得绕过审计和硬安全边界 | 已接受 |

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
| 身份授权 | 部分实现 | T159 已实现 env provider；T163 仍按 RFC 处理远程 OAuth |
| Secret Resolver | 已实现 V1 env provider | T164 继续补 resolver ordering 和 audit evidence 集成测试 |
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
| 用量计量 | 清晰 | T198/T205 从 audit 派生 usage event |
| 配额预算 | 清晰 | T199/T204 做执行前 gate |
| 限流滥用 | 清晰 | T200/T201 处理 local/provider rate limit |
| 商业边界 | 清晰 | T202/T203 走 future RFC |
| 用量证据 | 清晰 | T207 做 conformance tests |
| Tool Projection | 清晰 | T209/T213 落入 MCP projection builder |
| Prompt Surface | 清晰 | T210/T211 建立 metadata lint 和 negative tests |
| 发现选择边界 | 清晰 | T214/T215 走 discovery profile 和 selection evidence |
| 元数据 Lint | 清晰 | T216 接入 Registry review checklist |
| Result Envelope | 清晰 | T220/T222 落到 Runtime/MCP result adapter |
| 输出校验 | 清晰 | T221/T054 做 schema validation 和 normalization |
| 结果净化 | 清晰 | T223/T229 建立 sanitizer 和 negative fixtures |
| 结果来源 | 清晰 | T224/T230 记录 provenance 和 taint labels |
| 结果投递 | 清晰 | T226/T231 维护 Host/CLI 投递边界 |
| 输入数据治理 | 清晰 | T234/T238 接入分类和确认摘要 |
| 数据分类 | 清晰 | T234/T235 建立 classifier 和 fixtures |
| Data Egress Policy | 清晰 | T236/T237 实现 gate 和 audit evidence |
| 输入来源证据 | 清晰 | T239/T240/T241 记录 provenance 和 field egress map |
| 数据最小化 | 清晰 | T242/T243/T244 落到 rendering/dry-run preview |
| Policy Decision Trace | 清晰 | T249/T250/T259 落到 Runtime/audit/CLI explain |
| Policy 生命周期 | 清晰 | T251/T252/T256 落到 validate/ledger/bundle RFC |
| Policy Simulation | 清晰 | T253/T254/T260 落到 simulation report 和 conformance |
| Policy Override | 清晰 | T255/T258/T260 落到 override record 和 incident runbook |
