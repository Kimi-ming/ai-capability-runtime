# 调研：Policy Governance 与 Decision Audit 2026-05-08

本文记录本轮策略治理、决策追踪、模拟和变更控制参考的外部来源。

## 参考来源

- Open Policy Agent Decision Logs: https://www.openpolicyagent.org/docs/management-decision-logs
- Open Policy Agent Bundles: https://www.openpolicyagent.org/docs/management-bundles
- AWS IAM Access Analyzer policy validation: https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-policy-validation.html
- AWS IAM Access Analyzer custom policy checks: https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-checks-validating-policies.html
- NIST AI RMF Playbook: https://www.nist.gov/itl/ai-risk-management-framework/nist-ai-rmf-playbook

## 对 OpenCap 的影响

### Policy decision 必须可审计和离线调试

OPA decision logs 说明，策略决策事件应包含被查询的策略、输入、bundle metadata 等信息，以支持审计和离线调试。OpenCap 不会直接采用 OPA，但需要同样的 decision trace 思路。

OpenCap 决策：每个 policy/gate decision 都生成 redacted decision trace。

### Policy 更新需要版本、bundle 和激活语义

OPA bundles 提供了动态加载、revision、持久化、签名和失败时不激活的机制。OpenCap V1 保持本地文件，但未来 policy bundle 也需要 digest、revision、activation record 和失败不覆盖 active policy 的语义。

OpenCap 决策：policy change 是可审计本地对象。

### Policy 上线前要验证和检查新访问

AWS IAM Access Analyzer 会做 grammar/best-practice validation，并支持检查策略变更是否授予 new access。OpenCap 的等价点是 policy simulation/diff：特别检查 ask/deny -> allow、data egress relaxed、financial/destructive relaxed。

OpenCap 决策：broad allow 需要 simulation/diff finding，不能静默上线。

### AI 风险治理需要 Govern/Map/Measure/Manage 闭环

NIST AI RMF Playbook 强调 Govern、Map、Measure、Manage。OpenCap 的 policy governance 对应：Govern 是策略变更控制，Map 是能力/数据/风险场景，Measure 是 simulation 和 conformance，Manage 是 incident/override/runbook。

## 新增文档

- `docs/design/policy-decision-trace-v1.md`
- `docs/operations/policy-lifecycle-and-change-control.md`
- `docs/quality/policy-simulation-and-diff-v1.md`
- `docs/security/policy-override-and-breakglass-v1.md`

## 后续问题

- policy bundle 是否进入 v0.2。
- policy simulation 是否成为 broad allow 激活前强制门禁。
- breakglass 是否需要 OS user identity 或 signed local approval。
- decision logs 是否导出为独立 NDJSON。
