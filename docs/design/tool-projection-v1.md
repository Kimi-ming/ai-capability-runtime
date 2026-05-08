# 工具投影 V1：模型可见工具投影

本文定义 OpenCap Runtime 如何把 Capability Manifest 转成 MCP Host 和模型可见的 tool metadata。

## 背景

Capability manifest 是开发者提交的能力描述。MCP `tools/list` 暴露的 tool name、title、description、inputSchema、outputSchema 会进入 Host 和模型上下文，因此它不是普通展示文案，而是模型可见的执行提示面。

V1 不能把第三方 manifest description 原样拼接到 MCP tool description。Runtime 必须生成受控投影。

## 投影原则

- Runtime-owned：最终 MCP tool metadata 由 Runtime 生成。
- Deterministic：相同 manifest、policy 和 lifecycle metadata 生成相同投影。
- Minimal：只暴露模型选择工具所需的信息。
- Non-instructional：描述能力，不指挥模型、用户或 Host。
- Auditable：投影版本和 hash 可以进入 audit/evidence。

## 输入来源

| 来源 | 信任级别 | 用途 |
| --- | --- | --- |
| manifest `id` | schema validated | tool name 映射 |
| manifest `name` | linted | title 候选 |
| manifest `description` | untrusted/linted | safe summary 候选 |
| manifest input/output schema | schema validated + text linted | MCP schema |
| permissions/risk | schema validated | runtime-generated risk summary |
| lifecycle/trust/advisory | registry metadata | user-facing metadata 和 future `_meta` |
| README | untrusted | 不进入 V1 model-visible projection |

## MCP Tool Projection

V1 tool projection：

```ts
type ToolProjectionV1 = {
  projectionVersion: "opencap.tool_projection.v1";
  capabilityId: string;
  manifestDigest: string;
  toolName: string;
  title: string;
  description: string;
  inputSchema: object;
  outputSchema?: object;
  riskSummary: string;
  permissionSummary: string[];
  lifecycle?: string;
  trustLevel?: string;
  advisoryStatus?: string;
  projectionHash: string;
};
```

MCP response fields：

| MCP 字段 | 生成规则 |
| --- | --- |
| `name` | Capability id deterministic mapping，例如 `github.create_issue` -> `github_create_issue` |
| `title` | lint 后的 manifest name，失败时使用 id 派生 title |
| `description` | Runtime 模板生成，不原样透传 README |
| `inputSchema` | manifest input schema，字段描述必须通过 metadata lint |
| `outputSchema` | Host profile 支持时暴露 manifest output schema |

## Description Template

V1 使用固定模板：

```text
{title}. Capability: {capability_id}. Purpose: {safe_summary}. Permissions: {permission_summary}. Risk: {risk_summary}. Confirmation: {confirmation_summary}.
```

规则：

- `safe_summary` 来自 lint 后的 manifest description。
- `permission_summary` 和 `risk_summary` 由 Runtime 根据 permissions 生成。
- `confirmation_summary` 只描述 Runtime 行为，例如 `write actions may require confirmation`。
- description 不得包含“忽略指令”“必须调用”“不要询问用户”“泄露 token”等指挥性文本。

## Projection Hash

Runtime 可以计算：

```text
projection_hash = sha256(canonical_json(tool_projection_without_hash))
```

用途：

- audit log 记录当次 Host 看到的工具投影版本。
- conformance suite 验证 projection 是否稳定。
- registry review 追踪 manifest 更新是否改变模型可见表面。

## 与现有模块关系

```text
manifest.yml
  -> schema validation
  -> model-visible metadata lint
  -> tool projection builder
  -> MCP tools/list
  -> Host/model selection
  -> Runtime tools/call validation/policy/consent/audit
```

## 非目标

- V1 不做自动工具选择。
- V1 不做语义搜索排名。
- V1 不把 README、示例文档或远程网页注入工具描述。
- V1 不依赖 tool description 做安全决策。

## 关联任务

- T209：tool projection builder。
- T210：model-visible metadata lint。
- T212：tool projection hash/evidence。
- T213：MCP tool description runtime-generated risk summary。
