# 开发任务总表：OpenCap

本文是 OpenCap 的开发任务源。后续每次开发都应从这里选择任务、完成验证，并更新状态。

状态标记：

- `[ ]` 未开始
- `[~]` 进行中
- `[x]` 已完成且已验证
- `[!]` 阻塞
- `[?]` 需要确认

优先级：

- P0：没有它 V1 不能成立
- P1：V1 必须完成
- P2：V1 体验和贡献质量增强
- P3：V1 之后

## 当前完成度快照

截至 2026-05-14，OpenCap 已完成 V1 最小运行时主链路的大部分基础能力：manifest 校验、registry tests、Capability package lint、Capability advisory YAML schema、Registry revocation metadata、installed capability advisory check、lifecycle status schema、install/list/invoke lifecycle warnings、registry search lifecycle filtering、quality score rubric helper、Capability authoring loop、release maturity gate matrix、least-privilege auth lint、credential lifecycle runbook lint、GitHub fine-grained token setup guide lint、SECURITY.md private reporting lint、execution semantics evidence、unknown outcome audit tests、retry policy tests、score cannot override policy tests、quota/budget policy gates、provider rate limit handling、local abuse throttle、financial consent/spend cap gate、install/list lifecycle trust fields、policy、confirmation、consent receipt audit fields、audit、HTTP dry-run/execute、Secret Resolver、credential lifecycle smoke、Result Envelope、data egress、outbound policy 私网阻断、state dir precedence tests、credential descriptor schema、policy governance、Runtime public contract、Runtime Gate contract、Ledger storage contract、Card schema contract、Trust Card generation rules、Trust level transition tests、revoked invoke lifecycle gate、Capability identity contract、package public exports、MCP helper、MCP tool mapping contract tests、CLI smoke test、CLI command snapshot tests 和 CLI user-error exit code tests。最近一次全量验证通过 `pnpm validate`、`pnpm lint`、`pnpm build`、`pnpm test`，测试覆盖 spec 72 个、runtime 267 个、mcp 21 个、cli 5 个。

当前主要缺口：

- 完整 `opencap serve --mcp` server 仍被 T070 阻塞。
- V1 需要把 lifecycle warnings、Card 输出命令和具体 ledger writer/迁移策略继续落到类型、测试和实现里。
- CLI 还缺 command snapshot、stdout/stderr、exit code 细粒度测试。
- Registry trust/lifecycle/advisory/quality/usage/commerce 等生态闭环仍是任务队列主体。
- Console、Registry Web、SDK/adapters 仍是 V1 后续或 alpha 后增强。

## 模块划分

任务队列按模块组织，模块内任务按推荐顺序推进。P0/P1 任务优先进入 V1 alpha 收敛；P2 任务作为质量、生态和扩展增强；P3 任务进入 V1 之后。

| 模块 | 名称 | 目标 | 当前判断 |
| --- | --- | --- | --- |
| M0 | 阻塞和外部依赖 | 跟踪需要用户确认、网络、凭据或外部 SDK 的任务 | T070 仍阻塞 |
| M1 | 核心契约和 Runtime Kernel | 把设计对象落成 public types、接口和稳定包导出 | 基础契约已完成 |
| M2 | 执行安全、审计和可靠性 | 补齐调用前门禁、审计失败保护、状态路径、重试和限流 | 下一步优先 |
| M3 | CLI、MCP 和 Host 互操作 | 补齐 CLI 细粒度测试、MCP 映射、Host evidence 和 profile | 等 T070 解阻后加速 |
| M4 | Registry、Trust、Lifecycle 和供应链 | 建立能力包、信任卡、生命周期、安全公告和供应链闭环 | V1 生态根基 |
| M5 | Conformance、Abuse Cases、隐私和运维 | 把设计风险转为一致性测试、smoke、runbook 和文档门禁 | 质量增强 |
| M6 | Composition、Capability Graph 和 Agentic Commerce | 规划多步组合、能力图、用量计费和商业边界 | V1 后续扩展 |

## 可执行任务队列

### 模块 M0：阻塞和外部依赖

- [!] T070 P0：选择 MCP TypeScript SDK 并接入。（阻塞：需要确认依赖包名/版本并允许安装新 npm 依赖）

### 模块 M1：核心契约和 Runtime Kernel

- [x] T124 P1：将领域模型落入 TypeScript 类型和 Runtime 接口。
- [x] T145 P1：定义 package public exports。
- [x] T268 P1：定义统一 Runtime Gate 接口和 GateDecision 语义。
- [x] T269 P1：定义 Capability/Policy/Invocation/Compatibility Ledger 存储接口。
  - 验收标准：
    - `@opencap/runtime` 导出四类 ledger record V1 类型和 append-only 存储接口：Capability、Policy、Invocation、Compatibility。
    - 每类 record 都有明确的 record kind、record id、recordedAt、版本字段和最小查询键，能映射到本地 JSON/SQLite/YAML 实现。
    - ledger contract 只保存 digest、摘要、证据引用和脱敏 metadata，不要求保存 manifest/policy/input/output/secret 原文。
    - public root entrypoint 能导出 ledger helper 和类型，后续 Card/Profile/identity 任务可复用。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- ledger.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/ledger.ts` 和 `packages/runtime/src/ledger.test.ts`，导出 `LEDGER_RECORD_VERSION`、`createLedgerRecordId()`、四类 ledger record V1 类型、查询类型和 `RuntimeLedgerStore` append-only 接口；`packages/runtime/src/index.ts` 已从 public root entrypoint 导出 ledger helper 和类型。Contract 测试覆盖 record id 前缀、四类 record 最小字段、禁止原文/secret 进入 ledger contract、adapter-neutral append/query 接口和 root export。Runtime 测试数从 173 增至 177。
- [x] T270 P1：定义 Capability/Trust/Consent/Compatibility Card schema 和生成规则。
  - 验收标准：
    - `@opencap/runtime` 导出 `CARD_SCHEMA_VERSION`、四类 Card document V1 类型和生成 helper：Capability、Trust、Consent、Compatibility。
    - Capability Card 可从 `InstalledCapabilityRecord` 生成，包含 id、version、summary、risk、permissions、auth、lifecycle、install 和 trust 摘要，不包含 secret 原文或未经 lint 的模型指令。
    - Trust Card 可从 capability identity、trust/test/review/advisory/provenance/quality 信号生成，并明确 trust card 是 evidence summary，不是安全保证或授权决策。
    - Consent Card 可从 `ConsentRequest` 生成，包含 action、target origin、egress data classes、fields sent、risk、policy reason 和 expiry，不复用模型自由文本、不包含 secret。
    - Compatibility Card 可从 compatibility ledger record 生成，包含 host、profile、checks、known gaps、result 和 evidence ref，不宣称泛泛兼容所有 Host。
    - public root entrypoint 能导出 card helper 和类型，后续 CLI/Registry Web/Console 可复用。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- card.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/card.ts` 和 `packages/runtime/src/card.test.ts`，导出 `CARD_SCHEMA_VERSION`、`createCardId()`、四类 Card document V1 类型和 `createCapabilityCard()`、`createTrustCard()`、`createConsentCard()`、`createCompatibilityCard()` 纯生成 helper；`packages/runtime/src/index.ts` 已从 public root entrypoint 导出 card helper 和类型。Contract 测试覆盖 card id 前缀、Capability/Trust/Consent/Compatibility Card 生成规则、Trust Card disclaimer、Consent runtime-generated boundary、Compatibility known gaps 和 root export。Runtime 测试数从 177 增至 183。
- [x] T273 P1：固定 Capability identity、digest、version 和 lifecycle 关系。
  - 验收标准：
    - `@opencap/runtime` 导出 Capability identity public helper 和类型，明确 `id + version + manifestDigest` 是调用审计身份。
    - Capability version 必须来自 manifest `version`，使用 SemVer 形态；package/runtime 版本不能替代 Capability version。
    - `manifestDigest` 是行为定义 digest，`packageDigest` 和 `registryCommit` 是 provenance，不替代 `manifestDigest`。
    - `lifecycle` 是能力身份上的可变治理状态，不改变 `id/version/manifestDigest` identity key；revoked/yanked/deprecated 保持可寻址。
    - lifecycle 语义 helper 明确默认安装/执行/警告/hard block 行为，revoked 默认不可静默执行。
    - public root entrypoint 能导出 identity helper 和类型，后续 lifecycle warning、Card、Ledger 和 audit 可复用。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- identity.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/identity.ts` 和 `packages/runtime/src/identity.test.ts`，导出 `CAPABILITY_IDENTITY_VERSION`、`createCapabilityIdentity()`、`createCapabilityIdentityRef()`、`capabilityIdentityKey()`、`validateCapabilityIdentity()` 和 `capabilityLifecycleSemantics()`；`packages/runtime/src/index.ts` 已从 public root entrypoint 导出 identity helper 和类型。Contract 测试覆盖 manifest version -> identity、`id@version#manifestDigest` audit key、路径无关 identity digest、lifecycle 不改变 identity digest、SemVer/digest validation、packageDigest 不能替代 manifestDigest、revoked/yanked/deprecated 默认语义和 root export。Runtime 测试数从 183 增至 188。
- [x] T275 P1：补齐 Capability authoring loop 和 lint 顺序。
  - 验收标准：
    - `@opencap/spec` 导出 Capability authoring loop contract，固定作者从草稿到 review-ready 的阶段顺序和阻断语义。
    - lint 顺序必须明确为 manifest schema -> package shape -> model-visible metadata -> least-privilege/risk -> secret hygiene -> registry tests -> dry-run -> review-ready。
    - model-visible metadata lint 必须早于 tool projection / Host model-visible exposure；package shape 和 registry tests 必须早于 registry publish/review-ready。
    - contract 为每个阶段给出目的、是否必需、阻断目标、建议命令和对应文档，供 CLI、Registry CI、教程和 reviewer 复用。
    - 作者教程、评审教程和 tool projection 文档同步该顺序，避免人工流程与机器 lint 顺序分叉。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- authoring.test.ts`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `pnpm --filter @opencap/spec test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/spec/src/authoring.ts` 和 `packages/spec/src/authoring.test.ts`，导出 `CAPABILITY_AUTHORING_LOOP_VERSION`、`getCapabilityAuthoringLintOrder()`、`getCapabilityAuthoringStage()`、`evaluateCapabilityAuthoringProgress()`、`validateCapabilityAuthoringManifest()` 和 `validateCapabilityAuthoringManifestPath()`；`pnpm validate` 的 registry validation 已改用 authoring manifest validation，因此 manifest schema 通过后会执行 model-visible metadata lint，再校验 registry tests。作者教程、评审教程、tool projection 文档和测试策略已同步 lint 顺序。Spec 测试数从 25 增至 32。
- [x] T276 P1：定义 v0.1-v1.0 release maturity gate matrix。
  - 验收标准：
    - `docs/运营/release-readiness.md` 定义 v0.1、v0.2、v0.3、v0.4、v0.5、v1.0 的 release maturity gate matrix。
    - 每个阶段必须列出发布承诺、硬门禁、证据来源、允许缺口和不得宣称的能力，避免把路线图当成已完成能力。
    - matrix 必须覆盖 Runtime、Registry/Trust、Interop、Policy/Ops、Docs/Release hygiene 五类门禁，并明确哪些 gate 是 hard blocker。
    - Alpha checklist 和版本兼容策略必须引用该 matrix，保持 `0.x` breaking-change 口径和 release gate 口径一致。
    - 文档入口和 handoff 必须指向下一步任务，且 T276 完成后 `next_task.py` 能推进到下一个 ready 任务。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `pnpm validate`
    - `git diff --check`
    - JSON parser 校验 package/schema `package.json`
    - Ruby YAML parser 校验 `.github/**/*.yml` / `.yaml`
  - 完成记录：`docs/运营/release-readiness.md` 已新增 v0.1 Local Runtime、v0.2 Evidence Registry、v0.3 Interop Profiles、v0.4 Adapter Layer、v0.5 Policy Operations、v1.0 Capability Network 的 maturity gate matrix；每个阶段列出发布承诺、hard gates、证据、允许缺口和不得宣称项。`docs/releases/alpha-checklist.md`、`docs/规范/versioning-and-compatibility.md`、`docs/README.md`、`docs/INDEX.md` 和 `docs/SYSTEM.md` 已同步 release maturity 入口和口径。

### 模块 M2：执行安全、审计和可靠性

- [x] T131 P1：实现 `execution.body.fields` 渲染测试。
  - 验收标准：
    - Runtime 测试覆盖 `execution.body.fields` 完整变量渲染：数组、对象、数字、布尔值保留 JSON 类型，不被字符串化。
    - Runtime 测试覆盖静态 JSON body value 保留原值，未被 `execution.body.fields` 引用的 input 不会外发。
    - Runtime 测试覆盖字符串插值中的变量按字符串渲染，缺失变量返回结构化 `UrlTemplateRenderError`。
    - 必填 input 字段被 body full-template 引用但缺失或为 `null` 时，dry-run 必须失败；可选 full-template 字段缺失或为 `null` 时才允许省略。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- index.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/index.test.ts` 新增 `execution.body.fields` required/optional 渲染回归测试，覆盖 full-template JSON 类型保留、静态 JSON value 保留、未引用 input 不外发、必填字段缺失结构化失败和可选字段缺失省略。`packages/runtime/src/index.ts` 现在根据 manifest `input.required` 判断 body full-template 缺失字段，必填字段缺失或为 `null` 会抛出 `URL_TEMPLATE_FIELD_MISSING`，可选字段仍可省略。Runtime 测试数从 188 增至 189。
- [x] T132 P1：实现 audit failure preflight 测试。
  - 验收标准：
    - Runtime 测试覆盖非 `read_only` HTTP Capability 在 audit preflight 失败时返回结构化 `audit_failed` 结果。
    - audit preflight 失败时不得解析 secret、不得发起 HTTP 请求，结果和 preflight evidence 不包含 provider secret 原文。
    - `AuditLogger` 必须提供可写性 preflight 契约；SQLite logger 的 preflight 必须真实触达写入路径且不留下持久化 invocation 记录。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- index.test.ts -t "audit preflight"`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/index.ts` 新增 `AuditLogger.preflight()` 契约、`AuditPreflightCheck`、非 `read_only` HTTP executor audit preflight gate 和结构化 `audit_failed` 结果；audit preflight 失败时在 secret resolution 和 fetch 前返回，Result Envelope 映射为 blocked/audit_failed。`SqliteAuditLogger.preflight()` 使用事务写入并 rollback，验证写路径但不留下 invocation 记录。`packages/runtime/src/index.test.ts` 新增 2 个 audit preflight 测试，Runtime 测试数从 189 增至 191。
- [x] T133 P1：实现 outbound policy 私网阻断测试。
  - 验收标准：
    - Runtime 测试覆盖真实 HTTP 执行在 outbound policy 阻断 localhost/loopback、RFC1918 private IP、link-local 和 metadata service 目标时返回结构化 `outbound_blocked` 结果。
    - outbound block 必须发生在 Secret Resolver 和 HTTP request 之前：不读取 env secret、不调用 fetch，并写入 `requestStarted=false` 的 blocked audit event。
    - blocked audit event 必须记录 outbound decision、target type、reason code 和 resolved URL，且不包含 provider secret 原文。
    - 固定公开 `https` origin 仍可进入后续执行路径；现有本地 HTTP executor 测试必须通过显式测试开关允许 loopback。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- index.test.ts -t "outbound policy"`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/index.ts` 新增 `classifyOutboundTarget()`、`evaluateOutboundPolicy()`、`OutboundPolicyResult` 和 HTTP executor outbound gate。真实执行会在 audit preflight、Secret Resolver 和 fetch 前阻断 localhost/loopback、RFC1918 private IP、link-local、metadata service、non-HTTPS 和 arbitrary URL，返回 `outbound_blocked` / `OUTBOUND_BLOCKED`；block audit event 写入 `outboundDecision`、`outboundTargetType`、`outboundReasonCode`、`resolvedUrl` 和 `requestStarted=false`。`packages/runtime/src/index.test.ts` 新增 9 个 outbound policy 测试，Runtime 测试数从 191 增至 200。现有本地 HTTP executor 测试通过显式 `outboundPolicy.allowLocalhost` 运行。
- [x] T135 P1：按本地状态契约实现 state dir precedence tests。
  - 验收标准：
    - Runtime 测试覆盖 state dir precedence：显式 `stateDir` / CLI `--state-dir` 等价入口优先于 `OPENCAP_STATE_DIR`，`OPENCAP_STATE_DIR` 优先于 `<cwd>/opencap.local` 默认路径。
    - 相对显式路径和相对环境变量路径必须基于 `cwd` 解析；绝对路径必须保持为绝对路径。
    - `ensureLocalStateDir()`、`installCapability()`、`listInstalledCapabilities()`、`loadPolicySet()`、`SqliteAuditLogger` 和 `OpenCapRuntime` 必须使用同一个已解析 state dir，且不会创建被低优先级配置指向的 state dir。
    - 测试必须覆盖 env state dir 和 explicit state dir 的跨入口一致性，避免 CLI/SDK/Runtime helper 使用不同本地状态。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- index.test.ts -t "state dir"`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/index.test.ts` 新增 3 个 state dir precedence 测试，覆盖相对/绝对 state dir 解析、`OPENCAP_STATE_DIR` 跨 `ensureLocalStateDir()` / `installCapability()` / `listInstalledCapabilities()` / `loadPolicySet()` / `SqliteAuditLogger` / `OpenCapRuntime` 一致性，以及显式 `stateDir` 优先于环境变量且不创建低优先级目录。当前实现已满足契约，本轮用临时 env-first 回归确认新增测试能抓住 precedence 破坏；Runtime index 测试数从 85 增至 88，Runtime 包测试数从 200 增至 203。
- [x] T152 P1：把 consent receipt 落入 audit log 字段和测试。
  - 验收标准：
    - `AuditEvent` 能表达 Runtime-owned consent receipt evidence：consent id、decision、decidedAt、channel、subject、input hash 和 policy rule id。
    - `createConfirmationAuditEvent()` 对 `ask` 决策的 approved/rejected/confirmation_required 结果写入 consent receipt；`confirmation_required` 映射为 unavailable，不把 Host 或模型文案当成 receipt。
    - policy allow/deny 这类不需要用户同意的路径不得伪造 consent receipt 字段。
    - `SqliteAuditLogger` 能持久化、迁移并查询 consent receipt 字段，`opencap logs --json` 可从 audit event 输出这些字段。
    - consent receipt 只保存 hash、状态和 Runtime 生成的元数据，不保存 input 原文、secret 或 Authorization 类字段。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- index.test.ts -t "consent receipt"`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/index.ts` 新增 `AuditConsentReceiptEvidence`、consent receipt audit fields 和 `createConsentReceiptAuditEvidence()`；`createConfirmationAuditEvent()` 对 `ask` 的 approved/rejected/confirmation_required 写入 receipt，其中 MCP 无确认通道映射为 `unavailable`，policy allow/deny 不伪造 receipt。`SqliteAuditLogger` 新增 consent receipt columns、迁移、写入和查询恢复；HTTP execution audit event 可携带 approved consent receipt，CLI invoke approved ask 路径会把 receipt 传入执行审计事件。`packages/runtime/src/index.test.ts` 新增 5 个 consent receipt 测试，Runtime index 测试数从 88 增至 93，Runtime 包测试数从 203 增至 208。
- [x] T160 P1：补齐 `auth.scopes` 和 credential descriptor schema 测试。
  - 验收标准：
    - Spec schema 测试覆盖 `api_key` credential descriptor：`provider`、`env`、`placement` 和 `scopes` 必须显式声明。
    - `auth.scopes` 必须是非空、去重、非空字符串数组，能表达 provider 最小权限 review 所需范围。
    - `auth.env` 必须是安全 env var reference，不接受空字符串、小写或带破折号的值；`provider` 必须是稳定 provider slug。
    - custom header placement 的 `name` 必须是安全 header name，不能为空、不能包含非法字符，不能使用 `Authorization` / `Cookie` 等敏感内置 header。
    - `auth.type: none` 不得携带 `provider`、`env`、`placement` 或 `scopes`，避免无凭据能力伪装 credential descriptor。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- index.test.ts -t "auth credential descriptor"`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `pnpm --filter @opencap/spec test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/spec/schema/manifest.schema.json` 收紧 credential descriptor：`api_key` 必须声明 `provider`、`env`、`placement` 和非空唯一 `scopes`；`env` 必须是安全环境变量引用，`provider` 必须是稳定 slug，custom header name 必须是安全 header 且拒绝 `Authorization` / `Cookie` / `Set-Cookie`，`auth.type: none` 不允许携带 credential descriptor 字段。`packages/spec/src/index.test.ts` 新增 5 个 auth credential descriptor 测试，`packages/spec/src/authoring.test.ts` fixture 同步 scopes；spec 测试数从 32 增至 37。
- [x] T161 P1：实现 least-privilege auth lint。
  - 验收标准：
    - `@opencap/spec` 导出可复用的 least-privilege auth lint API，返回结构化 finding，包含 rule、severity、path、message 和 evidence。
    - lint 覆盖 V1 可机器判定的最小权限风险：`auth.provider` 与 `permissions.resource` provider 前缀不一致、read-only permission 携带 write/admin/delete/manage 类 scopes、写/外发/破坏性/财务/代码执行/secret 相关 permission 只声明 read-only scopes、以及 wildcard/full/admin/repo 等明显过宽 scopes。
    - `validateCapabilityAuthoringManifest()` 在 schema 和 model-visible metadata lint 之后执行 least-privilege auth lint；error finding 会作为 authoring validation issue 阻断 registry validation。
    - 现有 registry manifests 继续通过 `pnpm validate`；人工 least-privilege review 仍保留在文档中，lint 不宣称能证明 scope 一定最小。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- auth-lint.test.ts authoring.test.ts`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `pnpm --filter @opencap/spec test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/spec/src/auth-lint.ts` 和 `auth-lint.test.ts`，导出 `lintLeastPrivilegeAuth()` 及结构化 finding 类型；lint 覆盖 provider/resource provider mismatch、read-only permission 携带 elevated scope、elevated permission 只声明 read-only scopes、wildcard/admin/full/repo 等明显过宽 scopes。`validateCapabilityAuthoringManifest()` 已在 schema 和 model-visible metadata lint 后执行 least-privilege auth lint，finding 以 `least-privilege-auth-lint:*` issue 阻断 registry validation。`packages/spec/src/authoring.ts` 已把 least-privilege 阶段命令同步为 `pnpm validate` + manual review；spec 测试数从 37 增至 45。
- [x] T167 P1：将 execution semantics 落入 TypeScript 类型和 audit 字段。
  - 验收标准：
    - Runtime public contract 导出 execution outcome、side-effect kind 和 execution evidence 类型，覆盖 `success`、`blocked`、`failed_before_request`、`failed_after_request`、`unknown_after_timeout`、`partial`。
    - Runtime 提供从 HTTP execution result 生成 execution semantics evidence 的 helper，能基于 permission risk 推导 `read` / `write` / `send` / `destructive` / `financial` / `code_execution`，并记录 `requestStarted`、`httpStatus`、`retryAttempt`、`requestStartedAt` / `responseReceivedAt`。
    - HTTP execution audit event 写入 execution semantics 字段；blocked / pre-request failure 不伪造 request start 时间。
    - SQLite audit logger 能迁移、持久化并查询恢复 execution semantics 字段。
    - Result Envelope evidence 暴露同一套 outcome / side-effect summary，方便 Host 和 CLI 使用结构化语义而不是解析错误文本。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- domain.test.ts result-envelope.test.ts index.test.ts -t "execution semantics"`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/domain.ts` 新增 `ExecutionOutcome`、`ExecutionSideEffectKind` 和扩展后的 `ExecutionEvidence` public contract；`packages/runtime/src/index.ts` 新增 `createHttpExecutionEvidence()`，可从 HTTP result 与 permissions 推导 outcome、side-effect kind、requestStarted、httpStatus、retryAttempt 和 request/response timestamps。HTTP execution audit event、Result Envelope evidence 和 SQLite audit logger 均已写入/恢复 execution semantics 字段。新增测试覆盖 domain contract、Result Envelope evidence、执行审计事件字段和 SQLite 持久化；Runtime 测试数从 208 增至 211。
- [x] T168 P1：实现 unknown outcome audit tests。
  - 验收标准：
    - HTTP executor 在请求发出后 timeout 时写入 audit event，`requestStarted=true`，`executionOutcome=unknown_after_timeout`。
    - timeout audit event 必须包含 `executionRequestStartedAt`，但不得设置 `executionResponseReceivedAt`，避免把未知结果伪装成已收到响应。
    - timeout audit event 的 `executionSideEffectKind` 根据 permissions 推导；写操作为 `write`，`executionRetryAttempt=0`。
    - Result Envelope 的 unknown timeout evidence 与 audit semantics 保持一致。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- index.test.ts result-envelope.test.ts -t "unknown outcome"`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/index.test.ts` 新增注入式 HTTP timeout audit 测试，确认请求已进入 fetch 后 timeout 会写入 `executionOutcome=unknown_after_timeout`、`requestStarted=true`、`executionSideEffectKind=write`、`executionRetryAttempt=0` 和 `executionRequestStartedAt`，且不伪造 `executionResponseReceivedAt`。`packages/runtime/src/result-envelope.test.ts` 同步覆盖 `createHttpExecutionEvidence()` 对 unknown timeout 不写 response timestamp；`createHttpExecutionEvidence()` 已修正只在收到 HTTP response 的 success/http_error 状态写 response timestamp。Runtime 测试数从 211 增至 213。
- [x] T170 P2：实现 retry policy tests。
  - 验收标准：
    - Runtime 提供纯 retry policy decision helper，不在 HTTP executor 中引入自动 retry loop。
    - POST/PATCH 写操作在无 idempotency 声明时，即使遇到 408/429/5xx 也不自动 retry，并给出结构化 reason。
    - 请求发出后的 `unknown_after_timeout` 对写操作必须要求 reconcile，不自动 retry。
    - 401/403 等认证/权限错误不可 retry。
    - GET/read-only 在显式 `automatic=true` 且 `maxAttempts > attempt + 1` 的 retry policy 下，可以对 408/429/5xx 生成 retry decision，并记录下一次 `retryAttempt`。
    - provider idempotency key 只以 hash 形式进入 decision evidence，不暴露明文 key。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- retry-policy.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/retry-policy.ts` 和 `retry-policy.test.ts`，导出 `defaultHttpRetryPolicy()` 与 `evaluateHttpRetryPolicy()` 纯 decision helper。测试覆盖 V1 默认不自动 retry、POST 写操作无 idempotency 不 retry、unknown write timeout 要求 reconcile、401/403 不 retry、显式 read-only GET retry decision、provider idempotency key 只记录 `sha256:<prefix>` hash。HTTP executor 未引入自动 retry loop；Runtime 测试数从 213 增至 219。
- [x] T196 P1：Score cannot override policy tests。
  - 验收标准：
    - Runtime policy evaluation 可接收 quality score 作为 trace/evidence fact，但 policy rule matching 不使用 score。
    - 高 quality score 不能把默认 `ask` 改成 `allow`。
    - 高 quality score 不能覆盖显式 `deny` rule。
    - policy decision trace 记录 `quality_score=<value>`，但 `secretResolutionAllowed` / `executionAllowed` 只由实际 policy decision 决定。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- policy-score.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/policy-score.test.ts`，并在 `PolicyEvaluationInput` / policy decision trace 中记录可观测的 `qualityScore`。测试确认高 quality score 只能进入 `quality_score=<value>` trace fact，不能把默认 `ask` 改成 `allow`，也不能覆盖显式 `deny` rule；`secretResolutionAllowed` 和 `executionAllowed` 仍只由最终 policy decision 决定。Runtime 测试数从 219 增至 221。
- [x] T199 P1：Quota/budget policy gates。
  - 验收标准：
    - Runtime 提供 quota/budget gate 纯 helper，输出统一 `GateDecision`，stage 为 `pre_secret`。
    - count-based quota 超限返回 `deny`，其 gate semantics 不允许 secret resolution 和 execution。
    - quota `ask` 在 gate semantics 中表现为 confirmation_required，不允许直接 execution。
    - budget deny 不能被 trust level 或 quality score 绕过。
    - gate evidence 记录 quota/budget rule id、decision、window 和 remaining，不包含 input/output/secret 原文。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- quota-budget-gate.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/quota-budget-gate.ts` 和 `quota-budget-gate.test.ts`，导出 `evaluateQuotaBudgetGate()` 纯 gate helper。helper 输出统一 `GateDecision`，stage 固定为 `pre_secret`；测试覆盖 count-based quota deny 阻断 secret/execution、quota ask 映射 confirmation_required、budget deny 不被 trust/quality 绕过，以及 quota/budget evidence 不携带 input/output/secret 原文。Runtime 测试数从 221 增至 225。
- [x] T200 P1：Provider rate limit handling。
  - 验收标准：
    - HTTP executor 对 provider 429 返回结构化 rate limit evidence，而不是只给普通 HTTP error 文本。
    - `Retry-After` 秒数和 HTTP date 可解析为 retry recommendation；`RateLimit-Reset` 可解析为 reset timestamp。
    - Rate limit evidence 只保留允许的 header 名称和值派生结果，不记录 secret-like provider header 原文。
    - provider 429 不被当作 policy deny，仍是 request 已发出的 HTTP execution result。
    - 非幂等写操作遇到 provider 429 不自动 retry。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- provider-rate-limit.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：HTTP executor 的 429 `http_error` 结果现在携带 `providerRateLimit` 结构化 evidence，解析 `Retry-After` 秒数/HTTP date 和 `RateLimit-Reset` timestamp，只记录白名单 header 名称与派生时间，不保存 secret-like provider header 原文。新增 `provider-rate-limit.test.ts`，覆盖 429 evidence redaction 和 POST 写操作遇到 429 仍不自动 retry；Runtime 测试数从 225 增至 227。
- [x] T201 P1：Local abuse throttle。
  - 验收标准：
    - Runtime 提供本地 abuse throttle 纯 gate helper，输入为 capability/risk/channel 与本地 usage snapshot，不在 helper 内读写真实日志或状态。
    - throttle gate 在 secret resolution 和 HTTP execution 前运行，超限 `deny` 必须阻断 secret 和 execution。
    - `ask` 可映射为 confirmation required；`warn` 不阻断执行但保留 evidence。
    - evidence 记录 rule id、decision、window、limit、current count、remaining 和 throttle key，不包含 input/output/secret 原文。
    - `external_send` 默认建议更低频率边界，并可通过 helper 生成安全基线规则。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- abuse-throttle.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/abuse-throttle.ts` 和 `abuse-throttle.test.ts`，导出 `evaluateAbuseThrottleGate()` 与 `defaultExternalSendAbuseThrottleRule()`。helper 输出统一 `GateDecision`，stage 固定为 `pre_secret`；测试覆盖本地调用循环 deny 阻断 secret/execution、ask 映射 confirmation_required、warn 作为 allow evidence，以及 `external_send` 默认低频 ask 基线。Runtime 测试数从 227 增至 231。
