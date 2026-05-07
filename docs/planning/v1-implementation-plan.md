# V1 实施计划

本文把 V1 从当前文档体系推进到可运行 Runtime 的实施顺序具体化。

## 当前入口

下一步任务：

```text
T001：让 opencap validate 调用真实 schema 校验
```

## 实施原则

- 先让 schema/CLI 跑通，再做 Runtime。
- 每个阶段只引入一条可验证闭环。
- 所有 P0 任务完成时，必须能跑 smoke 1。
- 不为了 UI 或云端能力打断本地主路径。

## 阶段 1：Spec 和 CLI validate

任务：T001、T002、T003、T100。

产物：

- 可复用 validator API。
- CLI validate 真实校验。
- schema 单元测试。
- pnpm workspace 可安装。

通过标准：

```bash
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
pnpm validate
pnpm test
```

## 阶段 2：本地状态和安装

任务：T010、T011、T012、T013、T014。

产物：

- state dir helper。
- install/list。
- 统一错误处理。

通过标准：

```bash
opencap install github.create_issue
opencap list
```

## 阶段 3：Policy 和 Audit

任务：T030、T031、T032、T040、T041、T042、T132。

产物：

- policy parser/engine。
- confirmation interface。
- SQLite audit log。
- redaction/input hash。
- audit failure preflight。

通过标准：deny/ask/allow 都能写日志。

## 阶段 4：HTTP Executor

任务：T050、T051、T052、T053、T054、T055、T091、T130、T131、T133。

产物：

- URL/body 模板渲染。
- auth placement。
- dry-run executor。
- real HTTP executor。
- outbound policy。

通过标准：GitHub create issue dry-run 生成正确 method/url/body，不泄露 token。

## 阶段 5：Invoke 命令

任务：T060、T061、T062。

产物：

- `opencap invoke --dry-run`。
- `opencap invoke`。
- 示例 input。

通过标准：Smoke 1 通过到 dry-run/logs。

## 阶段 6：MCP Bridge

任务：T070、T071、T072、T073、T021、T090、T127。

产物：

- MCP tools/list。
- MCP tools/call。
- tool name collision detection。
- confirmation_required。
- token passthrough 禁止。

通过标准：Host 能发现 `github_create_issue`，ask 不静默执行。

## 阶段 7：Registry 和发布

任务：T004、T080、T081、T082、T101、T120、T121、T126、T129、T139。

产物：

- Registry test schema。
- CI。
- Review checklist。
- Alpha release checklist。

通过标准：外部贡献者能新增一个 basic Capability 并通过 CI。

## 不做事项

- Console UI。
- Cloud Runtime。
- OAuth 完整 flow。
- A2A server。
- OpenAPI adapter 自动发布。
- 支付/交易。
