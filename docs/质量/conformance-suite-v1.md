# 一致性测试体系 V1

本文定义 OpenCap V1 如何证明一个实现、一个 Capability package 或一个 Host profile 符合 OpenCap 的最小契约。

## 目标

Conformance suite 不是普通单元测试集合。它要证明：

- Capability Manifest 按标准被解析和拒绝。
- Runtime 一定走 validation -> policy -> confirmation -> secret -> executor -> audit pipeline。
- Registry 包满足最小治理要求。
- MCP bridge 在不同 Host 中有可复现行为。
- 安全不变量有负向测试。

## 测试分组

| 分组 | 目标 | 示例断言 |
| --- | --- | --- |
| C-MAN | Manifest 标准 | 缺少权限失败；非法 risk 失败；`type: mcp` 在 V1 失败 |
| C-PKG | Capability package | 必须有 README、manifest、tests；禁止隐藏执行脚本 |
| C-RUN | Runtime pipeline | denied/ask 不执行；allow 才进入 executor |
| C-POL | Policy Engine | 规则顺序稳定；默认 ask；deny 优先终止 |
| C-PG | Policy Governance | decision trace、policy ledger、simulation/diff、override 硬边界 |
| C-CON | Consent | confirmation_required 可审计；未确认不解析 secret |
| C-AUD | Audit | 成功、失败、拒绝、确认缺失都写日志；敏感字段脱敏 |
| C-HTTP | HTTP executor | body 模板、auth placement、timeout、outbound policy |
| C-MCP | MCP bridge | tools/list、tools/call、tool name collision、error mapping |
| C-REG | Registry | manifest CI、tests schema、review checklist |
| C-SEC | Agentic security | SSRF、token leakage、prompt-injection-like arguments |

## Release Gate 映射

| 阶段 | 必须通过 |
| --- | --- |
| M1 Manifest Validation | C-MAN |
| M2 Local Install/List | C-MAN, C-PKG |
| M3 Policy + Audit | C-RUN, C-POL, C-PG, C-CON, C-AUD |
| M4 HTTP Invoke | C-HTTP, C-SEC subset |
| M5 MCP Bridge | C-MCP, C-CON |
| M6 GitHub Demo | C-MAN 到 C-MCP 主路径 |
| alpha release | 全部 V1 required groups |

## Conformance Record

每次声明 compatibility 或 verified capability 时，应产生记录：

```yaml
subject:
  type: runtime
  name: opencap-runtime
  version: 0.1.0-dev
profile: opencap.mcp.tools.v1
suite_version: 0.1.0
result: pass
commit: abc1234
ran_at: 2026-05-07T12:00:00Z
checks:
  C-MCP-001-tools-list: pass
  C-MCP-002-tools-call-dry-run: pass
  C-CON-001-confirmation-required: pass
artifacts:
  - path: reports/conformance/mcp-tools-v1.yml
```

## 负向测试必须优先

OpenCap 的价值来自“不会做不该做的事”。因此下列测试优先级高于 happy path：

- policy deny 时 executor 不被调用。
- 每个 policy/gate decision 都产生 redacted trace。
- broad allow 或 ask/deny -> allow 策略变更产生 simulation/diff finding。
- policy governance 测试优先复用 `packages/runtime/test/fixtures/policies/` 和 `packages/runtime/test/fixtures/policy-scenarios/governance.yml`。
- override/breakglass 不覆盖 data egress deny、outbound private block 或 revoked/malicious block。
- ask 且没有 confirmation channel 时不执行。
- secret 不进入 logs/stdout/MCP result。
- arbitrary URL 不能访问 localhost、private IP、metadata service。
- tool name 冲突时启动失败。
- registry package 缺少 README 或 tests 时不能标记为 Listed。

## 命令草案

未来可以引入：

```bash
opencap conformance manifest registry/developer-tools/github.create_issue
opencap conformance package registry/developer-tools/github.create_issue
opencap conformance runtime --state-dir ./opencap.local
opencap conformance mcp --host-record ./reports/host/claude.yml
```

V1 早期先用 Vitest、CLI smoke 和 YAML record 实现，不要求一次性做完整命令。

## Skeleton 实现状态

T153 已在 `@opencap/spec` 中新增最小 conformance suite skeleton：

- `CONFORMANCE_SUITE_VERSION = 0.1.0`。
- `CORE_CONFORMANCE_GROUPS` 固定声明 V1 核心组：`C-MAN`、`C-PKG`、`C-RUN`、`C-POL`、`C-PG`、`C-CON`、`C-AUD`、`C-HTTP`、`C-MCP`、`C-REG`、`C-SEC`。
- `validateConformanceRecord()` 校验 record 的 subject、profile、suite_version、result、checks 和 artifacts。
- artifacts 必须是仓库相对路径，不能使用绝对路径或 `..` 上跳。
- 当前被 skeleton 校验的 record 是 `packages/runtime/test/fixtures/conformance/policy-governance.yml`、`packages/runtime/test/fixtures/conformance/threat-model-abuse-cases.yml`、`packages/runtime/test/fixtures/conformance/agentic-abuse-cases.yml`、`packages/runtime/test/fixtures/conformance/execution-evidence.yml` 和 `packages/runtime/test/fixtures/conformance/usage-evidence.yml`。

