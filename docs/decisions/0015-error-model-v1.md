# ADR 0015：错误模型 V1

日期：2026-05-07

状态：已接受

## 背景

CLI、Runtime 和 MCP 如果各自发明错误格式，会导致测试、文档和用户体验混乱。

## 决策

V1 使用统一错误分类，详见 `docs/design/error-model-v1.md`。

CLI exit code：

- 0：成功。
- 1：用户错误、策略阻断、执行失败、确认缺失。
- 2：内部错误。

MCP：业务失败优先返回 tool result，协议错误只用于协议层问题。

## 影响

- `@opencap/runtime` 应定义 OpenCapError 基类或等价结构。
- CLI 只格式化错误。
- Audit log 记录 error code 和 safe message。
