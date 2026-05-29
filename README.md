# OpenCap：AI 原生能力层

OpenCap 是一个面向 AI 原生应用的开源能力层。

它让开发者可以把 API、工具、数据源和业务服务定义成 AI 可调用的 Capability，并通过统一的本地或自托管 Runtime 完成安装、授权、调用、审计和验证。

OpenCap 不做智能体，不做聊天入口，也不做一个中心化工具市场。它要做的是 AI 时代的能力标准、运行时、注册表和开发者工具链。

## 为什么需要 OpenCap

大模型越来越会推理，但模型本身不能安全地直接操作真实世界。它仍然需要访问：

- API 和 SaaS 工具
- 私有数据源
- 用户账户权限
- 密钥和凭据
- 写操作和外部消息发送
- 调用日志和审计记录
- 能力验证与信任信息

OpenCap 提供：

- Capability Manifest 标准
- 本地优先的 Capability Runtime
- MCP 兼容的工具暴露方式
- 权限策略
- 调用日志
- Git-based Capability Registry
- 开发者 CLI 和 SDK 基础

## 设计原则

1. 能力优先，而不是智能体优先。
2. 本地优先，云端可选。
3. 默认受权限约束。
4. 每一次调用都必须可审计。
5. 兼容开放协议，不绑定单一厂商。
6. Registry 由社区治理。

## 核心流程

```text
Capability Manifest
        |
OpenCap CLI
        |
OpenCap Registry
        |
OpenCap Runtime
        |
MCP-compatible Host
        |
External API call
        |
Audit Log
```

## 仓库结构

```text
docs/        项目文档、需求、架构、审查和决策记录
rfcs/        标准和运行时行为的设计提案
packages/    spec、cli、runtime、mcp、sdk 和 adapters
apps/        本地 Console 与未来 Registry Web
registry/    Git-based 社区 Capability Registry
examples/    Capability 示例和 MCP Host 配置示例
```

## V1 范围

V1 要证明一个最小闭环：

```text
开发者写 manifest.yml
        |
opencap validate
        |
opencap install
        |
opencap serve --mcp
        |
AI Host 调用工具
        |
OpenCap 检查策略
        |
OpenCap 执行 HTTP Capability
        |
OpenCap 写入审计日志
```

V1 只支持 `type: http` 的 Capability。`mcp` 和 `local` 类型留到后续 RFC。

第一批示例能力：

- `github.create_issue`
- `github.search_repo`
- `vercel.get_deployments`
- `http.request_demo`

## 快速开始

当前仓库已经可以跑通 CLI 到 Runtime 的最小本地闭环：validate、install、list、card、doctor、invoke dry-run 和 logs。示例命令使用临时 state dir，不会污染仓库根目录或用户真实项目下的 `opencap.local/`。

如果要创建新的 HTTP Capability 初稿，可以先用 `opencap init` 生成本地 scaffold；它只写 `manifest.yml`、`README.md` 和 `tests/basic.yml`，不安装、不读取 secret、不写 state dir、不触网：

```bash
SCAFFOLD_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/opencap-readme-scaffold.XXXXXX")"

pnpm --filter @opencap/cli dev -- init demo.get_status \
  --category developer-tools \
  --output "$SCAFFOLD_ROOT/demo.get_status" \
  --title "Demo Get Status" \
  --description "Fetch a public demo endpoint with a name parameter." \
  --url "https://httpbin.org/anything?name={{name}}"

pnpm --filter @opencap/cli dev -- validate "$SCAFFOLD_ROOT/demo.get_status"
rm -rf "$SCAFFOLD_ROOT"
```

```bash
pnpm install
pnpm validate

SMOKE_STATE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/opencap-readme-state.XXXXXX")"

pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
pnpm --filter @opencap/cli dev -- install github.create_issue --state-dir "$SMOKE_STATE_DIR"
pnpm --filter @opencap/cli dev -- list --state-dir "$SMOKE_STATE_DIR"
pnpm --filter @opencap/cli dev -- card github.create_issue --state-dir "$SMOKE_STATE_DIR" --json
pnpm --filter @opencap/cli dev -- card github.create_issue --state-dir "$SMOKE_STATE_DIR" --kind trust --json
pnpm --filter @opencap/cli dev -- doctor --state-dir "$SMOKE_STATE_DIR" --registry registry --json
pnpm --filter @opencap/cli dev -- registry search github --registry registry
pnpm --filter @opencap/cli dev -- registry show github.search_repo --registry registry --json
pnpm --filter @opencap/cli dev -- registry report --registry registry --json
pnpm --filter @opencap/cli dev -- conformance report --records packages/runtime/test/fixtures/conformance --json
pnpm --filter @opencap/cli dev -- invoke github.create_issue --dry-run --state-dir "$SMOKE_STATE_DIR" --input examples/github-issue-capability/input.json --json
pnpm --filter @opencap/cli dev -- logs --state-dir "$SMOKE_STATE_DIR" --status dry_run
pnpm --filter @opencap/cli dev -- metrics summary --state-dir "$SMOKE_STATE_DIR" --json
pnpm --filter @opencap/cli dev -- metrics capabilities --state-dir "$SMOKE_STATE_DIR" --json
pnpm --filter @opencap/cli dev -- metrics security --state-dir "$SMOKE_STATE_DIR" --json

rm -rf "$SMOKE_STATE_DIR"
```

常用验证命令：

```bash
pnpm test
pnpm build
pnpm lint
```

### MCP 当前状态

V1 的目标是让 MCP Host 通过 `opencap serve --mcp` 发现并调用已安装 Capability。当前代码已经接入官方 `@modelcontextprotocol/sdk`，`opencap serve --mcp` 会启动最小 stdio MCP server，复用 MCP tool name 映射、`tools/list` 投影和 `tools/call` 路由；真实 Claude Desktop/Cursor 等 Host smoke 仍需按文档记录。

MCP Host 配置形态：

```json
{
  "mcpServers": {
    "opencap": {
      "command": "opencap",
      "args": ["serve", "--mcp"]
    }
  }
}
```

## 关键文档

完整阅读入口见 [中文文档中心](docs/README.md)。维护者索引见 [文档索引](docs/INDEX.md)。

最重要的文档：

- [体系蓝图](docs/SYSTEM.md)
- [产品规格](docs/SPEC.md)
- [架构总览](docs/ARCHITECTURE.md)
- [当前状态交接](docs/HANDOFF.md)
- [开发任务总表](docs/TASKS.md)
- [验证策略](docs/TESTING.md)
- [决策索引](docs/DECISIONS.md)
- [风险登记](docs/RISKS.md)
- [中文文档规范](docs/社区/documentation-governance.md)

## 开源治理

- [贡献指南](CONTRIBUTING.md)
- [治理说明](GOVERNANCE.md)
- [安全政策](SECURITY.md)
- [行为准则](CODE_OF_CONDUCT.md)

## License

MIT

## 本地环境

```bash
conda activate ai-capability-runtime
pnpm install
```

环境定义见 [environment.yml](environment.yml)，详细说明见 [开发环境](docs/教程/开发环境.md)。
