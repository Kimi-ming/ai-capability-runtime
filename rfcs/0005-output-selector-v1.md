# RFC 0005：Output Selector V1

## 状态

草案

## 摘要

Output Selector V1 定义 OpenCap 如何把 provider raw JSON body 投影成 manifest `output` schema 声明的结构化结果。

核心原则：selector 只做字段投影，不做授权、不读 secret、不执行脚本、不替代 output schema validation。

## 背景

许多 provider API 返回的 JSON 比 Capability 需要暴露给 AI Host 的结果更大、更杂，也可能包含不应进入模型上下文的字段。例如 GitHub 创建 issue 的响应包含大量 repository、user、links 和权限上下文，而 Capability 可能只承诺返回：

```yaml
output:
  type: object
  required:
    - issue_url
    - issue_number
  properties:
    issue_url:
      type: string
    issue_number:
      type: number
```

如果 Runtime 直接把 raw normalized JSON 当成 output，会带来几个问题：

- output schema 很容易 mismatch。
- provider raw body 的无关字段进入 Result Envelope，增加上下文成本。
- secret-like 或 prompt-surface 字段需要更多 sanitizer 工作。
- Capability 作者无法稳定声明“模型能看到什么”。

Output Selector 的目标是给 Capability 作者一个可审计、受限、可测试的字段映射机制。

## 术语

- **Provider body**：HTTP response body 解析后的 JSON 值，不包含 response headers、request input、env、secret resolver、audit log 或 Runtime 内部状态。
- **Selector**：从 provider body 读取一个值的受限路径表达式。
- **Output mapping**：manifest 中从 output field 到 selector 的映射。
- **Candidate output**：selector 投影后的对象，还未完成 sanitizer 和 output schema validation。
- **Required output field**：manifest `output.required` 中声明必须存在的字段。

## Manifest 草案

V1 推荐字段名为 `output_mapping`。字段位于 Capability manifest 顶层，和 `output` schema 并列。

```yaml
output_mapping:
  issue_url:
    from: "$.html_url"
  issue_number:
    from: "$.number"
```

为了降低 authoring 成本，Registry lint 可以接受短写，并归一化成上面的形式：

```yaml
output_mapping:
  issue_url: "$.html_url"
  issue_number: "$.number"
```

V1 不支持 transform、coerce、join、template 或脚本。类型修正应由 provider adapter 或后续 RFC 明确定义，不能塞进 selector 表达式。

## Selector 语法

V1 使用 OpenCap selector subset，不是完整 JSONPath。允许：

| 语法 | 含义 | 示例 |
| --- | --- | --- |
| `$` | provider body root | `$` |
| `.field` | 读取简单字段名 | `$.html_url` |
| `['field-name']` | 读取包含连字符等字符的字段 | `$['issue-url']` |
| `[0]` | 读取固定数组下标 | `$.items[0].id` |

禁止：

- recursive descent：`..`
- wildcard：`*`
- filter/script：`[?()]`、`[(...)]`
- function：`length()`、`min()` 等
- union/slice：`[0,1]`、`[0:5]`
- 从 headers、request input、env、secret、audit 或 Runtime context 读取任何值

禁止复杂表达式是为了让 selector 可静态审查、可缓存、可解释，也避免把 Capability manifest 变成脚本执行环境。

## 执行流水线

```text
HTTP response
  -> response size guard
  -> content-type handling
  -> JSON parse / normalize
  -> output selector projection
  -> secret redaction and prompt-surface sanitization
  -> result size limit
  -> manifest output schema validation
  -> Result Envelope evidence
  -> MCP/CLI adapter
```

如果没有声明 `output_mapping`，Runtime 可以沿用当前行为：把 normalized JSON 作为 candidate output，然后继续执行 sanitizer、size limit 和 output schema validation。

## 安全边界

Selector 的输入域只有 provider body。以下内容不可被 selector 读取：

- request input
- request/response headers
- Authorization/Cookie/API key
- env var value
- Secret Resolver 返回值
- audit event
- policy decision trace
- local state path 或 Runtime config

Registry lint 和 Runtime preflight 都必须拒绝明显 secret-like selector path。例如 path segment 或 output field 命中以下片段时，应要求人工审查或直接失败：

```text
token
secret
password
api_key
authorization
cookie
credential
private_key
refresh_token
```

