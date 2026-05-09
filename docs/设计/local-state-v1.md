# 本地状态 V1

本文定义 OpenCap V1 本地状态目录的解析、文件结构、写入规则和并发约束。

## State Dir 解析顺序

V1 使用以下优先级：

```text
1. CLI flag: --state-dir <path>
2. Environment: OPENCAP_STATE_DIR
3. Default: <current working directory>/opencap.local
```

路径解析规则：

- 相对路径基于当前工作目录解析。
- Runtime 内部统一转换为绝对路径。
- 不自动写入用户 home，避免 V1 行为隐藏。

## Registry Root 解析顺序

```text
1. CLI flag: --registry <path>
2. Environment: OPENCAP_REGISTRY_DIR
3. Default: <current working directory>/registry
```

## 目录结构

```text
opencap.local/
  installed/
    github.create_issue/
      manifest.yml
      README.md
      tests/
        basic.yml
  policies.yml
  logs.sqlite
  tmp/
  cache/
```

V1 初始化必须创建：

- `installed/`
- `tmp/`
- `policies.yml` 默认模板

默认 `policies.yml` 等同于 `default: ask` 和空 `rules`。如果用户已经创建或编辑过 `policies.yml`，初始化不得覆盖。`logs.sqlite` 由 Audit Logger 首次写入时创建。

## 写入规则

### install

安装过程：

```text
copy registry entry -> tmp/install-<id>-<nonce>
validate copied manifest
rename tmp dir -> installed/<id>
```

已有目录：

- 默认拒绝。
- `--force` 才允许替换。
- 替换应使用临时目录，避免半写入状态。

### logs

SQLite 由 Audit Logger 管理。调用日志写入应尽量短事务。

### policies

V1 不提供写 policy 的命令，用户可手动编辑 `policies.yml`。Parser 必须给出清晰错误。

## 文件权限

V1 最低要求：

- 创建目录使用系统默认权限。
- 不主动放宽权限。
- 文档提示用户 state dir 可能包含敏感审计信息。

未来可增强：

- 检测 group/world readable 并 warning。
- OS keychain。
- 加密日志。

## 并发模型

V1 先假设单用户、本地单进程为主。

最低保护：

- install 使用原子 rename。
- SQLite 处理日志并发。
- MCP server 启动时读取 installed snapshot。

V1 不实现跨进程锁；如检测到明显冲突，返回用户错误。

## 清理

用户可以删除整个 `opencap.local/` 来重置状态。

V1 不提供 uninstall 命令，后续可加入：

```bash
opencap uninstall github.create_issue
```
