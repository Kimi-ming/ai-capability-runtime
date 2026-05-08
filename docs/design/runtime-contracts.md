# Runtime 契约

本文定义 OpenCap Runtime 各模块的输入、输出和边界。实现时应把这些契约看作模块之间的稳定接口。

## Runtime 总入口

### `invokeCapability(request)`

输入：`InvocationRequest`。

输出：`InvocationResult`。

职责：串联完整调用生命周期。

必须保证：

- 输入校验失败也写审计日志。
- `deny` 不进入 Secret Resolver 和 Executor。
- `ask` 被拒绝或无法确认时不执行。
- dry-run 不发外部请求。
- 所有返回给 MCP 的错误都结构化。

## 模块契约

### Capability Loader

输入：state dir 或 capability path。

输出：`InstalledCapability[]` 或单个 `InstalledCapability`。

失败：manifest 缺失、解析失败、schema 失败、id/path 不一致。

边界：只读本地状态，不做策略判断。

### Input Validator

输入：manifest input schema、raw input。

输出：validated input 或 structured validation error。

边界：不修正业务语义，只校验结构和基础类型。

### Policy Engine

输入：

- capability id
- permissions
- risk summary
- channel
- host
- input metadata

输出：`PolicyDecision`。

边界：只决策，不交互、不执行、不读密钥。

### Confirmation Handler

输入：`ConfirmationRequest`、channel、host capabilities。

输出：`ConfirmationResult`。

V1 行为：

- CLI interactive：可用终端确认。
- CLI non-interactive：返回 confirmation required。
- MCP V1：返回 `confirmation_required` tool result，不依赖 elicitation。
- MCP elicitation future：只有在 profile/RFC 接受后，才能作为确认通道。

边界：不改变 policy 决策，只解析用户是否同意本次调用。

### Secret Resolver

输入：manifest auth、environment、execution target。

输出：resolved credential handle 或 executor-private header fragment。

边界：

- 不把 secret 原文交给 Audit Logger。
- 不把 MCP client token 透传给下游 API。
- V1 只支持 manifest 声明的 env API key/token。
- dry-run 默认不读取 secret 原值。

### HTTP Executor

输入：validated input、execution config、resolved secret、dry-run flag。

输出：`ExecutionResult`。

必须：

- 渲染 URL 模板。
- 支持 timeout。
- 支持 method 和 JSON body。
- 记录 resolved URL。
- 对错误进行归一化。

禁止：

- 绕过 policy。
- 接受任意未声明 secret。
- 默认访问内网地址而无风险标记。

### Audit Logger

输入：调用上下文、policy decision、confirmation result、execution result 或 error。

输出：写入成功或失败。

V1 存储：SQLite。

必须：

- 成功、失败、拒绝、阻塞都写日志。
- 写入前脱敏。
- 写入 input hash。
- 不写 secret 原文。

## 调用生命周期细化

| 步骤 | 输入 | 输出 | 失败时 |
| --- | --- | --- | --- |
| 1. load capability | id/path | manifest | 写 audit，返回 load error |
| 2. validate input | schema/input | validated input | 写 audit，返回 validation error |
| 3. build plan | manifest/input | invocation plan | 写 audit，返回 planning error |
| 4. evaluate policy | plan/policy | decision | 写 audit，默认 ask 或返回 policy error |
| 5. confirm | decision ask | confirmation result | 写 audit，不执行 |
| 6. resolve secrets | auth/env | credential handle | 写 audit，不执行 |
| 7. execute/dry-run | plan/credential | execution result | 写 audit，返回 execution error |
| 8. normalize output | raw output | normalized output | 写 audit，返回 normalize error |
| 9. validate output | normalized output/schema | validated output | 写 audit，返回 output validation error |
| 10. sanitize result | validated output/error body | sanitized result | 写 audit，返回 sanitized summary |
| 11. build result envelope | outcome/evidence/output | Result Envelope | 写 audit，返回 envelope error |
| 12. audit | all context | log row | 返回主结果并警告 audit failure |

## 错误分类

| 类型 | exit code / MCP 表现 | 示例 |
| --- | --- | --- |
| UserInputError | CLI exit 1 / tool isError | 参数缺失、manifest 不合法 |
| PolicyDenied | CLI exit 1 / structured denial | policy decision deny |
| ConfirmationRequired | CLI exit 1 / `confirmation_required` | MCP Host 不支持确认 |
| ExecutionError | CLI exit 1 / tool isError | HTTP 401、timeout |
| InternalError | CLI exit 2 / protocol error | SQLite 打不开、bug |

## MCP 返回契约

V1 MCP tool call 应由 Result Envelope 适配为结构化结果：

```json
{
  "status": "confirmation_required",
  "capability_id": "github.create_issue",
  "risk": "write",
  "message": "This capability requires human confirmation before execution."
}
```

成功时返回：

```json
{
  "status": "success",
  "capability_id": "github.create_issue",
  "output": {
    "issue_url": "https://github.com/...",
    "issue_number": 123
  }
}
```

为兼容 MCP 客户端，结构化结果之外可以同时提供简短 text content，但 text 不应成为唯一机器可读结果。
