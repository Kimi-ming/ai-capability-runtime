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
| `@opencap/mcp` | 暂缓正式发布 | helper 已有 tools/list、tools/call 和 adapter 测试，但完整 `opencap serve --mcp` server 尚未实现。 |
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
