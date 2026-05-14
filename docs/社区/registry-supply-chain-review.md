# Registry 供应链 Review 工作流

本文定义 OpenCap Registry Capability PR 的供应链审查流程。目标不是让审查变慢，而是保证每个进入 registry 的 Capability 都能追溯来源、权限、凭据、测试、维护者和风险。

## 适用范围

适用于所有修改 `registry/` 的 Pull Request，包括：

- 新增 Capability。
- 修改已有 Capability manifest、README、tests。
- 调整 trust level、lifecycle、advisory 或 maintainer metadata。
- 移动分类或重命名 Capability id。

不适用于 npm package 发布；npm 发布见 `docs/运营/package-publishing-v1.md` 和 `docs/releases/release-checklist.md`。

## Review 阶段

```text
PR source
  -> package shape
  -> manifest/schema validation
  -> model-visible metadata lint
  -> permission/risk/auth review
  -> endpoint and data egress review
  -> tests and dry-run evidence
  -> trust/lifecycle/advisory review
  -> merge evidence
```

任一阶段发现 secret、隐藏外发、权限低估、token passthrough 或未声明高风险行为时，PR 必须阻断。

## 1. PR Source

- [ ] PR 修改范围只包含预期 Capability 目录和必要文档。
- [ ] 提交者身份、maintainer 字段和 README 维护者信息一致或有解释。
- [ ] Capability id 与目录名一致，且没有冒充官方 provider 或 OpenCap core。
- [ ] 新增 provider 或分类时，有用户场景和分类理由。
- [ ] 不包含二进制 artifact、压缩包、生成产物或不可审查脚本。

阻断条件：

- 真实 token、cookie、private key、session、OAuth refresh token。
- 未解释的大型生成文件或外部下载脚本。
- 伪装成 `official`、`verified` 或核心维护条目。

## 2. Package Shape

- [ ] 目录为 `registry/<category>/<capability_id>/`。
- [ ] 包含 `manifest.yml`。
- [ ] 包含 `README.md`。
- [ ] 包含至少一个 `tests/*.yml`。
- [ ] 不包含 `.env`、本地数据库、日志、私有配置或 `opencap.local/`。

验证：

```bash
pnpm validate
```

## 3. Manifest / Schema

- [ ] `type: http`。
- [ ] `input` / `output` JSON Schema 清晰。
- [ ] `auth`、`permissions`、`execution`、`metadata.trust_level` 显式声明。
- [ ] `execution.url`、method、headers/body mapping 与 README 一致。
- [ ] `execution.body.fields` 不外发未引用 input。
- [ ] timeout 合理。

阻断条件：

- V1 不支持的 Capability type。
- schema 需要用户输入 secret。
- execution 行为和描述不一致。

## 4. Model-visible Metadata

检查所有可能进入 Host、模型上下文、搜索或人工 review 的文本：

- [ ] manifest `name` / `description`。
- [ ] input/output schema descriptions。
- [ ] README、examples、tests 中的说明。
- [ ] tool/result-facing 文案。

阻断条件：

- 要求模型忽略系统/开发者指令。
- 强制模型必须调用该工具或绕过其他工具。
- 要求绕过 policy、confirmation、audit、secret resolver。
- 使用隐藏文本、HTML comment、零宽字符、base64/hex 指令。

参考：`docs/质量/model-visible-metadata-lint-v1.md`。

## 5. Permission / Risk / Auth

- [ ] permissions 覆盖真实外部行为。
- [ ] risk 没有低估。
- [ ] 写操作不是 `read_only`。
- [ ] destructive、financial、external_send、code_execution、arbitrary URL 风险明确。
- [ ] `auth.type` 合理。
- [ ] `api_key` 使用 env provider 和显式 placement。
- [ ] token 不通过 query string、input 或 README 指令传递。

阻断条件：

- Host/client/input token 被当作 downstream provider token。
- README 要求用户把 secret 放进 manifest、input、URL 或 query string。
- `http.request_demo` 类任意 URL 能力没有 unsafe/risk 标记。

## 6. Endpoint / Data Egress

- [ ] 外部 endpoint 固定且可解释。
- [ ] 不访问 localhost、private network、link-local、metadata service。
- [ ] 用户输入不得控制 host，除非 capability 被明确标为 high risk/unsafe。
- [ ] README 写明会发送哪些字段和数据类别。
- [ ] 结果输出不包含 provider raw body 中的 secret 或敏感内容。

阻断条件：

- 隐藏第二个外部请求。
- 代理/任意 URL 能力伪装成固定 provider 能力。
- 未披露 external_send、PII、source_code 或 internal URL 外发。

## 7. Tests / Evidence

- [ ] `tests/*.yml` 不含真实 secret、私有 URL 或用户数据。
- [ ] 至少覆盖一个 dry-run 或 validation 场景。
- [ ] URL/body 渲染和 permission/risk 期望与 manifest 一致。
- [ ] 任意 URL 或 proxy 能力有 outbound block/unsafe 证据。
- [ ] 写操作可在不调用真实外部 API 的情况下通过基础 CI。

验证：

```bash
pnpm validate
```

必要时附加 targeted test 或人工 review note。

## 8. Trust / Lifecycle / Advisory

- [ ] 新条目默认 `experimental`。
- [ ] 升级为 `listed`、`tested`、`verified` 或 `official` 有证据。
- [ ] deprecated/yanked/revoked 变更写清迁移、原因和影响。
- [ ] 已知 advisory 或 provider 风险写入相关文档/任务。
- [ ] trust level 不作为 Runtime policy 输入。

阻断条件：

- 无证据升级 trust level。
- 已知恶意、泄密或错误权限的 Capability 仍保持普通 listed 状态。

## 9. Merge Evidence

合并前在 PR 评论或 review 记录中留下摘要：

```yaml
registry_supply_chain_review:
  capability: github.create_issue
  pr: <number-or-url>
  reviewer: <name>
  date: 2026-05-14
  commands:
    pnpm_validate: pass
  checks:
    package_shape: pass
    manifest_schema: pass
    model_visible_metadata: pass
    permission_risk_auth: pass
    endpoint_egress: pass
    tests_evidence: pass
    trust_lifecycle_advisory: pass
  decision: approve | request-changes | block
  known_gaps:
    - Trust level remains experimental.
```

不得在 review evidence 中保存 token、provider raw response、私有日志、tool input/output 原文或用户数据。

## 10. 合并后

- [ ] GitHub Actions / CI 仍通过。
- [ ] `docs/TASKS.md` 中相关任务状态真实。
- [ ] 如有 lifecycle/advisory/trust 变化，同步相关文档。
- [ ] 如发现风险，更新 `docs/RISKS.md` 或新增 follow-up task。
- [ ] 不在 release notes 中把 experimental Capability 写成 verified。

## 关联文档

- `docs/社区/registry-guidelines.md`
- `docs/社区/capability-review-checklist.md`
- `docs/教程/review-a-capability.md`
- `docs/安全/least-privilege-review.md`
- `docs/安全/threat-model.md`
- `docs/生态/trust-model-v1.md`
- `docs/生态/capability-deprecation-and-revocation.md`
