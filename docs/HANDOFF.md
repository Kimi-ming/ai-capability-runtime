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

## 本轮体系化补充

已新增产品战略、用户场景、Capability 生命周期、领域模型、Runtime 契约、协议定位、威胁模型、发布门禁和协议生态补充调研。新增 ADR 0006/0007，并更新风险登记、任务表、README、INDEX、SPEC、ARCHITECTURE 和追踪矩阵。

当前下一步仍然是 T001：让 `opencap validate` 调用真实 schema 校验。实现时应优先对齐 `docs/design/runtime-contracts.md` 和 `docs/product/capability-lifecycle.md`。

## V1 执行和治理关键决策已收敛

已新增 `docs/SYSTEM.md`，并补齐 HTTP 执行、Policy DSL、Audit Log、Registry Test Format、Outbound Policy、供应链治理和项目运行模型。ADR 0008-0012 已接受。`github.create_issue` manifest 已加入 `execution.body.fields` 和 `auth.placement: bearer`。

当前 High 风险中，R002 和 R014 已缓解，R003/R004 已进入明确实现任务。下一步仍是 T001：让 `opencap validate` 调用真实 schema 校验。

本轮验证缺口：`pnpm` 和 `corepack` 在当前 shell 中不可用，`python jsonschema` 也未安装，因此未能运行 `pnpm validate` 或完整 JSON Schema 校验。已完成基础 JSON/YAML 解析和文档闭环检查。

## 实现前接口契约已补齐

已新增 CLI 契约、本地状态、配置模型、MCP 接口、错误模型、隐私与数据保留、CI 安全基线和 V1 实施计划。ADR 0013-0015 已接受。下一步 T001 可以直接按 `docs/design/cli-contract-v1.md` 和 `docs/design/error-model-v1.md` 实现，不需要再临场定义命令行为。

## 生态、社区和可观测性体系已补齐

已新增 Capability 分类、Host 兼容性矩阵、开源核心边界、贡献者路径、Capability Review Checklist、RFC 流程、可观测性指标和 Open Questions；新增 GitHub PR/issue templates；ADR 0016-0018 已接受。下一步仍是 T001，文档体系已经足够支撑进入实现阶段。

## 演进、发布和兼容性体系已补齐

已新增版本兼容、Manifest 演进、Registry 分发、SDK/Adapter 边界、包发布、签名/provenance、质量门禁、维护者手册和 CHANGELOG。ADR 0019-0022 已接受。下一步仍是 T001，项目已具备从 V1 实现到后续发布演进的文档轨道。


## 互操作、确认同意、一致性和 Agentic 风险体系已补齐

已新增互操作 Profiles、确认与同意模型、Capability Package V1、一致性测试体系、Agentic 风险映射和互操作/Agentic security 调研。ADR 0023-0026 已接受。已修正任务编号冲突：原已完成的“演进、发布和兼容性体系”改为 T149，T124 保留给“领域模型落入 TypeScript 类型和 Runtime 接口”。

下一步仍然是 T001。进入实现时要特别注意：`ask` 不能直接执行，MCP 无确认通道时必须返回 `confirmation_required`，后续 audit log 需要能记录 consent receipt。


## 身份、授权和凭据生命周期体系已补齐

已新增身份与授权模型、Secret Resolver V1、凭据生命周期 Runbook、最小权限评审、OAuth 与远程 Runtime 边界和身份授权调研。ADR 0027-0029 已接受。V1 明确只使用 manifest 声明的 env credential；Host/client/input token 不得作为下游 provider token；远程 Runtime OAuth 必须另走 profile/RFC。

下一步仍然是 T001。进入实现时，`opencap validate` 之后的 T159/T164 会成为安全主线之一：Secret Resolver 只能在 validation、policy、consent 通过后运行，dry-run 默认不读取 secret 原值。
