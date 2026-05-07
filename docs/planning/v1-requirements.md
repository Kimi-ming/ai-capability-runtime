# V1 需求

OpenCap V1 是 capability runtime 模型的本地优先验证版。

## 产品假设

AI Host 和 Agent 需要一种受控方式调用真实世界能力。

有价值的开源层不是另一个 Agent，也不是另一个目录，而是可以安装、授权、执行、验证和审计 Capability 的本地 Runtime。

## 目标用户

### 主要用户

构建 AI Agent、ChatGPT Apps、Claude/Cursor 工作流或企业内部自动化 Host 的开发者。

### 次要用户

希望用 Git-based Registry 和评审流程管理 AI-callable tools 的开源维护者和平台团队。

## V1 用户故事

### 开发者定义 Capability

开发者可以写一个 `manifest.yml` 描述 HTTP Capability，包括输入、输出、认证、权限、执行和元数据。

验收标准：

- manifest 能通过 `manifest.schema.json` 校验
- 校验错误能指出具体字段
- schema 明确只支持 V1 的 `http` Capability

### 开发者安装 Capability

开发者可以把 registry 中的 Capability 安装到本地 OpenCap Runtime。

验收标准：

- `opencap install github.create_issue` 能解析本地 registry 条目
- 已安装 manifest 存到 `opencap.local/installed`
- `opencap list` 能显示已安装 Capability

### Host 通过 MCP 调用 Capability

AI Host 用户可以配置一个 OpenCap MCP Server，并看到已安装 Capability 作为工具。

验收标准：

- `opencap serve --mcp` 启动本地 MCP server
- 已安装 Capability 暴露为 MCP tools
- MCP tool input schema 来自 manifest
- tool name 稳定且冲突时 fail fast

### Runtime 执行策略判断

用户可以定义本地策略，让只读操作自动允许，让写操作需要确认。

验收标准：

- 默认策略是 `ask`
- `read_only` 可配置为 `allow`
- `write` 可配置为 `ask`
- `deny` 的调用不执行
- `ask` 在 MCP 模式下不使用终端 prompt

### Runtime 执行 HTTP Capability

Host 可以调用已安装 HTTP Capability，并得到结构化输出。

验收标准：

- 执行前校验输入
- URL 模板变量来自已校验输入
- API key 可从环境变量读取
- 请求有 timeout
- 结果尽量归一化为 JSON

### Runtime 写入审计日志

用户可以查看 Capability 被谁调用、策略如何决策、执行是否成功。

验收标准：

- 每次调用写入日志
- 日志包含 capability id、version、timestamp、policy decision、status、duration
- 日志脱敏密钥和敏感字段
- `opencap logs` 显示近期调用

## V1 非目标

- 托管云 Runtime
- 多租户账户体系
- 支付
- 完整 OAuth 实现
- 任意本地命令执行
- Console 浏览器 UI
- A2A server 实现
- marketplace 排名或搜索
- 签名验证
- 企业 RBAC

## V1 Demo

```text
安装 github.create_issue。
启动 opencap serve --mcp。
连接 MCP-compatible Host。
让 Host 创建一个 GitHub issue。
OpenCap 校验输入、请求确认、调用 GitHub API，并记录审计日志。
```

## 成功标准

开发者能 clone 仓库、安装依赖、校验示例 Capability、运行本地 MCP Runtime，并成功执行一个真实写操作 Capability，同时看到审计日志。
