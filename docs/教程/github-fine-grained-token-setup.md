# GitHub fine-grained token 设置指南

本文说明如何为 `github.create_issue` 创建最小权限的 GitHub fine-grained personal access token，并把 token 作为本地 `GITHUB_TOKEN` 提供给 OpenCap Runtime。

官方参考：

- [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Create an issue REST API](https://docs.github.com/en/rest/issues/issues)
- [Keeping your API credentials secure](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure)

## 适用范围

本指南只适用于本地 V1 Runtime 的 `github.create_issue` 示例能力。V1 不保存 secret，manifest 只声明：

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
  placement:
    type: bearer
  scopes:
    - issues:write
```

Token 原文只应存在于用户本地 shell、操作系统 secret manager 或等价的外部凭据管理工具中，不能写入 manifest、README、registry tests、issue、PR、聊天记录或 MCP Host 的 tool input。

## 创建 Token

1. 打开 GitHub Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens。
2. 选择 Generate new token，优先使用 fine-grained personal access token，而不是 classic token。
3. Token name 使用可追踪名称，例如 `opencap-github-create-issue-local`。
4. Expiration 选择尽量短的过期时间，并在本地记录轮换日期。
5. Resource owner 选择拥有目标仓库的用户或组织。
6. Repository access 选择 Only select repositories，并且只选择要创建 issue 的单个目标仓库。
7. Repository permissions 中只授予 Issues: write。`github.create_issue` 对应 GitHub `Create an issue` REST API；官方文档列出的 fine-grained token 权限要求是 Issues repository permissions 的 write 访问。
8. 不授予 Contents、Administration、Actions、Secrets、Variables、Packages 或全仓库 `repo` / `admin` 类权限。
9. 如果目标组织要求审批 fine-grained personal access token，GitHub 可能把 token 标记为 pending；等待 organization administrator 审批通过后再用于真实调用。

## 配置本地环境

在运行 OpenCap 的 shell 中设置：

```bash
export GITHUB_TOKEN=ghp_or_github_pat_redacted
```

然后先做 dry-run：

```bash
opencap invoke github.create_issue --dry-run --input examples/github-issue-capability/input.json
```

dry-run 不读取 token 原值，只检查 manifest、input、URL 渲染、policy 和 egress preview。确认后再执行真实调用，真实调用仍必须经过 policy/consent/outbound gate，并由 Secret Resolver 在 executor 内部把 token 放入 Authorization header。

## 轮换和撤销

轮换流程：

1. 在 GitHub 创建新的 fine-grained PAT，保持相同的目标仓库和 Issues: write 权限。
2. 用新值更新本地 `GITHUB_TOKEN`，不修改 manifest。
3. 运行 `opencap invoke github.create_issue --dry-run --input examples/github-issue-capability/input.json` 确认配置仍匹配。
4. 执行最小真实调用或 GitHub API 自测。
5. 在 GitHub 撤销旧 token。
6. 检查 OpenCap audit log 只包含 credential reference、env name 和 redacted digest，不包含 token 原文。

撤销后，如果继续执行真实调用，预期结果应是 provider 401/403 或本地 `SECRET_MISSING`。两类失败都必须写审计日志，但不得记录 token 原文。

## 禁止项

- 不使用 classic token，除非 GitHub 官方限制导致 fine-grained PAT 无法完成该场景，并且任务文档单独记录原因。
- 不使用 broad `repo`、`admin:org`、全仓库管理权限或组织级无关权限。
- 不把 token 放在 URL query、request body、manifest、registry tests、README 示例、MCP tool input 或模型可见文本中。
- 不把 `http.request_demo` 或其他示例能力视为默认可信能力。

## 故障排查

- `SECRET_MISSING`：当前 Runtime 进程没有读取到 `GITHUB_TOKEN`，重新 export 或检查启动环境。
- HTTP 401/403：token 存在但 GitHub 拒绝，检查 token 是否过期、被撤销、仍处于 pending、目标仓库是否正确、Issues: write 是否已授予。
- HTTP 410：目标仓库可能关闭了 Issues。
- 审计日志或命令输出中出现 token 原文：立即撤销 token，按 `docs/运营/credential-lifecycle.md` 的泄露响应流程处理。
