# RFC 0008：Organization Data Policy V1

## 状态

草案

## 摘要

Organization Data Policy V1 定义未来团队或企业如何在 OpenCap 之上叠加组织级数据外发策略、provider allowlist 和可选 DLP provider profile，同时保持开源本地 Runtime 可以独立运行。

核心原则：组织策略是本地 Runtime 的可选增强，不是 V1 主路径前置条件；外部 DLP provider 默认不能接收 input 原文；任何组织级放宽都不能覆盖本地 hard deny、用户确认和审计边界。

## 背景

OpenCap V1 的默认模型是 local-first：用户或自托管环境在本地安装 Capability，Runtime 在执行前完成 input classification、field-level egress map、data egress policy、confirmation、secret resolution 和 audit。

企业使用场景会需要更细的治理：

- 只允许外发到批准过的 provider/origin。
- 按组织部门、仓库、项目或环境配置不同数据策略。
- 对 PII、源码、财务数据接入组织 DLP 或数据安全系统。
- 统一记录 policy bundle 版本、审批人、变更记录和审计证据。

这些能力不能把 OpenCap 变成强制 Cloud 平台，也不能让外部 DLP 服务默认获得完整 tool input。本 RFC 先定义边界和 profile，不要求 V1 当前实现。

## 目标

- 定义组织级 data egress policy 的层级和合并语义。
- 定义 provider allowlist / blocklist 的最小形状。
- 定义外部 DLP provider profile 的隐私边界。
- 保持 OSS 本地 Runtime 可独立运行。
- 为后续 policy bundle、签名、ledger 和 simulation 任务预留字段。

## 非目标

- 不实现 Cloud 控制台。
- 不定义完整企业身份、SCIM、SSO 或组织目录。
- 不要求 OSS Runtime 连接 OpenCap Cloud。
- 不把外部 DLP provider 变成默认执行步骤。
- 不允许外部 DLP 默认接收 input 原文。
- 不允许组织策略绕过用户确认、secret resolver 边界或 audit。

## Profile 标识

```text
opencap.organization_data_policy.v1
```

## 策略层级

推荐策略层级：

```text
Runtime built-in safety floor
  -> local user policy
  -> organization policy bundle
  -> capability-specific policy
  -> invocation-time confirmation
```

合并原则：

1. 内置 safety floor 不能被组织策略放宽。
2. 任一层返回 `deny` 时，最终结果必须是 `deny`，除非 future breakglass profile 明确允许并记录独立审计。
3. `ask` 不能被后续层静默降为 `allow`。
4. 本地用户策略可以比组织策略更严格。
5. 组织策略只能增加约束或要求额外确认，不能关闭 redaction、audit、secret boundary 或 outbound policy。

## 组织策略形状草案

```yaml
profile: opencap.organization_data_policy.v1
version: 0.1.0
organization: acme
bundle_id: acme-data-policy
bundle_version: 2026.05.12
mode: enforce

provider_policy:
  allowlist:
    - provider: github
      origins:
        - https://api.github.com
    - provider: slack
      origins:
        - https://slack.com
  blocklist:
    - origin: http://*
    - origin: https://*.unknown.example

data_egress:
  rules:
    - id: deny-source-to-slack
      match:
        data_class: source_code
        provider: slack
      decision: deny
    - id: ask-pii-to-approved-github
      match:
        data_class: pii
        provider: github
      decision: ask

dlp:
  enabled: false
```

`mode` 可选：

| mode | 含义 |
| --- | --- |
| `observe` | 只记录组织策略将如何决策，不阻断执行 |
| `warn` | 生成 warning，需要 confirmation 展示 |
| `enforce` | 参与最终 gate 决策 |

V1 future 默认应从 `observe` 或 `warn` 开始，避免一次引入就破坏本地开发体验。

## Provider Allowlist

Provider allowlist 用来约束外发目标。它不替代 outbound policy。

要求：

- Allowlist 匹配 provider 和 origin，origin 必须是规范化 `scheme://host[:port]`。
- Allowlist 不能允许 private IP、metadata service 或 non-HTTPS，除非本地 dev profile 明确启用。
- Capability manifest 的 `provider` 与实际 `targetOrigin` 不一致时，必须进入 deny 或 ask。
- Allowlist 不能绕过 arbitrary URL 风险标记。
- Redirect 后最终 origin 仍要重新检查。

## 外部 DLP Provider Profile

外部 DLP 是可选 profile，默认关闭。

默认行为：

```text
input classification result
  -> redacted/minimized evidence
  -> local policy decision
  -> optional DLP metadata call
```

外部 DLP provider 默认只能接收：

- data class 列表。
- JSON pointer paths。
- field destination。
- target origin/provider。
- redacted preview。
- input hash。
- policy bundle id/version。

默认不得接收：

- input 原文。
- secret value。
- Authorization header、Cookie、API key。
- 未脱敏 source code、PII、financial data。
- provider response 原文。

如果组织确实要把原文发给 DLP，必须满足全部条件：

- 独立 RFC 或 profile 扩展已接受。
- 本地 policy 明确开启 raw scan。
- 用户或组织管理员已批准数据处理边界。
- Audit 记录 raw scan 发生、DLP provider、purpose、retention 和 digest。
- Raw scan 失败时默认不得继续外发到目标 provider。

## Evidence

组织策略参与决策时，audit evidence 建议记录：

```ts
type OrganizationDataPolicyEvidenceV1 = {
  profile: "opencap.organization_data_policy.v1";
  bundleId: string;
  bundleVersion: string;
  mode: "observe" | "warn" | "enforce";
  decision: "allow" | "ask" | "deny";
  matchedRuleIds: string[];
  providerAllowed: boolean;
  dlpProvider?: string;
  dlpInputMode: "none" | "metadata_only" | "redacted_preview" | "raw_opt_in";
};
```

Evidence 不得包含 input 原文或 DLP 返回的敏感详情。DLP 返回也必须经过 result sanitizer 才能进入用户可见输出。

## 本地优先边界

OpenCap OSS Runtime 必须能在没有 Cloud、没有组织策略、没有外部 DLP 的情况下继续运行：

- Built-in policy 和本地 `policies.yml` 足以完成 V1 主路径。
- Registry、CLI、Runtime、MCP helper 不需要组织服务才能工作。
- 组织策略 bundle 可以来自本地文件、Git repo、企业配置管理或未来 Cloud，但 Cloud 不是唯一来源。
- 当组织策略不可用时，Runtime 必须 fail closed 还是 fail open 由本地配置决定，并写入 audit；默认 OSS 可保持仅使用本地策略。

## 安全边界

组织策略不能：

- 允许 secret_like 原文静默外发。
- 允许 internal_url 绕过 outbound policy。
- 关闭 invocation audit。
- 用 allowlist 替代用户确认。
- 用 DLP 扫描结果覆盖 Runtime hard deny。
- 把 policy bundle 当成 capability credential。

## 实现任务

后续可拆分：

- Organization policy bundle schema。
- Provider allowlist matcher。
- Policy bundle validate/lint。
- Policy simulation/diff 支持组织策略。
- Organization policy audit evidence。
- DLP metadata-only adapter profile。
- Policy bundle signing 和 activation ledger。

## 关联文档

- `docs/设计/data-egress-policy-v1.md`
- `docs/安全/data-classification-v1.md`
- `docs/安全/outbound-policy-v1.md`
- `docs/运营/policy-lifecycle-and-change-control.md`
- `docs/运营/policy-simulation-and-diff-v1.md`
