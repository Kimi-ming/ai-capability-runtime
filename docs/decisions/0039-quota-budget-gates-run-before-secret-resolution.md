# ADR 0039：Quota/Budget Gate 必须在 Secret Resolution 前运行

日期：2026-05-08

状态：已接受

## 背景

如果超出额度或预算后才解析 secret，Runtime 会在本不应执行的调用中接触凭据。AI Host 循环调用也可能快速消耗 API 配额或费用。

## 决策

Quota/Budget Gate 必须在 Secret Resolver 和 Executor 之前运行。被 quota/budget 阻断的调用不得解析 secret，不得发出 HTTP 请求。

## 影响

- quota/budget decision 写入 audit 和 usage event。
- trust level 和 quality score 不能绕过 budget deny。
- financial capability 必须走 explicit consent 和 spend budget。
