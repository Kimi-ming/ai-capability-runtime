# 能力包 V1：能力包结构

本文定义 OpenCap Registry 中一个 Capability package 的最小目录契约。V1 的 package 是 Git 目录，不是 npm 包，也不是可执行插件。

## 目标

Capability package 要让四类角色同时读懂：

- CLI：能安装、校验和展示。
- Runtime：能加载 manifest 并执行。
- Reviewer：能判断权限、风险和测试是否足够。
- 用户：能知道这个能力会做什么、需要什么权限、有哪些风险。

## 目录结构

```text
registry/<category>/<capability-id>/
  manifest.yml
  README.md
  tests/
    basic.yml
  examples/
    input.json
  trust-card.yml        # optional in V1, future generated
  SECURITY.md           # optional for high-risk capabilities
```

## 必须文件

| 文件 | 作用 | V1 要求 |
| --- | --- | --- |
| `manifest.yml` | 机器可读能力定义 | 必须通过 manifest schema |
| `README.md` | 人类可读说明 | 必须说明用途、输入、输出、权限、风险 |
| `tests/*.yml` | Registry dry-run/validation 测试 | 至少一个 basic test |

## 可选文件

| 文件 | 作用 | 约束 |
| --- | --- | --- |
| `examples/input.json` | 本地 invoke 示例 | 不能包含真实 secret |
| `trust-card.yml` | 信任信息快照 | V1 可人工维护，未来由 CI 生成 |
| `SECURITY.md` | 高风险能力安全说明 | financial/destructive/code_execution 建议必须有 |

## README 必须包含

- Capability id 和简短用途。
- 谁应该安装它。
- 它会访问或发送哪些数据。
- 需要的 auth/provider/scopes。
- permissions 和 risk 的人类解释。
- dry-run 示例。
- 已知限制和失败情况。

## 禁止项

- 在 package 中隐藏安装脚本。
- 在 README 中要求用户把 token 粘到公开文件。
- 在 tests 或 examples 中包含真实凭据。
- 在 package 中提交 `.env`、`.env.*`、`opencap.local/`、SQLite 或 DB 文件。
- 用 README 声明弱化 manifest 中的 risk。
- 用 Registry trust level 覆盖本地 policy。

## Package Lint

`pnpm validate` 会在 manifest schema 和 registry tests 之外执行 Capability package lint。当前机器检查覆盖：

- package 必须包含 `manifest.yml`、`README.md` 和 `tests/basic.yml` 或等价 registry test。
- `manifest.yml` 的 `id` 必须等于 package 目录名。
- `manifest.yml` 的 `metadata.category` 必须等于 Registry 分类目录名。
- package 内不得包含 `.env`、`.env.*`、`opencap.local/`、`.sqlite`、`.sqlite3` 或 `.db` 文件。

Package lint 只验证目录结构和明显本地状态/secret-shaped 文件；它不替代 manifest schema、model-visible metadata lint、least-privilege auth lint、registry tests 或人工 review。

## Package 和 Release Provenance

Manifest 可以预留 `provenance` 字段，用于记录未来 SLSA、Sigstore、npm provenance 或 OCI artifact 的来源证据。该字段只保存摘要、引用和发布来源，不保存 attestation 原文、私钥、token、provider response 或 CI 私有日志。

最小结构：

```yaml
provenance:
  package:
    source: git
    repository: https://github.com/opencap/opencap
    path: registry/developer-tools/github.create_issue
    commit: 0123456789abcdef
    digest: sha256:...
    buildType: manual_review
  release:
    publisher: npm_trusted_publishing
    provenance: npm
    workflowRef: .github/workflows/npm-publish.yml@refs/tags/v0.1.0
    attestationDigest: sha256:...
    transparencyLogRef: rekor:...
  policyEffect: none
```

约束：

- `policyEffect` 必须固定为 `none`，provenance 不能提升 trust level，不能绕过 install policy、Runtime policy、confirmation、outbound policy 或 audit。
- `package.digest` 和 `release.attestationDigest` 只接受 `sha256:<64 hex>` 形式。
- `package.path` 不能包含路径穿越。
- `release.provenance` 只表示来源证明类型，例如 `npm`、`future_slsa` 或 `future_sigstore`。

## Trust Card V1

Trust Card 是用户看到的能力信任摘要。V1 可以从 manifest、registry metadata、CI 状态和 review 状态生成：

```yaml
capability: github.create_issue
version: 0.1.0
manifest: valid
package: valid
permissions: write
trust_level: community_listed
tests: passing
last_reviewed: 2026-05-07
known_limitations:
  - Requires a GitHub token with issue write access.
```

Trust Card 不是安全保证，它只是把可验证事实集中展示。

## 安装语义

V1 `opencap install <id>` 应安装 package 的可执行定义和必要元数据：

- manifest。
- package README 摘要或路径引用。
- trust metadata。
- tests metadata 可选。

安装不得执行 package 中的任意脚本。

## 关联任务

- T011：install。
- T080：Registry manifest CI。
- T081：Capability Review Checklist。
- T125：CLI list 输出 lifecycle/trust card 基础字段。
- T151：Capability Package lint。
- T158：Trust Card generation rules。
- T274：SLSA/Sigstore provenance metadata 预留。
