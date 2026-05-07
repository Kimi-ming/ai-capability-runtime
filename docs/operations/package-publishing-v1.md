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
