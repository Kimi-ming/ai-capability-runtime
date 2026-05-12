# 数据分类 V1

本文定义 OpenCap V1 的本地数据分类规则，用于输入治理、确认摘要、审计和未来组织级 data policy。

## 分类目标

OpenCap 的分类器不是合规 DLP 系统，而是 Runtime 执行前的安全信号。它要帮助 policy 和用户判断：这次 tool call 会把什么类型的数据发给谁。

## 分类方式

V1 使用三类信号：

| 信号 | 来源 | 示例 |
| --- | --- | --- |
| field name heuristic | input JSON path | `token`, `password`, `email`, `ssn` |
| value pattern heuristic | 字符串模式 | API key、JWT、email、phone、URL |
| manifest data hints | RFC 0007 草案 | `x-opencap-data-class` |

## 初始规则

### DC001 Secret-like

命中字段名或值模式：

- `token`, `api_key`, `apikey`, `secret`, `password`, `cookie`, `authorization`。
- JWT-like string。
- PEM private key markers。
- GitHub token-like prefix。

默认：deny 或 require explicit confirmation，且不得进入 auth placement。

### DC002 PII

命中：

- email。
- phone-like string。
- address-like large text，V1 可只 warning。
- government id-like pattern，V1 可只 warning。

默认：ask。

### DC003 Internal URL

命中：

- localhost。
- private IP。
- link-local。
- metadata service。
- `.internal`、`.local` 或配置的私有域。

默认：deny 或 outbound policy block。

### DC004 Source Code / Config

命中：

- stack trace。
- diff markers。
- `.env` style lines。
- config keys with secret-like names。

默认：ask；如果含 secret-like，deny/redact。

### DC005 Free Text Unknown

大段自由文本超过阈值且不能分类。

默认：ask for write/external_send/third-party provider。


## Manifest Data Class Hint

RFC 0007 定义 `x-opencap-data-class` 作为 input JSON Schema 的可选扩展，用于声明字段可能包含的数据类别。

示例：

```yaml
body:
  type: string
  x-opencap-data-class:
    - source_code
    - pii
```

边界：

- Hint 是透明度信号，不是授权信号。
- Hint 可以新增 data class，不能删除 classifier finding。
- Hint 与 classifier 冲突时取并集，并采用更严格 action。
- Hint 不能把 `secret_like`、`internal_url`、`source_code` 或 `pii` 降级为普通字段。
- 旧 Runtime 可以忽略该扩展；未来 Runtime 支持后应把 hint 来源写入 classification evidence。

## 分类结果

```ts
type DataClassificationFindingV1 = {
  path: string;
  dataClass: string;
  confidence: "low" | "medium" | "high";
  action: "allow" | "ask" | "deny" | "redact";
  reason: string;
};
```

## Runtime 实现状态

当前 `@opencap/runtime` 导出 `classifyInput(input)`，返回：

- `findings`：字段级 path、dataClass、confidence、action、reason。
- `dataClasses`：本次 input 命中的聚合数据类别。
- `redactedPreview`：可用于确认摘要和审计预览的脱敏结构。

已实现的 V1 heuristic 覆盖：

- secret-like field/value：token、api_key、authorization、JWT、GitHub token、private key。
- pii：email、phone-like string。
- internal_url：localhost、private IPv4、link-local metadata、`.local`、`.internal`。
- source_code/config：diff、stack trace、`.env`/config secret assignment。
- financial_data：基础账号/卡号样式。
- free_text_unknown：超过阈值且未命中其他分类的大段自由文本。

这不是合规 DLP；它是 Runtime pre-secret gate 的安全信号。

可复用测试夹具位于 `packages/runtime/fixtures/input-classification/`，覆盖 secret-like、PII、internal URL、source/config 和 large free text unknown。

## Redaction Preview

确认和 audit 只能展示 redacted preview：

```json
{
  "title": "Bug in login flow",
  "body": "[redacted:source_code,secret_like]",
  "email": "u***@example.com"
}
```

## 测试要求

- token-like field -> secret_like。
- email -> pii。
- localhost/private IP URL -> internal_url。
- `.env` text -> source_code + secret_like。
- large unknown text -> free_text_unknown。

## 关联任务

- T234：classification engine。
- T235：classification fixtures。
- T239：audit egress evidence。
- T246：manifest data class hint RFC，见 `../../rfcs/0007-manifest-data-class-hint-v1.md`。
