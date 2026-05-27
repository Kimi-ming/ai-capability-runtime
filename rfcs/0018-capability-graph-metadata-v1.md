# RFC 0018：Capability Graph Metadata V1

## 状态

草案

## 元数据

| 字段 | 内容 |
| --- | --- |
| 作者 | OpenCap maintainers |
| 创建日期 | 2026-05-27 |
| 目标阶段 | V1 后续 |
| 相关任务 | T179 |
| 相关 ADR | `docs/决策/0033-step-level-policy-consent-audit.md` |
| 相关文档 | `docs/生态/capability-graph-v1.md`, `docs/生态/capability-taxonomy.md`, `docs/生态/discovery-and-selection-boundary.md`, `docs/社区/capability-review-checklist.md` |
| 替代或废弃 | 无 |

## 摘要

本文定义 future Capability Graph Metadata Profile。该 profile 用结构化 metadata 描述 Capability 与 provider、resource type、permission、input/output artifact 和潜在组合风险之间的关系。

Capability graph 用于 Registry review、发现、组合风险分析和未来 graph index。它不是 workflow graph，不是推荐系统，不是执行计划，也不是授权来源。

## Profile 标识

```text
opencap.capability_graph.metadata.v1
```

该 profile 表示某个 Capability package 或 Registry index entry 附带可审查的图关系 metadata。它不表示：

- Capability 已安装。
- Capability 可以被执行。
- Runtime 可以跳过 policy、consent、quota/budget、outbound、data egress、secret resolver 或 audit。
- Host/Agent 可以把 `can_feed` 边自动转成下一步调用。
- 组合关系已经被证明安全。

## 目标

- 定义 graph metadata 的最小节点和边类型。
- 让 Registry reviewer 能看到资源、权限、产物和组合风险。
- 为 T180 risk amplification checklist 和 T181 registry graph index 提供统一输入。
- 让未来 discovery、Trust Card 和 composition inspection 可以引用同一 profile。
- 固定 `policyEffect=none` 边界，避免 graph metadata 被误用为授权或 trust signal。

## 非目标

- 不实现图数据库、搜索排名、自动推荐或自动安装。
- 不定义 workflow DSL、plan optimizer、scheduler、condition、loop 或 parallel step。
- 不自动生成 MCP tools/list，也不暴露未安装能力。
- 不把 graph edge 变成 Runtime policy rule。
- 不要求 V1 manifest schema 立即新增字段。

## 节点模型

Capability graph 的节点必须是可审查 metadata，不得包含 secret、用户输入、provider raw response 或模型生成正文。

| 节点类型 | 字段 | 示例 |
| --- | --- | --- |
| `capability` | capability identity key | `github.create_issue@0.1.0` |
| `provider` | provider slug | `github` |
| `resource_type` | provider-scoped resource | `github.issue` |
| `permission` | provider/action permission | `github.issue:create` |
| `input_artifact` | input JSON Pointer 或 logical artifact | `/title`, `/body` |
| `output_artifact` | output field 或 logical artifact | `issue_url`, `issue_number` |
| `risk_marker` | risk amplification label | `write_then_external_send` |
| `review_evidence` | review record id 或 PR ref | `review:pr-123` |

## 边模型

| 边类型 | 方向 | 含义 | 是否用于授权 |
| --- | --- | --- | --- |
| `requires_auth` | capability -> provider | 需要 provider credential | 否 |
| `requires_permission` | capability -> permission | 需要的最小权限 | 否 |
| `acts_on` | capability -> resource_type | 操作某类资源 | 否 |
| `produces` | capability -> output_artifact | 输出某类安全命名产物 | 否 |
| `consumes` | input_artifact -> capability | 读取某类输入字段 | 否 |
| `can_feed` | output_artifact -> input_artifact | 某输出可能作为另一能力输入 | 否 |
| `risk_escalates_with` | capability -> capability | 两能力组合会放大风险 | 否 |
| `reviewed_with` | edge -> review_evidence | 组合关系已被人工 review | 否 |

Rules:

- `can_feed` 只表示 schema/语义兼容，不表示自动执行许可。
- `risk_escalates_with` 默认产生 review signal，不直接 deny 或 allow。
- `reviewed_with` 必须指向人工 review、RFC、PR、issue 或 conformance record，不能是自由文本断言。
- 边的两端必须能解析到当前 package、Registry index 或已知 provider/resource taxonomy。

## Metadata shape

Graph metadata 可以作为 future manifest extension、Registry sidecar 或 Registry index 派生字段存在。V1 后续优先从 Registry sidecar/index 开始，避免直接扩大 manifest schema。

