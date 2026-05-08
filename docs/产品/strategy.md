# 产品战略：OpenCap 系统定位

本文回答一个问题：OpenCap 为什么值得作为开源基础设施存在，而不是又一个 Agent、工具目录或聊天入口。

## 核心判断

AI 原生应用的关键矛盾正在从“模型能不能理解意图”转向“模型能不能安全、可验证、可治理地行动”。

模型和 Agent Host 会不断变化，但真实世界能力长期存在：API、SaaS、数据库、账户、密钥、权限、付款、写操作、审计记录和合规责任。OpenCap 要占住的是这些能力进入 AI 工作流之前的标准层和运行时治理层。

## 一句话定位

OpenCap 是 AI 原生能力层：它让 API、工具、数据源和业务服务可以被定义为 Capability，并通过本地优先 Runtime 被安装、授权、调用、审计和验证。

## 战略边界

OpenCap 要做：

- Capability 标准：用 manifest 描述 AI 可调用能力。
- Runtime：执行前做输入校验、策略判断、确认、密钥解析、调用和日志。
- Registry：用 Git-based 流程维护可评审的能力目录。
- Toolchain：用 CLI、schema、测试和未来 SDK 降低贡献门槛。
- Trust Layer：把权限、风险、测试、维护者和审计信息显式化。

OpenCap 不做：

- 通用聊天入口。
- 通用 Agent Builder。
- 中心化 SaaS marketplace 起步。
- 任意自动化平台。
- 模型路由或 prompt 编排平台。
- V1 阶段的多租户云平台。

## 系统分层

```text
AI Host 层
ChatGPT / Claude / Cursor / 企业内部 Agent / A2A Agent
        |
协议适配层
MCP / future A2A / future HTTP API / future OpenAPI adapter
        |
OpenCap 能力治理层
Manifest / Install / Policy / Confirmation / Secret / Audit / Trust
        |
执行层
HTTP Capability / future MCP proxy / future OpenAPI adapter / future local sandbox
        |
真实世界
GitHub / Vercel / Notion / Slack / DB / 内部系统
```

## 为什么从本地 Runtime 开始

开源生态不能先从中心化市场开始。市场只有在能力可运行、可授权、可验证、可审计后才有意义。

V1 的第一原则是：先让一个用户在本地完整跑通一个可信闭环。只有本地闭环成立，后续 Cloud、团队版、企业版和商业化才不会建立在薄目录之上。

## OpenCap 的护城河

OpenCap 不靠某个模型能力，也不靠某个单点 Agent。它的长期价值来自这些可累积资产：

- Capability Manifest 标准和生态兼容性。
- 已验证的社区 Registry。
- 本地 Runtime 的权限、确认和审计心智。
- Capability 调用日志和测试体系。
- Host 兼容性和协议适配经验。
- 贡献者治理和安全评审流程。

## 成功标准

### V1 成功

一个开发者可以 clone 仓库，在本地安装示例 Capability，通过 MCP Host 调用 `github.create_issue`，OpenCap 在执行前完成策略判断和确认，并写入脱敏审计日志。

### 开源成功

外部贡献者可以按照文档新增一个 Capability，并通过 schema、测试和 review checklist 进入 Registry。

### 生态成功

多个 Host 只需要接入一个 OpenCap Runtime，就能安全调用不同来源的 Capability；多个开发者可以把自己的 API 包装成标准 Capability，而不是为每个 Host 重复开发插件。

## 当前阶段原则

- 先标准和 Runtime，后市场。
- 先 HTTP-only，后适配更多执行类型。
- 先本地可信闭环，后远程协作。
- 先可验证、可审计，后自动组合。
- 先开发者工具链，后普通用户控制台。
