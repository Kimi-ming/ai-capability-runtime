# 能力生命周期

本文定义 Capability 从作者编写到运行、审计、下线的完整状态机。OpenCap 的治理核心不是“目录里有多少工具”，而是每个能力能否沿着这条链路被验证和追踪。

## 生命周期总览

```text
Draft
  -> Validated
  -> Listed
  -> Reviewed
  -> Installed
  -> Enabled
  -> Invoked
  -> Audited
  -> Deprecated / Removed
```

## 状态定义

| 状态 | 含义 | 进入条件 | 产物 |
| --- | --- | --- | --- |
| Draft | 作者本地草稿 | 有 `manifest.yml` | Capability 目录 |
| Validated | manifest 合法 | schema 校验通过 | validation report |
| Listed | 进入 registry | 目录结构、README、测试样例齐全 | registry entry |
| Reviewed | 通过人工或社区评审 | 权限、风险、README、测试被检查 | review notes / trust level |
| Installed | 被复制到本地状态 | `opencap install` 成功 | `opencap.local/installed/<id>` |
| Enabled | 可被 Runtime 暴露 | manifest 可加载，策略不全局 deny | installed capability index |
| Invoked | 收到调用请求 | 输入校验通过或失败均记录 | invocation request/result |
| Audited | 调用被写入日志 | Audit Logger 成功写入 | audit log row |
| Deprecated | 不推荐新增安装 | registry 标记弃用 | deprecation notice |
| Removed | 从 registry 或本地删除 | 有迁移或风险说明 | removal record |

## 关键门禁

### Draft -> Validated

必须通过：

- manifest schema。
- V1 类型限制：`type: http`。
- 必填字段：id、name、description、version、input、output、auth、permissions、execution、metadata。

### Validated -> Listed

必须具备：

- `README.md`。
- 至少一个 `tests/*.yml`。
- 权限和风险声明。
- metadata 中的 maintainer、license、trust level。

### Listed -> Reviewed

评审重点：

- 权限是否最小化。
- 是否存在隐藏外部调用。
- 是否有任意 URL、SSRF、敏感数据外发风险。
- README 是否清楚说明用途、输入、输出、风险和凭据要求。

### Installed -> Enabled

Runtime 启动时必须检查：

- installed manifest 仍可解析。
- id 与路径一致。
- MCP tool name 不冲突。
- 策略文件可解析。

### Invoked -> Audited

无论调用结果如何都必须写日志：

- allow 后成功。
- allow 后执行失败。
- ask 后用户拒绝。
- ask 但 Host 不支持确认。
- deny 被阻止。
- 输入校验失败。

## Trust Card

每个 Capability 应该能生成一张 Trust Card：

```text
Capability: github.create_issue
Version: 0.1.0
Type: http
Trust: community-listed
Risk: write
Auth: api_key via GITHUB_TOKEN
Tests: basic.yml passing
Last reviewed: unknown in V1
Maintainer: opencap
Audit required: yes
```

当前 `opencap list` 已在 JSON 和人类表格中暴露基础字段：lifecycle、trust level、maintainer、license 和 status。后续再做完整 Trust Card 命令。

## 生命周期和命令映射

| 命令 | 影响状态 |
| --- | --- |
| `opencap validate` | Draft -> Validated |
| `opencap install` | Listed/Reviewed -> Installed |
| `opencap list` | Installed/Enabled 可见化 |
| `opencap invoke --dry-run` | Invoked/Audited，不执行外部动作 |
| `opencap invoke` | Invoked/Audited，可能执行外部动作 |
| `opencap serve --mcp` | Enabled -> Host-visible tool |
| `opencap logs` | Audited 可见化 |

## 不变量

- Capability 被调用前必须处于 Installed 状态。
- Runtime 不直接调用 registry 源目录，必须通过 installed copy。
- 每次调用必须形成审计记录。
- 权限声明不是信任证明，只是策略评估输入。
- Trust level 不能替代本地 policy。
