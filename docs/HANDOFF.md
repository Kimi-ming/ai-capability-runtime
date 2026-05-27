# 当前状态交接

更新时间：2026-05-27

## 当前阶段

OpenCap 处于 V1 最小运行时实现阶段。文档体系已经建立，当前循环按 `docs/TASKS.md` 从小任务连续推进实现、验证、同步文档并提交 GitHub。

已新增 Superpowers 架构设计：`docs/superpowers/specs/2026-05-26-v1-architecture-convergence-design.md`。该设计把后续开发收敛为 MCP 主链路闭环、Usage/Evidence/Problem Details 证据线，以及整体架构与任务队列重整三条线。下一步应先评审该设计，再进入实施计划；实施顺序建议为 T070 MCP server 闭环、T198 Usage event schema、T206 quota/rate problem details、T205 usage export format、T207 usage evidence conformance tests。

本轮已把产品定位和架构完善方向同步到正式架构文档：`docs/ARCHITECTURE.md` 明确 OpenCap 是 AI Host 和真实 API 之间的本地优先 Capability Runtime，不是 Agent、聊天入口、模型路由或 marketplace；`docs/规划/v1-architecture.md` 已补充产品分层、Runtime Kernel 边界、gate 顺序、Result Envelope 边界和 Architecture Convergence 实施顺序。

本轮继续完成 T206 Problem details for quota/rate errors：`@opencap/runtime` 新增 `ProblemDetailsV1`、`createProblemDetailsFromQuotaBudgetGate()` 和 `createProblemDetailsFromProviderRateLimit()`，quota/budget evidence 补齐 limit 字段，Problem Details 覆盖 `quota-exceeded`、`budget-exceeded` 和 `provider-rate-limited`，并保持 `policyEffect: none` 和脱敏边界。相关文档已同步到错误模型、quota/budget 设计、测试策略和任务表。

本轮继续完成 T207 Usage evidence conformance tests：新增 `packages/runtime/test/fixtures/conformance/usage-evidence.yml`，并把该 record 纳入 `packages/spec/src/conformance.test.ts` 校验；`docs/质量/conformance-suite-v1.md` 已同步 `opencap.usage_evidence.v1` checks。该 conformance 只证明 non-billing usage evidence，不代表账单记录、计费规则或商业结算。

本轮继续完成 T146 OpenAPI adapter RFC 草案：新增 `rfcs/0015-openapi-adapter-profile-v1.md`，定义 `opencap.openapi.adapter.v1` future profile，明确 OpenAPI adapter 只能把人工选择的 operation 生成 Capability Manifest draft，不能自动安装、授权或暴露整份 OpenAPI 文档为 MCP tools。`packages/adapters/openapi/README.md`、协议定位文档和文档入口已同步。

本轮继续完成 T169 Retry/idempotency manifest RFC：新增 `rfcs/0016-retry-idempotency-manifest-profile-v1.md`，定义 `opencap.retry_idempotency.manifest.v1` future profile，明确 manifest 层 retry/idempotency 字段草案、provider key、payload binding、reconcile hint 和 audit/evidence 脱敏边界；当前 Runtime 仍默认不自动 retry，HTTP executor 不执行 retry loop。

本轮继续完成 T171 Duplicate invocation detector 草案：新增 `docs/设计/duplicate-invocation-detector-v1.md`，定义 future 本地 pre-secret duplicate detector，覆盖匹配键、匹配类型、默认窗口、decision/evidence、consent UX、audit/storage、retry/idempotency 关系和 usage evidence 口径；草案明确 OpenCap 不提供 exactly-once、不跨机器去重，也不替代 policy、consent、retry/idempotency 或 provider reconcile。

本轮继续完成 T172 Reconcile hint manifest field：`packages/spec/schema/manifest.schema.json` 新增 `execution.reconcile` schema，支持 `manual` / `provider_lookup` 恢复提示、provider request id field、resource ref fields、固定 `retry_guidance: do_not_retry_until_reconciled` 和 `policy_effect: none`；`@opencap/spec` 已导出 manifest execution/reconcile 类型，Manifest 规范、execution semantics、failure recovery runbook 和测试策略已同步。

本轮继续完成 T175 Composition context audit fields：`packages/runtime/src/index.ts` 新增 `CompositionContextEvidence`、`CompositionInitiatedBy` 和 `createCompositionContextEvidence()`，`AuditEvent` 支持可选 `compositionContext`，SQLite audit logger 新增 `composition_context_json` 持久化和查询恢复。该 evidence 只记录 composition id、parent invocation、step metadata、initiator、plan hash 和 `policyEffect=none`，不保存 raw plan，也不改变 step-level policy/consent。

本轮继续完成 T176 Composition profile RFC：新增 `rfcs/0017-composition-profile-v1.md`，定义 `opencap.composition.profile.v1` future profile，覆盖 composition context、step record、plan hash、composition outcome、Runtime pipeline、MCP/Host metadata 边界、failure/recovery、audit/evidence 和兼容迁移；RFC 明确 OpenCap 不做 Agent、workflow runtime、自动调度、workflow DSL 或 workflow-level consent。

本轮继续完成 T177 Step-level consent tests for composition：`ConfirmationRequest` 新增可选 `compositionContext`，`createConfirmationAuditEvent()` 会把该 context 写入当前 step audit event；新增 Runtime 测试确认同一 composition 中两个 write step 会生成独立 consent id、不同 input hash，并保留子 step 的 parent invocation/context evidence，父 step approval 不传递给子 step。

本轮继续完成 T178 Plan hash and evidence chain 草案：新增 `docs/设计/plan-hash-evidence-chain-v1.md`，定义 `opencap.plan_hash_evidence_chain.v1` 草案，把 composition context、input provenance、policy trace、consent receipt、execution evidence、reconcile hint 和 future source audit hash 聚合为只读链路。草案明确 `planHash` 只接受 `sha256:<64 hex>` 形式，不保存 raw plan，不验证计划正确性，也不能改变 policy、consent、quota/budget、outbound、data egress、secret resolver、execution 或 audit gate。

本轮继续完成 T179 Capability graph metadata RFC：新增 `rfcs/0018-capability-graph-metadata-v1.md`，定义 `opencap.capability_graph.metadata.v1` future profile，覆盖节点、边、字段规则、风险放大 marker、生成来源、安全隐私、兼容迁移和 future tests。RFC 明确 graph metadata 只用于 Registry review、发现、组合风险分析和未来 graph index，不是 workflow、推荐系统、执行计划、安装授权或 Runtime policy authority。

本轮继续完成 T180 Risk amplification review checklist：新增 `docs/社区/risk-amplification-review-checklist.md`，把 Capability graph marker 转成 Registry PR 人工检查项，覆盖 `read_to_write`、`write_then_external_send`、`internal_data_to_external_send`、`destructive_after_search`、`financial_after_model_generated_input` 和 `credential_scope_overlap` 的 severity、阻断条件和 evidence 模板。该清单只产生 review evidence，固定 `policyEffect=none`，不改变 Runtime policy。

本轮继续完成 T181 Registry graph index 草案：新增 `docs/生态/registry-graph-index-v1.md`，定义 `opencap.registry.graph_index.v1` future profile，覆盖 graph index envelope、capability/node/edge/risk/review entry、生成流程、只读查询、默认 lifecycle/advisory 过滤、cache layout 和安全隐私边界。草案明确 graph index 只用于 review/discovery/inspection，不生成 workflow、自动安装、暴露 MCP tools 或改变 Runtime policy。

本轮继续完成 T182 Compensation capability review rules：新增 `docs/社区/compensation-capability-review-rules.md`，定义补偿能力的 Registry review 规则，覆盖使用时机、命名、manifest、权限风险、输入确认、reconcile 顺序、graph metadata、阻断条件和 `opencap.compensation.review.v1` evidence 模板。规则明确 compensation 是独立 Capability invocation，不是隐式 rollback，不保证恢复原状态，也不能复用原 step consent、input hash 或 policy decision。

本轮继续完成 T183 Composition failure recovery smoke tests：新增 `packages/runtime/src/composition-recovery.ts` 和 `composition-recovery.test.ts`，实现 `evaluateCompositionFailureRecovery()` 纯 decision helper。测试覆盖 required write step `unknown_after_timeout` 需要 reconcile、blocked step 停止后续、后续 external_send 失败形成 partial 且不自动补偿、compensation step 失败进入 manual review；helper 固定 `autoCompensationAllowed=false` 和 `policyEffect=none`，只输出 recovery evidence，不调度 workflow 或执行补偿。

本轮继续完成 T198 Usage event schema：新增 `packages/runtime/src/usage-event.ts` 和 `usage-event.test.ts`，导出 `USAGE_EVENT_SCHEMA`、`createUsageEventFromAuditEvent()` 和 usage event 类型。Helper 从 audit event 派生 `opencap.usage_event.v1` non-billing usage event，覆盖 blocked redaction、dry-run 分离、retryAttempt 不增加 user intent、revoked/deprecated lifecycle 标记和 sourceAuditHash；usage event 固定 `policyEffect=none`、`billingEffect=none`，不复制 input/output/credential redaction 字段。

本轮继续完成 T202 Paid capability manifest RFC：新增 `rfcs/0019-paid-capability-manifest-v1.md`，定义 future `opencap.paid_capability.manifest.v1` metadata。RFC 区分 paid capability metadata、financial risk 和 usage evidence，明确 V1 不做 purchase、checkout、invoice、settlement、refund、dispute 或 payout；paid metadata 固定 `policyEffect=none`、`billingEffect=none`，不能改变 Runtime policy、risk、trust、quality、usage event 或 billing。

本轮继续完成 T203 Commerce Profile RFC：新增 `rfcs/0020-commerce-profile-v1.md`，定义 future `opencap.commerce_profile.v1`。RFC 把 paid manifest metadata、non-billing usage event、financial consent/spend gate 和 future transaction evidence 分开，覆盖 price quote、purchase authorization、billable event conversion、settlement、refund 和 dispute evidence；Commerce Profile 不进入 V1 Runtime 主路径，不能跳过 policy/consent/spend gate，也不能把 V1 usage event 直接变成账单记录。

本轮继续完成 T205 Usage export format：新增 `packages/runtime/src/usage-export.ts` 和 `usage-export.test.ts`，导出 JSON envelope/JSONL usage export helper。Export format 固定 `opencap.usage_export.v1`、`exportVersion=1`、`opencap.usage_export.redaction.v1` 和 compatibility metadata；helper 白名单复制 `opencap.usage_event.v1` 字段，拒绝非 v1、`billingEffect!=none` 或 `policyEffect!=none` 的记录，不导出 input/output、credential redaction 或 provider raw response。

本轮继续完成 T070 MCP TypeScript SDK 接入：选择官方 `@modelcontextprotocol/sdk`，`packages/mcp/package.json` 记录版本范围 `^1.29.0`，`pnpm-lock.yaml` 锁定 `1.29.0`。`@opencap/mcp` 新增 SDK server wiring 和 state-backed stdio server factory；`@opencap/cli serve --mcp` 已接入最小 stdio server，不再向 stdout 输出占位文本。MCP 仍只作为 adapter，复用现有 tools/list、tools/call 和 confirmation_required 边界，不改变 Runtime Kernel。

本轮完成了项目完成度审查和自主开发推进：T070 MCP TypeScript SDK 接入、T124 Runtime 领域模型 public contract、T145 workspace package public exports、T268 Runtime Gate public contract、T269 Runtime Ledger storage contract、T270 Runtime Card schema contract、T273 Capability identity contract、T275 Capability authoring loop、T276 release maturity gate matrix、T131 `execution.body.fields` 渲染边界、T132 audit failure preflight、T133 outbound policy 私网阻断、T135 state dir precedence tests、T152 consent receipt audit fields、T160 credential descriptor schema tests、T161 least-privilege auth lint、T167 execution semantics evidence、T168 unknown outcome audit tests、T170 retry policy tests、T196 score cannot override policy tests、T199 quota/budget policy gates、T200 provider rate limit handling、T201 local abuse throttle、T204 financial consent/spend cap gate、T125 `opencap list` lifecycle/trust fields、T127 Host compatibility matrix、T134 CLI command snapshot tests、T136 MCP tool mapping contract tests、T137 CLI error exit code tests、T142 Host compatibility test records、T143 local metrics command draft、T154 Host compatibility evidence records、T156 MCP elicitation profile RFC、T157 A2A Agent Card mapping RFC、T163 Remote Runtime OAuth Profile RFC、T271 Interoperability evidence record schema、T126 executable release checklist、T129 Registry supply chain review workflow、T139 CI security baseline workflow、T140 Capability taxonomy registry guidance、T141 Capability review checklist PR flow、T144 RFC template、T147 Registry index signing RFC、T148 npm trusted publishing workflow draft、T195 Trust Card quality score integration、T272 Registry index/cache/sync RFC、T274 SLSA/Sigstore provenance metadata 预留、T116 术语表/文档索引维护、T128 威胁模型 Abuse Cases smoke tests、T138 privacy retention 文档 lint、T153 conformance suite skeleton、T155 Agentic abuse cases smoke tests、T162 credential lifecycle smoke/runbook 验证、T165 GitHub fine-grained token setup guide、T173 Execution evidence conformance record 和 T190 SECURITY.md private reporting 对齐均已落入代码或文档并验证。当前没有 ready 开放任务；下一步建议补真实 Host smoke evidence 或刷新新任务队列。

已经完成的实现主线：

- GitHub 仓库创建和推送
- V1 项目骨架和中文文档体系
- `opencap validate` 真实 schema 校验
- manifest validator API 和单元测试
- registry test case schema 与 `pnpm validate` 集成
- Capability authoring loop/lint 顺序 contract，且 `pnpm validate` 已把 model-visible metadata lint、credential descriptor schema 和 least-privilege auth lint 纳入 registry validation
- v0.1-v1.0 release maturity gate matrix 和 hard blocker rules
- `execution.body.fields` required/optional 渲染边界测试与实现
- audit failure preflight：非 `read_only` HTTP 执行在审计写路径失败时阻断 secret resolution 和 request start
- outbound policy 私网阻断：真实 HTTP 执行默认阻断 localhost/loopback/private/link-local/metadata/non-HTTPS/arbitrary URL
- Runtime state dir helper、state dir precedence tests、install、list、doctor、Installed Capability Loader
- MCP Capability id 到 tool name 的稳定映射和冲突检测
- 本地状态初始化和默认 `policies.yml`
- Policy parser、`loadPolicySet`、Policy Engine、Confirmation Handler、consent receipt audit fields、CLI `--yes` 边界、内存/SQLite Audit Logger、redaction/input hash、`opencap logs`、日志筛选、URL 模板渲染、HTTP dry-run plan、HTTP executor、Secret Resolver V1 env provider、credential audit evidence、`auth.placement` schema 约束和 executor 映射测试、`execution.body.fields` schema、output normalization、arbitrary URL 风险检测、outbound policy 私网阻断、Runtime domain public contract、Runtime Gate public contract、Runtime Ledger storage contract、Runtime Card schema contract、Capability identity contract、workspace package public exports、MCP tools/list、MCP tools/call 路由、稳定的 MCP confirmation_required 结果格式、MCP Host 手动测试指南、Registry manifest CI、Capability PR 评审指南、Registry README、GitHub Issue/PR templates 和 slack.send_message 示例 Capability 和 token passthrough 禁止测试和最小 outbound policy 设计和审计日志隐私分级和威胁模型矩阵和 pnpm workspace 全量验证和单元测试基础设施文档化和临时目录测试工具和 CLI 端到端 smoke test 和 README 真实命令快速开始和第一次贡献教程和 V1 Runtime 主路径架构图和 alpha release checklist 和 CHANGELOG 缺口校准和版本兼容策略补强、MCP Tool Projection builder、model-visible metadata lint 和 prompt-surface negative fixtures 和 tool projection hash/evidence 和 Runtime-generated risk summary 和 Discovery Profile V1 RFC 和 Selection Evidence record 和 Capability Review model-visible text 检查和 tool result prompt-surface sanitizer 草案和 Host tool metadata compatibility records 和 Result Envelope V1 builder 和 output schema validation 和 MCP structuredContent adapter 和 Tool Result Sanitizer 和 Result provenance/evidence 和 oversized result handling 和 Host result compatibility records 和 Output Selector V1 RFC 和 Resource Delivery Profile V1 RFC 和 Result sanitizer negative fixtures 和 Taint label tests 和 CLI result envelope output 和 Result Envelope public type exports 和 input classification engine、sensitive input classification fixtures 和 Data Egress Policy Gate、egress decision audit fields 和 confirmation egress summary 和 input provenance audit evidence 和 field-level egress map 和 derived input evidence chain 和 input minimization 和 redacted egress preview 和 dry-run egress preview 和 internal URL/source/config egress negative tests 和 Manifest Data Class Hint RFC 和 Organization Data Policy RFC 和 Policy Decision Trace runtime 和 Policy Explain CLI 和 Policy Change Ledger、Policy Validate Lint、Policy Simulation/Diff、Broad Allow Safety Checks 和 Policy Override/Breakglass Controls、Policy Simulation Fixtures 和 Policy Incident Runbook 和 Decision Log Export 和 Policy Governance Conformance Tests

