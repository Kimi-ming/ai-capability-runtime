# 领域模型

本文定义 OpenCap V1 的核心对象、关系和不变量。实现时应优先让类型、数据库字段和 CLI 输出向这些对象靠拢。

## 核心对象图

```text
RegistryEntry
  contains CapabilityPackage
    contains CapabilityManifest

InstalledCapability
  references CapabilityManifest
  has InstallMetadata
  has TrustMetadata

InvocationRequest
  targets InstalledCapability
  produces InvocationPlan
  evaluated by PolicyEngine -> PolicyDecision
  may require ConfirmationRequest -> ConfirmationResult
  executed by HttpExecutor -> ExecutionResult
  recorded as InvocationLog
```

## 对象定义

### CapabilityManifest

来源：`manifest.yml`。

职责：描述一个 AI 可调用能力的静态契约。

关键字段：

- `id`
- `name`
- `description`
- `version`
- `type`
- `input`
- `output`
- `auth`
- `permissions`
- `execution`
- `metadata`

不变量：manifest 必须先通过 schema 校验，Runtime 才能加载。

### CapabilityPackage

来源：registry 或 examples 中的目录。

包含：

- `manifest.yml`
- `README.md`
- `tests/`
- 可选示例 input/output

不变量：安装时复制整个 package，而不是只复制 manifest。

### RegistryEntry

来源：`registry/<category>/<id>/`。

职责：作为 Git-based Registry 的最小条目。

不变量：同一个 registry 中 id 必须唯一。

### InstalledCapability

来源：`opencap.local/installed/<id>/`。

职责：Runtime 可调用能力的本地副本。

字段：

- manifest
- install path
- installed_at
- source path 或 source registry
- trust metadata
- load status

不变量：Runtime 只执行 InstalledCapability，不直接执行 registry entry。

### PolicyRule

来源：`opencap.local/policies.yml`。

职责：描述某类调用的决策规则。

字段：

- match：risk、capability_id、action、resource、host、channel 等。
- decision：`allow` / `ask` / `deny`。
- reason：可选。

不变量：没有匹配规则时使用 default decision；没有 policy 文件时 default 是 `ask`。

### InvocationRequest

来源：CLI 或 MCP Bridge。

字段：

- capability_id
- input
- channel：`cli` / `mcp` / future `http`
- host
- dry_run
- request_id

不变量：所有 invocation 都走同一个 Runtime invoke pipeline。

### InvocationPlan

Runtime 在执行前生成的计划。

字段：

- validated input
- resolved URL preview
- method
- permission summary
- risk summary
- redaction plan
- dry_run flag

用途：支持 dry-run、确认展示和审计日志。

### PolicyDecision

Policy Engine 输出。

字段：

- decision
- matched_rule
- reason
- requires_confirmation

不变量：Policy Engine 不执行外部调用，也不做用户交互。

### ConfirmationRequest

当 decision 是 `ask` 时生成。

字段：

- capability id/name
- risk
- action/resource
- input summary
- resolved URL preview
- allowed choices

不变量：MCP STDIO 模式不得使用终端 prompt。

### ExecutionResult

Executor 输出。

字段：

- status
- http status
- duration_ms
- output
- normalized output
- error

不变量：Executor 不得接收未通过 policy/confirmation 的请求。

### InvocationLog

来源：Audit Logger。

字段见 `docs/SPEC.md` 的 F7。

不变量：拒绝、阻塞、失败和成功都必须记录。

## ID 和命名规则

Capability id 使用点号命名：

```text
github.create_issue
vercel.get_deployments
http.request_demo
```

MCP tool name 由 id 稳定映射，V1 建议：

```text
github.create_issue -> github_create_issue
```

如果映射后冲突，`opencap serve --mcp` 必须 fail fast。

## 本地状态对象

```text
opencap.local/
  installed/
  policies.yml
  logs.sqlite
```

未来可增加：

```text
  index.json
  trust-cache.json
  confirmations.jsonl
```

V1 不要求这些未来文件，但实现不要把状态路径写死到模块内部。

## 领域不变量总表

- Manifest schema 校验是所有操作的入口。
- Registry source 和 installed copy 分离。
- Runtime 是 Policy Enforcement Point。
- Policy 决策和 Confirmation 交互分离。
- Secret Resolver 不把密钥传给 Audit Logger 原文。
- HTTP Executor 不负责权限判断。
- MCP Bridge 不直接执行能力。
- Audit Logger 位于核心路径，而不是可选插件。
