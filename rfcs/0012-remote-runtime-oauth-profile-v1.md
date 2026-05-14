# RFC 0012：Remote Runtime OAuth Profile V1

## 状态

草案

## 摘要

Remote Runtime OAuth Profile V1 定义 OpenCap 未来从本地 Runtime 演进到 remote/cloud runtime 时，Host/client 到 OpenCap 的 OAuth 授权边界、OpenCap 到 downstream provider 的授权边界，以及管理面身份边界。

核心原则：inbound token 只能认证和授权访问 OpenCap Remote Runtime；它不能被透传给 GitHub、Slack、Vercel 等下游 provider；Remote Runtime OAuth 不能复用 V1 env credential 模型，也不能绕过 Runtime policy、consent、secret resolver 或 audit。

## 背景

OpenCap V1 是本地优先：

```text
local user / CLI / MCP stdio
  -> local Runtime
  -> env-based Secret Resolver
  -> external provider API
```

remote/cloud runtime 是另一套问题：

```text
Host / A2A Agent / Apps SDK / API client
  -> OpenCap Remote Runtime protected resource
  -> Runtime validates inbound token
  -> Runtime policy / consent / audit
  -> Runtime obtains provider credential through separate provider auth boundary
  -> external provider API
```

RFC 8707 定义 OAuth Resource Indicators，让 client 在 authorization/token request 中指定目标 protected resource。RFC 9728 定义 OAuth Protected Resource Metadata，让 client 或 authorization server 发现 protected resource 的授权信息。OpenCap remote runtime 应采用这些边界，避免多 audience token、token confusion 和 token passthrough。

参考资料：

- RFC 8707：<https://www.rfc-editor.org/rfc/rfc8707>
- RFC 9728：<https://www.rfc-editor.org/rfc/rfc9728>

## Profile 标识

```text
opencap.remote_runtime.oauth.v1
```

该 profile 只定义 future remote runtime 授权边界。它不表示：

- OpenCap V1 已实现 remote runtime。
- 本地 env credential 可以迁移到 remote user token。
- Host OAuth token 可以当作 downstream provider token。
- Auth scope 可以替代 Runtime policy 或 consent。

## 角色

| 角色 | 说明 |
| --- | --- |
| Host / Client | Claude、Cursor、A2A Agent、Apps SDK server 或组织内 client |
| OpenCap Remote Runtime | OAuth protected resource/resource server |
| OpenCap Authorization Server | future auth server，可是 OpenCap Cloud 或组织 IdP 集成 |
| Downstream Provider | GitHub、Slack、Vercel 等被 Capability 调用的外部 API |
| Registry / Admin Plane | 安装、策略、团队、billing、review 等管理面 |

这些角色不得合并成一个模糊 token。每条调用都必须知道 token audience、issuer、subject、client、scope 和 resource。

## Boundary A：Host 到 OpenCap Remote Runtime

Host 调用 OpenCap Remote Runtime 时必须使用 bearer access token：

```http
POST /v1/invocations
Authorization: Bearer <access-token>
Content-Type: application/json
```

要求：

- access token audience/resource 必须指向 OpenCap Remote Runtime。
- token 不允许出现在 query string、tool input、manifest、audit raw field 或 provider request 中。
- Runtime 必须验证 issuer、audience/resource、expiry、not-before、scope、subject/client 和 signature。
- Runtime 必须拒绝多 audience token，除非未来 profile 明确列出 audience isolation 规则。
- Runtime 必须把 auth subject/client 写入脱敏 audit evidence。

推荐 canonical resource URI：

```text
https://runtime.example.com
```

本地开发或私有部署可以使用组织内 URI，但必须稳定、唯一、可写入 resource indicator，并且不能与 downstream provider resource 混淆。

## Resource Indicators

Client 获取 token 时必须请求 OpenCap resource：

```http
GET /authorize?
  response_type=code&
  client_id=host-client&
  redirect_uri=https%3A%2F%2Fhost.example.com%2Fcallback&
  resource=https%3A%2F%2Fruntime.example.com&
  scope=opencap.invoke
```

