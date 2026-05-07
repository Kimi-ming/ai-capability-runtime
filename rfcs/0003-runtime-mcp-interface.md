# RFC 0003：Runtime MCP 接口

## 状态

草案

## 摘要

定义 OpenCap 如何把已安装 Capability 暴露给 MCP-compatible Host。

## 动机

用户不应该为每个外部服务安装一个 MCP Server。OpenCap 可以作为单一 MCP Gateway，把已安装 Capability 暴露为 tools。

## 提案

`opencap serve --mcp` 启动 MCP Server。

对每个已安装 Capability：

- 暴露一个 MCP tool
- 使用 Capability input schema 作为 tool input schema
- 尽可能在 tool description 中包含权限元数据
- 执行前校验输入
- 调用必须经过 policy engine
- 写入审计日志

## 工具命名

工具名来自 Capability id。例如：

```text
github.create_issue -> github_create_issue
```

V1 必须检测命名冲突并 fail fast。

## 待解决问题

- 如何捕获 Host identity？
- 不同 Host 中确认 prompt 如何实现？
- 是否需要额外 introspection tool 显示已安装 Capabilities？
