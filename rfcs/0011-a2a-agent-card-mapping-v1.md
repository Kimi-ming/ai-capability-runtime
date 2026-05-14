# RFC 0011：A2A Agent Card Mapping Profile V1

## 状态

草案

## 摘要

A2A Agent Card Mapping Profile V1 定义 OpenCap 未来如何把 Capability Runtime 的受控元数据映射到 A2A Agent Card/Agent Skill 发现表面，同时不把 Capability 伪装成 autonomous Agent。

核心原则：Agent Card 是发现和交互配置，不是授权；OpenCap Capability 不是 Agent；任何 A2A adapter 调用都必须重新进入 Runtime validation、policy、consent、secret、execution 和 audit pipeline。

## 背景

A2A v0.3.0 规范把 Agent Card 定义为 A2A Server 发布的 JSON 元数据，用于描述 server identity、capabilities、skills、service endpoint 和 authentication requirements。规范还定义了 Agent Skill、task lifecycle、message/artifact、transport、安全和认证授权要求。

OpenCap 的定位不同：OpenCap 是 Capability Runtime 和治理层，不做 Agent，不做 planner，不做 Agent-to-Agent 任务协作。未来如果 A2A Agent 希望发现或调用 OpenCap 能力，OpenCap 只能提供受控 adapter/profile，不能把单个 Capability 包装成“会自主协作的 Agent”。

参考资料：<https://a2a-protocol.org/v0.3.0/specification/>

## Profile 标识

```text
opencap.a2a.agent_card_mapping.v1
```

该 profile 只定义 metadata mapping 和未来 A2A adapter 的执行边界。它不表示：

- OpenCap V1 已实现 A2A server。
- 单个 Capability 是 A2A Agent。
- A2A Client 的任务请求可以绕过 Runtime policy。
- A2A Agent Card 的 skill 描述可以替代 manifest、Trust Card、Consent Card 或 policy。

## 映射对象

推荐映射粒度是“一个 OpenCap Runtime deployment 作为一个 A2A Server card”，该 card 的 `skills` 数组列出已安装、可暴露且未被 lifecycle/advisory 隐藏的 Capability summaries。

不推荐：

- 每个 Capability 生成一个独立 Agent Card。
- 把 registry 中未安装 Capability 暴露为 skill。
- 把 revoked/yanked Capability 暴露为普通 skill。
- 用模型生成 skill description。

## Agent Card 映射

```json
{
  "protocolVersion": "0.3.0",
  "name": "OpenCap Capability Runtime",
  "description": "A governed OpenCap runtime exposing installed capabilities as controlled skills. It is not an autonomous planning agent.",
  "url": "https://runtime.example.com/a2a",
  "preferredTransport": "JSONRPC",
  "version": "0.1.0-dev",
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "securitySchemes": {
    "opencap-oauth": {
      "type": "oauth2"
    }
  },
  "security": [
    {
      "opencap-oauth": ["opencap.invoke"]
    }
  ],
  "defaultInputModes": ["application/json"],
  "defaultOutputModes": ["application/json"],
  "skills": []
}
```

字段来源：

| Agent Card 字段 | OpenCap 来源 | 规则 |
| --- | --- | --- |
| `protocolVersion` | adapter config | 必须绑定已测试 A2A spec version |
| `name` | Runtime deployment config | 必须说明是 OpenCap Runtime，不是具体 Capability Agent |
| `description` | Runtime-owned template | 必须声明治理边界，不能承诺自主规划 |
| `url` | A2A adapter endpoint | production 必须 HTTPS |
| `preferredTransport` | adapter capability | 默认 `JSONRPC`，实现前不声明其他 transport |
| `version` | OpenCap runtime/version | 可包含 commit 或 release version |
| `capabilities` | adapter features | 未实现 streaming/push 时必须 false |
| `securitySchemes` / `security` | Remote Runtime auth profile | 不能复用 V1 env credential 模型 |
| `defaultInputModes` | Runtime input contract | V1 映射为 `application/json` |
| `defaultOutputModes` | Result Envelope adapter | V1 映射为 `application/json` |
| `skills` | installed capability projection | 只来自已安装且可暴露 Capability |

## Agent Skill 映射

每个可暴露 Capability 映射为一个 A2A `AgentSkill`：

```json
{
  "id": "capability.github.create_issue",
  "name": "Create GitHub Issue",
  "description": "Create a GitHub issue through OpenCap. Requires Runtime policy evaluation and may require confirmation before execution.",
  "tags": ["opencap", "developer-tools", "github", "write", "confirmation-required"],
  "examples": [
    "Create a GitHub issue in octo/example with title and body."
  ],
  "inputModes": ["application/json"],
  "outputModes": ["application/json"],
  "security": [
    {
      "opencap-oauth": ["opencap.invoke"]
    }
  ]
}
```

字段来源：

| AgentSkill 字段 | OpenCap 来源 | 规则 |
| --- | --- | --- |
| `id` | capability identity | 使用 stable escaped id，例如 `capability.github.create_issue` |
| `name` | manifest `name` / registry reviewed title | 经过 model-visible metadata lint |
| `description` | Runtime tool projection + risk summary | 必须说明 policy/confirmation 可能阻断 |
| `tags` | category、provider、risk、lifecycle | 只能来自 manifest/review 派生 metadata |
| `examples` | registry tests 或 reviewed examples | 不得包含 secret/token/provider raw data |
| `inputModes` | manifest input schema | 默认 `application/json` |
| `outputModes` | Result Envelope | 默认 `application/json` |
| `security` | adapter auth requirement | 不能表达下游 provider credential |

`AgentSkill` 不支持完整 JSON Schema。OpenCap 必须把详细 input/output schema、permissions、risk、lifecycle、Trust Card 和 Compatibility evidence 放在 authenticated extended card、documentation URL 或 OpenCap-specific extension 中，而不是塞进自然语言 description。

