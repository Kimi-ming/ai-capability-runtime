# Registry 分发模型

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

## Mirror 和 Pinning

未来 install 可以支持：

```bash
opencap install github.create_issue --from https://registry.opencap.dev/index.json --pin <digest>
```

要求：

- pin commit 或 digest。
- 校验 manifest hash。
- 保留 source metadata。

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
