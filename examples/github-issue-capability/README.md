# GitHub Issue 能力示例

该示例对应 Registry 条目：

```text
registry/developer-tools/github.create_issue/
```

它是 V1 的关键 proof-of-work，因为它覆盖：

- auth
- write permission
- human confirmation
- external API execution
- invocation logging

预期命令流程：

```bash
opencap install github.create_issue
opencap invoke github.create_issue --dry-run --input examples/github-issue-capability/input.json
```

如果要真实调用 GitHub API，需要先配置 `GITHUB_TOKEN`，并根据本地 policy 完成确认：

```bash
GITHUB_TOKEN=... opencap invoke github.create_issue --input examples/github-issue-capability/input.json --yes --json
```
