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
  sourceResultDigest?: string;
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
      "path": "/body",
      "destination": "body",
      "dataClasses": ["free_text_unknown"],
      "redacted": false
    },
    {
      "path": "/labels",
      "destination": "body",
      "dataClasses": [],
      "redacted": false
    }
  ]
}
```

当前 `@opencap/runtime` 导出 `buildFieldLevelEgressMap(manifest, input, classification)`。V1 会从 HTTP manifest 的 `execution.url` 模板和 `execution.body.fields` 中提取被渲染的 input 字段：

- URL path/template 字段标记为 `url`。
- URL query 模板字段标记为 `query`。
- JSON body mapping 字段标记为 `body`。
- 未被 URL/body 引用的 input 字段不会进入 map。
- 每个字段会携带来自 input classification 的 `dataClasses` 和 `redacted` 状态。

Egress map 不记录字段值，只记录 JSON Pointer path、destination、data classes 和 redaction 状态。

## 不记录

- input 原文。
- secret-like value。
- 完整自由文本。
- 未脱敏的 URL query。

## Runtime 实现状态

当前 `@opencap/runtime` 导出：

```ts
createInputProvenanceEvidence(input)
```

当前实现可以表达：

- `user_supplied`。
- `model_generated`。
- `tool_derived`。
- `runtime_generated`。

`createInputProvenanceEvidence` 会从 raw input 计算 `inputHash`，但返回的 evidence 不保存 raw input。`tool_derived` 可以记录 `derivedFromInvocationId` 和 `sourceResultDigest`；如果传入 `sourceResult`，Runtime 只计算 digest，不保存 source result 原文。`transformations` 会派生 `redactionApplied` 和 `minimizationApplied`。`AuditEvent.inputProvenance` 会被 SQLite logger 持久化为 `input_provenance_json`，查询时恢复为结构化对象。

## 与 Audit 的关系

Audit log 已有 input hash 和 redacted input。Input provenance 是 audit 的扩展 evidence，不是新的授权来源。

## Conformance

- denied egress requestStarted 为 false。
- egress evidence 包含 target origin。
- secret_like 不进入 redacted preview 原文。
- tool_derived input 记录 derivedFromInvocationId。
- tool_derived input 记录 sourceResultDigest，不记录 source result 原文。
- derived input 仍需重新分类并重新经过 egress policy。
- redaction/minimization 记录 transformation。

## 关联任务

- T239：input provenance audit evidence。
- T240：field-level egress map。
- T241：derived input evidence chain。
