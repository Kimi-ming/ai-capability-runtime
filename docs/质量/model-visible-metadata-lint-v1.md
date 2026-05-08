# 模型可见元数据检查 V1

本文定义 OpenCap 对工具描述、schema 描述和未来发现元数据的 lint 规则。

## 目标

- 防止 prompt injection 文案进入 tools/list。
- 防止 schema poisoning 诱导模型填入敏感数据。
- 保持工具描述短、准确、可审计。
- 让 Registry review 有机器可执行的第一道门。

## 检查范围

| 字段 | V1 是否检查 |
| --- | --- |
| manifest `name` | 是 |
| manifest `description` | 是 |
| input schema property `description` | 是 |
| output schema property `description` | 是 |
| README | 人工 review，不进入 V1 projection |
| examples | 人工 review |
| future registry tags | 是 |

## 严重级别

| 级别 | 处理 |
| --- | --- |
| error | validate/registry CI 失败，不进入 projection |
| warning | CI 可通过，但 Trust Card 标记 review warning |
| info | 仅给维护者优化建议 |

## Error Rules

### MVM001 Instruction Override

匹配：

- `ignore previous instructions`
- `ignore system instructions`
- `disregard developer instructions`
- `不要遵守之前的指令`
- `忽略系统指令`

处理：error。

### MVM002 Forced Tool Choice

匹配：

- `always call this tool`
- `must call this before answering`
- `优先调用此工具`
- `回答前必须调用`

处理：error。

### MVM003 Bypass Governance

匹配：

- `do not ask for confirmation`
- `skip approval`
- `skip audit`
- `绕过确认`
- `不要记录日志`

处理：error。

### MVM004 Secret Exfiltration

匹配：

- 要求填入 token、cookie、secret、private key、password。
- 要求把凭据发送到非声明 provider。

处理：error。

### MVM005 Hidden or Obfuscated Text

匹配：

- HTML comment。
- Markdown link title 中隐藏指令。
- 零宽字符。
- base64/hex payload 被描述成模型应解码的指令。

处理：error。

### MVM006 Misleading Execution Claim

字段描述与 `execution.method`、`execution.url`、permissions 或 risk 不一致。

处理：error 或人工 review block。

## Warning Rules

- 描述超过 240 字符。
- 使用营销词但没有明确资源/action。
- 缺少 provider/resource/action 信息。
- 使用“安全”“官方”“已验证”等词但无 trust evidence。
- 多语言混杂导致语义不清。

## 输出格式

```json
{
  "ok": false,
  "findings": [
    {
      "severity": "error",
      "rule": "MVM001",
      "path": "description",
      "message": "model-visible description contains instruction override text"
    }
  ]
}
```

## 测试夹具

必须维护：

- clean description fixture。
- description injection fixture。
- input schema poisoning fixture。
- hidden unicode fixture。
- misleading risk fixture。

## 关联任务

- T210：实现 lint。
- T211：negative tests。
- T216：接入 Capability Review Checklist。
