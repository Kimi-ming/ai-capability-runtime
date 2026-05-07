# ADR 0029：远程 Runtime OAuth 必须走新 Profile

日期：2026-05-07

状态：已接受

## 背景

本地 STDIO Runtime 和远程 Runtime 的身份授权模型完全不同。远程 Runtime 需要处理用户身份、Host token、provider token、refresh、撤销、租户隔离和审计主体。

## 决策

任何 remote runtime、Cloud runtime 或 HTTP transport authorization 都必须先定义 interoperability/auth profile，并经过 RFC。不得把 V1 env credential 模型外推为远程授权方案。

## 影响

- V1 文档中保留 future boundary，但不实现 remote OAuth。
- Apps SDK、A2A、HTTP MCP 进入 OpenCap 时必须说明 auth profile。
- 管理面身份和执行身份必须分离。
