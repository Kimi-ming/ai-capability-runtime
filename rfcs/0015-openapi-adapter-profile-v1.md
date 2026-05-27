# RFC 0015：OpenAPI Adapter Profile V1

## 状态

草案

## 摘要

OpenAPI Adapter Profile V1 定义 OpenCap 未来如何把 OpenAPI operation 转换为 Capability Manifest draft，并保持 OpenCap 的治理边界。该 profile 不是 V1 已实现能力，不会把 OpenAPI 文档自动暴露成 MCP tools，也不会绕过 Runtime validation、policy、confirmation、secret、outbound、audit 和 Result Envelope。

核心原则：OpenAPI 描述 HTTP API，OpenCap 治理 AI 可调用能力。adapter 只能生成候选 Capability，最终仍需要人工选择、权限收敛、风险评审、manifest validation、registry review 和 Runtime 执行。

## 背景

OpenAPI 适合描述 HTTP API 的 paths、operations、parameters、requestBody、responses、servers 和 security schemes。OpenCap V1 的 Capability Manifest 更窄：它只描述一个 AI 可调用能力、输入输出 schema、权限、风险、认证引用和执行模板。

两者关系不是一比一自动导入：

```text
OpenAPI document
  -> selected operation
  -> Capability Manifest draft
  -> human review
  -> validation / package lint / least-privilege lint
  -> registry PR
  -> install
  -> Runtime invocation
```

参考版本：

- OpenAPI Specification v3.2.0：<https://spec.openapis.org/oas/v3.2.0.html>
- OpenAPI Specification v3.1.2：<https://spec.openapis.org/oas/v3.1.2.html>

## Profile 标识

```text
opencap.openapi.adapter.v1
```

该 profile 只定义 future adapter 的生成边界和 review 规则。它不表示：

- OpenCap V1 已实现 OpenAPI adapter。
- OpenAPI document 中的所有 operation 都可以自动成为 Capability。
- OpenAPI description、examples、servers 或 securitySchemes 是安全事实。
- adapter 生成的 draft 可以绕过 Registry review、policy、audit 或 conformance。

## 目标

- 定义 OpenAPI operation 到 Capability Manifest draft 的最小映射。
- 明确必须人工选择 operation，禁止整份文档自动暴露给 Host。
- 明确权限、风险、auth、server 和 schema 映射的安全边界。
- 保持 Runtime HTTP-only 主路径不变。
- 为未来 CLI 或 SDK adapter 提供 review-ready draft 生成规则。

## 非目标

- 不实现 adapter 代码。
- 不支持自动安装或自动授权。
- 不支持把 OpenAPI 文档直接投影成 MCP `tools/list`。
- 不做 OAuth 授权流生成。
- 不做 OpenAPI mocking、contract testing 或 API gateway。
- 不支持任意本地命令、非 HTTP transport 或 streaming operation。

## 术语

| 术语 | 定义 |
| --- | --- |
| OpenAPI document | 一个 `openapi` 规范文件，包含 paths、operations、components、servers 和 security 等信息。 |
| Operation | 一个 HTTP method + path 下的 API 操作，例如 `POST /repos/{owner}/{repo}/issues`。 |
| Capability Manifest draft | adapter 生成、尚未 review-ready 的 `manifest.yml` 草案。 |
| Operation selection | 人类或维护者明确选择一个或少量 operation 进入 draft 生成。 |
| Review-ready | 通过 manifest schema、package shape、model-visible metadata、least-privilege/risk、secret hygiene 和 registry tests 的状态。 |

## 设计

### 输入

adapter 输入必须至少包含：

```yaml
openapi_document: ./openapi.yml
operation:
  method: POST
  path: /repos/{owner}/{repo}/issues
capability:
  id: github.create_issue
  category: developer-tools
review:
  provider: github
  risk: write
  confirmation: ask
```

不允许只传入整份 OpenAPI document 并自动生成所有 Capability。

### Operation 选择

