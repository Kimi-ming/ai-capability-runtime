# 包发布策略 V1

本文定义 OpenCap npm 包和发布流程的早期策略。

## 包结构

当前 monorepo packages：

- `@opencap/spec`
- `@opencap/cli`
- `@opencap/runtime`
- `@opencap/mcp`
- `@opencap/sdk`

V1 之前可以保持 private，alpha 时再决定发布哪些包。

## 发布优先级

Alpha 最小发布：

1. `@opencap/spec`
2. `@opencap/cli`

Beta 增加：

3. `@opencap/runtime`
4. `@opencap/mcp`

SDK 可以等 API 稳定后再公开。

## npm Trusted Publishing

npm Trusted Publishing 使用 CI/CD OIDC 生成短期凭据，减少长期 token 风险。npm 文档说明，GitHub Actions/GitLab/CircleCI 等受支持场景可使用 trusted publisher，并在满足条件时自动生成 provenance。

OpenCap 策略：

- 优先使用 npm trusted publishing。
- 不在 GitHub secrets 中保存长期 npm token。
- public package 从 public repo 发布时启用 provenance。
- 发布 workflow 使用最小权限。

具体 workflow 见 [npm Trusted Publishing Workflow](npm-trusted-publishing-workflow.md)。当前 `.github/workflows/npm-publish.yml` 只支持 manual dry-run，不应在未配置 npm trusted publisher、`npm-production` environment 和 package scope 权限前改成真实发布。

## 版本策略

- `0.1.0-alpha.x`：早期可试用。
- `0.1.0`：第一个本地闭环。
- `1.0.0`：公共契约稳定。

## 发布前检查

```bash
pnpm install --frozen-lockfile
pnpm validate
pnpm test
pnpm build
```

发布前必须更新：

- CHANGELOG。
- README 快速开始。
- docs/HANDOFF。
- release checklist。

如果准备 npm alpha package，必须先运行 `.github/workflows/npm-publish.yml` 的 manual dry-run，并把 package、version、workflow run、tarball/provenance dry-run 摘要和 `real_publish: false` 写入 release evidence。该 dry-run 只是发布前证据，不代表 package 已发布、npm trusted publisher 已配置或 provenance 已正式生成。

在运行 publish dry-run 前，应先为每个待发布 package 生成 package readiness evidence。多包 release 时，每个 package 使用独立的 pack JSON 和 readiness artifact，再由 release evidence 重复读取：

```bash
pnpm --filter @opencap/spec exec npm pack --dry-run --json > spec-pack.json
pnpm --filter @opencap/cli exec npm pack --dry-run --json > cli-pack.json
PACKAGE_READINESS_SPEC_OUTPUT="docs/releases/evidence/<release-id>-spec-package-readiness.json"
PACKAGE_READINESS_CLI_OUTPUT="docs/releases/evidence/<release-id>-cli-package-readiness.json"
opencap release package report \
  --package @opencap/spec \
  --pack-json spec-pack.json \
  --output "$PACKAGE_READINESS_SPEC_OUTPUT" \
  --json
opencap release package report \
  --package @opencap/cli \
  --pack-json cli-pack.json \
  --output "$PACKAGE_READINESS_CLI_OUTPUT" \
  --json
opencap release evidence \
  --registry registry \
  --records packages/runtime/test/fixtures/conformance \
  --package-readiness "$PACKAGE_READINESS_SPEC_OUTPUT" \
  --package-readiness "$PACKAGE_READINESS_CLI_OUTPUT" \
  --json
```

每个 report 会保存一个 `opencap.npm_package_readiness.v1` JSON artifact，只检查 package metadata 和本地 pack file 摘要，固定 `policyEffect: none`。随后 `opencap release evidence --package-readiness <file>` 可重复传入多个 artifacts，按传入顺序把它们纳入 release evidence bundle；它不能与 `--package`/`--pack-json` 混用。`--output` 会拒绝 `.env`、token/secret/password 命名、`opencap.local/`、SQLite/DB/log 和目录路径；这些命令不触网、不读取 npm token、不写 state dir，也不改变 package publish state、trust、policy、authorization 或 Runtime execution。如果任一 artifact invalid，不能生成 release evidence；如果 report 包含 `NPM_PACKAGE_PRIVATE`、forbidden pack file 或其他 blocker，不能进入该 package 的 npm publish dry-run 或真实发布，并且必须记录到 release evidence/handoff。

