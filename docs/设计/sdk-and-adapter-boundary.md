# SDK 和适配器边界

本文定义 V1 中 SDK、adapters 与 Runtime 核心的关系。

## 当前状态

V1 主路径不依赖 SDK 或 adapters。它只需要：

```text
manifest.yml -> CLI -> Runtime -> MCP/HTTP
```

SDK 和 adapters 是增强层，不是 Runtime 成立的前提。当前 `@opencap/sdk` 已提供 V1 manifest authoring helper，用于在 TypeScript 中定义和校验 HTTP Capability Manifest draft；它不参与安装、执行、授权或审计。

## SDK 目标

TypeScript SDK 当前只用于代码式定义 manifest draft：

```ts
defineHttpCapabilityManifest({ ... })
defineValidHttpCapabilityManifest({ ... })
```

SDK 输出必须能映射回 manifest。Manifest 仍是 Registry 和 Runtime 的事实契约。

SDK helper 复用 `@opencap/spec` 的 `validateCapabilityAuthoringManifest()`，所以校验顺序仍是 manifest schema、package/authoring 边界、model-visible metadata lint、least-privilege/risk lint、secret hygiene、registry tests、dry-run 和 review-ready。SDK helper 返回结构化 validation issues，或由 `defineValidHttpCapabilityManifest()` 抛出 `SdkCapabilityAuthoringError`，供本地 authoring 脚本和测试使用。

SDK helper 的输出仍必须保存为 Capability package，并继续经过：

- `opencap validate`
- Capability package lint
- model-visible metadata lint
- least-privilege/risk lint
- registry tests
- human review

## Adapter 类型

| Adapter | 目标 | V1 状态 |
| --- | --- | --- |
| HTTP | 执行 HTTP Capability | Runtime core |
| OpenAPI | 从 OpenAPI 生成候选 Capability | future |
| MCP Proxy | 把外部 MCP server 包装成 Capability | future |
| Local Command | 本地命令执行 | future/high risk |

## 边界规则

- SDK 不能成为 Runtime plugin API。
- SDK 不能要求或接受 `run()` handler。
- SDK 不能安装或执行 Capability。
- SDK 不能读取 provider secret、写 state dir 或触网。
- SDK 不能改变 policy、audit、trust、authorization 或 Runtime execution。
- Adapter 不能绕过 manifest validation。
- Adapter 不能绕过 policy/audit。
- Adapter 生成的 Capability 必须进入 review。
- OpenAPI adapter 不能自动暴露整个 API。
- Local command adapter 必须先有 sandbox 设计。

## SDK 非目标 V1

V1 不要求：

- 支持 runtime plugin API。
- 支持第三方 executor。
- 支持代码式 Capability registry。
- 用 SDK output 替代 Registry/Runtime 的 `manifest.yml` 事实契约。

## 关联任务

- T123：npm package 发布预案。
- T145：SDK/API public surface 定义。
- T146：OpenAPI adapter RFC 草案。
- T359：定义 `@opencap/sdk` V1 manifest authoring helper。
- T360：把 SDK manifest authoring helper 纳入作者教程和测试文档。