## 当前代码状态

主要包状态：

- `@opencap/spec` 有 schema、类型、manifest loader/validator API、Capability authoring loop contract、registry test 校验、schema JSON public subpath export、conformance suite skeleton、`api_key` auth placement 和 credential descriptor 约束测试、model-visible metadata lint、privacy retention doc lint、credential lifecycle runbook lint、GitHub fine-grained token guide lint、SECURITY.md private reporting lint、least-privilege auth lint、authoring manifest validation 和 prompt-surface negative fixtures。
- `@opencap/cli` 的 `validate`、`install`、`list`、`doctor`、`logs` 已接入真实逻辑；`list` 已输出 lifecycle/trust/maintainer/license/status 基础字段；`command-snapshot.test.ts` 已锁定 validate/list/logs/decision-log/policy validate 的稳定 stdout/stderr/exit code；`error-exit-code.test.ts` 已覆盖用户可修正错误 exit `1`；`invoke` 已支持 dry-run、真实 HTTP 执行和 Result Envelope 输出；`serve --mcp` 已启动最小 stdio MCP server；package public surface 保持 bin-only。
- `@opencap/runtime` 有 Runtime Kernel public contract 类型、Runtime Gate public contract、Runtime Ledger storage contract、Runtime Card schema contract、Capability identity contract、execution semantics evidence 类型/helper、unknown timeout audit evidence、retry policy decision helper、provider rate limit evidence、quota/rate Problem Details helper、local abuse throttle gate、financial consent/spend cap gate、quality score rubric、Trust Card quality score evidence、quality score policy trace boundary、quota/budget pre-secret gate helper 和 GateDecision 语义 helper、本地 state dir 初始化和 precedence tests、install/list/load installed capabilities、policy parser、Policy Engine、Confirmation Handler、consent receipt audit fields、Secret Resolver V1 env provider、credential audit evidence、credential lifecycle smoke、custom header placement audit evidence、confirmation egress summary、input provenance audit evidence、field-level egress map、derived input evidence chain、input minimization、redacted egress preview、dry-run egress preview、internal URL/source/config egress negative tests、Data Egress Policy Gate、egress decision audit fields、内存/SQLite Audit Logger、audit preflight、outbound policy gate、HTTP dry-run plan、HTTP executor、Threat/Agentic Abuse Case smoke tests 和 package export map 测试。
- `@opencap/mcp` 有 tool name 映射、冲突检测、tools/list 投影、tools/call 路由、MCP tool mapping contract snapshots 和稳定的 confirmation_required 结果格式；MCP Host 手动测试指南已补齐；Registry manifest CI 已接入；Capability PR 评审指南已新增；Registry README 已补齐；GitHub Issue/PR templates 已补齐；slack.send_message 示例 Capability 已新增；token passthrough 禁止测试已补齐；最小 outbound policy 设计已补强；审计日志隐私分级已补齐；威胁模型矩阵已补强；pnpm workspace 全量验证已通过；单元测试基础设施现状已文档化；临时目录测试工具已补齐；CLI 端到端 smoke test 已补齐；README 快速开始已同步真实命令；第一次贡献教程已新增；V1 Runtime 主路径架构图已补齐；alpha release checklist 已新增；CHANGELOG 已知缺口已校准；版本兼容策略已补强；MCP Tool Projection builder 已实现；model-visible metadata lint 和 prompt-surface negative fixtures 和 tool projection hash/evidence 和 Runtime-generated risk summary 和 Discovery Profile V1 RFC 和 Selection Evidence record 和 Capability Review model-visible text 检查和 tool result prompt-surface sanitizer 草案和 Host tool metadata compatibility records 和 Result Envelope V1 builder 和 output schema validation 和 MCP structuredContent adapter 和 Tool Result Sanitizer 和 Result provenance/evidence 和 oversized result handling 和 Host result compatibility records 和 Output Selector V1 RFC 和 Resource Delivery Profile V1 RFC 和 Result sanitizer negative fixtures 和 Taint label tests 和 CLI result envelope output 和 Result Envelope public type exports 和 input classification engine、sensitive input classification fixtures 和 Data Egress Policy Gate 已实现。
- `@opencap/sdk` 暂缓实现。

## 当前任务入口

下一步从 `docs/TASKS.md` 开始。

`docs/TASKS.md` 已重新拆成 M0-M6 七个模块化任务队列。T070、T198 和 T205 均已完成；当前没有 ready 开放任务。

下一步推荐：`next_task.py` 当前进入 Handoff 状态。建议新增下一批 ready 任务，或按 `docs/教程/connect-mcp-host.md` 补 Claude Desktop/Cursor 真实 Host smoke evidence。

当前阻塞：

- T001/T002/T003/T004/T005/T010/T011/T012/T013/T014/T015/T020/T021/T022/T030/T031/T032/T033/T034/T040/T041/T042/T043/T050/T051/T052/T053/T054/T055/T060/T061/T062/T071/T072/T073/T074/T080/T081/T082/T083/T084/T090/T091/T092/T093/T100/T101/T102/T103/T104/T112/T113/T114/T120/T121/T122/T123/T124/T125/T126/T127/T128/T129/T130/T131/T132/T133/T134/T135/T136/T137/T138/T139/T140/T141/T142/T143/T144/T145/T147/T148/T151/T152/T153/T154/T155/T156/T157/T158/T159/T160/T161/T162/T163/T164/T165/T167/T168/T170/T173/T185/T186/T187/T188/T189/T190/T191/T192/T193/T194/T195/T196/T199/T200/T201/T204/T209/T210/T211/T212/T213/T214/T215/T216/T217/T218/T220/T221/T222/T223/T224/T225/T226/T227/T228/T229/T230/T231/T232/T234/T235/T236/T237/T238/T239/T240/T241/T242/T243/T244/T245/T246/T247/T249/T250/T251/T252/T253/T254/T255/T256/T257/T258/T259/T260/T268/T269/T270/T116/T271/T272/T273/T274/T275/T276 已完成
- Runtime/CLI 已能初始化 state dir、安装能力、列出能力、加载合法 installed capabilities、解析 policy、计算 allow/ask/deny、处理确认、支持 CLI `--yes`、生成审计事件、脱敏输入、持久化 SQLite、查询筛选日志，渲染 HTTP URL 模板、生成 HTTP dry-run plan、执行真实 HTTP 请求，并通过 MCP tools/call 返回稳定的确认阻断结果
- 当前状态：T070、T146、T169、T171、T172、T175、T176、T177、T198、T205、T206 和 T207 已完成并验证；当前无 ready 开放任务。

## 最近验证

项目 conda 环境 `ai-capability-runtime` 已创建并安装依赖。本轮项目测试与文档收敛已运行：

- `pnpm --filter @opencap/runtime test -- domain.test.ts`
- `pnpm --filter @opencap/runtime test -- gate.test.ts`
- `pnpm --filter @opencap/runtime test -- ledger.test.ts`
- `pnpm --filter @opencap/runtime test -- card.test.ts`
- `pnpm --filter @opencap/runtime test -- identity.test.ts`
- `pnpm --filter @opencap/spec test -- authoring.test.ts`
- `pnpm --filter @opencap/spec test -- conformance.test.ts`
- `pnpm --filter @opencap/spec build`
- `pnpm --filter @opencap/spec lint`
- `pnpm --filter @opencap/spec test`
- `pnpm --filter @opencap/spec test -- advisory.test.ts`
- `pnpm --filter @opencap/spec test -- privacy-retention-doc-lint.test.ts`
- `pnpm --filter @opencap/spec test -- credential-lifecycle-doc-lint.test.ts`
- `pnpm --filter @opencap/spec test -- github-token-guide-doc-lint.test.ts`
- `pnpm --filter @opencap/spec test -- security-policy-doc-lint.test.ts`
- `pnpm --filter @opencap/spec test -- index.test.ts -t "lifecycle"`
- `pnpm --filter @opencap/spec test -- index.test.ts -t "auth credential descriptor"`
- `pnpm --filter @opencap/spec test -- index.test.ts`
- `pnpm --filter @opencap/spec test -- auth-lint.test.ts authoring.test.ts`
- `pnpm --filter @opencap/runtime test -- index.test.ts -t "audit preflight"`
- `pnpm --filter @opencap/runtime test -- index.test.ts -t "outbound policy"`
- `pnpm --filter @opencap/runtime test -- index.test.ts -t "state dir"`
- `pnpm --filter @opencap/runtime test -- index.test.ts -t "consent receipt"`
- `pnpm --filter @opencap/runtime test -- index.test.ts -t "composition context"`
- `pnpm --filter @opencap/runtime test -- index.test.ts -t "composition step"`
- `pnpm --filter @opencap/runtime test -- index.test.ts`
- `pnpm --filter @opencap/runtime test -- package-exports.test.ts`
- `pnpm --filter @opencap/runtime test -- domain.test.ts result-envelope.test.ts index.test.ts -t "execution semantics"`
- `pnpm --filter @opencap/runtime test -- index.test.ts result-envelope.test.ts -t "unknown outcome"`
- `pnpm --filter @opencap/runtime test -- retry-policy.test.ts`
- `pnpm --filter @opencap/runtime test -- policy-score.test.ts`
- `pnpm --filter @opencap/runtime test -- quota-budget-gate.test.ts`
- `pnpm --filter @opencap/runtime test -- provider-rate-limit.test.ts`
- `pnpm --filter @opencap/runtime test -- abuse-throttle.test.ts`
- `pnpm --filter @opencap/runtime test -- threat-model-abuse-cases.test.ts`
- `pnpm --filter @opencap/runtime test -- agentic-abuse-cases.test.ts`
- `pnpm --filter @opencap/runtime test -- credential-lifecycle.test.ts`
- `pnpm --filter @opencap/runtime test -- financial-consent-spend-gate.test.ts`
- `pnpm --filter @opencap/runtime test -- index.test.ts -t "listInstalledCapabilities"`
- `pnpm --filter @opencap/runtime test -- trust-transition.test.ts`
- `pnpm --filter @opencap/runtime test -- lifecycle-gate.test.ts`
- `pnpm --filter @opencap/runtime test -- advisory-check.test.ts`
- `pnpm --filter @opencap/cli test -- smoke.test.ts`
- `pnpm --filter @opencap/cli test -- command-snapshot.test.ts`
- `pnpm --filter @opencap/cli test`
- `pnpm --filter @opencap/cli build`
- `pnpm --filter @opencap/cli lint`
- `pnpm --filter @opencap/mcp test -- tool-mapping-contract.test.ts`
- `pnpm --filter @opencap/mcp test`
- `pnpm --filter @opencap/mcp build`
- `pnpm --filter @opencap/mcp lint`
- `pnpm --filter @opencap/cli test -- error-exit-code.test.ts`
- `pnpm --filter @opencap/runtime test`
- `pnpm validate`
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- JSON parser 校验 package/schema `package.json`
- Ruby YAML parser 校验 `.github/**/*.yml` / `.yaml`
- `git diff --check`
- `check_docs.py`
- `audit_docs.py`
- `next_task.py`
- RFC 0016 草案文本扫描：无待补全文案命中。

当前已知：上述验证均通过。`pnpm test` 当前覆盖 spec 74 个、runtime 273 个、mcp 21 个、cli 5 个测试。运行环境使用 conda `ai-capability-runtime` 中的 Node 22 和 pnpm 9.15.3。`node:sqlite` ExperimentalWarning 仍是已知环境提示。本轮已把 Runtime HTTP executor 的核心成功、失败、timeout 和 credential audit 测试改为注入式 `fetch`，避免在受限沙箱内因 `listen EPERM` 绑定 `127.0.0.1` 失败；root `pnpm test` 的 CLI smoke/snapshot/error tests 仍会通过 `tsx` 创建本地 IPC pipe，普通 Codex 沙箱会以 `listen EPERM` 阻断，需要脱沙箱验证。

## 本轮文档和后续收敛

