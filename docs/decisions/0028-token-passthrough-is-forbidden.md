# ADR 0028：禁止 token passthrough

日期：2026-05-07

状态：已接受

## 背景

MCP Authorization 和 OAuth resource indicator 体系都强调 token audience。MCP server 不能把发给自己的 token 转发给下游服务，否则会造成 confused deputy 和跨资源 token 滥用。

## 决策

OpenCap 禁止把 Host、MCP client、OpenCap management API 或任意 tool input 中的 token 作为下游 provider token 使用。下游 API 凭据必须来自 manifest 声明的 credential source，V1 为 env var。

## 影响

- Runtime 必须拒绝 input token 替代 auth。
- Remote Runtime 必须单独设计 OAuth boundary。
- Security tests 必须覆盖 token passthrough negative case。
