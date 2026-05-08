# 架构决策 0010：审计不可用时的执行策略

日期：2026-05-07

状态：已接受

## 背景

OpenCap 的核心承诺是每次调用可审计。如果 audit log 写入失败但 Runtime 继续执行写操作，就会产生不可追踪的真实世界行动。

## 决策

V1 安全默认：

- `read_only` 调用在 policy 明确 allow 时，可带 warning 继续。
- 非 `read_only` 调用在审计不可用时不得执行。
- dry-run 审计失败时返回错误，不伪装成功。

## 影响

- Audit Logger 不是附属插件，而是 Runtime 核心路径。
- HTTP executor 不能在 audit preflight 失败后执行写操作。
- 测试必须覆盖审计失败不执行。