- T101 已完成：`.github/workflows/validate.yml` 的 workspace tests job 增加 `pnpm build`。
- T123 已完成：`docs/运营/package-publishing-v1.md` 已补齐 alpha package 发布判断，明确 `@opencap/spec`、`@opencap/runtime`、`@opencap/cli` 可作为 alpha candidate，`@opencap/mcp` 和 `@opencap/sdk-js` 暂缓。
- T256 已完成：新增 `rfcs/0009-policy-bundle-manifest-signing-v1.md`，并同步 policy lifecycle 与 signing/provenance 文档。
- T124 已完成：Runtime Kernel public contract 类型和最小 helper 已在 `packages/runtime/src/domain.ts` 导出，`domain.test.ts` 覆盖 6 个 contract 测试。
- T145 已完成：workspace package 已定义 npm `exports` 边界，`package-exports.test.ts` 覆盖 importable package root entrypoint、spec schema subpath 和 CLI bin-only surface。
- T268 已完成：Runtime Gate public contract、`GateDecision` 语义 helper 和 hard boundary 默认规则已在 `domain.ts` 导出，`gate.test.ts` 覆盖 3 个 contract 测试。
- T269 已完成：Runtime Ledger storage contract 已在 `packages/runtime/src/ledger.ts` 导出，`ledger.test.ts` 覆盖 4 个 contract 测试。
- T270 已完成：Runtime Card schema contract 已在 `packages/runtime/src/card.ts` 导出，`card.test.ts` 覆盖 6 个 contract 测试。
- T273 已完成：Capability identity contract 已在 `packages/runtime/src/identity.ts` 导出，`identity.test.ts` 覆盖 5 个 contract 测试。
- T275 已完成：Capability authoring loop/lint 顺序已在 `packages/spec/src/authoring.ts` 导出，`authoring.test.ts` 覆盖 7 个 contract 测试；`pnpm validate` 的 registry validation 已纳入 model-visible metadata lint。
- T276 已完成：`docs/运营/release-readiness.md` 已定义 v0.1-v1.0 maturity gate matrix，覆盖 Runtime、Registry/Trust、Interop、Policy/Ops、Docs/Release hygiene 五类门禁；alpha checklist、versioning、README/INDEX 和 SYSTEM 已同步入口与口径。
- T131 已完成：`packages/runtime/src/index.test.ts` 新增 `execution.body.fields` required/optional 渲染测试；`packages/runtime/src/index.ts` 会基于 manifest `input.required` 区分必填和可选 full-template body 字段。Runtime 测试数从 188 增至 189。
- T132 已完成：`AuditLogger` 新增 `preflight()` 契约，HTTP executor 对非 `read_only` capability 在解析 secret 和发起请求前执行 audit preflight；失败时返回 `audit_failed` / `AUDIT_PREFLIGHT_FAILED`，Result Envelope 映射为 blocked/audit_failed。`SqliteAuditLogger.preflight()` 会通过事务写入并 rollback 验证写路径，不持久化 invocation 记录。Runtime 测试数从 189 增至 191。
- T133 已完成：`packages/runtime/src/index.ts` 新增 outbound target classification/evaluation 和 HTTP executor outbound gate。真实执行会在 audit preflight、Secret Resolver 和 fetch 前阻断 localhost/loopback、RFC1918 private IP、link-local、metadata service、non-HTTPS 和 arbitrary URL；block 结果为 `outbound_blocked` / `OUTBOUND_BLOCKED`，blocked audit event 记录 outbound decision/target type/reason code/resolved URL 和 `requestStarted=false`。Runtime 测试数从 191 增至 200。
- T135 已完成：`packages/runtime/src/index.test.ts` 新增 state dir precedence tests，覆盖相对/绝对路径解析、`OPENCAP_STATE_DIR` 跨 state helper 一致性、显式 `stateDir` 优先于环境变量，以及低优先级 state dir 不被创建。当前实现已满足契约，本轮用临时 env-first 回归验证新增测试会失败；Runtime index 测试数从 85 增至 88，Runtime 包测试数从 200 增至 203。
- T152 已完成：`packages/runtime/src/index.ts` 新增 consent receipt audit evidence 类型、字段和生成 helper；`createConfirmationAuditEvent()` 对 policy `ask` 的 approved/rejected/confirmation_required 写入 receipt，MCP 无确认通道映射为 `unavailable`，allow/deny 不伪造 consent。SQLite audit logger 已持久化、迁移并查询 consent fields；CLI approved ask 路径会把 receipt 带入 HTTP execution audit event。Runtime index 测试数从 88 增至 93，Runtime 包测试数从 203 增至 208。
- T160 已完成：`packages/spec/schema/manifest.schema.json` 收紧 `api_key` credential descriptor，要求 provider/env/placement/scopes，scopes 非空唯一，env/provider/header name 安全，并拒绝 `auth.type: none` 携带 credential fields。`packages/spec/src/index.test.ts` 新增 5 个 schema 测试，`authoring.test.ts` fixture 同步 scopes；spec 测试数从 32 增至 37。
- T161 已完成：`packages/spec/src/auth-lint.ts` 导出 `lintLeastPrivilegeAuth()` 和结构化 finding 类型，覆盖 provider/resource mismatch、read-only permission 携带 elevated scope、elevated permission 只声明 read-only scope、wildcard/admin/full/repo 等 overbroad scope；`validateCapabilityAuthoringManifest()` 已把 finding 映射为 `least-privilege-auth-lint:*` issue 阻断 registry validation。Spec 测试数从 37 增至 45。
- T167 已完成：`packages/runtime/src/domain.ts` 导出 execution outcome、side-effect kind 和扩展后的 `ExecutionEvidence`；`packages/runtime/src/index.ts` 新增 `createHttpExecutionEvidence()`，HTTP execution audit event、Result Envelope evidence 和 SQLite audit logger 都会写入 execution semantics 字段。Runtime 测试数从 208 增至 211。
- T168 已完成：`packages/runtime/src/index.test.ts` 新增注入式 HTTP timeout audit 测试，确认请求已进入 fetch 后 timeout 会写入 `executionOutcome=unknown_after_timeout`、`requestStarted=true`、`executionSideEffectKind=write`、`executionRetryAttempt=0` 和 `executionRequestStartedAt`，且不伪造 `executionResponseReceivedAt`；`packages/runtime/src/result-envelope.test.ts` 同步覆盖 unknown timeout evidence。Runtime 测试数从 211 增至 213。
- T170 已完成：`packages/runtime/src/retry-policy.ts` 新增 `defaultHttpRetryPolicy()` 和 `evaluateHttpRetryPolicy()` 纯 decision helper，覆盖默认不自动 retry、非幂等写操作不 retry、unknown write timeout 要求 reconcile、401/403 不 retry、显式 read-only retry 和 idempotency key hash evidence。Runtime 测试数从 213 增至 219。
- T196 已完成：`PolicyEvaluationInput` 支持 `qualityScore` trace fact；新增 `policy-score.test.ts`，确认高分只能进入 `quality_score=<value>` evidence，不能把默认 ask 改为 allow，也不能覆盖显式 deny。Runtime 测试数从 219 增至 221。
- T199 已完成：新增 `packages/runtime/src/quota-budget-gate.ts` 和 `quota-budget-gate.test.ts`，导出 `evaluateQuotaBudgetGate()` 纯 pre-secret gate helper。测试覆盖 quota deny、quota ask、budget deny 不被 trust/quality 绕过和 evidence redaction。Runtime 测试数从 221 增至 225。
- T200 已完成：HTTP executor 429 `http_error` 结果新增 `providerRateLimit` evidence，解析 `Retry-After` 和 `RateLimit-Reset`，只记录白名单 header 名称和派生时间；新增 `provider-rate-limit.test.ts` 覆盖 header redaction 和非幂等写操作不自动 retry。Runtime 测试数从 225 增至 227。
- T201 已完成：新增 `packages/runtime/src/abuse-throttle.ts` 和 `abuse-throttle.test.ts`，导出 `evaluateAbuseThrottleGate()` 和 `defaultExternalSendAbuseThrottleRule()` 纯 pre-secret gate helper。测试覆盖本地循环调用 deny 阻断 secret/execution、ask 映射 confirmation_required、warn 作为 allow evidence，以及 `external_send` 默认低频 ask 基线。Runtime 测试数从 227 增至 231。
- T204 已完成：新增 `packages/runtime/src/financial-consent-spend-gate.ts` 和 `financial-consent-spend-gate.test.ts`，导出 `evaluateFinancialConsentSpendGate()` 纯 pre-secret gate helper。测试覆盖 financial risk 必须 explicit approved consent、approved consent 后仍检查 spend cap、evidence redaction 和非 financial 不触发 consent gate；`evaluateQuotaBudgetGate()` 同步补齐 budget warn evidence。Runtime 测试数从 231 增至 235。
- T125 已完成：`InstalledCapabilitySummary` 和 `opencap list` 新增 lifecycle、trust level、maintainer、license、status 基础字段。有效 installed capability 标记 `installed`，损坏条目标记 `invalid`；CLI smoke 覆盖 JSON 与人类表格输出。字段只作为 Trust Card 可见化 evidence，不参与授权。
- T127 已完成：`docs/生态/host-compatibility-matrix.md` 新增 2026-05-14 维护状态、profile 覆盖矩阵和维护规则，区分自动化 adapter tests 与真实 Host smoke；Claude Desktop/Cursor 保持 `pending-smoke`，自定义 MCP client 绑定 helper tests 证据。`docs/生态/interoperability-profiles.md` 已同步矩阵入口。
- T134 已完成：新增 `packages/cli/src/command-snapshot.test.ts`，覆盖 validate 成功输出、空 list/logs/decision-log、已安装 list 人类表格和 JSON、policy validate 用户错误输出和 exit code。快照归一化仓库路径、临时 state dir 和 Node warning pid；CLI 包测试数从 1 增至 3。
- T136 已完成：新增 `packages/mcp/src/tool-mapping-contract.test.ts`，覆盖 deterministic id 映射、冲突诊断、tools/list projection mapping 和 tools/call reverse lookup。测试确认原始 capability id 不能作为 tool name 直接调用，只有映射后的 tool name 会进入 executor；MCP 包测试数从 18 增至 21。
- T137 已完成：新增 `packages/cli/src/error-exit-code.test.ts`，覆盖 missing capability、invalid `--input-json` 和 invalid `--limit` 的用户错误 exit `1`。`packages/cli/src/index.ts` 新增 `CliUserInputError`，把用户输入错误和未安装 capability 从内部错误 exit `2` 改为用户错误 exit `1`，stderr 不输出 stack；CLI 包测试数从 3 增至 5。
- T142 已完成：`docs/生态/host-compatibility-matrix.md` 新增 Host Compatibility Test Records，记录 custom MCP client 对 `opencap.mcp.tools.v1` 与 `opencap.mcp.result.v1` 的自动化 pass 证据，并为 Claude Desktop/Cursor 保持 `pending-smoke` 记录。记录绑定 2026-05-14、OpenCap commit `0f819cb`、profile、capability、checks、evidence 和 known gaps，明确自动化 helper tests 不等同真实 Host UI smoke。
- T143 已完成：`docs/运营/observability-metrics-v1.md` 新增本地指标命令草案，定义未来 `opencap metrics summary`、`opencap metrics capabilities` 和 `opencap metrics security` 的参数、输出示例、JSON shape、字段来源与隐私边界。文档明确当前已实现入口仍是 `opencap logs` 和 `opencap decision-log export`，metrics 命令尚未实现。
- T154 已完成：`docs/生态/interoperability-profiles.md` 新增 `opencap.host.evidence.v1` 最小字段和边界，`docs/生态/host-compatibility-matrix.md` 新增 custom MCP client tools/result 自动化 evidence records，以及 Claude Desktop/Cursor version-detection + pending-smoke evidence records。记录明确证据类型、来源、隐私边界和限制，不把自动化 adapter 证据或 Host version detection 写成第三方 Host 兼容通过。
- T156 已完成：新增 `rfcs/0010-mcp-elicitation-profile-v1.md`，定义 `opencap.mcp.elicitation.v1` 草案，覆盖 MCP Host capability negotiation、Runtime `ConsentRequest` 到 `elicitation/create` form 的映射、Host response 到 consent receipt 的映射、URL mode future 边界、安全不变量、result/evidence 和测试计划。现有 MCP interface、consent、interoperability 和文档入口已同步链接，且继续保持当前 V1 无 elicitation Host 返回 `confirmation_required`。
- T157 已完成：新增 `rfcs/0011-a2a-agent-card-mapping-v1.md`，定义 `opencap.a2a.agent_card_mapping.v1` 草案，覆盖 A2A Agent Card/AgentSkill 字段映射、OpenCap extension、A2A request 到 Runtime invocation 的边界、Result Envelope 到 A2A task/artifact 的映射、安全不变量、evidence 和测试计划。RFC 明确 OpenCap Capability 不是 Agent，V1 不实现 A2A server，Agent Card/Skill 只用于发现和受控调用入口。
- T163 已完成：新增 `rfcs/0012-remote-runtime-oauth-profile-v1.md`，定义 `opencap.remote_runtime.oauth.v1` 草案，覆盖 Host/client 到 OpenCap Remote Runtime、OpenCap 到 downstream provider、Registry/Admin Plane 三段 OAuth 授权边界，明确 RFC 8707 resource indicators、RFC 9728 protected resource metadata、scope 模型、header-only bearer、token validation evidence 和 token passthrough 禁止。文档明确 V1 仍是 local runtime/env provider，不实现 remote OAuth。
- T271 已完成：新增 `docs/生态/interoperability-evidence-record-schema.md`，定义统一 `opencap.interop.evidence.v1` schema，覆盖 record shape、subject/evidence/result/check 枚举、privacy/redaction 规则、profile 等级映射、compatibility record 关系、示例和迁移要求。`opencap.host.evidence.v1` 已标记为 Host 场景早期 alias，T156/T157/T163 RFC 的 evidence 章节已统一引用该 schema。
- T126 已完成：新增 `docs/releases/release-checklist.md`，把发布前流程整理成确认阶段、检查工作区、运行验证命令、核对通用 hard gates、核对阶段 hard gates、写 release evidence、发布或阻断七步。清单覆盖 v0.1-v1.0，并同步 `release-readiness`、alpha checklist、README、INDEX、SYSTEM 和 traceability。
- T129 已完成：新增 `docs/社区/registry-supply-chain-review.md`，定义 Registry Capability PR 的供应链 review 工作流，覆盖 PR source、package shape、manifest/schema、model-visible metadata、permission/risk/auth、endpoint/data egress、tests/evidence、trust/lifecycle/advisory、merge evidence 和合并后检查，并同步 Registry 指南、Capability review checklist、供应链治理文档、registry README 和文档入口。
- T139 已完成：新增 `.github/workflows/security-baseline.yml`，包含 repository hygiene、workflow permissions audit 和 dependency-review 三个 job，默认只读权限，不使用 `pull_request_target`。`docs/运营/ci-security-baseline.md` 记录当前基线和 CodeQL/OpenSSF Scorecard 后续缺口，`docs/releases/release-checklist.md` 已把 Security Baseline workflow 加入发布前检查项。
- T140 已完成：`docs/社区/registry-guidelines.md` 已新增 Capability 分类章节，明确当前 V1 分类表、`registry/<category>/<capability_id>/` 与 `metadata.category` 一致性、新增分类条件、分类不参与授权和分类迁移影响。`registry/README.md`、Capability review checklist、review/write 教程、文档入口和 traceability 已同步分类入口和 review 规则。
- T141 已完成：`.github/PULL_REQUEST_TEMPLATE.md` 已新增 “Capability Registry PR” 区块，把 Registry 供应链 Review 工作流、能力评审清单、分类一致性、manifest/README/tests、`type: http`、权限/风险/auth/execution、secret 禁止和 `pnpm validate` 纳入 PR 自查；Capability submission issue template、contributor journey、maintainer guide、Registry README 和 review 教程已同步。
- T144 已完成：新增 `rfcs/TEMPLATE.md`，提供 RFC 状态、元数据、设计、安全隐私、兼容迁移、验证计划、发布运维和决策结果模板，且明确示例不得包含 secret/raw data。RFC 流程、design/RFC issue template、README 和 INDEX 已同步模板入口。
- T147 已完成：新增 `rfcs/0013-registry-index-signing-v1.md`，定义 `opencap.registry.index_signing.v1` 草案、index envelope、manifest/index digest、signature metadata、verification evidence、failure semantics、compatibility/migration 和 future implementation tests；Registry distribution、signing/provenance roadmap、README、INDEX 和 SYSTEM 已同步。
- T148 已完成：新增 `docs/运营/npm-trusted-publishing-workflow.md`，定义 GitHub Actions OIDC trusted publishing 草案、`npm-production` environment、manual dispatch + dry-run workflow、tarball review、provenance evidence、长期 token 禁止和 rollback/incident 流程；package publishing、signing roadmap、release checklist、README、INDEX 和 SYSTEM 已同步。
- T151 已完成：新增 `packages/spec/src/package-lint.ts` 和 `package-lint.test.ts`，导出 Capability package lint API，并把 package shape 校验接入 `pnpm validate`。Lint 覆盖 manifest/README/tests、id/category path 一致性、`.env`、`opencap.local/` 和 SQLite/DB 禁止项；Spec 测试数从 45 增至 50。
- T158 已完成：`packages/runtime/src/card.ts` 新增 `createTrustCardFromInstalledCapability()`，从 installed capability 派生 trust/advisory/maintainer/provenance/limitations，并保留 Trust Card disclaimer；`card.test.ts` 新增生成规则和 root export 测试，`docs/生态/trust-model-v1.md` 已补齐字段生成规则和非授权边界。Runtime 测试数从 235 增至 236。
- T185 已完成：新增 `packages/runtime/src/trust-transition.ts` 和 `trust-transition.test.ts`，导出 `evaluateTrustLevelTransition()`，覆盖逐级升级、跳级升级拒绝、High advisory/failing tests 冻结、downgrade/revoke 不授予 policy 权限；`docs/生态/trust-model-v1.md` 已补齐 transition helper 规则。Runtime 测试数从 236 增至 240。
- T186 已完成：新增 `packages/runtime/src/lifecycle-gate.ts` 和 `lifecycle-gate.test.ts`，导出 `evaluateRevokedCapabilityInvokeGate()`，覆盖 revoked 写/高风险 pre-secret deny、revoked read-only ask、read-only explicit override allow、非 revoked 不改变 policy 权限；`docs/生态/capability-deprecation-and-revocation.md` 已补齐 Runtime 行为。Runtime 测试数从 240 增至 244。
- T187 已完成：新增 `packages/spec/schema/capability-advisory.schema.json` 和 `advisory.test.ts`，导出 `validateCapabilityAdvisory()`、file/path helper 和类型；`pnpm validate` 会校验 registry 中已有 advisory 文件，`packages/spec/package.json` 已暴露 advisory schema 公共子路径。Spec 测试数从 50 增至 54。
- T188 已完成：新增 `registry/advisories/OCAP-2026-0001.yml`，将 `http.request_demo` 记录为 revoked metadata；`advisory.test.ts` 已校验 Registry revocation record，`registry/README.md` 和 `docs/生态/capability-deprecation-and-revocation.md` 已同步 metadata 路径和保留规则。Spec 测试数从 54 增至 55。
- T189 已完成：`packages/runtime/src/index.ts` 新增 `checkInstalledCapabilityAdvisories()`，读取本地 installed capabilities 和 Registry advisory metadata，按 capability id 与 affected version 匹配 advisory，并返回 advisory id、severity、status、registry action、runtime default、summary 和 fixed version；`advisory-check.test.ts` 覆盖 `http.request_demo@0.1.0` 命中 `OCAP-2026-0001` revoked metadata，以及无关能力不报告 advisory。Runtime 测试数从 244 增至 246。
- T191 已完成：`manifest.schema.json` 新增可选顶层 `lifecycle` 对象，支持 `deprecated`、`yanked`、`revoked`，要求 `status`、`reason`、`since`，并要求 `revoked` 携带 advisory id；`packages/spec/src/index.ts` 导出 lifecycle metadata 类型，`index.test.ts` 覆盖合法和非法 lifecycle schema。Spec 测试数从 55 增至 57。
- T192 已完成：`packages/runtime/src/index.ts` 新增 `CapabilityLifecycleWarning` 和 `createCapabilityLifecycleWarning()`，install/list/invoke preparation 复用同一 warning shape，`installCapability()` 返回 warnings，`listInstalledCapabilities()` 暴露 manifest lifecycle status 和 `lifecycleWarning`；CLI 非 JSON install/list/invoke 输出会把 warning 写到 stderr。Runtime 测试数从 246 增至 247。
- T193 已完成：`packages/spec/src/index.ts` 新增 `searchRegistryCapabilities()`，默认搜索结果隐藏 yanked/revoked，deprecated 仍可发现，显式 `includeLifecycle` 才返回 yanked/revoked；`registry-search.test.ts` 覆盖默认过滤和显式包含。Spec 测试数从 57 增至 58。
- T194 已完成：新增 `packages/runtime/src/quality-score.ts` 和 `quality-score.test.ts`，导出 `calculateCapabilityQualityScore()` 和 `opencap.quality_score.v1`，按 manifest/docs/tests/security/maintenance/compatibility/evidence 权重计算 total/band，并固定 `policyEffect: none`。Runtime 测试数从 247 增至 249。
- T195 已完成：`TrustCardQualitySummary` 已收紧为完整 `CapabilityQualityScore` 结构；`createTrustCardFromInstalledCapability()` 可接收 `calculateCapabilityQualityScore()` 输出并保留 total/band/dimensions/generatedAt/`policyEffect: none`。带 quality score 的 Trust Card 默认 limitations 会说明质量分只是解释性 evidence，没有 policy effect。Runtime 测试数保持 249。
- T272 已完成：新增 `rfcs/0014-registry-index-cache-sync-v1.md`，定义 future `opencap.registry.index_cache_sync.v1` profile，覆盖 index entry、local cache layout、sync state、sync evidence、install candidate、失败语义和不改变 V1 Git-based 主路径的安全边界。Registry distribution、文档索引、traceability、SYSTEM 和 DECISIONS 已同步入口。
- T274 已完成：`packages/spec/schema/manifest.schema.json` 新增可选 `provenance` 对象，预留 package source/digest/buildType 和 release publisher/provenance/workflow/attestation/transparency log metadata；`policyEffect` 固定为 `none`。`packages/spec/src/index.ts` 导出 package/release provenance 类型，`index.test.ts` 覆盖正向和伪造 policy authority 的负向测试。Spec 测试数从 58 增至 60。
- T116 已完成：新增 `docs/术语表.md`，统一 Capability、Runtime、Registry、policy、audit、Trust Card、Quality Score、provenance、SLSA/Sigstore、MCP、Result Envelope 等高频术语，并在每个定义中强调 evidence 不能替代 policy、consent、audit 或 review 的边界；`docs/README.md` 和 `docs/INDEX.md` 已同步入口、阅读路径和维护规则。
- T128 已完成：新增 `packages/runtime/src/threat-model-abuse-cases.test.ts` 和 `packages/runtime/test/fixtures/conformance/threat-model-abuse-cases.yml`，把 `docs/安全/threat-model.md` 的 AC-001 到 AC-007 转成 Runtime smoke/conformance checks；覆盖 write ask confirmation、URL token egress deny、arbitrary URL metadata block、MCP `confirmation_required`、audit preflight block、policy relaxation ledger 和 breakglass hard boundary。Runtime 测试数从 249 增至 257。
- T138 已完成：新增 `packages/spec/src/privacy-retention-doc-lint.ts` 和 `privacy-retention-doc-lint.test.ts`，从 `@opencap/spec` 导出 `lintPrivacyRetentionDoc()`，检查 privacy retention 文档必须覆盖本地优先、默认不上传遥测、secret 脱敏、`input_hash`、保留策略、手动删除、Host 日志边界和非目标；`docs/安全/privacy-retention-v1.md` 已补充遥测边界。Spec 测试数从 60 增至 62。
- T153 已完成：新增 `packages/spec/src/conformance.ts` 和 `conformance.test.ts`，从 `@opencap/spec` 导出 `CONFORMANCE_SUITE_VERSION`、`CORE_CONFORMANCE_GROUPS` 和 `validateConformanceRecord()`；现有 `policy-governance.yml` 与 `threat-model-abuse-cases.yml` 已作为首批 record fixture 接入校验，缺字段和不安全 artifact path 会返回结构化 finding。Spec 测试数从 62 增至 66。
- T155 已完成：新增 `packages/runtime/src/agentic-abuse-cases.test.ts` 和 `packages/runtime/test/fixtures/conformance/agentic-abuse-cases.yml`，把 `docs/安全/agentic-risk-mapping.md` 的 abuse cases 转成 Runtime smoke/conformance checks；覆盖 prompt injection write confirmation、localhost outbound block、重复调用独立 audit/consent、任意 URL warning、MCP `confirmation_required` 和 oversized output limit。Runtime 测试数从 257 增至 264。
- T162 已完成：新增 `packages/spec/src/credential-lifecycle-doc-lint.ts`、`packages/spec/src/credential-lifecycle-doc-lint.test.ts` 和 `packages/runtime/src/credential-lifecycle.test.ts`，把 `docs/运营/credential-lifecycle.md` 的验收测试转成 runbook lint 和 Runtime smoke；覆盖 env-only 模型、policy/consent/outbound 顺序、轮换不改 manifest、missing env 与 external 401 区分、audit redaction 和 installed list 不展示凭据值。Spec 测试数从 66 增至 68，Runtime 测试数从 264 增至 267。
- T165 已完成：新增 `docs/教程/github-fine-grained-token-setup.md`、`packages/spec/src/github-token-guide-doc-lint.ts` 和 `github-token-guide-doc-lint.test.ts`，把 GitHub 官方 fine-grained PAT/Create issue/API credential 安全建议转成 `github.create_issue` 操作指南和文档 lint；覆盖目标仓库限定、`Issues: write`、过期、组织审批、env-only、轮换撤销和 classic/broad token 警告。Spec 测试数从 68 增至 70。
- T173 已完成：新增 `packages/runtime/test/fixtures/conformance/execution-evidence.yml`，把 `docs/质量/execution-evidence-v1.md` 的测试要求沉淀为 `opencap.execution_evidence.v1` conformance record；覆盖 requestStarted 边界、HTTP response evidence、unknown timeout、retry/idempotency redaction、provider request id/SQLite persistence、Result Envelope output evidence 和 credential redaction。Spec 测试数保持 70。
- T190 已完成：`SECURITY.md` 已补齐 GitHub private vulnerability reporting、敏感材料边界、报告内容、维护者 triage/advisory 流程和启用检查；新增 `packages/spec/src/security-policy-doc-lint.ts` 和 `security-policy-doc-lint.test.ts`，从 `@opencap/spec` 导出 `lintSecurityPolicyDoc()`，防止 private reporting 边界回退。Spec 测试数从 70 增至 72。
- 任务队列已模块化：M0 阻塞和外部依赖、M1 核心契约和 Runtime Kernel、M2 执行安全审计和可靠性、M3 CLI/MCP/Host 互操作、M4 Registry/Trust/Lifecycle/供应链、M5 Conformance/Abuse Cases/隐私/运维、M6 Composition/Capability Graph/Agentic Commerce。
- T070 已解除阻塞并完成；需要继续时建议新增 Host smoke 或下一批 release hardening 任务。

