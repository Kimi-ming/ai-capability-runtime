# RFC 0010：MCP Elicitation Profile V1

## 状态

草案

## 摘要

MCP Elicitation Profile V1 定义 OpenCap 未来如何把 Runtime-owned `ConsentRequest` 映射到 MCP `elicitation/create`，同时保持 policy、egress、secret resolution 和 audit 的顺序不变。

核心原则：elicitation 是确认通道，不是授权来源；Host 支持 elicitation 不能把 `ask` 改成 `allow`，也不能让模型或 Host 文案替代 Runtime 生成的 consent summary。

## 背景

OpenCap V1 当前在 MCP STDIO 通道中遇到 policy `ask` 时返回 `confirmation_required`。这是安全默认值：没有确认通道时，不解析 secret、不执行 HTTP、写入 blocked/confirmation audit。

MCP 2025-11-25 规格已定义 client-side elicitation。客户端在初始化时声明 `elicitation` 能力，服务端可以发送 `elicitation/create`。规格区分两种模式：

- `form`：在 MCP client 内收集结构化用户输入。
- `url`：把用户带到外部 URL 完成敏感交互，数据不经 MCP client。

官方规格还明确要求 form mode 不能用于收集密码、API key、access token、支付凭据等敏感信息；敏感交互应使用 URL mode。OpenCap 需要把这些协议能力纳入治理边界，而不是把它们当成绕过 consent 的捷径。

参考资料：<https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation>

## Profile 标识

```text
opencap.mcp.elicitation.v1
```

该 profile 只表示 OpenCap MCP adapter 可以通过支持 elicitation 的 Host 完成一次 Runtime-owned consent flow。它不表示：

- Host 可以直接批准 Capability。
- Host 可以采集或传递下游 provider secret。
- Host 可以跳过 policy、data egress、outbound policy、secret resolver 或 audit。
- OpenCap V1 已经实现该 adapter。

## 能力协商

OpenCap MCP adapter 只能在 Host 初始化声明支持 elicitation 后启用该 profile。

最低要求：

```json
{
  "capabilities": {
    "elicitation": {
      "form": {}
    }
  }
}
```

兼容要求：

- Host 未声明 `elicitation` 时，保持现有 `confirmation_required` 结果。
- Host 只声明 legacy 空对象 `elicitation: {}` 时，按 form mode 处理。
- Host 只声明 URL mode 时，OpenCap 不能用它完成普通操作确认；仍返回 `confirmation_required`，除非未来独立 RFC 定义第三方授权 URL flow。
- Server 不得发送 Host 未声明支持的 mode。

## Runtime 映射

当 policy 或 gate 返回 `ask` 时，Runtime 先生成 `ConsentRequest`：

```text
tool call input
  -> manifest input validation
  -> input classification
  -> data egress gate
  -> policy/gate decision ask
  -> Runtime-generated ConsentRequest
```

MCP adapter 只把这个 `ConsentRequest` 映射成 Host form：

```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "elicitation/create",
  "params": {
    "mode": "form",
    "message": "OpenCap needs your confirmation before running github.create_issue.",
    "requestedSchema": {
      "type": "object",
      "properties": {
        "confirm": {
          "type": "boolean",
          "title": "Confirm this OpenCap action",
          "description": "Approve this single invocation after reviewing the operation, risk, target origin, data classes, and fields sent.",
          "default": false
        }
      },
      "required": ["confirm"]
    }
  }
}
```

OpenCap 不通过 form mode 请求额外业务参数。工具输入已经来自原始 `tools/call` 参数；elicitation 只用于确认这一次 invocation。

## Consent 语义

Host 返回：

```json
{
  "action": "accept",
  "content": {
    "confirm": true
  }
}
```

OpenCap 处理规则：

| Host action / content | Runtime consent decision | 执行行为 |
| --- | --- | --- |
| `accept` + `confirm: true` | `approved` | 继续 secret resolution 和 execution |
| `accept` + `confirm: false` | `rejected` | 不解析 secret，不执行 |
| `decline` | `rejected` | 不解析 secret，不执行 |
| `cancel` | `unavailable` | 不解析 secret，不执行 |
| timeout / protocol error | `unavailable` 或 `expired` | 不解析 secret，不执行 |
| schema mismatch | `unavailable` | 不解析 secret，不执行 |

`approved` 只对当前 `requestId`、`consentId`、`inputHash` 和 policy decision 生效。重试、不同输入、不同 policy revision、不同 capability version 或 expired consent 都必须重新确认。

## 展示内容

Host 表单必须让用户能看到 Runtime 生成的摘要。OpenCap adapter 不要求 Host 使用固定 UI，但请求内容必须来源于 Runtime，而不是模型自由文本。

摘要字段至少包含：

