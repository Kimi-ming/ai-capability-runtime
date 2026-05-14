# 确认与同意 V1：确认与同意模型

本文定义 OpenCap 如何在执行真实世界操作前取得用户同意，并把同意结果写入审计日志。它补充 Policy DSL、MCP 接口和 Audit Log 设计。

## 核心区分

Policy 决定“这类调用理论上如何处理”。Consent 决定“这一次调用是否被用户确认”。

```text
policy allow -> 可以继续执行
policy ask   -> 需要 consent
policy deny  -> 不能执行
```

Consent 不是 Host 文案，不是模型自然语言，也不是一次性的 UI 事件。它是 Runtime 拥有的、可审计的结构化对象。

## 设计原则

- 同意必须发生在 secret resolution 和 executor 之前。
- 同意摘要必须由 Runtime 根据 manifest、policy 和输入生成，不能只复用模型请求文本。
- 用户看到的是操作、资源、风险、外发数据和目标域名。
- 密钥原文不得展示，也不得写入 receipt。
- 所有拒绝、取消、过期和缺少确认通道的情况都要写审计日志。
- MCP STDIO 模式不做终端 prompt。

## Consent Request

V1 内部对象：

```ts
type ConsentRequest = {
  invocationId: string;
  capabilityId: string;
  capabilityName: string;
  risk: string;
  permissions: Array<{ resource: string; action: string; risk: string }>;
  operationSummary: string;
  inputSummary: Record<string, unknown>;
  inputHash: string;
  externalDomains: string[];
  dataSentClasses: string[];
  policyRuleId?: string;
  requestedAt: string;
  expiresAt?: string;
};
```

`operationSummary` 可以来自 manifest，但最终文本必须由 Runtime 组装。输入摘要需要按 `docs/安全/privacy-retention-v1.md` 脱敏。

## Egress Confirmation Summary

当一次调用涉及 Data Egress Gate，确认摘要必须包含 Runtime 生成的外发摘要：

```ts
type ConfirmationEgressSummary = {
  targetOrigin: string;
  dataClasses: string[];
  fields: Array<{
    path: string;
    destination: "url" | "query" | "header" | "body";
    dataClasses: string[];
  }>;
  redactedPreview: unknown;
};
```

当前 Runtime 导出 `confirmationSummaryFromDataEgress(decision)`，把 Data Egress decision evidence 转成 confirmation request 可用的 `egress` 字段。

CLI prompt 会展示：

- `Target origin`：例如 `https://slack.com`。
- `Data classes`：例如 `pii`、`source_code`。
- `Fields sent`：例如 `/text -> body [pii]`。
- `Preview`：只展示 redacted preview。

MCP STDIO 无确认通道时仍返回 `confirmation_required`，但 reason 会包含同一份 egress summary，便于 Host 或上层客户端展示，不会执行请求。

## Consent Receipt

V1 审计对象：

```ts
type ConsentReceipt = {
  invocationId: string;
  decision: 'approved_once' | 'approved_always' | 'declined' | 'expired' | 'unavailable';
  channel: 'cli' | 'mcp' | 'console' | 'api';
  subject: 'local_user' | 'unknown';
  inputHash: string;
  policyRuleId?: string;
  decidedAt: string;
};
```

`approved_always` 不应直接写成永久放行。它应该生成或更新本地 policy rule，并保留审计记录。

## V1 通道行为

| 通道 | ask 行为 | 说明 |
| --- | --- | --- |
| CLI direct | 可交互确认 | 仅当 stdin 是交互终端时允许 prompt |
| MCP STDIO | 返回 `confirmation_required` | 不在 STDOUT 打印 prompt |
| Console | Future | 可以提供确认 UI，但仍调用 Runtime API |
| API | Future | 需要独立身份和 session 设计 |

当前 Runtime 最小实现提供两个 handler：`CliConfirmationHandler` 用于 CLI 通道并支持注入 prompt，`McpNoElicitationConfirmationHandler` 用于 MCP STDIO 无确认能力场景并返回 `confirmation_required`。
`CliConfirmationHandler` 还支持 `assumeYes` 选项，对应未来 CLI `--yes`；该选项不适用于 MCP，且不会自动批准 destructive 或 financial ask。

当前 AuditEvent 已落入 consent receipt evidence 字段：`consentId`、`consentDecision`、`consentDecidedAt`、`consentChannel`、`consentSubject`、`consentInputHash` 和 `consentPolicyRuleId`。Runtime 只对 policy `ask` 生成 receipt；policy `allow` / `deny` 不伪造用户同意。MCP STDIO 无确认通道会把 receipt decision 记录为 `unavailable`，同时保留 `confirmation_required` 结果。

## MCP `confirmation_required` 结果

MCP Host 无确认通道时，Runtime 返回结构化结果：

```json
{
  "status": "confirmation_required",
  "capability_id": "github.create_issue",
  "risk": "write",
  "input_hash": "sha256:...",
  "message": "This capability requires human confirmation before execution."
}
```

这不是错误，也不是执行结果。它表示 Runtime 已安全停止。

## Future: MCP Elicitation

MCP 2025-11-25 提供 elicitation 能力后，OpenCap 可以把 Consent Request 映射为 Host 原生确认表单。草案见 `../../rfcs/0010-mcp-elicitation-profile-v1.md`。边界仍然不变：

- elicitation 返回后仍需 Runtime 校验。
- 不通过表单采集密钥或 OAuth 凭据。
- 用户拒绝或关闭表单必须写入 audit log。
- Host 支持 elicitation 不能让 policy 默认变成 allow。

## 测试要求

- ask 且无确认通道时返回 `confirmation_required`。
- `confirmation_required` 不解析 secret，不执行 HTTP。
- declined/expired/unavailable 都进入 audit log。
- confirmation request 包含 target origin。
- confirmation request 包含 data classes。
- confirmation request 包含 fields sent。
- consent summary 中不包含 secret。
- approved_once 只对当前 invocation 生效。
- approved_always 只通过 policy 文件更新表达。

## 关联文档

- `docs/设计/policy-dsl-v1.md`
- `docs/设计/mcp-interface-v1.md`
- `docs/设计/audit-log-v1.md`
- `docs/安全/privacy-retention-v1.md`