```yaml
schema: opencap.capability_graph.metadata.v1
capability:
  id: github.create_issue
  version: 0.1.0
  identity_key: github.create_issue@0.1.0
nodes:
  providers:
    - github
  resource_types:
    - github.issue
  permissions:
    - github.issue:create
  input_artifacts:
    - name: title
      pointer: /title
      data_classes: [free_text_unknown]
    - name: body
      pointer: /body
      data_classes: [free_text_unknown]
  output_artifacts:
    - name: issue_url
      pointer: /url
      data_classes: [external_url]
    - name: issue_number
      pointer: /number
      data_classes: []
edges:
  requires_auth:
    - provider: github
      auth_type: api_key
  requires_permission:
    - permission: github.issue:create
      source: manifest.permissions
  acts_on:
    - resource_type: github.issue
      action: create
  produces:
    - output_artifact: issue_url
    - output_artifact: issue_number
  can_feed:
    - output_artifact: issue_url
      target_capability: slack.send_message
      target_input: /text
      confidence: review_needed
  risk_escalates_with:
    - target_capability: slack.send_message
      marker: write_then_external_send
      severity: medium
      reason_code: output_to_external_channel
review:
  status: draft
  reviewed_with: []
policyEffect: none
```

## 字段规则

- `schema` 必须等于 `opencap.capability_graph.metadata.v1`。
- `capability.id` 和 `capability.version` 必须匹配 manifest。
- `identity_key` 使用 capability identity contract，可包含 version，不包含路径。
- `pointer` 必须是 JSON Pointer，指向 input/output schema 字段，不指向运行时值。
- `data_classes` 使用 OpenCap data classification vocabulary。
- `confidence` 可为 `derived`、`review_needed`、`reviewed`。
- `severity` 可为 `low`、`medium`、`high`、`critical`。
- `policyEffect` 必须固定为 `none`。
- 未知字段默认应被拒绝或作为 warning，避免把自由文本误作执行语义。

## 风险放大标记

初始 marker 集合：

| Marker | 含义 |
| --- | --- |
| `read_to_write` | 读结果直接驱动写操作。 |
| `write_then_external_send` | 写操作产物随后发往外部通信渠道。 |
| `internal_data_to_external_send` | 内部或敏感数据可能被发到外部渠道。 |
| `destructive_after_search` | 搜索/列表结果驱动删除或破坏性操作。 |
| `financial_after_model_generated_input` | 模型生成输入驱动 financial 操作。 |
| `credential_scope_overlap` | 多个能力使用同一高权限 provider credential。 |

这些 marker 是 review 信号，不直接改变 Runtime policy。T180 会把 marker 转成人工评审清单。

## 生成与维护

Metadata 可由三类来源生成：

1. Manifest 派生：provider、auth、permissions、risk、input/output schema、execution mapping。
2. Registry review：resource type、can_feed、risk escalation、reviewed_with。
3. Future conformance：已验证组合、negative fixture 或 compatibility evidence。

自动派生字段必须标记 `confidence: derived`。任何跨 Capability 的 `can_feed` 或 `risk_escalates_with` 默认是 `review_needed`，只有人工 review 或 conformance record 支持时才能标记 `reviewed`。

## 安全与隐私

- Graph metadata 不得包含 raw input、raw output、provider raw response、secret、token、Authorization、Cookie、未脱敏 URL query 或 private URL。
- Graph metadata 不得指挥模型调用某个工具，也不得包含 prompt injection 风格文案。
- Graph metadata 不得降低 manifest risk、permission 或 lifecycle/advisory 状态。
- Graph metadata 不能被 Host 作为 tool description 的自由文本直接展示给模型；若展示，必须经过 Runtime-generated projection。

## 兼容与迁移

- 当前 V1 不需要修改 manifest schema。
- Registry 可以先以 sidecar 或 generated index 的形式试点。
- 旧 Runtime 可以忽略该 profile，仍按单步 invocation 执行。
- Future `opencap validate` 可以把 graph metadata lint 加入 package lint，但必须保持 `policyEffect=none`。
- T181 registry graph index 应从该 profile 派生 index，不反向要求所有 package 手写完整图。

## 验证计划

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
pnpm validate
git diff --check
```

Future implementation tests:

- graph metadata with `policyEffect` other than `none` fails validation。
- JSON Pointer path traversal or runtime value snapshots fail lint。
- `can_feed` does not expose uninstalled capability through MCP tools/list。
- `risk_escalates_with` produces review finding but cannot override policy。
- generated graph index omits raw manifest body、input/output values and secrets。

## 发布和运维

- Release notes 必须说明 Capability graph 是 review/discovery/evidence metadata，不是 workflow feature。
- Registry maintainers should review new `risk_escalates_with` markers before merge。
- Graph metadata changes that add new high/critical risk markers should trigger capability review。
- Revoked/yanked capabilities may remain in graph index for audit/history views, but must stay hidden from default discovery。

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
| 直接在 V1 manifest 中强制新增 graph 字段 | 会扩大当前 schema blast radius，并阻塞现有 package。 |
| 使用图数据库作为 V1 依赖 | 超出本地优先最小 Runtime 范围，也增加部署复杂度。 |
| 让 Runtime 根据 graph 自动推荐下一步 | 会滑向 Agent/router，且容易把发现信号误作授权。 |
| 只保留自由文本 risk_notes | 难以 lint、index、review，也容易混入模型指令或敏感信息。 |

## 开放问题

- graph metadata sidecar 的文件名是否使用 `graph.yml`，还是先只在 generated index 中出现。
- provider/resource taxonomy 是否需要独立 schema。
- `confidence` 是否需要绑定 review evidence digest。
- T181 graph index 是否应包含跨 package edge，还是只包含 package-local graph。

## 决策结果

评审结束后填写。
