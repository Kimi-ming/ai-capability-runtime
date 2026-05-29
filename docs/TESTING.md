# 验证策略

运行验证前建议激活项目环境：

```bash
conda activate ai-capability-runtime
```

环境定义见 `environment.yml` 和 `docs/教程/开发环境.md`。

本文定义 OpenCap 开发过程中的验证方式。任务完成前必须运行对应验证，不能运行时要在 `docs/HANDOFF.md` 说明原因。

## 当前可运行校验

### Git diff 空白检查

```bash
git diff --check
```

### JSON 解析检查

```bash
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
```

### YAML 解析检查

```bash
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### Conformance evidence summary

```bash
pnpm --filter @opencap/cli dev -- conformance report --records packages/runtime/test/fixtures/conformance --json
```

该命令只汇总本地 conformance YAML records，用于 release/conformance evidence；它不读取/写入 state dir，不调用 provider，不代表 Cloud、Console、OAuth、marketplace、payment 或真实 Host UI 全兼容。

### Release evidence bundle

```bash
RELEASE_EVIDENCE_OUTPUT="$(mktemp "${TMPDIR:-/tmp}/opencap-release-evidence.XXXXXX")"
RELEASE_VALIDATION_OUTPUT="$(mktemp "${TMPDIR:-/tmp}/opencap-release-validation.XXXXXX")"
pnpm --filter @opencap/cli dev -- release evidence \
  --registry registry \
  --records packages/runtime/test/fixtures/conformance \
  --generated-at 2026-05-29T00:00:00.000Z \
  --output "$RELEASE_EVIDENCE_OUTPUT" \
  --json
pnpm --filter @opencap/cli dev -- release artifact validate \
  --file "$RELEASE_EVIDENCE_OUTPUT" \
  --output "$RELEASE_VALIDATION_OUTPUT" \
  --json