- [x] T204 P1：Financial consent/spend cap tests。
  - 验收标准：
    - Runtime 提供 financial consent/spend cap 纯 gate helper，不执行支付、不扣费、不读取 secret。
    - `financial` risk 在没有显式 approved consent 时必须返回 `ask`，不能被 `--yes`、trust level 或 quality score 自动放行。
    - 已有 approved consent 后仍必须检查本地 spend cap；超额 budget `deny` 在 secret resolution 和 HTTP execution 前阻断。
    - spend cap evidence 只记录 rule id、decision、window、remaining、currency 和 consent 状态，不记录 input/output/secret 原文或支付账号原文。
    - 非 financial risk 不触发 financial consent gate。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- financial-consent-spend-gate.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/financial-consent-spend-gate.ts` 和 `financial-consent-spend-gate.test.ts`，导出 `evaluateFinancialConsentSpendGate()`。helper 对非 financial risk 直接 allow；financial risk 在没有 approved consent 时返回 `ask`，即使 trust/quality 很高也不能自动放行；approved consent 后仍复用本地 budget gate 检查 spend cap，超额 deny 会在 pre-secret 阶段阻断。`evaluateQuotaBudgetGate()` 同步补齐 budget warn evidence。Runtime 测试数从 231 增至 235。

### 模块 M3：CLI、MCP 和 Host 互操作

- [x] T125 P1：在 `opencap list` 输出 Capability lifecycle/trust card 基础字段。
  - 验收标准：
    - Runtime installed capability summary 包含 lifecycle、trust level、maintainer 和 license 基础字段。
    - 有效 installed capability 的 lifecycle 至少标记为 `installed`；损坏条目标记为 `invalid`，且不阻断其他条目。
    - `opencap list --json` 输出上述字段，字段值来自 manifest metadata 或 Runtime 派生状态。
    - `opencap list` 人类表格展示 lifecycle/trust/maintainer/license/status。
    - 不把 trust/lifecycle 作为授权依据；它们只作为可见化 evidence。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- index.test.ts -t "listInstalledCapabilities"`
    - `pnpm --filter @opencap/cli test -- smoke.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`InstalledCapabilitySummary` 新增 `lifecycle`、`maintainer`、`license` 字段，有效 installed capability 标记为 `installed`，损坏条目标记为 `invalid`。`opencap list --json` 和人类表格都会输出 lifecycle/trust/maintainer/license/status 基础字段；CLI smoke 覆盖 JSON 与人类表格输出。字段只用于可见化 evidence，不参与授权。
- [x] T127 P2：维护 MCP Host 兼容性矩阵。
  - 验收标准：
    - `docs/生态/host-compatibility-matrix.md` 明确目标 Host、profile 覆盖、自动化证据和真实 Host smoke 状态。
    - 矩阵区分 `supported`、`pending-smoke`、`pending-record`、`runtime-owned` 等状态，不能把自动化 adapter tests 误写成真实 Host 兼容通过。
    - Claude Desktop 和 Cursor 在未完成手动 smoke 前保持 `pending-smoke`。
    - 自定义 MCP client 绑定 OpenCap helper tests 作为自动化证据。
    - `docs/生态/interoperability-profiles.md` 指向矩阵维护入口。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
  - 完成记录：`docs/生态/host-compatibility-matrix.md` 新增 2026-05-14 维护状态、profile 覆盖矩阵和维护规则，明确自定义 MCP client 有自动化 helper tests 证据，Claude Desktop/Cursor 仍需真实 Host smoke；`docs/生态/interoperability-profiles.md` 已同步矩阵入口和证据边界。
- [x] T134 P1：按 CLI 契约补齐命令 snapshot tests。
  - 验收标准：
    - CLI snapshot tests 覆盖 `validate` 成功输出、空状态 `list`、空状态 `logs`、空状态 `decision-log export`。
    - CLI snapshot tests 覆盖已安装 capability 的 `list` 人类表格和 `--json` 输出。
    - CLI snapshot tests 覆盖 `policy validate` 用户错误输出和 exit code `1`。
    - 快照必须归一化仓库路径、临时 state dir 和 Node warning pid，不能依赖开发者本机绝对路径。
    - 测试必须使用临时 `--state-dir`，不能写入仓库根目录或真实 `opencap.local/`。
  - 验证方式：
    - `pnpm --filter @opencap/cli test -- command-snapshot.test.ts`
    - `pnpm --filter @opencap/cli test`
    - `pnpm --filter @opencap/cli build`
    - `pnpm --filter @opencap/cli lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/cli/src/command-snapshot.test.ts`，按 TDD 先确认快照占位失败，再固化 CLI 契约输出。测试覆盖 validate/list/logs/decision-log/policy validate 的 stdout、stderr 和 exit code，并归一化 `<repo>`、`<state>` 与 Node SQLite warning pid。
- [x] T136 P1：按 MCP 接口契约增加 tool mapping tests。
  - 验收标准：
    - 测试覆盖多段 capability id、数字/下划线 id 和确定性 tool name 映射。
    - 测试覆盖映射冲突的 fail-fast error name、toolName、capabilityIds 和 message。
    - 测试覆盖 `tools/list` 投影中映射后的 `name`、原始 `metadata.capabilityId`、`inputSchema`、`outputSchema` 和 projection metadata。
    - 测试覆盖 `tools/call` 只能通过映射后的 tool name 路由；原始 capability id 作为 tool name 时返回 `TOOL_NOT_FOUND` 且不执行。
    - 测试不得依赖真实 MCP Host、外部网络或真实 state dir。
  - 验证方式：
    - `pnpm --filter @opencap/mcp test -- tool-mapping-contract.test.ts`
    - `pnpm --filter @opencap/mcp test`
    - `pnpm --filter @opencap/mcp build`
    - `pnpm --filter @opencap/mcp lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/mcp/src/tool-mapping-contract.test.ts`，按 TDD 先确认三个占位快照失败，再固化 MCP mapping contract。测试覆盖 deterministic id->tool name mapping、collision diagnostics、tools/list projection mapping 和 tools/call reverse lookup 边界；MCP 包测试数从 18 增至 21。
- [x] T137 P1：实现错误模型和 exit code tests。
  - 验收标准：
    - CLI 测试覆盖用户可修正错误 exit code `1`，并确认不会被归类为内部错误 exit `2`。
    - `invoke` 未安装 capability 返回 exit `1`，stderr 可读，stdout 为空，不输出 stack trace。
    - `invoke --input-json` 非法 JSON 返回 exit `1`，stderr 不泄露 `SyntaxError` stack。
    - `logs --limit` 非法值返回 exit `1`，stderr 不输出 stack trace。
    - 修复不能改变 Result Envelope `isError` 输出仍走 stdout 的契约。
  - 验证方式：
    - `pnpm --filter @opencap/cli test -- error-exit-code.test.ts`
    - `pnpm --filter @opencap/cli test`
    - `pnpm --filter @opencap/cli build`
    - `pnpm --filter @opencap/cli lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/cli/src/error-exit-code.test.ts`，按 TDD 确认 missing capability、invalid `--input-json` 和 invalid `--limit` 原先返回 exit `2`。`packages/cli/src/index.ts` 新增 `CliUserInputError`，将用户输入错误、无效 option 和未安装 capability 映射为 exit `1`，stderr 不打印 stack；CLI 包测试数从 3 增至 5。
- [x] T142 P2：维护 Host compatibility test records。
  - 验收标准：
    - `docs/生态/host-compatibility-matrix.md` 维护 `opencap.host.record.v1` 风格的 Host compatibility test records。
    - 自定义 MCP client 记录必须绑定 OpenCap commit、test date、profile、capability、checks、evidence 和 known gaps。
    - Claude Desktop 和 Cursor 在未完成真实 Host smoke 前必须保持 `pending-smoke` / `not-run`，不能写成 `pass`。
    - 记录必须区分自动化 adapter evidence 与第三方 Host UI smoke evidence。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`docs/生态/host-compatibility-matrix.md` 新增 Host Compatibility Test Records，记录 custom MCP client 的 `opencap.mcp.tools.v1` 与 `opencap.mcp.result.v1` 自动化 pass 证据，并新增 Claude Desktop/Cursor `pending-smoke` 记录。所有记录都绑定 2026-05-14、OpenCap commit `0f819cb`、profile、capability、checks、evidence 和 known gaps，且明确自动化 helper tests 不等同真实 Host UI smoke。
- [x] T143 P2：从 audit log 派生本地指标命令草案。
  - 验收标准：
    - `docs/运营/observability-metrics-v1.md` 明确 `opencap metrics` 仍是未来命令草案，不把未实现能力写成已完成。
    - 草案至少覆盖 summary、capabilities、security 三类本地指标视图。
    - 草案列出参数、示例输出、JSON shape、字段来源和隐私边界。
    - 指标只能从本地 SQLite audit log 的脱敏 operational metadata 派生，不能输出 input/output/secret/provider raw body。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`docs/运营/observability-metrics-v1.md` 新增本地指标命令草案，定义未来 `opencap metrics summary`、`opencap metrics capabilities` 和 `opencap metrics security` 的参数、输出示例、JSON shape、字段来源与隐私边界。文档明确当前已实现入口仍是 `opencap logs` 和 `opencap decision-log export`，metrics 命令尚未实现。
- [x] T154 P2：维护 Host compatibility evidence records。
  - 验收标准：
    - `docs/生态/interoperability-profiles.md` 定义 `opencap.host.evidence.v1` 的最小记录字段和使用边界。
    - `docs/生态/host-compatibility-matrix.md` 为已有 custom MCP client pass 记录补充自动化 evidence records。
    - Claude Desktop 和 Cursor 只补充 version-detection/pending-smoke evidence records，不把版本识别误写成 Host 兼容通过。
    - evidence records 明确证据类型、来源命令/路径、隐私边界、限制，并说明自动化 adapter 证据不能替代第三方 Host UI smoke。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`docs/生态/interoperability-profiles.md` 新增 `opencap.host.evidence.v1`，定义 Host compatibility evidence record 的 profile、host_record、Host/version、OpenCap commit、observed_at、evidence_kind、source、privacy 和 limitations 字段。`docs/生态/host-compatibility-matrix.md` 新增 4 条 evidence records：custom MCP client tools/result 自动化 pass 证据，以及 Claude Desktop/Cursor version-detection + pending-smoke 证据。所有记录都明确不保存 raw input/output/secret，且自动化测试不等同第三方 Host UI smoke。
- [x] T156 P2：MCP elicitation profile RFC。
  - 验收标准：
    - 新增 RFC 明确 `opencap.mcp.elicitation.v1` 是未来 profile 草案，不把 MCP elicitation 写成当前已实现能力。
    - RFC 覆盖 capability negotiation、Runtime `ConsentRequest` 到 MCP `elicitation/create` form mode 的映射、Host response 到 consent receipt 的映射。
    - RFC 明确 form mode 只能用于确认，不能采集 password、API key、access token、payment credential 或下游 OAuth code。
    - RFC 保持 OpenCap 安全不变量：policy/gates、egress、secret resolution、execution、audit 顺序不变；Host 支持 elicitation 不能把 `ask` 改成 `allow`。
    - 现有 MCP interface、consent 和 interoperability profile 文档链接到 RFC，并保留无 elicitation Host 的 `confirmation_required` 默认行为。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `rfcs/0010-mcp-elicitation-profile-v1.md`，定义 `opencap.mcp.elicitation.v1` 草案，覆盖 Host capability negotiation、form-mode confirmation mapping、consent decision mapping、URL mode 边界、安全不变量、result/evidence 和未来测试计划。`docs/设计/mcp-interface-v1.md`、`docs/设计/confirmation-and-consent-v1.md`、`docs/生态/interoperability-profiles.md`、`docs/README.md`、`docs/INDEX.md` 和 `docs/SYSTEM.md` 已同步引用。RFC 参考 MCP 2025-11-25 elicitation 规格，并明确当前 V1 仍默认 `confirmation_required`。
- [x] T157 P2：A2A Agent Card mapping RFC。
  - 验收标准：
    - 新增 RFC 明确 `opencap.a2a.agent_card_mapping.v1` 是 future profile 草案，不把 OpenCap V1 写成已实现 A2A server。
    - RFC 明确 OpenCap Capability 不是 autonomous Agent，推荐以一个 OpenCap Runtime deployment 映射为 A2A Agent Card，已安装 Capability 映射为 Agent Skill。
    - RFC 覆盖 Agent Card 字段映射、AgentSkill 字段映射、OpenCap-specific extension、A2A request 到 Runtime invocation 的调用边界。
    - RFC 保持安全不变量：Agent Card/Skill 只用于发现，不能替代 Trust Card、policy、consent、downstream provider auth 或 audit。
    - 现有 protocol positioning、interoperability profile、整体系统设计和文档入口链接到 RFC。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `rfcs/0011-a2a-agent-card-mapping-v1.md`，定义 `opencap.a2a.agent_card_mapping.v1` 草案，覆盖 A2A Agent Card/AgentSkill 映射、OpenCap extension、调用边界、Result Envelope 到 A2A task/artifact 的映射、安全不变量、evidence 和测试计划。RFC 参考 A2A v0.3.0 官方规范，并明确 V1 不实现 A2A server、不把 Capability 伪装成 Agent。`docs/协议/protocol-positioning.md`、`docs/设计/整体系统设计-v1.md`、`docs/生态/interoperability-profiles.md`、`docs/README.md`、`docs/INDEX.md` 和 `docs/SYSTEM.md` 已同步引用。
- [x] T163 P2：Remote Runtime OAuth profile RFC。
  - 验收标准：
    - 新增 RFC 明确 `opencap.remote_runtime.oauth.v1` 是 future profile 草案，不把 remote runtime 或 OAuth server 写成当前 V1 已实现能力。
    - RFC 区分 Host/client 到 OpenCap Remote Runtime、OpenCap 到 downstream provider、Registry/Admin Plane 三段授权边界。
    - RFC 明确 resource indicators、protected resource metadata、scope 模型、header-only bearer token、401/403 challenge 和 token validation evidence。
    - RFC 明确 inbound token 不能透传为 downstream provider token，scope 不能替代 Runtime policy/consent/audit。
    - 现有 remote OAuth boundary、ADR、文档入口和 SYSTEM 状态同步链接到 RFC。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `rfcs/0012-remote-runtime-oauth-profile-v1.md`，定义 `opencap.remote_runtime.oauth.v1` 草案，覆盖三段授权边界、RFC 8707 resource indicators、RFC 9728 protected resource metadata、scope 模型、downstream provider credential separation、token validation evidence、401/403 challenge、adapter profile 关系、安全不变量和测试计划。`docs/生态/oauth-and-remote-runtime-boundary.md`、`docs/决策/0029-remote-runtime-oauth-requires-new-profile.md`、`docs/README.md`、`docs/INDEX.md` 和 `docs/SYSTEM.md` 已同步引用。RFC 明确 V1 仍是 local runtime/env provider，不实现 remote OAuth。
- [x] T271 P1：定义 Interoperability Profile evidence record schema。
  - 验收标准：
    - 新增文档定义统一 `opencap.interop.evidence.v1` schema，覆盖 Host、adapter、runtime、registry、auth、resource 和 RFC evidence。
    - schema 明确必填字段、枚举、privacy/redaction 规则、profile 等级映射、compatibility record 关系和迁移要求。
    - 现有 `opencap.host.evidence.v1` 被标记为 Host 场景早期别名，新增记录应使用统一 schema。
    - T156/T157/T163 RFC 的 evidence 章节引用统一 schema。
    - README/INDEX/SYSTEM/traceability/HANDOFF 同步入口和任务状态。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `docs/生态/interoperability-evidence-record-schema.md`，定义统一 `opencap.interop.evidence.v1` schema，包含 record shape、字段定义、subject/evidence/result/check 枚举、隐私规则、profile 等级映射、compatibility record 关系、Host 自动化证据示例、RFC 草案证据示例和迁移要求。`docs/生态/interoperability-profiles.md` 和 `docs/生态/host-compatibility-matrix.md` 已把 `opencap.host.evidence.v1` 标记为早期 Host alias；`rfcs/0010/0011/0012` 已改为引用统一 schema；`docs/README.md`、`docs/INDEX.md`、`docs/SYSTEM.md` 和 `docs/规划/traceability-matrix.md` 已同步入口与追踪。

### 模块 M4：Registry、Trust、Lifecycle 和供应链

- [x] T126 P1：把发布门禁整理成可执行 release checklist。
  - 验收标准：
    - 新增通用 release checklist，能按阶段逐项执行发布前验证、hard gate 核对、evidence 记录和发布/阻断决策。
    - checklist 覆盖 v0.1-v1.0 阶段、通用 hard gates、阶段 hard gates、基础验证命令和 release evidence 模板。
    - `docs/运营/release-readiness.md` 和 `docs/releases/alpha-checklist.md` 明确 release checklist 与 maturity gate matrix/alpha gate 的关系。
    - README、INDEX、SYSTEM 和 traceability matrix 同步新入口。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `docs/releases/release-checklist.md`，把发布流程整理为确认阶段、检查工作区、运行验证命令、核对通用 hard gates、核对阶段 hard gates、写 release evidence、发布或阻断七步。清单覆盖 v0.1 Local Runtime 到 v1.0 Capability Network，并提供 release evidence YAML 模板和 secret/raw data 禁止规则。`docs/运营/release-readiness.md`、`docs/releases/alpha-checklist.md`、`docs/README.md`、`docs/INDEX.md`、`docs/SYSTEM.md` 和 `docs/规划/traceability-matrix.md` 已同步入口与关系。
- [x] T129 P2：补充 Registry 供应链 review 工作流。
  - 验收标准：
    - 新增 Registry 供应链 review 工作流，覆盖 PR source、package shape、manifest/schema、model-visible metadata、permission/risk/auth、endpoint/data egress、tests/evidence、trust/lifecycle/advisory、merge evidence 和合并后检查。
    - 工作流明确 secret、token passthrough、隐藏外发、权限低估、伪装 trust level、任意 URL 未标风险等阻断条件。
    - Registry 指南、Capability review checklist、供应链治理文档、registry README 和文档入口链接到供应链 review 工作流。
    - 工作流提供可复制的 review evidence YAML，且明确不得保存 token、provider raw response、私有日志或 input/output 原文。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `docs/社区/registry-supply-chain-review.md`，定义 Registry Capability PR 的供应链 review 工作流和 merge evidence 模板。`docs/社区/registry-guidelines.md`、`docs/社区/capability-review-checklist.md`、`docs/安全/supply-chain-governance.md`、`registry/README.md`、`docs/README.md`、`docs/INDEX.md` 和 `docs/SYSTEM.md` 已同步入口。
- [x] T139 P1：CI 安全基线 workflow。
  - 验收标准：
    - 新增 GitHub Actions 安全基线 workflow，默认只读权限，不使用 `pull_request_target`。
    - workflow 至少覆盖仓库卫生检查、workflow 权限审计和 PR dependency review。
    - 仓库卫生检查阻断 `.env`、`opencap.local/`、SQLite/DB 等本地状态或 secret-shaped 文件。
    - 文档说明当前已实现的安全基线和后续 CodeQL/OpenSSF Scorecard 缺口。
    - release checklist 引用安全基线 workflow 作为发布前检查项。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `.github/workflows/security-baseline.yml`，包含 repository hygiene、workflow permissions audit 和 dependency-review 三个 job，默认 `contents: read`，PR dependency review 使用 `actions/dependency-review-action@v4` 并在 high severity 阻断。`docs/运营/ci-security-baseline.md` 记录已实现基线和 CodeQL/Scorecard 后续缺口；`docs/releases/release-checklist.md` 已把 Security Baseline workflow 加入发布前检查项。
- [x] T140 P1：把 Capability 分类落入 Registry 指南。
  - 验收标准：
    - `docs/社区/registry-guidelines.md` 明确 Registry 目录分类规则、当前 V1 分类表、`metadata.category` 与目录一致性要求，以及分类不参与授权的边界。
    - `registry/README.md` 同步分类表和提交流程，外部贡献者能从根目录说明选择分类并知道新增分类条件。
    - Capability review checklist 和 review 教程把分类检查纳入 PR 合并前人工 review。
    - 文档入口和追踪矩阵能从 Capability 贡献路径指向分类体系。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`docs/社区/registry-guidelines.md` 已新增 Capability 分类章节，覆盖当前 V1 分类表、目录/manifest 一致性、新增分类条件、分类不参与授权和分类迁移影响。`registry/README.md`、`docs/社区/capability-review-checklist.md`、`docs/教程/review-a-capability.md`、`docs/教程/write-a-capability.md`、`docs/README.md`、`docs/INDEX.md`、`docs/SYSTEM.md` 和 `docs/规划/traceability-matrix.md` 已同步分类入口和 review 规则。
- [x] T141 P1：把 Capability Review Checklist 接入 PR 流程。
  - 验收标准：
    - `.github/PULL_REQUEST_TEMPLATE.md` 对修改 `registry/**` 的 PR 提供 Capability Registry 自查区块，并链接/引用 Registry 供应链 Review 工作流和能力评审清单。
    - 自查区块覆盖目录分类、manifest/README/tests、`type: http`、权限/风险/auth/execution 一致性、secret 禁止和 `pnpm validate` 结果。
    - Capability submission issue template 引导提交者提前提供分类、权限风险、模型可见文本和 review checklist 自查。
    - Contributor journey、maintainer guide、Registry README 和 review 教程同步 issue/PR/checklist 流程。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`.github/PULL_REQUEST_TEMPLATE.md` 已新增 “Capability Registry PR” 区块，把 Registry 供应链 Review 工作流、能力评审清单、分类一致性、manifest/README/tests、`type: http`、权限/风险/auth/execution、secret 禁止和 `pnpm validate` 纳入 PR 自查。`.github/ISSUE_TEMPLATE/capability_submission.yml` 已新增分类选择和 review checklist 自查；`docs/社区/contributor-journey.md`、`docs/社区/maintainer-guide.md`、`registry/README.md` 和 `docs/教程/review-a-capability.md` 已同步 issue/PR/checklist 流程。
- [x] T144 P2：补充 RFC 模板文件。
  - 验收标准：
    - 新增可复制的 RFC 模板文件，覆盖状态、元数据、摘要、背景、目标、非目标、术语、设计、示例、安全隐私、兼容迁移、验证计划、发布运维、替代方案、开放问题和决策结果。
    - 模板明确禁止真实 token、私有 URL、用户数据、生产日志和 provider raw response 进入 RFC 示例。
    - RFC 流程文档指向模板文件，不再只保留短代码块。
    - design/RFC issue template 和文档入口能引导贡献者找到模板。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `rfcs/TEMPLATE.md`，提供 RFC 状态、元数据、设计、安全隐私、兼容迁移、验证计划、发布运维和决策结果模板，并明确示例不得包含 secret/raw data。`docs/社区/rfc-process.md` 已改为要求复制模板；`.github/ISSUE_TEMPLATE/design_rfc.yml`、`docs/README.md` 和 `docs/INDEX.md` 已同步模板入口。
- [x] T147 P2：Registry index signing RFC 草案。
  - 验收标准：
    - 新增 Registry index signing RFC 草案，定义 signed index profile、index envelope、capability entry digest、signature metadata 和 verification evidence。
    - RFC 明确 signed index 只证明来源和完整性，不证明 Capability 安全、不提升 trust level、不绕过 review、manifest validation、policy、confirmation、outbound policy 或 audit。
    - RFC 保持 V1 Git-based local registry/install 主路径，不要求实现 remote install、mirror sync、Sigstore/cosign 或 OCI artifact。
    - Registry distribution、signing/provenance roadmap 和文档入口链接到该 RFC。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `rfcs/0013-registry-index-signing-v1.md`，定义 `opencap.registry.index_signing.v1` 草案、index envelope、manifest/index digest、signature metadata、verification evidence、failure semantics、compatibility/migration 和 future implementation tests。`docs/生态/registry-distribution.md`、`docs/安全/signing-and-provenance-roadmap.md`、`docs/README.md`、`docs/INDEX.md` 和 `docs/SYSTEM.md` 已同步入口和边界。
- [x] T148 P1：npm trusted publishing workflow 草案。
  - 验收标准：
    - 新增 npm trusted publishing workflow 草案文档，覆盖 npm 侧 trusted publisher 配置、GitHub environment、draft workflow、hard gates、provenance evidence、回滚/事故处理和后续实现任务。
    - 草案明确不使用长期 `NPM_TOKEN` / `NODE_AUTH_TOKEN` 发布，不在未配置 npm trusted publisher 和 `npm-production` environment 前启用真实 workflow。
    - 草案基于当前 npm 官方文档说明 OIDC provider、Node/npm 最低要求、automatic provenance 条件和 token access 限制建议。
    - Package publishing strategy、signing/provenance roadmap、release checklist 和文档入口链接到草案。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `docs/运营/npm-trusted-publishing-workflow.md`，定义 OpenCap npm trusted publishing 草案，覆盖 GitHub Actions OIDC、`npm-production` environment、manual dispatch + dry-run workflow、package tarball review、provenance evidence、长期 token 禁止和 rollback/incident 流程。`docs/运营/package-publishing-v1.md`、`docs/安全/signing-and-provenance-roadmap.md`、`docs/releases/release-checklist.md`、`docs/README.md`、`docs/INDEX.md` 和 `docs/SYSTEM.md` 已同步入口。
- [x] T151 P1：实现 Capability Package lint。
  - 验收标准：
    - `@opencap/spec` 导出可复用 Capability package lint API，能验证单个 package 和 registry path。
    - Package lint 检查 `manifest.yml`、`README.md`、`tests/basic.yml` 或等价 registry test 是否存在。
    - Package lint 检查 manifest `id` 与 package 目录名一致、`metadata.category` 与 Registry 分类目录一致。
    - Package lint 阻断 `.env`、`.env.*`、`opencap.local/`、SQLite/DB 等本地状态或 secret-shaped 文件进入 Capability package。
    - `pnpm validate` 在 Registry validation 中执行 package lint，package shape 失败会阻断 registry publish/review-ready。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- package-lint.test.ts`
    - `pnpm --filter @opencap/spec test`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/spec/src/package-lint.ts` 和 `package-lint.test.ts`，导出 `validateCapabilityPackage()`、`validateCapabilityPackagePath()`、`findCapabilityPackageDirs()` 及 package lint result/issue 类型。Lint 覆盖 manifest/README/tests、id/category path 一致性、`.env`、`opencap.local/` 和 SQLite/DB 禁止项；`packages/spec/src/validate-registry.ts` 已在 `pnpm validate` 中输出并阻断 Capability package lint 结果。Spec 测试数从 45 增至 50。
- [x] T158 P1：Trust Card generation rules。
  - 验收标准：
    - Runtime 导出 `createTrustCardFromInstalledCapability()`，能从 `InstalledCapabilityRecord` 生成 Trust Card。
    - 生成规则从 installed capability identity、manifest metadata、trust summary、review/test evidence 和 provenance digest 派生 trust level、lifecycle、advisories、maintainer、provenance、limitations 和 disclaimer。
    - Trust Card 默认不读取 secret、不保存 provider raw response、不保存 input/output 原文，并明确 trust level 不覆盖 local policy、consent、outbound policy 或 audit。
    - 文档说明 Trust Card 字段生成规则和非授权边界。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- card.test.ts`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/card.ts` 新增 `createTrustCardFromInstalledCapability()` 和生成规则类型，从 installed capability 派生 trust/advisory/maintainer/provenance/limitations，并保留 Trust Card disclaimer。`packages/runtime/src/card.test.ts` 新增 installed capability Trust Card 生成规则测试和 root export 断言；`docs/生态/trust-model-v1.md` 已补齐 Trust Card 生成规则和边界。Runtime 测试数从 235 增至 236。
- [x] T185 P1：Trust level transition tests。
  - 验收标准：
    - Runtime 导出 `evaluateTrustLevelTransition()`，能评估 trust level upgrade、downgrade、freeze、revoke 和 noop。
    - 升级必须逐级发生，并按目标等级检查 manifest/package/review、registry tests/conformance、maintainer verification、least-privilege review、release gate 等 evidence。
    - High open advisory 或 failing registry tests 会冻结升级；撤销必须提供 revocation/advisory reference。
    - Transition decision 固定 `policyEffect: "none"`，只表达 registry/review evidence，不覆盖 local policy、consent 或 execution gate。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- trust-transition.test.ts`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/trust-transition.ts` 和 `trust-transition.test.ts`，导出 `evaluateTrustLevelTransition()` 及 transition 类型。测试覆盖逐级升级、跳级升级拒绝、High advisory/failing tests 冻结、downgrade/revoke 不授予 policy 权限；Runtime 测试数从 236 增至 240。
- [x] T186 P1：Revoked capability invoke warning/deny behavior。
  - 验收标准：
    - Runtime 导出 `evaluateRevokedCapabilityInvokeGate()`，返回标准 `GateDecision`，gateId 为 `lifecycle`，stage 为 `pre_secret`。
    - revoked 的 `write`、`external_send`、`destructive`、`financial`、`code_execution`、`secret_access` 和 `unknown` 风险默认 `deny`，且 evidence 标记 `requestStarted: false`。
    - revoked `read_only` 未显式 override 时返回 `ask`；显式 override 后才允许执行，并保留 warning/advisory evidence。
    - 非 revoked 能力通过 lifecycle gate，但 `policyEffect: "none"`，不授予额外 policy 权限。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- lifecycle-gate.test.ts`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/lifecycle-gate.ts` 和 `lifecycle-gate.test.ts`，导出 revoked invoke lifecycle gate helper。测试覆盖 revoked 写/高风险 pre-secret deny、revoked read-only ask、read-only explicit override allow，以及非 revoked 不改变 policy 权限；Runtime 测试数从 240 增至 244。
- [x] T187 P1：Capability advisory YAML schema。
  - 验收标准：
    - `@opencap/spec` 提供 `packages/spec/schema/capability-advisory.schema.json`，固定 advisory V1 的 id、capability、affected_versions、type、severity、status、timestamps 和 actions 字段。
    - Spec public API 导出 `validateCapabilityAdvisory()`、`validateCapabilityAdvisoryFile()`、`validateCapabilityAdvisoryPath()` 和相关类型。
    - Schema 覆盖 `freeze/yank/revoke` registry action 与 `warn/ask/deny` runtime default，支持 revoked/published lifecycle status。
    - `pnpm validate` 能校验 registry 中已有 advisory 文件，但不要求每个 Capability 都必须有 advisory。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- advisory.test.ts`
    - `pnpm --filter @opencap/spec test`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `pnpm --filter @opencap/runtime test -- package-exports.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/spec/schema/capability-advisory.schema.json`、`packages/spec/src/advisory.test.ts`，并在 `packages/spec/src/index.ts` 导出 advisory validator/path helper/types；`validate-registry.ts` 已在存在 advisory 文件时校验。`packages/spec/package.json` 暴露 advisory schema 公共子路径，`package-exports.test.ts` 已锁定。Spec 测试数从 50 增至 54。
- [x] T188 P1：Revocation metadata in registry。
  - 验收标准：
    - Registry 包含至少一条通过 `opencap.capability_advisory.v1` schema 校验的 revoked metadata record。
    - Revocation metadata 指向具体 capability 和 affected version，并包含 `status: revoked`、`actions.registry: revoke`、`actions.runtime_default: deny`。
    - Revoked capability 的目录和历史记录保留，不通过删除目录隐藏影响范围。
    - `pnpm validate` 能校验该 revocation metadata。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- advisory.test.ts`
    - `pnpm --filter @opencap/spec test`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `registry/advisories/OCAP-2026-0001.yml`，将 `http.request_demo` 标记为 revoked metadata，保留 capability 目录作为历史和测试样例。`packages/spec/src/advisory.test.ts` 新增 registry revocation metadata 校验，`registry/README.md` 与 `docs/生态/capability-deprecation-and-revocation.md` 已说明 advisory/revocation metadata 路径和保留规则。Spec 测试数从 54 增至 55。
- [x] T189 P1：Installed capability advisory check。
  - 验收标准：
    - Runtime 导出 `checkInstalledCapabilityAdvisories()`，能读取本地 installed capabilities 与 Registry advisory metadata。
    - 检查按 capability id 和 affected version 匹配 advisory，返回 advisory id、severity、status、registry action、runtime default、summary 和 fixed version。
    - 检查结果不包含 input/output 原文、secret 或 provider response。
    - 无关已安装能力不报告 advisory。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- advisory-check.test.ts`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/advisory-check.test.ts`，并在 Runtime root API 中导出 `checkInstalledCapabilityAdvisories()` 及结果类型。Helper 读取本地 installed capability 与 registry advisory metadata，匹配 `http.request_demo@0.1.0` -> `OCAP-2026-0001` revoked advisory，并确认无关能力不报告 advisory。Runtime 测试数从 244 增至 246。
- [x] T191 P1：Lifecycle status schema for deprecated/yanked/revoked。
  - 验收标准：
    - Manifest schema 支持可选顶层 `lifecycle` 对象，状态枚举为 `deprecated`、`yanked`、`revoked`。
    - `lifecycle` 必须包含 `status`、`reason` 和 `since`；`revoked` 必须携带 advisory id。
    - `lifecycle` 拒绝未知状态、未知字段和不合法 advisory/replacement/date 形状。
    - `@opencap/spec` 导出 lifecycle metadata 类型，供 Runtime/CLI 后续安装、列表和调用警告复用。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- index.test.ts -t lifecycle`
    - `pnpm --filter @opencap/spec test`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/spec/schema/manifest.schema.json` 新增 `lifecycle` schema，`packages/spec/src/index.ts` 导出 `CapabilityManifestLifecycleStatus` 和 `CapabilityManifestLifecycle`，`packages/spec/src/index.test.ts` 覆盖 deprecated/yanked/revoked 合法状态、未知状态、未知字段和 revoked 缺少 advisory。Spec 测试数从 55 增至 57。
- [x] T192 P1：Install/list/invoke lifecycle warnings。
  - 验收标准：
    - Runtime 提供统一 `createCapabilityLifecycleWarning()`，install/list/invoke 共用同一 warning shape。
    - `installCapability()` 对 deprecated/yanked/revoked manifest 返回结构化 warnings，且不改变安装授权语义。
    - `listInstalledCapabilities()` 暴露 manifest lifecycle status 和 `lifecycleWarning`，无 lifecycle 的能力仍显示 `installed`。
    - CLI install/list/invoke 在非 JSON 输出中打印 lifecycle warning；JSON 输出保持结构化且不混入额外文本。
    - Warning 明确 `policyEffect: none`，不能覆盖 Runtime policy、confirmation 或 audit。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- index.test.ts -t "capability lifecycle warnings"`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/cli lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/runtime/src/index.ts` 新增 `CapabilityLifecycleWarning`、`createCapabilityLifecycleWarning()`，install 返回 warnings，list 摘要暴露 lifecycle status 和 warning；`packages/cli/src/index.ts` 在 install/list/invoke 非 JSON 输出中打印 warning。`packages/runtime/src/index.test.ts` 覆盖 install、list 和 invoke preparation warning；Runtime 测试数从 246 增至 247。
- [x] T193 P2：Registry search excludes yanked/revoked by default。
  - 验收标准：
    - `@opencap/spec` 导出 `searchRegistryCapabilities()`，基于 registry manifest validation 返回可发现能力。
    - 默认搜索结果排除 `lifecycle.status: yanked` 和 `revoked` 的能力，deprecated 仍可发现。
    - 显式 `includeLifecycle: ["yanked", "revoked"]` 时可返回被隐藏的能力，并保留 `excludedByLifecycle` evidence。
    - 搜索结果不改变安装或执行授权，不包含 secret/input/output/provider response。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- registry-search.test.ts`
    - `pnpm --filter @opencap/spec test`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/spec/src/registry-search.test.ts`，`packages/spec/src/index.ts` 导出 registry search helper 和结果类型。默认搜索会返回 active/deprecated，隐藏 yanked/revoked，并在显式 include 时返回完整结果。Spec 测试数从 57 增至 58。
- [x] T194 P2：Quality score rubric implementation draft。
  - 验收标准：
    - Runtime 导出 `calculateCapabilityQualityScore()` 和 `opencap.quality_score.v1` rubric version。
    - Rubric 按 manifest/docs/tests/security/maintenance/compatibility/evidence 七个维度计算 0-100 total。
    - 结果映射到 incomplete/experimental/listed/tested/verified band，并保留各维度得分、generatedAt 和 `policyEffect: none`。
    - 维度分数被限制在文档定义权重内，质量分不能成为授权来源。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- quality-score.test.ts`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/quality-score.ts` 和 `quality-score.test.ts`，root entrypoint 导出 `calculateCapabilityQualityScore()`、rubric version 和类型。Helper 按文档权重计算 total/band，clamp 维度分数，并固定 `policyEffect: none`。Runtime 测试数从 247 增至 249。
- [x] T195 P2：Trust Card includes quality score。
  - 验收标准：
    - Trust Card 的 `quality` 字段承接 `opencap.quality_score.v1` 完整结构：rubricVersion、total、band、dimensions、generatedAt 和 `policyEffect: none`。
    - `createTrustCardFromInstalledCapability()` 可接收 `calculateCapabilityQualityScore()` 的输出并原样写入 Trust Card。
    - 带 quality score 的 Trust Card 默认 limitations 明确说明质量分只是解释性 evidence，没有 policy effect。
    - Trust Card 仍不读取 secret、provider 原始响应、input/output 原文，质量分不参与授权决策。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- card.test.ts`
    - `pnpm --filter @opencap/runtime test`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`TrustCardQualitySummary` 已收紧为完整 `CapabilityQualityScore` 结构；`card.test.ts` 覆盖 Trust Card 接收 `calculateCapabilityQualityScore()` 输出、保留 total/band/dimensions/policyEffect，并在 limitations 中声明 quality score 无 policy effect。Runtime 测试数保持 249。
- [x] T272 P2：设计 Registry index/cache/sync RFC。
  - 验收标准：
    - 新增 RFC 草案定义 `opencap.registry.index_cache_sync.v1` profile。
    - RFC 覆盖 index entry、local cache layout、sync state、sync evidence、install candidate 和失败语义。
    - RFC 明确 index/cache/sync 只用于 discovery 和来源证据，不改变 V1 Git-based install 主路径，不绕过 manifest validation、package lint、policy、confirmation、outbound policy 或 audit。
    - Registry distribution、文档索引、traceability 和系统概览已链接新 RFC。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `rfcs/0014-registry-index-cache-sync-v1.md`，定义 future Registry index/cache/sync profile、cache 存储位置、sync pipeline、install candidate 验证和 redacted sync evidence。`docs/生态/registry-distribution.md`、`docs/README.md`、`docs/规划/traceability-matrix.md`、`docs/SYSTEM.md` 和 `docs/DECISIONS.md` 已同步入口和口径。
- [x] T274 P2：为 SLSA/Sigstore provenance 预留 package 和 release metadata。
  - 验收标准：
    - Manifest schema 新增可选 `provenance` 对象，支持 package source/digest/buildType 和 release publisher/provenance/workflow/attestation/transparency log metadata。
    - `provenance.policyEffect` 必须固定为 `none`，provenance 不能作为 trust level、install policy 或 Runtime policy 的授权来源。
    - Schema 拒绝伪造 policy/trust authority 的 provenance metadata，并限制 digest/path 基础格式。
    - Capability package、package publishing、signing/provenance roadmap、traceability 和测试文档已同步字段含义和验证边界。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- index.test.ts -t provenance`
    - `pnpm --filter @opencap/spec test`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`packages/spec/schema/manifest.schema.json` 新增 top-level `provenance` schema；`CapabilityManifest` 导出 package/release provenance 类型；`index.test.ts` 覆盖 SLSA/Sigstore/npm provenance 预留字段和 `policyEffect: none` 负向约束。Spec 测试数从 58 增至 60。

### 模块 M5：Conformance、Abuse Cases、隐私和运维

- [x] T116 P1：维护术语表和文档索引。
  - 验收标准：
    - 新增或更新中文术语表，覆盖 Capability、Runtime、Registry、policy、audit、Trust Card、Quality Score、provenance、SLSA/Sigstore、MCP 和 Result Envelope 等高频术语。
    - `docs/README.md` 的优先阅读路径包含术语表。
    - `docs/INDEX.md` 的核心入口、阅读路径和维护规则包含术语表。
    - 术语定义明确哪些字段只作为 evidence，不能替代 policy、consent、audit 或 review。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `docs/术语表.md`，按核心对象、治理安全、信任证据来源、互操作结果边界四组统一术语；`docs/README.md` 和 `docs/INDEX.md` 已同步入口、阅读路径和维护规则。
- [x] T128 P2：把威胁模型 Abuse Cases 转成 smoke tests。
  - 验收标准：
    - 新增 Runtime smoke/conformance 测试，把 `docs/安全/threat-model.md` 的 AC-001 到 AC-007 转成可运行断言。
    - smoke 覆盖写操作默认确认、token-shaped URL 外发阻断、任意 URL 内网/metadata 阻断、MCP 无确认返回 `confirmation_required`、audit preflight 失败阻断、policy 放宽 simulation/ledger、breakglass 硬边界。
    - 新增 conformance evidence record，声明 `opencap.threat_model_abuse_cases.v1` profile 和对应 artifact。
    - 测试不得读取真实 secret、发起真实外部请求或写入仓库状态目录。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- threat-model-abuse-cases.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/threat-model-abuse-cases.test.ts` 和 `packages/runtime/test/fixtures/conformance/threat-model-abuse-cases.yml`；AC-001 到 AC-007 均已转为 Runtime smoke 断言，Runtime 测试数从 249 增至 257。
- [x] T138 P2：增加 privacy retention 文档测试或 lint。
  - 验收标准：
    - 新增可复用 privacy retention 文档 lint helper，检查 V1 隐私保留文档必须覆盖本地优先、默认不上传遥测、secret 脱敏、`input_hash`、保留策略、手动删除、Host 日志边界和非目标。
    - 新增单元测试覆盖真实 `docs/安全/privacy-retention-v1.md` 通过，以及不完整文档返回结构化 finding。
    - `docs/安全/privacy-retention-v1.md` 明确 V1 不默认上传遥测、不自动同步远程 audit log。
    - helper 从 `@opencap/spec` public API 导出，便于后续接入更完整 docs lint。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- privacy-retention-doc-lint.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/spec/src/privacy-retention-doc-lint.ts` 和测试，`docs/安全/privacy-retention-v1.md` 补充遥测边界；Spec 测试数从 60 增至 62。
- [x] T153 P2：建立 conformance suite skeleton。
  - 验收标准：
    - `@opencap/spec` 导出 V1 conformance suite version、核心分组和 `validateConformanceRecord()`。
    - skeleton 覆盖 `C-MAN`、`C-PKG`、`C-RUN`、`C-POL`、`C-PG`、`C-CON`、`C-AUD`、`C-HTTP`、`C-MCP`、`C-REG`、`C-SEC` 核心分组。
    - validator 能接受现有 Runtime conformance YAML records，并拒绝缺失 subject/profile/suite/result/checks/artifacts 的记录。
    - artifact path 必须是仓库相对路径，不能使用绝对路径或 `..` 上跳。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- conformance.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/spec/src/conformance.ts` 和 `conformance.test.ts`，把现有 `policy-governance.yml`、`threat-model-abuse-cases.yml` 作为首批 skeleton evidence 校验；Spec 测试数从 62 增至 66。
- [x] T155 P2：把 Agentic abuse cases 转成 smoke tests。
  - 验收标准：
    - 新增 Runtime smoke/conformance 测试，把 `docs/安全/agentic-risk-mapping.md` 的 abuse cases 转成可运行断言。
    - smoke 覆盖 prompt-injection-like issue body 仍需 write confirmation、localhost outbound block、重复高风险调用独立 audit/consent、任意 URL capability warning、MCP 无确认 UI 返回 `confirmation_required`、超大 provider output 被限制。
    - 新增 `opencap.agentic_abuse_cases.v1` conformance evidence record，并接入 conformance skeleton validator。
    - 测试不得读取真实 secret、发起真实外部请求或写入仓库状态目录。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- agentic-abuse-cases.test.ts`
    - `pnpm --filter @opencap/spec test -- conformance.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/src/agentic-abuse-cases.test.ts` 和 `packages/runtime/test/fixtures/conformance/agentic-abuse-cases.yml`，并把该 record 纳入 `packages/spec/src/conformance.test.ts`；Runtime 测试数从 257 增至 264。
- [x] T162 P2：补充 credential lifecycle smoke/runbook 验证。
  - 验收标准：
    - Credential lifecycle runbook 有可复用 lint，要求覆盖 env-only 凭据模型、policy/consent/outbound gate 顺序、不存储 secret、轮换不改 manifest、missing env 错误、external 401 区分、audit redaction 和 list/Console 不展示凭据值。
    - Runtime smoke 覆盖 token 轮换只更新 env value、不改变 manifest auth；audit 只记录 redacted credential evidence，不泄露 token 原文。
    - Runtime smoke 覆盖 missing env 与 external provider 401 在 Result/Audit 中可区分，且 missing env 不发起 fetch。
    - Runtime smoke 覆盖 installed capability list 不展示 env credential value、env var name 或 Authorization header。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- credential-lifecycle-doc-lint.test.ts`
    - `pnpm --filter @opencap/runtime test -- credential-lifecycle.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/spec/src/credential-lifecycle-doc-lint.ts`、`packages/spec/src/credential-lifecycle-doc-lint.test.ts` 和 `packages/runtime/src/credential-lifecycle.test.ts`；从 `@opencap/spec` 导出 `lintCredentialLifecycleRunbook()`，并把 `docs/运营/credential-lifecycle.md` 的验收测试固化为文档 lint 和 Runtime smoke。Spec 测试数从 66 增至 68，Runtime 测试数从 264 增至 267。
- [x] T165 P2：GitHub fine-grained token setup guide。
  - 验收标准：
    - 新增中文 GitHub fine-grained token 设置指南，面向 `github.create_issue` 示例能力，引用 GitHub 官方 token 管理、Create issue API 和 API credential 安全文档。
    - 指南明确优先 fine-grained personal access token、只选择目标仓库、只授予 `Issues: write`、设置过期时间，并说明组织审批 pending 状态。
    - 指南明确 V1 env-only：token 只通过本地 `GITHUB_TOKEN` 提供，不能写入 manifest、README、registry tests、MCP tool input 或模型可见文本。
    - 指南包含 dry-run、真实调用前门禁、轮换、撤销、401/403/410/`SECRET_MISSING` 排查和 classic/broad `repo`/`admin` token 禁止项。
    - `github.create_issue` registry README 指向该指南。
    - `@opencap/spec` 暴露可复用 guide lint，避免后续文档删掉最小权限和凭据边界。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- github-token-guide-doc-lint.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `docs/教程/github-fine-grained-token-setup.md`、`packages/spec/src/github-token-guide-doc-lint.ts` 和 `github-token-guide-doc-lint.test.ts`；`docs/README.md`、`docs/INDEX.md` 和 `registry/developer-tools/github.create_issue/README.md` 已同步入口；`@opencap/spec` 导出 `lintGithubFineGrainedTokenGuide()`。Spec 测试数从 68 增至 70。
- [x] T173 P2：Execution evidence conformance record。
  - 验收标准：
    - 新增 `opencap.execution_evidence.v1` conformance record，引用 `docs/质量/execution-evidence-v1.md` 的测试要求。
    - Record 覆盖 blocked/dry-run requestStarted=false、成功 HTTP response evidence、timeout unknown outcome、retryAttempt/idempotency redaction、provider request id/SQLite persistence、Result Envelope output evidence 和 secret/credential redaction。
    - Record artifacts 指向现有 runtime tests 和 execution evidence/semantics 文档，不引入新的外部服务或凭据需求。
    - `packages/spec/src/conformance.test.ts` 将该 record 纳入 skeleton 校验。
    - `docs/质量/conformance-suite-v1.md` 记录该 profile 的实现状态和 check 列表。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- conformance.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：新增 `packages/runtime/test/fixtures/conformance/execution-evidence.yml`，并把该 record 纳入 `packages/spec/src/conformance.test.ts`；`docs/质量/conformance-suite-v1.md` 已同步 `opencap.execution_evidence.v1` check 列表。
- [x] T190 P2：SECURITY.md 对齐 private reporting。
  - 验收标准：
    - `SECURITY.md` 明确优先使用 GitHub private vulnerability reporting，并链接官方配置文档。
    - `SECURITY.md` 禁止在公开 issue/PR/讨论/聊天或模型可见文本中披露 secret、攻击 payload、未公开漏洞细节或真实 provider token。
    - `SECURITY.md` 列出报告最小信息：受影响组件、复现步骤、影响范围、缓解方案以及是否涉及 secret、Capability、Registry、policy、audit、MCP Host 或 provider。
    - `SECURITY.md` 说明维护者确认、triage、draft advisory/Capability Advisory、修复、协调披露和 revocation/freeze/release note 的流程。
    - `SECURITY.md` 说明维护者需要检查 Settings -> Advanced Security -> Private vulnerability reporting，并保持 issue template 的安全政策链接指向仓库 Security policy 页面。
    - `@opencap/spec` 暴露 SECURITY.md 文档 lint，防止 private reporting 边界回退。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- security-policy-doc-lint.test.ts`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `pnpm build`
    - `pnpm lint`
    - `pnpm test`
  - 完成记录：`SECURITY.md` 已补齐 GitHub private vulnerability reporting、敏感材料边界、报告内容、维护者 triage/advisory 流程和启用检查；新增 `packages/spec/src/security-policy-doc-lint.ts` 与 `security-policy-doc-lint.test.ts`，并从 `@opencap/spec` 导出 `lintSecurityPolicyDoc()`。Spec 测试数从 70 增至 72。
- [ ] T205 P2：Usage export format。（依赖已满足：T198 已定义 `opencap.usage_event.v1` schema、必填字段、redaction/non-billing 边界和 audit 关联键）
  - 任务提示：
    - 基于 T198 的 Usage Event schema，定义 JSONL/JSON export envelope、version、filter、redaction 和 compatibility rules。
- [x] T206 P2：Problem details for quota/rate errors。
  - 验收标准：
    - `@opencap/runtime` 导出 `ProblemDetailsV1` 类型和 quota/rate problem details helper，供 CLI、MCP、audit 和 usage evidence 复用。
    - helper 能从 quota/budget gate decision 生成稳定 problem details，覆盖 `quota-exceeded` 和 `budget-exceeded`，包含 type、title、status、reasonCode、capabilityId、gateId、policy/rule id、window、remaining/limit 摘要和 `redactionProfile`。
    - helper 能从 provider 429 evidence 生成 `provider-rate-limited` problem details，保留 retryAfterMs、retryAfterAt、rateLimitResetAt 和安全 headerNames，不保存 provider raw headers、token、Authorization、cookie 或 response body 原文。
    - problem details 的 `detail` 必须是 Runtime-generated safe summary，不包含 input、output、secret、provider token 或 Authorization header value。
    - root public entrypoint 导出类型和 helper；现有 quota/budget gate、provider rate limit evidence 行为不回退。
  - 验证方式：
    - `pnpm --filter @opencap/runtime test -- problem-details.test.ts`
    - `pnpm --filter @opencap/runtime test -- quota-budget-gate.test.ts provider-rate-limit.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
  - 完成记录：新增 `packages/runtime/src/problem-details.ts` 和 `problem-details.test.ts`，从 `@opencap/runtime` root 导出 `ProblemDetailsV1`、`createProblemDetailsFromQuotaBudgetGate()` 和 `createProblemDetailsFromProviderRateLimit()`。Quota/budget evidence 现在携带 limit/remaining/window/currency，problem details 覆盖 `quota-exceeded`、`budget-exceeded` 和 `provider-rate-limited`，并固定 `redactionProfile: "opencap.problem_details.v1"` 与 `policyEffect: "none"` 边界。Runtime 测试数从 267 增至 271。
- [x] T207 P2：Usage evidence conformance tests。
  - 验收标准：
    - 新增 `opencap.usage_evidence.v1` conformance record，引用 `docs/质量/usage-evidence-v1.md` 的测试要求。
    - record 覆盖 blocked invocation `requestStarted=false`、dry-run 与真实执行分开、retryAttempt 不重复计费、revoked/deprecated capability usage 标记、sourceAuditHash 关联 audit record、usage event 不含 input/output/secret、financial spend cap 阻断。
    - `packages/spec/src/conformance.test.ts` 将 usage evidence record 纳入 skeleton 校验。
    - `docs/质量/conformance-suite-v1.md` 记录该 profile 的实现状态和 check 列表。
    - 该 conformance 只证明 non-billing usage evidence，不把 usage event 宣称为账单记录。
  - 验证方式：
    - `pnpm --filter @opencap/spec test -- conformance.test.ts`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `pnpm --filter @opencap/spec test`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - `git diff --check`
  - 完成记录：新增 `packages/runtime/test/fixtures/conformance/usage-evidence.yml`，并把该 record 纳入 `packages/spec/src/conformance.test.ts` 的 skeleton 校验；`docs/质量/conformance-suite-v1.md` 已同步 `opencap.usage_evidence.v1` check 列表。该 conformance 只证明 non-billing usage evidence，不代表 billable event、计费规则或商业结算。

### 模块 M6：Composition、Capability Graph 和 Agentic Commerce

- [x] T146 P2：OpenAPI adapter RFC 草案。
  - 验收标准：
    - 新增 OpenAPI Adapter Profile V1 RFC，明确 OpenAPI adapter 是 future profile，不改变 V1 HTTP-only Runtime 主路径。
    - RFC 定义 OpenAPI operation -> Capability Manifest draft 的选择、权限收敛、风险标记、server/security 映射、schema 子集、人工 review 和 registry PR 流程。
    - RFC 明确不得把整个 OpenAPI document 自动暴露为 MCP tools，不得自动信任 OpenAPI descriptions、examples、servers 或 securitySchemes，也不得绕过 policy、confirmation、secret resolver、outbound policy、audit、result envelope 和 conformance。
    - `packages/adapters/openapi/README.md`、协议定位文档和文档入口链接到 RFC，并保留未实现状态。
    - RFC 验证计划包含文档闭环检查、JSON/YAML 解析和 `pnpm validate`。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `rfcs/0015-openapi-adapter-profile-v1.md`，定义 `opencap.openapi.adapter.v1` future profile，覆盖 OpenAPI operation 选择、Manifest draft 映射、schema 子集、server/security 处理、权限风险 review、Runtime 边界、安全隐私、兼容迁移和验证计划。`packages/adapters/openapi/README.md`、协议定位文档、文档入口和索引已同步，且继续明确 OpenAPI adapter 未实现、不能自动暴露整份 OpenAPI 文档为 MCP tools。
- [x] T169 P2：Retry/idempotency manifest RFC。
  - 验收标准：
    - 新增 Retry/Idempotency Manifest Profile RFC，明确 retry/idempotency 是 manifest future profile，不改变当前 Runtime 默认不自动 retry 的行为。
    - RFC 定义 manifest 字段草案：retry automatic/maxAttempts/backoff/retryableStatus，以及 idempotency mode/header/key source/payload binding/reconcile hint。
    - RFC 明确写操作默认不自动 retry；POST/PATCH 只有 provider 文档明确支持 idempotency key 或条件请求时才可被视为 repeatable；timeout after request 进入 unknown/reconcile，不伪造成功或失败。
    - RFC 明确 idempotency key 只能写入 executor-private request header，audit/evidence 只记录 hash，不保存 key 原文、payload 原文、secret 或 provider raw response。
    - retry/idempotency 设计文档、文档入口和任务交接链接到 RFC。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `rfcs/0016-retry-idempotency-manifest-profile-v1.md`，定义 `opencap.retry_idempotency.manifest.v1` future profile，覆盖 `execution.retry`、`execution.idempotency`、provider key、payload binding、reconcile hint、unknown timeout、audit/evidence 脱敏、兼容迁移和验证计划。`docs/设计/retry-and-idempotency-v1.md`、文档入口和索引已同步，并继续明确当前 Runtime 默认不自动 retry、HTTP executor 不执行 retry loop。
- [x] T171 P2：Duplicate invocation detector 草案。
  - 验收标准：
    - 新增 Duplicate Invocation Detector V1 草案，明确 detector 是 future local pre-secret gate，不提供 exactly-once、不跨机器去重、不阻止用户明确再次执行。
    - 草案定义匹配键、匹配类型、默认时间窗口、decision 语义和 evidence 字段，覆盖 same input、unknown outcome pending、idempotency key/payload 冲突和 rapid repetition。
    - 草案明确 detector 不能绕过或替代 policy、consent、quota/budget、outbound、secret resolver、audit、retry/idempotency 或 provider reconcile。
    - 草案明确 audit/evidence/usage 只保存 hash、时间、decision、outcome 和 evidence ref，不保存 input/output 原文、secret、provider raw response 或 idempotency key 原文。
    - retry/idempotency 设计文档、文档入口和任务交接链接到草案。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `docs/设计/duplicate-invocation-detector-v1.md`，定义 future Duplicate Invocation Detector V1 草案，覆盖 Runtime pipeline 位置、匹配键、匹配类型、默认窗口、decision/evidence、consent UX、audit/storage、retry/idempotency 关系、usage evidence 口径和未来测试计划。草案继续明确 OpenCap 不提供 exactly-once，detector 不跨机器去重，不替代用户确认、policy 或 provider reconcile。
- [x] T172 P2：Reconcile hint manifest field。
  - 验收标准：
    - Manifest schema 支持可选 `execution.reconcile` 字段，用于 unknown outcome 后恢复提示，不改变当前 Runtime 不自动 retry 的行为。
    - `execution.reconcile` 至少定义 `strategy`、`hint`、`retry_guidance` 和 `policy_effect`；支持 provider request id field 和 resource ref fields。
    - schema 只允许 `strategy: manual | provider_lookup`，`retry_guidance: do_not_retry_until_reconciled`，`policy_effect: none`，并拒绝未知字段或声明授权效果的值。
    - `@opencap/spec` 导出 `CapabilityManifestExecutionReconcile` 和 `CapabilityManifestExecution` 类型。
    - Manifest 规范、execution semantics、failure recovery runbook、测试策略和任务交接同步字段语义与验证方式。
  - 验证方式：
    - RED：`pnpm --filter @opencap/spec test -- index.test.ts` 先因 `policy_effect: allow` 被错误接受而失败。
    - GREEN：`pnpm --filter @opencap/spec test -- index.test.ts`
    - `pnpm --filter @opencap/spec build`
    - `pnpm --filter @opencap/spec lint`
    - `pnpm --filter @opencap/spec test`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：`packages/spec/schema/manifest.schema.json` 新增 `execution.reconcile` schema，支持 `manual` / `provider_lookup` 恢复提示、provider request id field、resource ref fields、固定 `retry_guidance: do_not_retry_until_reconciled` 和 `policy_effect: none`；`packages/spec/src/index.ts` 导出 manifest execution/reconcile 类型；`packages/spec/src/index.test.ts` 新增 2 个 schema 测试，覆盖合法 reconcile hint、拒绝 `policy_effect: allow` 和未知字段。Manifest 规范、execution semantics、failure recovery runbook、测试策略和 handoff 已同步；spec 测试数从 72 增至 74。
- [x] T175 P2：Composition context audit fields。
  - 验收标准：
    - Runtime `AuditEvent` 支持可选 `compositionContext` evidence，字段包含 composition id、parent invocation id、step id/index/name、initiator、plan hash 和固定 `policyEffect: none`。
    - `createCompositionContextEvidence()` 只生成脱敏 step/correlation metadata，不保存 raw plan、用户自由文本计划、上游 output 原文、secret 或 provider response。
    - `SqliteAuditLogger` 能持久化、迁移并查询恢复 composition context 字段。
    - composition context 只作为 evidence correlation，不能改变 policy、consent、quota/budget、outbound、secret resolver、execution 或 audit gate。
    - 组合边界、多步执行边界、组合失败 runbook、audit log 文档、测试策略和 handoff 同步该字段语义。
  - 验证方式：
    - RED：`pnpm --filter @opencap/runtime test -- index.test.ts -t "composition context"` 先因 `createCompositionContextEvidence` 缺失而失败。
    - GREEN：`pnpm --filter @opencap/runtime test -- index.test.ts -t "composition context"`
    - `pnpm --filter @opencap/runtime test -- index.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：`packages/runtime/src/index.ts` 新增 `CompositionContextEvidence`、`CompositionInitiatedBy` 和 `createCompositionContextEvidence()`，`AuditEvent` 新增可选 `compositionContext`；`SqliteAuditLogger` 新增 `composition_context_json` 列、迁移、写入和查询恢复。`packages/runtime/src/index.test.ts` 新增 composition context audit evidence 测试，确认 SQLite 可持久化 composition id、parent invocation、step metadata、initiator、plan hash 和 `policyEffect: none`，且不保存 raw plan 内容。相关组合边界、audit log、runbook、测试策略和 handoff 已同步；Runtime 测试数从 271 增至 272。
- [x] T176 P2：Composition profile RFC。
  - 验收标准：
    - 新增 Composition Profile V1 RFC，定义 `opencap.composition.profile.v1` future profile，不引入 workflow runtime、自动调度、workflow DSL 或 workflow-level consent。
    - RFC 覆盖 composition context、step record、plan hash、composition outcome、Runtime pipeline、MCP/Host 行为、failure/recovery、audit/evidence 和兼容迁移。
    - RFC 明确每个 step 必须独立经过 validation、policy、consent、secret resolver、outbound/data egress、execution 和 audit。
    - RFC 明确 raw plan、raw input/output、secret、provider raw response 和模型自由计划文本不得进入 audit/evidence。
    - composition boundary 文档、文档入口和任务交接链接到 RFC。
  - 验证方式：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `rfcs/0017-composition-profile-v1.md`，定义 `opencap.composition.profile.v1` future profile，覆盖 context shape、step record、composition outcome、step-level Runtime pipeline、MCP/Host metadata 边界、failure/recovery、audit/evidence、兼容迁移和 future tests。`docs/设计/composition-boundary-v1.md`、文档入口和索引已同步，并继续明确 OpenCap 不做 Agent、workflow runtime、自动调度或 workflow-level consent。
- [x] T177 P2：Step-level consent tests for composition。
  - 验收标准：
    - Runtime 测试覆盖 composition 中不同 step 的 `ask` confirmation 会生成独立 consent receipt，不复用父 step consent。
    - `ConfirmationRequest` 可携带 `compositionContext`，`createConfirmationAuditEvent()` 会把该 context 写入当前 step 的 audit event。
    - 子 step 的 `parentInvocationId`、`compositionId` 或 `planHash` 只作为 evidence，不改变 policy decision、consent id 或 input hash。
    - 文档明确 composition context 不替代 step-level consent，父 step approval 不传递给子 step。
  - 验证方式：
    - RED：`pnpm --filter @opencap/runtime test -- index.test.ts -t "composition step"` 先因 confirmation audit event 未保留 `compositionContext` 而失败。
    - GREEN：`pnpm --filter @opencap/runtime test -- index.test.ts -t "composition step"`
    - `pnpm --filter @opencap/runtime test -- index.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：`ConfirmationRequest` 新增可选 `compositionContext`，`createConfirmationAuditEvent()` 会把该 context 写入当前 step audit event；`packages/runtime/src/index.test.ts` 新增 step-level composition consent 测试，覆盖同一 composition 中两个 write step 各自生成独立 consent id、不同 input hash，并保留子 step 的 parent invocation/context evidence。`docs/设计/confirmation-and-consent-v1.md`、`docs/设计/composition-boundary-v1.md`、测试策略和 handoff 已同步；Runtime 测试数从 272 增至 273。
- [x] T178 P2：Plan hash and evidence chain 草案。
  - 验收标准：
    - 新增 Plan Hash 与 Evidence Chain V1 草案，定义 `opencap.plan_hash_evidence_chain.v1` 的目标、非目标、plan hash 格式、chain link shape、composition summary 和 `policyEffect=none` 边界。
    - 草案明确 `planHash`、`parentInvocationId`、`sourceResultDigest` 和 `sourceAuditHash` 只作为 evidence correlation，不能覆盖 policy、consent、quota/budget、outbound、data egress、secret resolver、execution 或 audit gate。
    - 草案覆盖 audit 映射、CLI/Console 只读 inspection、unknown/reconcile/duplicate/compensation 恢复语义和 future implementation tests。
    - Composition Profile RFC、多步执行边界、文档入口、索引、体系蓝图、测试策略和 handoff 链接到该草案。
  - 验证：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `docs/设计/plan-hash-evidence-chain-v1.md`，把 composition context、input provenance、policy trace、consent receipt、execution evidence、reconcile hint 和 future source audit hash 组织为只读 evidence chain。草案明确 plan hash 只接受 `sha256:<64 hex>` 形式，不保存 raw plan，不验证计划正确性，不改变任何 gate；`rfcs/0017-composition-profile-v1.md`、`docs/设计/multi-step-execution-boundary.md`、文档入口、索引、体系蓝图、测试策略和 handoff 已同步。
- [x] T179 P2：Capability graph metadata RFC。
  - 验收标准：
    - 新增 Capability Graph Metadata V1 RFC，定义 `opencap.capability_graph.metadata.v1` profile。
    - RFC 覆盖 graph metadata 的节点、边、字段规则、风险放大 marker、生成/维护来源、安全隐私边界、兼容迁移和 future implementation tests。
    - RFC 明确 graph metadata 是 review/discovery/evidence metadata，不是 workflow、推荐系统、执行计划、安装授权或 Runtime policy authority。
    - 能力图文档、文档入口、索引、体系蓝图和 handoff 链接到该 RFC。
  - 验证：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `rfcs/0018-capability-graph-metadata-v1.md`，定义 future graph metadata profile、节点/边模型、`can_feed` 与 `risk_escalates_with` 的非授权边界、sidecar/index 试点路径、risk amplification marker 和 future lint/conformance 方向。`docs/生态/capability-graph-v1.md`、文档入口、索引、体系蓝图和 handoff 已同步。
- [x] T180 P2：Risk amplification review checklist。
  - 验收标准：
    - 新增风险放大评审清单，把 Capability Graph Metadata RFC 的 marker 转成 Registry PR 人工检查项。
    - 清单覆盖使用时机、快速结论、通用检查、marker-specific 检查、severity 判定、review evidence、merge 阻断条件和 Runtime 非授权边界。
    - 清单明确 `risk_amplification_review`、`risk_escalates_with`、`reviewed_with` 和 graph metadata 只产生 review evidence，`policyEffect=none`。
    - Capability review checklist、能力图文档、RFC、文档入口、索引、体系蓝图和 handoff 链接到该清单。
  - 验证：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `docs/社区/risk-amplification-review-checklist.md`，覆盖 `read_to_write`、`write_then_external_send`、`internal_data_to_external_send`、`destructive_after_search`、`financial_after_model_generated_input` 和 `credential_scope_overlap` 的人工 review 检查、severity、阻断条件和 evidence 模板。相关 Registry review、能力图、RFC、文档入口、体系蓝图和 handoff 已同步。
- [x] T181 P2：Registry graph index 草案。
  - 验收标准：
    - 新增 Registry Graph Index V1 草案，定义 `opencap.registry.graph_index.v1` 的目标、非目标、envelope、capability/node/edge/risk/review entry 和生成流程。
    - 草案覆盖查询语义、默认 lifecycle/advisory 过滤、安全隐私边界、与 registry index/cache/sync 的关系和 future implementation tests。
    - 草案明确 graph index 只用于 review/discovery/inspection，不生成 workflow、自动安装、暴露 MCP tools 或改变 Runtime policy。
    - 能力图、Registry 分发、Capability Graph Metadata RFC、文档入口、索引、体系蓝图和 handoff 链接到该草案。
  - 验证：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `docs/生态/registry-graph-index-v1.md`，定义 future `graph-index.json` envelope、capability/node/edge/risk/review entry、deterministic generation pipeline、read-only query examples、revoked/yanked 默认过滤、cache layout 和安全隐私边界。相关能力图、Registry 分发、RFC、文档入口、体系蓝图和 handoff 已同步。
- [x] T182 P2：Compensation capability review rules。
  - 验收标准：
    - 新增 Compensation Capability 评审规则，面向 Registry review 定义补偿能力的使用时机、基本原则、命名、manifest、权限风险、输入确认、reconcile 顺序、graph metadata 和阻断条件。
    - 规则明确 compensation 是独立 Capability invocation，不是隐式 rollback，不保证恢复原状态，也不能复用原 step consent、input hash 或 policy decision。
    - 规则提供 `opencap.compensation.review.v1` evidence 模板，并固定 `policyEffect=none`。
    - Capability review checklist、失败恢复 runbook、组合失败 runbook、多步执行边界、文档入口、索引、体系蓝图和 handoff 链接到该规则。
  - 验证：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `docs/社区/compensation-capability-review-rules.md`，覆盖 compensation capability 的独立 manifest/permissions/risk/policy/consent/audit 要求、命名限制、reconcile-before-compensation 顺序、confirmation summary 要求、merge 阻断条件和 review evidence 模板。相关 review 清单、runbook、组合边界、文档入口、体系蓝图和 handoff 已同步。
- [x] T183 P2：Composition failure recovery smoke tests。
  - 验收标准：
    - Runtime 新增 composition failure recovery smoke tests，覆盖 required write step `unknown_after_timeout` 需要 reconcile、blocked step 停止后续、后续 external_send 失败形成 partial 且不自动补偿、compensation step 失败进入 manual review。
    - 新增纯 helper 输出 `opencap.composition.failure_recovery.v1` decision，固定 `autoCompensationAllowed=false` 和 `policyEffect=none`。
    - Helper 只做 recovery decision/evidence，不调度 workflow、不执行 retry/compensation、不改变 policy/consent/audit gate。
    - Runtime root export 暴露 helper 和类型，测试策略和 handoff 同步测试数。
  - 验证：
    - RED：`pnpm --filter @opencap/runtime test -- composition-recovery.test.ts` 先因缺少模块失败，再因 stub 返回 `completed` 而 4 个断言失败。
    - GREEN：`pnpm --filter @opencap/runtime test -- composition-recovery.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `packages/runtime/src/composition-recovery.ts` 和 `composition-recovery.test.ts`，实现 `evaluateCompositionFailureRecovery()` 纯 decision helper。该 helper 对 unknown required step、blocked step、failed normal step 和 failed compensation step 输出恢复建议、blocking step、completed/failed/unknown/compensation evidence，并保持 `autoCompensationAllowed=false`、`policyEffect=none`。Runtime 测试数从 273 增至 277。
- [x] T198 P1：Usage event schema。
  - 验收标准：
    - Runtime 新增 `opencap.usage_event.v1` schema helper，可从 audit event 派生 usage event。
    - Usage event 覆盖 invocation/capability/channel/outcome/status/risk/requestStarted/dryRun/httpRequestCount/intentCount/retryAttempt/lifecycle/sourceAuditHash，并固定 `policyEffect=none`、`billingEffect=none`。
    - 测试覆盖 blocked usage 不复制 input/output/secret、dry-run 与真实执行分离、retryAttempt 不增加 user intent、revoked/deprecated lifecycle 标记和 sourceAuditHash。
    - 用量计量、用量证据、测试策略、体系蓝图和 handoff 同步新 schema；T205 Usage export format 的直接依赖解除。
  - 验证：
    - RED：`pnpm --filter @opencap/runtime test -- usage-event.test.ts` 先因 `createUsageEventFromAuditEvent is not a function` 失败。
    - GREEN：`pnpm --filter @opencap/runtime test -- usage-event.test.ts`
    - `pnpm --filter @opencap/runtime build`
    - `pnpm --filter @opencap/runtime lint`
    - `pnpm --filter @opencap/runtime test`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `packages/runtime/src/usage-event.ts` 和 `usage-event.test.ts`，导出 `USAGE_EVENT_SCHEMA`、`createUsageEventFromAuditEvent()` 和 usage event 类型。Helper 从 audit event 派生 non-billing usage event，不复制 input/output/credential redaction 字段，保留 `sourceAuditHash`、dry-run 状态、retryAttempt 和 `intentCount=1`；Runtime 测试数从 277 增至 281。
- [x] T202 P2：Paid capability manifest RFC。
  - 验收标准：
    - 新增 Paid Capability Manifest Metadata V1 RFC，定义 future `opencap.paid_capability.manifest.v1` metadata。
    - RFC 区分 paid capability metadata、financial risk 和 usage evidence，明确 V1 不做 purchase、checkout、invoice、settlement、refund、dispute 或 payout。
    - RFC 固定 `policyEffect=none` 和 `billingEffect=none`，并规定 paid metadata 不能改变 Runtime policy、risk、trust、quality、usage event 或 billing。
    - 付费能力与商业边界文档、文档入口、索引、体系蓝图和 handoff 链接到该 RFC。
  - 验证：
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .`
    - `python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .`
    - JSON parser 校验 workspace package/schema `package.json`
    - Ruby YAML parser 校验 `**/*.yml`、`.github/**/*.yml` 和 `.github/**/*.yaml`
    - `pnpm validate`
    - `git diff --check`
  - 完成记录：新增 `rfcs/0019-paid-capability-manifest-v1.md`，定义 future `commerce` manifest metadata、paid vs financial 边界、manifest review rules、usage event non-billing 边界、Runtime pipeline 边界、兼容迁移和 future tests。相关商业边界文档、文档入口、体系蓝图和 handoff 已同步。
- [ ] T203 P2：Commerce profile RFC。

### 已完成但保留历史任务号

- [x] T253 P1：实现 policy simulation/diff。
- [x] T254 P1：实现 broad allow safety checks。
- [x] T255 P1：实现 policy override/breakglass controls。
- [x] T257 P1：policy simulation fixtures。
- [x] T258 P2：policy incident runbook。
- [x] T259 P2：decision log export。
- [x] T260 P1：policy governance conformance tests。

### 已完成

- 已完成：T110 P0：中文文档体系。
- 已完成：T111 P0：开发任务体系。
- 已完成：T115 P0：体系化项目管理文档。
- 已完成：T093 P2：威胁模型文档。
- 已完成：T117 P0：产品、协议、数据、安全体系化蓝图。
- 已完成：T118 P0：收敛 V1 执行、策略、审计和供应链关键决策。
- 已完成：T119 P0：补齐实现前接口契约和运行模型。
- 已完成：T120 P0：补齐生态、社区和可观测性体系。
- 已完成：T121 P1：CHANGELOG。
- 已完成：T122 P2：版本策略。
- 已完成：T123 P2：npm package 发布预案。
- 已完成：T101 P0：CI 基础通过。
- 已完成：T256 P2：policy bundle manifest/signing RFC。
- 已完成：T159 P0：实现 Secret Resolver V1 env provider。
- 已完成：T164 P1：实现 secret resolution ordering 和 audit evidence tests。
- 已完成：T130 P1：实现 `auth.placement` schema 测试和 executor 映射。
- 已完成：T149 P0：补齐演进、发布和兼容性体系。
- 已完成：T150 P0：补齐互操作、确认同意、一致性和 Agentic 风险体系。
- 已完成：T166 P0：补齐身份、授权和凭据生命周期体系。
- 已完成：T174 P0：补齐执行可靠性、副作用安全和失败恢复体系。
- 已完成：T184 P0：补齐组合边界、能力图和多步执行体系。
- 已完成：T197 P0：补齐信任模型、安全公告、撤销和质量评分体系。
- 已完成：T208 P0：补齐用量计量、配额预算、限流滥用和商业边界体系。
- 已完成：T219 P0：补齐 Tool Projection、Prompt Surface、发现选择边界和模型可见元数据治理体系。
- 已完成：T233 P0：补齐 Result Envelope、输出校验、结果净化、结果来源和投递边界体系。
- 已完成：T248 P0：补齐输入数据治理、数据分类、外发策略、输入来源和数据最小化体系。
- 已完成：T261 P0：补齐 Policy Decision Trace、策略生命周期、策略模拟和 override/breakglass 体系。
- 已完成：T262 P0：重新梳理中文文档入口、索引和文档规范。
- 已完成：T263 P0：整理 docs 根目录文件并归位参考、教程、规范和模板。
- 已完成：T264 P0：中文化 docs 子目录结构并同步全仓链接。
- 已完成：T265 P0：补齐整体系统设计 V1。
- 已完成：T266 P0：完成整体设计二次审查和工程补强任务拆解。
- 已完成：T277 P0：创建项目 conda 开发环境。
- 已完成：T267 P0：定义 Runtime Kernel public contract 设计契约。
- 已完成：T001 P0：让 `opencap validate` 调用真实 schema 校验。
- 已完成：T002 P0：抽出可复用 manifest validator API。
- 已完成：T003 P1：补充 schema 单元测试。
- 已完成：T004 P1：定义 registry test case schema。
- 已完成：T005 P2：增加 manifest authoring guide。
- 已完成：T010 P0：实现 OpenCap 本地状态路径 helper。
- 已完成：T011 P0：实现 `opencap install <id>`。
- 已完成：T012 P0：实现 `opencap list`。
- 已完成：T013 P1：实现 CLI 统一错误处理和 exit code。
- 已完成：T014 P1：增加 `--state-dir` 参数。
- 已完成：T015 P2：增加 `opencap doctor`。
- 已完成：T020 P0：实现 Installed Capability Loader。
- 已完成：T021 P1：实现 Capability id 与 MCP tool name 映射表。
- 已完成：T022 P1：实现本地状态初始化。
- 已完成：T030 P0：实现 policy 文件格式和 parser。
- 已完成：T031 P0：实现 Policy Engine。
- 已完成：T032 P0：实现 Confirmation Handler 接口。
- 已完成：T033 P1：记录 ask/deny 的审计日志。
- 已完成：T034 P2：支持 `--yes` 非交互确认。
- 已完成：T040 P0：确定并实现日志存储。
- 已完成：T041 P0：实现 redaction 和 input hash。
- 已完成：T042 P1：实现 `opencap logs`。
- 已完成：T043 P2：增加日志筛选。
- 已完成：T050 P0：实现 URL 模板渲染。
- 已完成：T051 P0：实现 dry-run executor。
- 已完成：T052 P0：实现 HTTP executor。
- 已完成：T053 P1：定义 HTTP request body manifest 字段。
- 已完成：T054 P1：实现 output normalization。
- 已完成：T055 P1：处理 arbitrary URL Capability 风险。
- 已完成：T060 P0：实现 `opencap invoke <id> --dry-run`。
- 已完成：T061 P1：实现真实 `opencap invoke`。
- 已完成：T062 P1：添加示例 input 文件。
- 已完成：T071 P0：实现 tools/list。
- 已完成：T072 P0：实现 tools/call 路由。

### T267 P0：定义 Runtime Kernel public contract 设计契约

- [x] T267 P0：定义 Runtime Kernel public contract 设计契约

产出：

- `docs/设计/runtime-kernel-contract-v1.md`
- 文档入口、架构总览、体系蓝图和追踪矩阵已同步引用

范围：

- 固定 `RuntimeKernel`、`RuntimeContext`、`InvocationRequest`、`InvocationPlan`、`GateDecision`、`ConsentRequest`、`ConsentReceipt`、`SecretHandle`、`ResultEnvelope`、`RuntimeError` 和 evidence/audit 的公共形状。
- 明确 CLI、MCP、未来 API 和 Console 只能通过 Runtime public contract 适配，不重新发明调用模型。
- 明确 `invoke` 是唯一允许产生外部副作用的入口，`planInvocation` 不解析 secret、不发请求。

后续：

- T124/T145：把设计契约落入 `packages/runtime` TypeScript exports。
- T268：补齐统一 Runtime Gate 接口和 Gate registry。
- T220/T231：把 Result Envelope 落到 Runtime 和 CLI 输出。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
git diff --check
```



