# 编写一个 Capability

本文是一条从空目录开始的教程。完成后，你会得到一个可以通过 `opencap validate <path>` 和 `pnpm validate` 校验的 HTTP Capability。推荐先用 `opencap init` 生成初始文件，再按 authoring loop 检查和调整。

这个教程只覆盖 V1 支持的 `type: http`。它不覆盖 OAuth 登录、真实 API 调用、安装到本地 Runtime 或 MCP Host 调试。

## 1. 生成初始目录

在仓库根目录下生成一个临时 Capability package：

```bash
pnpm --filter @opencap/cli dev -- init demo.get_status \
  --category developer-tools \
  --output registry/developer-tools/demo.get_status \
  --title "Demo Get Status" \
  --description "Fetch a public demo endpoint with a name parameter." \
  --url "https://httpbin.org/anything?name={{name}}"
```

命令会创建目标目录并写入：

```text
registry/developer-tools/demo.get_status/
  manifest.yml
  README.md
  tests/
    basic.yml
```

成功后，CLI 会提示下一步运行：

```bash
opencap validate registry/developer-tools/demo.get_status
pnpm validate
```

`opencap init` 只生成本地文件，不安装 Capability、不读取 secret、不写 `opencap.local/`，也不触网。它会拒绝覆盖已有 `manifest.yml`、`README.md` 或 `tests/basic.yml`，并拒绝 `.env`、token/secret/password、`opencap.local/`、SQLite/DB/log 和目录穿越路径。相对 `--output` 基于 `INIT_CWD` 或当前工作目录解析；未传 `--output` 时默认写入 `registry/<category>/<capability-id>`。

如果要生成需要 bearer API key 的初稿，可以显式声明凭据 descriptor；不要填写真实 token：

```bash
pnpm --filter @opencap/cli dev -- init github.create_issue \
  --category developer-tools \
  --output registry/developer-tools/github.create_issue \
  --title "GitHub Create Issue" \
  --description "Create an issue in a GitHub repository." \
  --method POST \
  --url "https://api.github.com/repos/{{owner}}/{{repo}}/issues" \
  --auth api-key-bearer \
  --provider github \
  --env GITHUB_TOKEN \
  --scope issues:write
```

如果不使用 `opencap init`，也可以手动创建同样的目录结构：

```bash
mkdir -p registry/developer-tools/demo.get_status/tests
```

## 2. 检查或编写 manifest

如果使用 `opencap init`，先打开 `registry/developer-tools/demo.get_status/manifest.yml`，确认 id、描述、权限、URL template、auth 和 metadata 都符合真实 API 行为。下面是一个等价的最小 manifest 示例：

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
- `metadata.category` 必须和 Registry 目录第一层分类一致，例如 `registry/developer-tools/demo.get_status/` 对应 `developer-tools`。
- `metadata.trust_level` 新条目通常从 `experimental` 开始。

分类应来自 [能力分类体系](../生态/capability-taxonomy.md)。分类只帮助 Registry 展示、review 和未来 Host 分组；它不参与授权，也不能降低 permissions、risk、confirmation 或 outbound policy 要求。

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

其中 `pnpm validate` 会执行 manifest schema、model-visible metadata lint、least-privilege auth lint 和 registry tests 的机器校验。least-privilege/risk 仍需要作者和 reviewer 核对 provider 官方权限文档；secret hygiene 和 dry-run 也需要明确检查。

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
