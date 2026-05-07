# ADR 0031：请求发出后的超时是未知结果

日期：2026-05-07

状态：已接受

## 背景

当 HTTP 请求已经发出，但 Runtime 在 timeout 前没有收到最终响应时，外部服务可能已经执行了操作。把这种情况简单标为 failed 会误导用户再次执行。

## 决策

OpenCap 把请求发出后的 timeout 或连接断开记录为 `unknown_after_timeout`。该 outcome 表示外部状态未知，需要 reconcile 或人工确认。

## 影响

- Audit log 需要记录 request_started。
- 用户提示不能说“未执行”。
- 写操作 unknown outcome 不自动 retry。
- failure recovery runbook 必须优先建议 reconcile。