---

## 当前推荐顺序

1. M4 / T140：把 Capability 分类落入 Registry 指南
2. M4 / T141：把 Capability Review Checklist 接入 PR 流程
3. M4 / T158：Trust Card generation rules
4. M0 / T070：MCP TypeScript SDK 接入（解除依赖阻塞后执行）

## 模块推进策略

1. M1 先行：先把 Runtime Kernel、领域对象、Gate、Ledger、Card 和 package exports 固定住，避免后续测试围绕临时类型发散。
2. M2 跟进：每个执行安全任务都必须先写失败测试，再实现最小代码，并更新 `docs/TESTING.md`。
3. M3 并行：CLI snapshot 和 exit code 可以在不等待 T070 的情况下推进；完整 MCP server 等 T070 解阻。
4. M4 分阶段：先做 package lint、trust card 和 lifecycle warning，再做 registry signing、advisory 和质量评分。
5. M5 作为门禁：每完成一个安全或生态能力，应补一个 conformance、abuse case 或 runbook 任务，避免文档和实现脱节。
6. M6 后置：组合、能力图和商业边界只在 M1-M4 稳定后进入实现，前期以 RFC 和 smoke 任务为主。

---

## Epic A：Spec 和 Manifest 校验

### T001 P0：让 `opencap validate` 调用真实 schema 校验

