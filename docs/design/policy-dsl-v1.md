# Policy DSL V1

本文定义 OpenCap V1 的本地策略文件格式。目标是足够简单、可读、可测试，同时给未来 OPA/Rego 留出接口。

## 文件位置

默认：

```text
opencap.local/policies.yml
```

用户可通过 `--state-dir` 改变 state dir，但文件名保持不变。

## 顶层结构

V1 使用顶层 `default/rules`，不包一层 `policies`。

```yaml
default: ask
rules:
  - id: allow-read-only
    match:
      risk: read_only
    decision: allow
    reason: Read-only capabilities are allowed by default.
```

## 决策

只支持：

- `allow`
- `ask`
- `deny`

没有 policy 文件时，默认等同于：

```yaml
default: ask
rules: []
```

## Match 字段

V1 支持以下匹配键：

| 字段 | 示例 | 含义 |
| --- | --- | --- |
| `capability_id` | `github.create_issue` | 精确匹配能力 id |
| `risk` | `write` | 匹配权限风险 |
| `resource` | `github.issue` | 匹配权限资源 |
| `action` | `create` | 匹配权限动作 |
| `channel` | `mcp` | `cli` 或 `mcp` |
| `host` | `claude-desktop` | Host 标识，未知时为空 |
| `trust_level` | `tested` | manifest metadata trust level |

V1 只做精确匹配，不支持复杂表达式。

## 规则顺序

规则按顺序匹配，第一条命中即返回决策。

原因：

- 用户可读。
- 易于实现。
- 容易调试。

未来如果引入更复杂策略，可迁移到 OPA/Rego。

## 示例策略

```yaml
default: ask
rules:
  - id: deny-destructive
    match:
      risk: destructive
    decision: deny
    reason: Destructive actions are disabled locally.

  - id: allow-read-only-tested
    match:
      risk: read_only
      trust_level: tested
    decision: allow
    reason: Tested read-only capabilities are allowed.

  - id: ask-github-write
    match:
      capability_id: github.create_issue
      risk: write
    decision: ask
    reason: Creating GitHub issues requires confirmation.
```

## 多权限 Capability

一个 Capability 可以声明多个 permissions。V1 聚合策略：

```text
如果任一 permission 命中 deny -> deny
否则如果任一 permission 命中 ask -> ask
否则全部 allow -> allow
```

这保证高风险权限不会被低风险权限覆盖。

## 审计字段

PolicyDecision 必须记录：

- decision
- matched rule id
- reason
- evaluated permissions summary

## 非目标

V1 不支持：

- 正则表达式。
- 用户/组织 RBAC。
- 时间窗口。
- 预算限制。
- remote policy server。
- Rego。

这些能力保留到 V1 之后。
