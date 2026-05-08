# Capability Review Checklist

本文是 Registry Capability PR 的人工评审清单。

## 基础结构

- [ ] 目录位于 `registry/<category>/<capability_id>/`。
- [ ] `manifest.yml` 存在。
- [ ] `README.md` 存在。
- [ ] `tests/basic.yml` 或等价测试存在。
- [ ] Capability id 与目录名一致。

## Manifest

- [ ] schema 校验通过。
- [ ] `type` 是 V1 支持的 `http`。
- [ ] `input` 和 `output` 是清晰 JSON Schema。
- [ ] `execution.method` 和 `execution.url` 与描述一致。
- [ ] POST/PUT/PATCH 写操作声明了 `execution.body`。
- [ ] `timeout_ms` 合理。

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

## 安全

- [ ] model-visible name、description、schema descriptions 不含 prompt injection、强制调用、绕过确认或泄露 secret 的文本。
- [ ] 工具描述只描述能力，不指挥模型、用户或 Host。
- [ ] 描述、permissions、risk 和真实 execution 行为一致。
- [ ] 不访问 localhost/private network/metadata service。
- [ ] 不隐藏第二个外部请求。
- [ ] 不把用户输入拼进 host，除非有明确风险说明。
- [ ] 不默认执行 destructive/financial/code_execution。
- [ ] 输出不包含 secret。

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

默认新条目是 `experimental`。升级条件见 `docs/security/supply-chain-governance.md`。
