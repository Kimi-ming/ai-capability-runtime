# V1 架构

OpenCap V1 是本地优先的 Runtime 和工具链。

## 系统边界

```text
MCP-compatible Host
        |
        | MCP tool list / tool call
        v
OpenCap MCP Bridge
        |
        v
OpenCap Runtime
  - Capability Loader
  - Input Validator
  - Policy Engine
  - Confirmation Handler
  - Secret Resolver
  - HTTP Executor
  - Audit Logger
        |
        v
External APIs
```

## 本地状态

V1 状态目录：

```text
opencap.local/
  installed/
    github.create_issue/
      manifest.yml
  policies.yml
  logs.sqlite
```

该目录不提交到 git。

## 包职责

### `@opencap/spec`

负责：

- manifest TypeScript 类型
- JSON Schema
- manifest validation

### `@opencap/cli`

负责：

- `opencap validate`
- `opencap install`
- `opencap list`
- `opencap invoke`
- `opencap serve --mcp`
- `opencap logs`

### `@opencap/runtime`

负责：

- 本地状态路径
- 已安装 Capability 加载
- 策略评估
- 确认流程协调
- 密钥解析
- 调用生命周期
- 审计日志

### `@opencap/mcp`

负责：

- 将 Capability manifest 映射成 MCP tools
- MCP server 生命周期
- 将 tool call 路由到 runtime invocation

### `@opencap/sdk`

V1 暂缓实现，不阻塞本地 Runtime。

## 调用生命周期

```text
1. Host 调用 MCP tool。
2. MCP bridge 将 tool name 映射回 Capability id。
3. Runtime 加载 manifest。
4. Runtime 校验输入。
5. Runtime 将权限声明交给 Policy Engine。
6. Policy Engine 返回 allow / ask / deny。
7. Confirmation Handler 处理 ask。
8. Runtime 解析密钥。
9. HTTP Executor 执行请求。
10. Runtime 校验或归一化输出。
11. Audit Logger 记录调用。
12. MCP bridge 返回结构化结果。
```

## Policy Engine V1

V1 使用简单 YAML 策略：

```yaml
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
```

设计上应保留未来接入 OPA/Rego 的空间。

## Audit Log V1

SQLite 日志字段：

```text
id
timestamp
host
channel
capability_id
capability_version
risk
decision
confirmation_status
status
duration_ms
input_hash
input_redacted_json
output_redacted_json
resolved_url
error
```

命名尽量方便未来映射到 OpenTelemetry。

## 安全约束

- 默认决策是 `ask`
- V1 不执行破坏性本地命令
- 密钥不得写入日志
- 所有外部请求必须有 timeout
- Runtime 必须在服务端校验输入
- 禁止 token passthrough
- MCP STDIO 模式不得使用终端 prompt

## 实现顺序

1. 实现 `opencap validate`
2. 实现 local install/list
3. 实现 policy engine
4. 实现 audit log
5. 实现 HTTP executor
6. 实现非 MCP `opencap invoke --dry-run`
7. 实现 MCP bridge
8. 跑通 GitHub issue demo
