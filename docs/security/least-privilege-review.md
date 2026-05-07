# Least Privilege Review：最小权限评审

本文定义 Capability 进入 Registry 前，如何评审 auth scopes、permissions 和 execution 是否满足最小权限原则。

## 评审目标

每个 Capability 都要回答：

- 它实际要做什么动作。
- 它声明了哪些 permissions。
- 它请求了哪些 auth scopes 或 token 权限。
- 这些权限是否刚好足够，而不是方便过宽。
- 用户能不能理解这些权限的后果。

## 基础检查

| 检查项 | 通过标准 |
| --- | --- |
| permissions 与 execution 一致 | create/update/delete/read 不混淆 |
| auth scopes 与 permissions 一致 | scopes 支撑动作，但不过宽 |
| provider 文档可追溯 | README 说明如何创建最小权限 token |
| risk 与权限一致 | 写操作不能标 read_only |
| secret placement 安全 | bearer/header only，禁止 query |
| tests 不含 secret | mock env 只能用假值 |
| output 不返回 secret | output schema 不含 token/password |

## GitHub 示例

`github.create_issue` 的推荐权限：

```yaml
permissions:
  - resource: github.issue
    action: create
    risk: write

auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
  placement: bearer
  scopes:
    - issues:write
```

Review 建议：

- 优先使用 GitHub fine-grained personal access token。
- 只选择目标 repository。
- 只授予 Issues write。
- 不授予 Administration、Contents write、Secrets、Actions 等无关权限。
- README 要提醒用户不要使用全权限 classic token。

GitHub REST 文档提供 fine-grained PAT 权限到 endpoint 的映射，reviewer 应用它核对 token 权限。

## 风险升级规则

下列情况必须升级 review：

- 请求 `destructive`、`financial`、`code_execution`、`secret_access`。
- auth scopes 超出单一资源类型。
- execution URL 包含用户输入 host。
- provider 权限模型无法精确表达最小权限。
- README 要求用户使用高权限 token。
- capability 同时读写多个外部系统。

## 拒绝规则

Registry PR 应被拒绝，直到修正：

- token 放在 query string。
- manifest 或 tests 包含真实 secret。
- permissions 明显低报风险。
- auth scopes 与 execution 不匹配。
- README 隐瞒写操作或外发数据。
- 能力要求用户复制粘贴 OAuth refresh token。

## 评审输出

Reviewer 应留下结构化结论：

```yaml
least_privilege:
  status: pass
  provider: github
  checked_against: github-fine-grained-token-permissions
  recommended_permissions:
    repository: selected
    issues: write
  notes:
    - No query token usage.
    - README documents fine-grained token setup.
```

## 后续自动化

未来可以实现 `opencap registry lint`：

- 比较 permissions 与 risk。
- 检查 forbidden scopes。
- 检查 query token。
- 检查 README 是否有凭据说明。
- 检查 tests/examples 是否有 secret-like 字符串。
