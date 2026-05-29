# 注册表分发模型

本文定义 OpenCap Registry 从 V1 Git-based 模式到未来索引和镜像的演进路径。

## V1：Git-based Registry

V1 registry 是仓库目录：

```text
registry/<category>/<capability_id>/manifest.yml
```

优点：

- 易 review。
- 易 fork。
- 易 CI。
- 易审计历史。

限制：

- 搜索弱。
- 安装依赖本地 checkout。
- 无签名元数据。
- 无分布式镜像。

## V1 Install Source

默认 install 从本地 `registry/` 读取。远程下载不属于 V1 主路径。

原因：

- 降低供应链风险。
- 让所有安装都可追溯到 Git commit。
- 避免过早设计中心化服务。

## 本地 Registry Index Artifact

当前 CLI 可从本地 Registry checkout 生成未签名 discovery/cache 索引：

```bash
opencap registry index build \
  --registry registry \
  --output docs/releases/evidence/<release-id>-registry-index.json \
  --json
opencap registry index validate \
  --file docs/releases/evidence/<release-id>-registry-index.json \
  --output docs/releases/evidence/<release-id>-registry-index-validation.json \
  --json
```

输出 artifact 使用 `opencap.registry.index.v1` schema 和 `opencap.registry.index_cache_sync.v1` profile，包含 capability id、version、category、relative manifest path、manifest digest、lifecycle、manifest trust level、quality/advisory 摘要、default install trust、blocking reasons、`signatureStatus: "none"`、`policyEffect: "none"` 和稳定 `indexDigest`。

`opencap registry index validate` 输出 `opencap.registry_index_validation.v1` validation report，用于证明保存后的 unsigned index artifact 结构可解析、关键字段脱敏且 `indexDigest` 一致。Invalid artifact 返回 exit `1`；`--output` 会安全写出 report，并拒绝 `.env`、token/secret/password、`opencap.local/`、SQLite/DB/log 和目录路径。

该 artifact 和 validation report 的用途是本地发现、离线查看、未来 cache/sync 输入和 release evidence 引用。Validation report 只证明 saved unsigned index artifact 的结构、脱敏边界和 digest 一致性，不替代 manifest validation、Registry review、Capability package lint、registry tests、advisory/lifecycle gates、本地 policy、release evidence validation、签名验证、install audit 或 execute audit。`http.request_demo` 这类 unsafe/revoked 示例即使出现在 index 中，也不能因此成为默认可信安装能力。

Index 和 validation report 不包含 manifest 原文、auth env、secret、provider raw response、input/output/execution 原文、`opencap.local/`、SQLite/DB/log 或私有绝对路径。Build/validate 命令不签名、不安装或执行 Capability、不写 state dir、不读取 provider secret、不触网，也不改变 trust、policy、authorization 或 Runtime execution。

## 未来签名、Cache 和 Sync

未来可以围绕静态索引增加签名、远程分发和本地缓存：

```json
{
  "generated_at": "...",
  "commit": "...",
  "capabilities": []
}
```

索引只加速发现，不替代 manifest 原文。

索引签名边界见 `rfcs/0013-registry-index-signing-v1.md`。该 RFC 草案明确：签名只证明索引来源和完整性，不证明 Capability 安全、不提升 trust level，也不能绕过 manifest validation、本地 policy、confirmation、outbound policy 或 audit。

Index/cache/sync profile 见 `rfcs/0014-registry-index-cache-sync-v1.md`。该 RFC 草案定义未来 index entry、`opencap.local/cache/registry/` 本地缓存布局、sync state、install candidate 和 sync evidence；cache 只作为 discovery 加速和离线查看来源，不能让远程 metadata 静默替换 installed capability。

Registry graph index 草案见 `docs/生态/registry-graph-index-v1.md`。该草案定义 future `graph-index.json` 如何从 Capability graph metadata、risk amplification review evidence 和 conformance evidence 派生；graph index 只能用于 review/discovery/inspection，不能生成 workflow、自动安装、暴露 MCP tools 或改变 Runtime policy。

## Mirror 和 Pinning

未来 install 可以支持：

```bash
opencap install github.create_issue --from https://registry.opencap.dev/index.json --pin <digest>
```

要求：

- pin commit 或 digest。
- 校验 manifest hash。
- 保留 source metadata。
- 从 cache 派生的 install candidate 仍必须重新读取并 validate manifest。

## OCI/Artifact 方向

Capability package 未来可以作为 OCI artifact 或 tarball 分发，但 V1 不实现。

进入该阶段前必须解决：

- 签名。
- provenance。
- trust root。
- offline verification。
- package immutability。

## 安全原则

- Registry discovery 不是安全边界。
- 安装时仍必须 validate manifest。
- 本地 policy 永远优先于 registry trust。
- 远程 registry 不得静默更新 installed capability。
