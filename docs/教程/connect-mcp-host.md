# 连接 MCP Host 手动测试指南

本文说明如何把 OpenCap Runtime 作为本地 MCP stdio server 接入 Claude Desktop、Claude Code、Cursor 或其他 MCP Host，并手动验证 `tools/list`、`tools/call`、策略阻断和审计日志。

> 当前实现状态：截至 T070，`opencap serve --mcp` 已接入官方 MCP TypeScript SDK 并启动最小 stdio server。本文用于真实 Host smoke；未完成 smoke 前，Claude Desktop/Cursor 兼容结论仍保持 `pending-smoke`。

## 适用范围

本文适用于：

- 本地开发 OpenCap V1 Runtime 的维护者。
- 想验证 MCP Host 能否发现和调用 OpenCap Capability 的开发者。
- 需要排查 `confirmation_required`、policy 或审计日志行为的人。

本文不覆盖：

- 远程 HTTP/SSE MCP server 部署。
- OAuth 登录、token 采集或 Host 侧账号授权。
- MCP elicitation 表单。OpenCap V1 不生成 confirmation token。

## 前置条件

在项目根目录完成依赖安装和构建：

```bash
pnpm install
pnpm build
pnpm validate
```

准备一个本地状态目录并安装示例 Capability：

```bash
pnpm --filter @opencap/cli dev -- install github.create_issue --state-dir /tmp/opencap-mcp-smoke --force
pnpm --filter @opencap/cli dev -- install github.search_repo --state-dir /tmp/opencap-mcp-smoke --force
pnpm --filter @opencap/cli dev -- list --state-dir /tmp/opencap-mcp-smoke
```

期望能看到：

```text
github.create_issue 0.1.0 http write experimental enabled
github.search_repo 0.1.0 http read_only experimental enabled
```

## 启动命令

MCP Host 通过 stdio 启动本地 server。OpenCap V1 的目标启动命令是：

```bash
opencap serve --mcp --state-dir /tmp/opencap-mcp-smoke
```

本地开发时可以先通过 CLI workspace 命令启动 stdio server：

```bash
pnpm --filter @opencap/cli dev -- serve --mcp --state-dir /tmp/opencap-mcp-smoke
```

stdio server 的 stdout 只能承载 MCP JSON-RPC 消息。启动日志、warning 和 debug 必须写 stderr；如果 Host 报 JSON 解析错误，先检查是否有普通文本写入 stdout。

## 配置 Claude Desktop

Claude Desktop 使用 `mcpServers` 配置 stdio server。可在 Claude Desktop 的 MCP 配置中加入：

```json
{
  "mcpServers": {
    "opencap": {
      "type": "stdio",
      "command": "opencap",
      "args": ["serve", "--mcp", "--state-dir", "/tmp/opencap-mcp-smoke"],
      "env": {}
    }
  }
}
```

保存后重启 Claude Desktop。Host 启动 server 后，OpenCap 不应向 stdout 打印启动日志；stdout 只能承载 MCP 协议消息，调试信息必须写 stderr。

## 配置 Claude Code

Claude Code 支持通过命令管理 MCP server。OpenCap Runtime 实现后，可以添加本地 stdio server：

```bash
claude mcp add opencap -- opencap serve --mcp --state-dir /tmp/opencap-mcp-smoke
claude mcp list
claude mcp get opencap
```

如果需要项目级共享配置，也可以在项目根目录维护 `.mcp.json`：

```json
{
  "mcpServers": {
    "opencap": {
      "type": "stdio",
      "command": "opencap",
      "args": ["serve", "--mcp", "--state-dir", "/tmp/opencap-mcp-smoke"],
      "env": {}
    }
  }
}
```

## 配置 Cursor

Cursor 支持项目级 `.cursor/mcp.json` 或用户级 `~/.cursor/mcp.json`。OpenCap Runtime 实现后，可以写入：

```json
{
  "mcpServers": {
    "opencap": {
      "type": "stdio",
      "command": "opencap",
      "args": ["serve", "--mcp", "--state-dir", "/tmp/opencap-mcp-smoke"],
      "env": {}
    }
  }
}
```

保存后在 Cursor 的 MCP 设置页确认 `opencap` server 连接成功，再进入 Agent 模式调用工具。

## 验证 `tools/list`

Host 连接成功后，先确认 OpenCap 暴露的工具列表。

期望至少看到：

```text
github_create_issue
github_search_repo
```

`github_create_issue` 的工具描述应包含：

- 原始 Capability id：`github.create_issue`
- 权限摘要：`github.issue:create:write`
- 风险摘要：`Risk: write`
- `inputSchema` 来自 manifest 的 `input`
- metadata 中保留 `capabilityId`

如果 Host 看不到工具，先不要测试调用，直接查看本文的排障清单。

## 验证 `tools/call` allow

把 policy 改为允许只读 Capability：

```yaml
default: ask
rules:
  - id: allow-read-only
    match:
      risk: read_only
    decision: allow
```

保存到：

