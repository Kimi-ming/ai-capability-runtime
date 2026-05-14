# RFC NNNN：标题

## 状态

草案

可选状态：

- 草案
- 评审中
- 已接受
- 已拒绝
- 已替代
- 已撤回

## 元数据

| 字段 | 内容 |
| --- | --- |
| 作者 |  |
| 创建日期 | YYYY-MM-DD |
| 目标阶段 | v0.x / v1.0 / V1 后续 |
| 相关任务 | Txxx |
| 相关 ADR | docs/决策/NNNN-title.md |
| 相关文档 | docs/... |
| 替代或废弃 | 无 |

## 摘要

用 2-4 句话说明提案要改变什么、为什么现在需要，以及它不应该被误解成什么。

## 背景

说明当前行为、问题来源、已有约束和相关决策。若提案涉及外部协议或标准，列出规范版本和引用链接。

## 目标

- 

## 非目标

- 

## 术语

| 术语 | 定义 |
| --- | --- |
|  |  |

## 设计

描述提案的核心设计。必要时拆成子章节，例如：

- public contract / schema
- Runtime pipeline 变化
- CLI / MCP / Host 行为
- Registry / trust / lifecycle 影响
- audit / evidence 字段
- storage / migration

## 示例

给出最小、可审查的示例。不要包含真实 token、私有 URL、用户数据、生产日志或 provider raw response。

```yaml
# example
```

## 安全和隐私

必须说明：

- 是否改变 policy、confirmation、audit、secret resolver、outbound policy 或 data egress 边界。
- 是否新增模型可见文本、Host 暴露面、远程网络、OAuth/token、credential 或敏感数据流。
- 被拒绝、阻塞、未确认和失败路径如何记录 evidence。
- 不保存哪些 raw input/output、secret、token、provider response 或私有日志。

## 兼容性和迁移

说明：

- 是否改变 manifest schema、public package exports、CLI output、MCP tool/result shape、Registry layout 或 audit schema。
- 旧版本如何读取或忽略新字段。
- 是否需要 migration、feature flag、profile id 或版本门禁。
- 是否影响 `0.x` breaking-change 口径或 v1.0 兼容承诺。

## 验证计划

列出合并前必须运行的验证。至少包含文档闭环检查；涉及代码时列出对应 package tests。

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
pnpm validate
```

## 发布和运维

说明 rollout、release gate、文档入口、runbook、compatibility evidence、monitoring 或 rollback 要求。

## 替代方案

| 方案 | 为什么没有选择 |
| --- | --- |
|  |  |

## 开放问题

- 

## 决策结果

评审结束后填写：

- 结论：
- 接受/拒绝日期：
- 后续 ADR：
- 后续任务：
