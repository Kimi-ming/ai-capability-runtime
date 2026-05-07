# ADR 0020：包发布和 Provenance 策略

日期：2026-05-07

状态：已接受

## 背景

OpenCap 未来会发布 npm packages。长期 npm token 会增加供应链风险。

## 决策

OpenCap 优先使用 npm trusted publishing 和 provenance。V1 前保持 packages private，alpha 时优先发布 `@opencap/spec` 和 `@opencap/cli`。

## 影响

- 发布 workflow 应使用 OIDC trusted publishing。
- 不优先使用长期 npm token。
- T123 需要按此策略制定发布预案。

