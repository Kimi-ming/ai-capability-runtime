# 凭据生命周期手册

本文面向 OpenCap 用户、维护者和后续 Console 实现，定义 V1 凭据从创建、配置、使用、轮换到撤销的操作流程。

## V1 凭据模型

V1 不存储 secret。用户在本地环境中提供凭据，manifest 只声明 env var 名称。

```text
External service token
  -> user stores in shell/secret manager outside OpenCap
  -> environment variable exposes token to Runtime process
  -> Secret Resolver reads it after policy/consent
  -> Executor uses it for one invocation
  -> Audit records reference, not value
```

## 创建凭据

用户应优先创建最小权限、可撤销、可轮换的 token。

示例：`github.create_issue` 应使用只允许目标 repository 写 issues 的 GitHub fine-grained token，而不是 classic token 或全仓库管理权限 token。

记录要求：

- provider
- env var name
- intended capability ids
- permissions/scopes
- created date
- rotation owner
- expiry date if available

V1 不要求 OpenCap 保存这些记录，但 Console/Cloud 未来可以展示。

## 配置凭据

推荐：

```bash
export GITHUB_TOKEN=...
opencap invoke github.create_issue --input examples/github-issue-capability/input.json
```

不推荐：

```yaml
# manifest.yml 中写真实 token
secret: ghp_xxx
```

禁止：

- 把 token 写进 manifest。
- 把 token 写进 registry tests。
- 把 token 写进 README 示例。
- 把 token 放进 URL query。
- 让 MCP Host 通过 tool input 传 token。

## 使用凭据

每次真实调用前必须满足：

- manifest 合法。
- input 合法。
- policy 允许，或 ask 已确认。
- outbound policy 允许目标域名。
- Secret Resolver 能找到声明 env var。
- audit logger 对写操作可用。

## 轮换凭据

建议触发条件：

- token 到期。
- capability 权限变化。
- 用户或机器更换。
- audit log 出现异常调用。
- secret 可能进入日志、截图、issue、聊天记录。

轮换流程：

1. 在外部服务创建新 token。
2. 用相同 env var 更新本地环境或 secret manager。
3. 运行 dry-run 确认 auth 配置仍然匹配。
4. 运行最小真实调用或 provider API 自测。
5. 撤销旧 token。
6. 检查 audit log 中没有旧 token 原文。

## 撤销凭据

撤销后应验证：

- `opencap invoke` 返回认证失败或 secret missing。
- audit log 记录失败类别，不记录 token。
- capability list 不显示凭据值。

## 泄露响应

如果怀疑 secret 泄露：

1. 立即在外部 provider 撤销 token。
2. 搜索本地日志、shell history、README、tests、issues 和 PR。
3. 删除或替换泄露内容。
4. 创建新 token，缩小权限范围。
5. 在 `docs/RISKS.md` 或安全 issue 中记录根因和缓解。

## 未来 Console 支持

Console 可以展示：

- capability 需要哪些 env var。
- env var 是否存在。
- 最近一次使用时间。
- 缺失、过期或权限不足的错误摘要。

Console 不能展示：

- secret 原文。
- Authorization header。
- OAuth refresh token。

## 验收测试

- 缺少 env var 时错误清楚且不泄露值。
- 轮换 token 不需要改 manifest。
- audit log 能区分 secret missing 和 external 401。
- README 和 tests 不包含真实 secret。
