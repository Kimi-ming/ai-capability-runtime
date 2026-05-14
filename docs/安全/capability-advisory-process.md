# 能力安全公告流程

本文定义 OpenCap 如何处理 Capability 相关安全问题，包括恶意能力、过宽权限、凭据泄露、误导性 README、provider API 风险和供应链污染。

## Advisory 类型

| 类型 | 例子 |
| --- | --- |
| `malicious` | manifest 隐藏外发、诱导泄露 secret |
| `overbroad_permissions` | 要求不必要的高权限 token |
| `credential_leak` | tests/README/log 示例包含真实凭据 |
| `unsafe_execution` | query token、SSRF、默认破坏性操作 |
| `misleading_metadata` | 描述与真实执行不符 |
| `provider_changed` | provider API 行为变化导致风险升级 |
| `maintainer_compromise` | 维护者账号或发布链疑似被攻陷 |

## Severity

| 等级 | 含义 | 默认处理 |
| --- | --- | --- |
| Low | 文档或元数据问题 | issue/PR 修复 |
| Medium | 可能误导用户或造成失败 | 降级/冻结 |
| High | 可能造成权限滥用或数据外发 | advisory + freeze |
| Critical | 恶意、凭据泄露、不可逆高风险 | revoke + urgent notice |

## 报告渠道

V1 使用：

- `SECURITY.md` 中的安全联系方式。
- GitHub private vulnerability reporting，如果仓库启用。
- Maintainer 直接创建 draft advisory。

不要要求报告者在公开 issue 里贴 secret、攻击 payload 或未公开漏洞细节。

## Advisory Record 草案

```yaml
schema_version: opencap.capability_advisory.v1
id: OCAP-2026-0001
capability: github.create_issue
affected_versions:
  - '<=0.1.0'
severity: high
status: investigating
summary: Capability requests broader token permissions than documented.
published_at: null
modified_at: 2026-05-08T00:00:00Z
actions:
  registry: freeze
  runtime_default: warn
  fixed_version: null
```

当前 schema 文件：`packages/spec/schema/capability-advisory.schema.json`。Spec 包提供 `validateCapabilityAdvisory()`、`validateCapabilityAdvisoryFile()` 和 `validateCapabilityAdvisoryPath()`；`pnpm validate` 会校验 registry 中已有的 advisory 文件，但不会要求每个 Capability 都必须带 advisory。

## 生命周期

```text
reported
  -> triaged
  -> investigating
  -> fixed | mitigated | revoked | not_affected
  -> published
```

## OSV/VEX 对齐

OSV schema 适合表达受影响版本、修复版本和漏洞元数据。OpenVEX 适合表达某个产品是否受漏洞影响。OpenCap 可以先用轻量 advisory YAML，未来再导出 OSV/VEX 兼容格式。

## Runtime 行为

V1 本地 Runtime 不依赖远程 advisory 服务。但当本地 registry metadata 包含 advisory/revocation 信息时：

- `opencap list` 显示 advisory status。
- `opencap invoke` 对 revoked capability 警告或阻断。
- `opencap doctor` 未来可以检查已安装能力是否受影响。

当前 Runtime 已提供 `checkInstalledCapabilityAdvisories()` 作为本地检查 helper。它读取已安装能力和本地 Registry advisory metadata，按 capability id 和 affected version 匹配，返回 advisory id、severity、status、registry action、runtime default 和 summary；结果不包含 input/output 原文、secret 或 provider response。

## 关联任务

- T187：Capability advisory YAML schema。
- T188：revocation metadata in registry。
- T189：installed capability advisory check。
- T190：SECURITY.md 对齐 private reporting。