- [x] T001 P0：让 `opencap validate` 调用真实 schema 校验

目标：CLI 不再输出 scaffold 文本，而是能校验指定 Capability 或 registry 路径。

涉及文件：

- `packages/cli/src/index.ts`
- `packages/spec/src/validate-manifests.mjs`
- `packages/spec/src/index.ts`

验收标准：

- `opencap validate registry/developer-tools/github.create_issue` 成功
- 非法 manifest 返回非 0 exit code
- 错误输出包含文件路径和字段路径
- 命令支持单 Capability 目录和 registry 目录

验证：

```bash
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
pnpm validate
```

完成记录：`opencap validate` 已调用 `@opencap/spec` validator；支持单 Capability 目录、registry 目录和 `manifest.yml` / `manifest.yaml` / `manifest.json` 文件；非法 manifest 返回非 0 exit code，并输出文件路径和 JSON Pointer 风格字段路径。AJV 已切换到 draft 2020-12 validator。

### T002 P0：抽出可复用 manifest validator API

- [x] T002 P0：抽出可复用 manifest validator API

目标：Runtime、CLI、CI 都能复用同一套校验逻辑。

完成记录：`@opencap/spec` 已导出 `loadManifest`、`validateManifest`、`validateManifestFile`、`validateManifestPath`、`findManifestFiles` 和结构化 validation result 类型；CLI 只负责路径解析和输出格式化。

验收标准：

- `@opencap/spec` 导出 `validateManifest` 和 `loadManifest`
- 支持 YAML 和 JSON
- 返回结构化错误，不直接 `process.exit`
- CLI 只负责格式化输出

验证：

```bash
pnpm --filter @opencap/spec test
pnpm --filter @opencap/spec build
```

### T003 P1：补充 schema 单元测试

- [x] T003 P1：补充 schema 单元测试

验收标准：

- `packages/spec` 有 validator 单元测试文件。
- 测试直接调用 `validateManifest` 或 `validateManifestFile`，无需通过 CLI 输出断言。
- 合法 HTTP manifest 通过。
- `type: mcp` 失败。
- 缺少 `permissions` 失败。
- 非法 risk 失败。
- timeout 小于 100 失败。
- metadata 缺 trust level 失败。
- 失败结果至少断言一个 JSON Pointer 风格字段路径。

验证：

```bash
pnpm --filter @opencap/spec test
pnpm --filter @opencap/spec build
```

完成记录：已新增 `packages/spec/src/index.test.ts`，覆盖合法 HTTP manifest、非法 type、缺少 permissions、非法 risk、timeout 过小、metadata 缺 trust level，并断言 JSON Pointer 风格字段路径。

### T004 P1：定义 registry test case schema

- [x] T004 P1：定义 registry test case schema

目标：让 `tests/basic.yml` 有可校验格式。

产出：

- `packages/spec/schema/registry-test.schema.json`
- `docs/社区/registry-guidelines.md` 更新
- 示例 tests 修正

验收标准：

- 新增 registry test case JSON Schema。
- schema 能表达 `name`、`input`、`expect.status`、`expect.output` 或 `expect.error`。
- 现有 `registry/**/tests/basic.yml` 按 schema 通过校验或被修正为通过。
- Registry 指南说明 test case 的最小字段和用途。
- 后续 CI 可以复用该 schema，不需要读取 Runtime 实现。

验证：

```bash
pnpm validate
pnpm --filter @opencap/spec build
```

完成记录：已新增 `packages/spec/schema/registry-test.schema.json` 和 `packages/spec/src/validate-registry.ts`；`pnpm validate` 现在同时校验 manifests 与 `registry/**/tests/basic.yml`；现有 registry 测试样例已补齐 `capability`、`mode` 和 `expect.status`。

### T005 P2：增加 manifest authoring guide

- [x] T005 P2：增加 manifest authoring guide

目标：让贡献者能从空目录写出一个通过 `opencap validate` / `pnpm validate` 的 HTTP Capability。

产出：

- `docs/教程/write-a-capability.md`
- 示例从空目录到通过 validate

验收标准：

- 教程使用中文，覆盖 manifest 必填字段、权限、auth、execution、metadata 和 tests/basic.yml。
- 教程给出可复制的最小 HTTP Capability 示例。
- 教程说明如何运行 `pnpm validate` 和 `opencap validate <path>`。
- 教程明确不放真实 token，测试 env 只能使用假值。
- `docs/README.md` 的“我要贡献 Capability 或 Registry 条目”路径加入该教程。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
pnpm validate
```

完成记录：已新增 `docs/教程/write-a-capability.md`，覆盖最小 HTTP Capability、README、`tests/basic.yml`、单能力校验、registry 校验和常见错误；`docs/README.md` 已加入教程入口。

---

## Epic B：CLI 基础能力

### T010 P0：实现 OpenCap 本地状态路径 helper

- [x] T010 P0：实现 OpenCap 本地状态路径 helper

目标：统一管理 `opencap.local/` 路径。

验收标准：

- 默认路径是 repo/current working directory 下的 `opencap.local`
- 支持未来通过 env 或 flag 覆盖
- 创建必要目录时不影响 registry 源文件

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
```

完成记录：`@opencap/runtime` 已导出 `resolveStateDir`、`getLocalStatePaths`、`ensureLocalStateDir`、`DEFAULT_STATE_DIR_NAME` 和 `OPENCAP_STATE_DIR_ENV`；默认路径、env、显式 stateDir 优先级、目录结构和最小目录创建均有单元测试覆盖。

### T011 P0：实现 `opencap install <id>`

- [x] T011 P0：实现 `opencap install <id>`

目标：把 registry Capability 安装到本地状态。

验收标准：

- 搜索 `registry/**/<id>/manifest.yml`
- 找不到时报错
- 多个匹配时报错
- 安装时复制完整目录
- 已安装目录存在时给出明确处理策略：覆盖需 `--force`，默认拒绝

验证：

```bash
pnpm --filter @opencap/cli dev -- install github.create_issue
ls opencap.local/installed/github.create_issue
```

完成记录：`@opencap/runtime` 已导出 `installCapability` 和 `InstallCapabilityError`；CLI `install` 已支持 `--state-dir`、`--registry` 和 `--force`。安装会校验 manifest、复制完整 Capability 目录、默认拒绝覆盖，`--force` 可替换。

### T012 P0：实现 `opencap list`

- [x] T012 P0：实现 `opencap list`

目标：显示已安装 Capability。

验收标准：

- 空安装状态有友好提示
- 有安装时显示 id/version/type/risk/trust level
- 损坏 manifest 有错误提示但不中断全部列表

验证：

```bash
pnpm --filter @opencap/cli dev -- list --state-dir /private/tmp/opencap-cli-install-smoke
pnpm --filter @opencap/runtime test
```

完成记录：`@opencap/runtime` 已导出 `listInstalledCapabilities`；CLI `list` 支持 `--state-dir` 和 `--json`。空状态输出友好提示，已安装状态显示 id/version/type/risk/trust/status，损坏 manifest 标记为 `invalid` 且不阻断其他条目。

### T013 P1：实现 CLI 统一错误处理和 exit code

- [x] T013 P1：实现 CLI 统一错误处理和 exit code

目标：让 CLI 命令使用统一错误格式和 exit code，避免每个 command 自己散写 `try/catch`。

验收标准：

- 用户错误 exit 1。
- unexpected/internal error exit 2。
- 成功 exit 0。
- 错误消息简洁，不默认输出 stack trace。
- validate/install/list 使用同一组 CLI error helper。
- 现有 validate/install/list smoke 行为保持不变。

验证：

```bash
pnpm --filter @opencap/cli build
pnpm --filter @opencap/cli dev -- validate /private/tmp/non-existent-opencap-path
pnpm --filter @opencap/cli dev -- install missing.capability --state-dir /private/tmp/opencap-cli-install-smoke
```

完成记录：CLI 新增 `runCliAction`、`handleCliError` 和 `setCliError` helper；validate/install/list 已统一使用 helper。已验证用户错误 exit 1、成功路径保持 exit 0，默认不输出 stack trace。

### T014 P1：增加 `--state-dir` 参数

- [x] T014 P1：增加 `--state-dir` 参数

目标：测试和用户可以指定状态目录。

适用命令：

- `install`
- `list`
- `invoke`
- `logs`
- `serve`

验收标准：

- 已实现命令 `install` 和 `list` 保持 `--state-dir` 行为。
- 尚未实现的 `invoke`、`logs` 和 `serve` 先接受 `--state-dir` 参数并保持骨架行为。
- `--state-dir` 解析结果仍覆盖 `OPENCAP_STATE_DIR` 和默认路径。

验证：

```bash
pnpm --filter @opencap/cli dev -- install github.create_issue --state-dir /private/tmp/opencap-cli-state-dir-smoke --force
pnpm --filter @opencap/cli dev -- list --state-dir /private/tmp/opencap-cli-state-dir-smoke
pnpm --filter @opencap/cli build
```

完成记录：`install`、`list` 已保持真实 `--state-dir` 行为；`invoke`、`logs`、`serve` 已接受 `--state-dir` 并保持骨架输出。

### T015 P2：增加 `opencap doctor`

- [x] T015 P2：增加 `opencap doctor`

目标：提供一个只读诊断命令，帮助开发者确认本地环境、registry 和 state dir 的基础健康状态。

检查：

- Node/pnpm 版本
- registry 是否存在
- state dir 是否可写
- installed manifest 是否有效
- policy 文件是否有效

验收标准：

- `opencap doctor` 命令可运行。
- 输出至少包含 Node 版本、pnpm 可用性、registry 路径、state dir 路径、installed 目录状态。
- doctor 不修改 registry 或 state dir 内容，除非用户后续显式要求 repair。
- 缺少 registry 或 state dir 不应导致 stack trace。
- `--state-dir` 和 `--registry` 可用于指定检查路径。

