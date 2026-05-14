## 摘要

## 类型

- [ ] Runtime / CLI / MCP 变更
- [ ] Capability Registry 条目
- [ ] 文档
- [ ] 安全修复
- [ ] CI / 发布

## 验证

- [ ] `git diff --check`
- [ ] JSON/YAML 解析检查
- [ ] 相关单元测试
- [ ] 行为变化时已同步文档

## 风险

- [ ] 没有新增权限或网络行为
- [ ] 新增或变更的权限已记录
- [ ] 密钥不会进入日志或输出
- [ ] 审计行为保持完整

## Capability Registry PR

如果本 PR 新增或修改 `registry/**` Capability 条目，请完成以下检查；不涉及 Registry 条目时可标记不适用。

- [ ] 不适用，本 PR 不修改 Capability Registry 条目
- [ ] 已阅读 [Registry 供应链 Review 工作流](../docs/社区/registry-supply-chain-review.md)
- [ ] 已按 [能力评审清单](../docs/社区/capability-review-checklist.md) 自查
- [ ] 目录使用 `registry/<category>/<capability_id>/`，且 `metadata.category` 与目录分类一致
- [ ] `manifest.yml`、`README.md` 和 `tests/basic.yml` 或等价测试齐全
- [ ] `type: http`，且描述、permissions、risk、auth、execution 与真实外部行为一致
- [ ] 没有提交真实 token、cookie、私钥、用户数据、内部 URL、`opencap.local/` 或数据库文件
- [ ] README 说明凭据、外部服务、权限、风险、确认行为和 dry-run/validation 方法
- [ ] 已运行 `pnpm validate`，并在“验证”部分写明结果

## 备注
