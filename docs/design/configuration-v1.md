# 配置模型 V1

本文定义 OpenCap V1 的配置来源和优先级。V1 避免引入全局账号或云配置，保持本地、透明、可删除。

## 配置来源优先级

```text
1. CLI flags
2. Environment variables
3. State dir files
4. Built-in defaults
```

## 环境变量

| 变量 | 含义 |
| --- | --- |
| `OPENCAP_STATE_DIR` | 本地状态目录 |
| `OPENCAP_REGISTRY_DIR` | Registry 根目录 |
| `OPENCAP_LOG_LEVEL` | `error` / `warn` / `info` / `debug` |
| Capability-specific env | 例如 `GITHUB_TOKEN` |

## State Dir 文件

### `policies.yml`

策略文件，格式见 `docs/design/policy-dsl-v1.md`。

### `logs.sqlite`

审计日志，不是用户手写配置。

### future `config.yml`

V1 不要求实现 `config.yml`。如果后续需要，建议只放非敏感配置：

```yaml
registry:
  path: ./registry
logs:
  retention_days: 30
```

## Secret 配置

V1 secret 只从环境变量读取：

```yaml
auth:
  type: api_key
  env: GITHUB_TOKEN
```

原因：

- 简单。
- 本地优先。
- 避免过早实现 Secret Vault。

约束：

- 不通过 manifest 保存 secret 原文。
- 不通过 policy 保存 secret 原文。
- 不通过 MCP elicitation 请求 secret。
- 不把 secret 写入 logs。

## 配置错误

配置错误属于用户错误，exit code `1`。

示例：

- state dir 不可写。
- policy YAML 非法。
- registry dir 不存在。
- required env token 缺失。

内部 bug 或无法分类错误 exit code `2`。