验证：

```bash
pnpm --filter @opencap/cli dev -- doctor --state-dir /private/tmp/opencap-cli-state-dir-smoke
pnpm --filter @opencap/cli build
```

完成记录：CLI 已新增 `doctor` 命令，输出 Node、pnpm、registry、state dir、state dir writable、installed summary 和 policy status。命令为只读诊断，不修改 registry 或 state dir。

---

## Epic C：Runtime State 和 Capability Loading

### T020 P0：实现 Installed Capability Loader

- [x] T020 P0：实现 Installed Capability Loader

目标：Runtime 能从 `opencap.local/installed` 加载能力。

验收标准：

- 只加载 schema 合法 manifest
- 返回 install path
- 保留 manifest version
- 错误可被 CLI/MCP 层展示
- `OpenCapRuntime.loadInstalledCapabilities()` 使用同一 loader，不再返回空数组

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
```

完成记录：Runtime 已导出 `loadInstalledCapabilities`，返回合法 `InstalledCapability[]` 和 invalid entries；`OpenCapRuntime.loadInstalledCapabilities()` 已接入 loader。坏 manifest 不会进入 capabilities，但会形成可展示错误。

### T021 P1：实现 Capability id 与 MCP tool name 映射表

- [x] T021 P1：实现 Capability id 与 MCP tool name 映射表

目标：为 MCP tools/list 和 tools/call 提供稳定、可检测冲突的 tool name 映射。

验收标准：

- `github.create_issue` -> `github_create_issue`
- 启动时检测冲突
- tool metadata 保留原始 id
- mapping helper 可被 `@opencap/mcp` 复用

验证：

```bash
pnpm --filter @opencap/mcp test
pnpm --filter @opencap/mcp build
```

完成记录：

- `@opencap/mcp` 已导出 `capabilityIdToMcpToolName`、`buildMcpToolNameMap` 和 `McpToolNameCollisionError`。
- MCP tool metadata 已保留原始 `capabilityId`，为后续 `tools/call` 回查 Runtime capability 做准备。
- 已补充单元测试覆盖稳定映射、冲突检测和 metadata 保留。

### T022 P1：实现本地状态初始化

- [x] T022 P1：实现本地状态初始化

目标：首次运行命令时自动创建必要目录。

目录：

- `installed/`
- `logs.sqlite` 或日志父目录
- `policies.yml` 默认模板

验收标准：

- 首次运行需要 state 的命令时自动创建 `installed/`、`tmp/`、日志父目录和默认 `policies.yml`。
- 已存在的 `policies.yml` 不会被覆盖。
- 默认策略模板符合 `docs/设计/policy-dsl-v1.md` 的 V1 语义。
- 初始化逻辑可被 Runtime 和 CLI 复用，且支持显式 `--state-dir`。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/cli build
pnpm lint
```

完成记录：

- `ensureLocalStateDir` 现在会创建 `installed/`、`tmp/` 和默认 `policies.yml`。
- 默认策略文件内容为 `default: ask` 与空 `rules`，符合 Policy DSL V1。
- 已存在的 `policies.yml` 不会被覆盖，`logs.sqlite` 仍由后续 Audit Logger 首次写入创建。
- `listInstalledCapabilities` 与 `OpenCapRuntime.ensureLocalStateDir()` 已复用该初始化逻辑。

---

## Epic D：Policy 和 Confirmation

### T030 P0：实现 policy 文件格式和 parser

- [x] T030 P0：实现 policy 文件格式和 parser

目标：读取 `opencap.local/policies.yml`。

默认策略：

```yaml
default: ask
rules: []
```

说明：默认策略不静默放行任何 Capability。读操作自动允许可以通过用户或后续默认模板任务显式添加规则表达。

验收标准：

- 缺 policy 文件时使用默认策略
- 非法 decision 报错
- 非法 risk 报错
- parser 输出结构化 policy set，后续 Policy Engine 可复用

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `parsePolicyYml`、`loadPolicySet`、`defaultPolicySet` 和 `PolicyParseError`。
- 缺少 `policies.yml` 时返回默认 `ask` policy set。
- parser 会校验 `allow/ask/deny` decision 和 manifest risk 枚举。
- parser 将 YAML snake_case match 字段转换为 Runtime 可消费的结构化字段。

### T031 P0：实现 Policy Engine

- [x] T031 P0：实现 Policy Engine

输入：

- capability id
- permissions
- risk
- channel
- host
- input summary

输出：

- decision
- reason
- matched rule

验收标准：

- 显式匹配 `read_only -> allow` 规则时返回 allow
- 显式匹配 `write -> ask` 规则时返回 ask
- 显式匹配 `destructive -> deny` 规则时返回 deny
- 多权限 Capability 使用 deny > ask > allow 聚合
- 无匹配使用 default

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `evaluatePolicy`、`PolicyEvaluationInput` 和 `PolicyEvaluationResult`。
- Engine 按每个 permission 选择第一条匹配规则。
- 多权限聚合使用 deny > ask > allow，保证高风险权限不会被低风险权限覆盖。
- 无规则匹配时使用 policy set 的 `default`，不会默认静默放行 read-only。

### T032 P0：实现 Confirmation Handler 接口

- [x] T032 P0：实现 Confirmation Handler 接口

目标：Policy Engine 不负责用户交互。

V1 handler：

- CLI terminal handler
- MCP no-elicitation handler

验收标准：

- CLI ask 可以 prompt
- MCP ask 返回 `confirmation_required`
- deny 不进入 confirmation

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `ConfirmationHandler`、`CliConfirmationHandler` 和 `McpNoElicitationConfirmationHandler`。
- CLI handler 对 ask 决策调用可注入 prompt，方便后续接 CLI terminal。
- MCP no-elicitation handler 对 ask 返回 `confirmation_required`，不会在 STDOUT prompt。
- allow/deny 决策不会进入用户确认 prompt。

### T033 P1：记录 ask/deny 的审计日志

- [x] T033 P1：记录 ask/deny 的审计日志

要求：

- ask 未确认也写日志
- deny 也写日志
- 日志中 status 区分 blocked/denied/executed

验收标准：

- `confirmation_required` 会生成 blocked 状态审计事件。
- policy deny 会生成 denied 状态审计事件。
- 审计事件包含 capability id、policy decision、confirmation status 和 reason。
- 该任务可以先使用内存 logger，为 T040 SQLite logger 留出接口。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `AuditLogger`、`InMemoryAuditLogger`、`createConfirmationAuditEvent` 和 `confirmWithAudit`。
- `confirmation_required` 会记录为 blocked。
- policy deny 会记录为 denied。
- approved confirmation 会记录为 executed，为后续真实 invoke 审计保留状态语言。

### T034 P2：支持 `--yes` 非交互确认

- [x] T034 P2：支持 `--yes` 非交互确认

只允许 CLI 模式使用。

限制：

- 不得影响 MCP 模式
- financial/destructive 默认不允许 `--yes` 绕过，除非策略明确允许

验收标准：

- CLI ask 在 `--yes` 模式下可返回 approved。
- MCP ask 不受 `--yes` 影响，仍返回 `confirmation_required`。
- financial/destructive ask 不会被 `--yes` 自动批准。
- policy deny 不会被 `--yes` 覆盖。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `CliConfirmationHandler` 支持 `assumeYes`，对应未来 CLI `--yes`。
- `assumeYes` 只影响 CLI ask 决策，不影响 MCP handler。
- destructive/financial ask 不会被自动批准。
- policy deny 不会被 `assumeYes` 覆盖。

---

## Epic E：Audit Log

### T040 P0：确定并实现日志存储

- [x] T040 P0：确定并实现日志存储

推荐：SQLite。

验收标准：

- 自动创建表
- 写入 invocation log
- 查询最近 N 条
- 支持测试时使用临时 state dir

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `SqliteAuditLogger`。
- 使用 Node 内置 `node:sqlite`，当前会出现 Node ExperimentalWarning。
- logger 会自动创建 `invocations` 表。
- 支持写入 `AuditEvent` 和查询最近 N 条。
- 支持测试时使用临时 state dir 或显式 database file。

### T041 P0：实现 redaction 和 input hash

- [x] T041 P0：实现 redaction 和 input hash

默认脱敏字段：

- token
- secret
- password
- api_key
- authorization

验收标准：

- 嵌套对象也脱敏
- 保留字段存在但值为 `[REDACTED]`
- input hash 稳定

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `redactInput`、`stableJsonStringify` 和 `hashInput`。
- 默认敏感字段片段会递归脱敏，并保留字段名。
- input hash 使用稳定 JSON 序列化和 SHA-256。
- `createConfirmationAuditEvent` 会在 request 带 input 时写入 `inputHash` 和 `inputRedactedJson`。
- `SqliteAuditLogger` 会持久化 input hash 和脱敏输入 JSON。

### T042 P1：实现 `opencap logs`

- [x] T042 P1：实现 `opencap logs`

验收标准：

- 默认显示最近 20 条
- 支持 `--json`
- 显示 capability id、decision、status、duration
- 错误日志可读

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/cli build
pnpm lint
```

完成记录：

- `opencap logs` 已接入 `SqliteAuditLogger.recent()`。
- 默认显示最近 20 条，`--limit` 可调整数量。
- `--json` 输出结构化审计事件。
- 普通输出显示 timestamp、capability id、decision、status、confirmation、duration 和 reason。
- 当前 `duration_ms` 尚未进入 `AuditEvent`，普通输出以 `-` 占位。

### T043 P2：增加日志筛选

- [x] T043 P2：增加日志筛选

参数：

- `--capability`
- `--status`
- `--since`
- `--limit`

验收标准：

- `opencap logs --capability <id>` 只显示指定 capability。
- `opencap logs --status <status>` 只显示指定状态。
- `--limit` 和筛选条件可以同时使用。
- `--since` 可接受 ISO 时间字符串。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/cli build
pnpm lint
```

完成记录：

- `SqliteAuditLogger.recent()` 支持 `capabilityId`、`status` 和 `since` 查询条件。
- `opencap logs` 支持 `--capability`、`--status` 和 `--since`。
- `--limit` 可与筛选条件组合使用。
- CLI 会校验 `--status` 与 `--since` 的输入格式。

---

## Epic F：HTTP Executor

### T050 P0：实现 URL 模板渲染

- [x] T050 P0：实现 URL 模板渲染

要求：

- 变量来自已校验 input
- 缺变量时报错
- URL encode 规则明确
- 审计记录 resolved URL

验收标准：

- 支持 `{{field}}` URL 模板变量。
- 缺少变量时返回结构化错误。
- 插入 URL path/query 的变量必须 encode。
- 渲染结果可被后续 dry-run plan 和 audit evidence 复用。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `renderUrlTemplate` 和 `UrlTemplateRenderError`。
- URL 模板支持 `{{field}}`，变量来自输入对象。
- 缺字段、非对象输入和对象型字段会返回结构化错误。
- 变量统一使用 `encodeURIComponent`。

### T051 P0：实现 dry-run executor

- [x] T051 P0：实现 dry-run executor

目标：先不发真实请求也能看到将执行什么。

验收标准：

- 输出 method/url/body/auth mode/risk
- 不读取 secret 原值
- 不发网络请求
- 写 audit log

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `buildHttpDryRunPlan`。
- dry-run plan 会输出 method、resolved URL、JSON body、auth mode 和风险摘要。
- dry-run 不读取 secret 原值、不发网络请求。
- 传入 audit logger 时会写入 `dry_run` 审计事件，并记录 input hash 与脱敏输入。
- `opencap logs --status` 已接受 `dry_run` 状态。


### T052 P0：实现 HTTP executor

- [x] T052 P0：实现 HTTP executor

支持：

- GET
- POST
- PUT
- PATCH
- DELETE
- JSON body
- timeout
- API key header 策略

验收标准：

- Runtime 可以根据已渲染 URL 和 JSON body 发送真实 HTTP 请求。
- 支持 `auth.placement: bearer` 和 `auth.placement: header`，并且不会把 secret 写入 plan、错误或审计摘要。
- 支持 timeout，超时时返回结构化执行错误。
- HTTP 2xx 响应会归一化为 JSON 或 text 结果。
- HTTP 非 2xx 响应会返回结构化错误，包含 status code 和脱敏响应摘要。
- 执行路径会写入 audit log，至少记录 capability id、resolved URL、状态和脱敏输入。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `executeHttpCapability`。
- 支持 GET/POST/PUT/PATCH/DELETE 等 manifest 声明 method，支持 JSON body 渲染。
- 支持 `auth.placement: bearer` 和 `auth.placement: header`，secret 只从 env 读取，不进入审计事件。
- 支持 timeout、缺凭据、网络错误、HTTP 非 2xx 的结构化结果。
- HTTP 2xx 响应会归一化为 JSON 或 text。
- 执行事件会写入 audit log，并持久化 `resolvedUrl` evidence。


### T053 P1：定义 HTTP request body manifest 字段

- [x] T053 P1：定义 HTTP request body manifest 字段

当前 manifest 已开始使用 `execution.body.fields`，但需要把 body 映射契约正式落到 schema、示例和文档中。

验收标准：

- `manifest.schema.json` 明确定义 `execution.body.type: json` 和 `execution.body.fields`。
- 字段值完全等于 `{{field}}` 时保留原始 JSON 类型。
- 字符串内嵌 `{{field}}` 时按字符串插值。
- 可选完整变量缺失时省略字段，URL 模板缺失仍然报错。
- `github.create_issue` 示例 manifest 与文档保持一致。

验证：

```bash
pnpm --filter @opencap/spec test
pnpm --filter @opencap/runtime test
pnpm validate
```

### T054 P1：实现 output normalization

- [x] T054 P1：实现 output normalization

目标：HTTP 响应转成 Capability output。

验收标准：

- HTTP JSON 响应会转成结构化 JSON output。
- 非 JSON 响应会包装为 text output。
- 空响应会返回可区分的空 output。
- HTTP status code 和 content type 会进入 normalization 结果。
- 非 2xx 错误会保留脱敏响应摘要。
- output schema validation 可以作为后续任务接入，当前任务要预留清晰接口。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
pnpm lint
```

完成记录：

- `@opencap/runtime` 已导出 `normalizeHttpResponse`。
- JSON 响应归一化为结构化 output。
- 非 JSON 响应归一化为 text output。
- 空响应归一化为 `bodyKind: empty`，不虚构 output。
- `HttpExecutionResult` 已携带 `statusCode`、`contentType` 和 `bodyKind`。
- HTTP 非 2xx 错误继续使用脱敏响应摘要。


### T055 P1：处理 arbitrary URL Capability 风险

- [x] T055 P1：处理 arbitrary URL Capability 风险

验收标准：

- `http.request_demo` manifest 明确标记 arbitrary URL / unsafe-by-default。
- 中文文档说明 arbitrary URL、SSRF、metadata service、private network 的 outbound policy 风险。
- Runtime 可以检测 URL 完全由输入模板提供的 Capability。
- 检测结果能提高 risk summary 或返回风险提示，供 dry-run、invoke 和未来 MCP tool projection 使用。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm validate
pnpm lint
```

完成记录：

- `http.request_demo` 已标记 `metadata.network_access: arbitrary_url` 和 `unsafe_by_default: true`。
- `manifest.schema.json` 已支持 arbitrary URL 风险 metadata。
- Runtime 已导出 `detectArbitraryUrlCapability` 和 `capabilityRiskWarnings`。
- `buildHttpDryRunPlan` 会在完整用户 URL 模板能力上返回 `warnings: ["arbitrary_url"]`。
- `docs/安全/outbound-policy-v1.md` 已说明 SSRF、metadata service 和 private network 风险。


---

## Epic G：CLI Invoke

### T060 P0：实现 `opencap invoke <id> --dry-run`

- [x] T060 P0：实现 `opencap invoke <id> --dry-run`

验收标准：

- 从 installed 读取 Capability
- 支持 `--input <file>`
- 支持 inline JSON input
- 走 validate/policy/audit/executor dry-run

验证：

```bash
pnpm --filter @opencap/cli build
pnpm --filter @opencap/runtime test
pnpm lint
```

完成记录：

- CLI `invoke` 已支持 `--dry-run`。
- 支持 `--input <file>` 和 `--input-json <json>`。
- 从 installed capabilities 读取 manifest，并在未安装时返回用户错误。
- dry-run 会评估 policy，生成 HTTP dry-run plan，并写入 SQLite `dry_run` 审计事件。
- smoke 已覆盖 inline JSON、文件输入和 `opencap logs --status dry_run`。


### T061 P1：实现真实 `opencap invoke`

- [x] T061 P1：实现真实 `opencap invoke`

验收标准：

- write 操作默认 ask
- read_only 操作按 policy 自动 allow
- secret 缺失时给明确错误
- 结果支持 pretty 和 json 输出

验证：

```bash
pnpm --filter @opencap/cli build
pnpm --filter @opencap/runtime test
pnpm lint
```

完成记录：

- CLI `invoke` 不带 `--dry-run` 时会走 Confirmation Handler 和真实 HTTP executor。
- 新增 `--yes`，用于非交互批准允许范围内的 CLI ask。
- 新增 `--json`，输出结构化 invoke 结果。
- write 操作默认 ask；未批准时不会执行。
- read_only 能在 policy allow 下自动执行。
- secret 缺失会返回 `SECRET_MISSING` 结构化结果并设置非零 exit code。
- 完整 URL 模板 `url: "{{url}}"` 已保留原始 URL，不再错误 URL encode。


### T062 P1：添加示例 input 文件

- [x] T062 P1：添加示例 input 文件

验收标准：

- 新增 `examples/github-issue-capability/input.json`。
- 新增 `examples/simple-http-capability/input.json`。
- 示例输入能用于 `opencap invoke <id> --dry-run --input <file>`。
- README 或教程中给出示例命令。

验证：

```bash
pnpm --filter @opencap/cli build
pnpm validate
pnpm lint
```

---

## Epic H：MCP Bridge

### T070 P0：选择 MCP TypeScript SDK 并接入

- [!] T070 P0：选择 MCP TypeScript SDK 并接入

阻塞状态：

- 需要确认 MCP TypeScript SDK 的包名、版本和接入边界。
- 需要允许安装新的 npm 依赖；当前开发环境网络受限，未获批准前不自动修改依赖。
- 如果暂不引入 SDK，可改走最小 stdio JSON-RPC server spike，但需要重新确认验收标准。

验收标准：

- 选择并记录 MCP TypeScript SDK 依赖。
- `@opencap/mcp` 可以构建最小 server 模块。
- 不改变 Runtime Kernel 边界，MCP 只作为 adapter。
- 为 T071 `tools/list` 和 T072 `tools/call` 留出清晰入口。

验证：

```bash
pnpm --filter @opencap/mcp build
pnpm lint
pnpm validate
```

任务：

- 确认 package 名和版本
- 添加依赖
- 写最小 MCP server
- 不破坏 STDIO 输出

### T071 P0：实现 tools/list

- [x] T071 P0：实现 tools/list

验收标准：

- 已安装 Capability 暴露为 tools
- inputSchema 来自 manifest
- description 包含风险摘要
- tool name 冲突时启动失败

验证：

```bash
pnpm --filter @opencap/mcp test
pnpm --filter @opencap/mcp build
pnpm lint
```

完成记录：

- `@opencap/mcp` 已导出 `buildMcpToolsList`。
- tools/list payload 会把 Capability manifest 投影为 MCP tool。
- tool name 继续使用 Capability id 稳定映射。
- name collision 会抛出 `McpToolNameCollisionError`。
- inputSchema 来自 manifest input，description 包含权限和风险摘要。


### T072 P0：实现 tools/call 路由

- [x] T072 P0：实现 tools/call 路由

验收标准：

- MCP call -> runtime invoke
- allow 执行
- deny 返回结构化错误
- ask 无 elicitation 返回 confirmation_required
- audit log 全覆盖

验证：

```bash
pnpm --filter @opencap/mcp test
pnpm --filter @opencap/mcp build
pnpm lint
```

完成记录：

- `@opencap/mcp` 已导出 `routeMcpToolCall`。
- tool name 会反查 Capability manifest。
- allow 会调用注入的 executor 并返回 structuredContent。
- deny 会返回 `POLICY_DENIED` 结构化错误。
- ask 在无 elicitation MCP 路径返回 `CONFIRMATION_REQUIRED`。
- allow/deny/ask 都会通过 Runtime confirmation audit 记录。


### T073 P1：MCP confirmation_required 结果格式

- [x] T073 P1：MCP confirmation_required 结果格式

验收标准：

- `confirmation_required` 的 `content` 文案稳定。
- `structuredContent.error.code` 使用 `CONFIRMATION_REQUIRED`。
- metadata 包含 capability id、policy decision 和重试提示。
- 明确 V1 不生成 confirmation token，用户需要在 CLI/Console 改 policy 或未来 elicitation profile 中重试。

验证：

```bash
pnpm --filter @opencap/mcp test
pnpm --filter @opencap/mcp build
pnpm lint
```

完成记录：

- MCP `confirmation_required` 返回稳定 content 文案。
- `structuredContent.error.code` 固定为 `CONFIRMATION_REQUIRED`，并保留 Runtime confirmation reason。
- `structuredContent.metadata` 包含 Capability id、policy decision 和 retry hint。
- V1 明确不生成 confirmation token，`retry.token` 为 `null`，用户需要调整 CLI/Console policy 或未来通过支持 elicitation 的 Host 重试。

### T074 P2：MCP Host 手动测试文档

- [x] T074 P2：MCP Host 手动测试文档

新增：

- `docs/教程/connect-mcp-host.md`

验收标准：

- 文档说明如何把 OpenCap MCP Server 配到 Claude Desktop、Cursor 或其他 MCP Host。
- 文档覆盖最小安装、启动命令、`tools/list` 预期、`tools/call` allow/deny/confirmation_required 三类结果。
- 文档明确 V1 `confirmation_required` 不生成 confirmation token，用户需要调整 policy 或等待未来 elicitation profile。
- 文档包含排障清单：STDIO 不打印日志、state dir、policy、manifest 校验和审计日志位置。

验证：

```bash
pnpm --filter @opencap/mcp test
pnpm validate
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
```

完成记录：

- 已新增 `docs/教程/connect-mcp-host.md`。
- 文档覆盖 Claude Desktop、Claude Code、Cursor 和通用 MCP stdio 配置。
- 文档覆盖 tools/list、tools/call allow/deny/confirmation_required 的手动验证期望。
- 文档明确当前 `opencap serve --mcp` 仍是骨架，V1 不生成 confirmation token，并给出 state dir、policy、manifest、stdout 和审计日志排障清单。
- `docs/README.md` 和 `docs/INDEX.md` 已加入入口。

---

## Epic I：Registry 和 Capability 生态

### T080 P1：Registry manifest CI 校验

- [x] T080 P1：Registry manifest CI 校验

目标：PR/push 自动校验 registry manifests。

要求：

- `pnpm validate` 覆盖 registry
- schema 错误 fail CI
- 示例 tests 格式也校验

验收标准：

- 新增或更新 GitHub Actions workflow，在 push 和 pull_request 时运行 registry 校验。
- workflow 使用项目固定的 Node/pnpm 版本，并执行 `pnpm install --frozen-lockfile` 与 `pnpm validate`。
- workflow 名称、job 名称和失败信息能让贡献者知道是 manifest 或 registry test 校验失败。
- 不引入需要外部 secret 的步骤。

验证：

```bash
pnpm validate
yaml 解析检查
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
```

完成记录：

- 已更新 `.github/workflows/validate.yml`。
- workflow 在 push 到 `main` 和 pull_request 时运行。
- `registry-manifest-validation` job 使用 Node 22、pnpm 9.15.0、`pnpm install --frozen-lockfile` 和 `pnpm validate`。
- step 名称明确指向 registry manifests 和 registry tests。
- workflow 不使用外部 secret，并保留 `workspace-tests` job 运行 `pnpm test`。
- `docs/TESTING.md` 已补充 CI 校验说明。

### T081 P1：Capability Review Checklist

- [x] T081 P1：Capability Review Checklist

新增：

- `docs/教程/review-a-capability.md`
- 权限、风险、外部端点、README、测试、维护者检查

验收标准：

- 文档给出维护者评审 Capability PR 的逐项清单。
- 清单覆盖 manifest schema、权限最小化、风险等级、外部端点、auth/secret、README、registry tests、审计和 unsafe-by-default 标记。
- 文档明确哪些问题必须阻止合并，哪些可以作为 follow-up。
- `docs/README.md` 和 `docs/INDEX.md` 加入入口。

验证：

```bash
pnpm validate
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- 已新增 `docs/教程/review-a-capability.md`。
- 文档给出维护者评审 Capability PR 的操作流程和结论分类。
- 清单覆盖 manifest schema、权限最小化、风险等级、外部端点、auth/secret、README、registry tests、审计和 unsafe-by-default 标记。
- 文档明确阻止合并项和可作为 follow-up 的问题。
- `docs/README.md` 和 `docs/INDEX.md` 已加入入口。

### T082 P1：补充 Registry README

- [x] T082 P1：补充 Registry README

新增：

- `registry/README.md`
- 分类说明
- trust level 说明
- 提交流程

验收标准：

- `registry/README.md` 说明 registry 目录结构、分类、Capability 条目要求和提交流程。
- 文档解释 trust level 的含义和新条目的默认等级。
- 文档链接到 Capability 编写教程、Capability PR 评审指南和 Registry 指南。
- 文档明确 registry 不接收真实 secret、私有数据或绕过安全边界的能力。

验证：

```bash
pnpm validate
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- 已新增 `registry/README.md`。
- 文档说明 registry 目录结构、分类、Capability 条目要求和提交流程。
- 文档解释 trust level 和新条目默认 `experimental`。
- 文档链接到 Capability 编写教程、Capability PR 评审指南、Registry 指南、能力评审清单、能力清单和权限模型。
- 文档明确 registry 不接收真实 secret、私有数据、绕过安全边界的能力或未标记 unsafe-by-default 的任意 URL 能力。
- `docs/README.md` 已加入 Registry 根目录说明入口。

### T083 P2：添加 GitHub Issue/PR templates

- [x] T083 P2：添加 GitHub Issue/PR templates

新增：

- bug report
- feature request
- capability submission
- technical design proposal

验收标准：

- `.github/ISSUE_TEMPLATE/` 至少包含 bug report、capability submission 和 technical design proposal。
- `.github/PULL_REQUEST_TEMPLATE.md` 覆盖验证、文档同步和安全影响检查。
- 模板使用中文，且不要求提交者填写真实 secret。
- YAML issue templates 能通过 YAML 解析。

验证：

```bash
ruby -e "require 'yaml'; Dir['.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- 已新增 `.github/ISSUE_TEMPLATE/feature_request.yml`。
- 已确认 bug report、capability submission、technical design proposal 和 PR template 存在。
- Capability 提交模板明确只填写 env var 名称，不填写真实 token 或密钥。
- 安全政策 contact link 已修正为 GitHub security policy URL。

### T084 P2：新增更多示例 Capability

- [x] T084 P2：新增更多示例 Capability

候选：

- `slack.send_message`，external_send 风险
- `notion.create_page`，write 风险
- `sentry.list_issues`，read_only 风险
- `postgres.query_readonly`，read_only 但敏感数据风险

验收标准：

- 新增至少一个 registry 示例 Capability，优先覆盖当前示例未覆盖的风险类型。
- 新 Capability 包含 `manifest.yml`、`README.md` 和 `tests/basic.yml`。
- 示例不包含真实 secret、私有 URL 或生产用户数据。
- `pnpm validate` 通过。

验证：

```bash
pnpm validate
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- 已新增 `registry/developer-tools/slack.send_message/manifest.yml`。
- 已新增 `registry/developer-tools/slack.send_message/README.md`。
- 已新增 `registry/developer-tools/slack.send_message/tests/basic.yml`。
- 示例覆盖 `external_send` 风险、Slack `chat.postMessage` 固定 URL、`SLACK_BOT_TOKEN` env bearer auth 和 dry-run fixture。
- 示例不包含真实 secret、私有 URL 或生产用户数据。

---

## Epic J：安全加固

### T090 P0：禁止 token passthrough 的实现约束

- [x] T090 P0：禁止 token passthrough 的实现约束

要求：

- Runtime 不接受 Host 直接传入 token 作为普通 input 替代 auth
- manifest auth.env 是 V1 唯一 credential 来源
- logs 脱敏 authorization 类字段

验收标准：

- HTTP executor 不从普通 input 中读取 token、api_key、authorization 等字段作为 auth。
- 当 manifest 声明 `auth.type: api_key` 时，只从 `auth.env` 对应环境变量解析凭据。
- dry-run plan 和 audit log 不记录 secret 原值。
- 增加测试覆盖 input token 不能替代 env credential，以及 authorization 类字段会被 redaction。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm validate
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- Runtime 已有实现只从 manifest `auth.env` 对应环境变量读取 API key，不读取普通 input 作为凭据。
- 新增测试覆盖 env 缺失时，即使 input 包含 `token`、`api_key`、`Authorization` 也返回 `SECRET_MISSING` 且不会发起 HTTP 请求。
- 新增断言确认 audit log 脱敏 authorization 类 input 字段，不记录 input token 原值。

### T091 P1：最小 outbound policy 设计

- [x] T091 P1：最小 outbound policy 设计

目标：限制 HTTP executor 的目标域。

候选设计：

- manifest 声明 `execution.allowed_hosts`
- Runtime 校验 resolved URL host
- arbitrary URL Capability 必须显式声明

验收标准：

- 新增 outbound policy 设计文档或更新现有设计，明确 fixed_url、arbitrary_url、localhost/private network、metadata service 的默认决策。
- Runtime 后续实现入口清楚：HTTP executor 在真实请求前必须能调用 outbound policy gate。
- 文档说明 dry-run 如何展示 outbound risk，真实执行如何阻断。
- 文档包含测试计划和后续实现任务。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- 已补强 `docs/安全/outbound-policy-v1.md`。
- 文档新增 fixed_url、arbitrary_url、localhost/private network、metadata service、non-https 和 redirect 的默认决策表。
- 文档明确 HTTP executor 在真实请求前、Secret Resolver 前调用 outbound policy gate。
- 文档说明 dry-run 展示 outbound preview，真实执行阻断高风险目标。
- 文档补充最小实现任务和测试计划。

### T092 P1：审计日志隐私分级

- [x] T092 P1：审计日志隐私分级

定义：

- 默认 redacted
- debug 模式可更多字段，但需要显式开启
- 不记录 secret 原文

验收标准：

