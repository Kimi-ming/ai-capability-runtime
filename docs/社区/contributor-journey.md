# 贡献者路径

本文定义外部贡献者如何进入 OpenCap 项目。生态项目必须让贡献路径可预期，否则 Registry 和 Runtime 都长不起来。

## 贡献类型

| 类型 | 入口 | 验收 |
| --- | --- | --- |
| 文档改进 | `docs/` | 文档闭环检查通过 |
| Capability 提交 | `registry/` | manifest/tests/review 通过 |
| Runtime 功能 | `packages/runtime` | 单元测试和 smoke test |
| CLI 功能 | `packages/cli` | CLI 契约和 exit code 测试 |
| MCP Bridge | `packages/mcp` | Host compatibility test |
| Spec/schema | `packages/spec` | schema tests 和 ADR |
| 安全修复 | SECURITY 流程 | 私下报告或安全 PR |

## 第一次贡献推荐路径

1. 阅读 `README.md`。
2. 阅读 `docs/SYSTEM.md`。
3. 阅读 `docs/INDEX.md`。
4. 选择一个 `good first issue` 或文档任务。
5. 运行基础验证。
6. 提交 PR。

## Capability 贡献路径

```text
copy examples/simple-http-capability
  -> edit manifest.yml
  -> add README.md
  -> add tests/basic.yml
  -> run opencap validate
  -> open PR with Capability Registry checklist
  -> maintainer review checklist
```

Capability PR 必须在 `.github/PULL_REQUEST_TEMPLATE.md` 的 “Capability Registry PR” 区块完成自查，并链接或说明 `pnpm validate` 结果。提交前应阅读 [Registry 指南](registry-guidelines.md)、[Registry 供应链 Review 工作流](registry-supply-chain-review.md) 和 [能力评审清单](capability-review-checklist.md)。

## Runtime 贡献路径

```text
read SPEC/ARCHITECTURE/DECISIONS
  -> pick task from TASKS
  -> add test
  -> implement smallest slice
  -> update docs if behavior changes
  -> submit PR
```

## PR 必须说明

- 解决什么问题。
- 影响哪些模块。
- 跑了哪些验证。
- 是否新增风险。
- 是否需要 ADR。

## 维护者响应规则

- Capability PR 优先检查安全和权限，不先纠结风格。
- Runtime PR 优先检查边界和测试。
- 设计争议进入 RFC/ADR，不在评论里无限拉扯。