Token request 也必须保留 resource indicator：

```http
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=<code>&
redirect_uri=https%3A%2F%2Fhost.example.com%2Fcallback&
resource=https%3A%2F%2Fruntime.example.com
```

OpenCap Runtime 验证 token 时必须确认 token 的 audience/resource 与当前 runtime resource 完全匹配。

## Protected Resource Metadata

OpenCap Remote Runtime 应发布 protected resource metadata：

```json
{
  "resource": "https://runtime.example.com",
  "authorization_servers": [
    "https://auth.example.com"
  ],
  "scopes_supported": [
    "opencap.invoke",
    "opencap.capabilities.read",
    "opencap.audit.read",
    "opencap.policy.read",
    "opencap.policy.write"
  ],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://docs.example.com/opencap-runtime"
}
```

要求：

- metadata 中的 `resource` 必须等于 canonical resource URI。
- `bearer_methods_supported` 只能声明 header；不支持 query/body bearer。
- scopes 必须描述 OpenCap resource 权限，不描述 downstream provider scopes。
- metadata 不包含 tenant secret、provider token、policy 原文或 capability input/output。

## Scope 模型

建议最小 scopes：

| Scope | 用途 | 是否可替代 policy |
| --- | --- | --- |
| `opencap.capabilities.read` | 列出已安装 capability/card/metadata | 否 |
| `opencap.invoke` | 发起 Runtime invocation | 否 |
| `opencap.audit.read` | 读取脱敏 audit/logs | 否 |
| `opencap.policy.read` | 读取 policy 摘要或 revision | 否 |
| `opencap.policy.write` | 提交 policy change request | 否 |
| `opencap.admin` | 管理面操作，需要组织策略限制 | 否 |

即使 token 有 `opencap.invoke`，每次调用仍必须执行：

```text
manifest validation
  -> lifecycle/advisory gate
  -> input classification
  -> data egress gate
  -> policy/gates
  -> consent
  -> secret resolution
  -> outbound policy
  -> execution
  -> audit
```

## Boundary B：OpenCap 到 Downstream Provider

OpenCap 调用 external provider 时必须使用 provider 专属凭据：

```text
OpenCap inbound token
  must not become
GitHub / Slack / Vercel outbound token
```

要求：

- provider token 的 audience/resource 必须指向 provider。
- provider scopes 必须与 Capability permissions 对齐。
- provider credential 必须来自 provider consent、vault/secret provider 或组织配置，不来自 Host input。
- refresh、revocation、rotation、scope step-up 必须写入 provider credential lifecycle 记录。
- provider token 不得出现在 A2A/MCP/Apps SDK tool input、Result Envelope、audit raw field 或 error message 中。

如果 provider token 缺失或 scopes 不足，Runtime 返回结构化 `external_auth_required` / `secret_missing` / `insufficient_provider_scope` 类错误，并记录 audit。不得要求用户把 token 粘贴到 tool input。

## Boundary C：Registry / Admin Plane

管理面身份不等于执行身份。

示例：

- Team admin 可以安装 Capability，不代表可以代表所有用户执行写操作。
- Billing owner 可以管理订阅，不代表可以读取 provider token。
- Registry reviewer 可以批准 package，不代表可以运行用户 tenant 的 Capability。

`opencap.admin` 或管理面 session 不能自动赋予 `opencap.invoke`，也不能绕过 capability-specific policy/consent。

## Token Validation Evidence

Audit event 应记录脱敏 auth evidence：

```ts
type RemoteRuntimeAuthEvidenceV1 = {
  profile: "opencap.remote_runtime.oauth.v1";
  resource: string;
  issuer: string;
  subjectHash: string;
  clientId?: string;
  audience: string[];
  scopes: string[];
  tokenType: "bearer";
  tokenTransport: "authorization_header";
  tokenHash: string;
  validatedAt: string;
  authDecision: "accepted" | "rejected";
  rejectReason?: "missing" | "invalid_signature" | "expired" | "audience_mismatch" | "insufficient_scope" | "unsupported_transport";
};
```

