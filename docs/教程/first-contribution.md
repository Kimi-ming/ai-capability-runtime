# 第一次贡献 OpenCap

本文给第一次参与 OpenCap 的贡献者一条可执行路径。目标不是一次理解所有设计，而是安全完成一个小任务，并让代码、测试和文档保持同步。

开始前建议先读：

- [贡献指南](../../CONTRIBUTING.md)
- [开发环境](开发环境.md)
- [开发工作流](../WORKFLOW.md)
- [当前状态交接](../HANDOFF.md)
- [开发任务总表](../TASKS.md)
- [验证策略](../TESTING.md)

## 1. 准备环境

项目推荐使用 conda 环境运行 Node.js 和 pnpm：

```bash
conda env create -f environment.yml
conda activate ai-capability-runtime
pnpm install
```

如果环境已经存在，可以直接激活：

```bash
conda activate ai-capability-runtime
```

确认工具版本：

```bash
node --version
pnpm --version
```

## 2. 了解当前状态

不要从文件树随机开始。先读当前交接和任务表：

```bash
sed -n '1,160p' docs/HANDOFF.md
sed -n '1,220p' docs/TASKS.md
```

如果你使用 continuous-doc-dev 工作流，可以运行：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
```

输出里的 `Next task` 就是当前建议任务。只选择没有阻塞、带验收标准、带验证命令的任务。

## 3. 选择一个小任务

第一次贡献优先选择这类任务：

- 文档入口修正
- 示例 README 补充
- 小范围测试补齐
- Registry 示例校验
- CLI 输出或错误信息的小修正

暂时避开这类任务：

- 改变 manifest schema 兼容性
- 改变权限语义
- 改变审计日志结构
- 引入新协议或新依赖
- 需要真实外部凭据的任务

如果任务太大，先在 `docs/TASKS.md` 拆成更小的可验证任务。

## 4. 实现最小改动

OpenCap 的原则是小步推进。每个任务只做满足验收标准所需的改动。

常见入口：

```text
packages/spec/      Manifest schema 和 registry 校验
packages/runtime/   本地状态、策略、审计和 HTTP 执行
packages/cli/       命令行入口
packages/mcp/       MCP helper 和 tool projection
registry/           示例 Capability
docs/               中文文档、设计、任务和交接
```

如果改代码，优先补测试；如果改命令、测试或工作流，同步 [验证策略](../TESTING.md)；如果完成或拆分任务，同步 [开发任务总表](../TASKS.md) 和 [当前状态交接](../HANDOFF.md)。

## 5. 运行验证

每个任务以自己的验证命令为准。常用命令是：

```bash
pnpm validate
pnpm test
pnpm build
pnpm lint
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

如果是文档任务，至少运行：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```

如果验证失败，不要把任务标成完成。先修复；如果失败和当前任务无关，在 `docs/HANDOFF.md` 记录清楚。

## 6. 同步文档

任务完成前检查这些文档是否需要更新：

- `docs/TASKS.md`：任务状态、完成记录、下一任务验收标准。
- `docs/HANDOFF.md`：当前阶段、最近验证、下一步建议。
- `docs/TESTING.md`：测试入口、命令或验证范围变化。
- `CHANGELOG.md`：用户或维护者需要知道的重要变化。
- `README.md`：安装、快速开始或主要能力变化。

原则：代码改变了真实行为，文档也要跟上；文档不能承诺还没实现的能力。

## 7. 提交并推送

提交前查看范围：

```bash
git status --short
git diff --stat
```

提交信息用动词开头，描述真实变化：

```bash
git add <changed-files>
git commit -m "Add CLI smoke test"
git push
```

当前早期阶段可以直接在 `main` 上推进。多人协作后会切到 feature branch 和 PR 流程。

## 8. Capability 贡献路径

如果你要贡献 Registry 条目，先读：

- [编写一个 Capability](write-a-capability.md)
- [评审一个 Capability PR](review-a-capability.md)
- [Registry 根目录说明](../../registry/README.md)

Capability 条目必须包含 `manifest.yml`、`README.md` 和 `tests/`，必须声明权限和风险等级，不能提交真实 token、私有数据或隐藏外部请求。

## 完成标准

一次健康的贡献应该满足：

- 任务验收标准全部满足。
- 对应验证已经运行并通过。
- `docs/TASKS.md` 和 `docs/HANDOFF.md` 已同步。
- 相关 README、TESTING、CHANGELOG 已按需更新。
- 提交已经推送。
