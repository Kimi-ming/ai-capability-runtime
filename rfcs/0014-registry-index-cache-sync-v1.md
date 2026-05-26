# RFC 0014：Registry Index、Cache 和 Sync Profile V1

## 状态

草案

## 元数据

| 字段 | 内容 |
| --- | --- |
| 作者 | OpenCap maintainers |
| 创建日期 | 2026-05-26 |
| 目标阶段 | V1 后续 |
| 相关任务 | T272 |
| 相关 ADR | `docs/决策/0021-registry-distribution-model.md` |
| 相关文档 | `docs/生态/registry-distribution.md`, `docs/设计/local-state-v1.md`, `rfcs/0013-registry-index-signing-v1.md` |
| 替代或废弃 | 无 |

## 摘要

本文定义未来 OpenCap Registry index、local cache 和 sync command 的最小 Profile。它让 CLI、Registry Web 或镜像工具可以加速发现、离线查看和检测更新，但不改变 V1 的 Git-based Registry 主路径。

Index/cache/sync 只处理发现和来源证据，不让远程索引绕过 manifest validation、package lint、Registry review、本地 policy、confirmation、outbound policy 或 audit。

## 背景

当前 Registry 是仓库目录：

```text
registry/<category>/<capability_id>/manifest.yml
```

`opencap install` V1 默认从本地 checkout 的 `registry/` 读取。这个模型易 review、易 fork、易 CI，但搜索和离线发现能力弱。RFC 0013 已定义 signed index 的来源和完整性边界；本 RFC 补齐 index 如何被缓存、同步、查询和转化为安装候选。

约束来自已接受 ADR 0021：

- V1 不做远程下载主路径。
- Registry index 只是发现加速，不替代 manifest 原文。
- 安装行为必须可追溯到 Git commit、manifest digest 或 package digest。

## 目标

- 定义 `opencap.registry.index_cache_sync.v1` profile。
- 定义 index entry 中用于 cache/sync 的最小字段。
- 定义本地 cache 目录、状态文件和过期/回滚语义。
- 定义 sync 的 fetch、verify、store、report 四阶段边界。
- 定义 cache/search/install candidate 的安全和审计边界。
- 为后续 CLI `opencap registry sync`、Registry Web 静态搜索和离线 mirror 预留字段。

## 非目标

- 不实现远程 install。
- 不实现中心化 marketplace、ranking、sponsored result 或商业分发。
- 不替代 RFC 0013 的签名 envelope 和 signature verification。
- 不替代 Registry PR review、Capability Review Checklist、package lint 或 registry tests。
- 不定义 OCI artifact、tarball package 分发或 provider credential 交换。

## 术语

| 术语 | 定义 |
| --- | --- |
| Registry index | 从 Registry checkout 或 trusted mirror 生成的发现索引。 |
| Cache snapshot | 本地保存的一份 index envelope、verification evidence 和 sync metadata。 |
| Sync source | 本地文件、Git checkout、HTTPS index URL 或未来 mirror profile。 |
| Sync cursor | 客户端记录的上次同步来源、commit、digest 和时间。 |
| Install candidate | 从 index/cache 派生出的候选条目；必须再读取并验证 manifest 才能安装。 |

## 设计

### Profile 标识

```text
opencap.registry.index_cache_sync.v1
```

该 profile 表示客户端可以安全地把 index 作为发现缓存。它不表示：

- index 中的 Capability 已安装。
- Capability 可以执行。
- 远程 metadata 可以覆盖本地 policy 或 lifecycle gate。
- Host 可以直接把 index entry 暴露成 MCP tool。

### Index Entry 最小字段

Index entry 必须足够支持发现、过滤和 digest pinning，但不能包含 secret、provider response、用户输入或模型生成输出。

