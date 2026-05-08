# 架构决策 0008：HTTP 请求体与 API key 放置方式

日期：2026-05-07

状态：已接受

## 背景

`github.create_issue` 需要 POST JSON body，也需要 GitHub token。原始 manifest 只有 method/url/timeout，Runtime 无法知道 body 怎么生成，也无法安全地猜测 token 应该放在 header 还是 query。

## 决策

V1 HTTP Capability 使用：

```yaml
execution:
  body:
    type: json
    fields: {}
```

声明 JSON request body。

V1 `api_key` 必须显式声明 placement：

```yaml
auth:
  type: api_key
  env: GITHUB_TOKEN
  placement:
    type: bearer
```

或：

```yaml
placement:
  type: header
  name: X-API-Key
```

V1 不支持 query token。

## 影响

- schema 需要允许 `execution.body` 和 `auth.placement`。
- HTTP executor 需要实现 JSON body 渲染。
- GitHub demo manifest 要更新。
- secret 不得进入 resolved URL、日志或 MCP result。
