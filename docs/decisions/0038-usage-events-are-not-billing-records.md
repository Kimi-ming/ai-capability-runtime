# ADR 0038：Usage Event 不是账单记录

日期：2026-05-08

状态：已接受

## 背景

OpenCap 未来可能支持 paid capability 或 Cloud usage，但 V1 是本地 Runtime。把本地 usage event 直接当作账单记录会引入商业、税务、争议和结算责任。

## 决策

V1 usage event 只用于本地可观测、限额、预算和未来导出。它不是 invoice line item，也不代表应收款。

## 影响

- Usage evidence 可以进入 OSS core。
- Billing/settlement 必须走 future commerce profile。
- usage export 需要明确 non-billing 语义。
