# RFC 0007：Manifest Data Class Hint V1

## 状态

草案

## 摘要

Manifest Data Class Hint V1 定义 Capability Manifest input schema 中的 `x-opencap-data-class` 扩展字段，让能力作者可以显式声明某个输入字段可能包含的数据类别。

核心原则：hint 是给 Runtime、reviewer 和未来 lint 的透明度信号，不是授权信号。Hint 可以增加分类结果或提高 review 可见性，但不能降低 classifier 已发现的风险，也不能让 secret、内部 URL、源码或 PII 静默外发。

## 背景

OpenCap V1 已有本地 input classifier，能够基于字段名和值模式识别 `secret_like`、`pii`、`internal_url`、`source_code`、`financial_data` 和 `free_text_unknown`。但纯 heuristic 有两个限制：

- 某些字段在样例输入中看起来无害，但生产输入可能包含敏感数据。
- Maintainer review 需要知道能力作者对字段数据性质的预期，而不是只靠 README 描述。

例如 `body`、`message`、`payload`、`notes` 这类字段在 schema 里只是 `string`，但实际可能包含客户数据、日志、源码或自由文本。Manifest hint 可以把这种预期写进机器可读 schema，供 review、lint、dry-run preview 和未来组织策略使用。

## 目标

- 让能力作者在 input schema 中声明字段的数据类别预期。
- 让 reviewer 更容易发现“字段语义”和“外发目标”之间的风险。
- 为未来 schema lint、Capability Review Checklist、Trust Card 和组织级 data policy 预留稳定语义。
- 保持 JSON Schema 兼容：不支持该扩展的工具仍可忽略它。

## 非目标

- 不用 hint 替代 Runtime input classifier。
- 不允许 hint 降低或覆盖 classifier finding。
- 不把 hint 当成用户授权、组织策略或 DLP 扫描结果。
- 不在本 RFC 中实现完整组织 DLP 或远程分类 provider。
- 不扩展 output schema；V1 只讨论 input schema。

## Schema 扩展

推荐字段：

```yaml
input:
  type: object
  required:
    - title
    - body
  properties:
    title:
      type: string
      x-opencap-data-class:
        - free_text_unknown
    body:
      type: string
      x-opencap-data-class:
        - source_code
        - pii
```

`x-opencap-data-class` 可以出现在 input JSON Schema 的字段节点上。推荐值为字符串数组；为了作者体验，工具可以接受单个字符串并规范化为数组。

允许的数据类别沿用 V1 classifier：

```text
secret_like
pii
source_code
internal_url
financial_data
free_text_unknown
```

未来新增 data class 必须走 Manifest 演进规则，至少更新 schema、文档、lint 和兼容性说明。

## 合并语义

Runtime 未来支持 hint 时，应把 hint 与 classifier finding 合并为同一份字段级分类结果。

合并规则：

1. Classifier finding 永远保留。
2. Hint finding 只能新增 data class，不能删除 classifier finding。
3. 当 hint 和 classifier 对同一路径给出不同 data class 时，结果取并集。
4. 当 action 严重程度冲突时，取更严格动作：`allow < ask < redact < deny`。
5. 当 confidence 冲突时，classifier 的 high-confidence finding 不得被 hint 降级。
6. Hint 不得把 `secret_like`、`internal_url`、`source_code`、`pii` 改成 `free_text_unknown` 或普通字段。

示例：

```json
{
  "path": "/body",
  "classifier": ["secret_like", "source_code"],
  "hint": ["free_text_unknown"],
  "effective": ["free_text_unknown", "secret_like", "source_code"],
  "decisionImpact": "secret_like still wins"
}
```

这意味着 hint 可以让 review 更保守，但不能让执行更宽松。

## Review 语义

Capability reviewer 应检查：

- 高风险字段是否有合理 hint，例如 `body`、`message`、`payload`、`sql`、`code`、`url`。
- Hint 是否和 README、权限、风险等级、execution mapping 一致。
- 外发到 `external_send`、第三方 API 或任意 URL 的字段是否声明了可能的数据类别。
- 是否存在明显误导性 hint，例如字段名是 `api_key` 但声明为 `free_text_unknown`。
- 是否存在过宽 hint，例如所有字段都声明 `secret_like` 导致体验不可用但没有说明原因。

Review 结论不应只看 hint。真实执行仍必须基于 runtime classification、data egress policy、confirmation 和 audit。

## Lint 建议

未来 lint 可以生成 warning 或 error：

| 情况 | 建议级别 | 说明 |
| --- | --- | --- |
| `body/message/payload` 外发但无 hint | warning | 需要 reviewer 判断是否为自由文本或敏感数据 |
| 字段名包含 `token/password/secret` 但 hint 不含 `secret_like` | error | hint 不能降低明显 secret 风险 |
| URL 字段外发但 hint 不含 `internal_url` 或说明 | warning | 内部 URL 泄露风险 |
| `external_send` 能力含大段文本字段但无 hint | warning | 用户确认摘要可能缺上下文 |
| hint 使用未知 data class | error | schema/compatibility 不明确 |

## Evidence 草案

未来 Result Envelope 或 audit evidence 可以记录 hint 来源，但不得记录字段原文：

```ts
type DataClassificationFindingV1 = {
  path: string;
  dataClass: string;
  confidence: "low" | "medium" | "high";
  action: "allow" | "ask" | "deny" | "redact";
  reason: string;
  source?: "classifier" | "manifest_hint" | "organization_policy";
};
```

V1 当前实现还没有 `source` 字段。本 RFC 只定义未来兼容方向。

## 兼容策略

`x-opencap-data-class` 是 JSON Schema extension keyword。标准 JSON Schema validator 会忽略未知关键字，因此：

- 旧版 OpenCap runtime 可以忽略该字段，Manifest 仍然可读。
- 新版 OpenCap runtime 可以把它纳入 classification evidence。
- Registry lint 可以先以 warning 方式引入，再逐步提高要求。
- 该字段不要求立即提升 manifest schema major version；一旦变成必填或改变执行决策，则必须走 manifest version 迁移。
- Host、MCP tool schema 和模型可见 schema 默认不需要暴露该扩展，除非后续 Tool Projection RFC 明确允许。

## 安全边界

- Hint 不是 permission。
- Hint 不是 consent。
- Hint 不是 policy override。
- Hint 不是 DLP 证明。
- Hint 不能绕过 redaction、data egress policy、outbound policy、secret resolver 边界或 audit。

如果 hint 与 classifier 冲突，Runtime 必须保留更严格结果，并在 future lint/review 中暴露冲突。

## 实现任务

后续可拆分：

- Manifest schema 接受 `x-opencap-data-class`。
- Spec validator 对未知 data class 报错。
- Runtime classifier 合并 manifest hint。
- Capability Review Checklist 增加 hint 审查项。
- Trust Card 展示 declared data classes 和 runtime observed data classes。
- Registry CI 对 high-risk free-text 字段缺少 hint 给 warning。

## 关联文档

- `docs/安全/data-classification-v1.md`
- `docs/设计/data-egress-policy-v1.md`
- `docs/规范/capability-manifest.md`
- `docs/规范/manifest-evolution.md`
