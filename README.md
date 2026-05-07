# OpenCap

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

当前仓库已经包含 V1 项目骨架和文档。第一阶段实现目标是 CLI 和 Runtime 闭环。

```bash
pnpm install
pnpm validate
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
```

Runtime 实现后，MCP Host 可以这样加载 OpenCap：

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

- [项目介绍](docs/introduction.md)
- [快速入门](docs/getting-started.md)
- [Capability Manifest](docs/capability-manifest.md)
- [权限模型](docs/permission-model.md)
- [Runtime 架构](docs/runtime-architecture.md)
- [Registry 指南](docs/registry-guidelines.md)
- [安全模型](docs/security-model.md)
- [路线图](docs/roadmap.md)
- [V1 需求](docs/planning/v1-requirements.md)
- [V1 架构](docs/planning/v1-architecture.md)
- [技术方案审查](docs/reviews/technical-plan-review-2026-05-07.md)

## 开源治理

- [贡献指南](CONTRIBUTING.md)
- [治理说明](GOVERNANCE.md)
- [安全政策](SECURITY.md)
- [行为准则](CODE_OF_CONDUCT.md)

## License

MIT
