# V1 Alpha Local Runtime Evidence Bundle

本文记录 OpenCap `v0.1 Local Runtime` alpha 候选的本地证据包。它只证明当前仓库的本地 Runtime、CLI、Registry、MCP adapter 和文档门禁在本地环境中形成可验证闭环，不代表 Cloud、Console、OAuth、marketplace、payment、真实 Host UI 或供应链发布已经完成。

## 元数据

| 字段 | 值 |
| --- | --- |
| Evidence schema | `opencap.release_evidence.v1` |
| 日期 | 2026-05-28 |
| 目标阶段 | `v0.1 Local Runtime` alpha evidence |
| 证据来源 commit | `dcf7e19` |
| 分支 | `main` |
| 维护者 | OpenCap maintainers |
| 证据范围 | local runtime、CLI、Registry validation、MCP automated stdio smoke、文档门禁 |
| Release decision | `block-release-tag`：可以作为 alpha candidate evidence 保存，但不得仅凭本文件创建 tag 或发布 npm package；发布者仍需按 `docs/releases/release-checklist.md` 完成最终工作区、CI、release notes 和 tag 检查。 |

## 验证命令

以下命令在项目 conda 环境 `ai-capability-runtime` 中运行，命令记录不包含 token、provider raw response、用户数据或本地私有路径。

| 命令 | 结果 | 证据摘要 |
| --- | --- | --- |
| `pnpm validate` | pass | 5 个 registry manifest、5 个 model-visible metadata lint、5 个 least-privilege auth lint、5 个 Capability package lint、5 个 registry test、1 个 advisory/revocation metadata 文件通过。 |
| `pnpm build` | pass | workspace build 通过；`apps/console` 和 `apps/registry-web` 仍是占位输出。 |
| `pnpm lint` | pass | workspace TypeScript lint/build-noEmit 通过；占位 app 输出未实现提示。 |
| `pnpm test` | pass | spec 75、runtime 293、mcp 26、cli 14 个测试通过。 |
| `check_docs.py .` | pass | T292 完成后运行，确认任务、handoff 和文档链接闭环。 |
| `audit_docs.py .` | pass | T292 完成后运行，确认文档 scaffold 和关键入口存在。 |
| `git diff --check` | pass | T292 完成后运行，确认无空白错误。 |

`pnpm test` 中的 MCP stdio smoke 使用官方 MCP SDK client 启动 `opencap serve --mcp`，验证 `tools/list`、read-only allow 到 secret boundary、write ask 的 `CONFIRMATION_REQUIRED` 和 stdout JSON-RPC 协议边界。该自动化 smoke 不等同 Claude Desktop 或 Cursor 的真实 UI smoke。

## Conformance Summary

后续刷新本 evidence 或准备新的 release evidence 时，可以运行：

```bash
opencap conformance report --records packages/runtime/test/fixtures/conformance --json
```

该命令输出 `opencap.conformance_summary.v1`，汇总本地 conformance YAML records 的 suite version、profile、pass/fail/invalid count、checks 和 artifacts。它只作为 release/conformance evidence，不改变 Runtime policy、trust、consent、install decision 或 Host compatibility claim；也不得扩展解读为 Cloud、Console、OAuth、marketplace、payment 或真实 Host UI 全兼容。

## npm Publish Dry-run Evidence

当前 evidence bundle 未运行 npm publish dry-run，原因是本文仅保存本地 Runtime/CLI/Registry/MCP automated stdio smoke 证据，不创建 tag、不发布 package、不触发 GitHub workflow。发布者准备 npm alpha package 时，应按 `docs/releases/release-checklist.md` 手动运行 `.github/workflows/npm-publish.yml` 的 dry-run，并把下列字段填入新的 release evidence：

```yaml
npm_publish:
  package: "@opencap/spec | @opencap/cli"
  version: "<package-version>"
  workflow_file: .github/workflows/npm-publish.yml
  workflow_run: "<github-actions-run-url>"
  workflow_run_id: "<github-actions-run-id>"
  dry_run: true
  dry_run_command: pnpm --filter <package> publish --dry-run --provenance --access public --no-git-checks
  tarball_summary: "<dry-run tarball files/size summary>"
  provenance_summary: "<dry-run provenance summary>"
  package_exports_review: pass
  real_publish: false
```

该 evidence 只能证明 dry-run 路径完成；不能写成 npm package 已发布、npm trusted publisher 已配置、provenance 已正式生成或 release artifact 已 attested。

## 测试计数

