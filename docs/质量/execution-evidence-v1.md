# 执行证据 V1

本文定义 OpenCap 如何用审计日志和测试证据证明一次真实世界调用发生了什么。

## 目标

Execution evidence 要回答：

- 请求是否真的发出。
- 发给了哪个 provider 和 origin。
- 是否使用了凭据，凭据是否被脱敏。
- 外部服务返回了什么状态。
- 是否发生 retry。
- 是否存在未知结果或部分成功。
- 用户是否确认过。

## Evidence 层级

| 层级 | 证据 | 例子 |
| --- | --- | --- |
| Selection evidence | Host/model 从候选工具集合中选择了什么 | selected tool、projection hash、available tools hash |
| Plan evidence | Runtime 准备执行什么 | method、url template、risk |
| Policy evidence | 为什么允许/拒绝/询问 | policy rule id、decision |
| Consent evidence | 谁确认了什么 | consent receipt、input hash |
| Secret evidence | 使用了哪个 credential reference | env name、provider、redacted |
| Request evidence | 请求是否发出 | request_started_at、origin |
| Response evidence | provider 响应 | status code、request id |
| Outcome evidence | OpenCap 如何解释结果 | success/blocked/unknown/partial |
| Output evidence | 输出如何被验证、净化和限流 | schema status、redaction、sanitizer warnings、size limit |
| Result provenance | 模型看到的结果来自哪里 | content digest、taint labels、transformations |

## 最小字段

```ts
type SelectionEvidenceV1 = {
  profile: "mcp-tools-v1";
  host?: string;
  availableToolsHash: string;
  availableToolsCount: number;
  selectedToolName: string;
  selectedCapabilityId: string;
  selectedToolProjectionHash: string;
  selectionReasonSource?: "host_optional" | "runtime_inferred" | "unknown";
  selectionReasonRedacted?: string;
};

type ExecutionEvidenceV1 = {
  invocationId: string;
  capabilityId: string;
  selection?: SelectionEvidenceV1;
  inputHash: string;
  risk: string;
  policyDecision: string;
  consentDecision?: string;
  credentialRef?: string;
  requestStarted: boolean;
  targetOrigin?: string;
  httpMethod?: string;
  httpStatus?: number;
  providerRequestId?: string;
  retryAttempt: number;
  outcome: string;
  outputValidationStatus?: string;
  resultContentDigest?: string;
  resultProvenance?: {
    contentDigest: string;
    transformations: string[];
    taint: Record<string, string[]>;
  };
  sanitizerWarnings?: string[];
  resultSizeLimit?: {
    maxTextLength?: number;
    maxStructuredBytes?: number;
    truncated: boolean;
    truncatedPaths: string[];
  };
};
```

## 授权边界

Selection evidence 只用于审计和调试。它不能：

- 修改 Runtime policy decision。
- 把 `ask` 改成 `allow`。
- 跳过 human confirmation。
- 证明某个 Capability 已被用户授权。
- 让未安装 Capability 进入执行路径。

如果 selection evidence 缺失，Runtime 仍必须按 policy/confirmation 执行；如果 selection evidence 存在，也不能降低任何治理要求。

## 不记录

- secret 原文
- Authorization header value
- full URL query 中的敏感数据
- full request body，除非后续明确开启并脱敏
- provider response 中的敏感字段
- provider raw output 原文，除非后续明确开启并脱敏
- 超过 size limit 的完整 provider output 原文

## Conformance 映射

| Conformance | Evidence |
| --- | --- |
| C-RUN | requestStarted、outcome |
| C-CON | consentDecision、inputHash |
| C-AUD | all evidence written |
| C-HTTP | targetOrigin、httpMethod、httpStatus |
| C-SEC | no secret values |
| C-RES | result envelope, output validation, sanitizer, provenance |

## 测试要求

- blocked 调用 requestStarted 为 false。
- dry-run requestStarted 为 false。
- successful HTTP 调用有 response evidence。
- timeout after request outcome 为 unknown。
- retry attempt 大于 0 时记录 resend count。
- evidence 不包含 secret-like 字段。
- success result 有 output validation status。
- model-visible summary 和 structuredContent 有 content digest 或 provenance summary。
- result provenance 使用 provider_untrusted/runtime_generated/secret_redacted/sanitized_text taint labels。
- oversized structured/text result 记录 `CONTENT_TRUNCATED`，并能从 evidence 看出发生截断或替换。
- size limit 不影响 secret redaction finding 和 result provenance digest。
- selection evidence 包含 selected tool、selected projection hash 和 available tools hash，并明确不参与授权。

## 关联任务

- T040-T042：audit log。
- T152：consent receipt。
- T168：unknown outcome audit tests。
- T173：execution evidence conformance record。
