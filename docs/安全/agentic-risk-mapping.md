# Agentic AI 风险映射：从风险到 OpenCap 控制

OpenCap 不做 Agent，但它让 Agent 和 AI Host 可以调用真实世界能力。因此它必须把 Agentic AI 风险当作一等风险处理。

本文把 Agentic AI 常见风险映射到 OpenCap 的控制、文档和测试任务。它补充 `docs/安全/threat-model.md`。

## 风险映射原则

- 模型输出、tool arguments、外部 API 响应都视为不可信。
- 权限必须绑定到 Capability 和 invocation，而不是模型身份。
- 真实执行前必须经过 Runtime policy 和 consent。
- Agentic 风险不能只写成风险说明，必须尽量转成 negative tests。

## 映射表

| 风险主题 | OpenCap 控制 | 测试/任务 |
| --- | --- | --- |
| 过度权限 | manifest permissions、policy default ask、risk level | T030, T031, T003 |
| Prompt injection 诱导工具调用 | 输入重新校验、确认摘要由 Runtime 生成、写操作 ask | T032, T073, T155 |
| 凭据滥用 | secret resolver、禁止 token passthrough、redaction | T041, T090, T092 |
| 隐藏外发或 SSRF | outbound policy、external domain 审计、arbitrary URL 高风险 | T055, T091, T133 |
| 供应链污染 | Git-based registry review、package lint、provenance roadmap | T080, T129, T151 |
| 不可观测执行 | SQLite audit log、consent receipt、input hash | T040, T041, T152 |
| 跨 Host 行为不一致 | interoperability profiles、host compatibility records | T142, T154 |
| 多步连锁误操作 | V1 不做自动组合；每次调用独立 policy/audit | 后续 composition RFC |
| 用户被误导确认 | Runtime-owned consent summary、risk/permission 展示 | T152, T155 |
| 能力退化或漂移 | conformance suite、versioning、changelog | T122, T153 |

## Abuse Case 到测试

| Abuse Case | 期望结果 | 测试分组 |
| --- | --- | --- |
| 模型把恶意文本塞进 issue body | 仍需 write confirmation；body 脱敏摘要 | C-CON, C-AUD |
| Capability 试图访问 `localhost` | outbound policy 阻断 | C-SEC, C-HTTP |
| Host 重复调用高风险工具 | 每次 invocation 有独立 audit/consent | C-RUN, C-CON |
| Manifest 请求过宽权限 | Registry review 或 permission lint 标记 | C-MAN, C-REG |
| `ask` 时 MCP Host 无确认 UI | 返回 `confirmation_required`，不执行 | C-MCP, C-CON |
| 外部 API 返回超大输出 | output normalization 限制 | C-HTTP |

## OpenCap 的安全边界

OpenCap 能提供：

- permission boundary
- policy decision
- human confirmation surface
- secret handling boundary
- audit evidence
- registry governance
- conformance evidence

OpenCap 不能保证：

- 外部 API 本身安全。
- 模型不会被 prompt injection 影响。
- 第三方 Capability 永远无恶意。
- Host 总能正确呈现风险。

## 发布要求

Alpha 前必须至少覆盖：

- ask/deny 不执行测试。
- secret 不出日志测试。
- outbound localhost/private IP 阻断测试。
- MCP confirmation_required 测试。
- package lint 基础检查。

## 关联文档

- `docs/安全/threat-model.md`
- `docs/安全/outbound-policy-v1.md`
- `docs/设计/confirmation-and-consent-v1.md`
- `docs/质量/conformance-suite-v1.md`
