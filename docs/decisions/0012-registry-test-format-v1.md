# 架构决策 0012：注册表测试格式 V1

日期：2026-05-07

状态：已接受

## 背景

Registry 不能只验证 manifest 结构，还需要验证示例输入、dry-run 渲染和未来 mock HTTP 行为。当前 `tests/basic.yml` 没有稳定格式。

## 决策

V1 `tests/*.yml` 使用字段：

```yaml
name: string
capability: capability.id
mode: validate | dry_run
input: {}
expect: {}
```

V1 先支持 `validate` 和 `dry_run`，保留 future `mock_http`。

## 影响

- 需要新增 registry test schema。
- CI 可以先跑 manifest + dry-run planning。
- Capability review 可以要求至少一个 basic dry-run test。
