# ADR 0009：Policy DSL V1 使用顶层 default/rules

日期：2026-05-07

状态：已接受

## 背景

早期文档中出现过两种 policy 示例：一种是顶层 `default/rules`，另一种是 `policies.default/rules`。实现前必须统一。

## 决策

V1 使用顶层结构：

```yaml
default: ask
rules: []
```

规则按顺序匹配，第一条命中返回决策。

## 影响

- `docs/permission-model.md` 需要同步。
- Policy parser 只实现一种格式。
- 后续如引入 OPA/Rego，通过 adapter 实现，不改变 V1 文件语义。

