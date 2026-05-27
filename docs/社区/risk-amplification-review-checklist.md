# 风险放大评审清单

本文用于 Registry Capability PR 和 future Capability graph metadata review。它把 Capability Graph Metadata RFC 中的 `risk_escalates_with` marker 转成可执行人工检查项。

风险放大不是单个 Capability 的风险，而是多个能力、输入来源、输出产物、凭据范围或外发目标串联后产生的额外风险。评审结论只影响 Registry review、graph metadata 和后续任务；不能直接让 Runtime `allow` 或 `deny`。

## 使用时机

Reviewer 在以下场景必须使用本清单：

- 新 Capability 的 output 可能被另一个 Capability input 消费。
- PR 新增或修改 `can_feed`、`risk_escalates_with`、resource type、permission 或 graph metadata。
- Capability 同时涉及 `write`、`external_send`、`destructive`、`financial`、`code_execution` 或 `arbitrary_url`。
- Capability 使用高权限 credential，且 provider 与已有能力重叠。
- README 或 tests 展示了多步使用示例。

## 快速结论

| 结论 | 含义 | 处理 |
| --- | --- | --- |
| `pass` | 未发现额外组合风险，或风险已被现有 policy/consent/docs 覆盖 | 可继续普通 review |
| `pass_with_notes` | 有低/中风险放大，但文档、risk、permission 和确认边界已清楚 | 记录 review evidence |
| `changes_requested` | 需要补 risk、permission、README、tests、graph metadata 或确认说明 | 不合并 |
| `block` | 发现 secret 外发、risk 低估、隐藏请求、默认 destructive/financial 或绕过治理 | 不合并，必要时开 advisory/incident |

## 通用检查

- [ ] Capability 粒度没有把多个高风险动作塞进一个 manifest。
- [ ] Manifest risk 覆盖真实动作，不把写、发送、删除、支付或执行标成低风险。
- [ ] Auth scope 与动作匹配，没有用高权限 credential 包装低风险描述。
- [ ] Output schema 不包含 secret、token、cookie、Authorization、private key 或 provider raw response。
- [ ] README 的多步示例没有暗示可以跳过 policy、consent、audit 或 step-level review。
- [ ] `can_feed` 只描述 schema/语义兼容，不描述自动执行许可。
- [ ] `risk_escalates_with` marker 有 reason code 和 severity。
- [ ] 高/严重风险组合有明确 mitigations 或被阻断。

## Marker 检查

### `read_to_write`

读结果直接驱动写操作时检查：

- [ ] 上游 output 不含未脱敏敏感数据。
- [ ] 下游写操作仍需要自己的 input classification、policy、consent 和 audit。
- [ ] 文档没有把上游 allow/consent 描述成下游授权。
- [ ] 如果模型会改写或总结上游结果，标记 `inputSource=model_generated` 或 `tool_derived` 的风险。

默认结论：中风险。若涉及内部数据或大批量写入，升级为高风险。

### `write_then_external_send`

写操作产物被发送到 Slack、邮件、Webhook 或其他外部通信渠道时检查：

- [ ] 下游发送能力标记 `external_send`。
- [ ] 发送内容只包含最小必要字段，不默认发送完整 provider response。
- [ ] 外部 channel、recipient 或 webhook 不能由未受控模型文本自由决定。
- [ ] 发送 step 必须独立确认，不能复用写 step consent。

默认结论：中风险。若包含客户、代码、财务或内部 URL，升级为高风险。

### `internal_data_to_external_send`

内部数据可能出现在外部消息中时检查：

- [ ] Data classes 覆盖 `internal_url`、`source_code`、`config`、`pii` 或 `sensitive_text`。
- [ ] Data Egress Policy Gate 默认不会把这些类别发往未知外部 origin。
- [ ] README 示例使用脱敏数据。
- [ ] Review notes 说明允许外发的最小字段和目标。

默认结论：高风险。若含 secret-like value，直接 `block`。

### `destructive_after_search`

搜索、列表或过滤结果驱动删除、覆盖或撤销操作时检查：

