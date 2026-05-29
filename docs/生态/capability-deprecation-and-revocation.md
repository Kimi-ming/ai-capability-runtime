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

## Manifest Lifecycle Metadata

```yaml
lifecycle:
  status: revoked
  reason: credential_leak
  since: 2026-05-08
  advisory: OCAP-2026-0001
  replacement: github.create_issue.v2
  message: Do not run this capability. Rotate affected credentials.
```

当前 manifest schema 已支持可选顶层 `lifecycle` 对象，用于声明 deprecated、yanked 或 revoked 的治理状态。`status`、`reason` 和 `since` 为必填字段；`revoked` 必须携带 `advisory`，指向 `OCAP-YYYY-NNNN` 形状的安全公告或撤销记录。`replacement` 只能指向稳定 Capability id，`message` 只能作为用户可见说明，不能改变 Runtime policy。

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

当前 Runtime 也提供 `createCapabilityLifecycleWarning()`，供 install、list 和 invoke 准备阶段生成同一结构化 warning。`installCapability()` 会返回 warnings，`listInstalledCapabilities()` 会暴露 manifest lifecycle status 和 `lifecycleWarning`；CLI 的非 JSON install/list/invoke 输出会把 warning 写到 stderr。Warning 的 `policyEffect` 固定为 `none`，不能改变 policy、confirmation 或 audit 结果。
- gate evidence 不包含 input/output 原文、secret 或 provider response。

## 本地检查命令

V1 CLI 提供两个本地 advisory 检查入口：

```bash
opencap registry advisory list --registry registry
opencap advisory check --state-dir opencap.local --registry registry
```

`registry advisory list` 用于审查 Registry 中的 advisory/revocation metadata；`advisory check` 用于把本地已安装能力和 Registry advisory metadata 做匹配。它们只输出 evidence、计数和告警，不会删除 installed capability，不会把 revoked capability 自动加入 deny policy，也不会因为没有命中本地缓存就授予 trust 或授权执行。

## Registry 行为

- deprecated 仍在列表中展示。
- yanked 不进入默认搜索结果。
- revoked 保留记录，不能直接删除历史。
- replacement 需要独立 review。
- `pnpm validate` 会校验已有 advisory/revocation metadata 的 schema。
- `opencap registry advisory list --registry registry` 可列出本地 advisory metadata 和 invalid advisory summary。

## 关联任务

- T191：lifecycle status schema。
- T192：install/list/invoke lifecycle warnings。
- T193：registry search excludes yanked/revoked by default。
