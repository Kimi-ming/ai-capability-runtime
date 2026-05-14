# 能力弃用、下架与撤销

本文定义 Capability 生命周期后段：什么时候 deprecated、yanked、revoked，以及这些状态对 Registry、Runtime 和用户意味着什么。

## 状态定义

| 状态 | 含义 | 默认安装 | 默认执行 |
| --- | --- | --- | --- |
| `active` | 正常维护 | 允许 | 按 policy |
| `deprecated` | 不推荐新增安装 | 警告后允许 | 按 policy |
| `yanked` | 从默认发现结果移除 | 默认不允许新装 | 已安装可警告执行 |
| `revoked` | 明确不应继续使用 | 不允许 | 默认 deny 或强警告 |

## Deprecated

适用：

- provider API 将废弃。
- capability 被更好的能力替代。
- README 或行为仍可用，但不推荐新用户使用。

要求：

- deprecation notice。
- replacement capability if available。
- sunset date if known。

## Yanked

适用：

- 测试长期失败。
- maintainer 失联。
- provider API 不稳定。
- 安全问题正在调查但未确认恶意。

Yanked 不等于恶意。它主要阻止新安装。

## Revoked

适用：

- 恶意能力。
- 真实 secret 泄露。
- 严重误导性 manifest/README。
- 不可接受的 SSRF/外发风险。
- 维护者身份或供应链被攻陷。

Revoked 需要 advisory 或 revocation record。

当前 Registry revocation metadata 放在 `registry/advisories/`。`OCAP-2026-0001` 已记录 `http.request_demo` 的 revoked 状态：该示例能力接受任意用户 URL，只保留为测试和审查样例，不应作为默认可信安装能力。

## Metadata 草案

```yaml
lifecycle:
  status: revoked
  reason: credential_leak
  since: 2026-05-08
  advisory: OCAP-2026-0001
  replacement: github.create_issue.v2
  message: Do not run this capability. Rotate affected credentials.
```

## Runtime 行为

V1 规则：

- deprecated：invoke 前提示。
- yanked：已安装可运行，但提示风险。
- revoked：默认 deny 高风险能力；read-only 可提示后由用户显式 override。
- 本地用户可保留文件，但 OpenCap 不应静默执行 revoked 写操作。

当前 Runtime 已提供 `evaluateRevokedCapabilityInvokeGate()` 作为 revoked invoke 的最小执行边界。它在 `pre_secret` 阶段返回标准 lifecycle `GateDecision`：

- 非 revoked 能力通过 lifecycle gate，但 `policyEffect` 固定为 `none`，不授予额外授权。
- revoked `write`、`external_send`、`destructive`、`financial`、`code_execution`、`secret_access` 或 `unknown` 风险默认 `deny`，且 `requestStarted: false`。
- revoked `read_only` 在没有显式本地 override 时返回 `ask`，要求用户或 host 明确确认。
- revoked `read_only` 只有在显式 override 存在时才返回 `allow`，并继续保留 warning/advisory evidence。
- gate evidence 不包含 input/output 原文、secret 或 provider response。

## Registry 行为

- deprecated 仍在列表中展示。
- yanked 不进入默认搜索结果。
- revoked 保留记录，不能直接删除历史。
- replacement 需要独立 review。
- `pnpm validate` 会校验已有 advisory/revocation metadata 的 schema。

## 关联任务

- T191：lifecycle status schema。
- T192：install/list/invoke lifecycle warnings。
- T193：registry search excludes yanked/revoked by default。