## 自主排期建议

如果要继续 strict `continuous-doc-dev`，下一轮先新增下一批 ready 任务，或补真实 Host smoke evidence 后继续。

当前 next ready task：无。

## Secret Resolver V1 env provider 已实现

T159 已完成。新增 `packages/runtime/src/secret-resolver.ts` 和 `secret-resolver.test.ts`。V1 resolver 只支持 env provider，支持 `auth.type: none`、`api_key` bearer/header placement、dry-run 不读取 env value、execute 模式 missing env 结构化错误、query/body placement 拒绝和 forbidden header 检查。HTTP executor 已通过 `resolveEnvCredential()` 获取 executor-private header application，credential 对象自身不包含可 JSON 序列化的 secret 原文。

## Credential audit evidence 已实现

T164 已完成。`AuditEvent`、`InMemoryAuditLogger` 和 `SqliteAuditLogger` 已支持 credential provider/source/env name/placement/resolved/redacted summary。HTTP executor 成功执行时会写入 credential evidence；SQLite `invocations` 表新增 credential columns 并在 `recent()` 查询中恢复。审计事件不保存 env var value、Authorization header value 或 provider secret 原文。

## Auth placement schema 和 executor 映射已实现

T130 已完成。`packages/spec/schema/manifest.schema.json` 现在要求 `api_key` 显式声明 `provider`、`env` 和 `placement`，`header` placement 必须声明 `name`，query/body secret placement 在 schema 层被拒绝。`github.search_repo` 和 `vercel.get_deployments` registry manifest 已补齐 bearer placement。Runtime custom header placement 测试会断言 `credentialPlacement: named_header`、env source/name 和 redacted summary，确保 executor 映射可审计且不泄露 secret 原文。

## Runtime domain public contract 已实现

T124 已完成。新增 `packages/runtime/src/domain.ts` 和 `domain.test.ts`，导出 `RuntimeKernel`、`RuntimeContext`、`CapabilityIdentity`、`InstalledCapabilityRecord`、`InvocationRequestV1`、`InvocationPlanV1`、`GateDecision`、`ConsentRequest`、`ConsentReceipt`、`RuntimeErrorV1`、`RuntimeResultEnvelope`、`AuditWriteResult` 等 Runtime public contract 类型。`createRuntimeRequestId()` 提供稳定 `req_` 前缀 request id，`createDryRunEnvelope()` 提供不解析 secret、不执行外部请求的最小 dry-run envelope helper。

## Package public exports 已定义

T145 已完成。`@opencap/spec`、`@opencap/runtime`、`@opencap/mcp` 和 `@opencap/sdk` 已声明 root package export map，`types` 指向 `./dist/index.d.ts`，`import` 指向 `./dist/index.js`。`@opencap/spec` 额外公开 `./schema/manifest.schema.json` 和 `./schema/registry-test.schema.json`；所有 package 只额外公开 `./package.json`，不公开 `./src/*` 或 `./dist/*` 内部路径。`@opencap/cli` 保持 bin-only public surface。

## Runtime Gate public contract 已实现

T268 已完成。`packages/runtime/src/domain.ts` 现在导出 `RuntimeGate`、`RuntimeGateId`、`GateDecisionSemantics`、`GateDecisionInput`、`createGateDecision()` 和 `gateDecisionSemantics()`；`GateDecisionKind` 覆盖 `allow`、`ask`、`deny`、`block` 和 `redact`，与 policy trace decision 对齐。`createGateDecision()` 对 `block` 默认 hard boundary，其他决策默认非 hard boundary；`gateDecisionSemantics()` 固定 secret resolution、execution、confirmation、transformed input 和 terminal status 语义。`packages/runtime/src/gate.test.ts` 覆盖 3 个 contract 测试。

## Runtime Ledger storage contract 已实现

T269 已完成。新增 `packages/runtime/src/ledger.ts` 和 `ledger.test.ts`，导出 `LEDGER_RECORD_VERSION`、`createLedgerRecordId()`、`CapabilityLedgerRecordV1`、`PolicyLedgerRecordV1`、`InvocationLedgerRecordV1`、`CompatibilityLedgerRecordV1`、四类 store interface 和聚合 `RuntimeLedgerStore`。Ledger contract 固定 append-only 语义、record id 前缀、最小查询键和不保存 manifest/policy/input/output/secret 原文的边界；`packages/runtime/src/index.ts` 已从 public root entrypoint 导出 helper 和类型。Runtime 测试数从 173 增至 177。

## Runtime Card schema contract 已实现

T270 已完成。新增 `packages/runtime/src/card.ts` 和 `card.test.ts`，导出 `CARD_SCHEMA_VERSION`、`createCardId()`、`CapabilityCardDocumentV1`、`TrustCardDocumentV1`、`ConsentCardDocumentV1`、`CompatibilityCardDocumentV1` 以及四个纯生成 helper。Capability Card 从 `InstalledCapabilityRecord` 生成，Trust Card 固定 evidence summary/disclaimer，Consent Card 从 `ConsentRequest` 生成并标记 runtime-generated，Compatibility Card 从 compatibility ledger record 生成 known gaps；`packages/runtime/src/index.ts` 已从 public root entrypoint 导出 helper 和类型。Runtime 测试数从 177 增至 183。

## Capability identity contract 已实现

T273 已完成。新增 `packages/runtime/src/identity.ts` 和 `identity.test.ts`，导出 `CAPABILITY_IDENTITY_VERSION`、`createCapabilityIdentity()`、`createCapabilityIdentityRef()`、`capabilityIdentityKey()`、`validateCapabilityIdentity()` 和 `capabilityLifecycleSemantics()`。Identity contract 固定 `id + version + manifestDigest` 为 audit identity，`packageDigest` 和 `registryCommit` 为 provenance，local path 不参与 identity digest，lifecycle 不改变 identity digest；revoked/yanked/deprecated 保持可寻址并有默认 install/execution/warning/hard block 语义。Runtime 测试数从 183 增至 188。

## Capability authoring loop 已实现

T275 已完成。新增 `packages/spec/src/authoring.ts` 和 `authoring.test.ts`，导出 `CAPABILITY_AUTHORING_LOOP_VERSION`、`getCapabilityAuthoringLintOrder()`、`getCapabilityAuthoringStage()`、`evaluateCapabilityAuthoringProgress()`、`validateCapabilityAuthoringManifest()` 和 `validateCapabilityAuthoringManifestPath()`。Lint 顺序固定为 manifest schema -> package shape -> model-visible metadata -> least-privilege/risk -> secret hygiene -> registry tests -> dry-run -> review-ready；`packages/spec/src/validate-registry.ts` 已改用 authoring manifest validation，让 `pnpm validate` 在 schema 之后执行 model-visible metadata lint。Spec 测试数从 25 增至 32。

