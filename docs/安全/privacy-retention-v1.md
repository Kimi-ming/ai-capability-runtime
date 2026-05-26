# 隐私与数据保留 V1

本文定义 OpenCap V1 对本地数据、审计日志、输入输出和密钥的隐私处理规则。

## 数据分类

| 数据 | 示例 | V1 处理 |
| --- | --- | --- |
| Secret | `GITHUB_TOKEN` | 只从 env 读取，不写日志 |
| Sensitive input | token/password 字段 | 脱敏后写日志 |
| Normal input | issue title/body | 可脱敏记录，保留 hash |
| Output | issue url/number | 脱敏后记录 |
| Audit metadata | time/status/decision | 记录 |
| Policy | rules/default | 本地明文配置 |

## 默认保留策略

V1 不自动删除日志。原因：

- 简化实现。
- 本地优先，用户掌控 state dir。
- 早期调试需要保留调用轨迹。

但文档必须明确：

```text
删除 opencap.local/logs.sqlite 即可清除本地审计日志。
删除 opencap.local/ 可重置全部本地状态。
```

未来可加入：

```yaml
logs:
  retention_days: 30
```

## 最小化原则

- 不记录 secret 原文。
- 不记录完整 Authorization header。
- 不记录完整 cookie。
- URL query 默认脱敏敏感 key。
- 对输入保存 `input_hash`，避免只靠原文追踪。

## 用户可见性

`opencap logs` 默认只显示摘要。详细输出也必须是 redacted。

## 遥测边界

V1 不默认上传遥测，不把 audit log 自动同步到远程服务，也不实现远程审计保留策略。未来如果支持导出或远程保留，必须由用户显式启用，并继续遵守脱敏、最小化和本地 policy。

## MCP 和 Host

OpenCap 不控制 Host 自己的日志。文档应提醒用户：Host 可能记录 tool call arguments。OpenCap 只能保证自己的 Runtime 日志脱敏。

## 删除和恢复

V1 支持手动删除：

```bash
rm -rf opencap.local
```

不提供自动备份或恢复。

## 非目标

V1 不实现：

- 日志加密。
- 远程审计保留策略。
- 企业数据保留策略。
- DSAR 自动化。
- 多用户隔离。