```json
{
  "schema": "opencap.registry.index.v1",
  "profile": "opencap.registry.index_cache_sync.v1",
  "generatedAt": "2026-05-26T00:00:00Z",
  "registry": {
    "source": "git",
    "repository": "https://github.com/opencap/opencap",
    "commit": "0123456789abcdef",
    "treeDigest": "sha256:..."
  },
  "capabilities": [
    {
      "id": "github.create_issue",
      "version": "0.1.0",
      "category": "developer-tools",
      "path": "registry/developer-tools/github.create_issue/manifest.yml",
      "manifestDigest": "sha256:...",
      "packageDigest": "sha256:...",
      "lifecycle": "active",
      "trustLevel": "tested",
      "quality": {
        "rubricVersion": "opencap.quality_score.v1",
        "total": 82,
        "band": "tested",
        "policyEffect": "none"
      },
      "advisoryRefs": [],
      "updatedAt": "2026-05-26T00:00:00Z"
    }
  ],
  "indexDigest": "sha256:..."
}
```

Rules:

- `manifestDigest` is the behavior-defining digest used for install candidate verification.
- `packageDigest` covers the package directory when available; clients must tolerate absent values for older indexes.
- `lifecycle`, `trustLevel` and `quality` are display/filter evidence only.
- `quality.policyEffect` must remain `none`.
- `path` is relative to the Registry root and must not escape that root.
- Index generators must omit raw manifest body by default; clients fetch/read manifest separately before install.

### 本地 Cache 布局

Future clients may store cache under the existing state dir:

```text
opencap.local/
  cache/
    registry/
      sources/
        opencap-default/
          index.json
          verification.yml
          sync-state.json
```

`sync-state.json` shape:

```json
{
  "schema": "opencap.registry.sync_state.v1",
  "sourceId": "opencap-default",
  "sourceType": "git",
  "sourceRef": "https://github.com/opencap/opencap",
  "lastSyncedAt": "2026-05-26T00:00:00Z",
  "registryCommit": "0123456789abcdef",
  "indexDigest": "sha256:...",
  "signatureStatus": "none",
  "capabilityCount": 5,
  "warnings": []
}
```

Cache files are derived artifacts. They must be safe to delete and regenerate. They must not be committed to the repository.

### Sync Pipeline

Future `opencap registry sync` should use four phases:

1. Fetch source metadata.
2. Verify index digest and optional RFC 0013 signature evidence.
3. Validate each entry shape and reject path traversal or digest mismatch.
4. Store cache snapshot atomically and report a redacted summary.

Pipeline result:

```yaml
schema: opencap.registry.sync_evidence.v1
profile: opencap.registry.index_cache_sync.v1
source_id: opencap-default
source_type: git
result: pass
synced_at: 2026-05-26T00:00:00Z
registry_commit: 0123456789abcdef
index_digest: sha256:...
signature_status: none
capability_count: 5
warnings: []
notes: Discovery cache only; install and execution gates still apply.
```

Failure semantics:

| Failure | Required behavior |
| --- | --- |
| Source fetch failed | keep previous cache, report `result: fail` |
| Index parse failed | reject new cache snapshot |
| Index digest mismatch | reject new cache snapshot |
| Signature failed | reject new cache snapshot unless explicit unsigned policy allows fallback |
| Entry path traversal | reject the entry and fail sync by default |
| Manifest digest mismatch during install candidate resolution | reject the candidate |
| Older commit than current cache | warn or require explicit rollback approval |

### Search 和 Install Candidate

Search may read cache entries for fast discovery. It must apply the same lifecycle filtering as local Registry search:

- hide `yanked` and `revoked` by default;
- keep `deprecated` discoverable with warning evidence;
- allow explicit include filters for review/debug use.

Installing from a cache entry requires resolving an install candidate:

```yaml
schema: opencap.registry.install_candidate.v1
capability_id: github.create_issue
version: 0.1.0
source_id: opencap-default
registry_commit: 0123456789abcdef
manifest_path: registry/developer-tools/github.create_issue/manifest.yml
manifest_digest: sha256:...
package_digest: sha256:...
verification:
  index_digest: sha256:...
  signature_status: none
```

Before install, the client must:

- read or fetch the manifest/package bytes;
- verify `manifestDigest`;
- run manifest schema validation;
- run package lint when the package directory is available;
- preserve source metadata in installed capability provenance;
- avoid enabling or invoking the capability automatically.