- 更新审计日志设计，定义字段隐私等级和默认 redaction 规则。
- 明确哪些字段永远不能记录 secret 原文。
- 明确 debug/diagnostic 模式的显式开启条件和仍然不能突破的边界。
- 给出后续实现和测试要求。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- 已补强 `docs/设计/audit-log-v1.md`。
- 文档新增 `public_metadata`、`operational_metadata`、`redacted_user_data`、`never_record_secret` 四级隐私分级。
- 文档定义字段隐私表、默认 redaction 规则和 debug/diagnostic 模式边界。
- 文档明确 env var value、Authorization、Cookie、password、private key、OAuth refresh token 永不记录原文。
- 文档补充后续实现和测试要求。

### T093 P2：威胁模型文档

- [x] T093 P2：威胁模型文档

新增：

- `docs/安全/threat-model.md`
- prompt injection
- confused deputy
- overbroad capability
- secret exfiltration
- unsafe arbitrary URL

验收标准：

- 威胁模型文档覆盖 SSRF、secret leakage、malicious capability、prompt injection via tool description。
- 文档关联现有控制：permission policy、confirmation、audit redaction、outbound policy、registry review、model-visible metadata lint。
- 文档标出当前已缓解、部分缓解和待实现的威胁。
- 若 `docs/安全/threat-model.md` 已存在，则补齐缺口而不是重建。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- 已补强 `docs/安全/threat-model.md`。
- 文档新增威胁状态标记：已缓解、部分缓解、待实现。
- 文档新增重点威胁矩阵，覆盖 SSRF、secret leakage、malicious capability、prompt injection via tool description、confused deputy、overbroad capability、silent policy relaxation 和 audit privacy overcollection。
- 文档把现有控制和待补控制映射到 permission policy、confirmation、audit redaction、outbound policy、registry review、metadata lint、policy simulation/diff 等路径。

---

## Epic K：测试和 CI

### T100 P0：修正并跑通 pnpm workspace

- [x] T100 P0：修正并跑通 pnpm workspace

目标：首次 `pnpm install` 后仓库可 build/test。

验收标准：

- 生成并提交 `pnpm-lock.yaml`
- `pnpm build` 通过或明确拆分可执行包
- `pnpm test` 通过

验证：

```bash
pnpm build
pnpm test
pnpm lint
pnpm validate
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：

- `pnpm build` 通过。
- `pnpm test` 通过：spec 11 个测试、runtime 62 个测试、mcp 9 个测试。
- `pnpm lint` 通过。
- `pnpm validate` 通过，包含 5 个 registry manifest 和 5 个 registry test。
- `check_docs.py` 和 `git diff --check` 通过。
- `node:sqlite` ExperimentalWarning 仍是已知环境提示。

### T101 P0：CI 基础通过

- [x] T101 P0：CI 基础通过

要求：

- install
- validate
- test
- build

验收标准：

- GitHub Actions 至少运行 install、validate、test。
- 如 workflow 暂未运行远端结果，需本地验证 workflow YAML 结构和对应命令。
- CI 不依赖外部 secret。
- 失败时能区分 registry validate 和 workspace tests。

验证：

```bash
ruby -e "require 'yaml'; Dir['.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
pnpm validate
pnpm test
pnpm build
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：`.github/workflows/validate.yml` 已覆盖 install、validate、test 和 build；Registry 校验与 workspace tests 分离，workflow 不依赖外部 secret。已用 Ruby YAML parser 验证 workflow 结构，并在本地项目环境中跑通 `pnpm validate`、`pnpm lint`、`pnpm build` 和 `pnpm test`。

### T102 P1：单元测试基础设施

- [x] T102 P1：单元测试基础设施

范围：

- spec
- runtime
- mcp helper
- cli command behavior

验收标准：

- 明确当前测试基础设施覆盖 spec、runtime、mcp helper 和 CLI 行为的现状。
- 若基础设施已存在，补充完成记录和剩余缺口，不重复搭建。
- `pnpm test` 能运行已有单元测试。
- `docs/TESTING.md` 与实际测试入口保持一致。

验证：

```bash
pnpm test
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：当前根目录 `pnpm test` 已通过 `pnpm -r test` 运行 workspace 中声明测试脚本的包；`packages/spec/src/index.test.ts` 覆盖 manifest validator 和 registry test schema，`packages/runtime/src/index.test.ts` 覆盖 state dir、install/list/load、policy、confirmation、audit、redaction/hash、HTTP dry-run/executor 和 token passthrough 禁止，`packages/mcp/src/index.test.ts` 覆盖 tool mapping、tools/list 和 tools/call routing。CLI 行为当前主要由 Runtime 单元测试、手动 smoke 命令和历史验证间接覆盖，独立 CLI snapshot/exit code 测试作为 T134/T137 后续补齐。

### T103 P1：临时目录测试工具

- [x] T103 P1：临时目录测试工具

目标：测试 install/list/logs 不污染真实 `opencap.local/`。

验收标准：

- 明确测试临时目录策略，优先复用 `mkdtemp(join(tmpdir(), ...))` 或等价 helper/pattern。
- install/list/logs/doctor/invoke smoke 不写入真实 `opencap.local/`。
- 测试结束清理临时目录，或只写入系统临时目录下的可丢弃路径。
- `docs/TESTING.md` 说明该策略和相关命令。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm test
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：`packages/runtime/src/index.test.ts` 已新增 `createTempOpenCapTestProject(prefix)` helper，基于 `mkdtemp(join(tmpdir(), ...))` 创建临时 cwd、显式 `stateDir` 和 cleanup；新增测试覆盖 install/list/logs 写入显式临时 state dir，并断言临时 cwd 下默认 `opencap.local/` 未被创建。`docs/TESTING.md` 已补充临时目录测试策略，手动 CLI smoke 已改为使用 `--state-dir "$SMOKE_STATE_DIR"` 覆盖 install/list/doctor/invoke/logs。

### T104 P2：端到端 smoke test

- [x] T104 P2：端到端 smoke test

目标：用 fixture 跑通 validate/install/list/invoke dry-run/logs。

验收标准：

- 提供一个可重复运行的 smoke test 脚本或测试入口。
- smoke test 使用临时 `--state-dir`，不污染真实 `opencap.local/`。
- 覆盖 validate、install、list、invoke dry-run 和 logs 的最小闭环。
- 失败时输出足够定位是 schema、install、policy、invoke 还是 logs 阶段失败。

验证：

```bash
pnpm test
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：`packages/cli/src/smoke.test.ts` 已新增可重复运行的 CLI 端到端 smoke test，并通过 `@opencap/cli` 的 `test` 脚本纳入根目录 `pnpm test`。测试使用系统临时目录作为 `--state-dir`，依次跑通 validate、install、list、invoke dry-run 和 logs；失败时会输出阶段名、参数、stdout、stderr 和 exit code。

---

## Epic L：文档和开发者体验

### T110 P0：中文文档体系

- [x] T110 P0：中文文档体系

已完成：核心 README、docs、RFC、registry/example 说明中文化。

验证：

- `git diff --check`
- JSON 解析
- YAML 解析

### T111 P0：开发任务体系

- [x] T111 P0：开发任务体系

本任务创建：

- `docs/TASKS.md`
- `docs/SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
- `docs/DECISIONS.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`
- `AGENTS.md`

### T112 P1：README 跟随实现更新

- [x] T112 P1：README 跟随实现更新

当 CLI 可用后，更新快速开始为真实命令。

验收标准：

- README 快速开始使用当前真实可运行命令，不再停留在概念说明。
- 覆盖 validate、install、list、invoke dry-run、logs 的最小本地闭环。
- 明确 `serve --mcp` 当前仍是骨架或实验状态，避免误导用户。
- README 与 `docs/TESTING.md` 的临时 state dir 策略不冲突。

验证：

```bash
pnpm test
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：README 快速开始已更新为当前真实可运行的 CLI 闭环，覆盖 validate、install、list、invoke dry-run 和 logs，并使用临时 `--state-dir` 避免污染真实 `opencap.local/`。README 同时明确 `serve --mcp` 当前仍是骨架入口，MCP helper 已存在但完整 MCP server 尚未实现。

### T113 P1：新增贡献者上手教程

- [x] T113 P1：新增贡献者上手教程

新增：

- `docs/教程/first-contribution.md`

验收标准：

- 新增中文贡献者上手教程，覆盖环境准备、选择任务、实现、验证、文档同步和提交推送。
- 教程链接到 `docs/TASKS.md`、`docs/TESTING.md`、`docs/HANDOFF.md` 和贡献指南。
- `docs/README.md` 与 `docs/INDEX.md` 增加教程入口。
- 内容与当前 continuous-doc-dev 工作流一致，不引入过时命令。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：新增 `docs/教程/first-contribution.md`，覆盖环境准备、任务选择、最小实现、验证、文档同步、提交推送和 Capability 贡献路径；教程链接到贡献指南、TASKS、TESTING、HANDOFF、WORKFLOW 和开发环境。`docs/README.md` 与 `docs/INDEX.md` 已增加入口。

### T114 P2：新增架构图

- [x] T114 P2：新增架构图

候选：

- Mermaid Runtime flow
- package dependency graph
- invocation sequence diagram

验收标准：

- 至少新增或更新一个 Mermaid 架构图，解释 V1 Runtime 主路径。
- 图中体现 CLI、Runtime、Policy、Audit、HTTP Executor、Local State 和外部 API 的关系。
- 图所在文档从 `docs/README.md` 或 `docs/INDEX.md` 可发现。
- 图不宣称尚未实现的 MCP server 能力已经完成。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：`docs/ARCHITECTURE.md` 已新增 Mermaid V1 Runtime 主路径图，体现 CLI、Runtime Core、Capability Loader、Policy Engine、Confirmation Handler、Secret Resolver、HTTP Executor、Audit Logger、Local State 和外部 API 的关系；图下注明完整 `opencap serve --mcp` server 仍未实现，避免把 MCP helper 误写成已完成 server 能力。

---

## Epic M：发布准备

### T120 P1：定义 alpha release checklist

- [x] T120 P1：定义 alpha release checklist

新增：

- `docs/releases/alpha-checklist.md`

验收标准：

- 新增中文 alpha release checklist，覆盖功能、测试、文档、安全、Registry 和发布前确认项。
- checklist 必须区分阻断项和可后续跟进项。
- checklist 与当前真实状态一致，不把未实现的 MCP server、Console 或 Cloud 能力列为已完成。
- 从 `docs/README.md` 或 `docs/INDEX.md` 可发现。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：新增 `docs/releases/alpha-checklist.md`，覆盖 alpha 发布口径、阻断项、可后续跟进项和发布前操作；清单明确完整 MCP server、Console、Cloud、OAuth、签名和 provenance 不是当前 alpha 已完成能力。`docs/README.md` 与 `docs/INDEX.md` 已增加入口。

### T121 P1：CHANGELOG

- [x] T121 P1：CHANGELOG

新增：

- `CHANGELOG.md`

验收标准：

- `CHANGELOG.md` 存在并包含 `未发布` 部分。
- 未发布部分覆盖当前已实现能力、文档/测试增强和已知缺口。
- 已知缺口与 README、HANDOFF 和 alpha checklist 不冲突。
- 不把未实现的 MCP server、Console、Cloud 或 OAuth 写成已完成。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：`CHANGELOG.md` 已复核并更新已知缺口，明确完整 `opencap serve --mcp` server、Console、Cloud/团队能力、完整 OAuth flow、SDK/adapters、Registry signing、outbound policy 私网阻断和 CLI snapshot tests 仍未完成；已知缺口与 README、HANDOFF 和 alpha checklist 保持一致，不再把 install/list/invoke/logs 写成骨架。

### T122 P2：版本策略

- [x] T122 P2：版本策略

决策：

- package versions
- schema version
- registry compatibility

验收标准：

- 新增或更新中文版本策略文档，说明 package、manifest schema、registry compatibility 和 alpha/beta/1.0 的兼容口径。
- 明确 `0.x` 阶段 breaking change 记录方式。
- 明确 manifest schema 与 registry entry 的兼容关系。
- 从 `docs/README.md` 或 `docs/INDEX.md` 可发现。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：`docs/规范/versioning-and-compatibility.md` 已补强 package version、manifest schema version、registry compatibility、alpha/beta/1.0 兼容口径和 `0.x` breaking change 记录规则；文档明确 Capability 自身 `version`、manifest schema 和 package version 不能互相替代。`docs/README.md` 与 `docs/INDEX.md` 已增加入口。

### T123 P2：npm package 发布预案

- [x] T123 P2：npm package 发布预案

范围：

- `@opencap/cli`
- `@opencap/spec`
- `@opencap/runtime`
- `@opencap/mcp`

验收标准：

- 新增或更新中文 npm package 发布预案，覆盖 package 范围、发布顺序、trusted publishing/provenance、发布前验证和不发布条件。
- 明确当前 alpha 阶段哪些 package 可发布、哪些仍为占位或暂缓。
- 不要求真实发布 npm package，只形成可执行预案。
- 从 `docs/README.md` 或 `docs/INDEX.md` 可发现。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

完成记录：`docs/运营/package-publishing-v1.md` 已补齐 alpha 当前发布判断、发布候选包、暂缓发布包、trusted publishing/provenance、发布前验证和不发布条件；`docs/README.md` 与 `docs/INDEX.md` 已加入入口。当前判断为 `@opencap/spec`、`@opencap/runtime`、`@opencap/cli` 可作为 alpha candidate，`@opencap/mcp` 与 `@opencap/sdk-js` 需等完整 MCP server/SDK 边界成熟后再正式发布。

---

## 阻塞和开放问题

### Q001 `[?]` HTTP body manifest 设计

`github.create_issue` 需要 request body，但当前 `execution` 只有 method/url/timeout。

建议：尽快写 ADR/RFC。

### Q002 `[?]` Audit log 存储选择

当前建议 SQLite，但还未正式决策。

### Q003 `[?]` MCP elicitation 实际兼容性

需要确认目标 MCP SDK 和常见 Host 支持情况。

### Q004 `[?]` Secret Resolver V1 是否只支持 env

当前文档倾向 env-only，但实现前应明确错误提示和扩展接口。

状态：已决议并实现。V1 使用 env-only Secret Resolver，具体实现见 T159；未来 Keychain/Vault/OAuth token store 必须走独立 provider/RFC，不进入当前 V1 主路径。

### T159 P0：实现 Secret Resolver V1 env provider

- [x] T159 P0：实现 Secret Resolver V1 env provider

目标：把 HTTP executor 中的凭据读取从内联 helper 收敛为可测试、可导出的 Secret Resolver V1 env provider。

涉及文件：

- `packages/runtime/src/secret-resolver.ts`
- `packages/runtime/src/secret-resolver.test.ts`
- `packages/runtime/src/index.ts`
- `docs/设计/secret-resolver-v1.md`
- `docs/TESTING.md`

验收标准：

- `auth.type: none` 返回 no-op credential。
- `auth.type: api_key` 只从 manifest 声明的 `auth.env` 读取 env var，不接受 input token。
- execute 模式下 env 缺失或空字符串返回 `SecretMissingError`。
- dry-run 模式不读取 env value，只返回 unresolved credential metadata。
- bearer/header placement 可生成 executor 内部 header，但 credential 对象 JSON 不暴露 secret 原文。
- query/body placement 被 resolver 拒绝。
- forbidden header name 被 resolver 拒绝。
- HTTP executor 使用 Secret Resolver，而不是直接读取 manifest auth。

验证：

```bash
pnpm --filter @opencap/runtime test -- secret-resolver.test.ts
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/secret-resolver.ts` 和 `secret-resolver.test.ts`，导出 `resolveEnvCredential`、`credentialAuditEvidence`、`SecretMissingError`、`SecretUnsupportedAuthError`、`SecretUnsupportedPlacementError` 和 `SecretForbiddenHeaderError`。HTTP executor 已改为通过 Secret Resolver apply credential headers。新增 7 个 Secret Resolver 测试，Runtime 测试数从 153 增至 160。

### T164 P1：实现 secret resolution ordering 和 audit evidence tests

- [x] T164 P1：实现 secret resolution ordering 和 audit evidence tests

目标：让凭据解析结果进入审计证据，但不泄露 secret 原文，并把 Secret Resolver 的调用边界固定在 executor 内部。

涉及文件：

- `packages/runtime/src/index.ts`
- `packages/runtime/src/index.test.ts`
- `docs/设计/audit-log-v1.md`
- `docs/TESTING.md`

验收标准：

- HTTP 执行成功时，audit event 记录 credential source、env name、placement、resolved 状态和 redacted credential summary。
- SQLite audit logger 能持久化并查询 credential audit evidence。
- 审计事件不包含 env var value、Authorization header value 或 provider secret 原文。
- ask/deny/confirmation_required 路径仍不进入 executor；MCP `tools/call` 的 deny/ask 测试继续覆盖不执行 callback 的边界。

验证：

```bash
pnpm --filter @opencap/runtime test -- index.test.ts
pnpm --filter @opencap/runtime test
```

完成记录：`AuditEvent`、`InMemoryAuditLogger` 和 `SqliteAuditLogger` 已支持 `credentialProvider`、`credentialSource`、`credentialEnvName`、`credentialPlacement`、`credentialResolved` 和 `credentialRedacted`。HTTP executor 会把 `credentialAuditEvidence` 写入执行审计事件；SQLite `invocations` 表会持久化 credential evidence 并在 `recent()` 查询中恢复。新增 1 个 HTTP executor audit evidence 测试，Runtime 测试数从 160 增至 161。

### T130 P1：实现 `auth.placement` schema 测试和 executor 映射

- [x] T130 P1：实现 `auth.placement` schema 测试和 executor 映射

目标：把 V1 `api_key` placement 约束固定在 manifest schema 和 executor/Secret Resolver 映射测试中，避免 secret 被放入 URL query、body 或危险 header。

涉及文件：

- `packages/spec/schema/manifest.schema.json`
- `packages/spec/src/index.test.ts`
- `packages/runtime/src/secret-resolver.test.ts`
- `packages/runtime/src/index.test.ts`
- `registry/developer-tools/*/manifest.yml`
- `docs/设计/http-execution-v1.md`
- `docs/设计/secret-resolver-v1.md`

验收标准：

- `auth.type: api_key` 必须声明 `provider`、`env` 和 `placement`。
- `auth.placement.type: bearer` 不需要 header name。
- `auth.placement.type: header` 必须声明 `name`。
- `auth.placement.type: query/body` 在 schema 层被拒绝。
- executor/Secret Resolver 映射保持 bearer -> `Authorization` header，header -> 指定安全 header。
- 注册表内现有 `api_key` manifest 均通过新的 schema。

验证：

```bash
pnpm --filter @opencap/spec test
pnpm --filter @opencap/runtime test -- secret-resolver.test.ts index.test.ts
pnpm validate
pnpm test
```

完成记录：Manifest schema 已要求 `api_key` 声明 `provider`、`env` 和 `placement`，并要求 `header` placement 声明 `name`；schema 继续拒绝 query/body placement。`github.search_repo` 和 `vercel.get_deployments` 已补齐 bearer placement。Runtime custom header placement 测试新增 credential audit evidence 断言，确保 named header 映射被审计且不泄露 secret 原文。Spec 测试数从 20 增至 25，Runtime 定向测试保持 80 个通过。

### T124 P1：将领域模型落入 TypeScript 类型和 Runtime 接口

- [x] T124 P1：将领域模型落入 TypeScript 类型和 Runtime 接口

目标：把 `docs/设计/domain-model.md` 和 `docs/设计/runtime-kernel-contract-v1.md` 中已经稳定的核心对象落成 `@opencap/runtime` 可导出的 TypeScript public contract，先定义类型和最小工厂/fixture，避免 CLI、MCP 和后续 Console 各自发明调用模型。

涉及文件：

- `packages/runtime/src/domain.ts`
- `packages/runtime/src/domain.test.ts`
- `packages/runtime/src/index.ts`
- `docs/TESTING.md`
- `docs/HANDOFF.md`

验收标准：

- Runtime 导出 `RuntimeKernel`、`RuntimeContext`、`CapabilityIdentity`、`InstalledCapabilityRecord`、`InvocationRequestV1`、`InvocationPlanV1`、`GateDecision`、`ConsentRequest`、`ConsentReceipt`、`RuntimeErrorV1`、`RuntimeResultEnvelope` 和 `AuditWriteResult` 类型。
- 新类型表达 capability identity、install metadata、trust summary、derived metadata、invocation request、plan、gate、consent、result、audit write result 和 error category。
- Runtime channel 只能是 `cli`、`mcp`、`api`、`test`，gate stage 只能是 `pre_secret`、`pre_execution`、`post_execution`。
- `createRuntimeRequestId()` 生成稳定前缀的 Runtime request id，便于审计和测试识别。
- `createDryRunEnvelope()` 能用 Runtime public contract 生成最小 dry-run Result Envelope，不接触 secret、不执行外部请求。
- `@opencap/runtime` public export 暴露上述类型和最小 helper。

验证：

```bash
pnpm --filter @opencap/runtime test -- domain.test.ts
pnpm --filter @opencap/runtime build
pnpm --filter @opencap/runtime lint
pnpm test
```

完成记录：新增 `packages/runtime/src/domain.ts` 和 `domain.test.ts`，定义并导出 Runtime public contract 类型：`RuntimeKernel`、`RuntimeContext`、`CapabilityIdentity`、`InstalledCapabilityRecord`、`InvocationRequestV1`、`InvocationPlanV1`、`GateDecision`、`ConsentRequest`、`ConsentReceipt`、`RuntimeErrorV1`、`RuntimeResultEnvelope`、`AuditWriteResult` 等。新增 `createRuntimeRequestId()` 和 `createDryRunEnvelope()` 最小 helper。`packages/runtime/src/index.ts` 已暴露这些 public exports。新增 6 个 Runtime domain contract 测试，Runtime 测试数从 161 增至 167。

### T145 P1：定义 package public exports

- [x] T145 P1：定义 package public exports

目标：为 OpenCap workspace package 固定 npm `exports` 边界，让外部集成只依赖声明过的 public entrypoint，不能通过 `dist/*` 或 `src/*` 深层路径绑定 Runtime、Spec、MCP 或 SDK 内部实现。

涉及文件：

- `packages/spec/package.json`
- `packages/runtime/package.json`
- `packages/mcp/package.json`
- `packages/sdk-js/package.json`
- `packages/cli/package.json`
- `packages/runtime/src/package-exports.test.ts`
- `docs/运营/package-publishing-v1.md`
- `docs/HANDOFF.md`

验收标准：

- `@opencap/spec`、`@opencap/runtime`、`@opencap/mcp` 和 `@opencap/sdk` 都声明 `exports["."]`，并把 `types` 指向 `./dist/index.d.ts`、`import` 指向 `./dist/index.js`。
- `@opencap/spec` 额外声明 schema JSON public subpath：`./schema/manifest.schema.json` 和 `./schema/registry-test.schema.json`。
- 所有 package 都只额外暴露 `./package.json`，不暴露 `./src/*`、`./dist/*` 或其他内部 subpath。
- `@opencap/cli` 明确保持 bin-only public surface，只暴露 `./package.json`，不把命令入口当作 library API。
- 新增测试能在 package export map 缺失或暴露内部路径时失败。

验证：

```bash
pnpm --filter @opencap/runtime test -- package-exports.test.ts
pnpm build
pnpm lint
```

完成记录：`@opencap/spec`、`@opencap/runtime`、`@opencap/mcp` 和 `@opencap/sdk` 已声明 root public export map，`types` 指向 `./dist/index.d.ts`，`import` 指向 `./dist/index.js`。`@opencap/spec` 额外公开两个 schema JSON subpath；所有 package 只额外暴露 `./package.json`。`@opencap/cli` 保持 bin-only public surface，不把命令入口声明为 library API。新增 `packages/runtime/src/package-exports.test.ts` 覆盖 3 个 export map 契约测试，Runtime 测试数从 167 增至 170。

### T268 P1：定义统一 Runtime Gate 接口和 GateDecision 语义

- [x] T268 P1：定义统一 Runtime Gate 接口和 GateDecision 语义

目标：把 Runtime pipeline 中 data egress、risk policy、outbound、quota/budget、lifecycle、audit preflight 等 gate 统一到一个 public contract，固定 `GateDecision` 的执行语义，避免各模块各自解释 `allow`、`ask`、`deny`、`block` 和 `redact`。

涉及文件：

- `packages/runtime/src/domain.ts`
- `packages/runtime/src/gate.test.ts`
- `packages/runtime/src/index.ts`
- `docs/设计/runtime-kernel-contract-v1.md`
- `docs/TESTING.md`
- `docs/HANDOFF.md`

验收标准：

- Runtime 导出 `RuntimeGate`、`RuntimeGateId`、`GateDecisionSemantics`、`GateDecisionInput`、`createGateDecision()` 和 `gateDecisionSemantics()`。
- `GateDecisionKind` 覆盖 `allow`、`ask`、`deny`、`block` 和 `redact`，并与 `PolicyDecisionTraceV1.decision` 可表达的 gate decision 对齐。
- `allow` 允许 secret resolution 和 execution；`ask` 需要 confirmation，不直接 execution；`deny` 不解析 secret、不执行，并映射为 denied；`block` 不解析 secret、不执行，并映射为 blocked 且默认 hard boundary；`redact` 要求 transformed input，不解析 secret、不执行。
- `createGateDecision()` 对 `block` 默认设置 `hardBoundary=true`，其他 decision 默认 `hardBoundary=false`，但调用方可显式传入 hard boundary。
- `RuntimeGate.evaluate()` 支持同步或异步返回 `GateDecision`，便于后续 gate registry 串联现有同步 policy 和未来异步 provider/ledger gate。
- 新增测试覆盖上述语义、默认 hard boundary 和 public type shape。

验证：

```bash
pnpm --filter @opencap/runtime test -- gate.test.ts
pnpm --filter @opencap/runtime test -- domain.test.ts
pnpm --filter @opencap/runtime build
pnpm --filter @opencap/runtime lint
```

完成记录：`packages/runtime/src/domain.ts` 已新增并导出 `RuntimeGate`、`RuntimeGateId`、`GateDecisionSemantics`、`GateDecisionInput`、`createGateDecision()` 和 `gateDecisionSemantics()`；`GateDecisionKind` 已扩展为 `allow`、`ask`、`deny`、`block` 和 `redact`，与 policy trace decision 对齐。`createGateDecision()` 对 `block` 默认设置 hard boundary，`gateDecisionSemantics()` 固定 secret resolution、execution、confirmation、transformed input 和 terminal status 语义。新增 `packages/runtime/src/gate.test.ts` 覆盖 3 个 Runtime Gate contract 测试，Runtime 测试数从 170 增至 173。`docs/设计/runtime-kernel-contract-v1.md` 已同步 Gate public contract。

### T115 P0：体系化项目管理文档

- [x] T115 P0：体系化项目管理文档

目标：把任务清单升级为可导航、可追踪、可门禁、可交接的开发体系。

交付物：

- `docs/INDEX.md`
- `docs/WORKFLOW.md`
- `docs/规划/v1-milestones.md`
- `docs/规划/traceability-matrix.md`
- `docs/RISKS.md`
- `docs/规划/task-template.md`
- `docs/GLOSSARY.md`

验收标准：

- 文档地图能说明不同角色该读什么
- 追踪矩阵能连接需求、任务和测试
- 里程碑文档能给出阶段退出门禁
- 风险登记能覆盖当前主要技术风险

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
git diff --check
```


### T093 P2：威胁模型文档

- [x] T093 P2：威胁模型文档

已完成：新增 `docs/安全/threat-model.md`，覆盖资产、信任边界、攻击者模型、主要威胁、Abuse Cases、安全不变量和关联任务。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
```

### T117 P0：产品、协议、数据、安全体系化蓝图

- [x] T117 P0：产品、协议、数据、安全体系化蓝图

已完成：新增产品战略、用户场景、Capability 生命周期、领域模型、Runtime 契约、协议定位、发布门禁和协议生态补充调研，并将它们接入 README、INDEX、SPEC、ARCHITECTURE、DECISIONS、RISKS。

验收标准：

