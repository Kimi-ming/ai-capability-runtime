# 输入来源与外发证据 V1

本文定义 OpenCap 如何记录一次 tool input 的来源、分类、最小化和外发目标。

## 目标

Input provenance 要回答：

- input 是谁提供或生成的。
- input 是否来自模型、用户、上一步工具或 Runtime。
- 哪些字段会被发送到 URL/query/header/body。
- 哪些字段被分类为敏感数据。
- 哪些字段被 redacted/minimized。
- 为什么允许、询问或拒绝外发。

## Evidence 字段

```ts
type InputProvenanceV1 = {
  invocationId: string;
  capabilityId: string;
  inputHash: string;
  inputSource: "user_supplied" | "model_generated" | "tool_derived" | "runtime_generated";
  derivedFromInvocationId?: string;
  dataClasses: string[];
  redactionApplied: boolean;
  minimizationApplied: boolean;
  egressTargetOrigin: string;
  egressDecision: "allow" | "ask" | "deny" | "redact";
  policyRuleId?: string;
};
```

## Field-level Egress Map

```json
{
  "fields": [
    {
      "path": "body",
      "destination": "body",
      "data_classes": ["free_text_unknown"],
      "redacted": false
    },
    {
      "path": "labels",
      "destination": "body",
      "data_classes": [],
      "redacted": false
    }
  ]
}
```

## 不记录

- input 原文。
- secret-like value。
- 完整自由文本。
- 未脱敏的 URL query。

## 与 Audit 的关系

Audit log 已有 input hash 和 redacted input。Input provenance 是 audit 的扩展 evidence，不是新的授权来源。

## Conformance

- denied egress requestStarted 为 false。
- egress evidence 包含 target origin。
- secret_like 不进入 redacted preview 原文。
- tool_derived input 记录 derivedFromInvocationId。
- redaction/minimization 记录 transformation。

## 关联任务

- T239：input provenance audit evidence。
- T240：field-level egress map。
- T241：derived input evidence chain。
