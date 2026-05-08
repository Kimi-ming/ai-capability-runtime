# 输入数据治理 V1

本文定义 OpenCap 如何治理模型、Host 或用户传入 Capability 的 tool arguments，防止敏感数据被错误外发给下游 provider。

## 核心判断

Tool input 不是天然可信的“用户意图”。它可能由模型生成、由 Host 自动填充、由用户粘贴，或由上一步工具结果派生。即使 input schema 校验通过，也只能说明结构合法，不能说明数据适合外发。

OpenCap V1 将 tool input 视为 untrusted data，必须经过：

```text
schema validation
  -> input classification
  -> data minimization
  -> egress policy
  -> policy/confirmation
  -> secret resolution
  -> execution
```

## V1 治理目标

- 防止 secret/token/password 经普通 input 外发。
- 防止 PII、客户数据、代码片段、内部链接被静默发送到外部 provider。
- 让用户确认时看到“哪些数据类别会发给哪个 provider”。
- 让 audit 记录 input hash、redacted summary、egress evidence，而不是原文。
- 支持未来组织级 data policy。

## Input Trust Levels

| Level | 含义 | 默认处理 |
| --- | --- | --- |
| `user_supplied` | 用户显式提供 | 校验 + 分类 |
| `model_generated` | 模型从对话推断/生成 | 校验 + 分类 + 更保守提示 |
| `tool_derived` | 来自上一步工具结果 | 保留 provenance，分类 |
| `runtime_generated` | Runtime 生成，例如 invocation id | 可直接使用 |
| `secret_reference` | manifest 声明的 credential reference | 不进入普通 input |

## Sensitive Input Classes

初始分类：

- `secret_like`：token、password、cookie、private key、authorization header。
- `pii`：邮箱、手机号、地址、身份证件、账号标识。
- `customer_data`：客户名称、工单、合同、交易、CRM 数据。
- `source_code`：源码、diff、stack trace、配置文件。
- `internal_url`：内网 URL、localhost、metadata service、私有域名。
- `financial_data`：付款、账单、银行卡、发票、交易金额。
- `health_data`：健康、病历、保险等高敏数据。
- `free_text_unknown`：未分类大段自由文本。

## Runtime 行为

Runtime 至少要生成：

```ts
type InputGovernanceSummaryV1 = {
  inputHash: string;
  source: "user_supplied" | "model_generated" | "tool_derived" | "runtime_generated";
  detectedClasses: string[];
  redactedPreview: Record<string, unknown>;
  egressTarget: string;
  egressDecision: "allow" | "ask" | "deny";
  policyRuleId?: string;
};
```

## 与 Confirmation 的关系

Confirmation summary 必须包含：

- capability id。
- provider/origin。
- resource/action。
- risk。
- input classes。
- redacted preview。
- 是否包含 free text unknown。

用户确认的是“这次外发”，不是把同类数据永久授权给所有 provider。

## 非目标

- V1 不做完整 DLP 产品。
- V1 不承诺识别所有 PII 或商业敏感信息。
- V1 不默认上传 input 到云端分类器。
- V1 不让模型自行决定哪些数据可外发。

## 关联任务

- T234：input classification。
- T236：data egress gate。
- T238：confirmation summary includes data classes。
