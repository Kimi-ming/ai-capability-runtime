# Host 兼容性矩阵

本文定义 OpenCap 如何跟踪 MCP Host 兼容性。不同 Host 对 MCP tools、output schema、elicitation、STDIO 行为的支持可能不同，不能靠假设推进。

## 目标 Host

| Host | V1 目标 | 备注 |
| --- | --- | --- |
| Claude Desktop | 手动配置 OpenCap MCP server | 早期 MCP 本地场景典型 Host |
| Cursor | 开发者工作流 Host | 适合 developer-tools demo |
| ChatGPT Apps / MCP-compatible surfaces | 后续验证 | 不作为 V1 阻塞 |
| 自定义 MCP client | 自动化测试 | 用于 CI/integration tests |

## 能力矩阵

| 能力 | 必须验证 | V1 预期 |
| --- | --- | --- |
| STDIO server 启动 | yes | 支持 |
| `tools/list` | yes | 支持 |
| `tools/call` | yes | 支持 |
| `outputSchema` 展示 | no | 尽力而为 |
| structured result | yes | 支持 |
| elicitation | spike | 不作为初始依赖 |
| tool annotations | no | 不作为安全边界 |
| stderr 日志 | yes | 不影响协议 |

## Tool Metadata 字段兼容性记录

记录口径：`supported` 表示已有测试证据；`pending-smoke` 表示本机识别到 Host 版本但尚未完成手动 smoke；`not-implemented` 表示 OpenCap V1 当前不输出该字段或不把它作为安全边界。

测试日期：2026-05-09。
OpenCap commit：待发布记录应填写具体 commit；当前文档记录基于 `main` 分支 T218。

| Host | Host version | Test date | Profile | `title` | `description` | `outputSchema` | `annotations` | `_meta` | 证据/备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Desktop | 1.3561.0 | 2026-05-09 | `opencap.mcp.tools.v1` | pending-smoke | pending-smoke | pending-smoke | pending-smoke | pending-smoke | 本机 app version 已识别；需要按 `docs/教程/connect-mcp-host.md` 跑手动 smoke 后更新。 |
| Cursor | 3.3.16 | 2026-05-09 | `opencap.mcp.tools.v1` | pending-smoke | pending-smoke | pending-smoke | pending-smoke | pending-smoke | 本机 app version 已识别；适合用 developer-tools demo 做手动 smoke。 |
| 自定义 MCP client | OpenCap helper tests 0.1.0-dev | 2026-05-09 | `opencap.mcp.tools.v1` | supported | supported | supported | not-implemented | not-implemented | `packages/mcp/src/index.test.ts` 和 `tool-projection.test.ts` 覆盖 projection payload；V1 当前不依赖 annotations 或 `_meta` 做安全判断。 |

字段说明：

- `title`、`description`、`outputSchema` 是模型可见或 Host 可见字段，兼容性记录只能说明 Host 是否接收/展示，不能改变 Runtime policy。
- `annotations` 和 `_meta` 未来可用于 Host hints，但 V1 不把它们作为授权、确认、trust 或 policy 输入。
- 如果 Host 忽略 `outputSchema`，OpenCap 仍必须在 Runtime 内执行 output validation/redaction，并返回结构化结果。

## 测试记录模板

```text
Host:
Version:
Date:
OpenCap commit:
Transport: stdio
Config:
Result:
- tools/list:
- tools/call dry-run:
- confirmation_required:
- stderr behavior:
Known issues:
```

## 兼容性原则

- Host 差异不得污染 Runtime 核心。
- MCP Bridge 可以做适配，但 policy/audit/secret 仍在 Runtime。
- 如果 Host 不支持确认，OpenCap 返回 `confirmation_required`。
- 如果 Host 不支持 structured result，仍返回简短 text，但不能只依赖 text。

## 关联任务

- T070：选择 MCP TypeScript SDK 并接入。
- T071：实现 MCP tools/list。
- T072：实现 MCP tools/call。
- T073：confirmation_required 格式。
- T127：维护 MCP Host 兼容性矩阵。
