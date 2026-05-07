# Traceability Matrix：需求-任务-测试追踪矩阵

本文把 V1 需求、开发任务和验证方式连起来，避免“做了任务但不知道满足了哪个需求”。

## 功能需求追踪

| 需求 | 来源 | 任务 | 验证 | 状态 |
| --- | --- | --- | --- | --- |
| F1 Manifest 校验 | `docs/SPEC.md` | T001, T002, T003 | `pnpm validate`, spec tests | 未完成 |
| F2 Capability 安装 | `docs/SPEC.md` | T010, T011, T020 | install smoke | 未完成 |
| F3 Capability 列表 | `docs/SPEC.md` | T012, T020 | list smoke | 未完成 |
| F4 策略评估 | `docs/SPEC.md` | T030, T031, T032, T033 | policy unit tests | 未完成 |
| F5 确认处理 | `docs/SPEC.md`, ADR 0004 | T032, T073 | CLI/MCP ask tests | 未完成 |
| F6 HTTP 执行 | `docs/SPEC.md` | T050, T051, T052, T053, T054, T055 | invoke dry-run + HTTP tests | 未完成 |
| F7 审计日志 | `docs/SPEC.md` | T040, T041, T042, T043 | log unit tests + smoke | 未完成 |
| F8 MCP Bridge | `docs/SPEC.md`, RFC 0003 | T021, T070, T071, T072, T073, T074 | MCP integration tests | 未完成 |

## 非功能需求追踪

| 非功能需求 | 任务 | 验证 | 状态 |
| --- | --- | --- | --- |
| 本地优先 | T010, T011, T020 | 临时 state dir tests | 未完成 |
| 默认权限约束 | T030, T031, T032 | policy tests | 未完成 |
| 可审计 | T040, T041, T042 | audit tests | 未完成 |
| 不泄露密钥 | T041, T090, T092 | redaction tests | 未完成 |
| MCP 协议不被污染 | T070, T071, T072, T073 | MCP STDIO tests | 未完成 |
| 可贡献 Registry | T004, T080, T081, T082 | CI + docs review | 未完成 |
| 可持续开发 | T110, T111 | check_docs.py | 已完成 |

## P0 技术审查项追踪

| 审查问题 | 决策/任务 | 当前处理 |
| --- | --- | --- |
| MCP STDIO 不能终端 prompt | ADR 0004, T032, T073 | 已决策，未实现 |
| V1 schema 半支持 mcp/local | ADR 0005, T002/T003 | schema 已收敛，测试未补齐 |
| URL 模板风险 | T050, T055, T091 | 未实现 |
| 审计脱敏太抽象 | T041, T092 | 未实现 |
| install 解析规则不明确 | T011 | 已写入任务，未实现 |
| tool name 冲突 | T021, T071 | 未实现 |

## 里程碑追踪

| 里程碑 | 覆盖需求 | 必须完成任务 |
| --- | --- | --- |
| M1 Manifest Validation | F1 | T001-T004 |
| M2 Local Install/List | F2, F3 | T010-T012, T020, T022 |
| M3 Policy + Audit | F4, F5, F7 | T030-T033, T040-T042 |
| M4 HTTP Invoke | F6 | T050-T055, T060-T062 |
| M5 MCP Bridge | F8 | T021, T070-T074 |
| M6 GitHub Demo | F1-F8 | M1-M5 全部完成 |