## 安全和隐私

Index/cache/sync does not change Runtime safety ordering. All invocation still goes through policy before execution, then confirmation, secret resolution, outbound policy, execution and audit according to existing Runtime boundaries.

Security requirements:

- Cache entries must not contain secret values, API tokens, provider raw responses, user inputs, tool outputs, private CI logs or database files.
- Sync must write redacted evidence for success, failure, rejected entries and unsupported signatures.
- A cached high trust level or high quality score cannot change install policy or execution policy.
- Revoked/advisory metadata must remain visible to explicit review queries even when hidden from default search.
- Remote cache freshness cannot silently replace an installed capability.
- Cache writes must use a temporary file or directory followed by atomic rename.

Privacy requirements:

- `sourceRef` may contain a public URL or local path, but should not include credentials.
- Verification evidence stores digests, timestamps and source ids, not raw manifests or provider data.
- Enterprise/private registries may choose opaque `sourceId` values if repository URLs are sensitive.

## 兼容性和迁移

- Existing `registry/<category>/<capability_id>/manifest.yml` layout does not change.
- Existing V1 install from local `registry/` remains the default.
- Existing manifests do not need index/cache fields.
- Older clients can ignore `cache/registry/` entirely.
- Future clients should version index, sync state and evidence schema independently.
- Cache files under `opencap.local/cache/` are local state and must not be submitted to Registry PRs.

Migration path:

1. Generate local unsigned index from a checkout for Registry Web/search experiments.
2. Store cache snapshots in `opencap.local/cache/registry/`.
3. Add digest validation and install candidate resolution.
4. Add RFC 0013 signature verification.
5. Add freshness, rollback and mirror policy.

## 验证计划

For this RFC draft:

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/next_task.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
pnpm validate
pnpm build
pnpm lint
pnpm test
```

Future implementation should add:

- index schema validation tests;
- path traversal rejection tests;
- cache atomic write tests;
- sync state parse/upgrade tests;
- lifecycle default filtering tests for cached search;
- manifest digest mismatch install candidate tests;
- rollback/freshness warning tests;
- sync evidence redaction tests.

## 发布和运维

Future rollout should start behind explicit CLI flags such as:

```bash
opencap registry sync --source ./registry
opencap registry search github --source-cache opencap-default
```

Release gates:

- index generator must be deterministic;
- cache writes must be atomic;
- sync evidence must be redacted;
- unsigned remote source behavior must be explicit;
- fallback to previous cache must be visible to the user;
- install from cache must still verify manifest digest and validation.

Operational guidance:

- Deleting `opencap.local/cache/registry/` must be a supported recovery path.
- Compromised source or signing identity should invalidate affected cache snapshots.
- Mirrors should document retention, freshness and rollback policy.

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
| 直接远程安装，不落 cache | 速度快，但供应链证据弱，且绕过 V1 Git-based 主路径。 |
| 把 index 作为 manifest 原文缓存 | 容易让 discovery metadata 变成执行来源，削弱 manifest digest 边界。 |
| 每次 search 都扫描完整 checkout | V1 可行，但 Registry Web、mirror 和离线场景需要稳定 index。 |
| 强制所有 cache 必须有 Sigstore 签名 | 未来公共 registry 合理，但本地 checkout 和企业私有 registry 需要 unsigned/org-signature 路径。 |

## 开放问题

- Cache freshness 超期应默认 warn 还是 fail。
- 多个 mirror 指向同一 commit 时如何合并 source evidence。
- Registry Web 是否需要单独的 index projection，避免暴露内部 review refs。
- Future install-from-index 是否需要单独 policy gate。
- 如何把 advisory feed 与 index cache 解耦更新。

## 决策结果

- 结论：待评审
- 接受/拒绝日期：待定
- 后续 ADR：待定
- 后续任务：
  - Define registry index/cache schema.
  - Add local index generator and schema tests.
  - Add cache sync state helper with atomic writes.
  - Add cached registry search lifecycle filtering tests.
  - Add install candidate digest verification tests.
