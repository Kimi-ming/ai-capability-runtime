# 身份与授权模型：OpenCap V1

本文定义 OpenCap V1 中的身份、授权边界和凭据来源。它回答一个基础问题：当 AI Host 调用 Capability 时，OpenCap 到底代表谁、使用什么凭据、凭据能去哪里。

## 核心结论

V1 只实现本地 Runtime 的 env-based downstream credentials。也就是说：

```text
AI Host -> OpenCap Runtime -> External API
              |
              +-- 从本地环境变量读取下游 API 凭据
```

V1 不实现：

- 远程 OpenCap Runtime 的登录系统。
- OAuth authorization server。
- 多租户用户会话。
- 企业 SSO / SCIM / RBAC。
- Host token 透传给外部 API。

这些都必须走后续 RFC。

## 身份主体

| 主体 | V1 含义 | 信任级别 |
| --- | --- | --- |
| Local User | 启动 Runtime 的本地用户 | 本地授权主体 |
| AI Host | 调用 MCP tools 的宿主 | 不完全可信 |
| Model | 生成 tool arguments 的模型 | 不可信 |
| Capability | manifest 定义的能力 | 需校验和评审 |
| Runtime | 执行 policy、consent、secret、audit 的边界 | V1 TCB |
| External API | GitHub、Vercel 等真实服务 | 外部边界 |
| Registry Maintainer | review capability package 的维护者 | 治理主体 |

V1 中，Runtime 不知道完整的人类账号身份。它只能知道“本地进程被某个本地用户启动，并能读取该进程环境变量”。因此审计中的 subject 默认是 `local_user` 或 `unknown`，不能假装有云端用户身份。

## 两条授权链

OpenCap 必须区分两条链：

### 1. Host 到 OpenCap

V1 STDIO MCP 没有独立认证。Host 能启动或连接本地进程，意味着它在本机权限边界内调用 Runtime。

V1 约束：

- Host 传来的 tool arguments 一律不可信。
- Host 不能通过 input 提供 token 替代 manifest auth。
- Host 不能让 Runtime 跳过 policy 或 audit。
- Host 支持确认 UI 也只是 consent channel，不是授权来源。

### 2. OpenCap 到 External API

V1 使用 manifest `auth` 声明和本地环境变量读取下游凭据。

示例：

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
  placement: bearer
```

V1 约束：

- 凭据只从声明的 env var 读取。
- env var 名字是 credential reference，不是 secret。
- secret resolution 只能发生在 policy/consent 通过之后。
- secret 不写入 URL、日志、stdout、stderr、MCP result。
- query token 不支持。

## Token Passthrough 禁止

MCP Authorization 规范强调，MCP server 不能接收或转发不是发给自己的 token；如果 server 调上游 API，应使用上游授权服务器签发给上游 API 的独立 token。

OpenCap 的对应规则：

```text
Host token != GitHub token
Host token != Vercel token
Host token != OpenCap downstream credential
```

V1 即使没有远程 Host token，也要在 Runtime contract 中保留这个不变量，防止未来 HTTP transport 或 Cloud runtime 走捷径。

## Capability Auth 声明

V1 auth 最小字段：

| 字段 | 含义 | 约束 |
| --- | --- | --- |
| `type` | `none` 或 `api_key`，`oauth2` 只声明保留 | V1 executor 只实现 none/api_key |
| `provider` | 外部服务标识 | 用于 review 和错误展示 |
| `env` | 环境变量名 | secret reference，不是 secret |
| `placement` | 凭据放置方式 | V1 支持 `bearer` 和指定 header |
| `scopes` | 期望权限 | 用于 least-privilege review |

Manifest schema 当前会强制 `api_key` credential descriptor 显式声明 `provider`、`env`、`placement` 和非空唯一 `scopes`。`env` 只能是安全环境变量引用，`provider` 必须是稳定 slug，custom header name 不能使用 `Authorization`、`Cookie` 或 `Set-Cookie`。`auth.type: none` 不得携带 credential descriptor 字段。

## 权限与凭据的关系

`permissions` 描述 Capability 会做什么。`auth` 描述 Runtime 需要什么凭据。两者必须能互相解释。

例如 `github.create_issue`：

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

Review 时应检查：

- auth scopes 是否支撑 permissions。
- scopes 是否明显过宽。
- README 是否说明凭据权限。
- tests 是否不含真实 secret。

## Future OAuth 边界

未来远程 Runtime 需要独立设计：

- Host -> OpenCap 的 OAuth boundary。
- OpenCap -> External API 的 OAuth client boundary。
- resource indicators 和 audience binding。
- protected resource metadata。
- token storage、refresh、revocation。
- user/session/org identity。

这些不能从 V1 env credential 自然外推。必须通过 RFC 和 ADR。

## 不变量

- 模型和 Host 不能直接提供下游 secret。
- policy deny 或 ask 未确认时不得解析 secret。
- dry-run 默认不解析 secret，除非任务明确测试 secret presence，且不得读取原值。
- secret resolver 不返回可记录的原始 secret，只返回 executor 可消费的短生命周期 credential material。
- Credential reference 可以写入日志，credential value 不可以。
- Registry trust level 不能授予额外凭据权限。
