# 调研：身份授权与凭据管理 2026-05-07

本文记录本轮身份、授权、密钥体系补充参考的外部来源和设计影响。

## 参考来源

- MCP Authorization 2025-11-25: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- RFC 8707 Resource Indicators for OAuth 2.0: https://www.rfc-editor.org/rfc/rfc8707.html
- RFC 9728 OAuth 2.0 Protected Resource Metadata: https://www.rfc-editor.org/rfc/rfc9728
- GitHub fine-grained PAT permissions: https://docs.github.com/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens

## 对 OpenCap 的影响

### MCP Authorization 强化 token audience 和 token passthrough 边界

MCP Authorization 要求 client 使用 resource indicators，请求面向 MCP server 的 token；server 需要验证 token 是发给自己的，不能接受或转发其他 token。对 OpenCap 来说，这直接支持“Host token 不能变成下游 API token”的决策。

OpenCap 决策：V1 禁止 token passthrough，未来 remote runtime 必须重新设计 OAuth boundary。

### RFC 8707 支持 audience-bound token 思维

RFC 8707 让 client 显式声明目标 protected resource，从而让授权服务器签发更准确的 audience-restricted token。

OpenCap 决策：未来 OpenCap remote runtime 必须有 canonical resource URI，并校验 inbound token audience。

### RFC 9728 提供 protected resource metadata 方向

RFC 9728 让 protected resource 发布元数据，便于 client 发现授权服务器和资源标识。

OpenCap 决策：未来 remote runtime 需要 protected resource metadata，但 V1 local STDIO 不实现。

### GitHub fine-grained PAT 权限映射支持 least privilege review

GitHub 文档维护 endpoint 到 fine-grained token 权限的映射。OpenCap Registry reviewer 可以用它检查 `github.create_issue` 等能力是否请求了最小权限。

OpenCap 决策：新增 least privilege review 文档，并要求 README 说明最小 token 权限。

## 新增文档

- `docs/security/identity-and-auth-model.md`
- `docs/design/secret-resolver-v1.md`
- `docs/operations/credential-lifecycle.md`
- `docs/security/least-privilege-review.md`
- `docs/ecosystem/oauth-and-remote-runtime-boundary.md`

## 后续问题

- 是否为 `auth.scopes` 增加更严格 schema。
- 是否在 V1 增加 `opencap doctor credentials`。
- 是否支持 macOS Keychain 作为 V1.1 provider。
- 远程 Runtime OAuth profile 是否进入 v0.3。
