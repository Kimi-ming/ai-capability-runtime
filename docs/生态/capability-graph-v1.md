# 能力图 V1

本文定义 OpenCap 如何描述 Capability 之间的关系。能力图不是 workflow，它是发现、评审、组合和风险分析的元数据基础。

Capability Graph Metadata Profile 草案见 `../../rfcs/0018-capability-graph-metadata-v1.md`。该 RFC 定义 `opencap.capability_graph.metadata.v1`、节点/边类型、风险放大 marker、sidecar/index 形态和 `policyEffect=none` 边界。

## 目标

Capability Graph 用来回答：

- 这个能力依赖什么外部 provider。
- 它可能产生什么资源。
- 它的输出能否作为其他能力的输入。
- 它和哪些能力存在潜在组合关系。
- 哪些组合会放大风险。

## 节点

| 节点类型 | 例子 |
| --- | --- |
| Capability | `github.create_issue` |
| Provider | `github` |
| Resource Type | `github.issue` |
| Permission | `github.issue:create` |
| Output Artifact | `issue_url`, `issue_number` |
| Trust Level | `community_listed`, `verified` |

## 边

| 边类型 | 含义 |
| --- | --- |
| `requires_auth` | Capability 需要 provider credential |
| `acts_on` | Capability 操作某类资源 |
| `produces` | Capability 输出某个 artifact |
| `can_feed` | 一个输出可作为另一个输入 |
| `risk_escalates_with` | 两个能力组合会提高风险 |
| `reviewed_with` | 组合经过人工 review |

## 风险放大示例

```text
github.search_repo -> github.create_issue -> slack.send_message
```

单步看每个能力可能合理；组合后会出现：

- 从代码搜索结果生成外部消息。
- 把内部信息发送到协作频道。
- 写操作和 external_send 连续发生。

能力图可以帮助 reviewer 发现这种风险放大。

## V1 产物

V1 不需要实现图数据库。可以先用文档和未来 registry index 表达：

```yaml
capability: github.create_issue
provider: github
acts_on:
  - github.issue
produces:
  - issue_url
  - issue_number
can_feed:
  - slack.send_message.text
risk_notes:
  - write operation can be chained with external_send.
```

RFC 0018 进一步把这些字段收敛为结构化 metadata：

- 节点：capability、provider、resource type、permission、input/output artifact、risk marker、review evidence。
- 边：`requires_auth`、`requires_permission`、`acts_on`、`produces`、`consumes`、`can_feed`、`risk_escalates_with`、`reviewed_with`。
- 安全边界：所有 graph metadata 都是 review/discovery evidence，不作为 Runtime policy authority。

## 非目标

- 不做自动推荐系统。
- 不做 plan optimizer。
- 不证明组合安全。
- 不把 `can_feed` 变成自动执行许可。
- 不把 `risk_escalates_with` 直接变成 deny/allow。

## 关联任务

- T179：capability graph metadata RFC。
- T180：risk amplification review checklist。
- T181：registry graph index 草案。
