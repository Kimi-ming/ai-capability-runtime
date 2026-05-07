# 项目介绍

OpenCap 是一个面向 AI 原生应用的开源能力层。

它让开发者可以用标准格式描述真实世界能力，并让用户通过本地或自托管 Runtime 安装、授权、执行和审计这些能力。

## OpenCap 是什么

OpenCap 包含：

- Capability Manifest 标准
- 本地或自托管 Runtime
- MCP 兼容网关
- 权限和策略系统
- 调用日志
- Git-based Registry
- 开发者工具链

## OpenCap 不是什么

OpenCap 不是：

- Agent 市场
- AI 聊天应用
- 通用自动化平台
- API marketplace
- 模型提供商
- 只能云端运行的 SaaS

一句话：

```text
模型负责思考。
Agent 负责规划。
OpenCap 负责让它们安全行动。
```

## Capability 是核心对象

Capability 是一个可声明、可授权、可测试、可审计的行动单元。它可以包装 HTTP API、SaaS 操作、数据源，未来也可以包装 MCP 工具或本地能力。

每个 Capability 包含：

- 身份和版本
- 输入/输出 schema
- 认证需求
- 权限和风险等级
- 执行方式
- 测试和信任元数据

## 为什么不是 Agent-first

Agent 是编排逻辑，负责决定下一步做什么。Capability 是安全行动面，负责把真实世界能力暴露给 Agent。

这很重要，因为：

- 模型和 Agent 框架会快速变化
- API、账户、权限、日志和信任记录会长期存在
- 团队真正需要治理的是“能做什么动作”
- 同一个能力应该能被多个 Host 使用

## V1 成功标准

V1 要让一个 AI Host 通过 OpenCap Runtime 调用一个真实 Capability，并留下权限决策和审计日志。

第一条完整 demo：

```text
AI Host -> OpenCap MCP Runtime -> github.create_issue -> GitHub API -> Audit Log
```
