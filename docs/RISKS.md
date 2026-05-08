# 风险登记

本文记录 OpenCap V1 的主要产品、技术和安全风险。风险不能只存在聊天记录里，必须进入本文档。

## 风险等级

- High：可能阻塞 V1 或破坏安全承诺
- Medium：可能造成延期、返工或用户体验问题
- Low：需要注意但不影响主路径

## 风险状态

- Open：尚未缓解
- Mitigating：正在缓解
- Mitigated：已有缓解措施
- Accepted：明确接受风险
- Closed：风险消失

## 风险列表

| ID | 等级 | 状态 | 风险 | 缓解措施 | 关联任务 |
| --- | --- | --- | --- | --- | --- |
| R001 | High | Mitigating | MCP STDIO 下 `ask` 如果用终端 prompt 会破坏协议 | ADR 0004；MCP 无 elicitation 时返回 `confirmation_required` | T032, T073 |
| R002 | High | Mitigated | HTTP request body 未设计，`github.create_issue` 无法真实发送正确 body | ADR 0008；`execution.body.fields` 已写入设计和示例 manifest | T053 |
| R003 | High | Mitigating | `http.request_demo` 接受任意 URL，可能变成 SSRF/内网探测工具 | ADR 0011；新增 outbound policy 文档，待实现阻断 | T055, T091 |
| R004 | High | Mitigating | 审计日志可能记录敏感输入或 token | 新增 Audit Log V1 设计，待实现 redaction/hash 测试 | T041, T092 |
| R005 | Medium | Mitigated | schema 曾半支持 mcp/local，与 V1 实现范围不一致 | ADR 0005；schema 已收敛 HTTP-only | T003 |
| R006 | Medium | Mitigated | 依赖未安装，pnpm workspace 可能首次 build/test 暴露问题 | 已创建 conda 环境、安装依赖并提交 lockfile；`pnpm build` 和 `pnpm test` 通过，`pnpm validate` 的 AJV 问题归入 T001 | T100, T001 |
| R007 | Medium | Mitigated | SQLite 作为 audit log 是否合适尚未正式决策 | ADR 0006 已接受；V1 使用 SQLite | T040, T042 |
| R008 | Medium | Open | MCP SDK/Host 对 elicitation 支持不确定 | 技术 spike，确认 SDK 和目标 Host 行为 | T070, T073 |
| R009 | Medium | Open | CLI install 覆盖本地目录可能误删用户状态 | 默认拒绝覆盖，`--force` 明确确认 | T011 |
| R010 | Medium | Open | tool name 映射可能冲突 | 启动时 collision detection，保留原始 id | T021, T071 |
| R011 | Low | Open | 中文文档保留英文术语可能不统一 | 增加术语表 | T116 |
| R012 | Low | Open | 任务清单很长，维护成本升高 | 使用 traceability matrix 和 milestone gates 管理 | T111 |
| R013 | Medium | Open | Capability 生命周期没有落入 CLI 输出，后续可能退化成目录项目 | `docs/产品/capability-lifecycle.md`；后续实现 Trust Card/List 字段 | T125 |
| R014 | High | Mitigated | 审计日志写入失败时是否阻断写操作未实现，可能导致不可追踪执行 | ADR 0010：非只读调用审计不可用时不执行 | T040, T128 |
| R015 | Medium | Mitigated | 外部贡献者不知道如何提交 Capability，导致 Registry 难以扩展 | 贡献者路径、Capability Review Checklist、GitHub templates | T141 |
| R016 | Medium | Mitigating | Host 行为差异导致 MCP demo 在不同 Host 上不一致 | Host compatibility matrix，后续维护测试记录 | T127, T142 |
| R017 | Medium | Mitigated | 未来 Cloud 边界不清会削弱开源信任 | ADR 0017；open-core boundary 文档 | T120 |
| R018 | Low | Mitigated | 默认远程遥测会破坏 local-first 预期 | ADR 0016：V1 默认不上传遥测 | T143 |
| R019 | High | Mitigating | 确认文案如果由模型或 Host 自由生成，用户可能被误导授权 | ADR 0023；Runtime-owned consent summary 和 receipt | T152, T155 |
| R020 | Medium | Mitigating | 泛泛声明兼容 MCP/Host 可能导致用户误判可用性 | ADR 0024；Interoperability profiles 和 evidence records | T153, T154 |
| R021 | Medium | Mitigating | Registry package 只有 manifest，缺少 README/tests 会降低 review 质量 | ADR 0025；Capability Package V1 目录契约 | T151, T158 |
| R022 | High | Mitigating | Agentic AI 风险停留在文档层，未转化为测试会造成安全承诺落空 | ADR 0026；Agentic risk mapping 和 conformance negative tests | T128, T155 |
| R023 | High | Mitigating | Host/client/input token 被误用为下游 provider token | ADR 0028；token passthrough negative tests | T090, T159, T164 |
| R024 | High | Mitigating | Secret Resolver 在 deny/ask 未确认前读取凭据 | ADR 0027；resolver ordering tests | T159, T164 |
| R025 | Medium | Mitigating | Capability 请求过宽 provider 权限，用户难以判断 | least-privilege review；provider permission mapping | T161, T165 |
| R026 | Medium | Mitigating | 未来 remote runtime 复用本地 env 假设导致 OAuth 边界混乱 | ADR 0029；remote OAuth profile RFC | T163 |
| R027 | High | Mitigating | 非幂等写操作自动 retry 导致重复副作用 | ADR 0030；retry/idempotency tests | T169, T170 |
| R028 | High | Mitigating | 请求已发出后 timeout 被误报为未执行 | ADR 0031；unknown outcome audit tests | T168 |
| R029 | Medium | Mitigating | 执行失败缺少 provider request id、retryAttempt、outcome 等证据 | execution evidence 文档；audit 字段扩展 | T167, T173 |
| R030 | High | Mitigating | OpenCap 误扩展成 Workflow/Agent Builder，削弱能力层定位 | ADR 0032；composition boundary | T176 |
| R031 | High | Mitigating | 组合级确认绕过单步高风险确认 | ADR 0033；step-level consent tests | T177 |
| R032 | High | Mitigating | compensation 被误认为自动 rollback，造成错误安全预期 | ADR 0034；composition failure runbook | T182, T183 |
| R033 | Medium | Mitigating | 能力组合造成风险放大但 registry review 看不见 | capability graph；risk amplification checklist | T179, T180 |
| R034 | High | Mitigating | 恶意或危险 Capability 被删除历史后，用户无法判断是否受影响 | ADR 0036；revocation metadata | T188, T189 |
| R035 | High | Mitigating | Trust level 被误用为自动放行依据 | ADR 0035；score/trust cannot override policy tests | T185, T196 |
| R036 | Medium | Mitigating | 发现能力漏洞后没有私密报告和公告流程 | capability advisory process；SECURITY.md 对齐 | T187, T190 |
| R037 | Medium | Mitigating | Quality Score 被误解为安全认证或商业排名 | ADR 0037；quality score docs | T194, T195 |
| R038 | High | Mitigating | 模型循环调用导致 API 配额耗尽或外部刷屏 | quota/budget/rate limit gate | T199, T201 |
| R039 | High | Mitigating | Usage event 被误当账单记录，引入错误商业和合规语义 | ADR 0038；commerce boundary | T198, T205 |
| R040 | High | Mitigating | 超额调用仍解析 secret 或执行请求 | ADR 0039；quota gate tests | T199, T204 |
| R041 | High | Mitigating | paid capability/agentic commerce 提前混入 V1 主路径 | ADR 0040；commerce profile RFC | T202, T203 |
| R042 | High | Mitigating | 恶意 tool description 诱导模型绕过用户意图或安全策略 | ADR 0041/0042；tool projection 和 metadata lint | T209, T210, T211 |
| R043 | High | Mitigating | schema description 要求模型填入 token/secret，造成凭据泄露 | model-visible metadata lint；secret exfiltration negative tests | T210, T211 |
| R044 | Medium | Mitigating | discovery/ranking 被误当作 trust 或授权来源 | ADR 0043；discovery boundary | T214, T215 |
| R045 | Medium | Mitigating | tool result text 带有间接 prompt injection，污染后续模型上下文 | prompt-surface security；result sanitizer 草案 | T217 |
| R046 | High | Mitigating | Provider raw output 直接进入模型上下文，造成 result poisoning | ADR 0046；Result Envelope + sanitizer | T220, T223, T229 |
| R047 | High | Mitigating | Output schema mismatch 仍被标记 success，导致后续模型基于错误结构行动 | ADR 0045；output validation tests | T221, T054 |
| R048 | Medium | Mitigating | MCP Host 不保留 structuredContent，只把 text summary 给模型 | result delivery boundary；Host result compatibility records | T222, T226 |
| R049 | High | Mitigating | Tool result 泄露 secret-like 字段到 MCP result 或 audit | result sanitizer；redaction/provenance tests | T223, T224, T230 |
| R050 | Medium | Mitigating | 过大 provider response 污染上下文或造成成本/内存问题 | result limits；oversized result handling | T225 |
| R051 | High | Mitigating | 模型生成 input 把 PII/客户数据/源码静默外发到第三方 provider | input governance；data egress gate | T234, T236, T238 |
| R052 | High | Mitigating | ordinary input 中的 secret-like value 被当作业务字段发送 | data classification；egress deny before secret | T234, T235, T236 |
| R053 | Medium | Mitigating | 未被 execution mapping 使用的 input 字段被整体 body 外发 | data minimization；field-level egress map | T240, T242 |
| R054 | Medium | Mitigating | 用户确认时看不到将外发的数据类别和目标 provider | confirmation summary data classes | T238, T243 |
| R055 | High | Mitigating | internal URL/source/config 通过普通字段外发，造成内部信息泄露 | data classification + outbound policy | T235, T236, T245 |
| R056 | High | Mitigating | 最终 allow/deny 缺少 decision trace，导致无法解释或取证 | Policy Decision Trace V1；audit 保存 redacted trace | T249, T250, T259 |
| R057 | High | Mitigating | policy 文件静默变更放宽权限，用户无法知道影响范围 | Policy lifecycle/change ledger；activation digest | T251, T252 |
| R058 | High | Mitigating | ask/deny 被改为 broad allow，写入、外发或金融动作静默放开 | Policy simulation/diff；broad allow safety checks | T253, T254, T260 |
| R059 | High | Mitigating | override/breakglass 变成无审计后门 | Override record、短过期时间、硬安全边界不可绕过 | T255, T258, T260 |
| R060 | Medium | Mitigating | future policy bundle 激活失败覆盖当前 active policy | lifecycle activation record；failed activation 不替换 active revision | T256 |
| R061 | Medium | Mitigating | 整体设计越来越完整，但实现主路径仍未跑通，可能形成纸面架构膨胀 | 保持 T001 为下一优先级；T267-T276 只作为契约补强并绑定验证产物 | T001, T267-T276 |

