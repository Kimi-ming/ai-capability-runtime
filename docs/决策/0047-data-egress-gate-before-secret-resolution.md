# 架构决策 0047：Data 外发 Gate 必须在 密钥解析 前运行

日期：2026-05-08

状态：已接受

## 背景

OpenCap 已经要求 policy、quota 和 budget gate 在 secret resolution 前运行。但 tool input 也可能包含敏感数据，且可能被发送到外部 provider。如果 egress policy 会拒绝这次调用，就不应该读取凭据或构造带凭据请求。

## 决策

Data Egress Gate 必须在 Secret Resolver 和 Executor 之前运行。Runtime 在 input validation 后执行 input classification、data minimization、egress target resolution 和 egress policy。

## 影响

- Runtime pipeline 增加 input classification 和 egress policy。
- egress deny 不读取 secret、不发请求。
- audit 记录 input provenance 和 egress decision。
