# 验证策略

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

## 依赖安装后应支持的校验

```bash
pnpm install
pnpm validate
pnpm test
pnpm build
```

如果因为网络或依赖未安装不能运行，需要在交接文档中记录。

## 模块测试计划

### `@opencap/spec`

必须覆盖：

- 合法 HTTP manifest 通过
- `type: mcp` 失败
- 缺必填字段失败
- 权限 risk 非法失败
- timeout 超出范围失败
- 错误信息包含路径

### `@opencap/cli`

必须覆盖：

- `opencap validate <path>` 成功和失败
- `opencap install <id>` 找不到时报错
- `opencap install <id>` 多重匹配时报错
- `opencap list` 空状态和有安装状态
- exit code 正确
- CLI stdout/stderr snapshot 符合 `docs/design/cli-contract-v1.md`

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
- error mapping 符合 `docs/design/error-model-v1.md`

## 手动 Smoke Test

### Smoke 1：本地 CLI 闭环

```bash
opencap validate registry/developer-tools/github.create_issue
opencap install github.create_issue
opencap list
opencap invoke github.create_issue --dry-run --input examples/github-issue-capability/input.json
opencap logs
```

期望：

- validate 成功
- install 创建 `opencap.local/installed/github.create_issue`
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

V1 后续要把普通测试提升为 profile-driven conformance。测试分组见 `docs/quality/conformance-suite-v1.md`。

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