- [ ] destructive 能力独立声明 `destructive` risk。
- [ ] 搜索结果的每个目标资源必须在确认摘要中可见。
- [ ] 不允许只确认“删除搜索结果”这类模糊整体动作。
- [ ] 大批量 destructive 操作需要拆分为更小 Capability 或要求额外 review。

默认结论：高风险。无法枚举目标资源时 `block`。

### `financial_after_model_generated_input`

模型生成输入驱动付款、订阅、报价、订单或结算时检查：

- [ ] Capability 标记 `financial`。
- [ ] 金额、币种、收款方和周期在 confirmation summary 中明确。
- [ ] Financial consent/spend cap gate 不能被 graph metadata 或 quality score 绕过。
- [ ] README 和 tests 不展示自动付款链路。

默认结论：严重风险。缺少显式金额/对象确认时 `block`。

### `credential_scope_overlap`

多个能力共享同一 provider credential 或高权限 token 时检查：

- [ ] 每个 Capability 的 permissions 都是最小必要 scope。
- [ ] README 建议 fine-grained、单仓库、过期和可撤销 token。
- [ ] 高权限 token 不因 graph 关系被推荐给低风险能力。
- [ ] Revoked/yanked/advisory capability 不能继续作为普通 graph route 出现。

默认结论：中风险。若 credential 可执行 destructive/financial/admin 操作，升级为高风险。

## Severity 判定

| Severity | 条件 | 需要动作 |
| --- | --- | --- |
| `low` | 只涉及公开 metadata，且下游为 read-only | 记录 notes |
| `medium` | 涉及 write、external_send 或跨 provider 数据流 | 记录 marker 和 mitigation |
| `high` | 涉及内部数据、批量写入、destructive、高权限 credential 或未知 recipient | 要求修改或增加 review evidence |
| `critical` | 涉及 secret、financial、默认 destructive、隐藏外发或绕过治理 | block |

Severity 不能降低 manifest risk。若二者冲突，按更高风险处理。

## Review evidence

每次标记风险放大时，PR 或 review note 应包含：

```yaml
risk_amplification_review:
  profile: opencap.risk_amplification.review.v1
  capability_id: github.create_issue
  related_capability_id: slack.send_message
  marker: write_then_external_send
  severity: medium
  conclusion: pass_with_notes
  reviewer: maintainer-handle
  reviewed_at: 2026-05-27T00:00:00Z
  mitigations:
    - downstream external_send step requires independent consent
    - only issue_url and issue_number may feed message text by default
  policyEffect: none
```

Evidence 不得包含 raw input、raw output、secret、token、private URL、provider raw response 或真实用户数据。

## Merge 阻断条件

以下任一情况必须阻断合并：

- PR 把 graph metadata、quality score、trust level 或 review note 描述为 Runtime allow 条件。
- `can_feed` 暗示自动执行下一步或 workflow-level consent。
- 多步示例要求用户把 secret 写进 input、README、manifest 或 tests。
- 输出可能包含 secret-like value，但 schema、README 或 tests 未说明脱敏边界。
- financial/destructive 能力缺少显式风险、确认语义或最小权限说明。
- 任意 URL、Webhook 或 recipient 由模型自由文本直接决定，且没有 outbound/data egress gate 说明。
- Revoked/yanked capability 被放入默认推荐、普通 discovery 或普通 graph route。

## 与 Runtime 的关系

本清单只产生 review evidence。Runtime 仍必须在每次 invocation 上执行 validation、input classification、data minimization、data egress policy、policy、confirmation、quota/budget、secret resolver、outbound、execution 和 audit。

`risk_amplification_review`、`risk_escalates_with`、`reviewed_with` 和 graph metadata 都必须带 `policyEffect=none`。

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

## 关联文档

- `rfcs/0018-capability-graph-metadata-v1.md`
- `docs/生态/capability-graph-v1.md`
- `docs/社区/capability-review-checklist.md`
- `docs/安全/agentic-risk-mapping.md`
- `docs/设计/composition-boundary-v1.md`
