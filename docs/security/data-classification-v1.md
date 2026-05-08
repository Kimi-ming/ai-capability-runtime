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
| manifest data hints | manifest schema extension/future | `x-opencap-data-class` |

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
