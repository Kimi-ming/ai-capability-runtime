# 版本和兼容性策略

本文定义 OpenCap 的版本语义、公共契约和兼容性承诺。

## 参考原则

OpenCap 采用 SemVer 思路：

```text
MAJOR.MINOR.PATCH
```

- MAJOR：不兼容的公共契约变化。
- MINOR：向后兼容的功能新增。
- PATCH：向后兼容的修复。

在 `0.x` 阶段，契约仍可能变化，但破坏性变化也必须写入 CHANGELOG 和 ADR。

## 公共契约

OpenCap 的公共契约包括：

- Capability Manifest schema。
- CLI 命令、参数、stdout/stderr 和 exit code。
- Runtime invocation behavior。
- Policy DSL。
- Audit log schema。
- MCP tools 映射和 result shape。
- Registry test format。
- Package exports。

## 兼容性等级

| 等级 | 含义 | 示例 |
| --- | --- | --- |
| Stable | V1.0 后不破坏 | CLI 主命令、Manifest V1 |
| Experimental | 可变化但需记录 | SDK、adapters、Console |
| Internal | 不承诺兼容 | 私有 helper、测试工具 |

## 破坏性变化

以下属于破坏性变化：

- 删除 manifest 字段。
- 改变字段语义。
- 改变 CLI exit code。
- 改变 MCP tool name 映射。
- 改变 audit log 必填字段。
- 改变 policy 决策语义。

破坏性变化要求：

- RFC 或 ADR。
- 迁移说明。
- CHANGELOG。
- 至少一个 release 过渡期，除非是安全紧急修复。

## Deprecation

弃用流程：

```text
mark deprecated
  -> document replacement
  -> keep compatibility for at least one minor release after 1.0
  -> remove in next major release
```

`0.x` 阶段可以更快，但仍需记录。

## Capability Version

Capability 自身 `version` 也使用 SemVer。

Capability breaking examples：

- 输入字段重命名。
- 输出字段删除。
- 权限风险升高。
- auth provider 或 env 变化。

Capability patch examples：

- README 修正。
- timeout 调整。
- output description 修正。

## Runtime Compatibility

未来 manifest metadata 可加入：

```yaml
compatibility:
  opencap: ">=0.1.0 <1.0.0"
```

V1 可先不实现，但 schema 设计应保留扩展空间。
