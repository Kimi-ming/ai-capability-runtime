# Release Checklist

本文是 OpenCap 发布前的可执行清单。它把 `docs/运营/release-readiness.md` 的 maturity gate matrix 落成逐项操作，适用于 alpha、beta、v1.0 以及中间 milestone tag。

## 使用方式

每次发布前按顺序执行：

1. 确认发布阶段。
2. 跑基础验证命令。
3. 核对阶段 hard gates。
4. 写 release evidence。
5. 确认不得宣称项。
6. 决定发布或阻断。

任何 hard gate 未满足时，不得发布。允许缺口必须写入 release notes、`docs/HANDOFF.md`、`docs/TASKS.md` 或 `docs/RISKS.md`，不能写成已支持能力。

## 1. 发布阶段

勾选一个目标阶段：

- [ ] `v0.1 Local Runtime`：本地 Runtime/CLI 最小闭环。
- [ ] `v0.2 Evidence Registry`：贡献、评审、信任和生命周期证据。
- [ ] `v0.3 Interop Profiles`：至少一个 Host/profile 有可复现兼容记录。
- [ ] `v0.4 Adapter Layer`：adapter 草稿或映射不绕过治理。
- [ ] `v0.5 Policy Operations`：策略变更、模拟、override、incident 可运营。
- [ ] `v1.0 Capability Network`：V1 P0/P1 完成且公共契约稳定。

参考矩阵：`docs/运营/release-readiness.md`。

## 2. 工作区状态

- [ ] 当前分支是预期发布分支。
- [ ] `git status --short --branch` 已检查。
- [ ] 没有 `.env`、token、`opencap.local/`、数据库日志或未脱敏 artifact 被暂存。
- [ ] `CHANGELOG.md` 有本次发布说明或明确记录无需更新的原因。
- [ ] `docs/HANDOFF.md` 已记录当前状态、已知风险和下一步。

记录：

```text
Branch:
Commit:
Release target:
Maintainer:
Date:
```

## 3. 基础验证命令

