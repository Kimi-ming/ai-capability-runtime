# Runtime 架构

OpenCap Runtime 是执行已安装 Capability 的本地或自托管服务。

## 高层流程

```text
AI Host
  |
MCP / HTTP / SDK
  |
OpenCap Runtime
  |
Policy Engine
Secret Resolver
Capability Executor
Audit Logger
  |
External APIs / MCP Servers / Databases / SaaS Tools
```

## Runtime 职责

Runtime 必须：

- 加载已安装 Capability
- 将它们暴露为 MCP tools
- 校验输入
- 执行权限策略
- 读取限定作用域的密钥
- 执行 Capability
- 校验或归一化输出
- 写入调用日志
- 返回结构化结果

## 组件

### Capability Loader

从本地安装目录读取 manifest，并用 OpenCap schema 校验。

### MCP Gateway

将每个已安装 Capability 暴露成 MCP tool。工具名由 Capability id 稳定生成。

### Policy Engine

将权限声明和本地策略规则匹配，返回 `allow`、`ask` 或 `deny`。

### Confirmation Handler

处理 `ask` 决策。MCP 模式下不能直接终端交互；如果 client 不支持 elicitation，应返回 `confirmation_required`。

### Secret Resolver

从允许的位置读取凭据。V1 可以先支持环境变量；后续再支持系统 Keychain 或 Secret Vault。

### HTTP Executor

执行 V1 的 HTTP Capability。

### Audit Logger

把每次调用写入本地 SQLite。CLI 和 Console 都应能查询这些日志。

## 本地状态

V1 使用本地目录：

```text
opencap.local/
  installed/
  policies.yml
  logs.sqlite
  secrets/
```

`opencap.local/` 不应提交到 git。
