# 架构决策 0053：紧急通道 不得绕过 审计 或 外发拒绝

日期：2026-05-08

状态：已接受

## 背景

紧急 override 有必要，但如果 breakglass 可以绕过 audit、data egress deny、revocation 或 secret ordering，它会成为最高风险后门。

## 决策

Breakglass 只能作为受限、短期、可审计的 override。它不得绕过 schema validation、data egress deny、outbound private network block、secret resolver ordering、audit logging、revoked/malicious capability block 或 financial explicit confirmation。

## 影响

- override 必须进入 decision trace。
- breakglass 必须有 reason 和 expiresAt。
- expired override 不生效。
