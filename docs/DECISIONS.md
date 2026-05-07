# DECISIONS：架构决策索引

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

## 下一批需要决策的问题

- 0019：版本签名和 npm provenance 策略。
- 0020：OpenAPI adapter 的人工 review 边界。
- 0021：未来远程 Runtime 的 OAuth authorization 边界。

## 决策写法

新决策放在 `docs/decisions/NNNN-title.md`，包含：

- 日期
- 状态
- 背景
- 决策
- 影响
