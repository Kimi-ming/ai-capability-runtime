# 密钥解析器 V1

本文定义 V1 Secret Resolver 的输入、输出、生命周期和测试要求。Secret Resolver 是 OpenCap Runtime 的可信边界之一。

## 目标

Secret Resolver 只做一件事：在调用已经通过 validation、policy 和 consent 之后，把 manifest 中的 credential reference 解析成 executor 可使用的凭据材料。

它不做：

- policy 决策。
- 用户确认。
- OAuth 登录。
- secret 存储。
- secret 展示。
- 任意 input token 接收。

## 调用位置

```text
load capability
  -> validate input
  -> build invocation plan
  -> evaluate policy
  -> confirm when needed
  -> resolve secret
  -> execute or dry-run
  -> audit
```

`deny`、`ask declined`、`confirmation_required`、`validation error` 都不能进入 Secret Resolver。

## 输入

```ts
type SecretResolveRequest = {
  invocationId: string;
  capabilityId: string;
  auth: CapabilityAuth;
  executionTarget: {
    method: string;
    urlOrigin: string;
    provider?: string;
  };
  mode: 'execute' | 'dry_run';
};
```

`executionTarget.urlOrigin` 用于确认凭据不会被发送到意外域名。它必须来自 URL 模板渲染后的 origin，并经过 outbound policy 检查。

## 输出

```ts
type ResolvedCredential =
  | { type: 'none' }
  | {
      type: 'bearer';
      provider: string;
      source: 'env';
      envName: string;
      redacted: string;
      apply: 'authorization_header';
    }
  | {
      type: 'header';
      provider: string;
      source: 'env';
      envName: string;
      headerName: string;
      redacted: string;
      apply: 'named_header';
    };
```

`redacted` 只能是脱敏摘要，例如 `ghp_...abcd` 或 `sha256:<hash-prefix>`。不得返回完整 secret 给 audit logger。

## V1 Auth 类型

| auth.type | V1 行为 |
| --- | --- |
| `none` | 返回 `{ type: 'none' }` |
| `api_key` | 从 `auth.env` 读取，按 `auth.placement` 应用 |
| `oauth2` | manifest 可声明，但 executor 不实现；返回 unsupported auth error |

## Placement 规则

| placement | 行为 | 备注 |
| --- | --- | --- |
| `bearer` | `Authorization: Bearer <secret>` | 默认推荐 |
| `header` | `auth.header` 指定 header | header name 必须允许 |
| `query` | 不支持 | 避免 URL、日志、代理泄露 |
| `body` | 不支持 | 后续必须 ADR |

Header name 禁止：

- `host`
- `content-length`
- `connection`
- `transfer-encoding`
- `cookie`

## Env Provider

V1 只实现 env provider。

要求：

- env var 缺失返回 `SecretMissingError`。
- env var 为空字符串视为缺失。
- env var 名称必须来自 manifest，不接受 input 覆盖。
- 错误消息可以包含 env var 名称，但不得包含 env var 值。

## Dry-run 行为

默认 dry-run 不读取 secret 原值。它只验证 auth 配置结构，并输出：

```json
{
  "auth": {
    "type": "api_key",
    "provider": "github",
    "source": "env",
    "env": "GITHUB_TOKEN",
    "placement": "bearer",
    "resolved": false
  }
}
```

后续如果需要 `--check-secrets`，必须明确命名，只检查存在性，不输出原值。

## 审计字段

Audit log 可以记录：

- auth type
- provider
- env var name
- placement
- credential resolved yes/no
- redaction method
- secret missing error category

Audit log 不能记录：

- secret value
- Authorization header value
- cookie value
- full token prefix beyond approved redaction policy

## 测试要求

- `deny` 不调用 Secret Resolver。
- `confirmation_required` 不调用 Secret Resolver。
- dry-run 默认不读取 env var value。
- env 缺失返回结构化错误且不泄露 secret。
- bearer placement 只在 executor 内部生成 Authorization header。
- query placement 被 schema 或 resolver 拒绝。
- MCP input 中出现 `token` 字段不会被当作 credential。
- audit log 只含 env var 名称和 redacted summary。

## 后续扩展

- macOS Keychain provider。
- 1Password/Bitwarden/Vault provider。
- OAuth token store。
- Credential presence check。
- Credential rotation metadata。

所有扩展都必须保持同一个 Runtime pipeline，不得绕过 policy、consent 和 audit。