- 新文档能回答 OpenCap 的定位、用户、对象、生命周期、运行时边界、协议边界、安全边界和发布标准。
- README 和 `docs/INDEX.md` 能导航到新增文档。
- ADR 索引包含新增决策。
- 风险登记反映 SQLite 和生命周期相关风险状态。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```


### T118 P0：收敛 V1 执行、策略、审计和供应链关键决策

- [x] T118 P0：收敛 V1 执行、策略、审计和供应链关键决策

已完成：新增体系蓝图、HTTP 执行设计、Policy DSL、Audit Log、Registry Test Format、Outbound Policy、供应链治理、项目运行模型和风险治理调研。新增 ADR 0008-0012，并更新 schema、GitHub Capability manifest、风险登记、测试策略、README、INDEX 和任务表。

验收标准：

- R002/R014 被 ADR 明确缓解。
- R003/R004 进入明确设计和实现任务。
- `github.create_issue` manifest 具备 JSON body 和 bearer token placement。
- Policy DSL 格式唯一。
- Registry test format 有稳定 V1 字段。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T119 P0：补齐实现前接口契约和运行模型

- [x] T119 P0：补齐实现前接口契约和运行模型

已完成：新增 CLI 契约、本地状态、配置模型、MCP 接口、错误模型、隐私与数据保留、CI 安全基线和 V1 实施计划。新增 ADR 0013-0015，并更新 SYSTEM、README、INDEX、DECISIONS、任务、追踪矩阵和交接文档。

验收标准：

- T001 之后的 CLI 行为有明确 stdout/stderr/exit code。
- T010/T014 的 state dir 解析规则明确。
- T070-T073 的 MCP tools/confirmation 行为明确。
- T013/T137 的错误分类和 exit code 明确。
- 发布前 CI/security baseline 明确。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T120 P0：补齐生态、社区和可观测性体系

- [x] T120 P0：补齐生态、社区和可观测性体系

已完成：新增 Capability 分类、Host 兼容性矩阵、开源核心边界、贡献者路径、Capability Review Checklist、RFC 流程、可观测性指标、Open Questions 和生态调研；新增 GitHub issue/PR templates；新增 ADR 0016-0018。

验收标准：

- Registry 能力分类和粒度规则清晰。
- 外部贡献者路径清晰。
- Capability PR 有评审清单。
- 大型设计变化有 RFC 流程。
- V1 可观测性边界清楚，默认无远程遥测。
- OSS/Cloud 边界清楚。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T149 P0：补齐演进、发布和兼容性体系

- [x] T149 P0：补齐演进、发布和兼容性体系

已完成：新增版本和兼容性策略、Manifest 演进策略、Registry 分发模型、SDK/Adapter 边界、包发布策略、签名和 provenance 路线图、质量门禁、维护者手册、发布调研，并新增 CHANGELOG。新增 ADR 0019-0022。

验收标准：

- 公共契约和破坏性变化规则明确。
- Manifest schema 演进有迁移规则。
- V1 Registry 分发保持 Git-based、本地 install。
- SDK/adapters 不阻塞 V1 主路径。
- npm trusted publishing/provenance 方向明确。
- 质量门禁覆盖 schema/CLI/state/policy/audit/HTTP/MCP/registry/release。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T150 P0：补齐互操作、确认同意、一致性和 Agentic 风险体系

- [x] T150 P0：补齐互操作、确认同意、一致性和 Agentic 风险体系

已完成：新增互操作 Profiles、确认与同意模型、Capability Package V1、一致性测试体系、Agentic 风险映射、互操作与 Agentic security 调研，并新增 ADR 0023-0026。同步更新 README、INDEX、SYSTEM、DECISIONS、RISKS、TESTING、追踪矩阵和 HANDOFF。

验收标准：

- 兼容性声明必须绑定 profile 和 evidence record。
- `ask` 的确认语义被建模为 Runtime-owned consent request/receipt。
- Registry 中 Capability package 的最小目录契约清晰。
- Conformance suite 覆盖 manifest/package/runtime/policy/consent/audit/http/mcp/registry/security。
- Agentic AI 风险能映射到 OpenCap 控制和后续测试任务。
- 修正 T124 编号冲突，已完成的演进发布体系改为 T149。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T166 P0：补齐身份、授权和凭据生命周期体系

- [x] T166 P0：补齐身份、授权和凭据生命周期体系

已完成：新增身份与授权模型、Secret Resolver V1、凭据生命周期 Runbook、最小权限评审、OAuth 与远程 Runtime 边界、身份授权调研，并新增 ADR 0027-0029。同步更新 README、INDEX、SYSTEM、DECISIONS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- V1 下游凭据来源限定为 manifest 声明的 env var。
- Host/client/input token 不能作为下游 provider token。
- Secret Resolver 的输入、输出、调用顺序和 dry-run 行为清晰。
- 凭据创建、配置、轮换、撤销和泄露响应流程清晰。
- Capability least-privilege review 有可执行检查项。
- 远程 Runtime OAuth 被明确排除在 V1 主路径外，后续必须走 profile/RFC。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T174 P0：补齐执行可靠性、副作用安全和失败恢复体系

- [x] T174 P0：补齐执行可靠性、副作用安全和失败恢复体系

已完成：新增执行语义、重试与幂等、失败恢复、执行证据、执行可靠性调研，并新增 ADR 0030-0031。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- 非幂等写操作 V1 不自动 retry。
- 请求发出后的 timeout 被建模为 `unknown_after_timeout`。
- outcome、request_started、retryAttempt、providerRequestId 等执行证据字段清晰。
- failure recovery runbook 明确请求前失败、请求后失败、5xx/429、timeout unknown 的恢复路径。
- idempotency key 支持被定义为后续 RFC，不混入 V1 主路径。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T184 P0：补齐组合边界、能力图和多步执行体系

- [x] T184 P0：补齐组合边界、能力图和多步执行体系

已完成：新增组合边界、能力图、多步执行边界、组合失败恢复、组合/Saga 调研，并新增 ADR 0032-0034。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- V1 明确不内置 workflow runtime。
- 多步组合中每一步都必须独立 policy、consent、secret、execution、audit。
- compositionId/planHash 只作为 evidence，不作为授权。
- compensation 被定义为独立 Capability invocation，不是隐式 rollback。
- 能力图作为 registry 元数据和风险放大分析基础，而不是自动执行许可。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T197 P0：补齐信任模型、安全公告、撤销和质量评分体系

- [x] T197 P0：补齐信任模型、安全公告、撤销和质量评分体系

已完成：新增 Trust 模型、Capability Advisory 流程、能力弃用/下架/撤销、能力质量评分、Trust/Advisory/Revocation 调研，并新增 ADR 0035-0037。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- Trust level 被定义为证据摘要，不覆盖本地 policy。
- Revoked capability 保留可寻址记录，不能从历史中静默消失。
- Advisory lifecycle 覆盖 reported/triaged/investigating/fixed/mitigated/revoked/published。
- Deprecated/yanked/revoked 的 Registry 和 Runtime 行为清晰。
- Quality Score 只解释成熟度，不能绕过 risk、policy、consent。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T208 P0：补齐用量计量、配额预算、限流滥用和商业边界体系

- [x] T208 P0：补齐用量计量、配额预算、限流滥用和商业边界体系

已完成：新增用量计量、配额与预算策略、限流与滥用控制、付费能力与商业边界、用量证据、Usage/Commerce/Abuse 调研，并新增 ADR 0038-0040。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- Usage Event 被定义为本地可观测和限额证据，不是账单记录。
- Quota/Budget Gate 在 Secret Resolver 和 Executor 前运行。
- Rate limit 和 abuse control 能区分 local throttle 与 provider 429。
- Financial capability 必须 explicit consent 和 spend budget，不自动 retry。
- Paid capability/agentic commerce 被明确放入 future commerce profile，不进入 V1 主路径。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


## Epic N：Tool Projection 和 Prompt Surface Governance

### T209 P1：实现 MCP Tool Projection builder

- [x] T209 P1：实现 MCP Tool Projection builder

目标：`@opencap/mcp` 不再临时拼接 tool description，而是通过明确的 projection builder 生成模型可见 MCP tool metadata。

涉及文件：

- `packages/mcp/src/index.ts`
- `packages/mcp/src/tool-projection.ts`
- `packages/mcp/src/tool-projection.test.ts`

验收标准：

- projection 输出包含 `projectionVersion`、`capabilityId`、`toolName`、`title`、`description`、`inputSchema`、`outputSchema`。
- description 使用 Runtime 模板。
- 不读取 README 或远程文档。
- tool name 映射仍然 deterministic。

验证：

```bash
pnpm --filter @opencap/mcp test
```

完成记录：新增 `packages/mcp/src/tool-projection.ts` 和 `packages/mcp/src/tool-projection.test.ts`，由 `buildMcpToolProjection` 统一生成模型可见 tool metadata；projection 包含 `projectionVersion`、`capabilityId`、`toolName`、`title`、`description`、`inputSchema` 和 `outputSchema`。`describeCapabilityAsTool` 已改为复用 projection builder，并在 metadata 中携带 `projectionVersion`。

### T210 P1：实现 model-visible metadata lint

- [x] T210 P1：实现 model-visible metadata lint

目标：对 manifest name、description、input/output schema descriptions 执行 prompt-surface lint。

涉及文件：

- `packages/spec/src/metadata-lint.ts`
- `packages/spec/src/index.ts`
- `packages/spec/src/metadata-lint.test.ts`

验收标准：

- 检测 instruction override。
- 检测 forced tool choice。
- 检测 bypass governance。
- 检测 secret exfiltration。
- 输出结构化 finding。

验证：

```bash
pnpm --filter @opencap/spec test
```

完成记录：新增 `packages/spec/src/metadata-lint.ts` 和 `packages/spec/src/metadata-lint.test.ts`，导出 `lintModelVisibleMetadata`，扫描 manifest 的 `name`、`description` 以及 input/output schema descriptions；当前可检测 instruction override、forced tool choice、bypass governance 和 secret exfiltration，并返回包含 rule、severity、path、message、excerpt 的结构化 finding。

### T211 P1：补充 prompt-surface negative fixtures

- [x] T211 P1：补充 prompt-surface negative fixtures

目标：把 tool description injection、schema poisoning、hidden text 等风险转成可复用测试夹具。

涉及文件：

- `packages/spec/fixtures/invalid/*.yml`
- `packages/spec/src/metadata-lint.test.ts`

验收标准：

- `ignore previous instructions` fixture 失败。
- `always call this tool` fixture 失败。
- schema field 要求填入 token fixture 失败。
- hidden unicode fixture 失败。

验证：

```bash
pnpm --filter @opencap/spec test
```

完成记录：新增 `packages/spec/fixtures/invalid/` 下四个 prompt-surface negative fixtures，覆盖 tool description injection、schema forced tool choice、schema token collection 和 hidden unicode injection；`metadata-lint.test.ts` 会加载 fixture、先确认 manifest schema 合法，再断言 lint 返回对应结构化 finding。`metadata-lint.ts` 已补充 secret collection 语义，并在匹配前移除零宽和方向控制字符以阻断隐藏注入绕过。

### T212 P1：记录 tool projection hash/evidence

- [x] T212 P1：记录 tool projection hash/evidence

目标：Runtime 或 MCP layer 能生成 projection hash，供 audit/evidence 使用。

涉及文件：

- `packages/mcp/src/tool-projection.ts`
- `packages/runtime/src/`
- `docs/设计/audit-log-v1.md`

验收标准：

- 相同输入生成相同 projection hash。
- description 或 schema 改变会改变 projection hash。
- audit/evidence 文档说明字段。

验证：

```bash
pnpm --filter @opencap/mcp test
```

完成记录：`packages/mcp/src/tool-projection.ts` 现在会为 MCP tool projection 生成稳定 `projectionHash` 和 `evidence`，hash 输入包含 projection version、capability id、tool name、title、Runtime-generated description、input schema 和 output schema；同一输入 hash 稳定，description 或 schema 变化会改变 hash。`describeCapabilityAsTool` 会在 metadata 中携带 `projectionHash`，`docs/设计/audit-log-v1.md` 已说明未来 audit/evidence 字段。

### T213 P1：MCP tools/list 使用 Runtime-generated risk summary

- [x] T213 P1：MCP tools/list 使用 Runtime-generated risk summary

目标：tools/list 的风险和权限摘要来自 Runtime/manifest structured permissions，而不是自由文本。

涉及文件：

- `packages/mcp/src/index.ts`
- `packages/mcp/src/tool-projection.ts`

验收标准：

- description 包含结构化 permissions/risk summary。
- manifest description 不能覆盖 risk summary。
- 空 permissions 时报 validation error，而不是生成空风险描述。

验证：

```bash
pnpm --filter @opencap/mcp test
```

完成记录：新增 Runtime 导出的 `buildCapabilityRiskSummary`，MCP tool projection description 使用结构化 permission/risk/confirmation summary；permission summary 包含 `resource:action:risk:confirmation`，risk summary 使用 Runtime 风险顺序。Manifest description 中伪造的 `Risk:` / `Permissions:` 片段不会进入 purpose summary；空 `permissions` 会抛出 validation error，不再生成空风险描述。

### T214 P2：Discovery profile RFC

- [x] T214 P2：Discovery profile RFC

目标：定义未来 registry search/discovery 的 profile，避免自动安装、自动授权或商业排名污染安全边界。

涉及文件：

- `rfcs/`
- `docs/生态/discovery-and-selection-boundary.md`

验收标准：

- RFC 明确 discovery metadata。
- RFC 明确 ranking 不能修改 policy。
- RFC 明确 revoked/yanked 默认隐藏。

验证：

```bash
git diff --check
```

完成记录：新增 `rfcs/0004-discovery-profile-v1.md`，定义 discovery metadata、默认过滤、ranking 边界、安装边界和 Runtime 关系；`docs/生态/discovery-and-selection-boundary.md` 已同步 Discovery Profile V1，明确 ranking 不能修改 policy、不能自动安装/授权、不能把未安装能力暴露到 MCP `tools/list`，并且 revoked/yanked 默认隐藏。

### T215 P2：Selection evidence record

- [x] T215 P2：Selection evidence record

目标：定义 Host/model 选择工具时可选记录的 evidence 字段。

涉及文件：

- `docs/生态/discovery-and-selection-boundary.md`
- `docs/质量/execution-evidence-v1.md`

验收标准：

- selection evidence 只用于审计和调试。
- 字段包含 selected tool、projection hash、available tools hash。
- 文档明确不用于授权。

验证：

```bash
git diff --check
```

完成记录：`docs/生态/discovery-and-selection-boundary.md` 已扩展 Selection Evidence schema，包含 `selected_tool_name`、`selected_capability_id`、`selected_tool_projection_hash`、`available_tools_hash` 和 `available_tools_count`；`docs/质量/execution-evidence-v1.md` 已加入 `SelectionEvidenceV1`，明确 selection evidence 只用于审计和调试，不能修改 policy、跳过 confirmation、证明授权或让未安装能力执行。

### T216 P2：Capability Review Checklist 接入 model-visible text 检查

- [x] T216 P2：Capability Review Checklist 接入 model-visible text 检查

目标：Registry 人工评审能显式检查 tool description、schema description 和 README 中的提示注入风险。

涉及文件：

- `docs/社区/capability-review-checklist.md`
- `.github/ISSUE_TEMPLATE/capability_submission.yml`

验收标准：

- checklist 包含 model-visible text 检查。
- template 提醒提交者不要写入 prompt injection 或 secret 请求。

验证：

```bash
ruby -e "require 'yaml'; Dir['.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

完成记录：`docs/社区/capability-review-checklist.md` 新增“模型可见文本”评审段，覆盖 manifest name/description、input/output schema descriptions、README、examples、隐藏指令、零宽字符和 secret 请求；`.github/ISSUE_TEMPLATE/capability_submission.yml` 新增强制勾选项，要求提交者确认没有 prompt injection、强制工具选择、绕过确认/审计、secret 请求或隐藏文本。

### T217 P2：Tool result prompt-surface sanitizer 草案

- [x] T217 P2：Tool result prompt-surface sanitizer 草案

目标：定义 provider response/error 进入模型上下文前的最小 sanitization 和结构化输出策略。

涉及文件：

- `docs/安全/prompt-surface-security-v1.md`
- `docs/设计/output-normalization-v1.md` 或后续等价文档

验收标准：

- 区分 structuredContent 和 free text。
- 明确 secret redaction。
- 明确 indirect prompt injection 作为 risk，不承诺完全消除。

验证：

```bash
git diff --check
```

完成记录：`docs/安全/prompt-surface-security-v1.md` 已明确 tool result poisoning/indirect prompt injection 只能降风险，不能承诺完全消除；`docs/设计/result-envelope-v1.md` 新增 Tool Result Prompt-Surface Sanitizer，区分 `structuredContent` 和 `content[].text`，规定 provider raw response/error 不直接进入模型上下文，secret redaction 是硬约束，sanitizer warning 进入 Result Envelope。

### T218 P2：Host tool metadata compatibility records

- [x] T218 P2：Host tool metadata compatibility records

目标：记录不同 MCP Host 对 title、description、outputSchema、annotations 和 `_meta` 的处理差异。

涉及文件：

- `docs/生态/host-compatibility-matrix.md`
- `docs/生态/interoperability-profiles.md`

验收标准：

- 至少记录 Claude Desktop、Cursor、自定义 MCP client 的字段支持情况。
- 兼容性声明绑定 Host 版本和测试日期。

验证：

```bash
git diff --check
```

完成记录：`docs/生态/host-compatibility-matrix.md` 已新增 tool metadata 字段兼容性记录，覆盖 Claude Desktop、Cursor 和自定义 MCP client，并绑定 Host version/test date；Claude Desktop 1.3561.0 和 Cursor 3.3.16 当前标记为 `pending-smoke`，自定义 MCP client 绑定 OpenCap helper tests。`docs/生态/interoperability-profiles.md` 已扩展 `opencap.host.record.v1` 字段，要求记录 title、description、outputSchema、annotations 和 `_meta` 支持情况。

### T219 P0：补齐 Tool Projection、Prompt Surface、发现选择边界和模型可见元数据治理体系

- [x] T219 P0：补齐 Tool Projection、Prompt Surface、发现选择边界和模型可见元数据治理体系

已完成：新增 Tool Projection V1、Prompt Surface Security、Discovery and Selection Boundary、Model-visible Metadata Lint、工具描述/prompt-surface 调研，并新增 ADR 0041-0043。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、Capability Review Checklist、CHANGELOG、HANDOFF 和 MCP scaffold helper。

验收标准：

- MCP tool projection 被定义为 Runtime-owned。
- model-visible metadata 被定义为 security surface。
- discovery/selection 被明确排除为授权来源。
- tool description 不再被旧文档描述为直接透传 manifest description。
- 相关风险、任务、测试和追踪矩阵闭环。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


## Epic O：Result Governance 和 Output Boundary

### T220 P1：实现 Result Envelope V1

- [x] T220 P1：实现 Result Envelope V1

目标：Runtime 统一返回 `ResultEnvelopeV1`，MCP/CLI 只做 adapter。

涉及文件：

- `packages/runtime/src/`
- `packages/mcp/src/`
- `packages/runtime/src/result-envelope.test.ts`

验收标准：

- success、dry_run、blocked、confirmation_required、failed、unknown 都能表达。
- envelope 包含 invocationId、capabilityId、status、outcome、isError、warnings、evidence。
- failed/unknown 不只返回自由文本。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：Runtime 新增 Result Envelope V1 类型和 builder，包含 `RESULT_ENVELOPE_VERSION`、`createResultEnvelope`、`resultEnvelopeFromDryRunPlan`、`resultEnvelopeFromHttpExecutionResult`、`blockedResultEnvelope` 和 `confirmationRequiredResultEnvelope`；可表达 success、dry_run、blocked、confirmation_required、failed 和 unknown。HTTP failed/timeout 会返回结构化 `error`，不会只依赖自由文本；runtime 测试新增 `packages/runtime/src/result-envelope.test.ts` 覆盖 5 个 Result Envelope 场景。

### T221 P1：实现 output schema validation

- [x] T221 P1：实现 output schema validation

目标：声明 output schema 的 Capability 只有在 structured output 校验通过后才能返回 success。

涉及文件：

- `packages/runtime/src/`
- `packages/spec/src/`
- `packages/runtime/src/output-validation.test.ts`

验收标准：

- 缺 required output 字段失败。
- 类型不匹配失败。
- schema validation finding 进入 evidence。
- output schema mismatch 不标记 success。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：Runtime 新增 `validateOutputAgainstSchema` 最小 JSON Schema 子集校验，覆盖 object/array/string/number/integer/boolean/null、required、properties 和 items；`resultEnvelopeFromHttpExecutionResult` 接收 `outputSchema` 后会把 output validation status/findings 写入 evidence。成功 HTTP 输出若缺 required 字段或类型不匹配，会返回 `status: failed`、`outcome: output_schema_invalid` 和结构化 `OUTPUT_SCHEMA_INVALID` error，不再标记 success。新增 `packages/runtime/src/output-validation.test.ts` 覆盖 4 个测试。

### T222 P1：MCP structuredContent adapter

- [x] T222 P1：MCP structuredContent adapter

目标：MCP result 优先返回 `structuredContent`，`content[].text` 只放 Runtime-generated summary。

涉及文件：

- `packages/mcp/src/`
- `packages/mcp/src/result-adapter.test.ts`

验收标准：

- success result 包含 structuredContent。
- text summary 不包含 provider raw output。
- failed/blocked/confirmation_required 都结构化。
- isError 映射正确。

验证：

```bash
pnpm --filter @opencap/mcp test
```

完成记录：MCP 层新增 `resultEnvelopeToMcpToolCallResult`，将 Runtime Result Envelope 映射为 MCP tool result：`structuredContent` 来自 envelope structured content，`content[].text` 只使用 Runtime-generated `textSummary`，`isError` 来自 envelope。`routeMcpToolCall` 在 executor 返回 Result Envelope 时走新 adapter，同时保留普通对象兼容路径。新增 `packages/mcp/src/result-adapter.test.ts` 覆盖 success、failed、blocked 和 confirmation_required。

### T223 P1：Tool result sanitizer

- [x] T223 P1：Tool result sanitizer

目标：对 provider response/error body 做 secret redaction、prompt-surface marker、size/content-type guard。

涉及文件：

- `packages/runtime/src/result-sanitizer.ts`
- `packages/runtime/src/result-sanitizer.test.ts`

验收标准：

- token/cookie/private key 被脱敏。
- instruction-like provider text 不直接进入 content text。
- HTML/script/comment 被 strip 或 summarize。
- sanitizer finding 进入 warnings/evidence。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/result-sanitizer.ts` 和 `result-sanitizer.test.ts`，提供 `sanitizeToolResult`，覆盖 secret-like key/value 脱敏、instruction-like provider text 替换为 `[SANITIZED_TEXT]`、HTML/script/comment strip、内容截断 finding。`resultEnvelopeFromHttpExecutionResult` 现在先执行 sanitizer，再做 output validation，并把 sanitizer findings 写入 Result Envelope warnings 和 evidence。

### T224 P1：Result provenance/evidence

- [x] T224 P1：Result provenance/evidence

目标：记录 result provenance、content digest、transformations 和 taint labels。

涉及文件：

- `packages/runtime/src/`
- `docs/质量/execution-evidence-v1.md`

验收标准：

- provider_untrusted/runtime_generated/secret_redacted/sanitized_text labels 可表达。
- digest 基于 redacted structured content。
- failed/unknown result 也有 provenance summary。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：Runtime Result Envelope evidence 新增 `resultContentDigest` 和 `resultProvenance`，支持 `provider_untrusted`、`runtime_generated`、`secret_redacted`、`sanitized_text` taint labels；digest 基于已脱敏/净化 structuredContent 的稳定 JSON；transformations 会记录 `secret_redaction`、`sanitized_text`、`runtime_error_envelope`。新增 `packages/runtime/src/result-provenance.test.ts` 覆盖 success sanitized output 和 failed/unknown provenance summary。

### T225 P1：Oversized result handling

- [x] T225 P1：Oversized result handling

目标：限制 provider JSON/text 大小，避免上下文污染、内存压力和成本失控。

涉及文件：

- `packages/runtime/src/`
- `packages/runtime/src/result-limits.test.ts`

验收标准：

- 超大 JSON 被阻断或截断并记录 warning。
- 超大 text 不直接进入 MCP content。
- limits 不影响 audit redaction。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：Runtime sanitizer 现在支持 `maxStructuredBytes`，对超过限制的结构化 provider result 以 `[TRUNCATED_RESULT]` 替换并记录 `CONTENT_TRUNCATED`；文本 provider output 会在进入 Result Envelope/MCP adapter 前按 `maxTextLength` 截断，MCP `content[].text` 仍只使用 Runtime-generated summary。新增 `packages/runtime/src/result-limits.test.ts` 覆盖大 JSON、大文本，以及 secret redaction 与 size limit 同时发生的场景。

### T226 P2：Host result compatibility records

- [x] T226 P2：Host result compatibility records

目标：记录不同 MCP Host 对 structuredContent、content text、isError、outputSchema 的处理差异。

涉及文件：

- `docs/生态/host-compatibility-matrix.md`
- `docs/生态/result-delivery-boundary.md`

验收标准：

- 记录 Host、版本、日期、字段行为和证据。
- 明确 OpenCap 安全不以 Host 正确处理 structuredContent 作为前提。

验证：

```bash
git diff --check
```

完成记录：补充 Tool Result 字段兼容性记录，按 Claude Desktop 1.3561.0、Cursor 3.3.16 和自定义 MCP client 记录 `structuredContent`、`content[].text`、`isError`、`outputSchema` 行为与证据等级；`pending-smoke` 与 `supported/runtime-owned` 分开标注。`result-delivery-boundary.md` 新增安全边界声明，明确 OpenCap 安全结论由 Runtime 持有，Host 兼容性记录只作为互操作证据。

### T227 P2：Output selector RFC

- [x] T227 P2：Output selector RFC

目标：定义从 provider raw JSON 映射到 manifest output schema 的 selector 机制。

涉及文件：

- `rfcs/`
- `docs/质量/output-validation-v1.md`

验收标准：

- selector 不能读取 secret。
- selector 输出必须通过 output schema。
- missing required output 失败。

验证：

```bash
git diff --check
```

完成记录：新增 `rfcs/0005-output-selector-v1.md`，定义 `output_mapping`、受限 selector 语法、只读 provider JSON body 的输入域、secret-like path 拒绝、missing required output 失败语义、schema validation 顺序和 selector evidence。同步更新 `docs/质量/output-validation-v1.md`，把 Output Selector V1 纳入输出流水线和测试要求。

### T228 P2：Resource delivery profile RFC

- [x] T228 P2：Resource delivery profile RFC

目标：定义未来大结果、resource links、embedded resources 的投递和读取边界。

涉及文件：

- `rfcs/`
- `docs/生态/result-delivery-boundary.md`

验收标准：

- resource handle 不是授权。
- resource content 进入模型前仍需 sanitizer。
- large result 默认 summary + handle。

验证：

```bash
git diff --check
```

完成记录：新增 `rfcs/0006-resource-delivery-profile-v1.md`，定义 large result 默认 summary + handle、resource handle 不是授权、resource read 重新经过 policy/data egress/sanitizer/size/media/audit gate、embedded resource 默认关闭和 evidence 字段。同步更新 `docs/生态/result-delivery-boundary.md`，把 Resource Delivery Profile V1 纳入结果投递边界。

### T229 P1：Result sanitizer negative fixtures

- [x] T229 P1：Result sanitizer negative fixtures

目标：把间接 prompt injection、secret leakage、HTML/script、oversized output 转成测试夹具。

涉及文件：

- `packages/runtime/fixtures/result-sanitizer/`
- `packages/runtime/src/result-sanitizer.test.ts`

验收标准：

- provider text 要求模型忽略指令时不直出。
- provider body 含 token 时脱敏。
- HTML script/comment 不进入 content text。
- oversized output 有 warning。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/fixtures/result-sanitizer/`，包含 indirect prompt injection、secret leakage、HTML/script/comment 和 oversized output 四个 JSON negative fixtures。`result-sanitizer.test.ts` 现在自动加载 fixture 目录并断言 sanitized value、finding code/path 和 forbidden raw text 不会出现在结果中；TDD 红灯为 fixture 目录缺失，补齐 fixtures 后测试转绿。

### T230 P2：Taint label tests

- [x] T230 P2：Taint label tests

目标：验证 result provenance 中 provider_untrusted、runtime_generated、secret_redacted、sanitized_text labels。

涉及文件：

- `packages/runtime/src/result-provenance.test.ts`

验收标准：

- provider 字段被标记 provider_untrusted。
- Runtime summary 被标记 runtime_generated。
- redacted 字段被标记 secret_redacted。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：Result provenance 现在递归标记 provider 字段级 taint，并为 Runtime-generated `textSummary` 记录 `/textSummary: runtime_generated`；redacted/sanitized 字段继续在对应路径追加 `secret_redacted` 或 `sanitized_text`。新增 `result-provenance.test.ts` 用例覆盖 provider field、Runtime summary 和现有 failed/unknown provenance。

### T231 P1：CLI result envelope output

- [x] T231 P1：CLI result envelope output

目标：CLI `invoke` 支持 Result Envelope 子集输出，并保持 secret redaction。

涉及文件：

- `packages/cli/src/`
- `docs/设计/cli-contract-v1.md`

验收标准：

- `--json` 输出 structured result envelope subset。
- 默认人类输出只显示 summary、status、warnings。
- `--verbose` 也只显示 redacted evidence。

验证：

```bash
pnpm --filter @opencap/cli test
```

完成记录：CLI `opencap invoke` 现在输出 Result Envelope 子集；默认人类输出只显示 Runtime summary、status、warnings；`--json` 默认不含 evidence；`--verbose` 才输出脱敏 evidence。dry-run、secret missing 失败和 logs 均由 CLI smoke 覆盖，且 verbose JSON 不包含 input secret。

### T232 P2：Result Envelope public type exports

- [x] T232 P2：Result Envelope public type exports

目标：定义 Result Envelope 是否由 `@opencap/runtime` 或独立 contract 包导出。

涉及文件：

- `packages/runtime/src/index.ts`
- `packages/spec/src/index.ts` 或 future contracts package
- `docs/规范/versioning-and-compatibility.md`

验收标准：

- 公共类型版本化。
- breaking change 进入 CHANGELOG。
- MCP/CLI adapter 不复制类型定义。

验证：

```bash
pnpm --filter @opencap/runtime build
```

完成记录：明确 Result Envelope V1 公共类型当前由 `@opencap/runtime` 导出，暂不拆独立 contracts package；CLI/MCP adapter 必须 import runtime 类型，不复制本地接口。`versioning-and-compatibility.md` 记录 `envelopeVersion`、兼容/破坏性变化规则和未来 `@opencap/contracts` re-export 过渡要求；`result-envelope-v1.md` 补充公共导出边界。

### T233 P0：补齐 Result Envelope、输出校验、结果净化、结果来源和投递边界体系

- [x] T233 P0：补齐 Result Envelope、输出校验、结果净化、结果来源和投递边界体系

已完成：新增 Result Envelope V1、Output Validation V1、Tool Result Sanitization V1、Result Provenance V1、Result Delivery Boundary、Result Governance 调研，并新增 ADR 0044-0046。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、README、CHANGELOG、HANDOFF、MCP interface、HTTP execution 和 execution evidence 文档。

验收标准：

- Provider raw output 默认不进入模型上下文。
- 声明 output schema 的结果必须通过校验后才能 success。
- Result Envelope 成为 Runtime 到 MCP/CLI 的稳定输出边界。
- Tool result sanitizer、provenance、taint label 和 delivery boundary 均进入任务队列。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


## Epic P：Input Governance 和 Data Egress Boundary

### T234 P1：实现 input classification engine

- [x] T234 P1：实现 input classification engine

目标：对 validated input 执行本地分类，识别 secret_like、pii、source_code、internal_url、financial_data、free_text_unknown 等类别。

涉及文件：

- `packages/runtime/src/input-classifier.ts`
- `packages/runtime/src/input-classifier.test.ts`

验收标准：

- token-like 字段和值被识别为 secret_like。
- email/phone-like 被识别为 pii。
- localhost/private IP/metadata URL 被识别为 internal_url。
- `.env`/diff/stack trace 被识别为 source_code 或 secret_like。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/input-classifier.ts` 和 `input-classifier.test.ts`，导出 `classifyInput`，覆盖 secret_like、pii、internal_url、source_code/config、financial_data 和 free_text_unknown，并生成字段级 findings、聚合 dataClasses 和 redactedPreview。TDD 红灯为模块缺失，补齐实现后测试转绿。

### T235 P1：补充 sensitive input classification fixtures

- [x] T235 P1：补充 sensitive input classification fixtures

目标：建立可复用输入分类测试夹具。

涉及文件：

- `packages/runtime/fixtures/input-classification/`
- `packages/runtime/src/input-classifier.test.ts`

验收标准：

- secret-like fixture。
- pii fixture。
- internal URL fixture。
- source/config fixture。
- large free text unknown fixture。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/fixtures/input-classification/`，包含 secret-like、pii、internal URL、source/config 和 large free text unknown 五个 JSON fixtures。`input-classifier.test.ts` 现在自动加载 fixtures，断言 expected data classes、field findings 和 redacted preview 不含敏感原文。

### T236 P1：实现 Data Egress Policy Gate

- [x] T236 P1：实现 Data Egress Policy Gate

目标：根据 data classes、provider、target origin、risk 和 destination 判断外发 allow/ask/deny/redact。

涉及文件：

- `packages/runtime/src/data-egress-policy.ts`
- `packages/runtime/src/invoke-pipeline.ts`
- `docs/设计/data-egress-policy-v1.md`

验收标准：

- secret_like 默认 deny。
- internal_url 默认 deny。
- pii/source_code 到 external_send 默认 ask。
- egress deny 不解析 secret、不执行。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/data-egress-policy.ts` 和 `data-egress-policy.test.ts`，导出 `defaultDataEgressPolicy` 与 `evaluateDataEgressPolicy`。默认规则覆盖 `secret_like` deny、`internal_url` deny、`pii/source_code` 到 `external_send` ask，并通过 `secretResolutionAllowed=false` 和 `executionAllowed=false` 锁定 deny 后不得解析 secret、不得执行。测试覆盖 provider、target origin、risk 和 destination 组合匹配。

### T237 P1：记录 egress decision audit fields

- [x] T237 P1：记录 egress decision audit fields

目标：audit log 记录 data classes、egress target、egress decision、policy rule id 和 redacted preview。

涉及文件：

- `docs/设计/audit-log-v1.md`
- `packages/runtime/src/audit*`

验收标准：

- egress deny 也写 audit。
- requestStarted false。
- audit 不含 secret 原文。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：扩展 `AuditEvent`、`InMemoryAuditLogger` 和 `SqliteAuditLogger`，新增 `createDataEgressAuditEvent` 与 `recordDataEgressDecision`。审计事件现在记录 egress decision、data classes、target origin、matched rule、redacted preview 和 `requestStarted=false`；SQLite `invocations` 表会持久化这些字段并支持既有数据库列迁移。新增测试覆盖 egress deny audit、logger 写入和 SQLite 查询不含 secret 原文。

### T238 P1：confirmation summary 展示 data classes 和 egress target

- [x] T238 P1：confirmation summary 展示 data classes 和 egress target

目标：用户确认写操作或外发操作时，能看到将发送给谁、发送哪些数据类别。

涉及文件：

- `docs/设计/confirmation-and-consent-v1.md`
- `packages/runtime/src/confirmation*`

验收标准：

- confirmation request 包含 target origin。
- 包含 data classes。
- 包含 fields sent。
- preview 已脱敏。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 Runtime `ConfirmationEgressSummary`、`ConfirmationRequest.egress` 和 `confirmationSummaryFromDataEgress`。CLI confirmation prompt 现在展示 target origin、data classes、fields sent 和 redacted preview；MCP no-elicitation 的 `confirmation_required` reason 也携带同一份外发摘要。测试覆盖 prompt 不含原始敏感值。

### T239 P1：input provenance audit evidence

- [x] T239 P1：input provenance audit evidence

目标：记录 input source、input hash、derivedFromInvocationId、egress decision 和 transformations。

涉及文件：

- `packages/runtime/src/`
- `docs/质量/input-provenance-v1.md`

验收标准：

- model_generated/user_supplied/tool_derived/runtime_generated 可表达。
- tool_derived 记录来源 invocation。
- 不记录 input 原文。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `InputProvenanceEvidence`、`InputProvenanceSource` 和 `createInputProvenanceEvidence`，可表达 `user_supplied`、`model_generated`、`tool_derived`、`runtime_generated`。`AuditEvent.inputProvenance` 会被 SQLite logger 持久化到 `input_provenance_json` 并在查询时恢复结构化对象；测试覆盖 tool-derived source invocation、transformations、egress decision 和不记录 input 原文。

### T240 P1：field-level egress map

- [x] T240 P1：field-level egress map

目标：记录 input 字段分别进入 URL/query/header/body 的映射。

涉及文件：

- `packages/runtime/src/http-renderer.ts`
- `packages/runtime/src/egress-map.test.ts`

验收标准：

- 每个 rendered field 有 destination。
- 未引用字段不出现在 map 中。
- destination 包含 data classes。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/egress-map.ts` 和 `egress-map.test.ts`，导出 `buildFieldLevelEgressMap`。HTTP manifest 的 URL 模板字段会映射到 `url`/`query`，`execution.body.fields` 会映射到 `body`；未被引用的 input 字段不会出现在 map 中，每个字段携带 data classes 和 redacted 状态，且不记录字段值。

### T241 P2：derived input evidence chain

- [x] T241 P2：derived input evidence chain

目标：当 input 来自上一步工具结果时，记录上游 invocation 和 result digest。

涉及文件：

- `docs/质量/input-provenance-v1.md`
- `docs/设计/multi-step-execution-boundary.md`

验收标准：

- 记录 derivedFromInvocationId。
- 记录 source result digest。
- derived input 仍需重新分类和 egress policy。

验证：

```bash
git diff --check
```

完成记录：`InputProvenanceEvidence` 新增 `sourceResultDigest`，`createInputProvenanceEvidence` 可从 `sourceResult` 计算稳定 digest，但不保存 source result 原文。`docs/设计/multi-step-execution-boundary.md` 已补充派生 input 不能继承上游授权，仍需重新分类和经过 egress policy。

### T242 P1：按 execution mapping 做 input minimization

- [x] T242 P1：按 execution mapping 做 input minimization

目标：只发送 execution.url/query/header/body 引用的 input 字段。

涉及文件：

- `packages/runtime/src/http-renderer.ts`
- `packages/runtime/src/input-minimization.test.ts`

验收标准：

- 未引用 input 字段不进入 request。
- 不自动把整个 input 当 body。
- optional missing field 被省略。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/input-minimization.ts` 和 `input-minimization.test.ts`，导出 `minimizeInputByEgressMap`。Runtime 现在可基于 field-level egress map 提取最小化 input；未引用字段不会进入结果，不会把整个 input 自动作为 body，缺失 optional 字段会被省略。

### T243 P1：redacted egress preview

- [x] T243 P1：redacted egress preview

目标：为 confirmation、dry-run 和 audit 生成脱敏外发预览。

涉及文件：

- `packages/runtime/src/egress-preview.ts`
- `packages/runtime/src/egress-preview.test.ts`

验收标准：

- preview 显示 target、fields sent、data classes。
- secret-like 字段不出现原文。
- 大段文本摘要化。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/egress-preview.ts` 和 `egress-preview.test.ts`，导出 `buildRedactedEgressPreview`。Preview 包含 target origin、fields sent、data classes 和 redacted input；secret-like/source/internal/financial 会硬脱敏，PII 局部遮蔽，大段 free text 会摘要化，不包含未引用字段。

### T244 P1：dry-run egress preview

- [x] T244 P1：dry-run egress preview

目标：`opencap invoke --dry-run` 展示请求计划和 redacted egress preview，不读取 secret 原值，不发请求。

涉及文件：

- `packages/cli/src/`
- `packages/runtime/src/`

验收标准：

- dry-run 输出 target origin。
- 输出 fields sent 和 data classes。
- 不读取 secret 原值。
- requestStarted false。

验证：

```bash
pnpm --filter @opencap/cli test
pnpm --filter @opencap/runtime test
```

完成记录：`buildHttpDryRunPlan` 现在基于 input classification、field-level egress map 和 input minimization 生成 `egressPreview`，并把 target origin、fields sent、data classes 和 redacted input 放入 dry-run Result Envelope。CLI 人类输出会展示 egress preview；dry-run 审计记录 `requestStarted=false`、`egressTargetOrigin`、`egressDataClasses` 和 `egressRedactedPreviewJson`，不读取 secret 原值、不发送请求。

### T245 P1：internal URL/source/config egress negative tests

- [x] T245 P1：internal URL/source/config egress negative tests

目标：验证内部 URL、源码、配置和 secret-like 文本不会静默外发。

涉及文件：

- `packages/runtime/src/data-egress-policy.test.ts`

验收标准：

- private IP URL in body/query -> deny。
- `.env` content -> deny or redact+ask。
- stack trace/source diff -> ask。
- metadata service URL -> deny。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：`packages/runtime/src/data-egress-policy.test.ts` 新增从真实 input classification 和 field-level egress map 生成 context 的负向测试，覆盖 private IP URL query、metadata service URL body、`.env`/config secret assignment、stack trace 和 source diff。默认策略继续确保 internal_url/secret_like deny 不解析 secret、不执行，source_code 到 external_send 进入 ask。

### T246 P2：manifest data class hint RFC

- [x] T246 P2：manifest data class hint RFC

目标：定义 manifest input schema 的 `x-opencap-data-class` hint。

涉及文件：

- `rfcs/`
- `docs/安全/data-classification-v1.md`

验收标准：

- hint 不能降低 classifier finding。
- hint 可提高 review 透明度。
- schema extension 有兼容策略。

验证：

```bash
git diff --check
```

完成记录：新增 `rfcs/0007-manifest-data-class-hint-v1.md`，定义 `x-opencap-data-class` 的字段形状、与 classifier finding 的合并规则、review/lint 用法和 JSON Schema extension 兼容策略。同步更新 `docs/安全/data-classification-v1.md`，明确 hint 是透明度信号，不是授权或降级机制。

### T247 P2：organization data policy RFC

- [x] T247 P2：organization data policy RFC

目标：定义未来组织级 data egress policy、provider allowlist 和 DLP provider profile。

涉及文件：

- `rfcs/`
- `docs/设计/data-egress-policy-v1.md`

验收标准：

- local-first OSS 仍可独立运行。
- 组织策略不把 Cloud 变成 V1 主路径前置条件。
- 外部 DLP provider 不默认接收 input 原文。

验证：

```bash
git diff --check
```

完成记录：新增 `rfcs/0008-organization-data-policy-v1.md`，定义组织级 data egress policy、provider allowlist、DLP provider profile、metadata-only 默认边界和 local-first OSS 独立运行要求。同步更新 `docs/设计/data-egress-policy-v1.md`，明确组织策略不能放宽内置 safety floor、确认、secret boundary、outbound policy 或 audit。

### T248 P0：补齐输入数据治理、数据分类、外发策略、输入来源和数据最小化体系

- [x] T248 P0：补齐输入数据治理、数据分类、外发策略、输入来源和数据最小化体系

已完成：新增 Input Data Governance V1、Data Classification V1、Data Egress Policy V1、Input Provenance V1、Data Minimization and Redaction V1、Input Egress 调研，并新增 ADR 0047-0049。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、README、CHANGELOG 和 HANDOFF。

验收标准：

- Tool input 在分类前视为 untrusted data。
- Data Egress Gate 在 Secret Resolver 和 Executor 前运行。
- Runtime 只外发 execution mapping 引用字段。
- confirmation/dry-run/audit 都使用 redacted egress preview。
- PII/source/internal URL/secret-like input 风险进入任务、测试和风险登记。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

---

## Epic Q：Policy Governance

### T249 P1：实现 policy decision trace

- [x] T249 P1：实现 policy decision trace

目标：每次 risk policy、data egress、quota/budget、outbound、lifecycle gate 的决策都能生成脱敏 trace。

涉及文件：

- `packages/runtime/src/policy*`
- `packages/runtime/src/audit*`
- `docs/设计/policy-decision-trace-v1.md`

验收标准：

- trace 包含 policySetId、policyRevision、gate、decision、matchedRuleId、reasonCode。
- trace 记录 evaluated facts 的脱敏摘要。
- default decision used 可见。
- deny trace 中 `secretResolutionAllowed=false`。
- trace 不包含 input 原文、secret-like value 或 token。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/policy-trace.ts`，导出 `POLICY_TRACE_VERSION` 和 `PolicyDecisionTraceV1`；risk policy 与 data egress gate 都会生成脱敏 decision trace。`AuditEvent.policyTrace` 已接入内存审计和 SQLite `policy_trace_json`，CLI dry-run/blocked 审计和 data egress audit 会携带 trace。Runtime 测试数从 122 增至 125。

### T250 P1：实现 policy explain CLI

- [x] T250 P1：实现 policy explain CLI

目标：用户可以通过 CLI 理解某次调用为什么被允许、确认、拒绝或阻断。

涉及文件：

- `packages/cli/src/`
- `packages/runtime/src/policy*`
- `docs/设计/cli-contract-v1.md`

验收标准：

- `opencap invoke <id> --dry-run --explain` 展示 effective decision summary。
- 输出包含 blocking gate、matched rule、reason code、policy revision。
- MCP 结果只暴露简短 reason code，不暴露完整内部 policy。
- explain 输出默认不显示敏感 input 原文。

验证：

```bash
pnpm --filter @opencap/cli test
pnpm --filter @opencap/runtime test
```

完成记录：`opencap invoke --dry-run --explain` 已接入 policy decision trace 摘要，输出 final decision、blocking gate、matched rule、reason code、policy revision、secret/execution 状态和脱敏 evaluated facts。CLI smoke test 覆盖 explain 输出不含敏感 input 原文。

### T251 P1：实现 policy change audit/ledger

- [x] T251 P1：实现 policy change audit/ledger

目标：policy 激活、回滚和覆盖都留下本地可查询记录。

涉及文件：

- `packages/runtime/src/policy-ledger*`
- `packages/cli/src/`
- `docs/运营/policy-lifecycle-and-change-control.md`

验收标准：

- 每次 policy activation 记录 revision、digest、from/to revision、reason。
- rollback 是重新激活旧 revision，不删除历史。
- failed activation 不覆盖当前 active policy。
- ledger 记录不包含 secret 或 input 原文。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/policy-ledger.ts` 和 `policy-ledger.test.ts`，导出 `FilePolicyLedger` 及相关记录类型。Ledger 支持 activation、rollback 和 failed_activation；rollback 追加新记录不删除历史；failed activation 不覆盖当前 active policy；记录只含 revision、digest、reason 和 diff summary，不保存 policy 原文、secret 或 input 原文。Runtime 测试数从 125 增至 129。

### T252 P1：实现 policy validate lint

- [x] T252 P1：实现 policy validate lint

目标：在 policy 生效前发现语法错误、未知字段、未知 risk/decision 和危险规则。

涉及文件：

- `packages/runtime/src/policy-validator*`
- `packages/cli/src/`
- `docs/设计/policy-dsl-v1.md`

验收标准：

- 非法 decision/risk 返回结构化错误。
- 重复 rule id 返回 warning/error。
- 未命名高风险 allow rule 返回 finding。
- 输出包含文件路径、字段路径和 rule id。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/cli test
```

完成记录：新增 `packages/runtime/src/policy-validator.ts` 和 `policy-validator.test.ts`，导出 `validatePolicyYml` 及结构化 finding 类型。CLI 新增 `opencap policy validate <path>`，普通输出包含 severity、code、file path、field path 和 rule id，`--json` 输出完整结果。Runtime 测试数从 129 增至 132，CLI smoke 已覆盖 policy validate lint。

### T253 P1：实现 policy simulation/diff

- [x] T253 P1：实现 policy simulation/diff

目标：策略变更生效前，能看到哪些场景从 ask/deny 变成 allow，哪些能力被收紧。

涉及文件：

- `packages/runtime/src/policy-simulation*`
- `packages/cli/src/`
- `docs/质量/policy-simulation-and-diff-v1.md`

验收标准：

- 支持 policyBefore/policyAfter + scenarios。
- 识别 `new_allow`、`ask_to_allow`、`deny_to_ask`、`data_egress_relaxed`。
- simulation report 不含 input 原文。
- unchanged policy 产生 empty diff。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/cli test
```

完成记录：新增 `packages/runtime/src/policy-simulation.ts` 和 `policy-simulation.test.ts`，导出 `simulatePolicyDiff` 及 report/finding/scenario 类型。CLI 新增 `opencap policy simulate --before <path> --after <path> --scenarios <path> [--json]`，支持策略变更前生成差异报告，检测 `new_allow`、`ask_to_allow`、`deny_to_ask`、`data_egress_relaxed` 和 `financial_relaxed`，并保证 report 不包含 input 原文。Runtime 测试数从 132 增至 135，CLI smoke 已覆盖 policy simulate。

### T254 P1：实现 broad allow safety checks

- [x] T254 P1：实现 broad allow safety checks

目标：防止高风险 broad allow 静默进入 active policy。

涉及文件：

- `packages/runtime/src/policy-validator*`
- `packages/runtime/src/policy-simulation*`

验收标准：

- `risk: write` + `decision: allow` 无 capability/resource 限定时产生 high finding。
- `external_send`、`destructive`、`financial` allow 缺少确认边界时阻断或高危告警。
- data class 为 `secret_like`、`pii`、`source_code` 时 broad egress allow 产生 error。
- findings 可被 policy activation 使用。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：`validatePolicyYml` 新增 `POLICY_BROAD_ALLOW_HIGH_RISK` warning 和 `POLICY_BROAD_ALLOW_REQUIRES_BOUNDARY` error。`write` broad allow 缺少 `capability_id`/`resource` 会被标记；`external_send`、`destructive`、`financial` allow 必须同时限定 `capability_id`、`resource` 和 `action`。`simulatePolicyDiff` 新增 `broad_data_egress_allow` error，用于标记 `secret_like`、`pii`、`source_code` 被 broad allow 外发的场景。Runtime 测试数从 135 增至 138。

### T255 P1：实现 policy override/breakglass controls

- [x] T255 P1：实现 policy override/breakglass controls

目标：支持有限的本地临时 override，同时保证它不能变成无审计后门。

涉及文件：

- `packages/runtime/src/policy-override*`
- `packages/runtime/src/audit*`
- `docs/安全/policy-override-and-breakglass-v1.md`

验收标准：

- 支持 `allow_once`、`allow_until`、`deny_override`、`breakglass` 记录。
- expired override 不生效。
- breakglass 必须有 reason 和短过期时间。
- override 写入 policy trace 和 audit。
- override 不能覆盖 data egress deny、outbound private block、revoked/malicious block。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
```

完成记录：新增 `packages/runtime/src/policy-override.ts` 和 `policy-override.test.ts`，导出 `applyPolicyOverrides`、`consumePolicyOverride`、`validatePolicyOverrideRecord` 和 `createPolicyOverrideAuditEvent`。V1 支持 `allow_once`、`allow_until`、`deny_override`、`breakglass` record；过期 override 被忽略；breakglass 必须有 reason 且 15 分钟内过期；override 结果会写入 `decisionTrace`/`policyTrace` 和 audit event；allow/breakglass 不能覆盖 data egress deny、outbound block、revoked/malicious capability 或 financial explicit confirmation。Runtime 测试数从 138 增至 143。

### T256 P2：policy bundle manifest/signing RFC

- [x] T256 P2：policy bundle manifest/signing RFC

目标：为未来本地 bundle、组织 bundle 和签名策略留下兼容路径，但不进入 V1 主路径。

涉及文件：

- `rfcs/`
- `docs/运营/policy-lifecycle-and-change-control.md`
- `docs/安全/signing-and-provenance-roadmap.md`

验收标准：

- RFC 定义 bundle digest、optional signature、activation record。
- 明确 failed activation 不覆盖当前 active policy。
- 明确 Cloud/org bundle 不能成为 OSS Runtime 启动依赖。

验证：

```bash
git diff --check
```

完成记录：新增 `rfcs/0009-policy-bundle-manifest-signing-v1.md`，定义 policy bundle manifest、digest、optional signature、activation record、failed activation 和 local-first 约束；`docs/运营/policy-lifecycle-and-change-control.md` 与 `docs/安全/signing-and-provenance-roadmap.md` 已同步引用。RFC 明确签名只能证明来源和完整性，不能证明策略安全；Cloud/org bundle 不能成为开源 Runtime 启动依赖。

### T257 P1：policy simulation fixtures

- [x] T257 P1：policy simulation fixtures

目标：建立一组稳定场景用于 policy simulation、broad allow 检查和 conformance。

涉及文件：

- `packages/runtime/test/fixtures/policies/`
- `packages/runtime/test/fixtures/policy-scenarios/`

验收标准：

- 覆盖 read_only、write、external_send、destructive、financial。
- 覆盖 pii、secret_like、source_code、internal_url。
- 覆盖 trust/lifecycle/advisory 事实。
- fixture 不包含真实 secret 或个人数据。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/test/fixtures/policies/`，包含 `baseline-ask.yml`、`scoped-allow.yml` 和 `broad-allow-after.yml`；新增 `packages/runtime/test/fixtures/policy-scenarios/governance.yml`，覆盖 read_only/write/external_send/destructive/financial、pii/secret_like/source_code/internal_url，以及 trust/lifecycle/advisoryStatus 事实。新增 `policy-fixtures.test.ts` 校验 policy fixture 无 error、scenario coverage 完整且不包含真实邮箱、GitHub token 或 bearer token。Runtime 测试数从 143 增至 145。

### T258 P2：policy incident runbook

- [x] T258 P2：policy incident runbook

目标：当用户误放开策略、能力被滥用或需要紧急阻断时，有可操作恢复流程。

涉及文件：

- `docs/运营/policy-incident-runbook.md`
- `docs/安全/policy-override-and-breakglass-v1.md`

验收标准：

- 包含 revoke override、activate deny policy、review audit、rollback policy 的步骤。
- 明确哪些场景允许 breakglass，哪些场景必须 deny。
- 与 capability advisory/revocation 流程相互引用。

验证：

```bash
git diff --check
```

完成记录：新增 `docs/运营/policy-incident-runbook.md`，覆盖事故分级、撤销 override、激活 deny policy、审查 audit、rollback policy、breakglass 允许/禁止矩阵、advisory/revocation 联动和复盘清单。`docs/安全/policy-override-and-breakglass-v1.md`、`docs/README.md` 和 `docs/INDEX.md` 已加入入口或互链。

### T259 P2：decision log export

- [x] T259 P2：decision log export

目标：允许用户导出脱敏 policy trace 和 decision summary，用于本地复盘或组织审查。

涉及文件：

- `packages/cli/src/`
- `packages/runtime/src/audit*`

验收标准：

- 支持按 capability、time range、decision 筛选。
- export 不包含 input 原文、secret-like value 或 token。
- export 关联 invocation id、policy revision 和 trace id。

验证：

```bash
pnpm --filter @opencap/cli test
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/decision-log.ts` 和 `decision-log.test.ts`，导出 `exportDecisionLogRecords`，只输出 invocation id、capability、decision/status、policy revision、trace id、reason code、egress 元数据和 input hash，不输出 `inputRedactedJson` 或 egress preview 原文。`SqliteAuditLogger.recent()` 新增 `policyDecision` 和 `until` 过滤；CLI 新增 `opencap decision-log export`，支持 `--capability`、`--decision`、`--since`、`--until`、`--limit`、`--json`。Runtime 测试数从 145 增至 147，CLI smoke 已覆盖导出命令。

### T260 P1：policy governance conformance tests

- [x] T260 P1：policy governance conformance tests

目标：把 policy governance 的安全承诺转成一致性测试组。

涉及文件：

- `docs/质量/conformance-suite-v1.md`
- `packages/runtime/src/**/*.test.ts`

验收标准：

- 覆盖 decision trace。
- 覆盖 policy change audit。
- 覆盖 broad allow simulation。
- 覆盖 override/breakglass negative tests。
- 覆盖 audit redaction。

验证：

```bash
pnpm --filter @opencap/runtime test
```

完成记录：新增 `packages/runtime/src/policy-governance-conformance.test.ts` 和 `packages/runtime/test/fixtures/conformance/policy-governance.yml`。Conformance checks 覆盖 `C-PG-001` decision trace redaction、`C-PG-002` policy change ledger、`C-PG-003` broad allow simulation、`C-PG-004` breakglass hard boundary、`C-PG-005` audit redaction export。Runtime 测试数从 147 增至 153。

### T261 P0：补齐 Policy Decision Trace、策略生命周期、策略模拟和 override/breakglass 体系

- [x] T261 P0：补齐 Policy Decision Trace、策略生命周期、策略模拟和 override/breakglass 体系

已完成：新增 Policy Decision Trace V1、Policy Lifecycle and Change Control、Policy Simulation and Diff V1、Policy Override and Breakglass V1、Policy Governance 调研，并新增 ADR 0050-0053。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、README、CHANGELOG 和 HANDOFF。

验收标准：

- 每个 policy/gate decision 都有 redacted trace 设计。
- Policy 变更有 revision、digest、activation、rollback 和 change record 设计。
- Broad allow 和 ask/deny -> allow 有 simulation/diff 检查路径。
- Override/breakglass 不能绕过 audit、egress deny、outbound block、secret ordering 或 revoked block。
- 相关风险、任务、conformance 和 ADR 均进入文档体系。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T262 P0：重新梳理中文文档入口、索引和文档规范

- [x] T262 P0：重新梳理中文文档入口、索引和文档规范

已完成：新增 `docs/README.md` 作为中文文档中心，新增 `docs/社区/documentation-governance.md` 作为中文文档规范，重写 `docs/INDEX.md` 为维护者索引，收敛根 `README.md` 的超长文档清单，并中文化 GitHub issue/PR 模板、变更日志、AGENTS 和一批用户可见标题。

验收标准：

- 新人可以从 `docs/README.md` 进入文档，不需要在文件树里盲找。
- `docs/INDEX.md` 只承担维护者索引职责，不再堆全部文档流水账。
- README 只保留关键入口，不再复制完整文档目录。
- 文档默认中文，技术专有名词保留规则写入规范。
- GitHub 模板和显眼文档标题中文化。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T263 P0：整理 docs 根目录文件并归位参考、教程、规范和模板

- [x] T263 P0：整理 docs 根目录文件并归位参考、教程、规范和模板

已完成：将散落在 `docs/` 根目录的普通文档移动到对应目录：介绍进入 `docs/概览/`，快速开始进入 `docs/教程/`，能力清单进入 `docs/规范/`，权限和安全模型进入 `docs/安全/`，运行时架构进入 `docs/设计/`，Registry 指南和中文文档规范进入 `docs/社区/`，任务模板进入 `docs/规划/`。同步更新全仓引用、文档中心、维护者索引和交接文档。

验收标准：

- `docs/` 根目录只保留核心入口、状态和治理文件。
- 被移动文档的全仓引用已更新。
- 文档中心和维护者索引反映新的目录职责。
- 自动化仍能找到 `docs/TASKS.md`、`docs/HANDOFF.md`、`docs/TESTING.md` 等核心文件。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T264 P0：中文化 docs 子目录结构并同步全仓链接

- [x] T264 P0：中文化 docs 子目录结构并同步全仓链接

已完成：将 `docs/community`、`docs/design`、`docs/security`、`docs/research` 等英文子目录统一迁移为 `docs/社区/`、`docs/设计/`、`docs/安全/`、`docs/调研/` 等中文目录；同步更新 README、AGENTS、GitHub 模板、文档入口、维护者索引、任务表、追踪矩阵和各设计/调研文档中的相对链接。真实工程路径仍保持 `packages/spec` 等代码目录名，避免破坏构建和工具链。

验收标准：

- `docs/` 下一层目录全部使用中文业务分类。
- 全仓不再引用旧的英文文档子目录路径。
- 文档中心、维护者索引和中文文档规范说明新的目录职责。
- 工程代码路径没有被文档目录中文化误改。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T265 P0：补齐整体系统设计 V1

- [x] T265 P0：补齐整体系统设计 V1

已完成：新增 `docs/设计/整体系统设计-v1.md`，把 OpenCap 的总体架构收敛为标准面、控制面、执行面、信任面和互操作面五个平面，并明确能力供应链、调用执行链、证据反馈链、Runtime Kernel、四种账本、四张卡片、执行前门禁顺序和分阶段生态闭环。同步更新文档中心、维护者索引、体系蓝图、架构总览、产品规格、追踪矩阵、变更日志和交接记录。

验收标准：

- 整体设计能解释 OpenCap 为什么不是 Agent、Marketplace 或单纯 MCP 聚合器。
- Runtime Kernel 与 MCP/A2A/Apps SDK/OpenAPI adapter 的边界清晰。
- 设计能把现有安全、策略、审计、Registry、互操作和质量文档串起来。
- 下一步实现入口仍保持 T001，不因新增设计改变 V1 主路径。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T266 P0：完成整体设计二次审查和工程补强任务拆解

- [x] T266 P0：完成整体设计二次审查和工程补强任务拆解

已完成：新增 `docs/评审/整体设计二次审查-2026-05-08.md`，从工程闭环角度复盘整体设计，明确 Runtime Kernel public contract、Gate 抽象、Ledger、Card、Profile evidence、Registry sync、Capability identity、Provenance、Authoring loop 和 Release maturity gates 十个补强方向。同步新增 T267-T276 后续任务，并更新文档中心、维护者索引、体系蓝图、追踪矩阵、变更日志和交接记录。

验收标准：

- 二次审查不新增产品范围，而是把现有整体设计压实为工程对象和验收问题。
- 每个主要缺口都有建议产物和对应任务编号。
- 下一步实现入口仍保持 T001，架构补强任务作为并行契约工作推进。
- 外部标准参考只作为边界校准，不把 OpenCap 绑定到单一协议或平台。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T277 P0：创建项目 conda 开发环境

- [x] T277 P0：创建项目 conda 开发环境

已完成：创建 `ai-capability-runtime` conda 环境，路径为 `/opt/anaconda3/envs/ai-capability-runtime`，包含 Python 3.11、Node.js 22 和 pnpm 9.15。新增 `environment.yml` 和 `docs/教程/开发环境.md`，安装 pnpm workspace 依赖并生成 `pnpm-lock.yaml`，同步 README、文档中心、验证策略和交接记录。

验收标准：

- `conda env list` 能看到 `ai-capability-runtime`。
- 环境内 Python、Node.js、pnpm 版本可查询。
- 仓库包含可复现的 `environment.yml`。
- 仓库包含 `pnpm-lock.yaml`。
- 文档说明如何激活环境和安装依赖。

验证：

```bash
/opt/anaconda3/envs/ai-capability-runtime/bin/python --version
/opt/anaconda3/envs/ai-capability-runtime/bin/node --version
/opt/anaconda3/envs/ai-capability-runtime/bin/pnpm --version
pnpm build
pnpm test
```
