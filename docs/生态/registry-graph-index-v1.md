# Registry Graph Index V1 草案

本文定义未来 OpenCap Registry 如何从 Capability graph metadata 生成可查询的 graph index。Graph index 用于 Registry review、发现、组合风险分析和离线 inspection，不用于安装授权或 Runtime 执行授权。

## 目标

- 定义 `opencap.registry.graph_index.v1` 的最小 envelope。
- 说明 graph index 如何从 manifest、Capability graph metadata、review evidence 和 conformance evidence 派生。
- 支持按 provider、resource type、permission、output artifact、`can_feed` 和风险放大 marker 查询。
- 保持与 Registry index/cache/sync profile 的 digest、source 和 cache 边界一致。
- 明确 graph index 不是 workflow graph、推荐系统、planner、ranking 或 policy authority。

## 非目标

- 不实现图数据库或新的运行时依赖。
- 不自动生成 workflow、composition plan 或 MCP tools/list。
- 不替代 manifest validation、package lint、Registry review、advisory、lifecycle gate 或 Runtime policy。
- 不把 `can_feed` 变成自动执行许可。
- 不把 `risk_escalates_with` 直接变成 allow/deny。

## Profile 标识

```text
opencap.registry.graph_index.v1
```

该 profile 表示一个 Registry snapshot 中的 capability graph projection。它可以作为 future Registry index 的附加 projection，也可以作为独立 `graph-index.json` 生成。

## Index Envelope

```json
{
  "schema": "opencap.registry.graph_index.v1",
  "generatedAt": "2026-05-27T00:00:00Z",
  "registry": {
    "source": "git",
    "repository": "https://github.com/opencap/opencap",
    "commit": "0123456789abcdef",
    "treeDigest": "sha256:..."
  },
  "profiles": [
    "opencap.capability_graph.metadata.v1",
    "opencap.risk_amplification.review.v1"
  ],
  "capabilities": [],
  "nodes": [],
  "edges": [],
  "riskMarkers": [],
  "reviewEvidence": [],
  "indexDigest": "sha256:...",
  "policyEffect": "none"
}
```

Rules:

- `indexDigest` 覆盖 canonicalized graph index body，不覆盖签名 envelope。
- `registry.commit` 和 `treeDigest` 必须与生成来源一致。
- `policyEffect` 必须固定为 `none`。
- Index 不保存 raw manifest body、raw input、raw output、provider response、secret 或真实用户数据。

## Capability Entry

```json
{
  "id": "github.create_issue",
  "version": "0.1.0",
  "identityKey": "github.create_issue@0.1.0",
  "category": "developer-tools",
  "manifestPath": "registry/developer-tools/github.create_issue/manifest.yml",
  "manifestDigest": "sha256:...",
  "lifecycle": "active",
  "trustLevel": "tested",
  "graphMetadataDigest": "sha256:...",
  "reviewStatus": "review_needed"
}
```

Rules:

- `manifestPath` 必须是 Registry root 相对路径，不能逃逸根目录。
- `manifestDigest` 是行为定义 digest；graph index 不能替代安装前 manifest 校验。
- `reviewStatus` 可为 `derived`、`review_needed`、`reviewed`、`blocked`。
- `lifecycle` 和 `trustLevel` 只用于过滤和展示，不改变 Runtime policy。

## Node Entry

```json
{
  "id": "resource_type:github.issue",
  "type": "resource_type",
  "label": "github.issue",
  "capabilities": ["github.create_issue"],
  "dataClasses": [],
  "policyEffect": "none"
}
```

Allowed node types:

- `capability`
- `provider`
- `resource_type`
- `permission`
- `input_artifact`
- `output_artifact`
- `risk_marker`
- `review_evidence`

Node ids must be deterministic, namespaced and free of raw user/provider data.

## Edge Entry

```json
{
  "id": "edge:github.create_issue:produces:issue_url",
  "type": "produces",
  "from": "capability:github.create_issue@0.1.0",
  "to": "output_artifact:github.create_issue.issue_url",
  "source": "graph_metadata",
  "confidence": "derived",
  "policyEffect": "none"
}
```

Allowed edge types:

- `requires_auth`
- `requires_permission`
- `acts_on`
- `produces`
- `consumes`
- `can_feed`
- `risk_escalates_with`
- `reviewed_with`

Rules:

- `source` 可为 `manifest_derived`、`graph_metadata`、`review_evidence` 或 `conformance_evidence`。
- `confidence` 可为 `derived`、`review_needed` 或 `reviewed`。
- `policyEffect` 必须固定为 `none`。
- `can_feed` 不能让 uninstalled capability 出现在 MCP tools/list。
- `reviewed_with` 必须指向 `reviewEvidence` entry。

## Risk Marker Entry

```json
{
  "marker": "write_then_external_send",
  "severity": "medium",
  "fromCapability": "github.create_issue",
  "toCapability": "slack.send_message",
  "reasonCode": "output_to_external_channel",
  "reviewStatus": "review_needed",
  "policyEffect": "none"
}
```

Severity 必须与风险放大评审清单一致。若 graph metadata 与人工 review 冲突，默认采用更高 severity，并把 entry 标记为 `review_needed` 或 `blocked`。

## Review Evidence Entry

```json
{
  "id": "review:pr-123",
  "profile": "opencap.risk_amplification.review.v1",
  "capabilityId": "github.create_issue",
  "relatedCapabilityId": "slack.send_message",
  "marker": "write_then_external_send",
  "conclusion": "pass_with_notes",
  "evidenceDigest": "sha256:...",
  "policyEffect": "none"
}
```

Review evidence entry stores ids, digests, conclusions and marker metadata only. It must not store PR comment bodies if those comments include raw user data, provider responses or secret material.

## 生成流程

Future generator should use this pipeline:

```text
scan registry packages
  -> validate manifest and package shape
  -> derive provider/resource/permission/input/output nodes
  -> read optional graph metadata sidecar or generated metadata
  -> attach risk amplification review evidence
  -> apply lifecycle/advisory filtering metadata
  -> canonicalize nodes and edges
  -> compute graph index digest
  -> optionally include in registry index/cache/sync envelope
```

Derived fields must be deterministic. Cross-package edges such as `can_feed` and `risk_escalates_with` default to `review_needed` until review evidence exists.

## 查询语义

Future CLI or Registry Web can expose read-only queries:

```bash
opencap registry graph providers github
opencap registry graph risks --marker write_then_external_send
opencap registry graph feeds github.create_issue
opencap registry graph capability github.create_issue
```

Queries return metadata summaries only. They must not install, enable, invoke, expose tools, or alter policy.

## 默认过滤

- `revoked` and `yanked` capabilities are hidden from default discovery graph queries.
- `deprecated` capabilities remain visible with warnings.
- Explicit audit/review queries may include revoked/yanked nodes for history and advisory analysis.
- Critical unresolved advisory entries must not appear in ordinary recommendation-like views.
- Installed capability status is local state and must not be inferred from graph index alone.

## 安全与隐私

- Graph index 不得包含 raw input、raw output、provider raw response、secret、token、Authorization、Cookie、private URL、未脱敏 URL query、CI private log 或用户数据。
- Graph index 中的 description/label 不得包含指挥模型绕过 policy、consent、audit 或 tool choice 的文本。
- Graph index 不能降低 manifest risk、permission、lifecycle、advisory 或 review severity。
- Graph index cache 是派生本地状态，必须可删除、可重建，且不能提交到 Registry PR。
- Remote graph index freshness 不能静默替换 installed capability 或本地 policy。

## 与 Registry Index/Cache 的关系

Registry graph index 可以被 RFC 0014 的 cache/sync profile 缓存：

```text
opencap.local/cache/registry/sources/<source-id>/
  index.json
  graph-index.json
  verification.yml
  sync-state.json
```

`graph-index.json` 依赖同一个 source commit 和 tree digest。安装候选仍必须读取 manifest/package bytes、校验 digest、运行 manifest validation 和 package lint。Graph index 只加速 review/discovery/inspection。

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

- generator rejects path traversal in `manifestPath`。
- graph index with `policyEffect` other than `none` fails validation。
- generated index omits raw manifest body、input/output values and secret-like strings。
- default graph query hides yanked/revoked capabilities。
- `can_feed` query does not expose uninstalled capability as MCP tool。
- graph index digest is deterministic for stable inputs。

## 关联文档

- `rfcs/0018-capability-graph-metadata-v1.md`
- `rfcs/0014-registry-index-cache-sync-v1.md`
- `docs/生态/capability-graph-v1.md`
- `docs/社区/risk-amplification-review-checklist.md`
- `docs/生态/discovery-and-selection-boundary.md`
- `docs/生态/registry-distribution.md`