## 当前最高优先级风险

1. R004：审计日志脱敏实现
2. R003：任意 URL/outbound policy 实现
3. R019：确认摘要和 consent receipt 实现
4. R008：MCP elicitation 兼容性
5. R023：token passthrough 禁止的实现验证
6. R024：Secret Resolver 调用顺序验证
7. R028：timeout unknown outcome 审计语义
8. R031：组合级确认绕过单步确认
9. R034：revoked capability 可寻址和本地提示
10. R038：模型循环调用和额度耗尽
11. R042：恶意 tool description 和 schema poisoning
12. R046：provider raw output 直接进入模型上下文
13. R047：output schema mismatch 被误报 success
14. R051：模型生成 input 静默外发敏感数据
15. R052：ordinary input 中的 secret-like value 被发送
16. R056：策略决策缺少可解释 trace
17. R058：broad allow 静默放开高风险操作
18. R059：override/breakglass 变成无审计后门
19. R006：依赖安装和 workspace 构建验证（已缓解，剩余 validate 问题归入 T001）
20. R061：整体设计完整但实现主路径滞后

## 风险处理规则

- High 风险不能无记录进入实现。
- 安全相关风险必须有测试或明确 non-goal。
- 被接受的风险必须写明原因。
- 风险关闭时要更新关联任务状态。