| 包 | 文件数 | 测试数 | 当前覆盖摘要 |
| --- | ---: | ---: | --- |
| `@opencap/spec` | 13 | 75 | Manifest、registry lint、authoring loop、advisory、conformance、quality summary 和文档 lint。 |
| `@opencap/runtime` | 43 | 293 | Runtime policy/consent/audit、secret resolver、HTTP executor、egress gate、ledger、cards、usage、problem details、abuse cases 和 recovery helpers。 |
| `@opencap/mcp` | 6 | 26 | Tool projection、result adapter、SDK server、stdio smoke 和 mapping contracts。 |
| `@opencap/cli` | 6 | 14 | validate/install/list/invoke/logs smoke、ledger export、registry report、card/trust card、snapshot 和用户错误 exit code。 |

## Release Hard Gates 摘要

| Gate | 状态 | 备注 |
| --- | --- | --- |
| 写操作可审计 | pass | install/invoke 已写 audit/ledger；audit failure preflight 阻断写操作。 |
| deny/ask 不解析 secret、不执行 HTTP | pass | Runtime、CLI、MCP 和测试覆盖 confirmation_required/blocked 边界。 |
| dry-run 不读取 secret 原值 | pass | Secret Resolver、dry-run plan 和审计 evidence 覆盖。 |
| MCP STDIO 不使用终端 prompt | pass | `opencap serve --mcp` 使用 no-elicitation handler。 |
| Result Envelope / MCP adapter | pass | structuredContent、Runtime-generated summary 和 error mapping 已覆盖。 |
| Registry trust/quality evidence 不改变 policy | pass | Quality summary 固定 `policyEffect: "none"`。 |
| Release hygiene | partial | 本 evidence 已写入；最终 tag、release notes、CI status 和 npm 发布仍需发布者确认。 |

## Known Gaps

- `apps/console` 和 `apps/registry-web` 仍是占位应用，不应宣称 Console UI 已完成。
- Cloud、团队/多租户、远程 Runtime、完整 OAuth flow、marketplace、payment、billing、settlement、refund 和 payout 不在当前 alpha 证据范围。
- 真实 Claude Desktop/Cursor Host UI smoke evidence 仍阻塞于本机 Host 应用、人工配置和录屏/截图记录；当前只有自动化 MCP SDK stdio smoke。
- npm publish dry-run 当前为 `not-run`；npm trusted publishing、Sigstore/SLSA provenance、package signing 和 release artifact attestation 仍是规划/预留，不是已执行发布证据。
- `http.request_demo` 是 unsafe-by-default 示例 Capability，带 revoked advisory，不应作为默认可信安装能力宣传。
- Registry report 和 quality score 只作为 evidence，不改变 Runtime policy、trust level、consent 或 install decision。
- Conformance report 只汇总本地 evidence records，不代表真实 Host UI、Cloud、Console、OAuth、marketplace、payment、npm provenance 或 provider API end-to-end 已完成。

## Blocked External Evidence

| 阻塞项 | 状态 | 后续动作 |
| --- | --- | --- |
| T291 真实 Claude Desktop/Cursor Host smoke | blocked | 需要用户确认本机 Host 应用可用，并提供可复现配置、截图/录屏或日志。 |
| GitHub Actions required checks | pending-external | 发布者在 tag/PR 前需检查远端 CI。 |
| npm publish dry-run evidence | pending-external | 发布者需手动运行 `.github/workflows/npm-publish.yml` 的 dry-run，并记录 package、version、workflow run、tarball/provenance 摘要和 `real_publish: false`。 |
| npm trusted publishing/provenance | pending-external | 需要 npm/GitHub 发布配置，当前不得声明已发布或已 attested。 |
| 真实 provider API end-to-end | not-in-scope | 当前证据避免调用真实 provider，不记录 raw response 或用户数据。 |

## 隐私和安全边界

- 本文件不包含 token、Authorization header、真实 provider raw response、用户数据、本地私有路径、`opencap.local/` 内容或数据库日志。
- 命令记录只保留命令名、结果、测试计数和脱敏摘要。
- Registry 测试 fixture 和 smoke 测试均使用示例数据或临时 state dir。
- Evidence 不赋予任何 Capability trust/policy 权限，也不能替代 Capability review、用户 consent、Runtime policy 或 audit。

## 关联文档

- `docs/releases/release-checklist.md`
- `docs/releases/alpha-checklist.md`
- `docs/TESTING.md`
- `docs/HANDOFF.md`
- `docs/生态/host-compatibility-matrix.md`
- `docs/质量/capability-quality-score.md`
