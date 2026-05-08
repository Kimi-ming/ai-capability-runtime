# 风险和治理补充调研

日期：2026-05-07

本文记录本轮体系化设计参考的安全、治理和供应链资料。

## 参考来源

- OWASP LLM01 Prompt Injection：https://genai.owasp.org/llmrisk/llm01-prompt-injection/
- OWASP LLM06 Excessive Agency：https://genai.owasp.org/llmrisk/llm062025-excessive-agency/
- OWASP Agentic Top 10 发布说明：https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/
- OpenSSF Scorecard：https://openssf.org/projects/scorecard/
- SLSA：https://slsa.dev/规范/v1.0/levels
- NIST AI RMF：https://www.nist.gov/itl/ai-risk-management-framework
- NIST Generative AI Profile：https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence

## 关键发现

### Agentic 安全风险正在从“输出错误”转向“行动越权”

OWASP LLM06 把 Excessive Agency 归因到过多功能、过多权限和过多自治。OpenCap 的核心正好应该限制这三件事：

- 功能：Capability manifest 明确声明。
- 权限：permissions 和 policy 限制。
- 自治：ask/deny 和 confirmation 限制。

### Prompt injection 是 Runtime 必须假设存在的输入风险

OpenCap 不能依赖模型“不会被诱导”。Runtime 必须把 MCP tool arguments 当成不可信输入，并在服务端校验、策略评估和确认展示。

### 开源供应链安全必须提前设计

OpenSSF Scorecard 和 SLSA 都强调自动化检查、代码审查、安全政策、token 权限、签名发布和 provenance。OpenCap 的 Registry 是能力供应链入口，因此 review 和 CI 不能后补。

### NIST AI RMF 强调治理、测量、管理和映射

OpenCap 可以把 NIST AI RMF 的治理思想落成开源项目机制：

- Govern：ADR、GOVERNANCE、risk register。
- Map：use cases、domain model、capability lifecycle。
- Measure：tests、audit logs、trust card。
- Manage：policy engine、confirmation、release gates。

## 对 OpenCap 的设计影响

- 新增 `docs/安全/outbound-policy-v1.md`。
- 新增 `docs/安全/supply-chain-governance.md`。
- 新增 `docs/设计/audit-log-v1.md`。
- 新增 `docs/运营/operating-model.md`。
- 收敛 HTTP body、auth placement、policy DSL 和 audit failure ADR。
