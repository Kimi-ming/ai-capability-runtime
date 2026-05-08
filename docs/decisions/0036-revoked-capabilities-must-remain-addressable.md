# ADR 0036：Revoked Capability 必须保留可寻址记录

日期：2026-05-08

状态：已接受

## 背景

发现恶意或危险 Capability 后，直接从 Registry 删除会让用户无法知道自己安装过什么、受影响版本是什么、应该如何处理。

## 决策

Revoked Capability 不从历史中消失。Registry 必须保留 revocation/advisory metadata，使 Runtime、用户和维护者能识别受影响能力。

## 影响

- registry search 默认隐藏 revoked，但记录仍可查询。
- `opencap list` 未来应提示本地已安装 revoked capability。
- 高风险 revoked capability 默认不应静默执行。