```text
/tmp/opencap-mcp-smoke/policies.yml
```

让 Host 调用 `github_search_repo`，传入示例参数。期望：

- 返回 `isError: false`。
- `structuredContent` 是 Runtime executor 返回的结构化结果。
- 审计日志出现 `status: executed`。

查看日志：

```bash
pnpm --filter @opencap/cli dev -- logs --state-dir /tmp/opencap-mcp-smoke --capability github.search_repo
```

## 验证 `tools/call` deny

把 policy 改为拒绝写操作：

```yaml
default: ask
rules:
  - id: deny-write
    match:
      risk: write
    decision: deny
```

让 Host 调用 `github_create_issue`。期望 MCP tool result：

```json
{
  "isError": true,
  "structuredContent": {
    "error": {
      "code": "POLICY_DENIED"
    }
  }
}
```

审计日志应记录：

- `status: denied`
- `policyDecision: deny`
- `confirmationStatus: denied`

## 验证 `confirmation_required`

把 policy 改为默认询问：

```yaml
default: ask
rules: []
```

让 Host 调用 `github_create_issue`。V1 没有 MCP elicitation 通道时，期望返回稳定结果：

```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Confirmation required before running capability github.create_issue. OpenCap V1 does not create confirmation tokens. Update policy in the CLI/Console or retry from a future MCP elicitation-capable host."
    }
  ],
  "structuredContent": {
    "error": {
      "code": "CONFIRMATION_REQUIRED",
      "message": "This capability requires human confirmation, but this MCP channel cannot prompt."
    },
    "metadata": {
      "capabilityId": "github.create_issue",
      "policyDecision": "ask",
      "retry": {
        "token": null,
        "hint": "OpenCap V1 does not create confirmation tokens. Update policy in the CLI/Console or retry from a future MCP elicitation-capable host."
      }
    }
  }
}
```

这个结果表示 Runtime 已安全停止，不是执行失败，也不是成功执行。V1 不生成 confirmation token；用户需要改 policy 后重试，或等待未来支持 MCP elicitation 的 profile。

审计日志应记录：

- `status: blocked`
- `policyDecision: ask`
- `confirmationStatus: confirmation_required`
- 不应出现真实外部 API 调用结果

## 排障清单

### Host 连接后没有工具

检查：

```bash
pnpm --filter @opencap/cli dev -- list --state-dir /tmp/opencap-mcp-smoke
pnpm validate
```

如果 `list` 没有能力，说明 state dir 没有安装 Capability。重新执行 `opencap install`。

### Host 提示 server 启动失败

检查启动命令是否可在普通终端运行：

```bash
opencap serve --mcp --state-dir /tmp/opencap-mcp-smoke
```

如果使用本地开发命令，Host 可能找不到 `pnpm` 或项目 cwd。优先使用已发布或已链接到 PATH 的 `opencap` 可执行文件。

### stdout 污染 MCP 协议

MCP stdio server 的 stdout 只能输出 MCP JSON-RPC 消息。启动日志、warning 和 debug 必须写 stderr。若 Host 报 JSON 解析错误，检查 server 是否向 stdout 打印了普通文本。

### `confirmation_required` 一直出现

这是 policy 的正常结果，不是 bug。处理方式：

- 对低风险能力增加 allow rule。
- 对写操作使用 CLI/Console 人工确认路径。
- 等未来 MCP elicitation profile 支持后，在 Host 内完成确认。

不要通过把 token 或 API key 放进 tool input 来绕过确认。

### 找不到审计日志

默认 state dir 是当前工作目录下的 `opencap.local`。如果 Host 使用了 `--state-dir /tmp/opencap-mcp-smoke`，日志位于：

```text
/tmp/opencap-mcp-smoke/logs.sqlite
```

用 CLI 查看：

```bash
pnpm --filter @opencap/cli dev -- logs --state-dir /tmp/opencap-mcp-smoke --limit 20
```

### manifest 或 policy 有错误

先运行：

```bash
pnpm validate
pnpm --filter @opencap/cli dev -- doctor --state-dir /tmp/opencap-mcp-smoke
```

`doctor` 应能报告 installed capability、invalid entries 和 policy 状态。

## 手动测试记录模板

```text
日期：
Host：Claude Desktop / Claude Code / Cursor / Other
OpenCap commit：
state dir：
已安装 Capability：

验证结果：
- tools/list：通过 / 失败
- allow call：通过 / 失败
- deny call：通过 / 失败
- confirmation_required：通过 / 失败
- audit log：通过 / 失败

问题与证据：
```

## 参考资料

- [Claude Code MCP 文档](https://docs.claude.com/en/docs/claude-code/mcp)
- [Claude Agent SDK MCP 配置](https://docs.claude.com/en/docs/agent-sdk/mcp)
- [Cursor MCP 文档](https://docs.cursor.com/advanced/model-context-protocol)
- [OpenCap MCP 接口 V1](../设计/mcp-interface-v1.md)
- [OpenCap 本地状态 V1](../设计/local-state-v1.md)
