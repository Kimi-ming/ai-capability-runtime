# 注册表测试格式 V1

本文定义 `registry/**/tests/*.yml` 的 V1 格式。目标是让 Registry 条目不仅能通过 schema，还能被 mock 验证。

## 文件位置

```text
registry/<category>/<capability_id>/tests/basic.yml
```

## 基本结构

```yaml
name: basic create issue dry-run
capability: github.create_issue
mode: dry_run
input:
  owner: opencap
  repo: opencap
  title: Test issue
  body: Created by OpenCap test.
expect:
  status: dry_run
  request:
    method: POST
    url: https://api.github.com/repos/opencap/opencap/issues
    body:
      title: Test issue
      body: Created by OpenCap test.
  permission:
    risk: write
    decision: ask
```

## 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | yes | 测试名称 |
| `capability` | yes | Capability id |
| `mode` | yes | `validate` / `dry_run` / future `mock_http` |
| `input` | no | invocation input |
| `env` | no | mock env，不放真实 secret |
| `expect` | yes | 期望结果，必须包含 `status`，并至少包含 `request`、`permission`、`output` 或 `error` 之一 |

## mode

### `validate`

只验证 manifest 和 input fixture。

### `dry_run`

运行 Runtime planning，不发送外部请求。

必须验证：

- `expect.status`
- `expect.request.method`
- `expect.request.url`
- 可选 rendered body
- policy risk/decision 或后续 output/error

### future `mock_http`

后续可加入 mock response：

```yaml
mock_response:
  status: 201
  body:
    html_url: https://github.com/opencap/opencap/issues/1
    number: 1
```

V1 可先不实现。

## 安全约束

- tests 中不得包含真实 token。
- env 只能包含假值。
- 如果 Capability 使用任意 URL，test 必须覆盖被 outbound policy 拒绝的场景。
- destructive/financial/code_execution 风险的 test 只能 dry-run 或 mock。

## 与任务对应

- T004：定义 registry test case schema。
- T080：Registry manifest CI 校验。
- T081：Capability Review Checklist。
- T129：Registry 供应链 review 工作流。


## V1 Schema

V1 schema 位于：

```text
packages/spec/schema/registry-test.schema.json
```

当前 `pnpm validate` 会同时校验：

- `registry/**/manifest.yml`
- `registry/**/tests/basic.yml`

测试文件的最小合法形态：

```yaml
name: validates a dry run
capability: github.search_repo
mode: dry_run
input:
  query: opencap runtime
expect:
  status: dry_run
  request:
    method: GET
    url: https://api.github.com/search/repositories?q=opencap runtime
```

`expect.output` 和 `expect.error` 已在 schema 中预留，用于后续 mock HTTP 和 Result Envelope 测试。
