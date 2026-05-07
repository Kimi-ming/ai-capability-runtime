# 权限模型

OpenCap 假设 AI 驱动的行动默认必须受权限约束。

Runtime 在执行 Capability 前，必须知道它可能做什么、风险是什么、是否需要确认。

## 风险类型

| 风险 | 含义 |
| --- | --- |
| `read_only` | 只读取数据，不改变外部状态。 |
| `write` | 创建或更新外部状态。 |
| `external_send` | 向用户边界外发送消息或内容。 |
| `destructive` | 删除、覆盖或执行难以恢复的操作。 |
| `financial` | 付款、扣费、交易、购买或订阅。 |
| `code_execution` | 执行本地或远程代码/命令。 |
| `secret_access` | 读取、返回、转换或暴露密钥材料。 |

普通 API 调用中 Runtime 使用凭据，不等于 Capability 拥有 `secret_access`。

## 决策

策略引擎返回：

- `allow`
- `ask`
- `deny`

V1 默认策略是 `ask`。

## 策略示例

```yaml
policies:
  default: ask

  rules:
    - match:
        risk: read_only
      decision: allow

    - match:
        risk: write
      decision: ask

    - match:
        risk: destructive
      decision: deny

    - match:
        risk: financial
      decision: ask
      require_human_confirmation: true
```

## 确认机制

确认信息应展示：

- Capability 名称
- 风险等级
- 目标资源
- 输入摘要
- 策略原因
- 可选决策

示例：

```text
AI wants to call github.create_issue

Capability: Create GitHub Issue
Risk: write
Target: github.issue

Input:
- repo: opencap/opencap
- title: Add runtime permission engine

[Allow once] [Always allow this Capability] [Deny]
```

## MCP 模式下的限制

`opencap serve --mcp` 运行在 STDIO 时，不能随意输出终端 prompt，否则可能破坏 MCP 协议流。

因此 V1 规则是：

- MCP client 支持 elicitation 时，可以通过 MCP 请求确认。
- 不支持时，返回结构化 `confirmation_required`，并且不执行。
- 只有非 MCP CLI 流程可以使用终端 prompt。

## 审计要求

每次调用必须记录：

- 时间
- Host 标识（如可获得）
- Capability id 和版本
- 输入 hash 或脱敏输入
- 策略决策
- 确认结果
- 执行结果
- 耗时
- 错误信息
