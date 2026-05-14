# 信任模型 V1

本文定义 OpenCap Registry 中 Capability 的信任等级、升级条件、降级条件和用户可见语义。Trust 不是“安全保证”，而是可验证事实的汇总。

## 信任原则

- Trust level 不能覆盖本地 policy。
- Trust level 不能让高风险操作自动执行。
- Trust level 必须来自证据，而不是维护者主观喜好。
- Trust level 可以降级、冻结或撤销。
- Trust Card 要展示事实，不做绝对安全承诺。

## Trust Level

| 等级 | 含义 | 最低证据 |
| --- | --- | --- |
| `experimental` | 示例或早期能力 | manifest 通过 schema |
| `listed` | 可被 Registry 列出 | README、tests、review checklist 通过 |
| `tested` | 有自动测试证据 | registry tests/conformance passing |
| `verified` | 维护者或服务所有权已验证 | maintainer verification + least privilege review |
| `official` | OpenCap 核心维护 | core team owner + release gate |
| `revoked` | 不应安装或继续使用 | advisory/revocation record |

## 升级条件

### experimental -> listed

要求：

- `manifest.yml` 合法。
- `README.md` 说明用途、权限、风险、凭据。
- 至少一个 `tests/*.yml`。
- 不含真实 secret。
- Capability Review Checklist 通过。

### listed -> tested

要求：

- registry tests 自动通过。
- dry-run evidence 可复现。
- basic conformance record 存在。
- 无 High open advisory。

### tested -> verified

要求：

- 维护者身份或服务所有权已验证。
- least-privilege review 通过。
- 最近一次 review 未过期。
- 有明确 maintainer 响应路径。

### verified -> official

要求：

- OpenCap core team 接管维护或共同维护。
- release gate 通过。
- 安全响应负责人明确。

## 降级和冻结

Trust level 可以因为以下原因降级：

- 测试持续失败。
- provider API 已变更但未更新。
- README 误导风险。
- maintainer 长期无响应。
- advisory 未处理。
- capability scope 明显过宽。

冻结表示暂时不能升级或新增安装，但已安装用户可继续按本地 policy 决定是否运行。

## Revoked

`revoked` 表示 OpenCap Registry 明确不建议继续安装或运行。原因可能是恶意能力、凭据泄露、严重误导、不可修复的安全风险或维护者身份失效。

Runtime V1 行为：

- 本地已安装能力如果发现 registry metadata 标记 revoked，应在 `opencap list` 和 invoke 前警告。
- 默认不自动删除本地文件。
- 对 destructive/financial/external_send revoked capability 应默认 deny，除非用户显式 override。

## Trust Card 字段

```yaml
capability: github.create_issue
version: 0.1.0
trust_level: tested
lifecycle: reviewed
manifest_valid: true
package_valid: true
tests:
  status: passing
  last_run: 2026-05-08
review:
  least_privilege: pass
  reviewed_at: 2026-05-08
advisories:
  open: 0
  latest: null
maintainer:
  status: community
```

当前 `opencap list` 已输出 Trust Card 的最小可见化子集：trust level、lifecycle、maintainer、license 和 status。这些字段只用于展示和审查，不改变本地 policy、consent 或 execution gate。

## 非目标

- Trust level 不等于安全认证。
- Trust level 不保证 provider API 不变。
- Trust level 不替代用户确认。
- Trust level 不替代企业 policy。

## 关联任务

- T125：list 输出 trust card 基础字段。
- T158：Trust Card generation rules。
- T185：trust level transition tests。
- T186：revoked capability invoke warning/deny behavior。
