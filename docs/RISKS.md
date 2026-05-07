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
| R002 | High | Open | HTTP request body 未设计，`github.create_issue` 无法真实发送正确 body | 设计 `execution.body` 或默认 body 策略 | T053 |
| R003 | High | Open | `http.request_demo` 接受任意 URL，可能变成 SSRF/内网探测工具 | 标记 unsafe-by-default；增加 outbound policy | T055, T091 |
| R004 | High | Open | 审计日志可能记录敏感输入或 token | redaction/hash helper；日志测试 | T041, T092 |
| R005 | Medium | Mitigated | schema 曾半支持 mcp/local，与 V1 实现范围不一致 | ADR 0005；schema 已收敛 HTTP-only | T003 |
| R006 | Medium | Open | 依赖未安装，pnpm workspace 可能首次 build/test 暴露问题 | M1 前安装依赖并提交 lockfile | T100 |
| R007 | Medium | Open | SQLite 作为 audit log 是否合适尚未正式决策 | 写 ADR 0006 | Q002 |
| R008 | Medium | Open | MCP SDK/Host 对 elicitation 支持不确定 | 技术 spike，确认 SDK 和目标 Host 行为 | T070, T073 |
| R009 | Medium | Open | CLI install 覆盖本地目录可能误删用户状态 | 默认拒绝覆盖，`--force` 明确确认 | T011 |
| R010 | Medium | Open | tool name 映射可能冲突 | 启动时 collision detection，保留原始 id | T021, T071 |
| R011 | Low | Open | 中文文档保留英文术语可能不统一 | 增加术语表 | T116 |
| R012 | Low | Open | 任务清单很长，维护成本升高 | 使用 traceability matrix 和 milestone gates 管理 | T111 |

## 当前最高优先级风险

1. R002：HTTP body 设计
2. R004：审计日志脱敏
3. R008：MCP elicitation 兼容性
4. R003：任意 URL 风险

## 风险处理规则

- High 风险不能无记录进入实现。
- 安全相关风险必须有测试或明确 non-goal。
- 被接受的风险必须写明原因。
- 风险关闭时要更新关联任务状态。
