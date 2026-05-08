# 质量门禁

本文定义 OpenCap 各阶段的质量门禁。质量门禁把“能跑”升级为“可以被别人信任地使用”。

## Gate 0：文档闭环

必须通过：

- 核心文档存在。
- `check_docs.py` 通过。
- 下一任务明确。

## Gate 1：Schema 和 CLI

必须通过：

- manifest schema tests。
- CLI validate 成功/失败测试。
- 错误包含文件路径和字段路径。

## Gate 2：本地状态

必须通过：

- state dir precedence tests。
- install 原子写入。
- list 损坏条目不阻断全部输出。

## Gate 3：Policy/Audit

必须通过：

- allow/ask/deny 测试。
- decision trace 测试。
- policy validate 和 broad allow simulation 测试。
- override/breakglass 负向测试。
- redaction/hash 测试。
- audit failure preflight 测试。

## Gate 4：HTTP Executor

必须通过：

- URL/body 模板测试。
- auth placement 测试。
- outbound private network block。
- dry-run 不发请求。

## Gate 5：MCP Bridge

必须通过：

- tools/list。
- tools/call。
- tool name collision。
- confirmation_required。
- stdout 不污染协议。

## Gate 6：Registry

必须通过：

- registry schema validation。
- registry test format validation。
- capability review checklist。

## Gate 7：Release

必须通过：

- CI green。
- CHANGELOG。
- release checklist。
- High risks mitigated or accepted。
- README commands verified。

## 使用规则

每个 milestone 只能在对应 gate 通过后标记完成。
