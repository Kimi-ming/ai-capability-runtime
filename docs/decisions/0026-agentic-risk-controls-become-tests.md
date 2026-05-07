# ADR 0026：Agentic 风险必须映射为控制和测试

日期：2026-05-07

状态：已接受

## 背景

OpenCap 不构建 Agent，但它是 Agent 调用真实能力的治理层。Prompt injection、权限滥用、凭据泄露、SSRF、供应链污染和不可观测执行都可能通过 Capability 调用发生。

## 决策

OpenCap 把 Agentic AI 风险纳入安全模型，并要求高优先级风险进入 negative tests 或 conformance checks。安全风险不能只留在解释文档中。

## 影响

- `docs/security/agentic-risk-mapping.md` 成为安全评审入口。
- T128/T155 负责把 abuse cases 转成 smoke tests。
- Release gate 必须覆盖 ask/deny 不执行、secret 不泄露、outbound policy 和 confirmation_required。
