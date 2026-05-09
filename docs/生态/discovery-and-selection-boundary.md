# 能力发现与选择边界

本文定义 OpenCap 的能力发现、安装、Host 暴露、模型选择和 Runtime 授权之间的边界。

## 核心原则

发现不是授权。选择不是执行。排名不是信任。

OpenCap 可以帮助用户和 Host 发现能力，但任何 Capability 被调用时，仍必须经过 Runtime 的 validation、policy、confirmation、quota、secret resolution、execution 和 audit。

## V1 流程

```text
Registry package
  -> review/lint/test
  -> user install
  -> local installed capability
  -> Runtime tool projection
  -> MCP tools/list
  -> Host/model selects tool
  -> Runtime tools/call
  -> validation/policy/confirmation/quota/audit
```

## 边界定义

| 阶段 | 允许做什么 | 不能做什么 |
| --- | --- | --- |
| Registry discovery | 展示能力、分类、Trust Card、quality score | 自动安装或自动授权 |
| Install | 用户明确选择能力 | 绕过 lifecycle/advisory warning |
| tools/list | 暴露已安装能力的安全投影 | 暴露未安装能力 |
| Model selection | Host/model 选择 tool name | 作为授权依据 |
| Runtime call | 重新校验输入并执行治理管线 | 信任模型选择理由 |

## Selection Evidence

未来 Host 或 Runtime 可以记录 selection evidence：

```yaml
selection:
  host: cursor
  profile: mcp-tools-v1
  available_tools_hash: sha256:...
  selected_tool_name: github_create_issue
  capability_id: github.create_issue
  tool_projection_hash: sha256:...
  selection_reason_source: host_optional
```

注意：selection evidence 只用于调试和审计，不用于 allow/deny。

## Discovery Profile V1

Discovery Profile V1 见 `rfcs/0004-discovery-profile-v1.md`。本文保留执行边界，RFC 定义未来 search/index/ranking 的 profile。

### Discovery Metadata

Registry 可以维护：

- capability id、name、description
- category、tags、provider
- resource/action
- risk levels、confirmation modes
- lifecycle status
- trust level
- quality score
- advisory status
- host compatibility evidence
- updated_at / source ref

这些 metadata 必须可追溯到 manifest、CI、review、compatibility evidence 或 advisory，不能凭商业排名覆盖安全信号。

### 默认过滤

默认 discovery 结果必须隐藏 `yanked` 和 `revoked` capability。

- `deprecated` 可以显示，但必须带迁移或弃用提示。
- `yanked` 只有用户显式包含隐藏结果时才显示。
- `revoked` 不得作为普通搜索或推荐结果出现，只能在安全、历史或审计视图中查看。
- unresolved critical advisory 默认隐藏或强 warning。

### 排序原则

V1 不实现搜索排名。未来若实现 discovery/ranking：

- ranking 不能修改 Runtime policy。
- ranking 不能把 `ask` 改成 `allow`。
- ranking 不能自动安装或自动授权。
- ranking 不能把未安装能力暴露到 MCP `tools/list`。
- 高风险能力不能通过排名包装成低风险。
- paid 或 sponsored 排名必须与 safety metadata 分离。
- 语义匹配结果必须显示风险和权限摘要。

## 非目标

- V1 不自动安装能力。
- V1 不做 Agent router。
- V1 不做模型级 tool choice 优化。
- V1 不根据用户 prompt 动态拉取 registry tool。

## 关联任务

- T214：discovery profile RFC，见 `rfcs/0004-discovery-profile-v1.md`。
- T215：selection evidence record。
- T218：Host tool metadata compatibility records。
