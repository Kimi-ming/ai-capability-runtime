# 错误模型 V1

本文定义 OpenCap V1 的错误分类、exit code、MCP 映射和日志要求。

## 设计目标

- 用户错误可读。
- 内部错误可诊断。
- CLI、Runtime、MCP 使用同一套错误分类。
- 错误不会泄露 secret。
- 失败调用仍然可审计。

## 错误分类

| 错误 | 含义 | CLI exit | MCP 映射 |
| --- | --- | --- | --- |
| `UserInputError` | 命令参数、文件路径、输入 JSON 错误 | 1 | tool result error |
| `ManifestValidationError` | manifest 不符合 schema | 1 | tool result error |
| `CapabilityNotFoundError` | 找不到 capability | 1 | invalid params / tool error |
| `CapabilityConflictError` | id 或 tool name 冲突 | 1 | server startup fail |
| `PolicyDeniedError` | policy deny | 1 | structured denied |
| `ConfirmationRequiredError` | 需要确认但不可用 | 1 | structured confirmation_required |
| `SecretMissingError` | env secret 缺失 | 1 | tool result error |
| `OutboundBlockedError` | outbound policy 阻断 | 1 | tool result error |
| `ExecutionError` | 下游 HTTP 失败或 timeout | 1 | tool result error |
| `AuditUnavailableError` | 审计不可用且阻断执行 | 1 | tool result error |
| `InternalError` | bug 或未预期异常 | 2 | JSON-RPC internal error |

## Error Shape

内部结构：

```ts
interface OpenCapError {
  code: string;
  message: string;
  details?: unknown;
  cause?: unknown;
  exitCode: 1 | 2;
  safeForUser: boolean;
}
```

`message` 必须可展示给用户。`details` 写入前必须脱敏。

## CLI 输出

默认：

```text
Error: Manifest validation failed
  file: registry/.../manifest.yml
  path: /execution/body/type
  reason: must be equal to one of the allowed values
```

`--json`：

```json
{
  "error": {
    "code": "ManifestValidationError",
    "message": "Manifest validation failed",
    "details": []
  }
}
```

## Audit Log

失败也必须写审计日志。至少记录：

- error code。
- safe message。
- status。
- capability id，如已知。
- policy decision，如已发生。

## 安全要求

- 错误消息不得包含 token、Authorization header、cookie。
- 下游 HTTP response body 只记录脱敏摘要。
- InternalError 默认不输出 stack trace，debug 模式可以输出到 stderr。
