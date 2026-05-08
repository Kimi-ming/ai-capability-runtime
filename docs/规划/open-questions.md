# 开放问题

本文记录尚未进入 ADR 的开放问题。开放问题不等于阻塞；只有影响当前实现的才需要先决策。

## 当前不阻塞 T001 的问题

| ID | 问题 | 影响阶段 | 处理方式 |
| --- | --- | --- | --- |
| Q001 | npm package 名称是否使用 `opencap` 或 scoped packages | release | T123 |
| Q002 | OpenAPI adapter 是否生成一组 Capability 还是单个 package | v0.3 | RFC |
| Q003 | MCP elicitation 哪些 Host 可用 | MCP bridge | T070/T073 spike |
| Q004 | Trust level 升级是否需要维护者验证流程 | registry | T129 |
| Q005 | Remote Runtime OAuth 边界 | post-V1 | ADR 0018 |
| Q006 | 是否需要 signed registry entries | post-alpha | ADR/RFC |
| Q007 | Console UI 是否进入 v0.4 | post-MVP | roadmap review |

## 当前已收敛的问题

| 问题 | 决策 |
| --- | --- |
| V1 是否支持 mcp/local Capability | ADR 0005：不支持，HTTP-only |
| Audit log 用 SQLite 还是 JSONL | ADR 0006：SQLite |
| HTTP body 怎么声明 | ADR 0008：`execution.body.fields` |
| Policy DSL 顶层格式 | ADR 0009：`default/rules` |
| 审计失败时是否执行写操作 | ADR 0010：不执行 |
| state dir 默认位置 | ADR 0013：`<cwd>/opencap.local` |

## 处理规则

- 影响 P0 当前任务的问题必须转 ADR。
- 影响发布的问题必须进入 release checklist。
- 长期方向问题进入 RFC，不阻塞 V1。