V1 profile 要求人工选择 operation。adapter 可以提供候选列表，但必须默认不生成、不安装、不暴露：

- 缺少 operationId 的 operation 可以显示为候选，但不能自动生成 stable id。
- `deprecated: true` 的 operation 默认隐藏，除非 reviewer 显式包含。
- 需要 cookie、implicit OAuth、mutual TLS 或未支持 security scheme 的 operation 只能生成 blocked draft。
- request/response schema 过大或包含 unsupported JSON Schema 关键字时，必须生成 review warning。

### Manifest 映射

| Capability Manifest 字段 | OpenAPI 来源 | 规则 |
| --- | --- | --- |
| `id` | reviewer input / operationId hint | 必须符合 OpenCap id 规则，不能完全由 OpenAPI description 生成。 |
| `name` | operation summary / reviewer input | 需要 model-visible metadata lint。 |
| `description` | operation summary/description | 只能作为候选文本，必须经过 lint 和 reviewer 确认。 |
| `type` | profile fixed | V1 固定为 `http`。 |
| `metadata.provider` | reviewer input / server host hint | 必须可审查，不能只信任 server URL。 |
| `input` | parameters + requestBody schema | 只生成支持的 JSON Schema 子集。 |
| `output` | selected response schema | 默认选择 2xx JSON response；复杂响应保守生成 object。 |
| `permissions` | reviewer input + method/risk hints | adapter 只能建议，最终由 reviewer 固定。 |
| `auth` | securitySchemes hint | 只生成 env reference，不生成 secret value。 |
| `execution.method` | operation method | 仅支持 HTTP method。 |
| `execution.url` | selected server + path | 必须固定 HTTPS origin；arbitrary URL 需要显式 risk。 |

### Schema 子集

adapter V1 draft 只应生成 OpenCap 当前 manifest schema 能表达的 JSON Schema 子集：

- `type`
- `properties`
- `required`
- `items`
- `enum`
- `description`，仅作为 candidate text

遇到以下内容必须生成 warning 或 blocked draft：

- polymorphism：`oneOf`、`anyOf`、`allOf`、`discriminator`
- recursive schema
- binary/file upload
- multipart form
- callbacks/webhooks
- links
- cookie parameters
- non-HTTPS server

### Server 映射

OpenAPI `servers` 不能被无条件信任：

- 默认只接受 reviewer 选择的 HTTPS server。
- server variables 必须在 draft 中被固定或转成 explicit input。
- localhost、private IP、link-local、metadata service 和 non-HTTPS server 必须产生 outbound warning 或 blocked draft。
- 运行时仍必须执行 outbound policy；adapter 不能替代 Runtime gate。

### Security Scheme 映射

adapter 只能生成 credential reference：

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
  placement:
    type: bearer
```

禁止：

- 从 OpenAPI examples、description 或 vendor extension 中读取 token。
- 生成 query/body secret placement。
- 把 OpenAPI OAuth client secret、refresh token 或 user token 写入 manifest。
- 把 MCP client token 透传给下游 API。

### 权限和风险

adapter 可以基于 method 和 path 给出风险候选：

| HTTP method | 默认风险候选 |
| --- | --- |
| GET / HEAD | `read_only` |
| POST / PUT / PATCH | `write` |
| DELETE | `destructive` |

该映射只是 review hint，不能自动授权。涉及支付、转账、采购、删除、权限变更、消息发送、外部发布或数据外发时，reviewer 必须显式设置更高风险和 confirmation。

### 生成状态

adapter 输出的 package 默认状态是 `draft`：

```text
draft -> linted -> review-ready -> listed
```

进入 `review-ready` 前必须通过：

- manifest schema validation
- package shape lint
- model-visible metadata lint
- least-privilege/risk lint
- secret hygiene lint
- registry tests
- dry-run preview review

### Runtime 边界

adapter 不进入 Runtime invocation pipeline。生成后的 Capability 即使来自 OpenAPI，也必须按普通 HTTP Capability 执行：

```text
validate input
  -> classify/minimize input
  -> data egress gate
  -> quota/budget/rate gates
  -> policy
  -> confirmation
  -> secret resolver
  -> HTTP executor
  -> output validation
  -> sanitizer/redaction
  -> Result Envelope
  -> audit/usage evidence
