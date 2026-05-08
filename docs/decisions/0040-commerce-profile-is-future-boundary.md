# ADR 0040：Commerce Profile 是未来边界，不进入 V1 主路径

日期：2026-05-08

状态：已接受

## 背景

Agentic commerce 涉及用户授权、商家、支付网络、交易证据、退款争议和合规。它不是普通 Capability 调用的一个字段能解决的问题。

## 决策

OpenCap V1 不实现 paid capability、购买、支付或结算。未来 commerce 必须通过独立 profile/RFC 进入，并保持 OSS 本地 policy/audit/consent 能独立运行。

## 影响

- `financial` risk 可以在 V1 表达，但不执行支付流程。
- paid capability manifest 字段属于 future RFC。
- Cloud/marketplace 不能成为 OSS Runtime 主路径依赖。
