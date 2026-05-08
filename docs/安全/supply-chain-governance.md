# 供应链治理

本文定义 OpenCap 如何降低开源 Registry 和依赖供应链风险。OpenCap 的能力生态如果没有供应链治理，就会退化为不可信插件目录。

## 风险来源

- 恶意 Capability manifest。
- 权限声明和真实行为不一致。
- README 描述误导用户。
- 依赖包或 GitHub Action 被污染。
- 维护者账号被盗。
- 未经 review 的危险能力进入 registry。
- release artifact 无来源证明。

## V1 控制措施

### Registry PR Review

每个 Capability 条目必须检查：

- manifest schema。
- README。
- tests。
- 权限最小化。
- endpoint 是否与描述一致。
- auth placement 是否安全。
- 是否存在任意 URL、private network、query token。

### CI

短期：

- JSON/YAML/schema validation。
- registry manifest validation。
- registry test format validation。

中期：

- GitHub Actions token read-only。
- dependency review。
- CodeQL 或等价 SAST。
- OpenSSF Scorecard。

### Release

V1 发布前：

- tag。
- CHANGELOG。
- npm provenance 预案。
- GitHub release notes。

后续：

- SLSA provenance。
- signed releases。
- Sigstore/cosign。

## OpenSSF Scorecard 对齐

OpenSSF Scorecard 用自动化检查评估开源项目安全健康度。OpenCap 应优先关注：

- Branch-Protection。
- CI-Tests。
- Code-Review。
- Security-Policy。
- Token-Permissions。
- Vulnerabilities。
- Signed-Releases。

这些不是 V1 功能阻塞项，但应进入发布治理路线图。

## SLSA 对齐

SLSA 提供供应链安全等级和 provenance 思路。OpenCap V1 不追求完整 SLSA 等级，但发布设计应避免以后难以补 provenance：

- 构建从 CI 触发。
- release artifact 可追溯到 commit。
- 发布步骤脚本化。
- package provenance 后续可打开。

## Registry Trust Level 与供应链

Trust level 不只是主观标签：

| Trust level | 最低要求 |
| --- | --- |
| experimental | schema 通过，风险显式声明 |
| listed | README/tests 存在，通过基础 review |
| tested | registry test 通过 CI |
| verified | 维护者或服务所有权验证 |
| official | OpenCap 核心团队维护并承担升级责任 |

## 关联任务

- T080：Registry manifest CI 校验。
- T081：Capability Review Checklist。
- T083：GitHub Issue/PR templates。
- T101：CI 基础通过。
- T121：CHANGELOG。
- T123：npm package 发布预案。
- T129：Registry 供应链 review 工作流。