- capability id 和 human-readable action summary。
- permissions/risk summary。
- policy reason 或 matched rule id。
- target origin。
- data classes。
- fields sent。
- redacted preview。
- consent expiry 或 single-use 提示。

不得包含：

- secret value、Authorization header、API key、access token、password。
- provider raw output。
- 未脱敏的 input 原文。
- 让用户把凭据粘贴进表单的指令。

## URL Mode 边界

`opencap.mcp.elicitation.v1` 不使用 URL mode 完成普通 consent。URL mode 只适合未来这些独立 profile：

- 第三方 OAuth 授权。
- 外部 vault/secret provider 绑定。
- 付款、账单或合规签署。

URL mode 未来启用前必须另写 RFC，并满足：

- URL 必须是 HTTPS，且不携带 secret、PII、pre-authenticated token 或完整输入。
- Runtime 必须把 `elicitationId` 绑定到本地 user/session/request。
- URL completion 不能自动执行原 invocation；必须重新检查 policy、input hash、expiry 和 audit preflight。
- 不能把 Host/client bearer token 当成第三方 provider token。

## 安全不变量

- Elicitation 前不得解析 secret。
- Elicitation 前不得执行 HTTP。
- 用户拒绝、取消、超时、schema mismatch 或 Host 不支持时都要写 audit。
- Host 支持 elicitation 不能降低 Runtime policy、outbound policy、data egress gate、quota/budget gate、financial consent gate 或 lifecycle gate。
- Form mode 不能采集 password、API key、access token、payment credential 或下游 OAuth code。
- Consent receipt 必须记录 channel `mcp`、decision、decidedAt、input hash、policy rule id 和 Host capability evidence。
- Model-visible tool description 不能告诉用户绕过 confirmation。

## Result 映射

确认通过后，adapter 继续调用 Runtime pipeline，并把 Result Envelope 映射为 MCP tool result。

确认未通过或不可用时，返回结构化 `confirmation_required` 或 rejected result：

```json
{
  "isError": true,
  "structuredContent": {
    "error": {
      "code": "CONFIRMATION_REQUIRED"
    },
    "metadata": {
      "capabilityId": "github.create_issue",
      "policyDecision": "ask",
      "consentDecision": "unavailable",
      "retry": {
        "token": null
      }
    }
  }
}
```

OpenCap V1 仍不生成 confirmation token。Future adapter 可以用 `consentId` 作为内部 correlation id，但不得把它当成可复用授权令牌暴露给 Host。

## Evidence

兼容性记录应新增：

```yaml
profile: opencap.mcp.elicitation.v1
host: claude-desktop
host_version: <version>
opencap_commit: <git-sha>
test_date: 2026-05-14
result: pass | fail | pending-smoke | not-supported
elicitation:
  client_capability_declared: pass
  form_mode_confirm_true: pass
  form_mode_confirm_false: pass
  decline: pass
  cancel_or_timeout: pass
  no_secret_in_form: pass
  audit_receipt: pass
known_gaps:
  - URL mode not covered.
```

Evidence 不得保存 form response 原文以外的敏感数据。`confirm: true/false` 可以记录；其他字段只能记录 hash、schema id、decision 和脱敏摘要。

## 测试计划

实现该 profile 时至少新增：

- MCP adapter capability negotiation tests。
- Host without elicitation keeps current `confirmation_required` behavior。
- Form confirm true creates approved consent receipt and continues execution.
- Form confirm false/decline/cancel/timeout does not resolve secret and does not execute.
- Form schema excludes secret-like fields.
- Consent is bound to request id、input hash、capability identity 和 policy revision。
- Audit records approved/rejected/unavailable/expired decisions.
- Host compatibility manual smoke record for each target Host.

## 非目标

- 不在当前 V1 立即实现 MCP elicitation adapter。
- 不实现 URL mode OAuth、payment 或 secret binding。
- 不定义远程 Runtime 身份/session 模型。
- 不让 Host confirmation 替代本地 policy。
- 不让模型生成 consent 文案。
- 不支持 multi-step workflow 级一次性 consent。

## 迁移路径

1. 保持当前无 elicitation Host 的 `confirmation_required` 行为。
2. 在 MCP adapter 内记录 client capabilities。
3. 增加 Runtime `ConsentRequest` 到 MCP form 的纯映射 helper。
4. 增加 response validation 和 consent receipt mapping。
5. 增加 Host compatibility evidence records。
6. 只在至少一个真实 Host smoke 通过后，把某个 Host/profile 从 `pending-smoke` 升级。

## 开放问题

- T070 接入的 MCP TypeScript SDK 是否已暴露 2025-11-25 elicitation API。
- Claude Desktop、Cursor 和 Claude Code 分别何时声明 form/url mode。
- URL mode 是否应归入 T163 Remote Runtime OAuth profile，而不是本 RFC。
- 是否需要组织 policy 禁用 Host elicitation，只允许 CLI/Console consent。
