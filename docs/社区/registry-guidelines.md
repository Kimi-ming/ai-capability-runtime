# 注册表指南

OpenCap Registry 使用 Git-based 模式。开发者通过 Pull Request 提交 Capability，CI 负责校验 manifest 和测试样例。

## 目录结构

```text
registry/
  developer-tools/
    github.create_issue/
      manifest.yml
      README.md
      tests/
        basic.yml
```

## Capability 分类

Registry 目录的第一层是 Capability 分类：

```text
registry/<category>/<capability_id>/
```

分类必须来自稳定的用户场景，而不是某个单独厂商、临时实验或实现细节。Manifest 也必须在 `metadata.category` 中写入同一个分类值，便于 Registry 展示、review、Trust Card、Host 分组和未来 discovery 使用。

V1 分类表以 [能力分类体系](../生态/capability-taxonomy.md) 为准，当前可接受分类如下：

| 分类 | 适用场景 | 示例 |
| --- | --- | --- |
| `developer-tools` | 开发、部署、代码、Issue、监控和工程协作 | GitHub、Vercel、Sentry |
| `productivity` | 文档、日程、知识库和任务管理 | Notion、Linear、Google Calendar |
| `communication` | 消息发送、通知、邮件和聊天 | Slack、Gmail、Teams |
| `data` | 查询、导出、转换和数据库读取 | Postgres、BigQuery、CSV |
| `commerce` | 订单、支付、订阅和报价 | Stripe、Shopify |
| `operations` | IT、工单、资产和运维流程 | ServiceNow、PagerDuty |
| `content` | 内容生成、发布和媒体处理 | CMS、image/video service |
| `internal` | 企业内部系统或自托管 API | internal CRM、自建工单系统 |

V1 默认优先收敛 `developer-tools`。其他分类可以进入 Registry，但 reviewer 必须确认其场景稳定、权限边界清楚，且不会把 Agent、marketplace 或 paid capability 语义混入 V1 主路径。

分类规则：

- `registry/<category>/<capability_id>/` 的 `category` 必须和 `manifest.yml` 的 `metadata.category` 一致。
- `capability_id` 仍使用 `provider.action_object`，不能把分类写进 id，例如使用 `github.create_issue`，不使用 `developer_tools.github.create_issue`。
- 分类不参与授权，不能降低 policy、permission、risk、confirmation 或 outbound policy 要求。
- 新增分类前，PR 必须说明用户场景、代表性 Capability、和既有分类的差异；如果只是单厂商目录，应放入现有分类。
- 移动分类属于 Registry 路径变更，必须评估 install、文档链接、compatibility evidence 和历史引用影响。

## 条目要求

每个 Registry 条目必须包含：

- `manifest.yml`
- `README.md`
- `tests/` 下至少一个符合 `packages/spec/schema/registry-test.schema.json` 的测试
- 明确权限声明
- 风险等级
- 维护者信息
- 许可证信息
- `metadata.category`，且与目录分类一致

## 评审清单

评审者应先按 [Registry 供应链 Review 工作流](registry-supply-chain-review.md) 走完整 PR 来源、包结构、manifest、模型可见文本、权限、外发、测试和 trust/lifecycle 审查，再使用 [能力评审清单](capability-review-checklist.md) 逐项打勾。

最小检查：

- manifest 是否合法
- 目录分类和 `metadata.category` 是否一致
- 分类是否来自当前分类表，或已说明新增分类理由
- 描述是否匹配真实执行行为
- 权限是否过宽
- 风险等级是否诚实
- 外部端点是否清楚声明
- 测试是否覆盖至少一个 dry-run、mock 或 validation 场景
- README 是否说明配置和预期结果

## 信任等级

| 等级 | 含义 |
| --- | --- |
| `experimental` | 实验性条目，未做深度评审。 |
| `listed` | schema 合法并被接受进入 registry。 |
| `tested` | 有测试并通过 CI 或 mock validation。 |
| `verified` | 维护者身份或服务所有权已验证。 |
| `official` | 由 OpenCap 核心团队维护。 |

## 安装

V1 预期安装方式：

```bash
opencap install github.create_issue
```

CLI 应解析 registry 条目，把 manifest 或完整 Capability 目录复制到本地状态目录，并让 Runtime 可以加载。


## 测试样例格式

每个 Capability 至少应包含一个 `tests/basic.yml`。V1 测试样例用于验证 Capability 的输入样例、预期请求、权限风险和未来 mock 结果，不应包含真实 token。

最小字段：

```yaml
name: lists deployments
capability: vercel.get_deployments
mode: dry_run
input:
  project_id: prj_123
expect:
  status: dry_run
  request:
    method: GET
    url: https://api.vercel.com/v6/deployments?projectId=prj_123&limit=5
  permission:
    risk: read_only
    decision: allow
```

校验命令：

```bash
pnpm validate
```

该命令会同时校验 manifest 和 registry test case schema。
