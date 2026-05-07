# 路线图

## v0.1：Local Runtime

目标：

```text
安装 Capability，通过 MCP 暴露，带策略检查执行，并写入调用日志。
```

范围：

- manifest schema
- CLI 骨架
- 本地 registry install
- MCP server 模式
- HTTP Capability executor
- 本地 policy 文件
- SQLite invocation logs

## v0.2：Registry

目标：

```text
社区可以提交 Capability，CI 自动校验。
```

范围：

- registry 目录规范
- CI manifest validation
- mock test 格式
- registry contribution checklist
- trust levels

## v0.3：Adapters

目标：

```text
把已有工具面转换成 OpenCap Capability。
```

范围：

- OpenAPI to Capability
- MCP tool to Capability
- HTTP endpoint to Capability
- CLI command to Capability

## v0.4：Console

目标：

```text
用户可以在本地 UI 查看已安装能力、策略和日志。
```

范围：

- 已安装 Capability 列表
- Policy editor
- Invocation log viewer
- 风险展示

## v0.5：Verified Capabilities

目标：

```text
Registry 条目携带有用的信任元数据。
```

范围：

- test status
- maintainer verification
- security review state
- permission scoring
- version signing research

## v1.0：Capability Network

目标：

```text
OpenCap 成为可本地运行、可自托管、可跨 Host 使用的能力层。
```

范围：

- self-hosted registry
- organization workspaces
- team policy controls
- remote runtime mode
- multi-host compatibility
- Capability composition
