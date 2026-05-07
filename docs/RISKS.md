# RISKS：风险登记

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
| R006 | Medium | Open | 依赖未安装，pnpm workspace 可能首次 build/test 暴露问题 | M1 前安装依赖并提交 lockfile | T100 |
| R007 | Medium | Mitigated | SQLite 作为 audit log 是否合适尚未正式决策 | ADR 0006 已接受；V1 使用 SQLite | T040, T042 |
| R008 | Medium | Open | MCP SDK/Host 对 elicitation 支持不确定 | 技术 spike，确认 SDK 和目标 Host 行为 | T070, T073 |
| R009 | Medium | Open | CLI install 覆盖本地目录可能误删用户状态 | 默认拒绝覆盖，`--force` 明确确认 | T011 |
| R010 | Medium | Open | tool name 映射可能冲突 | 启动时 collision detection，保留原始 id | T021, T071 |
| R011 | Low | Open | 中文文档保留英文术语可能不统一 | 增加术语表 | T116 |
| R012 | Low | Open | 任务清单很长，维护成本升高 | 使用 traceability matrix 和 milestone gates 管理 | T111 |
| R013 | Medium | Open | Capability 生命周期没有落入 CLI 输出，后续可能退化成目录项目 | `docs/product/capability-lifecycle.md`；后续实现 Trust Card/List 字段 | T125 |
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

## 当前最高优先级风险

1. R004：审计日志脱敏实现
2. R003：任意 URL/outbound policy 实现
3. R019：确认摘要和 consent receipt 实现
4. R008：MCP elicitation 兼容性
5. R023：token passthrough 禁止的实现验证
6. R024：Secret Resolver 调用顺序验证
7. R006：依赖安装和 workspace 构建验证

## 风险处理规则

- High 风险不能无记录进入实现。
- 安全相关风险必须有测试或明确 non-goal。
- 被接受的风险必须写明原因。
- 风险关闭时要更新关联任务状态。
