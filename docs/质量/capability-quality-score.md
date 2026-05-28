# 能力质量评分

本文定义一个非安全认证的质量评分模型，用于帮助用户和维护者理解 Capability 的成熟度。Quality Score 只展示事实，不替代 policy 和 consent。

## 原则

- 分数可解释，不做黑箱排名。
- 质量分不等于安全保证。
- 高风险能力即使质量高，也仍需确认。
- 分数必须能被 CI、review 或 metadata 追溯。

## 评分维度

| 维度 | 权重 | 证据 |
| --- | --- | --- |
| Manifest 完整性 | 15 | schema、metadata、permissions |
| 文档质量 | 15 | README、凭据说明、限制说明 |
| 测试覆盖 | 20 | registry tests、dry-run、mock tests |
| 安全姿态 | 20 | least privilege、no secret、outbound policy |
| 维护状态 | 10 | maintainer 响应、最近更新 |
| 兼容性 | 10 | host/conformance records |
| 运行证据 | 10 | audit/evidence examples |

## Score Band

| 分数 | Band | 含义 |
| --- | --- | --- |
| 0-39 | incomplete | 不建议安装 |
| 40-59 | experimental | 示例或早期能力 |
| 60-74 | listed | 基础质量可接受 |
| 75-89 | tested | 测试和评审较完整 |
| 90-100 | verified | 高质量且维护明确 |

## Trust Level 与 Quality Score

Trust level 是离散治理状态。Quality Score 是解释性质量指标。

例如：

- 一个官方能力可以因为测试失败临时降分。
- 一个测试充分的社区能力不一定 verified。
- 一个 revoked 能力即使历史分数高，也必须显示 revoked。

Runtime policy evaluation 可以把 quality score 作为 `quality_score=<value>` decision trace fact 记录，便于解释当时的能力证据；但 policy rule matching 不读取 score，高分不能把默认 `ask` 变成 `allow`，也不能覆盖显式 `deny`。

## 输出草案

```yaml
quality_score:
  total: 82
  band: tested
  dimensions:
    manifest: 15
    docs: 12
    tests: 18
    security: 17
    maintenance: 8
    compatibility: 6
    evidence: 6
  generated_at: 2026-05-08
```

当前 Runtime 已提供 `calculateCapabilityQualityScore()` 作为 `opencap.quality_score.v1` 的最小实现。Helper 按上表权重对七个维度求和，限制每个维度不超过权重，输出 total、band、dimensions、generatedAt 和 `policyEffect: none`。

Trust Card 的 `quality` 字段现在承接这份完整结构，而不是只展示一个分数。带 quality score 的 Trust Card 必须在 limitations 中说明质量分只是解释性 evidence，没有 policy effect。Quality Score 只能进入 Trust Card 或 policy trace，不能参与授权匹配。

`@opencap/spec` 还提供 `buildRegistryQualitySummary()`，用于读取本地 Registry 的 manifests、package lint、registry tests、least-privilege auth lint 和 capability advisories，并为每个 Capability 输出 Registry quality evidence summary。该 summary 会标记 lifecycle/advisory 状态、默认安装可信判断、阻断原因和 `policyEffect: none` 的 quality score；它不改变 trust level、policy decision 或 install allow/deny。

## 非目标

- 不做商业排名。
- 不做付费推广排序。
- 不替代人工 review。
- 不承诺无漏洞。

## 关联任务

- T194：quality score rubric implementation draft。
- T195：Trust Card includes quality score。
- T289：Registry quality summary report helper。
- T196：score cannot override policy tests。
