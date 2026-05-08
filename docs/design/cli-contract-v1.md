# 命令行契约 V1

本文定义 `opencap` CLI 在 V1 的命令、输入、输出、exit code 和错误边界。实现时 CLI 只做用户交互和格式化，不承载核心业务逻辑。

## 全局原则

- stdout 用于机器或用户需要的正常结果。
- stderr 用于错误、warning、debug 和进度信息。
- MCP STDIO server 模式不得向 stdout 写任何非 MCP 协议内容。
- 所有命令支持 `--state-dir`，即使部分命令暂时不需要。
- 所有用户错误 exit `1`，内部错误 exit `2`。

## 全局参数

| 参数 | 含义 | V1 行为 |
| --- | --- | --- |
| `--state-dir <path>` | 指定本地状态目录 | 覆盖 `OPENCAP_STATE_DIR` 和默认值 |
| `--registry <path>` | 指定 registry 根目录 | 默认 `./registry` |
| `--json` | 输出 JSON | V1 可先只在 list/logs/invoke 支持 |
| `--quiet` | 减少非必要输出 | 不影响错误输出 |

## `opencap validate [path]`

目标：校验一个 Capability 目录或一个 registry 目录。

输入：

```bash
opencap validate registry/developer-tools/github.create_issue
opencap validate registry
```

行为：

- 如果 path 是 Capability 目录，读取其中 `manifest.yml`。
- 如果 path 是 registry 目录，递归查找 `manifest.yml`。
- 使用 `@opencap/spec` validator。
- 输出每个 manifest 的结果。

成功 stdout：

```text
Valid manifest: registry/developer-tools/github.create_issue/manifest.yml
```

失败 stderr：

```text
Invalid manifest: registry/.../manifest.yml
  /execution/body/type must be equal to one of the allowed values
```

Exit code：

- 0：全部合法。
- 1：manifest 非法或没有找到 manifest。
- 2：文件系统或内部错误。

## `opencap install <id>`

目标：从 registry 安装 Capability 到本地状态目录。

```bash
opencap install github.create_issue
opencap install github.create_issue --force
```

行为：

- 在 registry 中查找唯一 `id`。
- 安装前校验 manifest。
- 复制完整目录到 `opencap.local/installed/<id>/`。
- 默认不覆盖已有安装。
- `--force` 使用临时目录和原子替换。

Exit code：

- 0：安装成功。
- 1：找不到、多个匹配、已存在未加 `--force`、manifest 非法。
- 2：复制失败或内部错误。

## `opencap list`

目标：展示已安装 Capability。

默认表格字段：

```text
id version type risk trust status
```

`--json` 输出数组：

```json
[
  {
    "id": "github.create_issue",
    "version": "0.1.0",
    "type": "http",
    "risk": "write",
    "trust_level": "experimental",
    "status": "enabled"
  }
]
```

损坏条目：显示 `status: invalid`，但不阻断其他条目。

## `opencap invoke <id>`

目标：通过 Runtime 调用已安装 Capability。

```bash
opencap invoke github.create_issue --dry-run --input input.json
opencap invoke github.create_issue --input input.json
```

参数：

| 参数 | 含义 |
| --- | --- |
| `--input <file>` | JSON 输入文件 |
| `--dry-run` | 生成调用计划，不发外部请求 |
| `--yes` | 非交互允许 ask，仅限 CLI，V1 可暂缓 |

行为：

- 加载 installed capability。
- 校验输入。
- 生成 invocation plan。
- 评估 policy。
- 必要时确认。
- dry-run 不解析 secret、不发请求。
- 写 audit log。

## `opencap logs`

目标：查看本地审计日志。

```bash
opencap logs
opencap logs --limit 50
opencap logs --json
```

默认字段：

```text
time status decision capability risk duration host
```

约束：输出永远使用脱敏数据。

## `opencap serve --mcp`

目标：启动 MCP STDIO server。

行为：

- stdout 只写 MCP JSON-RPC 消息。
- stderr 可写启动 warning 和错误。
- 加载 installed capabilities。
- tools/list 暴露 tool。
- tools/call 路由到 Runtime。
- ask 且无法确认时返回 `confirmation_required`，不执行。

## 命令到模块映射

| CLI 命令 | 调用模块 |
| --- | --- |
| validate | `@opencap/spec` |
| install/list | `@opencap/runtime` local state + loader |
| invoke | `@opencap/runtime` invoke pipeline |
| logs | `@opencap/runtime` audit reader |
| serve --mcp | `@opencap/mcp` + runtime |
