# RFC 0013：Registry Index Signing V1

## 状态

草案

## 元数据

| 字段 | 内容 |
| --- | --- |
| 作者 | OpenCap maintainers |
| 创建日期 | 2026-05-14 |
| 目标阶段 | V1 后续 |
| 相关任务 | T147 |
| 相关 ADR | 无 |
| 相关文档 | `docs/生态/registry-distribution.md`, `docs/安全/signing-and-provenance-roadmap.md`, `docs/安全/supply-chain-governance.md` |
| 替代或废弃 | 无 |

## 摘要

本文定义未来 OpenCap Registry 静态索引的签名边界和最小 manifest。Registry index signing 只证明索引来自预期发布身份且内容未被篡改；它不证明 Capability 安全、不提升 trust level，也不能绕过 manifest validation、Registry review、本地 policy、confirmation、outbound policy 或 audit。

OpenCap V1 仍保持 Git-based Registry 和本地 install 主路径。Signed index 是后续 discovery、mirror、cache 和 offline verification 的兼容点，不是 V1 Runtime 启动依赖。

## 背景

当前 Registry 是仓库目录：

```text
registry/<category>/<capability_id>/manifest.yml
```

未来 Registry Web、mirror 或 CLI search 可能需要生成静态索引，加速发现和筛选：

```json
{
  "generated_at": "2026-05-14T00:00:00Z",
  "commit": "git-sha",
  "capabilities": []
}
```

如果索引没有签名和 digest，远程 mirror 或缓存可能被替换、回滚或混入未 review 的条目。但如果把签名解释成安全认证，又会削弱 OpenCap 的核心治理边界。

## 目标

- 定义 future registry index 的最小可签名 envelope。
- 定义 capability entry digest、manifest digest、registry commit 和生成器信息。
- 定义 signature status 和 verification evidence，供 CLI、Registry Web、Trust Card 或 compatibility record 引用。
- 明确签名不是授权、不是 trust level、不是 review 结论。
- 为后续 Sigstore/cosign、org signature、offline mirror 和 digest pinning 预留字段。

## 非目标

- V1 不实现 index generator、signature verifier、remote install 或 mirror sync。
- 不定义中心化 marketplace。
- 不定义 paid placement、ranking、sponsored results 或商业分发。
- 不把 signed index 作为 OSS Runtime 启动依赖。
- 不替代 Registry PR review、Capability Review Checklist 或 supply-chain review。

## 术语

| 术语 | 定义 |
| --- | --- |
| Registry index | 从 `registry/**/manifest.yml` 和 review metadata 生成的发现索引。 |
| Index envelope | 包含 index metadata、capability entries、digest 和 signature metadata 的可签名对象。 |
| Manifest digest | 单个 Capability manifest 的 canonical digest。 |
| Index digest | 整个 index envelope 的 canonical digest，不包含 signature bytes 自身。 |
| Signing identity | 生成签名的 OIDC identity、组织 key 或 future trust root identity。 |
| Verification evidence | Runtime/CLI/Registry Web 记录的签名验证结果摘要。 |

## 设计

### Profile 标识

```text
opencap.registry.index_signing.v1
```

该 profile 表示 index 可以被验证来源和完整性。它不表示：

- index 中的 Capability 已被官方认证。
- Capability 可被自动安装或自动执行。
- 本地 policy 可以被远程签名覆盖。
- Host 可以把 signed index 结果直接暴露为已安装 tool。

### Index Envelope

未来 index generator 应输出一个 canonical JSON envelope：

```json
{
  "schema": "opencap.registry.index.v1",
  "profile": "opencap.registry.index_signing.v1",
  "generatedAt": "2026-05-14T00:00:00Z",
  "registry": {
    "source": "git",
    "repository": "https://github.com/opencap/opencap",
    "commit": "0123456789abcdef",
    "treeDigest": "sha256:..."
  },
  "generator": {
    "name": "opencap-registry-indexer",
    "version": "0.1.0",
    "commit": "0123456789abcdef"
  },
  "capabilities": [
    {
      "id": "github.create_issue",
      "version": "0.1.0",
      "category": "developer-tools",
      "path": "registry/developer-tools/github.create_issue/manifest.yml",
      "manifestDigest": "sha256:...",
      "packageDigest": "sha256:...",
      "trustLevel": "experimental",
      "lifecycle": "active",
      "reviewRef": "registry-review-2026-05-14-github-create-issue"
    }
  ],
  "indexDigest": "sha256:...",
  "signatures": []
}
```

Rules:

- `indexDigest` is computed over the canonical envelope with `signatures` omitted or empty.
- `manifestDigest` is the behavior-defining digest used for install and audit identity.
- `packageDigest` covers the Capability package directory when package lint exists; until then it may be omitted.
- `reviewRef` points to review evidence, not to raw private logs or provider responses.
- Entry fields are discovery metadata and cannot affect policy decisions.

### Signature Metadata

The `signatures` array is optional in V1-compatible drafts:

