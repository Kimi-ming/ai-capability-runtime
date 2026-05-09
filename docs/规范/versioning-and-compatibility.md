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


## 版本轨道

OpenCap 同时维护三条版本轨道：

| 轨道 | 当前阶段 | 兼容对象 | 记录位置 |
| --- | --- | --- | --- |
| Package version | `0.x` | npm packages、CLI、Runtime exports | `package.json`、CHANGELOG |
| Manifest schema version | V1 early | `manifest.yml` 字段、语义和校验规则 | `packages/spec/schema/manifest.schema.json`、`docs/规范/manifest-evolution.md` |
| Registry compatibility | Git-based V1 | Registry package 结构、tests 格式、trust metadata | `registry/`、`docs/社区/registry-guidelines.md`、`registry/README.md` |

这三条轨道相关但不能混用。Package 升级不一定改变 manifest schema；Capability `version` 升级也不代表 Runtime package 升级。

## Package Versions

所有 workspace package 在 `0.x` 阶段可以同步版本，也可以在未来按包独立发布。发布前必须确认：

- root `package.json` 和各 package version 语义一致。
- `@opencap/spec` 的 schema 变化已经写入 CHANGELOG。
- `@opencap/runtime` 的 invocation、policy、audit 或 executor 行为变化已经写入 CHANGELOG。
- `@opencap/cli` 的命令、参数、stdout/stderr 或 exit code 变化已经写入 CHANGELOG。
- `@opencap/mcp` 的 tool name、metadata、result shape 或 error mapping 变化已经写入 CHANGELOG。

`0.x` 阶段允许 breaking change，但不能静默发生。每次 breaking change 至少要有 CHANGELOG 条目和迁移说明；影响 manifest、policy、audit、MCP result shape 或 registry 规则时，还需要 ADR 或 RFC。

## Manifest Schema Version

当前 V1 早期 manifest 没有强制 `schema_version` 字段，schema 身份由 JSON Schema `$id` 和 package 版本共同表达。

兼容规则：

- 新增可选字段通常是兼容变化。
- 新增必填字段是 breaking change。
- 字段类型、默认值、安全语义、权限语义变化是 breaking change。
- 新增 Capability `type` 必须走 RFC。
- Registry CI 在过渡期可以同时接受旧 schema 和新 schema，但必须有明确结束时间。

进入稳定阶段后，manifest 应增加显式：

```yaml
schema_version: 1
```

在那之前，Registry entry 以 `manifest.yml` 的 `version` 表达 Capability 自身版本，以当前 `@opencap/spec` 版本表达校验器版本。两者不能互相替代。

## Registry Compatibility

Registry 兼容性包括目录结构和测试格式：

```text
registry/<category>/<capability-id>/
  manifest.yml
  README.md
  tests/*.yml
```

兼容变化：

- 新增可选 metadata。
- 新增可选 tests 字段。
- 新增 category，但不改变已有路径。
- README 要求更严格，但不影响 Runtime install。

破坏性变化：

- 改变 Capability 目录结构。
- 改变 `tests/*.yml` 必填字段。
- 改变 trust level 枚举或默认含义。
- 要求旧 manifest 必须新增字段才能通过 CI。

Registry breaking change 必须提供迁移窗口，并在 alpha/beta 阶段至少记录到 CHANGELOG 和 TASKS。1.0 后还需要迁移工具或兼容校验提示。

## Alpha、Beta 和 1.0 口径

| 阶段 | 兼容承诺 | 允许变化 | 必须记录 |
| --- | --- | --- | --- |
| Alpha | 可试用，不承诺稳定 | breaking change 允许 | CHANGELOG、HANDOFF、必要时 ADR/RFC |
| Beta | 主路径趋稳 | breaking change 需要迁移说明 | CHANGELOG、迁移说明、release checklist |
| 1.0 | 公共契约稳定 | breaking change 只进 major | SemVer、迁移指南、deprecation window |

Alpha 不能把未完成能力当作兼容承诺。例如完整 MCP server、Console、Cloud、OAuth、signed registry 都不能被写成已支持。

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