rm -f "$RELEASE_EVIDENCE_OUTPUT" "$RELEASE_VALIDATION_OUTPUT"
```

该命令汇总本地 Registry quality、conformance records、可选 package readiness 和命令状态，用于生成 `opencap.release_evidence.v1`，随后用 `opencap release artifact validate` 生成 `opencap.release_artifact_validation.v1` validation report。对应测试入口是 `packages/cli/src/release-evidence-command.test.ts`、`packages/cli/src/release-artifact-command.test.ts` 和 `packages/spec/src/release-evidence-artifact.test.ts`；测试覆盖默认时间戳、`--generated-at` 可复现输入、人类输出时间字段、release evidence `--output` 安全写文件、validation report `--output` 安全写文件、危险输出路径拒绝、artifact valid/invalid report、release decision consistency 和非法参数用户错误。Bundle 只作为本地 release evidence，不替代 GitHub required checks、真实 Host UI smoke、npm trusted publishing、workflow publish dry-run、release approval、tag 创建或真实 npm 发布。

### Local metrics

```bash
pnpm --filter @opencap/cli dev -- metrics summary --state-dir opencap.local --json
pnpm --filter @opencap/cli dev -- metrics capabilities --state-dir opencap.local --json
pnpm --filter @opencap/cli dev -- metrics security --state-dir opencap.local --json
```

这些命令只从本地 SQLite audit log 的脱敏 operational metadata 派生 summary、capability quality aggregate 和 security counts；它们不读取 provider secret，不执行 Capability，不输出 input/output/egress preview 原文。

## Workspace 校验

依赖安装后，当前应支持：

```bash
pnpm install
pnpm validate
pnpm test
pnpm build
pnpm lint
```

如果因为网络或依赖未安装不能运行，需要在交接文档中记录。

最近全量验证：2026-05-28 在项目 conda 环境中通过 `pnpm validate`、`pnpm lint`、`pnpm build` 和 `pnpm test`。当前 `pnpm validate` 覆盖 5 个 registry manifest、5 个 manifest 的 model-visible metadata lint、5 个 manifest 的 least-privilege auth lint、5 个 Capability package lint、5 个 registry test 和 1 个 Capability advisory/revocation metadata 文件；`pnpm test` 覆盖 spec 77 个、runtime 295 个、mcp 26 个、cli 24 个测试。V1 alpha/local runtime evidence bundle 见 `docs/releases/evidence/v1-alpha-local-runtime-2026-05-28.md`；该证据不宣称 Cloud、Console、OAuth、marketplace、payment 或真实 Host UI 全兼容。`node:sqlite` ExperimentalWarning 仍是已知环境提示。

## 当前单元测试基础设施

根目录 `pnpm test` 当前执行 `pnpm -r test`，会运行 workspace 中已声明 `test` 脚本的包。现阶段测试基础设施已经覆盖 `@opencap/spec`、`@opencap/runtime`、`@opencap/mcp`、CLI smoke、command snapshot、用户错误 exit code、Capability Card 和 Trust Card 输出测试。

当前测试入口：

- `packages/spec/src/index.test.ts`：Manifest validator、registry test schema 基础行为、`auth.placement`、auth credential descriptor schema 约束、lifecycle status schema、package/release provenance metadata 和 `execution.reconcile` 恢复提示 schema，当前覆盖 27 个测试。`packages/spec/src/registry-search.test.ts`：Registry search lifecycle filtering，覆盖默认隐藏 yanked/revoked、deprecated 仍可发现和显式 include lifecycle，当前覆盖 1 个测试。`packages/spec/src/registry-quality-summary.test.ts`：Registry quality summary helper，覆盖当前 5 个 registry Capability 的 manifest/package/test/auth/advisory/lifecycle/quality evidence summary，并确认 revoked `http.request_demo` 不被误判为默认可信安装能力，当前覆盖 1 个测试。`packages/spec/src/conformance-summary.test.ts`：Conformance summary helper，覆盖当前 runtime conformance records 的 `opencap.conformance_summary.v1` 汇总、`policyEffect: none` 边界和 invalid record 脱敏摘要，当前覆盖 2 个测试。`packages/spec/src/release-evidence.test.ts`：Release evidence bundle helper，覆盖 registry/conformance/package/command evidence 聚合、candidate/block-release-tag decision、blocker code 和 token/path/secret 文本脱敏，当前覆盖 2 个测试。`packages/spec/src/release-evidence-artifact.test.ts`：Release evidence artifact validation helper，覆盖保存后的 `opencap.release_evidence.v1` JSON artifact 结构校验、`policyEffect: none`、invalid schema/timestamp/command status/policy effect、secret/path/log 文本拒绝、decision 与 blockers/failed evidence/not-run evidence 的一致性，当前覆盖 5 个测试。`packages/spec/src/capability-scaffold.test.ts`：Capability scaffold helper，覆盖 V1 HTTP scaffold 生成、manifest/authoring/package/registry test 校验链、敏感文本边界和危险输入拒绝，当前覆盖 3 个测试。`packages/spec/src/metadata-lint.test.ts`：model-visible metadata lint，覆盖 prompt-surface injection 四类风险和四个 negative fixtures，当前覆盖 9 个测试。`packages/spec/src/conformance.test.ts`：conformance suite skeleton，覆盖 V1 核心分组、现有 runtime conformance records、缺字段 record 和不安全 artifact path，当前覆盖 4 个测试。`packages/spec/src/privacy-retention-doc-lint.test.ts`：privacy retention 文档 lint，覆盖真实 V1 文档通过，以及不完整文档缺失本地优先、遥测、脱敏、`input_hash`、保留、删除、Host 日志和非目标边界，当前覆盖 2 个测试。`packages/spec/src/credential-lifecycle-doc-lint.test.ts`：credential lifecycle runbook lint，覆盖真实凭据生命周期手册通过，以及不完整手册缺失 env-only、policy/consent/outbound 顺序、secret 不存储、轮换、missing env、external 401、audit redaction 和 list redaction 边界，当前覆盖 2 个测试。`packages/spec/src/github-token-guide-doc-lint.test.ts`：GitHub fine-grained token setup guide lint，覆盖真实指南通过，以及不完整指南缺失官方来源、fine-grained PAT、单仓库、Issues write、过期、组织审批、env-only、轮换撤销和 classic/broad token 警告，当前覆盖 2 个测试。`packages/spec/src/security-policy-doc-lint.test.ts`：SECURITY.md private reporting lint，覆盖真实安全政策通过，以及不完整政策缺失 private vulnerability reporting、公开 issue 禁止、敏感材料边界、报告内容、维护者 triage、advisory process、启用检查和官方 GitHub docs，当前覆盖 2 个测试。`packages/spec/src/npm-publish-workflow.test.ts`：npm publish workflow lint，覆盖真实 manual dry-run workflow 通过，以及自动触发、非候选包、长期 `NPM_TOKEN`、非 dry-run publish 和宽权限负向 fixture，当前覆盖 2 个测试。`packages/spec/src/npm-package-readiness.test.ts`：npm package readiness report，覆盖真实 `@opencap/spec` / `@opencap/cli` 当前 readiness、`files` allowlist，以及 `.env`、`opencap.local/`、SQLite/log、token-shaped pack file 和危险 allowlist 负向 fixture，当前覆盖 3 个测试。`packages/spec/src/auth-lint.test.ts`：least-privilege auth lint，覆盖 provider/resource mismatch、read-only permission 携带 elevated scope、elevated permission 只声明 read-only scope、overbroad scope 和 `auth.type: none` 边界，当前覆盖 6 个测试。`packages/spec/src/authoring.test.ts`：Capability authoring loop/lint 顺序、阻断目标、progress helper、authoring manifest validation、least-privilege auth lint 集成和 registry path validation，当前覆盖 9 个测试。`packages/spec/src/package-lint.test.ts`：Capability package lint，覆盖 manifest/README/tests、目录 id/category 一致性、禁止本地状态/secret-shaped/DB 文件和 registry path validation，当前覆盖 5 个测试。`packages/spec/src/advisory.test.ts`：Capability advisory YAML schema 和 Registry revocation metadata，覆盖有效 advisory、id/capability/severity 校验、affected_versions/modified_at/runtime_default 必填或枚举、freeze/revoke/published 状态组合，以及 `registry/advisories/OCAP-2026-0001.yml` revoked metadata，当前覆盖 5 个测试；spec 包合计 92 个测试。
- `packages/runtime/src/index.test.ts`：state dir、state dir precedence、install/list/load、policy、confirmation、step-level composition consent receipts、consent receipt audit fields、audit、redaction/hash、HTTP dry-run/executor、execution semantics audit fields、composition context audit evidence、unknown timeout audit evidence、`execution.body.fields` required/optional 渲染、audit failure preflight、outbound policy 私网阻断、dry-run egress preview、risk policy decision trace、Runtime Ledger install/invoke 派生、ledger 写失败传播、token passthrough 禁止、credential audit evidence、lifecycle warnings 等 Runtime 行为，当前覆盖 102 个测试。`packages/runtime/src/composition-recovery.test.ts`：Composition failure recovery smoke tests，覆盖 required write step unknown 需要 reconcile、blocked step 停止后续、external_send 失败形成 partial 且不自动补偿、compensation step 失败进入 manual review，当前覆盖 4 个测试。`packages/runtime/src/usage-event.test.ts`：Usage event schema，覆盖 blocked usage redaction、dry-run 与真实执行分离、retryAttempt 不增加 user intent、revoked/deprecated lifecycle 标记和 sourceAuditHash，当前覆盖 4 个测试。`packages/runtime/src/usage-export.test.ts`：Usage export format，覆盖 JSON envelope、JSONL header、额外敏感字段不外泄、非 `billingEffect=none` / 非 v1 usage event 拒绝，当前覆盖 3 个测试。`packages/runtime/src/metrics.test.ts`：Local audit metrics summary helper，覆盖 since/until/capability 过滤、status/policy/security counts、duration p50/p95、`policyEffect: none` 和不复制 input/output/egress preview/secret 字段，当前覆盖 2 个测试。`packages/runtime/src/quality-score.test.ts`：Capability quality score rubric helper，覆盖透明维度计分、band 映射、维度 clamp 和 `policyEffect: none`，当前覆盖 2 个测试。`packages/runtime/src/domain.test.ts`：Runtime Kernel public contract、capability identity、invocation request/plan、GateDecision、Consent、RuntimeError、execution semantics evidence 和 dry-run envelope helper，当前覆盖 7 个测试。`packages/runtime/src/retry-policy.test.ts`：HTTP retry policy decision helper，覆盖 V1 默认不自动 retry、非幂等写操作不 retry、unknown timeout reconcile、401/403 不 retry、显式 read-only retry 和 idempotency key hash evidence，当前覆盖 6 个测试。`packages/runtime/src/advisory-check.test.ts`：Installed capability advisory check，覆盖 installed capability 与 registry advisory metadata 匹配、revoked runtime default 摘要和无关能力不报告 advisory，当前覆盖 2 个测试。`packages/runtime/src/trust-transition.test.ts`：Trust level transition helper，覆盖逐级升级、跳级升级拒绝、High advisory/failing tests 冻结和 downgrade/revoke 不授予 policy 权限，当前覆盖 4 个测试。`packages/runtime/src/lifecycle-gate.test.ts`：revoked invoke lifecycle gate，覆盖 revoked 写/高风险 pre-secret deny、revoked read-only ask、read-only explicit override allow 和非 revoked 不改变 policy 权限，当前覆盖 4 个测试。`packages/runtime/src/policy-score.test.ts`：quality score 只能进入 policy trace evidence，不能把默认 ask 改成 allow，也不能覆盖显式 deny，当前覆盖 2 个测试。`packages/runtime/src/quota-budget-gate.test.ts`：quota/budget gate pre-secret decision，覆盖 quota deny、quota ask、budget deny 不被 trust/quality 绕过和 evidence redaction，当前覆盖 4 个测试。`packages/runtime/src/financial-consent-spend-gate.test.ts`：financial consent/spend cap pre-secret gate，覆盖 financial 必须 explicit approved consent、approved consent 后仍检查 spend cap、evidence redaction 和非 financial 不触发 consent gate，当前覆盖 4 个测试。`packages/runtime/src/provider-rate-limit.test.ts`：provider 429 rate limit evidence、Retry-After/RateLimit-Reset 解析、header redaction 和非幂等写操作不自动 retry，当前覆盖 2 个测试。`packages/runtime/src/problem-details.test.ts`：quota/rate problem details，覆盖 quota exceeded、budget exceeded、provider 429 safe headers、root export 和 input/output/secret 脱敏边界，当前覆盖 4 个测试。`packages/runtime/src/abuse-throttle.test.ts`：local abuse throttle pre-secret gate，覆盖循环调用 deny、ask confirmation required、warn allow evidence 和 external_send 默认低频基线，当前覆盖 4 个测试。`packages/runtime/src/gate.test.ts`：Runtime Gate public contract、`GateDecision` 执行语义、hard boundary 默认值和同步/异步 gate evaluator，当前覆盖 3 个测试。`packages/runtime/src/ledger.test.ts`：四类 ledger record V1、append-only storage contract、record id 前缀、root export 和原文/secret 边界，当前覆盖 4 个测试。`packages/runtime/src/ledger-store.test.ts`：本地 JSONL Runtime Ledger Store，覆盖四类 ledger family 分文件 append、kind-specific query、recordedAt range、cursor/limit、latest lookup、root export 和 raw payload/secret-shaped metadata 拒绝，当前覆盖 5 个测试。`packages/runtime/src/card.test.ts`：四类 Card document V1、Card 生成 helper、Trust Card disclaimer、Trust Card installed capability 生成规则、完整 quality score 结构和无 policy effect 限制语、Consent runtime-generated boundary、Compatibility known gaps 和 root export，当前覆盖 7 个测试。`packages/runtime/src/identity.test.ts`：Capability identity helper、audit key、路径无关 identity digest、SemVer/digest validation、lifecycle 默认语义和 root export，当前覆盖 5 个测试。`packages/runtime/src/package-exports.test.ts`：workspace package public export map、spec schema subpath 和 CLI bin-only public surface，当前覆盖 3 个测试。`packages/runtime/src/secret-resolver.test.ts`：Secret Resolver env provider，覆盖 bearer/header、dry-run 不读取 secret、missing env、unsupported placement、forbidden header、auth none 和 unsupported auth，当前覆盖 7 个测试。`packages/runtime/src/credential-lifecycle.test.ts`：credential lifecycle smoke，覆盖 env token 轮换不改 manifest、audit credential redaction、missing env 与 external 401 区分、missing env 不发起 fetch、installed list 不展示 credential value/env/header，当前覆盖 3 个测试。`packages/runtime/src/policy-ledger.test.ts`：policy activation、rollback、failed activation 和 ledger redaction，当前覆盖 4 个测试。`packages/runtime/src/policy-validator.test.ts`：policy validate/lint 的非法 decision/risk、未知字段、重复 rule id、未命名高风险 allow、write broad allow warning 和 external_send/destructive/financial scoped boundary error，当前覆盖 5 个测试。`packages/runtime/src/policy-override.test.ts`：policy override/breakglass 的 allow_once 消耗、expired ignore、breakglass reason/短过期、硬安全门不可绕过和 audit/trace evidence，当前覆盖 5 个测试。`packages/runtime/src/policy-fixtures.test.ts`：policy simulation fixtures 的 policy YAML 校验、risk/data/trust/lifecycle/advisory coverage 和无真实敏感值检查，当前覆盖 2 个测试。`packages/runtime/src/decision-log.test.ts`：decision log export 的脱敏摘要、trace id、policy revision 和 capability/time range/decision 查询过滤，当前覆盖 2 个测试。`packages/runtime/src/policy-governance-conformance.test.ts`：C-PG policy governance conformance，覆盖 decision trace、policy ledger、broad allow simulation、breakglass 硬边界和 audit redaction export，当前覆盖 6 个测试。`packages/runtime/src/threat-model-abuse-cases.test.ts`：Threat Model Abuse Case smoke/conformance，覆盖 AC-001 到 AC-007 的写操作确认、URL token 外发阻断、任意 URL 内网阻断、MCP confirmation_required、audit preflight、policy relaxation 和 breakglass 硬边界，当前覆盖 8 个测试。`packages/runtime/src/agentic-abuse-cases.test.ts`：Agentic Abuse Case smoke/conformance，覆盖 prompt-injection-like body 仍需确认、localhost outbound block、重复高风险调用独立 audit/consent、任意 URL warning、MCP confirmation_required 和超大输出限制，当前覆盖 7 个测试。`packages/runtime/src/policy-simulation.test.ts`：policy simulation/diff 的 ask_to_allow、new_allow、deny_to_ask、data_egress_relaxed、broad_data_egress_allow、unchanged empty diff 和 report 不含 input 原文，当前覆盖 4 个测试。`packages/runtime/src/input-classifier.test.ts`：input classification engine 和 `packages/runtime/fixtures/input-classification/` sensitive fixtures，覆盖 secret_like、pii、internal_url、source_code/config 和 free_text_unknown，当前覆盖 10 个测试。`packages/runtime/src/data-egress-policy.test.ts`：Data Egress Policy Gate 默认决策、provider/origin/risk/destination 匹配、internal URL/source/config 负向外发、decision trace 和 pre-secret 边界，当前覆盖 14 个测试。`packages/runtime/src/egress-map.test.ts`：field-level egress map URL/query/body destination、未引用字段过滤和 data classes 映射，当前覆盖 2 个测试。`packages/runtime/src/input-minimization.test.ts`：按 execution mapping 最小化 input、禁止自动 whole-body、optional missing field 省略，当前覆盖 3 个测试。`packages/runtime/src/egress-preview.test.ts`：redacted egress preview target、fields sent、data classes、secret redaction 和大段文本摘要，当前覆盖 1 个测试。`packages/runtime/src/result-envelope.test.ts`：Result Envelope V1 success/dry_run/blocked/confirmation_required/failed/unknown 映射、execution semantics evidence 和 unknown timeout timestamp 边界，当前覆盖 7 个测试。`packages/runtime/src/output-validation.test.ts`：output schema validation required/type/finding/envelope failure，当前覆盖 4 个测试。`packages/runtime/src/result-sanitizer.test.ts`：tool result sanitizer secret redaction、prompt marker、HTML strip、envelope warning/evidence，以及 `packages/runtime/fixtures/result-sanitizer/` negative fixtures，当前覆盖 8 个测试。`packages/runtime/src/result-provenance.test.ts`：result content digest、transformations、字段级 taint labels、Runtime summary taint 和 failed/unknown provenance，当前覆盖 3 个测试。`packages/runtime/src/result-limits.test.ts`：oversized structured/text result、MCP summary 边界和 size limit/redaction 顺序，当前覆盖 3 个测试；Runtime 包合计 295 个测试。
- `packages/mcp/src/index.test.ts`：tool name mapping、tools/list projection、tools/call routing、deny/ask/confirmation_required 结果格式等 MCP helper 行为，当前覆盖 9 个测试。`packages/mcp/src/sdk-server.test.ts`：MCP SDK server wiring，覆盖 SDK 依赖记录、tools/list handler、tools/call handler、server factory 和 state-backed factory，当前覆盖 4 个测试。`packages/mcp/src/sdk-stdio-smoke.test.ts`：自动化 MCP stdio smoke，使用官方 SDK client 启动 `opencap serve --mcp`，在临时 state dir 验证 `tools/list`、read-only allow 到 secret boundary、write ask 的 `CONFIRMATION_REQUIRED` 和 stdout JSON-RPC 协议边界，当前覆盖 1 个测试。`packages/mcp/src/tool-mapping-contract.test.ts`：MCP tool mapping contract snapshots，覆盖多段 id 映射、冲突诊断、tools/list 的 mapped name/original capability id/schema/projection metadata，以及 tools/call 只能通过 mapped tool name 路由，当前覆盖 3 个测试。`packages/mcp/src/tool-projection.test.ts`：MCP Tool Projection metadata、projection hash/evidence 和 Runtime-generated risk summary，当前覆盖 6 个测试。`packages/mcp/src/result-adapter.test.ts`：Result Envelope 到 MCP structuredContent/content/isError 适配，当前覆盖 3 个测试；MCP 包合计 26 个测试。
- `packages/cli/src/metrics-command.test.ts`：CLI metrics tests，覆盖 `opencap metrics summary --state-dir <path> --json` 的脱敏 summary、人类输出、capability filter、secret missing 计数、非法 since/until 用户错误和参数校验早于 SQLite 初始化，并覆盖 `opencap metrics capabilities --json` 的 per-capability aggregate、error rate、last seen 和 `opencap metrics security` 的 JSON/人类输出，当前覆盖 5 个测试。`packages/cli/src/release-evidence-command.test.ts`：CLI release evidence tests，覆盖 `opencap release evidence --registry <path> --records <path> --json` 的脱敏 bundle、默认非 epoch 时间戳、`--generated-at` 可复现输入、`--output` 安全写文件、危险输出路径拒绝、人类输出时间字段、package readiness 输入、非法时间参数、package 参数用户错误，当前覆盖 8 个测试。`packages/cli/src/release-artifact-command.test.ts`：CLI release artifact validation tests，覆盖 `opencap release artifact validate --file <path> --json` 的 valid report、人类输出、含 secret/path/log artifact 的 invalid report、`--output` 安全写 validation report、invalid artifact 写 report 后 exit `1`、非法 JSON 不写 report 和非法 JSON 用户错误，当前覆盖 8 个测试。`packages/cli/src/release-package-report-command.test.ts`：CLI release package report tests，覆盖 `opencap release package report --package <name> --json` 的 package readiness report、`--pack-json` dry-run 摘要、forbidden files、人类输出、unsupported package 和 invalid pack JSON 用户错误，并使用临时 npm cache 对 `@opencap/spec` / `@opencap/cli` 跑本地 `npm pack --dry-run --json` smoke，当前覆盖 5 个测试。`packages/cli/src/conformance-report-command.test.ts`：CLI conformance report tests，覆盖 `opencap conformance report --records <path> --json` 的脱敏 summary、临时 cwd 不创建 `opencap.local`、人类输出和 invalid record exit `1`，当前覆盖 3 个测试。`packages/cli/src/doctor-command.test.ts`：CLI doctor JSON tests，覆盖空 state 的脱敏 machine-readable diagnostics、已安装 state、invalid installed entry 和人类输出兼容，当前覆盖 2 个测试。`packages/cli/src/ledger-command.test.ts`：CLI Runtime Ledger export tests，覆盖空 ledger 友好输出、JSON 导出、kind/capability/limit 筛选、secret-missing blocked invocation 脱敏和非法参数 exit `1`，当前覆盖 3 个测试。`packages/cli/src/registry-report-command.test.ts`：CLI Registry report tests，覆盖 `opencap registry report --registry <path> --json` 的脱敏 quality summary、临时 cwd 不创建 `opencap.local`，以及人类输出的 lifecycle/advisory/quality/blocking summary，当前覆盖 2 个测试。`packages/cli/src/card-command.test.ts`：CLI Capability/Trust Card output tests，覆盖已安装 Capability 输出脱敏 `opencap.card.v1` JSON、manifest digest evidence、auth credential redaction、`--kind trust` 输出 trust level/maintainer/advisory/provenance/limitations/disclaimer、Trust Card 不修改 state，以及未安装和非法 `--kind` 返回用户错误 exit `1` 且不打印 stack，当前覆盖 4 个测试。`packages/cli/src/error-exit-code.test.ts`：CLI error model / exit code tests，覆盖 missing installed capability、invalid `--input-json` 和 invalid `--limit` 作为用户可修正错误返回 exit `1`，stderr 不输出 stack trace，当前覆盖 2 个测试。`packages/cli/src/command-snapshot.test.ts`：CLI command snapshot tests，使用临时 `--state-dir` 覆盖 validate 成功输出、空 list/logs/decision-log、已安装 list 人类表格和 JSON 输出、policy validate 用户错误输出与 exit code，并归一化 `<repo>`、`<state>` 和 Node warning pid，当前覆盖 2 个测试。`packages/cli/src/smoke.test.ts`：CLI 端到端 smoke，使用临时 `--state-dir` 跑通 validate、install、list JSON 和人类表格 lifecycle/trust 字段、invoke dry-run Result Envelope JSON、dry-run egress preview、人类 summary 输出、policy explain、policy validate lint、policy simulation/diff、secret missing verbose redacted evidence、install/invoke Runtime Ledger JSONL 写入、logs 和 decision-log export，当前覆盖 1 个测试；CLI 包合计 45 个测试。

当前缺口：

- CLI 已覆盖 smoke、command snapshot、stdout/stderr、exit code 和 Capability Card 输出；后续新增命令仍需按同一模式补临时 state dir 测试。
- `apps/console` 和 `apps/registry-web` 仍是占位应用，当前没有前端单元测试要求。
- Secret Resolver env provider、credential audit evidence、audit failure preflight 和 outbound policy 私网阻断已实现；更完整的 conformance smoke 仍是后续任务，需要按下面的模块计划继续补齐。

## 临时目录测试策略

所有会写入本地状态的自动化测试和 smoke 命令必须使用显式临时 state dir，不能直接写入仓库根目录或用户真实项目下的 `opencap.local/`。Runtime 单元测试优先使用 `createTempOpenCapTestProject(prefix)`，该 helper 基于 `mkdtemp(join(tmpdir(), prefix))` 创建临时 cwd，并提供独立 `stateDir`、默认 state dir 断言路径和 `cleanup()`。

测试要求：

- install/list/load/logs 相关单测使用临时 cwd 或显式 `stateDir`。
- 需要证明不污染默认 `opencap.local/` 时，传入显式 `stateDir` 并断言临时 cwd 下的默认 `opencap.local/` 不存在。
- CLI smoke 涉及 install/list/doctor/invoke/logs 时必须传 `--state-dir "$SMOKE_STATE_DIR"`，结束后删除该临时目录。
- 不得在测试中依赖开发者机器上的真实 `opencap.local/`、真实 token 或已有安装状态。

## CI 校验

GitHub Actions workflow `.github/workflows/validate.yml` 在 `push` 到 `main` 和 `pull_request` 时运行。

Registry 校验 job：

```bash
pnpm install --frozen-lockfile
pnpm validate
```

该 job 不需要外部 secret，失败时应优先检查 Capability manifest schema、model-visible metadata lint、least-privilege auth lint 和 `tests/basic.yml` registry test 格式。workflow 也保留 workspace tests job，用于运行：

```bash
pnpm test
pnpm build
```

本地校验 workflow 结构时使用 Ruby YAML parser；远端 Actions 结果如果尚未运行，需要在 `docs/HANDOFF.md` 记录。

## 模块测试计划

### `@opencap/spec`

当前 `pnpm validate` 已能校验 registry manifests、model-visible metadata lint、least-privilege auth lint 和 registry tests，`packages/spec/src/index.test.ts` 已覆盖 validator 基础行为和 `auth.placement` 约束，`packages/spec/src/metadata-lint.test.ts` 已覆盖模型可见 metadata lint，`packages/spec/src/auth-lint.test.ts` 已覆盖 least-privilege auth lint，`packages/spec/src/authoring.test.ts` 已覆盖 authoring loop/lint 顺序和 authoring validation 集成。后续继续扩展时应保持覆盖：

- 合法 HTTP manifest 通过
- `type: mcp` 失败
- 缺必填字段失败
- 权限 risk 非法失败
- timeout 超出范围失败
- 错误信息包含路径
- `api_key` 必须声明 `provider`、`env` 和 `placement`
- `header` placement 必须声明 `name`
- query/body secret placement 失败
- model-visible metadata lint 对 instruction override、forced tool choice、bypass governance、secret exfiltration 返回结构化 finding，并使用 negative fixtures 覆盖 schema poisoning、token collection 和 hidden unicode injection
- least-privilege auth lint 对 provider/resource mismatch、read-only permission 携带 elevated scope、elevated permission 只声明 read-only scope、wildcard/admin/full/repo 等 overbroad scope 返回结构化 finding
- authoring loop 顺序固定为 manifest schema -> package shape -> model-visible metadata -> least-privilege/risk -> secret hygiene -> registry tests -> dry-run -> review-ready

### `@opencap/cli`

当前状态：CLI 包已配置 `test` 脚本，并通过 `packages/cli/src/smoke.test.ts` 覆盖 validate/install/list/invoke dry-run/logs 的最小闭环，通过 `packages/cli/src/command-snapshot.test.ts` 锁定 validate/list/logs/decision-log/policy validate 的稳定 stdout/stderr/exit code，通过 `packages/cli/src/error-exit-code.test.ts` 覆盖用户可修正错误 exit `1`，通过 `packages/cli/src/card-command.test.ts` 覆盖 `opencap card` 的脱敏 Capability Card JSON 输出、Trust Card JSON 输出、未安装错误和非法 kind 错误，通过 `packages/cli/src/doctor-command.test.ts` 覆盖 `opencap doctor --json` 的脱敏 diagnostics、installed/invalid count 和人类输出兼容，通过 `packages/cli/src/conformance-report-command.test.ts` 覆盖 `opencap conformance report` JSON/人类输出、invalid record 和不写 state 边界，通过 `packages/cli/src/ledger-command.test.ts` 覆盖 `opencap ledger export` 脱敏导出，通过 `packages/cli/src/registry-report-command.test.ts` 覆盖 `opencap registry report` JSON/人类输出和不写 state 边界。后续补测试时仍应优先使用临时 state dir，避免污染真实 `opencap.local/`。

必须覆盖：

- `opencap validate <path>` 成功和失败
- `opencap install <id>` 找不到时报错
- `opencap install <id>` 多重匹配时报错
- `opencap list` 空状态和有安装状态
- exit code 正确
- CLI stdout/stderr snapshot 符合 `docs/设计/cli-contract-v1.md`，并继续扩展到 T137 的错误模型和 exit code 细粒度场景

### `@opencap/runtime`

必须覆盖：

- state dir 初始化
- `--state-dir` / `OPENCAP_STATE_DIR` / cwd precedence
- installed capability loading
- input validation
- policy allow/ask/deny
- confirmation_required 行为
- denied 调用不执行 executor
- audit log 对成功、失败、拒绝都写入
- redaction/hash 正确
- Result Envelope V1 能表达 success、dry_run、blocked、confirmation_required、failed 和 unknown，failed/unknown 包含结构化 error
- output schema validation 对缺 required 字段、类型不匹配返回 finding，并且 schema mismatch 不标记 success
- tool result sanitizer 对 secret-like 字段/值脱敏，替换 instruction-like provider text，strip HTML/script/comment，并把 finding 写入 warnings/evidence
- result provenance/evidence 记录基于 redacted structured content 的 digest、transformations 和 taint labels，failed/unknown 也有 provenance summary
- oversized structured result 会以 `[TRUNCATED_RESULT]` 替换并记录 `CONTENT_TRUNCATED`，oversized text 会截断且不进入 MCP `content[].text` 原文，size limit 不绕过 secret redaction evidence
- result sanitizer negative fixtures 覆盖 indirect prompt injection、secret leakage、HTML/script/comment 和 oversized output，可作为后续 conformance fixture 的来源
- input classification engine 覆盖 token-like、email/phone、localhost/private IP/metadata URL、`.env`/diff/stack trace 和 large free text unknown
- input classification fixtures 覆盖 secret-like、pii、internal URL、source/config 和 large free text unknown，并验证 redacted preview 不含敏感原文

### Secret Resolver

必须覆盖：

- `deny`、`ask declined`、`confirmation_required` 不调用 Secret Resolver
- dry-run 默认不读取 secret 原值
- env var 缺失返回 `SecretMissingError`
- bearer/header placement 不泄露 secret
- query placement 被拒绝
- input token 不能替代 manifest auth
- audit log 只记录 env var 名称和 redacted summary

### HTTP Executor

必须覆盖：

- URL 模板渲染
- GET 请求 dry-run
- POST JSON body
- `auth.placement: bearer` 生成 Authorization header 但日志不记录 secret
- env API key 缺失报错
- timeout 设置
- resolved URL 写入审计字段
- outbound policy 阻断 localhost/private IP/metadata service
- 审计失败不执行写操作
- POST/PATCH 写操作默认不自动 retry
- timeout after request 返回 `unknown_after_timeout`
- provider request id 进入 audit evidence
- retryAttempt 记录正确
- dry-run 不产生 request_started evidence

### `@opencap/mcp`

必须覆盖：

- Capability id 到 tool name 映射
- tool name 冲突检测
- tool input schema 透传
- MCP call 路由到 runtime
- `ask` 且无 elicitation 时返回 confirmation_required
- error mapping 符合 `docs/设计/error-model-v1.md`
- tool projection hash 稳定，且 description/schema 改变时 hash 改变
- tools/list description 使用结构化 permission/risk/confirmation summary，manifest description 不能覆盖 risk summary，空 permissions 失败
- Result Envelope adapter 优先返回 structuredContent，content text 只使用 Runtime-generated summary，failed/blocked/confirmation_required 映射为 isError
- 自动化 stdio smoke 必须使用临时 state dir 启动 `opencap serve --mcp`，验证 `tools/list` 稳定投影、read-only allow 路径、write ask 的 `confirmation_required`，以及 stdout 只承载 MCP JSON-RPC；由于 `tsx` 会创建本地 IPC pipe，该测试在 Codex 沙箱内可能触发 `listen EPERM`，需要在 conda 环境下以沙箱外权限运行。

## 手动 Smoke Test

### Smoke 1：本地 CLI 闭环

```bash
SMOKE_STATE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/opencap-smoke-state.XXXXXX")"
opencap validate registry/developer-tools/github.create_issue
opencap install github.create_issue --state-dir "$SMOKE_STATE_DIR"
opencap list --state-dir "$SMOKE_STATE_DIR"
opencap doctor --state-dir "$SMOKE_STATE_DIR"
opencap invoke github.create_issue --dry-run --state-dir "$SMOKE_STATE_DIR" --input examples/github-issue-capability/input.json
opencap logs --state-dir "$SMOKE_STATE_DIR"
rm -rf "$SMOKE_STATE_DIR"
```

期望：

- validate 成功
- install 创建 `$SMOKE_STATE_DIR/installed/github.create_issue`，不创建仓库根目录 `opencap.local/`
- list 显示 capability
- dry-run 不调用 GitHub API
- logs 有记录

### Smoke 2：MCP Host 发现工具

```bash
opencap serve --mcp
```

期望：

- Host 能看到 `github_create_issue`
- description 来自 Runtime tool projection，包含 risk 信息
- input schema 来自 manifest

### Smoke 3：写操作确认

期望：

- `github.create_issue` 在 write policy 下不会静默执行
- MCP 无 elicitation 时返回 `confirmation_required`
- 审计日志记录未执行原因

## Conformance Suite 目标

V1 后续要把普通测试提升为 profile-driven conformance。测试分组见 `docs/质量/conformance-suite-v1.md`。

最小要求：

- Manifest conformance 覆盖合法和非法 manifest。
- Runtime conformance 证明所有调用经过 validation/policy/confirmation/audit。
- Consent conformance 证明 `ask` 不会在无确认通道时执行。
- Security conformance 覆盖 secret redaction、secret resolver ordering、outbound policy、token passthrough 禁止。
- MCP conformance 覆盖 tools/list、tools/call、confirmation_required 和 tool name collision。
- Execution conformance 覆盖 request_started、outcome、retryAttempt、unknown_after_timeout 和 execution evidence redaction。
- Composition conformance 覆盖 compositionId、step-level consent、planHash 只作 evidence、evidence chain 不含 raw plan/input/output/secret、compensation 独立授权。
- Trust conformance 覆盖 trust level 不覆盖 policy、revoked capability 警告/阻断、quality score 不改变 risk。
- Usage conformance 当前由 `packages/runtime/test/fixtures/conformance/usage-evidence.yml` 记录，覆盖 quota/budget gate 在 secret 前运行、usage event 不含 input/output/secret、financial spend cap 阻断、retryAttempt 不重复计量、revoked/deprecated usage 标记和 sourceAuditHash 关联 audit record。
- Prompt-surface conformance 覆盖 tool projection、description lint、schema poisoning negative fixtures、projection hash 和 runtime-generated risk summary。
- Result conformance 覆盖 Result Envelope、structuredContent、output schema validation、provider raw text 不直出、result sanitizer、provenance/taint labels。
- Input/egress conformance 覆盖 input classification、secret-like/PII/internal URL 检测、data egress gate 在 secret 前运行、field-level egress map、dry-run redacted preview。
- Policy governance conformance 覆盖 decision trace、policy change audit、broad allow simulation、override/breakglass 硬边界。

## CI 目标

短期：

- JSON/YAML/schema validation
- registry test case schema validation
- TypeScript build
- unit tests

中期：

- registry manifest validation
- registry test format validation
- OpenSSF Scorecard baseline
- registry mock tests
- CLI smoke tests

长期：

- MCP integration tests
- GitHub API mock tests
- OpenTelemetry export tests
