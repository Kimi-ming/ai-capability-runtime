# HANDOFF：当前状态交接

更新时间：2026-05-07

## 当前阶段

OpenCap 处于 V1 前期实现准备阶段。

体系化文档已补充：文档地图、工作流、里程碑、追踪矩阵、风险登记、任务模板和术语表已经建立。

已经完成：

- GitHub 仓库创建和推送
- V1 项目骨架
- 中文文档体系
- 技术方案审查
- V1 HTTP-only 收敛
- 开发任务体系初版
- 文档地图和工作流体系
- 需求-任务-测试追踪矩阵
- V1 里程碑门禁
- 风险登记和任务模板

## 当前代码状态

主要包仍是骨架：

- `@opencap/spec` 有 schema、类型和 manifest validation 脚本雏形
- `@opencap/cli` 有命令骨架，但命令尚未真实执行
- `@opencap/runtime` 有 Runtime class 骨架
- `@opencap/mcp` 有 tool name 和 tool description helper
- `@opencap/sdk` 暂缓实现

## 当前任务入口

下一步从 `docs/TASKS.md` 开始。

Next task: T001 P0：让 `opencap validate` 调用真实 schema 校验。

推荐第一个任务：

```text
T001：让 opencap validate 调用真实 schema 校验
```

原因：

- 风险低
- 依赖少
- 是所有后续 install/registry/CI 的基础

## 最近验证

最近一次文档重写时运行过：

- `git diff --check`
- JSON 解析检查
- YAML 解析检查

尚未运行：

- `pnpm install`
- `pnpm validate`
- `pnpm test`
- `pnpm build`

原因：当前任务主要是文档组织，没有安装依赖。

## 已知风险

- `opencap validate` CLI 目前只是输出 scaffold 文本。
- `packages/spec/src/validate-manifests.mjs` 可以校验 registry，但还没有接到 CLI。
- 没有 `pnpm-lock.yaml`，首次安装依赖后应提交。
- MCP server 尚未实现。
- SQLite audit logger 尚未实现。

## 下一步建议

1. 实现 `@opencap/spec` 的可复用 validator API。
2. 让 `opencap validate <path>` 调用 validator。
3. 添加 validate 单元测试和 CLI smoke test。
4. 运行 `pnpm install && pnpm validate && pnpm test`。
5. 更新 `docs/TASKS.md` 和本文件。