```

## 示例

输入 operation 选择：

```yaml
openapi_document: ./github-openapi.yml
operation:
  method: POST
  path: /repos/{owner}/{repo}/issues
capability:
  id: github.create_issue
  category: developer-tools
review:
  provider: github
  risk: write
  confirmation: ask
```

生成 draft：

```yaml
id: github.create_issue
version: 0.1.0
name: Create GitHub Issue
description: Create an issue in a selected GitHub repository.
type: http
metadata:
  provider: github
  network_access: fixed_https_origin
  risk_summary: Creates GitHub issues through a fixed GitHub API origin.
input:
  type: object
  required:
    - owner
    - repo
    - title
  properties:
    owner:
      type: string
    repo:
      type: string
    title:
      type: string
    body:
      type: string
permissions:
  - resource: github.issue
    action: create
    risk: write
    confirmation: ask
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
  placement:
    type: bearer
  scopes:
    - issues:write
execution:
  method: POST
  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues
  timeout_ms: 10000
```

该示例不包含真实 token、私有 URL、用户数据、生产日志或 provider raw response。

## 安全和隐私

- 不改变 policy、confirmation、audit、secret resolver、outbound policy 或 data egress 边界。
- 新增模型可见文本只来自 draft manifest，必须经过 model-visible metadata lint 和 reviewer 确认。
- OpenAPI descriptions、examples、operationId、servers、securitySchemes 和 vendor extensions 都是不可信输入。
- 被拒绝、阻塞、未确认和失败路径仍由 Runtime 记录 audit/evidence。
- adapter 不保存 raw input/output、secret、token、provider response 或私有日志。
- adapter 不从 OpenAPI examples 中提取 credential。

## 兼容性和迁移

- 不改变当前 manifest schema。
- 不改变 public package exports。
- 不改变 CLI output、MCP tool/result shape、Registry layout 或 audit schema。
- 未来 adapter CLI 应以 feature flag 或独立 command 暴露，例如 `opencap adapter openapi draft`。
- 生成的 draft 必须标记 profile id：`opencap.openapi.adapter.v1`。
- 旧 Runtime 可以忽略 adapter profile metadata，因为执行仍是普通 `type: http` Capability。

## 验证计划

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
pnpm validate
```

## 发布和运维

- 本 RFC 合并后只作为 future profile，不进入 alpha release completed feature。
- `packages/adapters/openapi/README.md` 必须继续标明 adapter 未实现。
- 若未来实现 adapter，release notes 必须说明生成 draft 不等于安装、授权或 Host 暴露。
- 安全 review 应优先检查 OpenAPI description/schema poisoning、server trust、auth placement 和 risk downscoping。

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
| 整份 OpenAPI document 自动暴露为 MCP tools | 会把未评审 operation、描述文本和 server trust 直接暴露给模型，违背 OpenCap 治理边界。 |
| 只支持手写 manifest，不做 adapter | 安全但降低 API 迁移效率；adapter draft 可以帮助维护者起步，但不能替代 review。 |
| adapter 直接安装 Capability | 安装会让 draft 看起来已通过治理，必须保留人工 review 和 registry PR。 |

## 开放问题

- 首个实现应支持 OpenAPI 3.1.x、3.2.x，还是按 profile 分版本。
- 是否需要单独的 OpenAPI schema subset lint package。
- 是否需要为 generated draft 增加 `generated_from.openapi` metadata。
- 是否要在 Registry PR template 中加入 OpenAPI adapter draft 自查项。

## 决策结果

评审结束后填写：

- 结论：
- 接受/拒绝日期：
- 后续 ADR：
- 后续任务：
