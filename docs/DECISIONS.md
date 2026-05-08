# 架构决策索引

本文索引 OpenCap 的关键决策。详细内容见 `docs/decisions/`。

## 已接受决策

| 编号 | 标题 | 状态 | 影响 |
| --- | --- | --- | --- |
| 0001 | 开源定位 | 已接受 | OpenCap 做 Capability Runtime 和治理层，不做 Agent 平台。 |
| 0002 | 本地优先 Runtime | 已接受 | V1 从本地运行和本地状态开始。 |
| 0003 | 执行前必须经过策略 | 已接受 | 所有调用先 policy 后 executor。 |
| 0004 | MCP 确认策略 | 已接受 | MCP STDIO 不使用终端 prompt。 |
| 0005 | V1 只支持 HTTP Capability | 已接受 | schema 和 Runtime V1 只承认 `type: http`。 |
| 0006 | V1 审计日志使用 SQLite | 已接受 | SQLite 作为本地默认审计日志存储。 |
| 0007 | Capability 生命周期治理 | 已接受 | 用生命周期状态串联标准、Registry、Runtime 和审计。 |
| 0008 | HTTP body 与 API key placement | 已接受 | V1 支持 JSON body 模板和显式 auth placement。 |
| 0009 | Policy DSL V1 | 已接受 | 使用顶层 `default/rules`，规则按顺序匹配。 |
| 0010 | 审计不可用时的执行策略 | 已接受 | 非只读调用审计不可用时不执行。 |
| 0011 | 最小 Outbound Policy | 已接受 | 阻断私网/localhost/metadata，用户输入 host 需显式允许。 |
| 0012 | Registry Test Format V1 | 已接受 | `tests/*.yml` 使用 validate/dry_run 格式。 |
| 0013 | 本地状态和配置路径 | 已接受 | state dir 使用 flag/env/cwd 优先级。 |
| 0014 | MCP Interface V1 | 已接受 | V1 只实现 tools，确认不可用返回 `confirmation_required`。 |
| 0015 | 错误模型 V1 | 已接受 | CLI/Runtime/MCP 使用统一错误分类。 |
| 0016 | V1 可观测性边界 | 已接受 | V1 只做本地 audit log，不默认上传遥测。 |
| 0017 | 开源核心与未来 Cloud 边界 | 已接受 | OSS 核心必须独立运行，Cloud 只能增强。 |
| 0018 | RFC 与社区治理流程 | 已接受 | 大型设计变化走 RFC，接受后进入 ADR。 |
| 0019 | 版本和兼容性策略 | 已接受 | `0.x` 也记录 breaking changes，1.0 后按 SemVer。 |
| 0020 | 包发布和 Provenance 策略 | 已接受 | 优先 npm trusted publishing 和 provenance。 |
| 0021 | Registry 分发模型 | 已接受 | V1 Git-based，本地 install 不做远程下载。 |
| 0022 | SDK 和 Adapter 边界 | 已接受 | SDK/adapters 不阻塞 V1，不绕过治理管线。 |
| 0023 | Consent 是 Runtime 拥有的可审计对象 | 已接受 | ask 必须产生 consent request/receipt。 |
| 0024 | 兼容性声明必须绑定 Interoperability Profile | 已接受 | profile、Host、版本和证据一起记录。 |
| 0025 | Capability Package V1 使用目录契约 | 已接受 | registry package 必须有 manifest、README、tests。 |
| 0026 | Agentic 风险必须映射为控制和测试 | 已接受 | 高优先级风险进入 negative tests/conformance。 |
| 0027 | V1 只实现 env-based downstream credentials | 已接受 | Secret Resolver V1 只读声明 env var。 |
| 0028 | 禁止 token passthrough | 已接受 | Host/client/input token 不能作为下游 provider token。 |
| 0029 | 远程 Runtime OAuth 必须走新 Profile | 已接受 | remote runtime auth 不能复用 V1 env 模型。 |
| 0030 | V1 不自动重试非幂等写操作 | 已接受 | POST/PATCH 写操作默认 max attempts 为 1。 |
| 0031 | 请求发出后的超时是未知结果 | 已接受 | timeout after request 记录为 `unknown_after_timeout`。 |
| 0032 | V1 不内置 Workflow Runtime | 已接受 | OpenCap 保持能力治理层，不做工作流引擎。 |
| 0033 | 组合中的每一步都必须独立 Policy、Consent、Audit | 已接受 | compositionId/planHash 只作为 evidence。 |
| 0034 | Compensation 是独立 Capability，不是隐式 Rollback | 已接受 | 补偿动作需要独立 manifest 和确认。 |
| 0035 | Trust Level 是证据摘要，不是 Policy | 已接受 | trust 不能覆盖本地 policy 或确认。 |
| 0036 | Revoked Capability 必须保留可寻址记录 | 已接受 | revoked 记录保留，默认隐藏但可查询。 |
| 0037 | Quality Score 不能绕过风险 | 已接受 | 分数只解释成熟度，不改变执行策略。 |
| 0038 | Usage Event 不是账单记录 | 已接受 | 本地 usage 用于观察和限额，不直接计费。 |
| 0039 | Quota/Budget Gate 必须在 Secret Resolution 前运行 | 已接受 | 超额调用不解析 secret、不执行。 |
| 0040 | Commerce Profile 是未来边界，不进入 V1 主路径 | 已接受 | paid capability/支付/结算走 future RFC。 |
| 0041 | MCP Tool Projection 由 Runtime 拥有 | 已接受 | tools/list metadata 由 Runtime 模板生成，不原样透传第三方文本。 |
| 0042 | 模型可见元数据是安全表面 | 已接受 | description/schema/result 文本进入 lint 和安全测试。 |
| 0043 | 发现和选择不是授权 | 已接受 | discovery/selection evidence 不能绕过 Runtime policy。 |
| 0044 | Result Envelope 是 Runtime 输出边界 | 已接受 | provider response 先经过验证、脱敏、净化和 evidence，再适配 MCP/CLI。 |
| 0045 | Output Schema 校验通过后才能暴露 Success | 已接受 | 声明 output schema 时，structured output 必须验证后才成功。 |
| 0046 | Provider Raw Output 默认不进入模型上下文 | 已接受 | `content[].text` 默认使用 Runtime summary，不直接透传 provider 原文。 |
| 0047 | Data Egress Gate 必须在 Secret Resolution 前运行 | 已接受 | egress deny 不解析 secret、不执行请求。 |
| 0048 | Tool Input 分类前视为不可信数据 | 已接受 | schema validation 后仍需分类、最小化和外发审查。 |
| 0049 | 数据最小化由 Runtime 拥有 | 已接受 | 只发送 execution mapping 引用字段，不自动外发整个 input。 |
| 0050 | Policy Decision 必须产生 Trace | 已接受 | 每个策略或 gate 决策都要可解释、可审计、可脱敏追踪。 |
| 0051 | Policy 变更是可审计本地对象 | 已接受 | 策略激活、回滚和覆盖必须保留 revision、digest 和 change record。 |
| 0052 | Broad Allow 需要模拟和差异评估 | 已接受 | ask/deny 变 allow 以及高风险 broad allow 必须先产生 simulation finding。 |
| 0053 | Breakglass 不得绕过审计和硬安全边界 | 已接受 | 紧急通道不能绕过 egress deny、outbound block、secret ordering 或 revoked block。 |

## 下一批需要决策的问题

- 0054：OpenAPI adapter 的人工 review 边界。
- 0055：Registry index signing 具体格式。
- 0056：MCP elicitation profile 是否进入 v0.2。
- 0057：macOS Keychain / external vault provider 是否进入 v0.2。
- 0058：Idempotency-Key manifest field 是否进入 v0.2。
- 0059：Composition profile 是否进入 v0.3。
- 0060：Advisory YAML 是否映射 OSV。
- 0061：Paid capability manifest 是否进入 v0.3。
- 0062：Organization data policy 是否进入 v0.2。

## 决策写法

新决策放在 `docs/decisions/NNNN-title.md`，包含：

- 日期
- 状态
- 背景
- 决策
- 影响
