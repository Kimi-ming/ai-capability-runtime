# Conformance Suite V1：一致性测试体系

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
