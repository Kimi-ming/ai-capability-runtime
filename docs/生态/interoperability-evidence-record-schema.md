# Interoperability Profile Evidence Record Schema

本文定义 OpenCap 互操作 profile 的统一 evidence record schema。它把 Host compatibility、MCP elicitation、A2A Agent Card、Remote Runtime OAuth、resource delivery 等 profile 的证据记录收敛到同一口径。

## Profile 标识

```text
opencap.interop.evidence.v1
```

该 schema 回答一个问题：某个 profile 的某个结论基于什么证据、何时观察、在哪个 OpenCap commit、由什么命令/路径/人工记录支持、有什么隐私边界和已知限制。

## 非目标

- 不保存 provider raw body、tool input 原文、tool output 原文、secret、Authorization header 或 OAuth token。
- 不替代 Runtime audit log。
- 不替代 compatibility record 的当前结论。
- 不把 Draft/RFC review 证据写成 Compatible。
- 不让 evidence record 影响 policy、consent、trust level 或 execution。

## Record Shape

```yaml
schema_version: opencap.interop.evidence.v1
evidence_id: evidence-2026-05-14-custom-mcp-client-tools-tests
profile: opencap.mcp.tools.v1
subject:
  kind: host | adapter | runtime | registry | auth | resource | rfc
  id: custom-mcp-client
  version: opencap-helper-tests-0.1.0-dev
  capability_id: github.create_issue
supports:
  compatibility_records:
    - hostrec-2026-05-14-custom-mcp-client-tools-v1
  rfcs: []
opencap:
  version: 0.1.0-dev
  commit: <git-sha>
observed_at: 2026-05-14T00:00:00Z
evidence_kind: automated-test
result: pass
source:
  commands:
    - pnpm --filter @opencap/mcp test
  paths:
    - packages/mcp/src/index.test.ts
  artifacts: []
checks:
  - id: tools_list
    result: pass
    summary: tools/list exposes installed capability projection.
privacy:
  stores_raw_input: false
  stores_raw_output: false
  stores_provider_raw_body: false
  stores_secret: false
  stores_authorization_header: false
  redaction_profile: opencap.redaction.v1
limitations:
  - Not a third-party Host UI smoke.
known_gaps:
  - Does not prove Claude Desktop or Cursor display behavior.
review:
  reviewer: maintainer
  reviewed_at: 2026-05-14T00:00:00Z
  notes: Adapter-level contract evidence only.
```

## 字段定义

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `schema_version` | yes | 固定为 `opencap.interop.evidence.v1`。 |
| `evidence_id` | yes | 稳定 ID，建议 `evidence-YYYY-MM-DD-<subject>-<profile>-<kind>`。 |
| `profile` | yes | 被证明的 interoperability profile，例如 `opencap.mcp.tools.v1`。 |
| `subject` | yes | 证据对象，可以是 Host、adapter、runtime、auth profile、resource profile 或 RFC。 |
| `supports` | yes | 该证据支撑的 compatibility records、RFC、release gate 或 conformance case。可以为空数组。 |
| `opencap` | yes | OpenCap version 和 commit。commit 必须是具体 SHA 或发布 tag。 |
| `observed_at` | yes | ISO 8601 时间或日期。 |
| `evidence_kind` | yes | 证据类型。 |
| `result` | yes | 证据结果，不等同 profile 等级。 |
| `source` | yes | 命令、文件路径或 artifact 引用。 |
| `checks` | yes | 可复核检查项，至少一项。 |
| `privacy` | yes | 明确是否保存原文或敏感材料。 |
| `limitations` | yes | 该证据不能证明什么。 |
| `known_gaps` | yes | 后续需要补的真实 Host smoke、adapter 实现或安全验证。 |
| `review` | no | 人工复核信息。 |

## 枚举

### `subject.kind`

| 值 | 说明 |
| --- | --- |
| `host` | 第三方或自定义 Host，例如 Claude Desktop、Cursor、custom MCP client。 |
| `adapter` | OpenCap adapter，例如 MCP result adapter、A2A adapter。 |
| `runtime` | Runtime contract 或 gate 行为。 |
| `registry` | Registry/package/review evidence。 |
| `auth` | OAuth、secret provider、credential lifecycle evidence。 |
| `resource` | Resource delivery 或 large result evidence。 |
| `rfc` | RFC/design review evidence。 |

### `evidence_kind`

| 值 | 说明 |
| --- | --- |
| `automated-test` | 单元、集成、snapshot、conformance 自动化测试。 |
| `manual-smoke` | 真实 Host 或部署环境手工 smoke。 |
| `version-detection` | 只证明识别到 Host/spec/tool 版本。 |
| `runtime-contract` | Runtime public contract 或 helper 行为证据。 |
| `schema-review` | schema 或 manifest 规则审查证据。 |
| `rfc-review` | RFC/design review 证据，不代表实现通过。 |
| `security-review` | 威胁、安全边界或 negative review 证据。 |
| `auth-validation` | token、scope、audience、credential separation 证据。 |
| `known-gap` | 明确记录尚未验证或不支持项。 |

### `result`

| 值 | 含义 |
| --- | --- |
| `pass` | 证据中的检查项通过。 |
| `fail` | 证据中的检查项失败。 |
| `draft` | RFC/design 存在，但未实现。 |
| `pending-smoke` | 已进入验证队列，缺真实 Host/deployment smoke。 |
| `not-run` | 该项尚未执行。 |
| `not-supported` | 被测对象不支持该 profile 或 feature。 |
| `inconclusive` | 证据不足或环境不确定。 |

