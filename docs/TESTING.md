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

最近全量验证：2026-05-14 在项目 conda 环境中通过 `pnpm validate`、`pnpm lint`、`pnpm build` 和 `pnpm test`。当前 `pnpm validate` 覆盖 5 个 registry manifest、5 个 manifest 的 model-visible metadata lint、5 个 manifest 的 least-privilege auth lint、5 个 Capability package lint、5 个 registry test 和 1 个 Capability advisory/revocation metadata 文件；`pnpm test` 覆盖 spec 57 个、runtime 246 个、mcp 21 个、cli 5 个测试。`node:sqlite` ExperimentalWarning 仍是已知环境提示。

## 当前单元测试基础设施

根目录 `pnpm test` 当前执行 `pnpm -r test`，会运行 workspace 中已声明 `test` 脚本的包。现阶段测试基础设施已经覆盖 `@opencap/spec`、`@opencap/runtime`、`@opencap/mcp` 和 CLI smoke test。CLI 已有端到端 smoke 覆盖，但尚未建立完整 command snapshot tests。

当前测试入口：

- `packages/spec/src/index.test.ts`：Manifest validator、registry test schema 基础行为、`auth.placement`、auth credential descriptor schema 约束和 lifecycle status schema，当前覆盖 23 个测试。`packages/spec/src/metadata-lint.test.ts`：model-visible metadata lint，覆盖 prompt-surface injection 四类风险和四个 negative fixtures，当前覆盖 9 个测试。`packages/spec/src/auth-lint.test.ts`：least-privilege auth lint，覆盖 provider/resource mismatch、read-only permission 携带 elevated scope、elevated permission 只声明 read-only scope、overbroad scope 和 `auth.type: none` 边界，当前覆盖 6 个测试。`packages/spec/src/authoring.test.ts`：Capability authoring loop/lint 顺序、阻断目标、progress helper、authoring manifest validation、least-privilege auth lint 集成和 registry path validation，当前覆盖 9 个测试。`packages/spec/src/package-lint.test.ts`：Capability package lint，覆盖 manifest/README/tests、目录 id/category 一致性、禁止本地状态/secret-shaped/DB 文件和 registry path validation，当前覆盖 5 个测试。`packages/spec/src/advisory.test.ts`：Capability advisory YAML schema 和 Registry revocation metadata，覆盖有效 advisory、id/capability/severity 校验、affected_versions/modified_at/runtime_default 必填或枚举、freeze/revoke/published 状态组合，以及 `registry/advisories/OCAP-2026-0001.yml` revoked metadata，当前覆盖 5 个测试；spec 包合计 57 个测试。
- `packages/runtime/src/index.test.ts`：state dir、state dir precedence、install/list/load、policy、confirmation、consent receipt audit fields、audit、redaction/hash、HTTP dry-run/executor、execution semantics audit fields、unknown timeout audit evidence、`execution.body.fields` required/optional 渲染、audit failure preflight、outbound policy 私网阻断、dry-run egress preview、risk policy decision trace、token passthrough 禁止、credential audit evidence 等 Runtime 行为，当前覆盖 95 个测试。`packages/runtime/src/domain.test.ts`：Runtime Kernel public contract、capability identity、invocation request/plan、GateDecision、Consent、RuntimeError、execution semantics evidence 和 dry-run envelope helper，当前覆盖 7 个测试。`packages/runtime/src/retry-policy.test.ts`：HTTP retry policy decision helper，覆盖 V1 默认不自动 retry、非幂等写操作不 retry、unknown timeout reconcile、401/403 不 retry、显式 read-only retry 和 idempotency key hash evidence，当前覆盖 6 个测试。`packages/runtime/src/advisory-check.test.ts`：Installed capability advisory check，覆盖 installed capability 与 registry advisory metadata 匹配、revoked runtime default 摘要和无关能力不报告 advisory，当前覆盖 2 个测试。`packages/runtime/src/trust-transition.test.ts`：Trust level transition helper，覆盖逐级升级、跳级升级拒绝、High advisory/failing tests 冻结和 downgrade/revoke 不授予 policy 权限，当前覆盖 4 个测试。`packages/runtime/src/lifecycle-gate.test.ts`：revoked invoke lifecycle gate，覆盖 revoked 写/高风险 pre-secret deny、revoked read-only ask、read-only explicit override allow 和非 revoked 不改变 policy 权限，当前覆盖 4 个测试。`packages/runtime/src/policy-score.test.ts`：quality score 只能进入 policy trace evidence，不能把默认 ask 改成 allow，也不能覆盖显式 deny，当前覆盖 2 个测试。`packages/runtime/src/quota-budget-gate.test.ts`：quota/budget gate pre-secret decision，覆盖 quota deny、quota ask、budget deny 不被 trust/quality 绕过和 evidence redaction，当前覆盖 4 个测试。`packages/runtime/src/financial-consent-spend-gate.test.ts`：financial consent/spend cap pre-secret gate，覆盖 financial 必须 explicit approved consent、approved consent 后仍检查 spend cap、evidence redaction 和非 financial 不触发 consent gate，当前覆盖 4 个测试。`packages/runtime/src/provider-rate-limit.test.ts`：provider 429 rate limit evidence、Retry-After/RateLimit-Reset 解析、header redaction 和非幂等写操作不自动 retry，当前覆盖 2 个测试。`packages/runtime/src/abuse-throttle.test.ts`：local abuse throttle pre-secret gate，覆盖循环调用 deny、ask confirmation required、warn allow evidence 和 external_send 默认低频基线，当前覆盖 4 个测试。`packages/runtime/src/gate.test.ts`：Runtime Gate public contract、`GateDecision` 执行语义、hard boundary 默认值和同步/异步 gate evaluator，当前覆盖 3 个测试。`packages/runtime/src/ledger.test.ts`：四类 ledger record V1、append-only storage contract、record id 前缀、root export 和原文/secret 边界，当前覆盖 4 个测试。`packages/runtime/src/card.test.ts`：四类 Card document V1、Card 生成 helper、Trust Card disclaimer、Trust Card installed capability 生成规则、Consent runtime-generated boundary、Compatibility known gaps 和 root export，当前覆盖 7 个测试。`packages/runtime/src/identity.test.ts`：Capability identity helper、audit key、路径无关 identity digest、SemVer/digest validation、lifecycle 默认语义和 root export，当前覆盖 5 个测试。`packages/runtime/src/package-exports.test.ts`：workspace package public export map、spec schema subpath 和 CLI bin-only public surface，当前覆盖 3 个测试。`packages/runtime/src/secret-resolver.test.ts`：Secret Resolver env provider，覆盖 bearer/header、dry-run 不读取 secret、missing env、unsupported placement、forbidden header、auth none 和 unsupported auth，当前覆盖 7 个测试。`packages/runtime/src/policy-ledger.test.ts`：policy activation、rollback、failed activation 和 ledger redaction，当前覆盖 4 个测试。`packages/runtime/src/policy-validator.test.ts`：policy validate/lint 的非法 decision/risk、未知字段、重复 rule id、未命名高风险 allow、write broad allow warning 和 external_send/destructive/financial scoped boundary error，当前覆盖 5 个测试。`packages/runtime/src/policy-override.test.ts`：policy override/breakglass 的 allow_once 消耗、expired ignore、breakglass reason/短过期、硬安全门不可绕过和 audit/trace evidence，当前覆盖 5 个测试。`packages/runtime/src/policy-fixtures.test.ts`：policy simulation fixtures 的 policy YAML 校验、risk/data/trust/lifecycle/advisory coverage 和无真实敏感值检查，当前覆盖 2 个测试。`packages/runtime/src/decision-log.test.ts`：decision log export 的脱敏摘要、trace id、policy revision 和 capability/time range/decision 查询过滤，当前覆盖 2 个测试。`packages/runtime/src/policy-governance-conformance.test.ts`：C-PG policy governance conformance，覆盖 decision trace、policy ledger、broad allow simulation、breakglass 硬边界和 audit redaction export，当前覆盖 6 个测试。`packages/runtime/src/policy-simulation.test.ts`：policy simulation/diff 的 ask_to_allow、new_allow、deny_to_ask、data_egress_relaxed、broad_data_egress_allow、unchanged empty diff 和 report 不含 input 原文，当前覆盖 4 个测试。`packages/runtime/src/input-classifier.test.ts`：input classification engine 和 `packages/runtime/fixtures/input-classification/` sensitive fixtures，覆盖 secret_like、pii、internal_url、source_code/config 和 free_text_unknown，当前覆盖 10 个测试。`packages/runtime/src/data-egress-policy.test.ts`：Data Egress Policy Gate 默认决策、provider/origin/risk/destination 匹配、internal URL/source/config 负向外发、decision trace 和 pre-secret 边界，当前覆盖 14 个测试。`packages/runtime/src/egress-map.test.ts`：field-level egress map URL/query/body destination、未引用字段过滤和 data classes 映射，当前覆盖 2 个测试。`packages/runtime/src/input-minimization.test.ts`：按 execution mapping 最小化 input、禁止自动 whole-body、optional missing field 省略，当前覆盖 3 个测试。`packages/runtime/src/egress-preview.test.ts`：redacted egress preview target、fields sent、data classes、secret redaction 和大段文本摘要，当前覆盖 1 个测试。`packages/runtime/src/result-envelope.test.ts`：Result Envelope V1 success/dry_run/blocked/confirmation_required/failed/unknown 映射、execution semantics evidence 和 unknown timeout timestamp 边界，当前覆盖 7 个测试。`packages/runtime/src/output-validation.test.ts`：output schema validation required/type/finding/envelope failure，当前覆盖 4 个测试。`packages/runtime/src/result-sanitizer.test.ts`：tool result sanitizer secret redaction、prompt marker、HTML strip、envelope warning/evidence，以及 `packages/runtime/fixtures/result-sanitizer/` negative fixtures，当前覆盖 8 个测试。`packages/runtime/src/result-provenance.test.ts`：result content digest、transformations、字段级 taint labels、Runtime summary taint 和 failed/unknown provenance，当前覆盖 3 个测试。`packages/runtime/src/result-limits.test.ts`：oversized structured/text result、MCP summary 边界和 size limit/redaction 顺序，当前覆盖 3 个测试；Runtime 包合计 246 个测试。
- `packages/mcp/src/index.test.ts`：tool name mapping、tools/list projection、tools/call routing、deny/ask/confirmation_required 结果格式等 MCP helper 行为，当前覆盖 9 个测试。`packages/mcp/src/tool-mapping-contract.test.ts`：MCP tool mapping contract snapshots，覆盖多段 id 映射、冲突诊断、tools/list 的 mapped name/original capability id/schema/projection metadata，以及 tools/call 只能通过 mapped tool name 路由，当前覆盖 3 个测试。`packages/mcp/src/tool-projection.test.ts`：MCP Tool Projection metadata、projection hash/evidence 和 Runtime-generated risk summary，当前覆盖 6 个测试。`packages/mcp/src/result-adapter.test.ts`：Result Envelope 到 MCP structuredContent/content/isError 适配，当前覆盖 3 个测试；MCP 包合计 21 个测试。
- `packages/cli/src/error-exit-code.test.ts`：CLI error model / exit code tests，覆盖 missing installed capability、invalid `--input-json` 和 invalid `--limit` 作为用户可修正错误返回 exit `1`，stderr 不输出 stack trace，当前覆盖 2 个测试。`packages/cli/src/command-snapshot.test.ts`：CLI command snapshot tests，使用临时 `--state-dir` 覆盖 validate 成功输出、空 list/logs/decision-log、已安装 list 人类表格和 JSON 输出、policy validate 用户错误输出与 exit code，并归一化 `<repo>`、`<state>` 和 Node warning pid，当前覆盖 2 个测试。`packages/cli/src/smoke.test.ts`：CLI 端到端 smoke，使用临时 `--state-dir` 跑通 validate、install、list JSON 和人类表格 lifecycle/trust 字段、invoke dry-run Result Envelope JSON、dry-run egress preview、人类 summary 输出、policy explain、policy validate lint、policy simulation/diff、secret missing verbose redacted evidence、logs 和 decision-log export，当前覆盖 1 个测试；CLI 包合计 5 个测试。

当前缺口：

- `@opencap/cli` 已有 smoke test，但仍需要在 T134/T137 中补齐 command snapshot、stdout/stderr 和 exit code 细粒度测试。
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

当前状态：CLI 包已配置 `test` 脚本，并通过 `packages/cli/src/smoke.test.ts` 覆盖 validate/install/list/invoke dry-run/logs 的最小闭环，通过 `packages/cli/src/command-snapshot.test.ts` 锁定 validate/list/logs/decision-log/policy validate 的稳定 stdout/stderr/exit code，通过 `packages/cli/src/error-exit-code.test.ts` 覆盖用户可修正错误 exit `1`。后续补测试时仍应优先使用临时 state dir，避免污染真实 `opencap.local/`。

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
- Composition conformance 覆盖 compositionId、step-level consent、planHash 只作 evidence、compensation 独立授权。
- Trust conformance 覆盖 trust level 不覆盖 policy、revoked capability 警告/阻断、quality score 不改变 risk。
- Usage conformance 覆盖 quota/budget gate 在 secret 前运行、usage event 不含 input/output/secret、financial spend cap 阻断。
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
