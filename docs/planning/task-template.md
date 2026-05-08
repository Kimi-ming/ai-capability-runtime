# 任务书写模板

在 `docs/TASKS.md` 中新增任务时，使用以下模板。

```md
### T000 P0：任务标题

- [ ] T000 P0：任务标题

目标：一句话说明完成后用户或系统获得什么能力。

背景：为什么现在要做，关联哪个需求、风险或决策。

涉及文件：

- `path/to/file`

验收标准：

- 标准 1
- 标准 2
- 标准 3

验证：

```bash
command
```

文档更新：

- `docs/TASKS.md`
- `docs/HANDOFF.md`
- 其他相关文档

依赖：

- 无 / Txxx

风险：

- Rxxx / 无
```

## 任务拆分规则

需要拆分的信号：

- 一次任务要改超过 3 个核心包
- 验证命令无法清楚写出
- 任务同时改变架构和实现
- 任务需要外部凭据
- 任务完成标准依赖未来设计

## 好任务示例

```md
### T001 P0：让 `opencap validate` 调用真实 schema 校验

- [ ] T001 P0：让 `opencap validate` 调用真实 schema 校验

目标：CLI 能校验 Capability manifest，而不是只输出 scaffold 文本。

验收标准：

- 合法 manifest 返回 0
- 非法 manifest 返回非 0
- 错误包含文件路径和字段路径

验证：

```bash
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
pnpm validate
```
```