检查项 `checks[].result` 使用：

```text
pass | fail | not-run | not-applicable
```

## 隐私规则

Evidence record 必须默认只保存摘要和引用：

- `stores_raw_input` 必须默认为 `false`。
- `stores_raw_output` 必须默认为 `false`。
- `stores_provider_raw_body` 必须默认为 `false`。
- `stores_secret` 必须默认为 `false`。
- `stores_authorization_header` 必须默认为 `false`。
- 若某条 evidence 需要保存 artifact，artifact 必须是脱敏文件、hash、CI URL、commit URL 或 release artifact URL。

违反这些规则的记录不能进入 Registry、release evidence 或 compatibility card。

## Profile 等级映射

Evidence record 支撑 profile 等级，但不直接决定等级。

| Profile 等级 | 最小 evidence |
| --- | --- |
| Draft | `rfc-review` 或 `schema-review`，result `draft/pass`。 |
| Experimental | 至少一条 `automated-test` 或 `manual-smoke`，且 known gaps 明确。 |
| Compatible | 自动化 contract + 对目标 Host/deployment 的 `manual-smoke`，失败语义明确。 |
| Verified | Compatible evidence + release gate evidence + maintainer review。 |

没有 evidence record 的 profile 只能叫 Draft 或未声明，不能叫 Compatible。

## 与 Compatibility Record 的关系

Compatibility record 是当前结论；evidence record 是结论来源。

```text
compatibility record
  -> result: pass / fail / pending-smoke
  -> evidence_refs:
       - evidence-...
       - evidence-...
```

一条 evidence record 可以支持多个 compatibility records，但必须在 `supports.compatibility_records` 中显式列出。自动化 adapter evidence 不能支撑第三方 Host UI compatible 结论，除非另有 manual-smoke evidence。

## 示例：Host Adapter 自动化证据

```yaml
schema_version: opencap.interop.evidence.v1
evidence_id: evidence-2026-05-14-custom-mcp-client-tools-tests
profile: opencap.mcp.tools.v1
subject:
  kind: host
  id: custom-mcp-client
  version: opencap-helper-tests-0.1.0-dev
  capability_id: github.create_issue
supports:
  compatibility_records:
    - hostrec-2026-05-14-custom-mcp-client-tools-v1
  rfcs: []
opencap:
  version: 0.1.0-dev
  commit: 0f819cb
observed_at: 2026-05-14T00:00:00Z
evidence_kind: automated-test
result: pass
source:
  commands:
    - pnpm --filter @opencap/mcp test
  paths:
    - packages/mcp/src/index.test.ts
    - packages/mcp/src/tool-projection.test.ts
    - packages/mcp/src/tool-mapping-contract.test.ts
  artifacts: []
checks:
  - id: tools_list
    result: pass
    summary: tools/list projection includes installed capability metadata.
  - id: tools_call_confirmation_required
    result: pass
    summary: ask decision maps to confirmation_required without execution.
privacy:
  stores_raw_input: false
  stores_raw_output: false
  stores_provider_raw_body: false
  stores_secret: false
  stores_authorization_header: false
  redaction_profile: opencap.redaction.v1
limitations:
  - Not a third-party Host UI smoke.
known_gaps:
  - Does not prove Claude Desktop or Cursor display behavior.
```

## 示例：RFC 草案证据

```yaml
schema_version: opencap.interop.evidence.v1
evidence_id: evidence-2026-05-14-remote-runtime-oauth-rfc
profile: opencap.remote_runtime.oauth.v1
subject:
  kind: rfc
  id: rfcs/0012-remote-runtime-oauth-profile-v1.md
  version: draft
supports:
  compatibility_records: []
  rfcs:
    - rfcs/0012-remote-runtime-oauth-profile-v1.md
opencap:
  version: 0.1.0-dev
  commit: <git-sha>
observed_at: 2026-05-14T00:00:00Z
evidence_kind: rfc-review
result: draft
source:
  commands:
    - python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
  paths:
    - rfcs/0012-remote-runtime-oauth-profile-v1.md
    - docs/生态/oauth-and-remote-runtime-boundary.md
  artifacts: []
checks:
  - id: token_passthrough_boundary
    result: pass
    summary: RFC states inbound tokens cannot become downstream provider tokens.
privacy:
  stores_raw_input: false
  stores_raw_output: false
  stores_provider_raw_body: false
  stores_secret: false
  stores_authorization_header: false
  redaction_profile: opencap.redaction.v1
limitations:
  - RFC exists, but remote runtime is not implemented.
known_gaps:
  - No token validation helper tests yet.
```

## 迁移要求

- `opencap.host.evidence.v1` 视为 Host 场景下的早期别名；后续新增记录应使用 `opencap.interop.evidence.v1`。
- `docs/生态/host-compatibility-matrix.md` 中现有 evidence records 保持可读，但新增记录应补 `schema_version`、`supports`、`checks[]` 对象和完整 `privacy` 字段。
- RFC 0010、0011、0012 的 evidence 示例后续应引用本 schema。
- 未来可以把本 schema 下沉为 JSON Schema，并接入 `pnpm validate` 或 conformance suite。

## 关联任务

- T154：Host compatibility evidence records。
- T156：MCP elicitation profile RFC。
- T157：A2A Agent Card mapping RFC。
- T163：Remote Runtime OAuth profile RFC。
- T271：统一 Interoperability Profile evidence record schema。
