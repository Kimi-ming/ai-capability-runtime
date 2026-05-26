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

## 未来 Registry Index

未来可生成静态索引：

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
