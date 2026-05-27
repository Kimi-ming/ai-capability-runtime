# 能力清单

Capability Manifest 是 OpenCap 的核心标准。它描述一个 AI Host 可以通过 OpenCap Runtime 调用的行动或数据能力。

## 必填字段

```yaml
id: github.create_issue
name: Create GitHub Issue
description: Create a GitHub issue from structured input.
version: 0.1.0
type: http
input: {}
output: {}
auth: {}
permissions: []
execution: {}
metadata: {}
```

## 身份

`id` 在 registry 中必须稳定。

推荐格式：

```text
provider.action_name
```

示例：

- `github.create_issue`
- `vercel.get_deployments`
- `notion.create_page`

## 类型

V1 只支持：

- `http`：执行 HTTP 请求

`mcp` 和 `local` 类型会在后续 RFC 中单独设计。

## 输入和输出

`input` 和 `output` 使用 JSON Schema。

输入 schema 用于：

- 向 AI Host 暴露工具参数
- 在 Runtime 调用前校验参数
- 渲染确认信息
- 生成测试样例

输出 schema 用于：

- 校验工具结果
- 记录返回值结构
- 帮助 Host 决定后续动作

## 认证

`auth` 声明 Runtime 需要什么凭据。

V1 认证类型：

- `none`
- `api_key`
- `oauth2`（声明保留，完整 OAuth 不属于 V1 实现范围）

示例：

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
  placement:
    type: bearer
```

`api_key` 的 `placement` 必须显式声明。V1 支持 `bearer` 和 `header`，不支持 query token。

## 权限

权限声明 Capability 会触碰什么外部资源。

```yaml
permissions:
  - resource: github.issue
    action: create
    risk: write
    confirmation: ask
```

每个权限必须包含：

- `resource`
- `action`
- `risk`
- `confirmation`

## 执行

HTTP Capability 声明 Runtime 如何调用外部端点。

```yaml
execution:
  method: POST
  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues
  timeout_ms: 10000
```

模板变量来自通过校验的输入。URL 中的变量会进行 URL encoding；缺少 URL 变量时调用失败。

### JSON Body 映射

如果 HTTP 请求需要 JSON body，使用 `execution.body.fields` 显式声明要外发的字段：

```yaml
execution:
  method: POST
  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues
  body:
    type: json
    fields:
      title: "{{title}}"
      body: "Issue: {{body}}"
      labels: "{{labels}}"
  timeout_ms: 10000
```

规则：

- `body.type` 在 V1 只支持 `json`。
- `body.fields` 必须存在，值必须是 JSON 值。
- 值完全等于 `{{field}}` 时，保留输入字段的原始 JSON 类型，例如数组仍是数组。
- 字符串中内嵌 `{{field}}` 时，按字符串插值处理。
- 可选完整变量缺失或为 `null` 时省略该 body 字段。
- Runtime 只会外发 `execution.body.fields` 显式声明的字段，不会默认发送完整 input。

### Reconcile Hint

当写操作可能出现 request 已发出但 outcome unknown 的情况时，可以用 `execution.reconcile` 声明恢复提示。该字段只帮助 Runtime、CLI、Console 或 reviewer 告诉用户如何确认外部状态，不提供授权、不自动 retry，也不执行 reconcile。

```yaml
execution:
  method: POST
  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues
  timeout_ms: 10000
  reconcile:
    strategy: provider_lookup
    hint: Search recent GitHub issues by title before retrying after an unknown timeout.
    provider_request_id_field: headers.x-github-request-id
    resource_ref_fields:
      - body.issue_url
      - body.id
    retry_guidance: do_not_retry_until_reconciled
    policy_effect: none
```

规则：

- `strategy` 目前支持 `manual` 和 `provider_lookup`。
- `hint` 必须是人工可读、安全的恢复提示，不得包含 secret、token、生产日志或 provider raw response。
- `provider_request_id_field` 和 `resource_ref_fields` 只声明从已脱敏 execution evidence 中读取的字段路径。
- `retry_guidance` 必须是 `do_not_retry_until_reconciled`。
- `policy_effect` 必须是 `none`；reconcile hint 不能绕过 policy、consent、quota/budget、outbound、secret resolver 或 audit。

## 元数据

元数据帮助 Registry 评审者和用户评估 Capability。

```yaml
metadata:
  category: developer-tools
  maintainer: opencap
  license: MIT
  trust_level: experimental
```

## 生命周期元数据

当 Capability 已被弃用、下架或撤销时，可以在 manifest 顶层声明 `lifecycle`：

```yaml
lifecycle:
  status: revoked
  reason: unsafe_execution
  since: 2026-05-14
  advisory: OCAP-2026-0001
  replacement: github.create_issue
  message: Do not install this capability by default.
```

`status` 只支持 `deprecated`、`yanked`、`revoked`。`status`、`reason` 和 `since` 必填；`revoked` 必须携带 advisory id。Lifecycle metadata 是治理和用户提示信号，不是授权来源，不能覆盖 Runtime policy、confirmation 或 audit。
