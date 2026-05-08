# 架构决策 0027：V1 只实现环境变量下游凭据

日期：2026-05-07

状态：已接受

## 背景

OpenCap V1 需要调用外部 API，但项目仍处于本地优先和开源 Runtime 阶段。过早实现 OAuth token store、Keychain、Vault 或 Cloud credential 管理会放大范围和安全责任。

## 决策

V1 下游凭据只从 manifest 声明的环境变量读取。manifest、policy、registry tests、README 示例都不得包含真实 secret。

## 影响

- Secret Resolver V1 只需要 env provider。
- `auth.type: oauth2` 只允许声明保留，不进入 executor 主路径。
- 轮换凭据不需要修改 manifest。
- 后续 credential provider 必须通过 RFC/ADR 加入。