即使 selector 通过 lint，Runtime sanitizer 仍必须作为防御层执行 secret redaction。selector 不能用来绕过 redaction、Result Envelope、policy、confirmation 或 audit。

## 缺失字段语义

对每个 `output_mapping` 字段：

| 情况 | V1 行为 |
| --- | --- |
| selector 命中值 | 写入 candidate output |
| selector 未命中且字段是 optional | 省略该字段 |
| selector 未命中且字段在 `output.required` 中 | 返回 failed Result Envelope |
| selector 命中 `null` 且 schema 允许 null | 写入 `null` |
| selector 命中 `null` 但 schema 不允许 null | 进入 output schema validation failure |
| selector 语法非法 | manifest validation 或 Runtime preflight 失败 |
| selector 指向 secret-like path | manifest validation、lint 或 Runtime preflight 失败 |

缺失 required 字段建议使用结构化错误：

```json
{
  "error": {
    "code": "OUTPUT_SELECTOR_MISSING_REQUIRED",
    "message": "Output selector did not produce required field.",
    "field": "issue_url",
    "selector": "$.html_url"
  }
}
```

最终 Result Envelope status 必须是 `failed`，不能标记为 `success`。

## Output Schema Validation

Selector 输出只是 candidate output，不是最终结果。Runtime 必须继续执行 manifest `output` schema validation。

```text
provider body
  -> selector
  -> candidate output
  -> sanitizer/redaction
  -> output schema validation
  -> success or failed envelope
```

如果 selector 产出的字段类型不符合 schema，例如 `issue_number` 产出 string 但 schema 要求 number，必须返回 `OUTPUT_SCHEMA_INVALID`，不能静默 coerce。

## Evidence

Result Envelope evidence 应记录 selector 的脱敏摘要，避免调试时只能看到 schema error。

建议字段：

```ts
type OutputSelectorEvidenceV1 = {
  profile: "opencap.output_selector.v1";
  mappingHash: string;
  selectedFields: string[];
  missingRequiredFields: string[];
  deniedSelectors: string[];
};
```

要求：

- `mappingHash` 基于 canonicalized mapping，不包含 provider value。
- `selectedFields` 只记录 output field name，不记录原始 value。
- `missingRequiredFields` 记录字段名和可选 selector path，但不记录 provider raw body。
- `deniedSelectors` 记录被拒绝的 path 摘要，不记录 secret value。

## Authoring 示例

GitHub create issue：

```yaml
id: github.create_issue
output:
  type: object
  required:
    - issue_url
    - issue_number
  properties:
    issue_url:
      type: string
    issue_number:
      type: number

output_mapping:
  issue_url:
    from: "$.html_url"
  issue_number:
    from: "$.number"
```

Provider 返回：

```json
{
  "html_url": "https://github.com/opencap/runtime/issues/1",
  "number": 1,
  "token": "provider-secret"
}
```

Candidate output：

```json
{
  "issue_url": "https://github.com/opencap/runtime/issues/1",
  "issue_number": 1
}
```

`token` 不会被 selector 读取。若 Capability 尝试声明 `leaked_token: "$.token"`，lint/preflight 必须拒绝或要求安全审查，且 Runtime redaction 仍会作为防御层。

## 非目标

- 不支持完整 JSONPath。
- 不支持 JavaScript、jq、JMESPath 或任意表达式执行。
- 不支持读取 headers、request input、env 或 audit。
- 不支持 transform/coerce/template。
- 不支持将一个 selector 展开为多个 output items。
- 不定义 OpenAPI adapter 自动生成 selector 的规则；那属于后续 adapter RFC。

## 迁移和兼容性

`output_mapping` 是新增可选字段。未声明时，现有 manifest 行为不变。

一旦 schema 接入该字段，需要同步：

- `packages/spec/schema/manifest.schema.json`
- manifest validator tests
- Capability authoring guide
- Registry review checklist
- Runtime output selector tests
- Result Envelope evidence tests

## 待解决问题

- 是否允许 selector 读取数组并保留整个数组，而不是固定下标。
- 是否需要 `default`，以及 default 是否会掩盖 provider contract drift。
- 对 secret-like path 是硬失败，还是允许 verified/official capability 经过人工审查后例外。
- 是否需要 selector conformance fixtures，覆盖 missing required、secret path、invalid syntax 和 type mismatch。
