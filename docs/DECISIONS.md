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

## 下一批需要决策的问题

- 0008：`opencap.local/` 默认路径是否可配置？
- 0009：Policy 文件格式是否使用顶层 `default/rules` 还是 `policies.default/rules`？
- 0010：HTTP body 模板如何声明？
- 0011：Registry test format 的稳定字段。
- 0012：MCP elicitation 兼容策略。

## 决策写法

新决策放在 `docs/decisions/NNNN-title.md`，包含：

- 日期
- 状态
- 背景
- 决策
- 影响
