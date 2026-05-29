# Policy 事故响应手册

本文定义当本地策略被误放开、Capability 被滥用、override 使用不当或需要紧急阻断时，维护者和本地用户应如何恢复到安全状态。

## 适用场景

本手册适用于：

- policy 从 `ask`/`deny` 误改为 `allow`。
- broad allow 放开了 `write`、`external_send`、`destructive` 或 `financial`。
- override 或 breakglass 被误用。
- 某个 Capability 出现高风险 advisory、疑似恶意或需要撤销。
- audit log 显示异常外发、异常写操作或异常频率。

本手册不替代安全漏洞私下报告流程。涉及未公开漏洞、真实 secret 或攻击 payload 时，按 `SECURITY.md` 和《能力安全公告流程》处理，不要在公开 issue 粘贴敏感信息。

## 响应原则

1. 先阻断，再调查。
2. 优先使用 deny policy，而不是继续扩大 allow。
3. breakglass 只能用于恢复性、短时、可审计操作。
4. 不允许 breakglass 绕过 data egress deny、outbound private block、revoked/malicious block 或 audit。
5. 所有恢复动作都要保留 policy revision、override id、capability id、时间和原因。

## 快速分级

| 级别 | 例子 | 第一动作 |
| --- | --- | --- |
| Low | 文档或规则说明错误 | 记录 issue，修正文档或 policy 注释 |
| Medium | 某能力被误设为 allow，但未执行高风险调用 | 激活 scoped ask/deny policy，运行 simulation |
| High | 外发、写入、删除、支付被误放开 | 立即激活 deny policy，审查 audit，撤销 override |
| Critical | 恶意能力、真实 secret 泄露、不可逆 destructive/financial | revoke capability，deny policy，轮换凭据，启动 advisory |

## 流程一：撤销 Override

当发现 `allow_once`、`allow_until` 或 `breakglass` 不应继续生效时：

1. 找到 override record：记录 `overrideId`、`type`、`capabilityId`、`risk`、`expiresAt` 和 `reason`。
2. 立即从本地 override store 移除该 record，或写入更高优先级的 `deny_override`。
3. 确认 `allow_once` 已被消费后不会再次出现。
4. 检查 audit log 中是否有 `override_id=<id>` 的 policy trace。
5. 在事故记录中写明撤销原因、操作者和时间。

判断标准：

- 如果 override 只是误创建且未命中调用，撤销即可。
- 如果 override 已命中高风险调用，继续执行“审查 Audit”和“激活 Deny Policy”。
- 如果 override 关联被撤销或疑似恶意能力，必须按能力撤销流程处理。

## 流程二：激活 Deny Policy

当需要立刻阻断某个能力或风险类型时，创建最小 deny policy。优先阻断具体 Capability，避免误伤所有能力。

示例：阻断单个能力。

```yaml
default: ask
rules:
  - id: incident-deny-slack-send
    match:
      capability_id: slack.send_message
      resource: slack.message
      action: send
      risk: external_send
    decision: deny
    reason: Incident response temporary deny.
```

示例：阻断某类高风险操作。

```yaml
default: ask
rules:
  - id: incident-deny-financial
    match:
      risk: financial
    decision: deny
    reason: Incident response financial freeze.
```

执行步骤：

1. 保存候选 policy。
2. 运行 `opencap policy validate <path>`。
3. 运行 `opencap policy simulate --before <active> --after <candidate> --scenarios <fixtures>`，确认阻断范围符合预期。
4. 激活 policy，并让 `FilePolicyLedger` 记录 reason、diff summary、from/to revision 和 digest。
5. 用一次 dry-run 或最小复现确认 policy decision 为 `deny`，且 request 没有开始。

## 流程三：审查 Audit

审查目标是回答四个问题：

- 哪个 Capability 被调用。
- 哪个 policy revision 或 override 允许了调用。
- 是否发生 data egress、secret resolution 或 provider request。
- 是否需要轮换凭据或撤销 Capability。

