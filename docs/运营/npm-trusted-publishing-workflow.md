# npm Trusted Publishing Workflow

本文定义 OpenCap 发布 npm packages 时的 trusted publishing workflow。当前仓库已提供 manual-only dry-run workflow：`.github/workflows/npm-publish.yml`。它是发布前审查材料和 dry-run 证据入口，不是当前真实 npm 发布工作流。

截至 2026-05-14，npm Trusted Publishing 支持通过 CI/CD OIDC 发布，官方文档列出的 provider 包括 GitHub Actions、GitLab CI/CD 和 CircleCI。OpenCap 首选 GitHub Actions trusted publishing，因为仓库、CI、release checklist 和安全基线已经在 GitHub 上收敛。

参考：

- npm Trusted Publishing：<https://docs.npmjs.com/trusted-publishers/>
- npm provenance：<https://docs.npmjs.com/generating-provenance-statements/>
- CircleCI provider 公告：<https://github.blog/changelog/2026-04-06-npm-trusted-publishing-now-supports-circleci/>

## 发布边界

当前 workflow 只覆盖 npm package dry-run，不覆盖 Registry Capability 分发、Registry index signing、GitHub Release artifact、Docker/OCI artifact 或 Cloud 服务发布。

Alpha 候选包仍以 `docs/运营/package-publishing-v1.md` 为准：

| Package | Alpha 判断 |
| --- | --- |
| `@opencap/spec` | 可作为 alpha 候选 |
| `@opencap/runtime` | 可作为 alpha 候选但需标注 experimental |
| `@opencap/cli` | 可作为 alpha 候选 |
| `@opencap/mcp` | 暂缓正式发布 |
| `@opencap/sdk-js` | 暂缓发布 |

## npm 侧配置

每个要发布的 npm package 都必须在 npm package settings 中配置 trusted publisher。

GitHub Actions 配置项：

| 字段 | OpenCap 草案值 |
| --- | --- |
| Organization or user | `Kimi-ming` 或最终发布组织 |
| Repository | `ai-capability-runtime` |
| Workflow filename | `npm-publish.yml` |
| Environment name | `npm-production` |

规则：

- 每个 package 只能配置一个 trusted publisher；切换 workflow、repo 或 provider 前必须更新 release checklist。
- 不在 GitHub Secrets 中保存长期 `NPM_TOKEN`、`NODE_AUTH_TOKEN` 或 publish token。
- 配置 trusted publisher 并验证后，npm package settings 应启用 publishing access 限制：要求 2FA，并禁止传统 token 发布。
- 人工 npm account 仍必须启用 2FA；trusted publishing 只替代 CI 长期 token，不替代 maintainer account hygiene。

## GitHub Environment

发布 workflow 必须使用 GitHub environment：

```text
npm-production
```

Environment 要求：

- required reviewers 至少 1 名 maintainer。
- 仅允许受保护分支或 release tag 进入。
- 不配置 npm publish token secret。
- 如需安装私有依赖，只能使用只读 token，且不得复用为 publish credential。

## Draft Workflow

不要在没有 npm trusted publisher 配置、package scope 权限和 release checklist 审查前启用该 workflow。

```yaml
name: Publish npm Packages

on:
  workflow_dispatch:
    inputs:
      package:
        description: Package workspace name to publish
        required: true
        type: choice
        options:
          - "@opencap/spec"
          - "@opencap/runtime"
          - "@opencap/cli"
      dry_run:
        description: Run pack/publish checks without publishing
        required: true
        type: boolean
        default: true

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    name: Publish selected npm package
    runs-on: ubuntu-latest
    environment: npm-production
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.14.0
          registry-url: https://registry.npmjs.org
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Validate registry and package contracts
        run: pnpm validate

      - name: Run tests
        run: pnpm test

      - name: Run lint
        run: pnpm lint

      - name: Build packages
        run: pnpm build

      - name: Pack selected package
        run: pnpm --filter "${{ inputs.package }}" exec npm pack --json

      - name: Dry-run publish selected package
        if: inputs.dry_run
        run: pnpm --filter "${{ inputs.package }}" exec npm publish --dry-run --access public

      - name: Publish selected package with trusted publishing
        if: ${{ !inputs.dry_run }}
        run: pnpm --filter "${{ inputs.package }}" exec npm publish --access public
```

## Hard Gates

发布前必须满足：

- Release checklist 已记录 package、version、git commit、tag、package tarball digest 和 release evidence。
- `pnpm validate`、`pnpm test`、`pnpm lint`、`pnpm build` 全部通过。
- `npm pack --json` 已审查 tarball 内容，不包含 `.env`、`opencap.local/`、数据库、测试日志、私有 URL、token 或未构建源码外的敏感文件。
- Package `exports`、`files` 或 npm include/exclude 行为经过审查；不会发布内部测试 fixture 中的 secret-like 样例原文。
- README 和 CHANGELOG 不宣称未实现能力，例如完整 `serve --mcp` server、remote runtime、signed Registry index 或 SDK stability。
- npm trusted publisher 已绑定到 `npm-publish.yml` 和 `npm-production` environment。
- workflow 只授予 `contents: read` 和 `id-token: write`，不使用 `pull_request_target`。

## Provenance 和验证

npm trusted publishing 在支持的 provider 和公开 package/repository 条件下可自动生成 provenance。OpenCap 发布记录应保存：

```yaml
schema: opencap.npm_publish_evidence.v1
package: "@opencap/spec"
version: 0.1.0-alpha.0
git_commit: ""
git_tag: ""
workflow: npm-publish.yml
environment: npm-production
trusted_publisher: github_actions
provenance_expected: true
tarball_digest: sha512-...
verification:
  npm_view_version: pass
  npm_audit_signatures: pass
  package_exports_review: pass
notes: Trusted publishing proves source and build linkage; it does not prove package safety.
```

Consumers or maintainers can later run:

```bash
npm audit signatures
```

Provenance 和 registry signatures 不能替代代码审查、测试、release gates 或 security advisory process。

## 回滚和事故处理

如果发布错误 package：

1. 停止后续发布 workflow。
2. 记录 package、version、tag、workflow run、tarball digest 和问题摘要。
3. 按 npm policy 判断 deprecate、yank 或 unpublish 是否可行。
4. 更新 CHANGELOG、release notes 和 `docs/HANDOFF.md`。
5. 若涉及 secret 或恶意包，按 `SECURITY.md` 和 `docs/安全/capability-advisory-process.md` 处理。

## 当前 dry-run workflow

`.github/workflows/npm-publish.yml` 当前只支持 `workflow_dispatch`，默认 `dry_run: true`，候选包限制为 `@opencap/spec` 和 `@opencap/cli`。Workflow 使用 `contents: read` 和 `id-token: write`，不读取 `NPM_TOKEN` 或 `secrets.NPM_TOKEN`。

Dry-run 路径会运行：

```bash
pnpm install --frozen-lockfile
pnpm validate
pnpm test
pnpm build
pnpm --filter <package> publish --dry-run --provenance --access public --no-git-checks
```

如果手动把 `dry_run` 设为 `false`，workflow 会在第一步失败，并提示真实 npm 发布仍被阻断。真实 npm 发布仍需要先配置 npm trusted publisher、受保护的 `npm-production` environment、发布审批和 release evidence。

## 后续实现任务

- 创建受保护的 `npm-production` environment。
- 为 alpha 候选 package 配置 npm trusted publisher。
- 添加 package tarball content check。
- 在 release checklist 中记录 npm publish evidence。
