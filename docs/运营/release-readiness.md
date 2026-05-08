# 发布门禁：OpenCap V1

本文定义 OpenCap 从开发骨架到 alpha、beta、V1 的发布门禁。发布不能只看功能数量，要看可信闭环是否成立。

## 发布阶段

```text
M0 文档和骨架
M1 CLI validate
M2 install/list
M3 policy/audit
M4 HTTP executor
M5 invoke dry-run/real
M6 MCP bridge
M7 GitHub demo
M8 Alpha release
```

详细里程碑见 `docs/规划/v1-milestones.md`。

## Alpha 发布条件

Alpha 目标：让早期开发者能本地试用并反馈设计。

必须满足：

- `pnpm install` 成功并提交 lockfile。
- `pnpm validate` 成功。
- `opencap validate` 可校验 registry 和单个 capability。
- `opencap install/list` 可用。
- `opencap invoke --dry-run` 可显示调用计划并写日志。
- `opencap serve --mcp` 可暴露至少一个 tool。
- README 有真实可执行命令，不展示未实现功能为已完成。
- `docs/HANDOFF.md` 指向下一步。

## Beta 发布条件

Beta 目标：让外部贡献者可以新增 Capability 并跑通主路径。

必须满足：

- `github.create_issue` demo 可在真实 token 下执行。
- `opencap logs` 可查看调用记录。
- MCP `confirmation_required` 行为稳定。
- Registry CI 校验 manifest 和 tests。
- Capability Review Checklist 完成。
- 至少一个外部风格示例通过 review。

## V1 发布条件

V1 目标：可信本地 Runtime 成立。

必须满足：

- 所有 P0/P1 任务完成并验证。
- threat model 中的 High 风险有缓解或明确接受。
- 所有 CLI 命令有测试或 smoke test。
- 文档索引、README、SPEC、ARCHITECTURE、TESTING、HANDOFF 同步。
- 发布说明写明 V1 非目标和已知风险。
- tag、CHANGELOG、npm package 策略明确。

## 发布前检查清单

```bash
git status --short --branch
git diff --check
pnpm install
pnpm validate
pnpm test
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
pnpm --filter @opencap/cli dev -- list
```

在实现前期，未能运行的命令必须在 `docs/HANDOFF.md` 标注原因。

## 文档同步清单

每次发布前检查：

- `README.md`：快速开始是否真实。
- `docs/SPEC.md`：V1 范围是否准确。
- `docs/TASKS.md`：任务状态是否真实。
- `docs/TESTING.md`：命令是否可跑。
- `docs/RISKS.md`：High 风险是否处理。
- `docs/DECISIONS.md`：新增 ADR 是否索引。
- `docs/HANDOFF.md`：下一步是否明确。

## 发布阻断条件

出现以下情况不得发布：

- 写操作无法审计。
- 密钥可能进入日志。
- MCP STDIO 模式需要终端 prompt。
- `deny` 后仍会解析密钥或执行 HTTP。
- README 中的主路径命令不可运行且未说明。
- High 风险无记录。
