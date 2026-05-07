# SPEC：OpenCap V1 产品规格

本文是 V1 实现时的产品正确性入口。更详细的历史文档见 `docs/planning/v1-requirements.md`。

## 一句话定义

OpenCap V1 是一个本地优先的 Capability Runtime，让 AI Host 能通过 MCP 安全调用已安装的 HTTP Capability，并记录权限决策和审计日志。

## V1 成功闭环

```text
manifest.yml
  -> opencap validate
  -> opencap install
  -> opencap list
  -> opencap invoke --dry-run
  -> opencap logs
  -> opencap serve --mcp
  -> AI Host 调用 github_create_issue
  -> OpenCap policy/confirmation/audit
```

## 核心用户

### AI 应用开发者

需要把外部 API 安全暴露给 ChatGPT、Claude、Cursor 或内部 Agent。

### 开源 Capability 维护者

需要用 Git-based Registry 发布可验证、可审计、可评审的 Capability。

### 平台/安全工程师

需要知道 AI 能调用什么、调用前怎么授权、调用后怎么审计。

## V1 范围

V1 必须包含：

- HTTP-only Capability Manifest schema
- manifest validation
- 本地 registry install/list
- 本地 policy 解析和评估
- 非 MCP invoke dry-run
- HTTP executor
- audit log
- MCP tool 暴露
- GitHub issue demo

V1 不包含：

- 完整 OAuth flow
- 托管 cloud runtime
- 多租户
- 支付
- 任意本地命令执行
- Console UI
- A2A server
- Marketplace 排名
- Capability 签名验证

## 功能需求

### F1：Manifest 校验

用户可以运行：

```bash
opencap validate registry/developer-tools/github.create_issue
```

系统必须：

- 找到 manifest
- 校验 JSON Schema
- 输出可读错误
- 非法时返回非 0 exit code

### F2：Capability 安装

用户可以运行：

```bash
opencap install github.create_issue
```

系统必须：

- 在 `registry/**/<id>/manifest.yml` 中查找
- 找不到时失败
- 找到多个时失败
- 复制完整目录到 `opencap.local/installed/<id>/`
- 保持 manifest 原样可追溯

### F3：Capability 列表

用户可以运行：

```bash
opencap list
```

系统必须展示：

- id
- version
- type
- risk summary
- trust level
- install path

### F4：策略评估

Runtime 必须在执行前评估策略。

策略决策只有：

- `allow`
- `ask`
- `deny`

默认策略是 `ask`。

### F5：确认处理

非 MCP CLI 可使用终端确认。

MCP 模式：

- client 支持 elicitation 时走 MCP elicitation
- 不支持时返回 `confirmation_required`
- 不得向 stdout 输出终端 prompt

### F6：HTTP 执行

HTTP executor 必须：

- 校验输入
- 渲染 URL 模板
- 支持 GET/POST/PUT/PATCH/DELETE
- 支持 JSON body
- 支持 env API key
- 设置 timeout
- 记录 resolved URL
- 不记录 secret 原文

### F7：审计日志

每次调用，无论执行、拒绝、阻塞、失败，都必须写日志。

日志至少包含：

- timestamp
- channel
- host
- capability_id
- capability_version
- risk
- decision
- confirmation_status
- status
- duration_ms
- input_hash
- input_redacted_json
- output_redacted_json
- resolved_url
- error

### F8：MCP Bridge

`opencap serve --mcp` 必须：

- 加载 installed capabilities
- 将 Capability 映射为 MCP tools
- tool name 稳定生成
- 启动时检测 name collision
- tool call 路由到 runtime invoke
- 不破坏 STDIO 协议流

## 非功能需求

- 本地优先：不依赖远程服务才能运行。
- 可审计：所有调用可追踪。
- 可恢复：任务失败时不破坏本地状态。
- 可测试：核心模块可单元测试。
- 可贡献：新增 Capability 流程清晰。
- 协议兼容：MCP 层保持独立，不污染 runtime 核心。

## V1 Done 定义

V1 完成必须满足：

- 所有 P0/P1 任务完成并验证
- `github.create_issue` demo 可运行
- 至少有 validate/install/list/invoke/logs/serve 命令
- CI 能跑 schema 和核心测试
- README 和 `docs/HANDOFF.md` 反映当前真实状态

## 系统化补充文档

实现 V1 时还应参考：

- `docs/product/strategy.md`：为什么 OpenCap 只做能力层和 Runtime 治理。
- `docs/product/use-cases.md`：角色、场景和主路径验收。
- `docs/product/capability-lifecycle.md`：Capability 从 Draft 到 Audited 的治理状态。
- `docs/design/domain-model.md`：核心领域对象和不变量。
- `docs/design/runtime-contracts.md`：Runtime 模块之间的输入输出契约。
- `docs/security/threat-model.md`：安全资产、攻击路径和 V1 控制措施。
