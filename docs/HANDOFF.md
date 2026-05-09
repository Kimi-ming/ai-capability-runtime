# 当前状态交接

更新时间：2026-05-09

## 当前阶段

OpenCap 处于 V1 最小运行时实现阶段。文档体系已经建立，当前循环按 `docs/TASKS.md` 从小任务连续推进实现、验证、同步文档并提交 GitHub。

已经完成的实现主线：

- GitHub 仓库创建和推送
- V1 项目骨架和中文文档体系
- `opencap validate` 真实 schema 校验
- manifest validator API 和单元测试
- registry test case schema 与 `pnpm validate` 集成
- Runtime state dir helper、install、list、doctor、Installed Capability Loader
- MCP Capability id 到 tool name 的稳定映射和冲突检测
- 本地状态初始化和默认 `policies.yml`
- Policy parser、`loadPolicySet`、Policy Engine、Confirmation Handler、CLI `--yes` 边界、内存/SQLite Audit Logger、redaction/input hash、`opencap logs`、日志筛选和 URL 模板渲染

## 当前代码状态

主要包状态：

- `@opencap/spec` 有 schema、类型、manifest loader/validator API 和 registry test 校验。
- `@opencap/cli` 的 `validate`、`install`、`list`、`doctor` 已接入真实逻辑；`invoke`、`logs`、`serve` 仍是骨架。
- `@opencap/runtime` 有本地 state dir 初始化、install/list/load installed capabilities、policy parser、Policy Engine、Confirmation Handler、内存 AuditLogger 和 SQLite Audit Logger。
- `@opencap/mcp` 有 tool name 映射、冲突检测和 tool description helper。
- `@opencap/sdk` 暂缓实现。

## 当前任务入口

下一步从 `docs/TASKS.md` 开始。

Next task: T051 P0：实现 dry-run executor。

推荐第一个任务：

```text
T051：实现 dry-run executor
```

原因：

- T001/T002/T003/T004/T005/T010/T011/T012/T013/T014/T015/T020/T021/T022/T030/T031/T032/T033/T034/T040/T041/T042/T043/T050 已完成
- Runtime/CLI 已能初始化 state dir、安装能力、列出能力、加载合法 installed capabilities、解析 policy、计算 allow/ask/deny、处理确认、支持 CLI `--yes`、生成审计事件、脱敏输入、持久化 SQLite、查询筛选日志，并渲染 HTTP URL 模板
- T051 将基于 URL 渲染生成 dry-run plan

## 最近验证

项目 conda 环境 `ai-capability-runtime` 已创建并安装依赖。本轮已运行：

- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/runtime build`
- `pnpm build`
- `pnpm test`
- `pnpm lint`
- `pnpm validate`
- `check_docs.py`
- `git diff --check`
- JSON 解析检查
- YAML 解析检查

当前已知：上述验证均通过。

## 已知风险

- `invoke`、`logs`、`serve` 仍是骨架命令。
- HTTP dry-run executor 尚未实现，`opencap invoke` 仍无法生成 dry-run plan。
- MCP server 尚未实现。
- SQLite audit logger 尚未实现。

## 下一步建议

1. 实现 T051：dry-run executor。
2. 实现 T060/T061：`opencap invoke` 接入。
3. 实现 T040：SQLite audit log 的最小写入能力。
4. 继续保持 `pnpm validate && pnpm build && pnpm test && pnpm lint` 通过。
5. 更新 `docs/TASKS.md` 和本文件。

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

本轮验证：`audit_docs.py` 显示文档数 201、任务总数 128、已完成 19、未完成 109；`check_docs.py`、`git diff --check`、JSON 解析和 YAML 解析通过；占位扫描只剩 GitHub issue template placeholder 和 ADR 0005 中明确的规划占位。`npm run build` 已尝试，但当前环境缺少 `pnpm`，失败为 `sh: pnpm: command not found`。


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

本轮验证：`pnpm --filter @opencap/runtime test` 通过 48 个测试；`pnpm --filter @opencap/runtime build`、`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm validate`、`check_docs.py` 和 `git diff --check` 通过。`node:sqlite` 会打印 ExperimentalWarning。下一步按任务表进入 T051：实现 dry-run executor。
