# Manifest 演进策略

本文定义 Capability Manifest 如何从 V1 演进到后续版本，避免 schema 变化破坏生态。

## V1 状态

V1 manifest 是 HTTP-only：

```yaml
type: http
```

V1 支持：

- JSON Schema input/output。
- api_key/none/oauth2 声明。
- api_key placement。
- permissions。
- HTTP execution url/body/headers/query/timeout。
- metadata trust level。

## Schema 版本

当前 schema 使用 `$id`：

```text
https://opencap.dev/schema/manifest.schema.json
```

进入稳定阶段后建议增加显式 schema version：

```yaml
schema_version: 1
```

V1 早期不强制，避免打断当前示例。

## 演进规则

向后兼容：

- 新增可选字段。
- 新增 metadata 字段。
- 新增 trust level 但保留旧值。
- 新增 execution 子字段且默认不改变行为。

破坏性：

- 必填字段新增。
- 字段类型变化。
- 删除字段。
- 改变默认 policy 或 auth 语义。

## 新 Capability Type

新增 `mcp`、`local`、`openapi` 等类型必须走 RFC。

RFC 必须回答：

- 执行边界。
- 权限模型。
- Secret 处理。
- Audit 字段。
- Sandbox 或 outbound policy。
- MCP 映射。

## Migration Tooling

未来可加入：

```bash
opencap manifest migrate --from 1 --to 2 manifest.yml
```

V1 先不实现。

## Registry Policy

Registry 接受 manifest schema 变化时：

- 新 schema 先进入 experimental。
- CI 同时支持旧 schema 和新 schema 一个过渡期。
- Capability PR 必须声明 schema 版本。
