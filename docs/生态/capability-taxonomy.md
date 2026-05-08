# 能力分类体系

本文定义 OpenCap Registry 中 Capability 的分类、粒度和命名规则。生态项目必须避免两种极端：能力太粗变成 Agent，能力太细变成 API 噪声。

## 分类目标

- 让用户理解一个 Capability 大概能做什么。
- 让 Registry review 判断权限和风险是否合理。
- 让 Host 展示工具时更容易分组。
- 让未来推荐、搜索、Trust Card 和组合能力有稳定基础。

## 一级分类

| 分类 | 说明 | 示例 |
| --- | --- | --- |
| `developer-tools` | 开发、部署、代码、Issue、监控 | GitHub, Vercel, Sentry |
| `productivity` | 文档、日程、知识库、任务管理 | Notion, Linear, Google Calendar |
| `communication` | 消息发送、通知、邮件、聊天 | Slack, Gmail, Teams |
| `data` | 查询、导出、转换、数据库读取 | Postgres, BigQuery, CSV |
| `commerce` | 订单、支付、订阅、报价 | Stripe, Shopify |
| `operations` | IT、工单、资产、运维流程 | ServiceNow, PagerDuty |
| `content` | 内容生成、发布、媒体处理 | CMS, image/video services |
| `internal` | 企业内部系统 | 自托管 API |

V1 registry 先重点做 `developer-tools`。

## 动作类型

动作比分类更接近权限模型：

| 动作类型 | 风险倾向 | 示例 |
| --- | --- | --- |
| `get` / `list` / `search` | read_only | search_repo |
| `create` | write/external_send | create_issue |
| `update` | write | update_page |
| `send` | external_send | send_message |
| `delete` | destructive | delete_record |
| `execute` | code_execution | run_job |
| `purchase` / `charge` | financial | create_payment |

## 粒度规则

一个 Capability 应该对应一个清晰的业务动作：

好：

```text
github.create_issue
github.search_repo
vercel.get_deployments
```

不好：

```text
github.agent
call_github_api
http_anything
manage_project
```

规则：

- 不把多个高风险动作塞进一个 Capability。
- 不把整个 OpenAPI 服务直接暴露成一个 Capability。
- 写操作和删除操作分开。
- 读操作和写操作分开。
- 任意 URL 或任意 method 能力必须标记高风险，不进入默认示例主路径。

## 命名规则

```text
provider.action_object
```

示例：

```text
github.create_issue
slack.send_message
notion.create_page
stripe.create_checkout_session
```

约束：

- 小写。
- 点号分段。
- action 使用动词。
- object 使用业务对象。

## Capability vs Agent

Capability：

- 输入输出明确。
- 权限明确。
- 单次调用可审计。
- 不自己规划多步任务。

Agent：

- 会规划。
- 会选择工具。
- 可能维护状态。
- 可能执行多步任务。

OpenCap V1 只治理 Capability，不治理 Agent 内部思考。
