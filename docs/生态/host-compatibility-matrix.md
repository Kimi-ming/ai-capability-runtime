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
OpenCap commit：待发布记录应填写具体 commit；当前文档记录基于 `main` 分支 T226 工作区，提交后以 Git 历史为准。

| Host | Host version | Test date | Profile | `title` | `description` | `outputSchema` | `annotations` | `_meta` | 证据/备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Desktop | 1.3561.0 | 2026-05-09 | `opencap.mcp.tools.v1` | pending-smoke | pending-smoke | pending-smoke | pending-smoke | pending-smoke | 本机 app version 已识别；需要按 `docs/教程/connect-mcp-host.md` 跑手动 smoke 后更新。 |
| Cursor | 3.3.16 | 2026-05-09 | `opencap.mcp.tools.v1` | pending-smoke | pending-smoke | pending-smoke | pending-smoke | pending-smoke | 本机 app version 已识别；适合用 developer-tools demo 做手动 smoke。 |
| 自定义 MCP client | OpenCap helper tests 0.1.0-dev | 2026-05-09 | `opencap.mcp.tools.v1` | supported | supported | supported | not-implemented | not-implemented | `packages/mcp/src/index.test.ts` 和 `tool-projection.test.ts` 覆盖 projection payload；V1 当前不依赖 annotations 或 `_meta` 做安全判断。 |

字段说明：

- `title`、`description`、`outputSchema` 是模型可见或 Host 可见字段，兼容性记录只能说明 Host 是否接收/展示，不能改变 Runtime policy。
- `annotations` 和 `_meta` 未来可用于 Host hints，但 V1 不把它们作为授权、确认、trust 或 policy 输入。
- 如果 Host 忽略 `outputSchema`，OpenCap 仍必须在 Runtime 内执行 output validation/redaction，并返回结构化结果。

## Tool Result 字段兼容性记录

记录口径：本表只记录 Host/adapter 对 MCP tool result 字段的处理证据。`supported` 表示已有自动化或手动证据；`pending-smoke` 表示已识别 Host 版本但尚未完成手动 Host 调用；`runtime-owned` 表示该安全属性由 OpenCap Runtime 保证，不由 Host 行为保证。

测试日期：2026-05-09。
本机版本识别证据：

```bash
/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' /Applications/Claude.app/Contents/Info.plist
/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' /Applications/Cursor.app/Contents/Info.plist
```

| Host | Host version | Test date | Profile | `structuredContent` | `content[].text` | `isError` | `outputSchema` result behavior | 证据/备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Desktop | 1.3561.0 | 2026-05-09 | `opencap.mcp.result.v1` | pending-smoke | pending-smoke | pending-smoke | pending-smoke | 本机 app version 已识别；尚未在真实 Host 中完成 result smoke。安全结论保持 `runtime-owned`。 |
| Cursor | 3.3.16 | 2026-05-09 | `opencap.mcp.result.v1` | pending-smoke | pending-smoke | pending-smoke | pending-smoke | 本机 app version 已识别；尚未在真实 Host 中完成 result smoke。适合用 `github.create_issue` dry-run/confirmation_required 场景验证。 |
| 自定义 MCP client | OpenCap helper tests 0.1.0-dev | 2026-05-09 | `opencap.mcp.result.v1` | supported | supported | supported | runtime-owned | `packages/mcp/src/result-adapter.test.ts` 覆盖 success、failed、blocked、confirmation_required：`structuredContent` 原样来自 Result Envelope；`content[].text` 只使用 Runtime-generated summary；`isError` 按 envelope status 映射。output schema validation 已在 Runtime 的 `packages/runtime/src/output-validation.test.ts` 覆盖，不交给 Host 执行。 |

字段行为说明：

- `structuredContent` 是首选机器可读结果，但 OpenCap 的 validation、redaction、sanitization、size limit 和 provenance 已在 Runtime 完成。
- `content[].text` 是兼容 fallback，只能是 Runtime 生成的短摘要；即使 Host 会把 text 再放进模型上下文，也不会收到 provider raw body。
- `isError` 用于表达工具调用结果，不作为 JSON-RPC protocol error，也不能改变 audit outcome。
- `outputSchema` 在 Host 侧的展示或忽略都只影响体验；schema mismatch 必须由 Runtime 产生 `OUTPUT_SCHEMA_INVALID` failed envelope。
- Host smoke 证据必须同时记录配置、调用输入、Result Envelope 摘要、Host 展示行为和已脱敏的审计记录。

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
- success structuredContent:
- content text summary:
- failed/isError:
- confirmation_required:
- outputSchema display:
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
- T226：Host result compatibility records。
