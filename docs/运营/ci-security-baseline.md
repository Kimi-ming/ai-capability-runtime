# CI 和安全基线

本文定义 OpenCap V1 GitHub Actions 和开源安全基线。目标是让项目从早期就具备可持续维护的最低质量线。

## CI 阶段

### Phase 1：基础验证

必须运行：

```bash
pnpm install --frozen-lockfile
pnpm validate
pnpm test
pnpm build
```

如果 lockfile 尚未存在，先由 T100/T101 解决。

### Phase 2：Registry 验证

必须运行：

- manifest schema validation。
- registry test format validation。
- dry-run planning tests。

### Phase 3：安全基线

当前 workflow：`.github/workflows/security-baseline.yml`。

- GitHub Actions `permissions: read-all` 默认最小权限。
- repository hygiene：`git diff --check`，并阻断 `.env`、`opencap.local/`、SQLite/DB 等本地状态或 secret-shaped 文件。
- workflow permissions audit：阻断 `pull_request_target`、`permissions: write-all` 和 baseline workflow 中的 `contents: write`。
- Dependency Review：PR 中 dependency 变化达到 high severity 时阻断。

后续可继续加入：

- CodeQL。
- OpenSSF Scorecard weekly。
- secret scanning 依赖 GitHub 平台能力。

## PR 策略

- Registry Capability PR 必须跑 schema/test/review checklist。
- 外部贡献 PR 不使用 repo secrets。
- `pull_request_target` 默认不用，除非有明确安全设计。

## Branch Protection 建议

V1 发布前建议：

- main 需要 PR。
- 必须通过 CI。
- 至少一个 review。
- 禁止 force push。

## Release 基线

Alpha：

- tag。
- CHANGELOG。
- GitHub release note。

Beta：

- npm package 发布 dry-run。
- provenance 预案。

V1：

- npm provenance 或 signed release 策略。
- release checklist 完成。

## 与 OpenSSF Scorecard 对齐

优先关注：

- Branch-Protection。
- CI-Tests。
- Code-Review。
- Security-Policy。
- Token-Permissions。
- Vulnerabilities。
- Signed-Releases。

## 关联任务

- T100：pnpm workspace。
- T101：CI 基础通过。
- T080：Registry manifest CI。
- T121：CHANGELOG。
- T123：npm package 发布预案。
- T139：CI 安全基线 workflow。
