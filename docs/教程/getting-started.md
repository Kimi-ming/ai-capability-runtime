# 快速入门

本文说明 OpenCap V1 预期的开发者流程。当前部分命令仍是骨架，后续实现会按这里的闭环推进。

## 前置条件

- Node.js 22 或更新版本
- pnpm 9 或更新版本
- 用于测试 Runtime 的 MCP-compatible Host
- 用于 `github.create_issue` demo 的 GitHub token

## 安装依赖

```bash
pnpm install
```

## 校验示例 Registry

```bash
pnpm validate
```

该命令会用 OpenCap schema 校验示例 Capability manifests。

## 查看一个 Capability

打开示例：

```bash
registry/developer-tools/github.create_issue/manifest.yml
```

它声明了：

- 工具输入 schema
- 输出 schema
- GitHub 认证需求
- 写操作权限
- HTTP 执行目标

## 安装 Capability

V1 预期命令：

```bash
opencap install github.create_issue
```

Runtime 应将已安装能力保存到本地状态目录，并通过 `opencap serve --mcp` 暴露给 Host。

## 配置 MCP Host

Runtime 实现后，可以这样配置：

```json
{
  "mcpServers": {
    "opencap": {
      "command": "opencap",
      "args": ["serve", "--mcp"]
    }
  }
}
```

## Runtime 调用流程

当 AI Host 调用 `github.create_issue` 时，OpenCap 应该：

1. 校验输入
2. 识别所需权限
3. 应用本地策略
4. 必要时请求确认
5. 从 Secret Resolver 读取凭据
6. 调用 GitHub API
7. 返回结构化结果
8. 写入调用日志