按顺序运行，并记录结果：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
pnpm validate
pnpm build
pnpm lint
pnpm test
```

结果：

| 命令 | 结果 | 证据/备注 |
| --- | --- | --- |
| `git diff --check` | pass / fail |  |
| `check_docs.py` | pass / fail / warning |  |
| `audit_docs.py` | pass / fail |  |
| `pnpm validate` | pass / fail |  |
| `pnpm build` | pass / fail |  |
| `pnpm lint` | pass / fail |  |
| `pnpm test` | pass / fail |  |

若 `pnpm test` 在沙箱内因 `tsx` IPC `listen EPERM` 失败，必须在允许的环境中重跑同一命令并记录原因；不能把沙箱失败视为通过。

## 4. 通用 Hard Gates

任何阶段都必须满足：

- [ ] 写操作可审计。
- [ ] `deny` 后不解析 secret、不执行 HTTP。
- [ ] `ask` 未确认时不解析 secret、不执行 HTTP。
- [ ] dry-run 不读取 secret 原值。
- [ ] 审计日志、Result Envelope、README、manifest、tests 不保存 secret 原文。
- [ ] MCP STDIO 不使用终端 prompt。
- [ ] Host/adapter 不绕过 Runtime policy、consent、secret resolver 或 audit。
- [ ] High 风险有缓解、接受理由或明确阻断。
- [ ] README 主路径命令真实可运行，或明确标注未实现。
- [ ] Release notes 没有宣称 Cloud、marketplace、完整 OAuth、完整 MCP server、A2A server、Apps SDK 或签名供应链等未实现能力。

## 5. 阶段 Hard Gates

### v0.1 Local Runtime

- [ ] `opencap validate` 可校验单个 Capability 和 registry。
- [ ] `opencap install/list` 可用。
- [ ] `opencap invoke --dry-run` 可生成 HTTP plan 并写审计日志。
- [ ] `opencap logs` 可读取 SQLite audit log。
- [ ] CLI smoke test 覆盖 validate、install、list、invoke dry-run 和 logs。
- [ ] `docs/releases/alpha-checklist.md` 阻断项已逐项确认。

### v0.2 Evidence Registry

- [ ] Authoring loop/lint 顺序通过。
- [ ] Registry package shape、manifest、README、tests 可验证。
- [ ] Capability Review Checklist 已使用或更新。
- [ ] trust/lifecycle/advisory 状态有文档入口。
- [ ] unsafe-by-default Capability 被明确标记。

### v0.3 Interop Profiles

- [ ] MCP tools/list 和 tools/call tests 通过。
- [ ] Result Envelope adapter tests 通过。
- [ ] Host compatibility matrix 至少包含一组完成 smoke，或 release notes 明确仍是 `pending-smoke`。
- [ ] Interoperability evidence records 使用 `opencap.interop.evidence.v1` 或记录迁移缺口。
- [ ] 不宣称兼容所有 Host。

### v0.4 Adapter Layer

- [ ] Adapter 产物进入 authoring loop。
- [ ] 生成 manifest 不跳过 lint、review、registry tests。
- [ ] Adapter 不持有用户授权边界。
- [ ] A2A/Apps SDK/OpenAPI 等 future profile 的非目标写入 docs。
- [ ] 不把 Capability 伪装成 Agent。

### v0.5 Policy Operations

- [ ] Policy ledger、validate、simulation/diff、decision log export 可用。
- [ ] Override/breakglass 不绕过 hard boundaries。
- [ ] Policy Incident Runbook 可执行。
- [ ] High policy risks 在 `docs/RISKS.md` 有处理状态。
- [ ] 不宣称合规认证或中心化遥测。

### v1.0 Capability Network

- [ ] 所有 V1 P0/P1 任务完成且验证。
- [ ] High risks 缓解或明确接受。
- [ ] 公共契约、migration、CHANGELOG、release notes、tag/npm 策略明确。
- [ ] README、SPEC、ARCHITECTURE、TESTING、HANDOFF、TASKS 同步。
- [ ] GitHub required checks 通过。
- [ ] `Security Baseline` workflow 通过，或 release notes 说明非阻断原因。
- [ ] npm package 发布范围、trusted publishing workflow 和 provenance 策略已确认，且没有使用长期 npm token。

## 6. Release Evidence

发布前写一条 evidence 摘要到 release notes、PR 描述或 maintainer handoff：

```yaml
release_evidence:
  target: v0.1 Local Runtime
  commit: <git-sha>
  date: 2026-05-14
  maintainer: <name>
  commands:
    git_diff_check: pass
    check_docs: pass
    audit_docs: pass
    pnpm_validate: pass
    pnpm_build: pass
    pnpm_lint: pass
    pnpm_test: pass
    conformance_report: pass | fail | not-run
    package_readiness_report: pass | fail | not-run
    npm_pack_dry_run: pass | fail | not-run
    npm_publish_dry_run: pass | fail | not-run
  package_readiness:
    command: opencap release package report --package <package> --pack-json <pack-json> --json
    package: <package-name-or-not-applicable>
    version: <version-or-not-applicable>
    blockers: []
    warnings: []
    pack_evidence: provided | not-run
    forbidden_files: []
    policy_effect: none
  npm_publish:
    package: <package-name-or-not-applicable>
    version: <version-or-not-applicable>
    workflow_file: .github/workflows/npm-publish.yml
    workflow_run: <url-or-not-run>
    workflow_run_id: <id-or-not-run>
    dry_run: true
    dry_run_command: pnpm --filter <package> publish --dry-run --provenance --access public --no-git-checks
    tarball_summary: <files-and-size-summary-or-not-run>
    provenance_summary: <provenance-dry-run-summary-or-not-run>
    package_exports_review: pass | fail | not-run
    real_publish: false
  hard_gates:
    runtime: pass
    registry_trust: pass | not-applicable
    interop: pass | pending-smoke | not-applicable
    policy_ops: pass | not-applicable
    docs_release_hygiene: pass
  known_gaps:
    - Complete MCP server remains future work.
  decision: release | block
