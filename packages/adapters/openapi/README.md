# OpenAPI 适配器

OpenAPI Adapter 是未来能力，用于把 OpenAPI operation 转换成 OpenCap Capability。

目标流程：

```text
OpenAPI document -> selected operation -> Capability Manifest draft -> validation -> review -> registry PR -> install
```

该 adapter 不属于第一阶段 Runtime 里程碑。当前设计草案见 `../../../rfcs/0015-openapi-adapter-profile-v1.md`。

重要边界：

- 不把整份 OpenAPI 文档自动暴露为 MCP tools。
- 不自动信任 OpenAPI description、examples、servers 或 securitySchemes。
- 不生成或保存 secret、token、Authorization header value 或 provider raw response。
- 生成的 manifest draft 仍必须通过 OpenCap validation、lint、review 和 Runtime policy/audit 主路径。
