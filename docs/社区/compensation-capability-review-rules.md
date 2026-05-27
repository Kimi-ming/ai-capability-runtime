# Compensation Capability 评审规则

本文定义 Registry 如何评审补偿型 Capability。补偿动作用于处理已经发生的副作用，但它不是隐式 rollback，也不保证恢复原状态。

架构决策见 `docs/决策/0034-compensation-is-a-capability.md`：compensation 必须建模为独立 Capability invocation，拥有自己的 manifest、permissions、policy、consent 和 audit log。

## 使用时机

Reviewer 在以下场景必须使用本规则：

- Capability 声称可以撤销、取消、关闭、删除、退款、回滚、修正或补偿另一个 Capability 的结果。
- README、tests 或 graph metadata 把某个能力描述为 failure recovery 或 compensation step。
- Capability 与 `unknown_after_timeout`、partial composition、manual review 或 provider reconcile 相关。
- Capability 会修改、删除、取消、退款或发送更正通知。

## 基本原则

- Compensation 是新的 Capability，不是原 invocation 的附属字段。
- Compensation 需要独立 permissions、risk、policy、consent、secret resolver、execution 和 audit。
- Compensation 本身可能失败、partial 或 unknown。
- Compensation 不保证恢复原状态。
- Compensation 不能自动绕过 step-level consent。
- Compensation 不能复用原 step 的 consent receipt、input hash 或 policy decision。

## 命名和定位

推荐命名：

```text
github.close_issue
slack.send_correction
stripe.refund_payment
vercel.cancel_deployment
```

禁止或要求修改的命名：

```text
github.rollback
undo_everything
auto_recover
safe_refund_without_review
```

Rules:

- 名称必须描述真实 provider 动作，不使用模糊的 `rollback` 或 `undo`。
- README 必须说明该动作的限制，例如 close issue 不会删除历史通知，refund 可能产生手续费或延迟。
- 如果补偿动作是 destructive、financial 或 external_send，manifest risk 必须反映这一点。

## Manifest 评审

- [ ] `type` 是 V1 支持的 `http`。
- [ ] Capability id 是明确业务动作，不是通用 rollback/agent。
- [ ] permissions 覆盖真实补偿动作。
- [ ] risk 至少等于补偿动作的真实副作用，不因“修复错误”而降低。
- [ ] input schema 要求明确资源 id、provider reference 或 reconcile 后确认的对象。
- [ ] output schema 不承诺恢复原状态，只描述 provider 返回的结果。
- [ ] README 说明补偿前应先 reconcile unknown outcome。
- [ ] README 说明 compensation 失败时需要 manual review。

## 权限和风险

| 补偿动作 | 典型风险 | 评审要求 |
| --- | --- | --- |
| close/cancel | `write` 或 `destructive` | 明确目标资源 id，确认摘要展示目标 |
| delete/remove | `destructive` | 默认高风险，不能批量隐式执行 |
| refund/void | `financial` | 明确金额、币种、对象和原因 |
| send correction | `external_send` | 明确 recipient/channel 和消息摘要 |
| revoke access | `destructive` / `security_sensitive` | 说明影响范围和恢复方式 |

如果补偿动作同时涉及 financial、destructive 或 external_send，按最高风险处理。

## 输入与确认

补偿输入必须绑定具体资源，不允许模糊选择：

- 好：`issue_number`、`payment_id`、`deployment_id`、`message_ts`。
- 需要谨慎：`query`、`title`、`last_created_item`。
- 禁止默认通过：`delete_all_matching`、`latest`、`whatever_was_created`。

Confirmation summary 必须展示：

- 原 invocation 或 composition id（如果可用）。
- 要补偿的 provider/resource id。
- 补偿动作和不可逆影响。
- financial 金额、币种和收款/退款对象。
- external_send recipient/channel。
- compensation 不保证恢复原状态的提示。

## 与 Reconcile 的关系

Reconcile 是确认外部状态，compensation 是修正已经发生的副作用。

规则：

- `unknown_after_timeout` 后必须先 reconcile，再考虑 compensation。
- 没有确认外部状态时，不应自动执行 destructive/financial compensation。
- `execution.reconcile` hint 不能授权 compensation。
- provider request id 或 resource ref 只能帮助定位资源，不能替代 consent。

## Graph Metadata

Future graph metadata 可以表达补偿关系，但必须保持 `policyEffect=none`：

```yaml
compensation_review:
  profile: opencap.compensation.review.v1
  compensation_capability: github.close_issue
  compensates_capability: github.create_issue
  relation: closes_created_resource
  risk: destructive
  requires_reconcile_before_unknown: true
  conclusion: pass_with_notes
  policyEffect: none
```

Rules:

- `compensates_capability` 只表示 review 关系，不表示自动调用。
- `requires_reconcile_before_unknown` 为 true 时，runbook 和 README 必须说明 reconcile 顺序。
- Graph index 可以展示补偿关系，但不能生成 workflow 或自动执行补偿。

## 阻断条件

以下任一情况必须阻断合并：

- README 或 manifest 承诺自动 rollback、guaranteed restore 或 no-risk undo。
- Compensation 复用原 step consent，或暗示一次 composition approval 足够。
- Financial compensation 缺少金额、币种、对象或 explicit consent 说明。
- Destructive compensation 不能枚举具体目标资源。
- Compensation 可以由模型自由文本决定目标资源或 recipient。
- Compensation 要求用户把 token、secret 或 private key 写入 input、README 或 manifest。
- Compensation 会访问 arbitrary URL、webhook 或 private network，但没有 outbound/data egress 边界说明。
- Revoked/yanked capability 被作为普通 compensation 路径推荐。

## Review evidence

PR review 应记录：

```yaml
compensation_review:
  profile: opencap.compensation.review.v1
  compensation_capability: github.close_issue
  compensates_capability: github.create_issue
  conclusion: pass_with_notes
  reviewer: maintainer-handle
  reviewed_at: 2026-05-27T00:00:00Z
  checks:
    independent_manifest: true
    independent_policy_consent_audit: true
    no_rollback_guarantee: true
    reconcile_before_unknown: true
  policyEffect: none
```

Evidence 不得包含 raw input、raw output、secret、token、private URL、provider raw response 或真实用户数据。

## 与 Runtime 的关系

本规则只影响 Registry review。Runtime 仍按普通 invocation 处理 compensation capability：

```text
validate input
  -> classify/minimize input
  -> data egress policy
  -> policy
  -> confirmation
  -> secret resolver
  -> outbound
  -> execution
  -> audit
```

Compensation relation 不改变 gate 顺序，不降低 risk，不自动继承 credential，也不跳过 audit preflight。

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

- `docs/决策/0034-compensation-is-a-capability.md`
- `docs/运营/composition-failure-runbook.md`
- `docs/运营/failure-recovery-runbook.md`
- `docs/设计/multi-step-execution-boundary.md`
- `docs/社区/capability-review-checklist.md`
- `docs/社区/risk-amplification-review-checklist.md`