## Release maturity gate matrix 已定义

T276 已完成。`docs/运营/release-readiness.md` 现在定义 v0.1 Local Runtime、v0.2 Evidence Registry、v0.3 Interop Profiles、v0.4 Adapter Layer、v0.5 Policy Operations 和 v1.0 Capability Network 的 maturity gate matrix。每个阶段都有发布承诺、hard gates、证据来源、允许缺口和不得宣称项；`docs/releases/alpha-checklist.md`、`docs/规范/versioning-and-compatibility.md`、`docs/README.md`、`docs/INDEX.md` 和 `docs/SYSTEM.md` 已同步入口和兼容口径。

## execution.body.fields 渲染边界已补齐

T131 已完成。`packages/runtime/src/index.test.ts` 新增 body fields 回归测试，覆盖 full-template JSON 类型保留、静态 JSON value 保留、未引用 input 不外发、必填 body full-template 缺失时抛出 `URL_TEMPLATE_FIELD_MISSING`，以及可选 full-template 缺失时省略字段。`packages/runtime/src/index.ts` 新增 manifest `input.required` 读取逻辑，用于 dry-run 和 executor 共享的 body 渲染；Runtime 测试数从 188 增至 189。

## Data Egress Policy Gate 已实现

T236 已完成。新增 `packages/runtime/src/data-egress-policy.ts`，提供 `defaultDataEgressPolicy()` 和 `evaluateDataEgressPolicy()`；默认规则覆盖 `secret_like` deny、`internal_url` deny、`pii/source_code` 到 `external_send` ask，返回 `stage: pre_secret`、`reasonCode`、`matchedRuleId`、`secretResolutionAllowed`、`executionAllowed` 和脱敏 evidence。新增 `packages/runtime/src/data-egress-policy.test.ts`，覆盖 13 个测试，确保 egress deny 不解析 secret、不执行，并覆盖 private IP、metadata service、`.env` secret assignment、stack trace 和 source diff 外发边界。

## Egress decision audit fields 已实现

T237 已完成。`AuditEvent`、`InMemoryAuditLogger` 和 `SqliteAuditLogger` 已记录 egress decision、data classes、target origin、matched rule、redacted preview 和 `requestStarted=false`。新增 `createDataEgressAuditEvent` 和 `recordDataEgressDecision`，SQLite `invocations` 表会持久化 egress 字段并补齐既有数据库缺失列。Runtime 测试数从 104 增至 107。

## Confirmation egress summary 已实现

T238 已完成。新增 `ConfirmationEgressSummary`、`ConfirmationRequest.egress` 和 `confirmationSummaryFromDataEgress`；CLI confirmation prompt 现在展示 target origin、data classes、fields sent 和 redacted preview，MCP no-elicitation 的 `confirmation_required` reason 也携带同一份外发摘要。Runtime 测试数从 107 增至 108。

## Input provenance audit evidence 已实现

T239 已完成。新增 `InputProvenanceEvidence`、`InputProvenanceSource` 和 `createInputProvenanceEvidence`，支持 `user_supplied`、`model_generated`、`tool_derived`、`runtime_generated` 四种来源；`tool_derived` 可记录 `derivedFromInvocationId`。`AuditEvent.inputProvenance` 会持久化为 SQLite `input_provenance_json` 并查询恢复，evidence 只含 hash、来源、派生 id、egress decision 和 transformations，不含 input 原文。Runtime 测试数从 108 增至 111。

## Field-level egress map 已实现

T240 已完成。新增 `packages/runtime/src/egress-map.ts`，导出 `buildFieldLevelEgressMap`；HTTP URL 模板会映射到 `url`/`query` destination，`execution.body.fields` 会映射到 `body` destination，未引用字段不会进入 map。字段记录只包含 path、destination、data classes 和 redacted 状态，不包含字段值。Runtime 测试数从 111 增至 113。

## Derived input evidence chain 已补齐

T241 已完成。`InputProvenanceEvidence` 新增 `sourceResultDigest`，`createInputProvenanceEvidence` 可从 `sourceResult` 计算稳定 digest，但不会保存 source result 原文；`tool_derived` input 同时记录 `derivedFromInvocationId`。多步执行边界文档已明确派生 input 不能继承上游授权，仍需重新分类、重新生成 egress map 并经过 Data Egress Policy Gate。

## Input minimization 已实现

T242 已完成。新增 `packages/runtime/src/input-minimization.ts`，导出 `minimizeInputByEgressMap`；Runtime 可根据 field-level egress map 生成最小化 input，未引用字段不会进入结果，不会自动把整个 input 当作 body，缺失 optional 字段会被省略。Runtime 测试数从 113 增至 116。

## Redacted egress preview 已实现

T243 已完成。新增 `packages/runtime/src/egress-preview.ts`，导出 `buildRedactedEgressPreview`；preview 包含 target origin、fields sent、data classes 和 redacted input。secret-like/source/internal/financial 使用硬脱敏，PII 局部遮蔽，free_text_unknown/大段文本摘要化。Runtime 测试数从 116 增至 117。

## Dry-run egress preview 已接入

T244 已完成。`buildHttpDryRunPlan` 现在生成 `egressPreview`，并把 target origin、fields sent、data classes 和 redacted input 放入 Result Envelope。CLI `opencap invoke --dry-run` 的人类输出会展示 egress preview；dry-run 审计事件记录 `requestStarted=false`、`egressTargetOrigin`、`egressDataClasses` 和 `egressRedactedPreviewJson`，不读取 secret 原值、不发送请求。Runtime 测试数保持 117，CLI smoke test 继续覆盖 1 个端到端测试。

## Internal URL/source/config egress negative tests 已补齐

T245 已完成。`packages/runtime/src/data-egress-policy.test.ts` 现在用真实 input classification 和 field-level egress map 生成 policy context，覆盖 private IP URL query、metadata service URL body、`.env`/config secret assignment、stack trace 和 source diff。Runtime 测试数从 117 增至 122。

## Manifest Data Class Hint RFC 已新增

T246 已完成。新增 `rfcs/0007-manifest-data-class-hint-v1.md`，定义 input schema `x-opencap-data-class` 扩展、合并语义、review/lint 边界和 JSON Schema 兼容策略。`docs/安全/data-classification-v1.md` 已同步，明确 hint 只能增加透明度，不能降低 classifier finding 或绕过 policy/consent/audit。

## Organization Data Policy RFC 已新增

T247 已完成。新增 `rfcs/0008-organization-data-policy-v1.md`，定义组织级 data egress policy、provider allowlist、metadata-only DLP provider profile 和 local-first 边界。`docs/设计/data-egress-policy-v1.md` 已同步，明确组织策略不能放宽内置 safety floor、用户确认、secret boundary、outbound policy 或 audit；外部 DLP 默认不接收 input 原文。

## Policy Decision Trace runtime 已实现

T249 已完成。新增 `packages/runtime/src/policy-trace.ts`，risk policy 与 data egress gate 都会生成 `PolicyDecisionTraceV1`，包含 policySetId、policyRevision、gate、decision、matchedRuleId、reasonCode、defaultDecisionUsed、evaluatedFacts、secretResolutionAllowed 和 executionAllowed。`AuditEvent.policyTrace` 已接入内存审计和 SQLite `policy_trace_json` 持久化；trace 不保存 input 原文或 secret value。Runtime 测试数从 122 增至 125。

## Policy Explain CLI 已实现

T250 已完成。`opencap invoke --dry-run --explain` 会在非 JSON 输出中追加 policy explain 摘要，展示 final decision、blocking gate、matched rule、reason code、policy revision、secret/execution 状态和脱敏 evaluated facts。CLI smoke test 已覆盖 explain 输出不包含敏感 input 原文。

## Policy Change Ledger 已实现

T251 已完成。新增 `packages/runtime/src/policy-ledger.ts`，导出 `FilePolicyLedger`，支持 activation、rollback 和 failed_activation 记录。Rollback 只是重新激活旧 revision 并追加新记录，failed activation 不覆盖当前 active policy。Ledger 只保存 revision、digest、reason 和 diff summary，基础脱敏后不保存 policy 原文、secret 或 input 原文。Runtime 测试数从 125 增至 129。

## Policy Validate Lint 已实现

T252 已完成。新增 `packages/runtime/src/policy-validator.ts`，导出 `validatePolicyYml`，可返回非法 decision/risk、未知字段、重复 rule id 和未命名高风险 allow 的结构化 finding。CLI 新增 `opencap policy validate <path>` 和 `--json` 输出；普通输出包含 file path、field path 和 rule id。Runtime 测试数从 129 增至 132，CLI smoke 继续覆盖 1 个端到端测试。


## Policy Simulation/Diff 已实现

T253 已完成。新增 `packages/runtime/src/policy-simulation.ts`，导出 `simulatePolicyDiff` 和 report/finding/scenario 类型；支持 `policyBefore`、`policyAfter` 与 scenario fixture，识别 `new_allow`、`new_deny`、`ask_to_allow`、`deny_to_ask`、`data_egress_relaxed` 和 `financial_relaxed`。CLI 新增 `opencap policy simulate --before <path> --after <path> --scenarios <path> [--json]`，报告只包含 scenario/capability/risk/decision/data class/target origin，不包含 input 原文。Runtime 测试数从 132 增至 135，CLI smoke 已覆盖 policy simulate。


## Broad Allow Safety Checks 已实现

T254 已完成。`validatePolicyYml` 新增 `POLICY_BROAD_ALLOW_HIGH_RISK` warning 和 `POLICY_BROAD_ALLOW_REQUIRES_BOUNDARY` error；`write` broad allow 缺少 `capability_id`/`resource` 会被标记，`external_send`、`destructive`、`financial` allow 必须限定 `capability_id`、`resource` 和 `action`。`simulatePolicyDiff` 新增 `broad_data_egress_allow` error，覆盖 `secret_like`、`pii`、`source_code` 通过 broad allow 外发的场景。Runtime 测试数从 135 增至 138。


## Policy Override/Breakglass Controls、Policy Simulation Fixtures 和 Policy Incident Runbook 和 Decision Log Export 和 Policy Governance Conformance Tests 已实现

T255 已完成。新增 `packages/runtime/src/policy-override.ts`，支持 `allow_once`、`allow_until`、`deny_override` 和 `breakglass` record；expired override 不生效，breakglass 必须有 reason 且 15 分钟内过期。Override 结果写入 `decisionTrace`/`policyTrace` 和 audit event；allow/breakglass 不能覆盖 data egress deny、outbound block、revoked/malicious capability 或 financial explicit confirmation。Runtime 测试数从 138 增至 143。


## Policy Simulation Fixtures 已补齐

T257 已完成。新增 `packages/runtime/test/fixtures/policies/baseline-ask.yml`、`scoped-allow.yml`、`broad-allow-after.yml` 和 `packages/runtime/test/fixtures/policy-scenarios/governance.yml`。Fixture 覆盖 read_only、write、external_send、destructive、financial，覆盖 pii、secret_like、source_code、internal_url，并包含 trustLevel、lifecycle、advisoryStatus 事实。新增 `policy-fixtures.test.ts` 校验 fixture 无真实敏感值。Runtime 测试数从 143 增至 145。


## Policy Incident Runbook 和 Decision Log Export 和 Policy Governance Conformance Tests 已新增

T258 已完成。新增 `docs/运营/policy-incident-runbook.md`，覆盖策略误放开、override 滥用、能力滥用和紧急阻断时的分级、撤销 override、激活 deny policy、审查 audit、rollback policy、breakglass 允许/禁止矩阵，以及 advisory/revocation 联动。`docs/安全/policy-override-and-breakglass-v1.md`、`docs/README.md` 和 `docs/INDEX.md` 已加入入口或互链。


## Decision Log Export 和 Policy Governance Conformance Tests 已实现

T259 已完成。新增 `packages/runtime/src/decision-log.ts`，导出 `exportDecisionLogRecords`；`SqliteAuditLogger.recent()` 支持 `policyDecision` 和 `until` 过滤。CLI 新增 `opencap decision-log export`，支持按 capability、decision、since/until 和 limit 导出脱敏 policy decision summary。导出记录包含 invocation id、policy revision 和 trace id，不包含 input 原文、secret-like value、token、provider raw body 或 redacted preview 原文。Runtime 测试数从 145 增至 147，CLI smoke 已覆盖导出命令。


## Policy Governance Conformance Tests 已实现

T260 已完成。新增 `packages/runtime/src/policy-governance-conformance.test.ts` 和 `packages/runtime/test/fixtures/conformance/policy-governance.yml`。C-PG 组覆盖 decision trace redaction、policy change ledger、broad allow simulation、breakglass hard boundary 和 audit redaction export。Runtime 测试数从 147 增至 153。

## 已知风险

- `serve` 仍是骨架命令。
- `opencap invoke` 已接入 dry-run、真实 HTTP 执行和 Result Envelope 输出。
- MCP server 尚未实现。

## MCP confirmation_required 结果格式已稳定

T073 已完成。MCP `tools/call` 在 policy decision 为 `ask` 且当前 V1 无 MCP elicitation 通道时，会返回稳定 tool result：`isError: true`、固定 content 文案、`structuredContent.error.code = CONFIRMATION_REQUIRED`，以及包含 `capabilityId`、`policyDecision`、`retry.token = null` 和 retry hint 的 metadata。该路径不会执行 Capability，并会写入 blocked confirmation audit。

## MCP Host 手动测试指南已新增

T074 已完成。新增 `docs/教程/connect-mcp-host.md`，覆盖 Claude Desktop、Claude Code、Cursor 和通用 MCP stdio 配置；说明 `tools/list`、`tools/call` allow/deny/confirmation_required 的手动验证期望；明确当前 `opencap serve --mcp` 仍是骨架、V1 不生成 confirmation token，并给出 state dir、policy、manifest、stdout 和审计日志排障清单。文档入口已同步到 `docs/README.md` 和 `docs/INDEX.md`。

## Registry manifest CI 已接入

T080 已完成。`.github/workflows/validate.yml` 现在在 push 到 `main` 和 pull_request 时运行；`registry-manifest-validation` job 使用 Node 22、pnpm 9.15.0、`pnpm install --frozen-lockfile` 和 `pnpm validate` 校验 registry manifests 与 registry tests。workflow 不需要外部 secret，并保留 `workspace-tests` job 运行 `pnpm test`。`docs/TESTING.md` 已补充 CI 校验说明。

## Capability PR 评审指南已新增

T081 已完成。新增 `docs/教程/review-a-capability.md`，作为维护者操作指南，覆盖评审结论分类、manifest 和真实行为一致性、权限最小化、风险等级、外部端点、auth/secret、model-visible 文本、README、registry tests、trust level、阻止合并项和 follow-up 项。`docs/README.md` 和 `docs/INDEX.md` 已加入入口。

## Registry README 已补齐

T082 已完成。新增 `registry/README.md`，说明 Registry 目录结构、当前分类、Capability 条目要求、trust level、新条目默认 `experimental`、提交流程、安全边界和维护者评审入口。文档明确 Registry 不接收真实 secret、私有数据、绕过安全边界的能力或未标记 unsafe-by-default 的任意 URL 能力。

## GitHub Issue/PR templates 已补齐

T083 已完成。`.github/ISSUE_TEMPLATE/` 现在包含 bug report、feature request、capability submission 和 technical design proposal；PR template 覆盖验证、文档同步和安全影响。Capability 提交模板明确只填写 env var 名称，不填写真实 token 或密钥；安全政策 contact link 已修正为 GitHub security policy URL。

## slack.send_message 示例 Capability 已新增

T084 已完成。新增 `registry/developer-tools/slack.send_message/`，包含 manifest、README 和 `tests/basic.yml`。该示例覆盖 `external_send` 风险、Slack `chat.postMessage` 固定 URL、`SLACK_BOT_TOKEN` env bearer auth 和 dry-run fixture，不包含真实 secret、私有 URL 或生产用户数据。

