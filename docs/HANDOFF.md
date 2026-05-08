# 当前状态交接

更新时间：2026-05-08

## 当前阶段

OpenCap 处于 V1 前期实现准备阶段。

体系化文档已补充：文档地图、工作流、里程碑、追踪矩阵、风险登记、任务模板和术语表已经建立。

已经完成：

- GitHub 仓库创建和推送
- V1 项目骨架
- 中文文档体系
- 技术方案审查
- V1 HTTP-only 收敛
- 开发任务体系初版
- 文档地图和工作流体系
- 需求-任务-测试追踪矩阵
- V1 里程碑门禁
- 风险登记和任务模板

## 当前代码状态

主要包仍是骨架：

- `@opencap/spec` 有 schema、类型和 manifest validation 脚本雏形
- `@opencap/cli` 有命令骨架，但命令尚未真实执行
- `@opencap/runtime` 有 Runtime class 骨架
- `@opencap/mcp` 有 tool name 和 tool description helper
- `@opencap/sdk` 暂缓实现

## 当前任务入口

下一步从 `docs/TASKS.md` 开始。

Next task: T001 P0：让 `opencap validate` 调用真实 schema 校验。

推荐第一个任务：

```text
T001：让 opencap validate 调用真实 schema 校验
```

原因：

- 风险低
- 依赖少
- 是所有后续 install/registry/CI 的基础

## 最近验证

最近一次文档重写时运行过：

- `git diff --check`
- JSON 解析检查
- YAML 解析检查

尚未运行：

- `pnpm install`
- `pnpm validate`
- `pnpm test`
- `pnpm build`

原因：当前任务主要是文档组织，没有安装依赖。

## 已知风险

- `opencap validate` CLI 目前只是输出 scaffold 文本。
- `packages/spec/src/validate-manifests.mjs` 可以校验 registry，但还没有接到 CLI。
- 没有 `pnpm-lock.yaml`，首次安装依赖后应提交。
- MCP server 尚未实现。
- SQLite audit logger 尚未实现。

## 下一步建议

1. 实现 `@opencap/spec` 的可复用 validator API。
2. 让 `opencap validate <path>` 调用 validator。
3. 添加 validate 单元测试和 CLI smoke test。
4. 运行 `pnpm install && pnpm validate && pnpm test`。
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
