# ADR 0052：Broad Allow 需要 Simulation/Diff

日期：2026-05-08

状态：已接受

## 背景

从 ask/deny 改成 allow 是 AI 能力 Runtime 最危险的配置变化之一，尤其涉及 write、external_send、destructive、financial、secret_access 和敏感 data egress。

## 决策

OpenCap 对 broad allow、new allow、data egress relaxed、financial/destructive relaxed 产生 simulation/diff finding。V1 先以文档和任务形式定义，后续实现时应作为 policy activation 或 release gate。

## 影响

- policy validate 需要 findings severity。
- policy simulation/diff 进入 conformance。
- broad allow 不能靠 trust level 或 quality score 静默放行。
