# SDK 和适配器边界

本文定义 V1 中 SDK、adapters 与 Runtime 核心的关系。

## 当前状态

V1 主路径不依赖 SDK 或 adapters。它只需要：

```text
manifest.yml -> CLI -> Runtime -> MCP/HTTP
```

SDK 和 adapters 是增强层，不是 Runtime 成立的前提。

## SDK 目标

未来 TypeScript SDK 用于代码式定义 Capability：

```ts
defineCapability({ ... })
```

但 SDK 输出必须能映射回 manifest。Manifest 仍是 Registry 和 Runtime 的事实契约。

## Adapter 类型

| Adapter | 目标 | V1 状态 |
| --- | --- | --- |
| HTTP | 执行 HTTP Capability | Runtime core |
| OpenAPI | 从 OpenAPI 生成候选 Capability | future |
| MCP Proxy | 把外部 MCP server 包装成 Capability | future |
| Local Command | 本地命令执行 | future/high risk |

## 边界规则

- Adapter 不能绕过 manifest validation。
- Adapter 不能绕过 policy/audit。
- Adapter 生成的 Capability 必须进入 review。
- OpenAPI adapter 不能自动暴露整个 API。
- Local command adapter 必须先有 sandbox 设计。

## SDK 非目标 V1

V1 不要求：

- 发布 `@opencap/sdk`。
- 支持 runtime plugin API。
- 支持第三方 executor。
- 支持代码式 Capability registry。

## 关联任务

- T123：npm package 发布预案。
- T145：SDK/API public surface 定义。
- T146：OpenAPI adapter RFC 草案。
