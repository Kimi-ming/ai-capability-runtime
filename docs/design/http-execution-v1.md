# HTTP 执行设计 V1

本文定义 `type: http` Capability 在 V1 中如何渲染请求、处理认证、执行 dry-run、归一化输出和接受 outbound policy 约束。

## 设计目标

- 支持 GitHub issue demo 这类真实 POST JSON API。
- 保持 manifest 简洁，不引入完整 OpenAPI。
- 密钥位置显式声明，避免 executor 猜测。
- 允许 dry-run 生成可审计的调用计划。
- 为 SSRF 和任意 URL 风险预留 outbound policy。

## Manifest 字段

```yaml
execution:
  method: POST
  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues
  body:
    type: json
    fields:
      title: "{{title}}"
      body: "{{body}}"
      labels: "{{labels}}"
  timeout_ms: 10000
```

## URL 模板规则

模板变量来自已通过 input schema 校验、input classification 和 data egress policy 的输入。

规则：

- `{{field}}` 引用顶层 input 字段。
- URL 模板变量必须 URL encode。
- 缺少变量时调用失败。
- URL 渲染后必须通过 outbound policy 检查。

## Body 模板规则

V1 只支持 JSON body：

```yaml
body:
  type: json
  fields:
    key: "{{input_field}}"
```

渲染规则：

- 只有 execution mapping 显式引用的 input 字段会被渲染和外发。
- 值完全等于 `{{field}}` 时，保留原始 JSON 类型。
- 字符串中包含 `{{field}}` 但不是完整变量时，按字符串插值处理。
- 可选字段缺失且 body value 完全等于该变量时，省略该字段。
- 必填字段缺失时，在输入校验阶段失败。
- object/array 可以作为完整变量被保留。

示例：

```yaml
labels: "{{labels}}"
```

如果 input 中 `labels` 是数组，则输出 JSON body 中 `labels` 仍是数组。

## Query 和 Headers

V1 支持静态 headers 和 query 模板，但要谨慎使用：

```yaml
execution:
  headers:
    Accept: application/vnd.github+json
  query:
    per_page: "{{per_page}}"
```

约束：

- Authorization 头由 `auth.placement` 生成，不放在 `execution.headers` 中。
- secret 不允许通过 query string 传递，除非后续 ADR 明确放开。
- header value 中不得引用 secret。

## Auth Placement

V1 `api_key` 必须显式声明 placement：

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
  placement:
    type: bearer
```

支持：

```yaml
placement:
  type: bearer
```

生成：

```text
Authorization: Bearer <env value>
```

或：

```yaml
placement:
  type: header
  name: X-API-Key
```

生成：

```text
X-API-Key: <env value>
```

V1 不支持 query token。这样做是为了避免 token 出现在 URL、日志、代理和浏览器历史中。

## Dry-run

`--dry-run` 不发送外部请求，但必须生成 invocation plan：

- method
- resolved_url
- headers summary，不含 secret
- body preview，已脱敏
- risk summary
- policy decision
- confirmation status

Dry-run 仍然写 audit log，状态为 `dry_run`，并展示 redacted egress preview、fields sent 和 data classes。

## Output Normalization

HTTP executor 只负责生成 raw/normalized execution result。最终返回给 Host 前，必须进入 Result Envelope pipeline。

V1 输出规则：

- HTTP 2xx：尝试解析 JSON；失败则返回 text。
- HTTP 非 2xx：返回 `ExecutionError`，包含 status code 和脱敏响应摘要。
- 输出字段应尽量映射 manifest `output` schema；V1 可以先返回 raw normalized JSON，后续增加 output selector。
- 声明 output schema 时，structured output 必须通过校验后才能作为 success。
- provider raw text 不默认进入 MCP `content[].text`，由 Runtime 生成摘要。

## Outbound Policy Hook

Executor 执行前必须调用 outbound policy：

```text
resolved_url -> outbound policy -> allow/deny
```

至少检查：

- scheme 必须是 `https`，除非 localhost dev 明确允许。
- 禁止 private IP、loopback、link-local、metadata service。
- 如果 URL host 来自用户输入，默认需要 policy allow。
- redirect 后的最终 URL 也必须检查。

## 与任务对应

- T050：URL 模板渲染。
- T052：HTTP executor。
- T053：HTTP request body manifest 字段。
- T055：arbitrary URL Capability 风险。
- T091：outbound policy。