## OpenCap Extension

如果 A2A Client 支持 extensions，OpenCap 可以声明非必需 extension：

```json
{
  "capabilities": {
    "extensions": [
      {
        "uri": "https://opencap.dev/a2a/extensions/capability-metadata-v1",
        "description": "OpenCap capability identity, risk, lifecycle, trust, and compatibility evidence references.",
        "required": false,
        "params": {
          "profile": "opencap.a2a.agent_card_mapping.v1"
        }
      }
    ]
  }
}
```

Extension params 可以包含 evidence references、schema URLs、card ids 或 digests，但不得包含 manifest 原文、policy 原文、input 原文、provider raw output、secret value 或 Authorization header。

## 调用边界

未来 A2A adapter 收到 `message/send` 或等价 task request 后，必须把请求转为 Runtime invocation：

```text
A2A request
  -> authenticate A2A client to OpenCap adapter
  -> identify requested AgentSkill / capability id
  -> parse JSON input part
  -> Runtime invocation request
  -> validation
  -> input classification / data egress gate
  -> policy / lifecycle / quota / consent gates
  -> secret resolution
  -> execution
  -> Result Envelope
  -> A2A message/artifact mapping
  -> audit
```

要求：

- A2A task id、context id 和 caller identity 只能作为 provenance/audit evidence，不是授权。
- Agent Card `skills` 只帮助发现，不参与 allow/deny。
- A2A Client 的 OAuth token 只能认证到 OpenCap adapter，不能被透传给 GitHub/Slack/Vercel 等下游 provider。
- A2A multi-turn `input-required` 或 `auth-required` 不能替代 Runtime ConsentRequest；需要确认时仍由 OpenCap consent profile 处理。
- 失败、拒绝、阻塞、未确认和未知结果都必须产生 Result Envelope 和 audit event。

## Result / Artifact 映射

OpenCap Result Envelope 到 A2A 的推荐映射：

| Runtime status | A2A task/message 表现 | 规则 |
| --- | --- | --- |
| `success` | completed task + artifact/data part | 只输出 validated/sanitized structured result |
| `dry_run` | completed task + plan artifact | 明确未执行 |
| `confirmation_required` | input-required 或 rejected/blocked task | 不执行，不生成可复用授权 token |
| `denied` / `blocked` | rejected/failed task + structured error | 保留 policy/gate reason code |
| `failed` | failed task + sanitized error | 不返回 provider raw body |
| `unknown` | failed or working-with-reconcile-required | 标记 unknown side-effect evidence |

Artifact 不能绕过 Result Envelope 的 sanitizer、size limit、resource delivery profile 或 data egress gate。大结果应使用 future resource delivery handle，而不是把 provider raw output 直接放进 A2A artifact。

## 安全不变量

- A2A Agent Card 不是 Trust Card。
- A2A AgentSkill 不是 Runtime policy rule。
- A2A task authorization 不等于 downstream provider authorization。
- Skill description、examples、tags、ranking 和 remote Agent selection 都不能改变 Runtime decision。
- 未安装、revoked、yanked 或 unresolved critical advisory Capability 不得作为普通 skill 暴露。
- A2A adapter 不能读取 env secret；只能调用 Runtime secret resolver。
- 所有跨 Agent 输入都必须按不可信输入处理。

## Evidence

Compatibility/evidence records 应新增：

```yaml
profile: opencap.a2a.agent_card_mapping.v1
adapter: a2a
a2a_spec_version: 0.3.0
opencap_commit: <git-sha>
test_date: 2026-05-14
result: pass | fail | draft | pending-smoke
checks:
  agent_card_valid_shape: pass
  skills_only_installed_capabilities: pass
  revoked_yanked_hidden: pass
  description_runtime_generated: pass
  security_no_downstream_token_passthrough: pass
  invocation_enters_runtime_pipeline: pass
known_gaps:
  - No A2A server implementation in V1.
```

Evidence 不得保存 A2A request body 原文、provider raw body、secret、Authorization header 或 private task artifacts。

## 测试计划

实现该 profile 前至少拆出：

- Agent Card mapping helper tests。
- Skill id escaping and collision tests。
- Lifecycle/advisory filtering tests。
- Model-visible metadata lint reuse tests。
- Security scheme mapping tests for remote runtime OAuth profile.
- A2A invocation adapter tests proving Runtime pipeline is called.
- Result Envelope to A2A artifact mapping tests.
- Compatibility record/evidence record tests.

## 非目标

- 不在 V1 实现 A2A server。
- 不实现 Agent planning、task decomposition 或 multi-agent collaboration。
- 不把 Capability package 转成 autonomous Agent。
- 不定义完整 remote runtime OAuth；T163 单独处理。
- 不定义 paid capability、commerce 或 marketplace listing。
- 不让 A2A artifact 投递绕过 Result Envelope。

## 迁移路径

1. 保持 V1 MCP/CLI Runtime 主路径不变。
2. 先实现纯 Agent Card mapping helper 和 snapshot tests。
3. 接入 lifecycle/advisory/trust/compatibility evidence references。
4. 等 T163 remote runtime auth profile 清晰后再设计 A2A adapter endpoint。
5. 只有完成真实 A2A client smoke 后，才允许记录 Host/profile compatible。

## 开放问题

- A2A adapter 是否只允许 remote runtime，不支持本地 stdio。
- Agent Card public card 与 authenticated extended card 如何分层。
- OpenCap-specific extension URI 是否需要注册或签名。
- Skill examples 是否应该只来自 registry tests。
- A2A task state 与 OpenCap unknown/reconcile-required 语义如何精确对齐。
