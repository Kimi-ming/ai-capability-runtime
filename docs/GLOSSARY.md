# 术语表

本文统一 OpenCap 文档中的核心术语，减少中文和英文混用造成的歧义。

## 核心术语

| 术语 | 中文解释 | 备注 |
| --- | --- | --- |
| Capability | 能力 | AI 可调用的真实行动单元。保留英文作为项目核心名词。 |
| Capability Manifest | 能力清单 | 描述 Capability 的标准文件，通常是 `manifest.yml`。 |
| Runtime | 运行时 | 安装、授权、执行和审计 Capability 的本地或自托管服务。 |
| Registry | 注册表 | Git-based Capability 条目集合。 |
| AI Host | AI 宿主 | ChatGPT、Claude、Cursor 或内部 Agent Host。 |
| Agent | 智能体 | 负责规划或调用工具的 AI 系统。OpenCap 不做 Agent。 |
| MCP | Model Context Protocol | Host 与工具/资源/提示交互的开放协议。 |
| Policy | 策略 | 决定调用 allow/ask/deny 的规则。 |
| Audit Log | 审计日志 | 每次调用的可追踪记录。 |
| Confirmation | 确认 | 对 `ask` 决策的人类确认流程。 |
| Executor | 执行器 | 真正执行 HTTP 请求或未来其他能力的模块。 |
| Secret Resolver | 密钥解析器 | 从 env 或未来 keychain 读取凭据的模块。 |
| Credential Reference | 凭据引用 | 指向 secret 来源的非敏感名称，例如 `GITHUB_TOKEN`。 |
| Token Passthrough | Token 透传 | 把发给一个资源的 token 转发给另一个资源使用，OpenCap 禁止这种行为。 |
| Elicitation | MCP 确认/补充信息机制 | MCP client 支持时可用于确认 `ask`。 |

## 文档用词约定

- `Capability`、`Runtime`、`Registry`、`MCP` 保留英文。
- “能力”可用于解释，但正式对象名仍写 `Capability`。
- “调用”指一次 invocation。
- “执行”指 executor 已触发外部动作。
- “拒绝”指 policy decision 为 `deny`。
- “阻塞”指需要确认但未确认，或缺少凭据/依赖。

## 避免使用

- 不把 OpenCap 称为 Agent 平台。
- 不把 Registry 称为 marketplace。
- 不把 Capability 称为 plugin，除非在对比其他生态。