Evidence 不得包含 access token、refresh token、authorization code、id token、provider token、raw JWT claims 中的 PII 或 full request body。

## WWW-Authenticate / Error Semantics

无 token 或 token 无效时返回 `401`，权限不足时返回 `403`。

推荐 challenge：

```http
WWW-Authenticate: Bearer resource_metadata="https://runtime.example.com/.well-known/oauth-protected-resource", error="invalid_token"
```

Runtime tool-level errors 仍走 Result Envelope；协议/HTTP auth 错误只用于 caller 还没有通过 OpenCap resource authentication 的情况。

## 与 Adapter Profiles 的关系

该 profile 是 A2A、remote MCP、Apps SDK 或 future HTTP API adapter 的共享前置边界：

- A2A Agent Card 可以引用 `opencap.remote_runtime.oauth.v1` 的 security scheme。
- MCP over HTTP 如果进入项目，必须使用同一 resource/audience 边界。
- Apps SDK 后端如果调用 OpenCap remote runtime，不能把 ChatGPT/Host token 透传给 provider。
- Local STDIO MCP 不需要该 profile，继续使用本地 state dir 和 env Secret Resolver。

## 安全不变量

- Bearer token 只允许 Authorization header。
- Query/body/capability input 中的 token 一律不作为 OpenCap auth。
- Inbound token 不能当 provider token。
- Scope 不能覆盖 local/org policy。
- Consent 仍由 Runtime 生成并审计。
- Breakglass 不能绕过 token audience、egress deny、outbound private block、secret ordering 或 audit preflight。
- Multi-tenant remote runtime 必须记录 tenant isolation evidence；未定义前不得实现 shared tenant provider token store。

## Evidence / Compatibility Record

Evidence record 必须使用 `opencap.interop.evidence.v1`，字段定义见 `docs/生态/interoperability-evidence-record-schema.md`。本节只列出该 profile 需要的 `checks` 口径。

建议 evidence：

```yaml
profile: opencap.remote_runtime.oauth.v1
opencap_commit: <git-sha>
test_date: 2026-05-14
result: draft | pass | fail
checks:
  protected_resource_metadata: pass
  resource_indicator_required: pass
  audience_mismatch_rejected: pass
  query_token_rejected: pass
  insufficient_scope_rejected: pass
  inbound_token_not_used_downstream: pass
  auth_evidence_redacted: pass
known_gaps:
  - Remote runtime not implemented in V1.
```

## 测试计划

实现该 profile 前至少拆出：

- Protected resource metadata shape tests。
- Resource indicator/audience validation tests。
- Bearer header-only tests。
- Insufficient scope 401/403 mapping tests。
- Token passthrough negative tests。
- Provider credential separation tests。
- Auth evidence redaction tests。
- A2A/MCP/Apps SDK adapter auth integration tests。
- Tenant isolation and revocation tests。

## 非目标

- 不实现完整 OAuth authorization server。
- 不选择具体 IdP。
- 不定义 token exchange、dynamic client registration 或 device flow。
- 不定义 downstream provider OAuth lifecycle 的完整 UX。
- 不把 V1 env provider 改成 remote provider。
- 不实现 multi-tenant secret store。

## 迁移路径

1. 保持 V1 local runtime/env Secret Resolver 不变。
2. 固定 remote runtime public resource URI 和 metadata shape。
3. 实现纯 token validation helper 与 negative tests。
4. 把 auth evidence 接入 Runtime audit。
5. 为 A2A/HTTP/MCP remote adapter 接入同一 auth gate。
6. 另起 provider credential lifecycle RFC/实现，避免 inbound token passthrough。

## 开放问题

- OpenCap Cloud 是否内建 authorization server，还是只接受组织 IdP token。
- 是否要求 DPoP 或 mTLS bound access tokens。
- 是否支持 RFC 7591 dynamic client registration。
- Provider credential lifecycle 应进入哪个 milestone。
- Tenant resource URI 是否需要包含 organization id。