## token passthrough 禁止测试已补齐

T090 已完成。Runtime 现有实现只从 manifest `auth.env` 对应环境变量读取 API key，不读取普通 input 作为凭据。新增测试覆盖 env 缺失时，即使 input 包含 `token`、`api_key`、`Authorization` 也返回 `SECRET_MISSING` 且不会发起 HTTP 请求；audit log 会脱敏 authorization 类 input 字段，不记录 input token 原值。

## 最小 outbound policy 设计已补强

T091 已完成。`docs/安全/outbound-policy-v1.md` 已新增默认决策表、Runtime gate 入口、dry-run 和真实执行行为、最小实现任务和测试计划。设计明确 fixed HTTPS origin 默认允许，arbitrary URL 真实执行默认阻断或需要显式 allow，localhost/private network/metadata service/non-https/redirect 到阻断目标均为硬 block，且 outbound gate 必须在 Secret Resolver 前执行。

## 审计日志隐私分级已补齐

T092 已完成。`docs/设计/audit-log-v1.md` 已新增 `public_metadata`、`operational_metadata`、`redacted_user_data`、`never_record_secret` 四级隐私分级；定义字段隐私表、默认 redaction 规则、debug/diagnostic 模式边界，以及 env var value、Authorization、Cookie、password、private key、OAuth refresh token 永不记录原文的硬约束。

## 威胁模型矩阵已补强

T093 已完成。`docs/安全/threat-model.md` 已新增威胁状态标记和重点威胁矩阵，覆盖 SSRF、secret leakage、malicious capability、prompt injection via tool description、confused deputy、overbroad capability、silent policy relaxation 和 audit privacy overcollection，并把现有控制和待补控制映射到 permission policy、confirmation、audit redaction、outbound policy、registry review、metadata lint、policy simulation/diff 等路径。

## pnpm workspace 全量验证已通过

T100 已完成。当前 conda 环境下 `pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate` 均通过；T235 后测试统计为 spec 20 个、cli 1 个、runtime 96 个、mcp 18 个。`pnpm validate` 当前覆盖 5 个 registry manifest 和 5 个 registry test。`node:sqlite` ExperimentalWarning 仍是已知环境提示。

## Oversized result handling 已实现

T225 已完成。Runtime sanitizer 现在支持 `maxStructuredBytes`，超过限制的结构化 provider result 会替换为 `[TRUNCATED_RESULT]` 并记录 `CONTENT_TRUNCATED`；超长 provider text 会按 `maxTextLength` 截断，MCP `content[].text` 仍只使用 Runtime-generated summary。新增 `packages/runtime/src/result-limits.test.ts` 覆盖大 JSON、大文本，以及 secret redaction 与 size limit 同时发生的证据顺序。

本轮针对性验证：

- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`

下一步推荐：T226 P2：Host result compatibility records。

## Host result compatibility records 已补齐

T226 已完成。`docs/生态/host-compatibility-matrix.md` 新增 Tool Result 字段兼容性记录，按 Claude Desktop 1.3561.0、Cursor 3.3.16 和自定义 MCP client 记录 `structuredContent`、`content[].text`、`isError`、`outputSchema` 的行为、状态和证据；`docs/生态/result-delivery-boundary.md` 新增安全边界声明，明确 Host compatibility record 是互操作证据，不是安全授权证据。

本轮针对性验证：

- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T227 P2：Output selector RFC。

## Output Selector RFC 已新增

T227 已完成。新增 `rfcs/0005-output-selector-v1.md`，定义 `output_mapping`、受限 selector 语法、只读 provider JSON body 的输入域、secret-like path 拒绝、missing required output 失败语义、schema validation 顺序和 selector evidence；`docs/质量/output-validation-v1.md` 已同步 Output Selector V1 到输出流水线和测试要求。

本轮针对性验证：

- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T228 P2：Resource delivery profile RFC。

## Resource Delivery Profile RFC 已新增

T228 已完成。新增 `rfcs/0006-resource-delivery-profile-v1.md`，定义 large result 默认 summary + handle、resource handle 不是授权、resource read 重新经过 policy/data egress/sanitizer/size/media/audit gate、embedded resource 默认关闭和 resource delivery evidence；`docs/生态/result-delivery-boundary.md` 已同步 Resource Delivery Profile V1。

本轮针对性验证：

- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T229 P1：Result sanitizer negative fixtures。

## Result sanitizer negative fixtures 已补齐

T229 已完成。新增 `packages/runtime/fixtures/result-sanitizer/`，包含 indirect prompt injection、secret leakage、HTML/script/comment 和 oversized output 四个 JSON negative fixtures；`packages/runtime/src/result-sanitizer.test.ts` 会自动加载这些 fixtures，断言 sanitized value、finding code/path 和 forbidden raw text。Runtime 测试数从 81 增至 85。

本轮针对性验证：

- `pnpm --filter @opencap/runtime test -- result-sanitizer.test.ts`
- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`
- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T230 P2：Taint label tests。

## Taint label tests 已补齐

T230 已完成。Result provenance 现在递归标记 provider 字段级 `provider_untrusted`，并为 Runtime-generated `textSummary` 记录 `/textSummary: runtime_generated`；redacted/sanitized 字段继续在对应路径追加 `secret_redacted` 或 `sanitized_text`。Runtime 测试数从 85 增至 86。

本轮针对性验证：

- `pnpm --filter @opencap/runtime test -- result-provenance.test.ts`
- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`
- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T231 P1：CLI result envelope output。

## CLI result envelope output 已实现

T231 已完成。`opencap invoke` 现在输出 Result Envelope 子集：默认人类输出只显示 Runtime-generated summary、status、warnings；`--json` 输出结构化 envelope 且默认不含 evidence；`--verbose` 才追加脱敏 evidence。CLI smoke 覆盖 dry-run JSON、人类输出、secret missing verbose JSON 和 logs，验证 input secret 不进入输出。

本轮针对性验证：

- `pnpm --filter @opencap/runtime build`
- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T232 P2：Result Envelope public type exports。

## Result Envelope public type exports 已明确

T232 已完成。Result Envelope V1 公共类型当前由 `@opencap/runtime` 导出，暂不拆独立 contracts package；CLI/MCP adapter 必须 import runtime 类型，不复制本地接口。`docs/规范/versioning-and-compatibility.md` 已记录 `envelopeVersion`、兼容/破坏性变化规则和未来 `@opencap/contracts` re-export 过渡要求，`docs/设计/result-envelope-v1.md` 已补充公共导出边界。

本轮针对性验证：

- `pnpm --filter @opencap/runtime build`
- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T234 P1：实现 input classification engine。

## Input classification engine 已实现

T234 已完成。新增 `packages/runtime/src/input-classifier.ts`，导出 `classifyInput`，可识别 `secret_like`、`pii`、`internal_url`、`source_code`、`financial_data` 和 `free_text_unknown`，并返回字段级 findings、聚合 dataClasses 和 redactedPreview。Runtime 测试数从 86 增至 91。

本轮针对性验证：

- `pnpm --filter @opencap/runtime test -- input-classifier.test.ts`
- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`
- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T235 P1：补充 sensitive input classification fixtures。

## Sensitive input classification fixtures 已补齐

T235 已完成。新增 `packages/runtime/fixtures/input-classification/`，包含 secret-like、PII、internal URL、source/config 和 large free text unknown 五个 JSON fixtures；`input-classifier.test.ts` 自动加载 fixtures 并验证 expected data classes、field findings 和 redacted preview 不含敏感原文。Runtime 测试数从 91 增至 96。

本轮针对性验证：

- `pnpm --filter @opencap/runtime test -- input-classifier.test.ts`
- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`
- `git diff --check`
- `check_docs.py`
- `next_task.py`（当前返回 `Mode: Blocked`，无 ready task）

下一步推荐：T236 P1：实现 Data Egress Policy Gate。

## 下一步建议

1. 实现 T237：记录 egress decision audit fields。
2. 新增或更新中文版本策略文档，说明 package、manifest schema、registry compatibility 和 alpha/beta/1.0 兼容口径。
3. 明确 `0.x` breaking change 记录方式，以及 manifest schema 与 registry entry 的兼容关系。
4. 完成后跑 `check_docs.py` 和 `git diff --check`。

## CHANGELOG 已知缺口已校准

T121 已完成。`CHANGELOG.md` 已更新已知缺口，明确完整 `opencap serve --mcp` server、Console、Cloud/团队能力、完整 OAuth flow、SDK/adapters、Registry signing、outbound policy 私网阻断和 CLI snapshot tests 仍未完成；已知缺口与 README、HANDOFF 和 alpha checklist 保持一致，不再把 install/list/invoke/logs 写成骨架。

## Alpha Release Checklist 已新增

T120 已完成。新增 `docs/releases/alpha-checklist.md`，覆盖 alpha 发布口径、功能/测试/文档/安全/Registry 阻断项、可后续跟进项和发布前操作；清单明确完整 MCP server、Console、Cloud、OAuth、签名和 provenance 不是当前 alpha 已完成能力。`docs/README.md` 与 `docs/INDEX.md` 已增加入口。

## V1 Runtime 主路径架构图已补齐

T114 已完成。`docs/ARCHITECTURE.md` 新增 Mermaid V1 Runtime 主路径图，体现 CLI、Runtime Core、Capability Loader、Policy Engine、Confirmation Handler、Secret Resolver、HTTP Executor、Audit Logger、Local State 和外部 API 的关系；图下注明完整 `opencap serve --mcp` server 仍未实现，避免把 MCP helper 误写成已完成 server 能力。

## 第一次贡献教程已新增

T113 已完成。新增 `docs/教程/first-contribution.md`，覆盖环境准备、任务选择、最小实现、验证、文档同步、提交推送和 Capability 贡献路径；教程链接到贡献指南、TASKS、TESTING、HANDOFF、WORKFLOW 和开发环境。`docs/README.md` 与 `docs/INDEX.md` 已增加入口。

## README 快速开始已同步真实命令

T112 已完成。README 的快速开始已从概念命令改为当前真实可运行的 CLI 闭环：`validate`、`install`、`list`、`invoke --dry-run` 和 `logs`，并使用临时 `--state-dir` 避免污染真实 `opencap.local/`。README 同时明确 `serve --mcp` 当前仍是骨架入口，MCP helper 已存在但完整 MCP server 尚未实现。

## 单元测试基础设施现状已文档化

T102 已完成。`docs/TESTING.md` 已记录当前根目录 `pnpm test` 通过 `pnpm -r test` 运行 workspace 中声明测试脚本的包；现有单元测试覆盖 `@opencap/spec` 的 manifest validator 和 registry test schema、`@opencap/runtime` 的 state dir/install/list/load/policy/confirmation/audit/redaction/HTTP 执行路径，以及 `@opencap/mcp` 的 tool mapping、tools/list 和 tools/call routing。CLI 独立 command snapshot、stdout/stderr 和 exit code 测试仍作为 T134/T137 后续缺口。

## HTTP dry-run executor 已实现

T051 已完成。Runtime 现在导出 `buildHttpDryRunPlan`，可根据 HTTP Capability manifest 和输入生成 method、resolved URL、JSON body、auth mode 与风险摘要；dry-run 不读取 secret 原值、不发送网络请求；传入 audit logger 时会写入 `dry_run` 审计事件，并保存 input hash 与脱敏输入。CLI 日志筛选已接受 `dry_run` 状态。

本轮针对性验证：

- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`

下一步推荐：T052 P0：实现 HTTP executor。

## HTTP executor 已实现

T052 已完成。Runtime 现在导出 `executeHttpCapability`，可基于 HTTP manifest 发送真实请求，支持 JSON body、bearer/header API key placement、timeout、缺凭据、网络错误、HTTP 非 2xx 结构化结果，以及 2xx JSON/text 归一化。执行事件会写入 audit log，并持久化 `resolvedUrl` evidence；secret 只从 env 读取，不进入审计事件。

本轮针对性验证：

- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`

下一步推荐：T053 P1：定义 HTTP request body manifest 字段。

## HTTP body manifest 字段已定义

T053 已完成。`manifest.schema.json` 现在明确要求 `execution.body.type: json` 和 `execution.body.fields`，且 body 字段值必须是 JSON 值；spec 测试覆盖合法映射、缺少 fields 和非 JSON 映射。中文 Capability Manifest 文档已补充完整变量保留类型、字符串插值、可选完整变量缺失时省略字段，以及 Runtime 不默认外发完整 input 的规则。

本轮针对性验证：

- `pnpm --filter @opencap/spec test`

下一步推荐：T054 P1：实现 output normalization。

## Output normalization 已实现

T054 已完成。Runtime 现在导出 `normalizeHttpResponse`，会把 HTTP 响应归一化为 JSON、text 或 empty，并保留 status code、content type 和 body kind。`executeHttpCapability` 已复用该路径，HTTP 非 2xx 错误继续返回脱敏响应摘要。

本轮针对性验证：

- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`

下一步推荐：T055 P1：处理 arbitrary URL Capability 风险。

## Arbitrary URL 风险处理已实现

T055 已完成。`http.request_demo` 已显式声明 `metadata.network_access: arbitrary_url` 和 `metadata.unsafe_by_default: true`；schema 已支持这组风险 metadata。Runtime 现在导出 `detectArbitraryUrlCapability` 和 `capabilityRiskWarnings`，可检测 `url: "{{url}}"` 这类完整用户输入 URL 模板，并在 dry-run plan 中返回 `arbitrary_url` warning。中文 outbound policy 文档已补充 SSRF、metadata service 和 private network 风险说明。

本轮针对性验证：

- `pnpm --filter @opencap/spec test`
- `pnpm --filter @opencap/runtime test`

下一步推荐：T060 P0：实现 `opencap invoke <id> --dry-run`。

## CLI invoke dry-run 已实现

T060 已完成。`opencap invoke <id> --dry-run` 现在会从 installed capabilities 读取 manifest，支持 `--input <file>` 和 `--input-json <json>`，评估 policy，生成 HTTP dry-run plan，并写入 SQLite `dry_run` 审计事件。已用临时 state dir smoke 覆盖安装、inline JSON、文件输入和 `opencap logs --status dry_run` 查询。

本轮针对性验证：

- `pnpm --filter @opencap/cli build`
- `opencap invoke github.create_issue --dry-run --input-json ...` smoke
- `opencap invoke github.create_issue --dry-run --input ...` smoke
- `opencap logs --status dry_run --json` smoke

下一步推荐：T061 P1：实现真实 `opencap invoke`。

## 真实 CLI invoke 已实现

T061 已完成。`opencap invoke <id>` 现在会评估 policy、调用 CLI Confirmation Handler，并在批准后进入真实 HTTP executor；新增 `--yes` 和 `--json`。write 操作默认 ask，read_only 可在 policy allow 下自动执行，secret 缺失会返回 `SECRET_MISSING` 结构化结果并设置非零 exit code。完整 URL 模板 `url: "{{url}}"` 已修复为保留原始 URL，避免 arbitrary URL capability 被错误 encode。

本轮 smoke：

- `github.create_issue` + `--yes --json` 返回 `SECRET_MISSING`。
- `http.request_demo` + read_only allow policy 请求本地 HTTP server 成功。

下一步推荐：T062 P1：添加示例 input 文件。

## 示例 input 文件已补齐

T062 已完成。已新增 `examples/github-issue-capability/input.json` 和 `examples/simple-http-capability/input.json`，并在两个示例 README 中加入 `opencap invoke --dry-run --input ...` 命令。已用 CLI smoke 验证两个文件都能生成 dry-run plan。

下一步推荐：T071 P0：实现 tools/list。

## MCP tools/list projection 已实现

