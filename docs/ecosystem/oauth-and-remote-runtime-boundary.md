# OAuth 与远程运行时边界

本文定义 OpenCap 未来从本地 Runtime 走向远程 Runtime、Cloud 或多 Host 接入时，OAuth 和授权边界必须如何重新设计。

## V1 与 Future 的区别

V1：

```text
Local user starts Runtime
  -> Runtime reads env credential
  -> Runtime calls external API
```

Future remote runtime：

```text
User / Host / Agent
  -> authenticate to OpenCap remote runtime
  -> OpenCap validates audience and scopes
  -> OpenCap obtains or uses downstream provider credential
  -> OpenCap calls external API
```

这不是同一个问题。远程 Runtime 不能复用 V1 的 env credential 假设。

## 三个 OAuth 边界

### Boundary A：Client/Host 到 OpenCap

OpenCap remote runtime 是 protected resource。Host 或 client 访问它时，token 必须是签发给 OpenCap runtime 的。

要求：

- token audience 指向 OpenCap runtime。
- 使用 Authorization Bearer header。
- token 不放 query string。
- 验证 issuer、audience、expiry、scope。
- 401/403 错误语义清晰。

### Boundary B：OpenCap 到 External Provider

OpenCap 调 GitHub、Google、Slack 等外部 API 时，应使用 provider 授权给该 provider resource 的 token。

要求：

- 不能把 Boundary A 的 token 传给 provider。
- provider token 的 scopes 与 Capability permissions 对齐。
- refresh token 存储和轮换需要独立设计。
- 用户撤销 provider 授权后，OpenCap 必须停止执行相关 Capability。

### Boundary C：OpenCap Registry/Cloud 管理面

如果未来有团队、组织、付费、托管 Registry，它属于管理面授权，不等于 Capability 执行授权。

要求：

- 管理面角色不能自动授予下游 API 凭据。
- 团队 admin 能安装 capability，不等于能代表用户执行写操作。
- Cloud billing 身份和 execution identity 分离。

## Resource Indicators 和 Protected Resource Metadata

RFC 8707 的 resource parameter 让客户端明确表示 token 要用于哪个 protected resource。RFC 9728 定义 protected resource metadata，帮助客户端发现资源的授权服务器等信息。

OpenCap 未来 remote runtime 应遵守：

- 为 OpenCap runtime 定义 canonical resource URI。
- 要求客户端在 authorization/token request 中使用 resource parameter。
- 验证 inbound token audience。
- 公开 protected resource metadata。
- 避免多 audience token。

## Token Passthrough 禁止

```text
Inbound token from Host -> OpenCap
            must not become
Outbound token from OpenCap -> GitHub/Slack/Vercel
```

如果 OpenCap 要代表用户访问外部 provider，必须走 provider 自己的授权链，或使用用户显式配置的 credential provider。

## Scope Challenge 和 Step-up

未来 Runtime 可能发现 provider token scopes 不够。处理方式应是 step-up authorization，而不是静默要求用户提供更大 token。

V1 对应行为：

- 返回 `SecretMissingError` 或 `ExternalAuthError`。
- 告知需要哪些 provider permissions。
- 不请求用户通过 MCP input 粘贴 token。

## 非目标

本文不设计完整 OAuth server，也不选择具体身份供应商。它只定义未来设计不能违反的边界。

## 进入实现前必须有的 RFC

- Remote Runtime OAuth profile。
- Token storage and refresh lifecycle。
- User/session/org identity model。
- Provider consent and revocation model。
- Audit subject identity model。
- Tenant isolation and admin role model。