Alpha 候选 package 必须声明 `files` allowlist，先收窄 npm pack 输入范围，再运行 pack dry-run。当前 allowlist：

| Package | `files` allowlist | 发布状态 |
| --- | --- | --- |
| `@opencap/spec` | `dist`, `schema`, `package.json` | 仍为 `private: true`，不得发布 |
| `@opencap/cli` | `dist`, `package.json` | 仍为 `private: true`，不得发布 |

发布前顺序固定为：确认 `files` allowlist -> 每个 package 的本地 `npm pack --dry-run --json` -> 每个 package 的 `opencap release package report --output <file>` -> `opencap release evidence` 重复传入所有 `--package-readiness <file>` -> GitHub workflow npm publish dry-run -> 真实 npm 发布审批。Package readiness JSON artifact 只证明本地 package metadata/tarball 摘要审查，不替代 pack dry-run 原始输出、workflow publish dry-run、trusted publisher、正式 provenance、release approval 或 npm 发布。`private: true` 是当前刻意保留的 blocker，不应在没有 maintainer release decision、release tag、CI/release notes 和 npm trusted publisher 准备前移除。

## 不发布条件

- CLI 命令和 README 不一致。
- token 可能写入日志。
- 写操作不能审计。
- package public exports 未定义。
- CI 不可复现。

## Alpha 当前发布判断

截至 2026-05-12，发布判断如下：

| Package | 当前判断 | 原因 |
| --- | --- | --- |
| `@opencap/spec` | 可作为 alpha 候选 | manifest schema、registry validation、metadata lint 已有测试。 |
| `@opencap/runtime` | 可作为 alpha 候选但需标注 experimental | Runtime API 已覆盖 install/list/policy/audit/http/egress/result/policy governance，但公共 API 仍在 `0.x` 演进。 |
| `@opencap/cli` | 可作为 alpha 候选 | validate/install/list/invoke/logs/policy/decision-log 已有 smoke coverage。 |
| `@opencap/mcp` | 暂缓正式发布 | 已有最小 stdio server、tools/list、tools/call 和 adapter 测试，但真实 Host smoke evidence 仍未完成。 |
| `@opencap/sdk-js` | 暂缓发布 | SDK 仍是占位/后续边界，API 尚未稳定。 |

## Package public exports

截至 2026-05-12，workspace package 已定义 npm `exports` 边界：

- `@opencap/spec`、`@opencap/runtime`、`@opencap/mcp` 和 `@opencap/sdk` 暴露 `.` public entrypoint，`types` 指向 `./dist/index.d.ts`，`import` 指向 `./dist/index.js`。
- `@opencap/spec` 额外公开 `./schema/manifest.schema.json` 和 `./schema/registry-test.schema.json`，供 schema consumers 使用。
- 所有 package 只额外暴露 `./package.json`，不暴露 `./src/*` 或 `./dist/*` 深层内部路径。
- `@opencap/cli` 保持 bin-only public surface，不把 `dist/index.js` 声明成 library API。

该契约由 `packages/runtime/src/package-exports.test.ts` 覆盖；发布前仍必须确认 build artifacts 和 schema files 会进入发布包。

Alpha 发布必须先完成：

- GitHub Actions `validate.yml` 通过 install、validate、test 和 build。
- `pnpm validate`、`pnpm test`、`pnpm build`、`pnpm lint` 本地通过。
- `CHANGELOG.md` 记录本次发布边界和已知缺口。
- README 不声称 `serve --mcp` 已完整可用。
- npm trusted publishing/provenance workflow 以 draft 或 dry-run 方式审查，不使用长期 npm token。

发布和 package provenance 可以在 Capability manifest 的可选 `provenance` 字段中记录摘要和引用。该字段只用于审查和 Trust Card/Registry evidence，`policyEffect` 必须为 `none`，不能因为 npm provenance、SLSA 或 Sigstore evidence 存在就自动允许安装或执行。
