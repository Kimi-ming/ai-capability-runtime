# 决策 0001：开源定位

日期：2026-05-07

## 状态

已接受

## 背景

项目可以定位成：

- Agent 平台
- MCP marketplace
- API marketplace
- 托管自动化产品
- capability runtime and governance layer

外部调研显示：MCP 已经有官方 registry，OpenAI Apps SDK 使用 MCP 作为 app/tool 基底，A2A 专注 agent-to-agent 协作。

## 决策

OpenCap 定位为：

```text
面向 AI 原生应用的开源 Capability Runtime 和治理层
```

它不定位为通用 Agent builder 或 marketplace。

## 影响

V1 必须优先：

- manifest standard
- local runtime
- policy checks
- audit logs
- registry validation
- MCP compatibility

V1 暂缓：

- hosted cloud platform
- commercial marketplace
- agent orchestration
- visual workflow builder
- large UI surface