T071 已完成。`@opencap/mcp` 现在导出 `buildMcpToolsList`，可以把 Capability manifest 投影为 MCP tools/list payload；inputSchema 来自 manifest，description 包含权限和风险摘要，tool name 继续使用稳定映射并保留 collision 检测。

本轮验证：

- `pnpm --filter @opencap/mcp test`
- `pnpm --filter @opencap/mcp build`

下一步推荐：T072 P0：实现 tools/call 路由。

## MCP tools/call 核心路由已实现

T072 已完成。`@opencap/mcp` 现在导出 `routeMcpToolCall`，可把 MCP tool name 反查到 Capability manifest，执行 policy evaluation 和 MCP no-elicitation confirmation。allow 会调用注入 executor 并返回 structuredContent；deny 返回 `POLICY_DENIED`；ask 返回 `CONFIRMATION_REQUIRED`；三类路径都会写 Runtime confirmation audit。

本轮验证：

- `pnpm --filter @opencap/mcp test`
- `pnpm --filter @opencap/mcp build`

下一步推荐：T073 P1：MCP confirmation_required 结果格式。

## 本轮体系化补充

已新增产品战略、用户场景、Capability 生命周期、领域模型、Runtime 契约、协议定位、威胁模型、发布门禁和协议生态补充调研。新增 ADR 0006/0007，并更新风险登记、任务表、README、INDEX、SPEC、ARCHITECTURE 和追踪矩阵。

当前下一步仍然是 T001：让 `opencap validate` 调用真实 schema 校验。实现时应优先对齐 `docs/设计/runtime-contracts.md` 和 `docs/产品/capability-lifecycle.md`。

## V1 执行和治理关键决策已收敛

已新增 `docs/SYSTEM.md`，并补齐 HTTP 执行、Policy DSL、Audit Log、Registry Test Format、Outbound Policy、供应链治理和项目运行模型。ADR 0008-0012 已接受。`github.create_issue` manifest 已加入 `execution.body.fields` 和 `auth.placement: bearer`。

当前 High 风险中，R002 和 R014 已缓解，R003/R004 已进入明确实现任务。下一步仍是 T001：让 `opencap validate` 调用真实 schema 校验。

本轮验证缺口：`pnpm` 和 `corepack` 在当前 shell 中不可用，`python jsonschema` 也未安装，因此未能运行 `pnpm validate` 或完整 JSON Schema 校验。已完成基础 JSON/YAML 解析和文档闭环检查。

## 实现前接口契约已补齐

已新增 CLI 契约、本地状态、配置模型、MCP 接口、错误模型、隐私与数据保留、CI 安全基线和 V1 实施计划。ADR 0013-0015 已接受。下一步 T001 可以直接按 `docs/设计/cli-contract-v1.md` 和 `docs/设计/error-model-v1.md` 实现，不需要再临场定义命令行为。

## 生态、社区和可观测性体系已补齐

已新增 Capability 分类、Host 兼容性矩阵、开源核心边界、贡献者路径、Capability Review Checklist、RFC 流程、可观测性指标和 Open Questions；新增 GitHub PR/issue templates；ADR 0016-0018 已接受。下一步仍是 T001，文档体系已经足够支撑进入实现阶段。

## 演进、发布和兼容性体系已补齐

已新增版本兼容、Manifest 演进、Registry 分发、SDK/Adapter 边界、包发布、签名/provenance、质量门禁、维护者手册和 CHANGELOG。ADR 0019-0022 已接受。下一步仍是 T001，项目已具备从 V1 实现到后续发布演进的文档轨道。


## 互操作、确认同意、一致性和 Agentic 风险体系已补齐

已新增互操作 Profiles、确认与同意模型、Capability Package V1、一致性测试体系、Agentic 风险映射和互操作/Agentic security 调研。ADR 0023-0026 已接受。已修正任务编号冲突：原已完成的“演进、发布和兼容性体系”改为 T149，T124 保留给“领域模型落入 TypeScript 类型和 Runtime 接口”。

下一步仍然是 T001。进入实现时要特别注意：`ask` 不能直接执行，MCP 无确认通道时必须返回 `confirmation_required`，后续 audit log 需要能记录 consent receipt。


## 身份、授权和凭据生命周期体系已补齐

已新增身份与授权模型、Secret Resolver V1、凭据生命周期 Runbook、最小权限评审、OAuth 与远程 Runtime 边界和身份授权调研。ADR 0027-0029 已接受。V1 明确只使用 manifest 声明的 env credential；Host/client/input token 不得作为下游 provider token；远程 Runtime OAuth 必须另走 profile/RFC。

下一步仍然是 T001。进入实现时，`opencap validate` 之后的 T159/T164 会成为安全主线之一：Secret Resolver 只能在 validation、policy、consent 通过后运行，dry-run 默认不读取 secret 原值。


## 执行可靠性、副作用安全和失败恢复体系已补齐

已新增执行语义、重试与幂等、失败恢复 Runbook、执行证据和执行可靠性调研。ADR 0030-0031 已接受。V1 明确不自动重试非幂等写操作；请求发出后的 timeout 必须记录为 `unknown_after_timeout`，不能说成“未执行”。

下一步仍然是 T001。进入 HTTP executor 相关任务时，必须把 request_started、outcome、retryAttempt、providerRequestId 等字段作为 audit/evidence 设计的一部分。


## 组合边界、能力图和多步执行体系已补齐

已新增组合边界、能力图、多步执行边界、组合失败恢复和组合/Saga 调研。ADR 0032-0034 已接受。V1 明确不内置 workflow runtime；未来组合中的每一步都必须独立经过 policy、consent、secret、execution 和 audit；compensation 是独立 Capability，不是隐式 rollback。

下一步仍然是 T001。后续进入 runtime 实现时，要避免把 compositionId、planHash 或 workflow-level consent 当成授权来源。


## 信任模型、安全公告、撤销和质量评分体系已补齐

已新增 Trust 模型、Capability Advisory 流程、能力弃用/下架/撤销、能力质量评分和 Trust/Advisory/Revocation 调研。ADR 0035-0037 已接受。Trust level 和 Quality Score 都只是证据摘要，不能覆盖本地 policy 或用户确认；revoked capability 必须保留可寻址记录，不能从历史中静默消失。

下一步仍然是 T001。后续实现 `opencap list/install/invoke` 时，要把 lifecycle/trust/advisory 状态作为用户可见安全信号，而不是执行授权来源。


## 用量计量、配额预算、限流滥用和商业边界体系已补齐

已新增用量计量、配额与预算策略、限流与滥用控制、付费能力与商业边界、用量证据和 Usage/Commerce/Abuse 调研。ADR 0038-0040 已接受。Usage Event 是本地可观测和限额证据，不是账单记录；Quota/Budget Gate 必须在 Secret Resolver 和 Executor 前运行；paid capability/agentic commerce 必须走 future commerce profile，不进入 V1 主路径。

下一步仍然是 T001。后续进入 policy/runtime/audit 实现时，要预留 usage event、quota decision、budget decision 和 rate limit evidence 字段。


## Tool Projection、Prompt Surface、发现选择边界和模型可见元数据治理体系已补齐

已新增 Tool Projection V1、Prompt Surface Security、Discovery and Selection Boundary、Model-visible Metadata Lint 和工具描述/prompt-surface 调研。ADR 0041-0043 已接受。MCP tools/list 的模型可见描述必须由 Runtime 生成，第三方 manifest description 只能作为 lint 后的 safe summary 候选；发现、排序和模型选择只产生 evidence，不能授权执行。

下一步仍然是 T001。后续进入 MCP bridge 和 validate 实现时，要把 model-visible metadata lint、tool projection builder、projection hash 和 runtime-generated risk summary 纳入任务队列。

本轮验证：`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过；`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。


## Result Envelope、输出校验、结果净化和结果来源体系已补齐

已新增 Result Envelope V1、Output Validation V1、Tool Result Sanitization V1、Result Provenance V1、Result Delivery Boundary 和 Result Governance 调研。ADR 0044-0046 已接受。OpenCap 现在明确：provider raw output 默认不进入模型上下文；声明 output schema 的 Capability 必须先通过输出校验才能返回 success；MCP/CLI/未来 API 都只能从 Runtime Result Envelope 适配结果。

下一步仍然是 T001。后续进入 HTTP executor、MCP bridge 和 audit 实现时，要把 result envelope、structuredContent、output validation、sanitizer warning、content digest 和 taint labels 作为实现主线。

本轮验证：`audit_docs.py` 显示文档数 183、任务总数 100、已完成 17、未完成 83；`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过；`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。


## 输入数据治理、数据分类、外发策略和数据最小化体系已补齐

已新增 Input Data Governance V1、Data Classification V1、Data Egress Policy V1、Input Provenance V1、Data Minimization and Redaction V1 和 Input Egress 调研。ADR 0047-0049 已接受。OpenCap 现在明确：tool input 在分类前是不可信数据；Data Egress Gate 必须在 Secret Resolver 和 Executor 前运行；Runtime 只外发 execution mapping 引用字段，不自动发送整个 input。

下一步仍然是 T001。后续进入 validation、HTTP rendering、policy、confirmation、audit 和 dry-run 实现时，要把 input classification、field-level egress map、redacted egress preview、data classes 和 egress decision 作为主路径证据。

本轮验证：`audit_docs.py` 显示文档数 192、任务总数 115、已完成 18、未完成 97；`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过；`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。


## Policy Decision Trace、策略生命周期、策略模拟和 Override/Breakglass 体系已补齐

已新增 Policy Decision Trace V1、Policy Lifecycle and Change Control、Policy Simulation and Diff V1、Policy Override and Breakglass V1，以及 Policy Governance/Decision Audit 调研。ADR 0050-0053 已接受。

本轮核心约束：每个 policy/gate decision 必须产生 redacted trace；policy change 是可审计本地对象；broad allow 和 ask/deny -> allow 需要 simulation/diff finding；breakglass 不能绕过 audit、data egress deny、outbound private block、secret resolver ordering 或 revoked/malicious block。

后续进入 policy/runtime/audit 实现时，要把 policySetId、policyRevision、policy_trace_json、override_id、policy ledger、simulation report 和 broad allow findings 作为主路径对象。Conformance Suite、Threat Model、Quality Gates 和 RISKS 已经同步加入 Policy Governance 检查。

下一步仍然是 T001：让 `opencap validate` 调用真实 schema 校验。不要被新任务量带偏；这些设计是后续 M3 Policy + Audit 的约束，V1 实现入口仍从 manifest validation 开始。

本轮验证：`audit_docs.py` 显示文档数 201、任务总数 128、已完成 19、未完成 109；`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过；待补全文案扫描只剩 GitHub issue template 示例文本和 ADR 0005 中明确的规划说明。`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。


## 中文文档入口、索引和规范已重新梳理

已新增 `docs/README.md` 作为中文文档中心，新增 `docs/社区/documentation-governance.md` 作为中文文档规范，并重写 `docs/INDEX.md` 为维护者索引。根 `README.md` 的长文档列表已收敛为关键入口，GitHub issue/PR 模板、AGENTS、CHANGELOG 和一批用户可见标题已中文化。

后续维护规则：README 只放少量关键入口；新人阅读从 `docs/README.md` 开始；维护者职责和目录规则看 `docs/INDEX.md`；新增文档前先看 `docs/社区/documentation-governance.md`，优先更新旧文档而不是继续堆新文件。

`docs/` 根目录后来已做物理归位：普通教程、参考、规范和模板文档已经移动到对应子目录。后续继续移动文件时，必须同步更新链接并运行文档闭环检查。

本轮验证：`audit_docs.py` 显示文档数 203、任务总数 129、已完成 20、未完成 109；`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过；`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。

## docs 根目录文件已物理归位

已把 `docs/` 根目录从 22 个文件压到 13 个核心入口/状态文件。移动结果：`introduction.md` -> `docs/概览/`，`getting-started.md` -> `docs/教程/`，`capability-manifest.md` -> `docs/规范/`，`permission-model.md` 和 `security-model.md` -> `docs/安全/`，`runtime-architecture.md` -> `docs/设计/`，`registry-guidelines.md` 和 `documentation-governance.md` -> `docs/社区/`，`TASK_TEMPLATE.md` -> `docs/规划/`。全仓引用已同步更新，`.DS_Store` 本地临时文件已清理。

后续规则：`docs/` 根目录只放 `README/INDEX/SYSTEM/SPEC/ARCHITECTURE/TASKS/HANDOFF/TESTING/DECISIONS/RISKS/ROADMAP/WORKFLOW/GLOSSARY` 这类核心入口、状态和治理文件。普通说明文档必须进入子目录。

本轮验证：`audit_docs.py` 显示文档数 203、任务总数 130、已完成 21、未完成 109；`check_docs.py`、`git diff --check`、JSON 解析、YAML 解析和 Markdown 相对链接检查通过；`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。

## docs 子目录结构已中文化

已将 `docs/` 下一层目录从英文分类统一改为中文分类：`docs/社区/`、`docs/设计/`、`docs/安全/`、`docs/调研/`、`docs/运营/`、`docs/质量/`、`docs/规划/`、`docs/规范/`、`docs/产品/`、`docs/生态/`、`docs/决策/`、`docs/协议/`、`docs/教程/`、`docs/概览/`、`docs/评审/`。全仓旧英文文档目录引用已同步替换。

保留 `docs/README.md`、`docs/TASKS.md`、`docs/HANDOFF.md` 等根部核心文件名，以及 `packages/spec` 等工程代码路径，原因是这些路径被脚本、构建和开发者习惯依赖。后续新增文档应优先进入中文目录，新增目录必须先写入 `docs/社区/documentation-governance.md` 和 `docs/INDEX.md`。

本轮验证：`check_docs.py`、`audit_docs.py`、`git diff --check`、JSON 解析、YAML 解析、旧英文目录引用扫描和 Markdown 相对链接检查通过；`audit_docs.py` 显示文档数 203、任务总数 131、已完成 22、未完成 109。`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。

## 整体系统设计 V1 已补齐

已新增 `docs/设计/整体系统设计-v1.md`，把 OpenCap 的总体设计收敛为五个平面：标准面、控制面、执行面、信任面和互操作面。文档同时明确三条主链路、Runtime Kernel、四种账本、四张卡片、执行前门禁顺序和分阶段生态闭环。

这次设计没有改变 V1 实现入口。下一步仍然是 T001：让 `opencap validate` 调用真实 schema 校验。新设计的作用是防止后续实现时把 MCP adapter、Registry、Policy、Audit、A2A、Apps SDK 或 OpenAPI adapter 混进同一个边界里。

本轮外部标准核对：MCP 2025-11-25 继续强调协议分层、authorization、server/client features 和 metadata 安全；A2A 最新规范强调 Agent Card、任务生命周期、认证授权和多传输互操作；OpenAI Apps SDK 以 MCP server 和 ChatGPT app 分发为入口。OpenCap 因此继续坚持协议中立 Runtime Kernel，MCP 是 V1 adapter，A2A/Apps SDK/OpenAPI 是 future profile。

本轮验证：`check_docs.py`、`audit_docs.py`、`git diff --check`、JSON 解析、YAML 解析和 Markdown 相对链接检查通过；`audit_docs.py` 显示文档数 204、任务总数 132、已完成 23、未完成 109。`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。

## 整体设计二次审查已完成

已新增 `docs/评审/整体设计二次审查-2026-05-08.md`。这次审查的结论是：OpenCap 方向成立，但下一阶段不能继续扩概念，要把五个平面压成 Runtime Kernel 类型、统一 Gate、四种 Ledger、四张 Card、Profile evidence、Registry sync、Capability identity、Provenance 预留、Authoring loop 和 Release maturity gates。

已新增后续任务 T267-T276。它们是架构补强任务，不改变当前实现入口。已同步新增 R061 风险，约束体系化设计不能脱离实现主路径。下一步仍然优先 T001：让 `opencap validate` 调用真实 schema 校验。

本轮验证：`check_docs.py`、`audit_docs.py`、`git diff --check`、JSON 解析、YAML 解析和 Markdown 相对链接检查通过；`audit_docs.py` 显示文档数 205、任务总数 133、已完成 24、未完成 109。`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。

