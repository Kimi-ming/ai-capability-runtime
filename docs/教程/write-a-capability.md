# 编写一个 Capability

本文是一条从空目录开始的教程。完成后，你会得到一个可以通过 `opencap validate <path>` 和 `pnpm validate` 校验的 HTTP Capability。

这个教程只覆盖 V1 支持的 `type: http`。它不覆盖 OAuth 登录、真实 API 调用、安装到本地 Runtime 或 MCP Host 调试。

## 1. 创建目录

在仓库根目录下创建一个临时能力目录：

```bash
mkdir -p registry/developer-tools/demo.get_status/tests
```

V1 Registry 条目至少包含：

```text
registry/developer-tools/demo.get_status/
  manifest.yml
  README.md
  tests/
    basic.yml
```

## 2. 编写 manifest

创建 `registry/developer-tools/demo.get_status/manifest.yml`：

```yaml
id: demo.get_status
name: Demo Get Status
description: Fetch a public demo endpoint with a name parameter.
version: 0.1.0
type: http

input:
  type: object
  required:
    - name
  properties:
    name:
      type: string
      description: Name to include in the demo request.

output:
  type: object
  properties:
    url:
      type: string
    args:
      type: object

auth:
  type: none

permissions:
  - resource: demo.status
    action: read
    risk: read_only
    confirmation: allow

execution:
  method: GET
  url: https://httpbin.org/anything?name={{name}}
  timeout_ms: 10000

metadata:
  category: developer-tools
  maintainer: your-name
  license: MIT
  trust_level: experimental
```

### 字段检查

- `id` 必须是稳定标识，推荐 `provider.action_name`。
- `type` 在 V1 只能是 `http`。
- `input` 和 `output` 使用 JSON Schema。
- `auth.type: none` 表示不需要凭据。
- `permissions` 必须说明资源、动作、风险和确认策略。
- `execution` 必须说明 HTTP 方法、URL 和 timeout。
- `metadata.trust_level` 新条目通常从 `experimental` 开始。

## 3. 按作者门禁顺序自查

Capability 从草稿到可评审必须按同一条 authoring loop 推进：

```text
manifest schema
  -> package shape
  -> model-visible metadata lint
  -> least-privilege/risk review
  -> secret hygiene
  -> registry tests
  -> dry-run
  -> review-ready
```

其中 `pnpm validate` 会执行 manifest schema、model-visible metadata lint 和 registry tests 的机器校验。least-privilege/risk、secret hygiene 和 dry-run 仍需要作者和 reviewer 明确检查。

## 4. 编写 README

创建 `registry/developer-tools/demo.get_status/README.md`：

```md
# demo.get_status

Fetch a public demo endpoint with a name parameter.

## Inputs

- `name`: name to include in the demo request.

## Permissions

- `demo.status:read`
- risk: `read_only`
- confirmation: `allow`

## Auth

No credential is required.
```

README 的目标是让评审者和用户快速知道这个能力会做什么、需要什么权限、是否需要凭据。

## 5. 编写测试样例

创建 `registry/developer-tools/demo.get_status/tests/basic.yml`：

```yaml
name: fetches a demo status
capability: demo.get_status
mode: dry_run
input:
  name: opencap
expect:
  status: dry_run
  request:
    method: GET
    url: https://httpbin.org/anything?name=opencap
  permission:
    risk: read_only
    decision: allow
```

测试样例用于 Registry 校验和后续 mock/dry-run 测试。它不应该包含真实 token、个人数据或不可公开的 URL。

## 6. 校验单个 Capability

运行：

```bash
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/demo.get_status
```

成功时会看到类似输出：

```text
Valid manifest: /path/to/registry/developer-tools/demo.get_status/manifest.yml
```

如果 manifest 不合法，命令会返回非 0 exit code，并输出文件路径和字段路径，例如：

```text
Invalid manifest: /path/to/manifest.yml
  /permissions/0/risk must be equal to one of the allowed values
```

## 7. 校验整个 Registry

运行：

```bash
pnpm validate
```

该命令会同时校验：

- `registry/**/manifest.yml`
- manifest `name`、`description` 和 schema description 的 model-visible metadata lint
- `registry/**/tests/basic.yml`

如果你只是在本地练习，提交前可以删除 `registry/developer-tools/demo.get_status/`。如果你要贡献这个 Capability，请保留目录并按 Registry 指南提交 PR。

## 常见错误

### 忘记 `metadata.trust_level`

`metadata.trust_level` 是必填字段。新能力通常使用：

```yaml
trust_level: experimental
```

### 风险等级写错

`permissions[].risk` 只能使用 OpenCap 已定义的风险等级，例如：

```yaml
risk: read_only
```

不要写 `low`、`medium` 或 `high`。

### 测试里放真实 token

不要在 `tests/basic.yml`、README 或 manifest 中放真实 token。需要凭据的能力只能声明 env var 名称，例如：

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
```

测试里的 `env` 只能使用假值。

## 下一步

读完本教程后，继续看：

- [能力清单](../规范/capability-manifest.md)
- [Registry 指南](../社区/registry-guidelines.md)
- [能力评审清单](../社区/capability-review-checklist.md)
