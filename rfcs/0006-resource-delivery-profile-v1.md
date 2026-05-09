# RFC 0006：Resource Delivery Profile V1

## 状态

草案

## 摘要

Resource Delivery Profile V1 定义 OpenCap 未来如何投递大结果、resource links 和 embedded resources，同时保持 Result Envelope、权限策略、净化和审计边界。

核心原则：large result 默认 summary + handle；resource handle 不是授权；resource content 进入模型上下文前仍必须经过 sanitizer、size limit、policy 和 audit。

## 背景

当前 Result Envelope V1 优先通过 `structuredContent` 返回结构化结果，并用 Runtime-generated `content[].text` 作为兼容摘要。T225 已为 oversized result 加入截断和替换机制。

后续 OpenCap 可能遇到这些场景：

- provider 返回很大的 JSON 列表或日志片段。
- capability 需要返回文件、报告、图片、trace、CSV 或二进制内容。
- Host 支持 MCP resources/resource links，用户希望按需打开或读取某个结果。
- 企业环境希望把大结果留在本地 runtime 或组织存储中，只给模型最小摘要。

如果没有明确 profile，很容易出现两个风险：

- 把 resource URI 当成授权凭证，导致 handle 泄漏后可直接读取内容。
- 把未净化的大结果通过 resource 绕过 Result Envelope 的 sanitizer 和 audit。

Resource Delivery Profile V1 先定义边界和 evidence，不要求当前 V1 立即实现资源读取服务。

## 术语

- **Resource handle**：Runtime 生成的 opaque handle 或 URI，用来标识一次 invocation 产生的可读取资源。
- **Resource content**：handle 对应的实际内容，例如 JSON、text、CSV、image 或 binary。
- **Resource summary**：Runtime 生成的短摘要，可进入 `content[].text`。
- **Resource read**：Host、CLI 或未来 API 通过 handle 请求读取 resource content。
- **Embedded resource**：直接嵌入 tool result 的非文本/大块内容。

## Profile 标识

```text
opencap.resource_delivery.v1
```

Result Envelope evidence 可引用该 profile，表示本次结果没有直接投递完整内容，而是通过 summary + handle 暴露后续读取入口。

## 默认投递策略

| 结果类型 | 默认行为 | 说明 |
| --- | --- | --- |
| 小型结构化结果 | `structuredContent` + Runtime summary | 当前 Result Envelope V1 默认路径 |
| 超过 structured size limit 的 JSON | summary + handle，或当前 V1 fallback `[TRUNCATED_RESULT]` | 后续 profile 实现后优先 handle |
| 超长 text/log | summary + handle | 不把 provider raw text 直接放入 `content[].text` |
| file/report/csv | summary + handle | 读取时按 media type 重新检查 |
| image/audio/binary | 默认不嵌入 | 需要 explicit profile 和 Host 兼容性记录 |
| provider raw HTML | 默认不投递 | 只能作为 resource 存储并在读取时 sanitizer/strip |

V1 当前可以继续使用 `[TRUNCATED_RESULT]`。一旦实现 resource delivery，large result 的默认目标应变成：

```json
{
  "summary": "github.search_repo returned 500 items. Full result is available as an OpenCap resource handle.",
  "resource": {
    "handle": "opencap://invocations/inv_123/resources/res_456",
    "contentType": "application/json",
    "sizeBytes": 245901,
    "digest": "sha256:..."
  }
}
```

## Handle 不是授权

Resource handle 只能定位资源，不能表达读取许可。

读取 resource 时 Runtime 必须重新检查：

```text
resource handle lookup
  -> invocation/resource ownership check
  -> lifecycle/expiry check
  -> policy/resource read gate
  -> data classification and egress gate
  -> sanitizer/redaction
  -> size/media-type limit
  -> audit resource_read event
  -> deliver content or summary
```

要求：

- handle 泄漏不能绕过 policy。
- handle 不能替代 user confirmation。
- handle 不能扩大原 capability 的权限范围。
- handle 不能被别的 capability 当成 secret 或 provider credential 使用。
- revoked/yanked capability 产生的历史 resource 读取必须进入安全审查或默认 deny。
- resource read 必须写 audit，至少记录 invocation id、resource id、reader channel、decision、digest 和 redaction summary。