```json
{
  "type": "future_sigstore",
  "signatureDigest": "sha256:...",
  "certificateIdentity": "https://github.com/opencap/opencap/.github/workflows/release.yml@refs/heads/main",
  "issuer": "https://token.actions.githubusercontent.com",
  "transparencyLogRef": "rekor:...",
  "signedAt": "2026-05-14T00:00:00Z",
  "verification": {
    "status": "verified",
    "verifiedAt": "2026-05-14T00:00:00Z",
    "verifier": "opencap-cli/0.1.0",
    "reason": "index digest and signing identity matched configured trust root"
  }
}
```

Allowed future signature types:

| Type | Intended use |
| --- | --- |
| `none` | Local development or unsigned V1-compatible index. |
| `future_sigstore` | Keyless signing with OIDC identity and transparency log. |
| `future_org_signature` | Enterprise/private registry signing root. |

Unknown signature types must be treated as `unsupported`, not as verified.

### Verification Evidence

CLI、Registry Web 或 future sync command 可以记录 verification evidence：

```yaml
schema: opencap.registry.index_verification.v1
profile: opencap.registry.index_signing.v1
verified_at: 2026-05-14T00:00:00Z
index_digest: sha256:...
registry_commit: 0123456789abcdef
signature_status: verified # none | verified | failed | unsupported
signing_identity: https://github.com/opencap/opencap/.github/workflows/release.yml@refs/heads/main
trust_root: opencap.release.github_actions
result: pass
notes: Signature verified source and integrity only; policy and review still apply.
```

Evidence must not include token, certificate private key, provider raw response, Capability input/output, or private CI logs.

## 安全和隐私

Signed index verification must run before trusting remote discovery metadata, but after verification the client must still:

- validate the selected `manifest.yml`;
- compare `manifestDigest` with the fetched manifest;
- apply Registry lifecycle/advisory filters;
- apply local install policy;
- evaluate Runtime policy before invocation;
- request confirmation when required;
- write audit evidence for install/sync decisions when implemented.

Failure semantics:

| Failure | Required behavior |
| --- | --- |
| Index digest mismatch | reject index and record `signature_status=failed` |
| Signature invalid | reject index and record `signature_status=failed` |
| Unknown signature type | treat as unsigned/unsupported according to user policy |
| Manifest digest mismatch | reject the Capability entry even if index signature passed |
| Registry commit not allowed | reject or require explicit user/org approval |
| Clock or freshness check failed | warn or reject according to configured policy |

Signature verification cannot override hard safety floors such as revoked/malicious Capability block, data egress deny, outbound private network block, token passthrough prevention or audit preflight failure.

## 兼容性和迁移

This RFC is future-compatible with V1:

- V1 local Registry remains usable without any index file.
- Existing `registry/<category>/<capability_id>/manifest.yml` layout does not change.
- Existing manifests do not need signature fields.
- Future CLI can support `--from <index>` and `--pin <digest>` without changing local install semantics.
- Future Registry Web can display signature verification as source/integrity evidence, not as trust level.

Migration path:

1. Generate unsigned index for local Registry Web/search experiments.
2. Add digest verification for index and manifest entries.
3. Add optional signature verification.
4. Add mirror freshness and rollback policy.
5. Add install pinning and verification evidence export.

## 验证计划

For this RFC draft:

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
pnpm validate
pnpm build
pnpm lint
pnpm test
```

Future implementation should add:

- index canonicalization tests;
- index digest mismatch negative tests;
- manifest digest mismatch negative tests;
- unsupported signature type tests;
- verified/failed/none verification evidence tests;
- install-from-index tests that still run manifest validation and policy gates.

## 发布和运维

Future signed index releases should be gated by:

- protected branch or protected release workflow;
- read-only default GitHub Actions token except where signing requires scoped permissions;
- dependency review and security baseline workflow;
- release evidence record containing index digest, registry commit, signing identity and verification status;
- documented rollback procedure for compromised index or signing identity.

Private or enterprise registries may use `future_org_signature`, but must document their trust root and offline verification story. Public transparency log identity may expose organization/workflow identity; private deployments should decide whether that is acceptable.

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
| Sign every manifest directly in V1 | More precise, but too early before package lint, identity and registry index shape settle. |
| Trust Git commit only | Useful for local checkout, but insufficient for remote mirrors and cached indexes. |
| Require Sigstore for all registries | Good public default later, but too restrictive for self-hosted enterprise registries. |
| Treat signed index as trust level upgrade | Rejected because signing proves source/integrity, not safety or least privilege. |

## 开放问题

- Canonical JSON format and hashing rules.
- Whether index freshness should be a warning or hard failure.
- How to represent multiple mirrors with the same registry commit.
- Whether signed release artifacts and signed index share the same trust root.
- How Registry Web should display signed source evidence without making it look like certification.

## 决策结果

- 结论：待评审
- 接受/拒绝日期：待定
- 后续 ADR：待定
- 后续任务：
  - Define registry index schema.
  - Add index generator and canonicalization tests.
  - Add optional signature verification helper.
  - Add install-from-index digest pinning tests.
