# SYSTEM：OpenCap 体系蓝图

本文把 OpenCap V1 的产品、协议、Runtime、安全、Registry、发布和开源治理串成一个完整系统。阅读顺序从本文开始，再进入具体文档。

## 北极星

OpenCap 的目标不是让某一个 Agent 更聪明，而是让所有 AI Host 都能以可治理的方式调用真实世界能力。

```text
模型负责理解意图。
Host 负责承载交互。
OpenCap 负责能力治理。
外部服务负责真实执行。
用户和组织负责授权边界。
```

## 十个子系统

| 子系统 | 目标 | 关键文档 | V1 产物 |
| --- | --- | --- | --- |
| 产品定位 | 明确为什么存在 | `docs/product/strategy.md` | 非 Agent、非 Marketplace 的定位 |
| 用户场景 | 明确为谁解决什么 | `docs/product/use-cases.md` | V1 主路径用例 |
| Capability 标准 | 统一能力描述 | `docs/capability-manifest.md` | manifest schema |
| Capability 生命周期 | 治理状态机 | `docs/product/capability-lifecycle.md` | Draft -> Audited |
| Runtime 核心 | 安全执行能力 | `docs/design/runtime-contracts.md` | invoke pipeline |
| HTTP 执行 | 调用外部 API | `docs/design/http-execution-v1.md` | body/auth/outbound 规则 |
| Policy DSL | 执行前决策 | `docs/design/policy-dsl-v1.md` | default/rules YAML |
| Audit Log | 事后追踪 | `docs/design/audit-log-v1.md` | SQLite log schema |
| Registry 治理 | 供应链入口 | `docs/security/supply-chain-governance.md` | review + CI + trust |
| 发布运营 | 可持续推进 | `docs/operations/operating-model.md` | 任务、ADR、风险、发布门禁 |

## 系统闭环

```text
Capability author
  -> writes manifest.yml
  -> opencap validate
  -> registry review and tests
  -> user installs capability
  -> runtime exposes MCP tool
  -> host calls tool
  -> input validation
  -> policy decision
  -> confirmation if needed
  -> secret resolution
  -> HTTP execution or dry-run
  -> audit log
  -> logs/review/iteration
```

## 信任边界

```text
Untrusted / Semi-trusted
- AI model output
- MCP tool arguments
- third-party manifest descriptions
- external API responses

Trusted Computing Base V1
- schema validator
- runtime invoke pipeline
- policy engine
- confirmation handler
- secret resolver
- audit logger

Governance Surface
- registry review
- ADRs
- risk register
- release gates
- CI checks
```

## 不变量

- Capability 必须先安装，Runtime 才能调用。
- 所有调用必须经过同一条 Runtime pipeline。
- Policy Engine 不做交互，Confirmation Handler 不做执行。
- Secret Resolver 不把密钥原文交给日志或工具输出。
- `deny` 和未确认的 `ask` 不得解析密钥、不得执行。
- 写操作审计不可用时不得执行。
- 任意 URL 能力默认高风险，需要 outbound policy 兜底。
- Registry trust level 不能覆盖用户本地 policy。

## V1 关键收敛决策

| 决策 | 状态 |
| --- | --- |
| V1 只支持 `type: http` | 已接受 |
| Audit log 使用 SQLite | 已接受 |
| Capability 生命周期作为治理主线 | 已接受 |
| HTTP body 使用 `execution.body.fields` 模板 | 已接受 |
| API key placement 必须显式声明 | 已接受 |
| Policy DSL 使用顶层 `default/rules` | 已接受 |
| 非只读调用审计失败时阻断执行 | 已接受 |
| 任意用户输入 URL 需要 outbound policy | 已接受 |

## 设计成熟度

| 层 | 当前状态 | 下一步 |
| --- | --- | --- |
| 产品定位 | 清晰 | 保持 README/SPEC 同步 |
| Manifest 标准 | 基础完成 | T001/T002 接入真实校验 |
| HTTP 执行 | 设计收敛 | T053/T052 实现 body/auth |
| Policy | 设计收敛 | T030/T031 实现 parser/engine |
| Audit | 设计收敛 | T040/T041/T042 实现 SQLite 和脱敏 |
| MCP | 边界清晰 | T070/T073 做 SDK spike |
| Registry | 规则清晰 | T080/T081/T129 实现 CI/review |
| 发布治理 | 清晰 | T126 做 release checklist |