```

不得在 evidence 中写入 secret、token、provider raw body、tool input/output 原文或私有日志。

发布者可以用 `opencap conformance report --records packages/runtime/test/fixtures/conformance --json` 生成本地 conformance summary，并把 `opencap.conformance_summary.v1` 摘要写入 release evidence。该 report 只汇总本地 evidence records，不代表真实 Host UI、Cloud、Console、OAuth、marketplace、payment、npm provenance 或 provider API end-to-end 已完成。

npm package readiness evidence 核对步骤：

- [ ] 运行 `pnpm --filter <package> exec npm pack --dry-run --json > <pack-json>`，只生成本地 pack 摘要，不发布 package。
- [ ] 运行 `opencap release package report --package <package> --pack-json <pack-json> --json`。
- [ ] Evidence 记录 `opencap.npm_package_readiness.v1` 的 package、version、blockers、warnings、pack evidence、forbidden files 和 `policyEffect: none`。
- [ ] 如果 `blockers` 非空，不能发布该 npm package；可把 report 作为 blocker evidence 写入 release notes/handoff。
- [ ] 如果没有运行 pack dry-run，必须把 `pack_evidence: not-run` 写入 evidence，不能伪造 tarball 内容审查已完成。
- [ ] Report 不包含 token、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、`.env` 内容、`opencap.local/` 内容、数据库内容、provider raw response 或私有日志正文。

如果 release 涉及 npm package，发布者应先手动运行 `.github/workflows/npm-publish.yml` 的 dry-run，记录 package、version、workflow run URL、dry-run 结果和 `real_publish: false` 边界。真实 npm 发布仍需要 npm trusted publisher、受保护的 `npm-production` environment 和人工批准；dry-run evidence 不能写成 npm package 已发布。

npm publish dry-run evidence 核对步骤：

- [ ] Workflow run 来自 `.github/workflows/npm-publish.yml`，触发方式是 `workflow_dispatch`。
- [ ] `dry_run` 输入为 `true`，且 run 日志中没有无 `--dry-run` 的 `npm publish` / `pnpm publish` 命令。
- [ ] `package` 是当前允许的 alpha 候选包：`@opencap/spec` 或 `@opencap/cli`。
- [ ] Run 完成 install、validate、test、build 和 publish dry-run。
- [ ] Evidence 记录 package、version、workflow run URL、run id、tarball 摘要、provenance/dry-run 摘要和 `real_publish: false`。
- [ ] Evidence 不包含 token、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、provider raw response、私有日志、`.env`、`opencap.local/` 或数据库文件。

当前 V1 alpha/local runtime evidence 样例见 `docs/releases/evidence/v1-alpha-local-runtime-2026-05-28.md`。该样例只证明本地 Runtime/CLI/Registry/MCP automated stdio smoke，不得扩展解读为 Cloud、Console、OAuth、marketplace、payment、真实 Host UI 或 npm provenance 已完成。

## 7. 发布或阻断

发布：

- [ ] 创建 tag 前最后一次确认 `git status --short`。
- [ ] tag 指向已验证 commit。
- [ ] release notes 写明阶段、支持能力、已知缺口和不得宣称项。
- [ ] 发布后更新 `docs/HANDOFF.md`。

阻断：

- [ ] 在 `docs/TASKS.md` 增加或更新阻断任务。
- [ ] 在 `docs/HANDOFF.md` 记录阻断原因和下一步。
- [ ] 如果是风险问题，更新 `docs/RISKS.md`。
- [ ] 不创建 release tag。

## 关联文档

- `docs/运营/release-readiness.md`
- `docs/releases/alpha-checklist.md`
- `docs/releases/evidence/v1-alpha-local-runtime-2026-05-28.md`
- `docs/规范/versioning-and-compatibility.md`
- `docs/运营/package-publishing-v1.md`
- `docs/质量/quality-gates.md`
