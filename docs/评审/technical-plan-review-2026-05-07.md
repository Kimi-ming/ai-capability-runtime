# 技术方案审查

日期：2026-05-07

审查范围：

- V1 需求
- V1 架构
- 权限模型
- Manifest schema
- MCP/runtime 包边界
- 示例 Registry Capabilities

审查立场：

OpenCap 的方向是成立的，但如果直接进入实现，会踩到协议和安全边界上的坑。主要风险不是“能不能写代码”，而是 V1 是否能在足够小的范围里兑现“安全能力运行时”的承诺。

## 结论

可以继续推进 V1，但必须带修正。

V1 仍然保持这个闭环：

```text
validate -> install -> serve --mcp -> policy -> execute HTTP -> audit
```

但在 GitHub issue demo 被视为可信之前，需要解决下面的问题。

## 发现的问题

### P0：MCP STDIO 下的 `ask` 确认机制不明确

当前方案要求写操作需要确认，`github.create_issue` 也声明了 `confirmation: ask`。产品方向是对的，但技术机制必须明确。

MCP Server 通过 STDIO 运行时，不能随意向 stdout 打印终端 prompt，否则可能破坏协议流。如果在 `opencap serve --mcp` 中直接用终端交互实现 `ask`，第一个写操作 demo 就可能不可用。

修正要求：

- V1 必须明确确认路径。
- 如果 MCP client 支持 elicitation，就通过 client 请求确认。
- 如果不支持，就返回结构化 `confirmation_required`，并且不执行。
- 终端 prompt 只允许在非 MCP CLI 流程中使用。

### P0：schema 声称支持 `mcp/local`，但执行字段只适合 HTTP

原 schema 允许 `type: http`、`type: mcp`、`type: local`，但 `execution.method`、`execution.url`、`execution.timeout_ms` 又始终必填。这只适合 HTTP Capability。

修正要求：

- V1 schema 收敛为只支持 `type: http`。
- `mcp` 和 `local` 留到后续 RFC。

该修正已经落实到 schema 和 TypeScript 类型。

### P1：URL 模板需要边界

HTTP executor 允许 URL 模板，例如：

```text
https://api.github.com/repos/{{owner}}/{{repo}}/issues
```

这对固定 Host API 是合理的。但 `http.request_demo` 接受完整用户 URL，如果没有 outbound policy，它就会变成宽泛网络请求工具。

修正要求：

- 区分固定 Host Capability 和用户提供 URL Capability。
- 审计日志记录最终 resolved URL。
- Registry 评审必须标记允许任意 URL 的 Capability。

### P1：审计日志脱敏规则太抽象

当前方案说日志应脱敏密钥，但 V1 需要最小确定规则。

修正要求：

- 默认脱敏 auth headers、env vars、token、secret、password、api_key、authorization。
- 被拒绝的调用也要写日志。
- 保存脱敏输入时，同时保存完整输入 hash。

### P1：`opencap install` 的解析规则不明确

当前需求说 `opencap install github.create_issue` 要解析本地 registry，但没有定义如何解析。

修正要求：

- V1 搜索 `registry/**/<capability-id>/manifest.yml`。
- 安装时复制完整 Capability 目录到 `opencap.local/installed/<capability-id>/`。
- 如果找到多个同名 id，安装失败。

### P1：MCP tool name 缺少冲突处理

当前映射是 `github.create_issue` -> `github_create_issue`，稳定但可能冲突。

修正要求：

- Runtime 启动时检测 tool name 冲突并 fail fast。
- 原始 Capability id 必须写入 tool metadata 和 audit logs。

### P2：实现顺序应先非 MCP 再 MCP

建议先做本地非 MCP 调用，再接 MCP。这样在调试 policy、audit、HTTP executor 时不用同时处理协议问题。

推荐第一个工程里程碑：

```text
opencap validate registry/developer-tools/github.create_issue
opencap install github.create_issue
opencap list
opencap invoke github.create_issue --dry-run
opencap logs
```

### P2：`secret_access` 语义需要收窄

Capability 使用 Runtime 提供的 API token 不等于它能读取密钥。`secret_access` 只表示 Capability 可以读取、返回、转换或暴露密钥材料。

## 被接受的技术方向

以下方向成立：

- local-first runtime
- Git-based registry
- manifest-first design
- V1 只支持 HTTP execution
- MCP bridge 作为 Host 接口
- policy before execution
- audit log 是核心能力
- 借鉴 OPA，但 V1 不引入 Rego
- 日志命名为未来 OpenTelemetry 留空间

## 实现前检查清单

进入 GitHub issue demo 前必须完成：

- 定义 MCP 和非 MCP 的确认行为
- 将 V1 schema 收敛到 HTTP-only
- 定义最小审计脱敏规则
- 定义本地 install 解析规则
- 定义 MCP tool name 冲突行为
- 将 `http.request_demo` 标记为 unsafe-by-default 示例
