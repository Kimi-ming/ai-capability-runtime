# 能力评审清单

本文是 Registry Capability PR 的人工评审清单。

使用方式：先按 [Registry 供应链 Review 工作流](registry-supply-chain-review.md) 判断 PR 来源、范围、供应链风险和 merge evidence，再用本清单逐项检查 Capability 内容。

如果 PR 涉及多步示例、`can_feed`、`risk_escalates_with`、高权限 credential、写操作后外发、读结果驱动写操作、destructive 或 financial 链路，还必须使用 [风险放大评审清单](risk-amplification-review-checklist.md)。

如果 PR 声称可以撤销、取消、关闭、删除、退款、回滚、修正或补偿另一个 Capability 的结果，还必须使用 [Compensation Capability 评审规则](compensation-capability-review-rules.md)。

## 基础结构

- [ ] 目录位于 `registry/<category>/<capability_id>/`。
- [ ] `<category>` 来自当前 [能力分类体系](../生态/capability-taxonomy.md)，或 PR 已说明新增分类理由。
- [ ] `manifest.yml` 存在。
- [ ] `README.md` 存在。
- [ ] `tests/basic.yml` 或等价测试存在。
- [ ] Capability id 与目录名一致。
- [ ] `metadata.category` 与目录分类一致。

## Manifest

- [ ] schema 校验通过。
- [ ] `type` 是 V1 支持的 `http`。
- [ ] `input` 和 `output` 是清晰 JSON Schema。
- [ ] `execution.method` 和 `execution.url` 与描述一致。
- [ ] POST/PUT/PATCH 写操作声明了 `execution.body`。
- [ ] `timeout_ms` 合理。
- [ ] `metadata.category` 只用于发现、展示和 review，不被描述为授权或 trust signal。

## 权限和风险

- [ ] permissions 覆盖真实外部行为。
- [ ] risk 没有低估。
- [ ] 写操作不是 `read_only`。
- [ ] 删除/覆盖是 `destructive`。
- [ ] 发消息是 `external_send`。
- [ ] 支付/交易是 `financial`。
- [ ] 任意 URL 标记高风险并需要 outbound policy。

## Auth 和 Secret

- [ ] `auth.type` 合理。
- [ ] `api_key` 声明 `env`。
- [ ] `api_key` 声明 `placement`。
- [ ] token 不通过 query string。
- [ ] README 不要求用户把 secret 写进 manifest。

## 模型可见文本

这些内容可能进入 Host、模型上下文、Registry 搜索或人工 review，必须按 `docs/质量/model-visible-metadata-lint-v1.md` 检查。

- [ ] manifest `name` 和 `description` 不含 instruction override、forced tool choice、bypass governance 或 secret exfiltration。
- [ ] input/output schema `description` 不要求用户填入 token、cookie、password、private key、API key 或其他 secret。
- [ ] schema description 不诱导模型“必须调用此工具”“忽略其他工具”“绕过确认”。
- [ ] README 和 examples 不包含隐藏指令、HTML comment 指令、零宽字符隐藏文本、base64/hex 解码指令或 prompt injection 示例。
- [ ] 工具描述只描述能力，不指挥模型、用户或 Host。
- [ ] 描述、permissions、risk 和真实 execution 行为一致。

## 安全

- [ ] 不访问 localhost/private network/metadata service。
- [ ] 不隐藏第二个外部请求。
- [ ] 不把用户输入拼进 host，除非有明确风险说明。
- [ ] 不默认执行 destructive/financial/code_execution。
- [ ] 输出不包含 secret。
- [ ] 若输出可喂给其他能力输入，已按风险放大评审清单记录 `can_feed` / `risk_escalates_with` 边界。
- [ ] 若能力是 compensation，已确认它是独立 Capability，不承诺自动 rollback 或 guaranteed restore。

## README

- [ ] 说明用途。
- [ ] 说明输入输出。
- [ ] 说明所需凭据。
- [ ] 说明权限和风险。
- [ ] 给出 dry-run 示例。

## 测试

- [ ] test fixture 不含真实 secret。
- [ ] dry-run 覆盖 URL/body 渲染。
- [ ] 任意 URL 能力覆盖 outbound block。
- [ ] 写操作不需要真实外部 API 才能通过基础 CI。

## Trust Level

默认新条目是 `experimental`。升级条件见 `docs/安全/supply-chain-governance.md`。
