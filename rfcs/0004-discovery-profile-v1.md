# RFC 0004：Discovery Profile V1

## 状态

草案

## 摘要

Discovery Profile V1 定义 OpenCap Registry 和未来搜索/发现能力可以暴露哪些 metadata、如何默认过滤 lifecycle 状态、以及 ranking/search 不能影响哪些安全边界。

核心原则：发现不是授权，排序不是信任，推荐不是安装。

## 背景

OpenCap 会逐步从 Git-based Registry 演进到更强的 capability discovery：分类、搜索、兼容性筛选、质量评分、维护者验证、host compatibility evidence，甚至未来的商业分发。

如果 discovery profile 没有边界，生态很容易出现三类风险：

- 排名把高风险 Capability 包装成低风险。
- sponsored/paid 结果绕过用户明确安装。
- search/recommendation 影响 Runtime policy 或 confirmation。

Discovery Profile V1 只定义发现层的可见 metadata 和默认过滤规则，不定义自动安装、自动授权或动态 tool loading。

## 术语

- **Discovery metadata**：用于搜索、筛选、展示和兼容性判断的 Registry metadata。
- **Ranking signal**：用于决定展示顺序的非授权信号，例如文本匹配、质量评分、下载量或维护活跃度。
- **Safety signal**：用于展示风险和治理状态的信号，例如 risk level、lifecycle status、advisory status、trust level。
- **Policy decision**：Runtime 在调用前计算的 allow/ask/deny。

## Discovery Metadata

V1 profile 允许以下 metadata 参与搜索和筛选：

| 字段 | 来源 | 用途 | 是否可影响 policy |
| --- | --- | --- | --- |
| `capability_id` | manifest | 精确查找和安装 | 否 |
| `name` | manifest，经 metadata lint | 展示和文本搜索 | 否 |
| `description` | manifest，经 metadata lint | 展示和文本搜索 | 否 |
| `category` | manifest metadata / registry review | 分类浏览 | 否 |
| `tags` | registry metadata | 辅助搜索 | 否 |
| `provider` | manifest auth/execution/review 派生 | provider 筛选 | 否 |
| `resources` | permissions 派生 | 权限筛选 | 否 |
| `actions` | permissions 派生 | 权限筛选 | 否 |
| `risk_levels` | permissions 派生 | 风险筛选和展示 | 否 |
| `confirmation_modes` | permissions 派生 | 展示确认预期 | 否 |
| `lifecycle_status` | registry lifecycle metadata | 默认过滤和 warning | 否 |
| `trust_level` | registry review evidence | 展示维护/验证状态 | 否 |
| `quality_score` | quality rubric evidence | 排序辅助 | 否 |
| `advisory_status` | advisory records | 默认过滤和 warning | 否 |
| `host_compatibility` | compatibility evidence | Host 筛选 | 否 |
| `updated_at` | registry commit/release metadata | 新旧排序 | 否 |

Discovery metadata 必须可追溯到 manifest、registry review、CI、compatibility record、quality evidence 或 advisory。不能用不可审计的商业声明替代安全 metadata。

## 默认过滤

Discovery Profile V1 的默认过滤规则：

| 状态 | 默认行为 | 用户可否显式查看 |
| --- | --- | --- |
| `active` / `listed` / `tested` / `verified` | 可显示 | 是 |
| `deprecated` | 可显示，但必须展示迁移/弃用提示 | 是 |
| `yanked` | 默认隐藏 | 是，需要显式包含隐藏结果 |
| `revoked` | 默认隐藏且不得推荐安装 | 只能在安全/历史/审计视图中查看 |
| 有 unresolved critical advisory | 默认隐藏或强 warning | 是，需要显式查看 |

默认搜索、推荐、分类页不得展示 `revoked` 或 `yanked` 作为普通结果。

## Ranking 规则

Ranking 可以影响展示顺序，但不能改变以下结果：

- 不能修改 Runtime policy。
- 不能把 `ask` 改成 `allow`。
- 不能跳过 human confirmation。
- 不能自动安装 Capability。
- 不能自动把未安装 Capability 暴露到 MCP `tools/list`。
- 不能隐藏 risk、permissions、lifecycle、advisory、trust level。
- 不能用 sponsored/paid 排名覆盖 safety signal。

Ranking signal 必须与 safety signal 分开展示。Sponsored/paid placement 必须明确标注，并且不得影响 policy、trust level、quality score 或 advisory status。

## 安装边界

Discovery 只产生候选。安装必须是用户或组织 policy 明确批准的动作。

安装前必须展示：

- capability id、版本和来源。
- permissions/risk summary。
- lifecycle/advisory status。
- trust level 和 evidence。
- 是否包含 arbitrary URL、external send、destructive、financial、code execution 或 secret access 风险。

Discovery profile 不允许 Host 根据用户 prompt 自动安装新能力。

## 与 Runtime 的关系

Runtime 调用时必须重新执行：

```text
input validation
  -> policy evaluation
  -> confirmation
  -> secret resolution
  -> outbound/data egress checks
  -> execution
  -> audit
```

Discovery metadata 和 ranking reason 都不是授权依据。Runtime 只能信任已安装 manifest、local policy、用户确认和本地/组织治理配置。

## 兼容性

V1 当前没有搜索服务。该 profile 先作为 Registry 和未来 registry-web 的设计约束。后续实现 search index 时，必须：

- 生成可审计 search index。
- 保留 source manifest/ref。
- 默认过滤 yanked/revoked。
- 在结果中展示 risk/permissions/lifecycle/advisory。
- 明确 ranking explanation 不参与 policy。

## 非目标

- 不定义商业 marketplace 排名算法。
- 不定义自动 tool router。
- 不定义远程动态安装协议。
- 不定义 Host 侧模型选择算法。
- 不允许 discovery 直接触发 execution。

## 待解决问题

- search index 是否应签名。
- hosted registry 是否需要组织级 allowlist/denylist。
- host compatibility evidence 的最小格式。
- sponsored placement 是否需要独立审计记录。
