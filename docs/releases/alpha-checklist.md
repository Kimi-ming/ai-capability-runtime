# Alpha Release Checklist

本文是 OpenCap alpha 发布前的中文门禁清单。它用于判断当前仓库是否可以发布一个可试用的本地优先版本，而不是宣称 V1 全部完成。

Alpha 对应 [发布成熟度门禁](../运营/release-readiness.md) 中的 v0.1 Local Runtime。若本清单和 maturity gate matrix 冲突，以 matrix 的 hard gate 为准，并同步修正本清单。

通用发布前执行顺序和 release evidence 模板见 [Release Checklist](release-checklist.md)。本文只保留 alpha 阶段特有口径和阻断项。

## 发布口径

Alpha 可以承诺：

- 开发者能在本地安装依赖并运行 workspace 验证。
- CLI 能跑通 validate、install、list、invoke dry-run 和 logs 的最小闭环。
- Registry 示例 Capability 能通过 manifest 和 registry test 校验。
- Runtime 的策略、确认、审计、HTTP dry-run/executor 和 MCP helper 有基础测试覆盖。
- 未完成能力有清晰说明。

Alpha 不能承诺：

- 完整 `opencap serve --mcp` server 已可用。
- Console UI 已可用。
- Cloud、团队、多租户或商业化能力已可用。
- OAuth 完整授权流已可用。
- Capability 签名、远程 Registry index signing 或 npm provenance 已完成。

## 阻断项

以下项目未完成时，不应发布 alpha。

### 功能

- [ ] `opencap validate` 可校验单个 Capability 和 registry。
- [ ] `opencap install` 使用本地 registry 安装到显式或默认 state dir。
- [ ] `opencap list` 能展示已安装 Capability。
- [ ] `opencap invoke --dry-run` 能生成 HTTP 调用计划并写入审计日志。
- [ ] `opencap logs` 能读取 SQLite 审计日志。
- [ ] README 快速开始命令能在干净 state dir 中跑通。

### 测试

- [ ] `pnpm validate` 通过。
- [ ] `pnpm test` 通过。
- [ ] `pnpm build` 通过。
- [ ] `pnpm lint` 通过。
- [ ] CLI smoke test 覆盖 validate、install、list、invoke dry-run 和 logs。
- [ ] `check_docs.py` 通过。
- [ ] `git diff --check` 通过。

### 文档

- [ ] `README.md` 与当前真实命令一致。
- [ ] `docs/HANDOFF.md` 说明当前状态、已知风险和下一步。
- [ ] `docs/TASKS.md` 没有把未验证任务标为完成。
- [ ] `CHANGELOG.md` 的未发布部分包含本次 alpha 重要变化。
- [ ] 已知限制明确写出，尤其是 MCP server、Console、Cloud 和 OAuth。

### 安全

- [ ] token passthrough 禁止测试通过。
- [ ] 审计日志不记录 secret 原文。
- [ ] dry-run 不读取 secret 原值。
- [ ] 任意 URL / outbound policy 风险在文档中明确标注。
- [ ] Registry 条目不包含真实 token、私有数据或隐藏外部请求。

### Registry

- [ ] 每个示例 Capability 包含 `manifest.yml`、`README.md` 和 `tests/`。
- [ ] `github.create_issue` 示例能通过 validate。
- [ ] `slack.send_message` 示例明确 `external_send` 风险和 `SLACK_BOT_TOKEN` env。
- [ ] `http.request_demo` 标注 unsafe-by-default 或 arbitrary URL 风险。

## 可后续跟进项

以下项目可以不阻塞 alpha，但必须保留在任务表或风险登记中。

- [ ] 完整 MCP server 启动与 Host 兼容性矩阵。
- [ ] Outbound policy 私网阻断的完整实现测试。
- [ ] CLI command snapshot、stdout/stderr 和 exit code 细粒度测试。
- [ ] Release automation、npm trusted publishing 和 provenance。
- [ ] Console UI。
- [ ] SDK 和 adapters。
- [ ] Registry signing 和 verified capability 流程。
- [ ] 远程 Runtime OAuth profile。

## 发布前操作

发布前维护者应按顺序执行：

```bash
pnpm install
pnpm validate
pnpm test
pnpm build
pnpm lint
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

然后检查：

- [ ] 当前分支已经推送到 GitHub。
- [ ] `CHANGELOG.md` 已准备发布说明。
- [ ] `docs/HANDOFF.md` 已记录发布前状态。
- [ ] GitHub Actions 没有失败的 required check。
- [ ] Release notes 明确 alpha 限制和不兼容风险。