检查字段：

- `timestamp`
- `capabilityId`
- `status`
- `policyDecision`
- `confirmationStatus`
- `matchedRuleId`
- `policyTrace.evaluatedFacts`
- `egressDecision`
- `egressDataClasses`
- `egressTargetOrigin`
- `requestStarted`
- `inputHash`

禁止事项：

- 不要要求用户提供 input 原文。
- 不要把 secret、Authorization、Cookie 或 provider raw body 复制到事故记录。
- 不要用 audit 中的 redacted preview 还原原始数据。

## 流程四：Rollback Policy

当新 policy 造成误阻断或误放开时，用 rollback 重新激活旧 revision。

步骤：

1. 从 policy ledger 找到最近的安全 revision。
2. 确认该 revision 没有 known unsafe broad allow。
3. 追加一条 rollback activation record，不删除失败记录。
4. 记录 rollback reason 和事故编号。
5. 重新运行 validate 和 simulation。

注意：rollback 不是撤销历史。失败 activation、误放开 activation 和 rollback activation 都必须保留。

## Breakglass 允许和禁止

| 场景 | 是否允许 breakglass | 处理方式 |
| --- | --- | --- |
| 修复误阻断的 read-only 诊断能力 | 可以 | 短时 `breakglass`，必须有 reason 和 expiresAt |
| 恢复审计或导出脱敏 decision summary | 可以 | 只允许本地、只读、可审计操作 |
| 发送外部消息包含 `pii`、`secret_like` 或 `source_code` | 不允许 | 必须 deny 或人工重新编辑输入 |
| 访问 localhost、private network、metadata service | 不允许 | 必须 deny，不能用 breakglass 覆盖 outbound block |
| 执行 revoked 或 malicious Capability | 不允许 | revoke capability，启动 advisory |
| financial 操作 | 默认不允许直接放行 | 需要 explicit confirmation，必要时 deny freeze |
| destructive 操作 | 极少允许 | 只可在 scoped capability/resource/action 且有短过期时评估 |

## 与 Advisory 和 Revocation 的关系

如果事故来自 Capability 本身，而不是本地 policy 配置：

1. 按《能力安全公告流程》创建 advisory 草案。
2. 如果风险达到 High 或 Critical，冻结或 revoke 对应 Capability。
3. 按《能力弃用、下架与撤销》保留 revoked 记录，不要删除历史目录。
4. 本地 Runtime 应把 revoked/malicious 视为 breakglass 不可覆盖的硬边界。
5. 在事故复盘中记录 advisory id、affected versions 和 replacement。

本地取证时可以运行 `opencap advisory check --state-dir <path> --registry registry --capability <id> --severity <level> --status <status>`，把已安装能力命中的 advisory evidence 收敛到某个 incident 范围。这个筛选只影响本地报告和计数，不改变 installed state、trust、policy、authorization、Runtime execution 或上述处置流程。

## 复盘清单

事故结束前确认：

- [ ] 不安全 override 已撤销或过期。
- [ ] 必要 deny policy 已激活。
- [ ] policy ledger 有 activation 或 rollback 记录。
- [ ] audit 已审查，且未复制敏感原文。
- [ ] 如涉及凭据，已轮换。
- [ ] 如涉及 Capability 风险，已进入 advisory/revocation 流程。
- [ ] 已补充 regression test、fixture 或 conformance case。

## 关联文档

- 《策略临时覆盖与紧急通道 V1》：`docs/安全/policy-override-and-breakglass-v1.md`
- 《策略生命周期与变更控制》：`docs/运营/policy-lifecycle-and-change-control.md`
- 《能力安全公告流程》：`docs/安全/capability-advisory-process.md`
- 《能力弃用、下架与撤销》：`docs/生态/capability-deprecation-and-revocation.md`
- 《策略模拟与差异评估 V1》：`docs/质量/policy-simulation-and-diff-v1.md`