## 项目 conda 环境已创建

已创建 `ai-capability-runtime` conda 环境，路径为 `/opt/anaconda3/envs/ai-capability-runtime`。环境包含 Python 3.11、Node.js 22 和 pnpm 9.15。环境定义已写入 `environment.yml`，使用说明见 `docs/教程/开发环境.md`。

建议后续开发先运行：

```bash
conda activate ai-capability-runtime
pnpm install
```

这台机器上 `conda run -n ai-capability-runtime node --version` 可能会因为 PATH 优先级拿到 Homebrew Node；激活环境后应确认 `which node` 指向 `/opt/anaconda3/envs/ai-capability-runtime/bin/node`。

依赖已在该环境中安装，`pnpm-lock.yaml` 已生成。使用环境 PATH 运行时：`pnpm build` 通过，`pnpm test` 通过；`pnpm validate` 失败在 T001 范围内，错误为 AJV 没有加载 `https://json-schema.org/draft/2020-12/schema`。这说明环境问题已解除，下一步应修 validator。


## Runtime Kernel 公共契约 V1 已补齐

已新增 `docs/设计/runtime-kernel-contract-v1.md`，把整体系统设计中的 Runtime Kernel 进一步压成公共契约：`RuntimeKernel`、`RuntimeContext`、`InvocationRequest`、`InvocationPlan`、`GateDecision`、`ConsentRequest`、`ConsentReceipt`、`SecretHandle`、`ResultEnvelope`、`RuntimeError` 和 evidence/audit 形状已经明确。

这轮设计的关键约束是：CLI、MCP、未来 HTTP API 和 Console 都只能围绕 Runtime public contract 做 adapter；`invoke` 是唯一允许产生外部副作用的入口；`planInvocation` 不解析 secret、不发外部请求；Host capability 只能影响展示和确认通道，不能降低 Runtime policy。

T267 已完成并从待办列表移入已完成区。下一步仍然是 T001：修正 `opencap validate` 的真实 schema 校验，尤其是 AJV draft 2020-12 meta schema 初始化问题。后续 T124/T145 再把本次契约落入 `packages/runtime` 的 TypeScript public exports。

本轮验证：`check_docs.py`、`audit_docs.py`、`git diff --check`、JSON 解析、YAML 解析、Markdown 相对链接检查和项目 conda 环境下的 `pnpm build` 通过。


## Manifest validate 主路径已实现

已完成 T001/T002：`@opencap/spec` 现在导出可复用 manifest validator API，支持 YAML/JSON manifest、单 Capability 目录、registry 目录和单 manifest 文件；`opencap validate <path>` 已接入真实 JSON Schema 校验，不再输出 scaffold 文本。

关键实现：AJV 已切换到 draft 2020-12 validator；CLI 在 `pnpm --filter @opencap/cli dev` 场景下用 `INIT_CWD` 解析用户传入的相对路径；非法 manifest 会返回非 0 exit code，并输出 manifest 文件路径和 JSON Pointer 风格字段路径。

本轮验证：`pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue` 通过；`pnpm validate` 通过；临时非法 manifest 验证返回 exit 1 且输出 `/permissions/0/risk`；`pnpm build`、`pnpm test`、`pnpm lint` 通过。下一步按任务表进入 T003：补 validator 单元测试；完成后再进入 T010 本地状态路径 helper。


## Manifest validator 单元测试已补齐

已完成 T003：新增 `packages/spec/src/index.test.ts`，直接测试 `validateManifest` API。覆盖合法 HTTP manifest、`type: mcp`、缺少 `permissions`、非法 risk、timeout 小于 100、metadata 缺少 `trust_level`，并断言失败结果包含 JSON Pointer 风格字段路径。

本轮验证：`pnpm --filter @opencap/spec test` 通过，6 个测试全部通过；`pnpm --filter @opencap/spec build` 通过。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。


## Registry test case schema 已定义

已完成 T004：新增 `packages/spec/schema/registry-test.schema.json`，并新增 `packages/spec/src/validate-registry.ts` 作为 `pnpm validate` 的入口。现在 `pnpm validate` 会同时校验 registry manifests 和 `registry/**/tests/basic.yml`。

现有四个示例测试文件已补齐 `capability`、`mode` 和 `expect.status`，并保留 `expect.request` 与 `expect.permission`。Registry 指南和测试格式文档已同步说明最小字段、用途和校验命令。

本轮验证：`pnpm validate` 通过，输出 4 个 valid manifest 和 4 个 valid registry test；`pnpm --filter @opencap/spec build`、`pnpm --filter @opencap/spec test` 和 `pnpm build` 通过。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。


## Capability 编写教程已新增

已完成 T005：新增 `docs/教程/write-a-capability.md`，作为 Tutorial 类型文档，面向第一次贡献 Capability 的开发者。教程从空目录开始，覆盖 `manifest.yml`、README、`tests/basic.yml`、`opencap validate <path>`、`pnpm validate` 和常见错误。

`docs/README.md` 的“我要贡献 Capability 或 Registry 条目”路径已加入该教程。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。


## 本地状态路径 helper 已实现

已完成 T010：`@opencap/runtime` 现在导出 `resolveStateDir`、`getLocalStatePaths` 和 `ensureLocalStateDir`。解析优先级符合本地状态设计：显式 `stateDir`、`OPENCAP_STATE_DIR`、默认 `<cwd>/opencap.local`。

`ensureLocalStateDir` 只创建 V1 必需的 `installed/` 和 `tmp/`，不会创建或修改 `registry/`。`OpenCapRuntime` 构造时会保存解析后的 `statePaths`。本轮验证：`pnpm --filter @opencap/runtime test` 通过，6 个测试全部通过；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint` 通过。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。


## Capability install 已实现

已完成 T011：`@opencap/runtime` 新增 `installCapability`，CLI `opencap install <id>` 已接入真实安装逻辑。安装会在 registry 中查找唯一 Capability 目录，校验 `manifest.yml`，复制完整目录到 `opencap.local/installed/<id>/`，默认拒绝覆盖，`--force` 可替换。

CLI 支持 `--state-dir`、`--registry` 和 `--force`。本轮验证：`pnpm --filter @opencap/runtime test` 通过 11 个测试；CLI smoke 安装到 `/private/tmp/opencap-cli-install-smoke` 成功，重复安装无 `--force` 返回 exit 1 并提示 `Use --force`；`pnpm build`、`pnpm test`、`pnpm lint` 通过。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。


## Capability list 已实现

已完成 T012：`@opencap/runtime` 新增 `listInstalledCapabilities`，CLI `opencap list` 已接入真实本地状态读取。空安装状态会输出友好提示；已安装状态显示 `id version type risk trust status`；损坏 manifest 会以 `status: invalid` 出现，不阻断其他能力。

CLI `list` 支持 `--state-dir` 和 `--json`。本轮验证：`pnpm --filter @opencap/runtime test` 通过 14 个测试；CLI smoke 使用 `/private/tmp/opencap-cli-install-smoke` 能列出 `github.create_issue 0.1.0 http write experimental enabled`；`pnpm build`、`pnpm test`、`pnpm lint` 通过。下一步按任务表进入 T013：统一 CLI 错误处理和 exit code。


## CLI 错误处理已统一

已完成 T013：CLI 新增统一错误处理 helper，validate/install/list 已通过 `runCliAction`、`handleCliError` 和 `setCliError` 处理错误。用户错误返回 exit 1，未知内部错误返回 exit 2，默认不输出 stack trace。

本轮验证：`pnpm --filter @opencap/cli build` 通过；`validate /private/tmp/non-existent-opencap-path` 返回 exit 1 且无 stack trace；`install missing.capability` 返回 exit 1 且无 stack trace；成功的 validate/list smoke 行为保持不变；`pnpm lint` 通过。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。


## CLI state-dir 参数面已补齐

已完成 T014：`install` 和 `list` 保持真实 `--state-dir` 行为；新增 `invoke` 骨架命令并支持 `--state-dir`、`--input`、`--dry-run`；`logs` 和 `serve` 已接受 `--state-dir` 并保持骨架输出。

本轮验证：`install --state-dir /private/tmp/opencap-cli-state-dir-smoke --force` 成功；`list --state-dir` 能列出 `github.create_issue`；`invoke --state-dir --dry-run`、`logs --state-dir`、`serve --state-dir --mcp` 均接受参数并输出骨架信息；`pnpm --filter @opencap/cli build` 和 `pnpm lint` 通过。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。


## Doctor 命令已实现

已完成 T015：CLI 新增 `opencap doctor`，用于只读诊断本地环境。当前输出 Node 版本、pnpm 版本、registry 路径状态、state dir 路径状态、state dir writable、installed summary 和 policy status。命令支持 `--state-dir` 和 `--registry`，不会修改 registry 或 state dir。

本轮验证：`pnpm --filter @opencap/cli dev -- doctor --state-dir /private/tmp/opencap-cli-state-dir-smoke` 通过，输出 1 个 installed、0 个 invalid；`pnpm --filter @opencap/cli build`、`pnpm lint`、`pnpm test` 通过。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。


## Installed Capability Loader 已实现

已完成 T020：`@opencap/runtime` 新增 `loadInstalledCapabilities`，返回合法 installed capabilities 和 invalid entries。合法对象包含 id、version、installPath、manifestPath 和 manifest；损坏 manifest 不会进入 capabilities，但会形成可展示错误。`OpenCapRuntime.loadInstalledCapabilities()` 已接入该 loader。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 17 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint` 通过。下一步按任务表进入 T021：实现 Capability id 与 MCP tool name 映射表。

## MCP tool name 映射已实现

已完成 T021：`@opencap/mcp` 新增 `buildMcpToolNameMap`，将 Capability id 稳定投影为 MCP tool name，并在启动前检测 `.` 与 `_` 归一化带来的冲突。`describeCapabilityAsTool` 现在会在 metadata 中保留原始 `capabilityId`。

本轮验证：`pnpm --filter @opencap/mcp test` 通过 4 个测试；`pnpm --filter @opencap/mcp build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过。下一步按任务表进入 T022：实现本地状态初始化。

## 本地状态初始化已实现

已完成 T022：`ensureLocalStateDir` 现在会创建 `installed/`、`tmp/` 和默认 `policies.yml`，默认策略为 `default: ask` 与空 `rules`。已存在的 `policies.yml` 不会被覆盖，`logs.sqlite` 仍由后续 Audit Logger 在首次写入时创建。`listInstalledCapabilities` 与 `OpenCapRuntime.ensureLocalStateDir()` 已复用该初始化逻辑。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 19 个测试；`pnpm --filter @opencap/cli build`、CLI `list --state-dir /private/tmp/opencap-t022-smoke` smoke、`pnpm build`、`pnpm test`、`pnpm validate`、`pnpm lint`、`check_docs.py` 和 `git diff --check` 通过。下一步按任务表进入 T030：实现 policy 文件格式和 parser。

## Policy parser 已实现

已完成 T030：`@opencap/runtime` 新增 `parsePolicyYml`、`loadPolicySet`、`defaultPolicySet` 和 `PolicyParseError`。缺少 `policies.yml` 时返回默认 `ask` policy set；非法 decision、非法 risk 和非法 YAML 会返回结构化错误。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 23 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过。下一步按任务表进入 T031：实现 Policy Engine。

## Policy Engine 已实现

已完成 T031：`@opencap/runtime` 新增 `evaluatePolicy`。Engine 会按每个 permission 选择第一条匹配规则，无匹配时使用 policy set 的 `default`，并按 deny > ask > allow 聚合多权限 Capability 的最终决策。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 27 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过。下一步按任务表进入 T032：实现 Confirmation Handler 接口。

## Confirmation Handler 接口已实现

已完成 T032：`@opencap/runtime` 新增 `ConfirmationHandler`、`CliConfirmationHandler` 和 `McpNoElicitationConfirmationHandler`。CLI handler 支持注入 prompt；MCP no-elicitation handler 对 ask 返回 `confirmation_required`；allow/deny 不进入确认 prompt。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 32 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate` 和 `git diff --check` 通过。下一步按任务表进入 T033：记录 ask/deny 的审计日志。

## ask/deny 审计事件已实现

已完成 T033：`@opencap/runtime` 新增 `AuditLogger` 接口、`InMemoryAuditLogger`、`createConfirmationAuditEvent` 和 `confirmWithAudit`。`confirmation_required` 会记录为 blocked，policy deny 记录为 denied，approved 记录为 executed。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 35 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py` 和 `git diff --check` 通过。下一步按任务表进入 T034：支持 `--yes` 非交互确认。

## CLI --yes 边界已实现

已完成 T034：`CliConfirmationHandler` 新增 `assumeYes` 选项，用于未来 CLI `--yes`。它只会自动批准普通 CLI ask 决策；destructive/financial ask 仍返回 rejected，policy deny 不会被覆盖，MCP no-elicitation handler 不受影响。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 38 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py` 和 `git diff --check` 通过。下一步按任务表进入 T040：确定并实现日志存储。

## SQLite Audit Logger 已实现

已完成 T040：`@opencap/runtime` 新增 `SqliteAuditLogger`，使用 Node 内置 `node:sqlite` 自动创建 `invocations` 表，支持写入 `AuditEvent` 和查询最近 N 条。当前 Node 会对 `node:sqlite` 打印 ExperimentalWarning，但测试和构建通过。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 40 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py` 和 `git diff --check` 通过。`node:sqlite` 会打印 ExperimentalWarning。下一步按任务表进入 T041：实现 redaction 和 input hash。

## Redaction 和 input hash 已实现

已完成 T041：`@opencap/runtime` 新增 `redactInput`、`stableJsonStringify` 和 `hashInput`。confirmation audit request 带 input 时，会生成稳定 `inputHash` 和 `inputRedactedJson`，SQLite logger 会持久化这两个字段。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 43 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate` 和 `git diff --check` 通过。`node:sqlite` 会打印 ExperimentalWarning。下一步按任务表进入 T042：实现 `opencap logs`。

## opencap logs 已实现

已完成 T042：CLI `opencap logs` 接入 `SqliteAuditLogger.recent()`。默认显示最近 20 条，支持 `--json` 与 `--limit`；普通输出包含 timestamp、capability id、decision、status、confirmation、duration 占位和 reason。

本轮验证：`pnpm --filter @opencap/cli build`、`pnpm --filter @opencap/runtime test`、空日志 `opencap logs --json` smoke、有日志 `opencap logs --limit 1` smoke、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py` 和 `git diff --check` 通过。`node:sqlite` 会打印 ExperimentalWarning。下一步按任务表进入 T043：增加日志筛选。

## 日志筛选已实现

已完成 T043：`SqliteAuditLogger.recent()` 支持 capability/status/since 查询条件，CLI `opencap logs` 支持 `--capability`、`--status`、`--since`，并可与 `--limit` 组合。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 44 个测试；`pnpm --filter @opencap/runtime build`、`pnpm --filter @opencap/cli build`、`opencap logs --capability` smoke、`opencap logs --status --since` smoke、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py` 和 `git diff --check` 通过。`node:sqlite` 会打印 ExperimentalWarning。下一步按任务表进入 T050：实现 URL 模板渲染。

## URL 模板渲染已实现

已完成 T050：`@opencap/runtime` 新增 `renderUrlTemplate` 和 `UrlTemplateRenderError`。支持 `{{field}}`、缺字段结构化错误、非对象输入错误和统一 `encodeURIComponent`。

本轮验证：`pnpm --filter @opencap/runtime test` 通过 50 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py` 和 `git diff --check` 通过。`node:sqlite` 会打印 ExperimentalWarning。下一步按任务表继续。