## 非目标

- Conformance 不保证第三方外部 API 安全。
- Conformance 不替代人工 security review。
- Conformance 不代表 Cloud SLA。
- Conformance 不证明所有 Host 都兼容，只证明指定 profile 的指定记录。

## 关联任务

- T003：schema 单元测试。
- T004：registry test case schema。
- T104：端到端 smoke test。
- T128：abuse cases smoke tests。
- T137：错误模型测试。
- T153：conformance suite skeleton。
- T260：policy governance conformance tests。

## Threat Model Abuse Cases 实现状态

T128 已新增 `packages/runtime/src/threat-model-abuse-cases.test.ts` 和 `packages/runtime/test/fixtures/conformance/threat-model-abuse-cases.yml`。当前 `opencap.threat_model_abuse_cases.v1` 组包含：

- AC-001：write 风险 Capability 默认 `ask`，确认摘要包含目标和字段。
- AC-002：token-shaped input 被渲染进 URL query 时，Data Egress Gate 在 secret/execution 前 `deny`。
- AC-003：任意 URL 访问 metadata service 被 outbound policy 在 secret/fetch 前阻断。
- AC-004：MCP 无 elicitation 时返回并审计 `confirmation_required`，不执行真实请求。
- AC-005：audit preflight 失败时阻断写执行，不读取 secret、不发起 fetch。
- AC-006：policy 从 ask 放宽到 allow 会进入 simulation finding，activation 写入 policy ledger 且不保存 policy body。
- AC-007：breakglass 不能越过 data egress、outbound 或 revoked capability 硬边界。

## Agentic Abuse Cases 实现状态

T155 已新增 `packages/runtime/src/agentic-abuse-cases.test.ts` 和 `packages/runtime/test/fixtures/conformance/agentic-abuse-cases.yml`。当前 `opencap.agentic_abuse_cases.v1` 组包含：

- AG-001：prompt-injection-like issue body 仍需 Runtime-owned write confirmation。
- AG-002：Capability 访问 localhost 时 outbound policy 在 secret/fetch 前阻断。
- AG-003：Host 重复调用高风险工具时，每次 invocation 都有独立 audit/consent。
- AG-004：任意 URL Capability 在 dry-run plan 中暴露 `arbitrary_url` warning。
- AG-005：MCP Host 无确认 UI 时返回 `confirmation_required`，不执行。
- AG-006：外部 API 返回超大输出时，Result Envelope 在 model-visible content 前限制大小并记录 warning。

## Execution Evidence 实现状态

T173 已新增 `packages/runtime/test/fixtures/conformance/execution-evidence.yml`。当前 `opencap.execution_evidence.v1` 组包含：

- EE-001：blocked 和 dry-run 调用的 `requestStarted` 为 false。
- EE-002：成功 HTTP 调用有 response evidence，包括 status、request/response timestamp 和 side-effect kind。
- EE-003：request 已发出后的 timeout 记录 `unknown_after_timeout`，不伪造 response timestamp。
- EE-004：retry attempt 和 idempotency key evidence 只记录次数与 hash，不泄露 key 原文。
- EE-005：provider request id 和 execution semantics 字段能进入 audit/SQLite evidence。
- EE-006：Result Envelope 带 output validation、sanitizer、provenance 和 result digest evidence。
- EE-007：secret 和 credential evidence 只记录 reference/redacted digest，不记录 token 原文。

## Usage Evidence 实现状态

T207 已新增 `packages/runtime/test/fixtures/conformance/usage-evidence.yml`。当前 `opencap.usage_evidence.v1` 组包含：

- UE-001：blocked invocation 生成 usage evidence 时 `requestStarted=false`。
- UE-002：dry-run usage 与 real execution 分开统计。
- UE-003：retryAttempt 不被误算为多个用户 intent。
- UE-004：revoked 或 deprecated capability usage 可被单独标记。
- UE-005：`sourceAuditHash` 能关联 audit record。
- UE-006：usage event 不包含 input、output 或 secret 原文。
- UE-007：financial spend cap 在 secret resolution 前阻断。

该组只证明 non-billing usage evidence，不代表 billable event、计费规则或商业结算。

## Policy Governance V1 实现状态

T260 已新增 `packages/runtime/src/policy-governance-conformance.test.ts` 和 `packages/runtime/test/fixtures/conformance/policy-governance.yml`。当前 C-PG 组包含：

| Check ID | 覆盖点 |
| --- | --- |
| `C-PG-001-decision-trace-redacted` | 每次 policy decision 产生 redacted decision trace。 |
| `C-PG-002-policy-change-ledger` | policy activation/rollback 保留 ledger 记录。 |
| `C-PG-003-broad-allow-simulation` | broad allow 和敏感外发通过 simulation 产生 finding。 |
| `C-PG-004-breakglass-hard-boundary` | breakglass 不能覆盖 data egress deny 等硬边界。 |
| `C-PG-005-audit-redaction-export` | decision log export 不包含 input 原文或 secret-like value。 |

该组测试优先验证安全不变量，不替代各模块单元测试。后续增加 policy governance 能力时，应优先向 C-PG 组添加 negative check。
