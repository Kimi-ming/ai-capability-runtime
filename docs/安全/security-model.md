# 安全模型

OpenCap 提供权限边界、审计日志和验证元数据。它不保证每个第三方 Capability 都绝对安全。

## 威胁

OpenCap 应重点防御：

- 权限过宽
- 隐藏外部调用
- 未评审的破坏性操作
- 模型被 prompt 诱导后误用写工具
- 密钥泄露
- 无法追踪的 AI 行动
- Capability 描述误导用户

## V1 控制措施

- manifest 校验
- 显式权限声明
- 基于风险的策略决策
- 高风险操作的人类确认机制
- 环境变量凭据
- 调用日志
- Registry 评审清单

## 详细边界文档

- `docs/安全/identity-and-auth-model.md`：身份、授权链和 token passthrough 边界。
- `docs/设计/secret-resolver-v1.md`：Secret Resolver 输入、输出、调用顺序和 dry-run 行为。
- `docs/运营/credential-lifecycle.md`：凭据创建、轮换、撤销和泄露响应。
- `docs/安全/least-privilege-review.md`：Capability auth scopes 最小权限评审。

## 密钥处理

V1 可以支持环境变量凭据：

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
```

Runtime 日志绝不能写入原始密钥。

## 日志脱敏

默认应脱敏或哈希敏感输入。字段名包含以下内容时应默认脱敏：

- `token`
- `secret`
- `password`
- `api_key`
- `authorization`

即使调用被拒绝，也必须记录策略决策。

## V1 不解决的问题

- 任意代码执行 sandbox
- 托管多租户隔离
- 形式化验证
- 支付执行
- 远程 Secret Vault
- 企业 SSO 和 RBAC

这些是未来问题，不是 V1 阻塞项。