## Resource Handle 形状

推荐 URI：

```text
opencap://invocations/{invocationId}/resources/{resourceId}
```

推荐 metadata：

```ts
type ResourceHandleV1 = {
  profile: "opencap.resource_delivery.v1";
  handle: string;
  invocationId: string;
  resourceId: string;
  capabilityId: string;
  contentType: string;
  sizeBytes: number;
  digest: string;
  createdAt: string;
  expiresAt?: string;
  storage: "local_state" | "external_controlled";
  taint: string[];
};
```

Handle 可以是 URI，但不应该是可公开访问的 URL。若未来支持 remote/cloud storage，必须通过独立 profile 规定签名、过期、组织策略和访问日志。

## Resource Content Gate

Resource content 进入模型、Host 展示层、CLI stdout 或导出文件前，必须经过内容门禁。

| Gate | 要求 |
| --- | --- |
| Media type gate | 只允许声明且可处理的 media type |
| Size gate | 超过 limit 时继续 summary + range handle，不直接投递 |
| Secret redaction | token/cookie/password/private key 等不得原文输出 |
| Prompt-surface sanitizer | provider text、HTML、Markdown、log 中的指令性内容必须净化或摘要化 |
| Data egress gate | 读取或导出到外部 Host/Cloud 前检查 data class 和 egress target |
| Policy gate | resource read 是独立动作，不能自动继承 tool call allow |
| Audit gate | 读取成功、拒绝、截断、净化都要记录 evidence |

## Embedded Resource 边界

V1 不默认使用 embedded resources。未来启用前必须满足：

- Host compatibility record 明确该 Host 如何展示和传递 embedded resource。
- embedded content 已通过 sanitizer、media type 和 size gate。
- embedded resource 不包含 provider raw secret、private data 或未净化 HTML/script。
- 对 binary/image/audio 的模型可见解释必须来自 Runtime summary，不让模型自行解释未审查内容作为执行依据。

默认策略：大内容使用 handle，不使用 embedded resource。

## Evidence

Result Envelope evidence 建议加入：

```ts
type ResourceDeliveryEvidenceV1 = {
  profile: "opencap.resource_delivery.v1";
  strategy: "inline" | "summary_handle" | "blocked" | "truncated";
  resources: Array<{
    handle?: string;
    contentType: string;
    sizeBytes: number;
    digest?: string;
    taint: string[];
    sanitizerStatus: "not_needed" | "sanitized" | "blocked";
    readPolicyRequired: boolean;
  }>;
};
```

Evidence 不得包含完整 resource content、secret value、完整敏感 URL query 或 provider raw body。

## MCP 映射草案

当 Host 支持 resource links 时，MCP adapter 可以把 resource handle 映射为 resource link；否则保留在 `structuredContent.resource`，并用 `content[].text` 给短摘要。

```json
{
  "structuredContent": {
    "summary": "Large result available as OpenCap resource.",
    "resource": {
      "handle": "opencap://invocations/inv_123/resources/res_456",
      "contentType": "application/json",
      "sizeBytes": 245901,
      "digest": "sha256:..."
    }
  },
  "content": [
    {
      "type": "text",
      "text": "Large result available as OpenCap resource handle. Reading it requires a separate OpenCap resource read."
    }
  ]
}
```

Host 不支持 resources 时，不得退化为直接塞入完整 provider raw body。

## 非目标

- 不定义完整 MCP resource server 实现。
- 不定义 cloud object storage、signed URL 或 CDN 分发。
- 不定义二进制内容的模型解释能力。
- 不把 handle 当成 capability credential。
- 不允许 resource read 绕过 policy、egress、sanitizer 或 audit。

## 迁移和实现任务

引入该 profile 前，需要拆分后续任务：

- Resource handle schema 和 local state storage。
- Resource read policy gate。
- Resource read audit event。
- MCP resource link adapter。
- CLI `opencap resource read` 或等价命令。
- Host compatibility record。
- Large result summary + handle tests。

## 待解决问题

- Resource 默认保存 raw provider body、sanitized body，还是两者都保存但 raw 只供本地调试。
- Resource expiry 默认多久。
- 企业/团队策略是否允许禁用 resource persistence。
- Binary/image/audio 是否需要独立 taint label。
- Resource read 是否需要支持 partial range。
