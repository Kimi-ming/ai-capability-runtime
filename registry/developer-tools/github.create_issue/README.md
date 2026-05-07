# github.create_issue

根据结构化输入创建 GitHub Issue。

## 风险

`write`

该 Capability 会在 GitHub 仓库中创建外部状态。OpenCap 默认策略应在执行前请求确认。

## 认证

设置：

```bash
GITHUB_TOKEN=...
```

Token 必须有权限在目标仓库创建 issue。

## 输入示例

```json
{
  "owner": "opencap",
  "repo": "opencap",
  "title": "Add runtime permission engine",
  "body": "Track the V1 policy engine implementation.",
  "labels": ["runtime", "v0.1"]
}
```
