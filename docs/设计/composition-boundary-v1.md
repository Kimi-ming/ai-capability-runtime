# 组合边界 V1

本文定义 OpenCap 如何看待多个 Capability 的组合。核心原则：OpenCap V1 不做 Agent，不做 workflow builder，也不自动规划多步任务；但 OpenCap 必须为未来组合提供安全边界和证据模型。

## 为什么需要组合边界

AI 原生能力生态最终一定会出现多步调用：

```text
创建 GitHub Issue
  -> 写入 Notion Roadmap
  -> 触发 Vercel Preview
  -> 发送 Slack 更新
```

如果 OpenCap 没有组合边界，系统会快速滑向通用自动化平台或 Agent Builder。这样会稀释 OpenCap 的核心价值：能力标准、权限、运行时治理和审计。

## V1 立场

V1 只保证单次 Capability invocation 的安全闭环。

V1 不做：

- 自动任务规划。
- 多步 workflow DSL。
- 条件分支和循环。
- 跨 Capability 的事务。
- 自动补偿或 rollback。
- 多 Agent 编排。

V1 可以做：

- 为每次 invocation 生成稳定 audit evidence。
- 记录 composition group id 草案字段。
- 定义未来组合必须遵守的不变量。
- 让外部 Agent/Host 自己决定下一步，但每一步仍走 Runtime pipeline。

## 组合不变量

- 每一步都是独立 invocation。
- 每一步都必须经过 validation、policy、consent、secret、execution、audit。
- 上一步成功不代表下一步自动授权。
- workflow-level consent 不能替代 step-level consent，除非未来 RFC 明确 scope 和 expiry。
- Compensation 也是 Capability invocation，不是隐式 rollback。
- OpenCap 不为外部 Agent 的整体计划正确性背书。

## Composition Context 草案

未来 Runtime 可以接受可选上下文：

```ts
type CompositionContext = {
  compositionId: string;
  parentInvocationId?: string;
  stepIndex?: number;
  stepName?: string;
  initiatedBy: 'host' | 'user' | 'runtime' | 'external_agent';
  planHash?: string;
};
```

V1 可以先不实现，但 audit log 设计应避免以后无法扩展。

## 组合层和 Runtime 层分工

| 层 | 负责 | 不负责 |
| --- | --- | --- |
| Agent/Host | 选择下一步、维护计划、解释目标 | 绕过 policy/audit |
| OpenCap Runtime | 单步安全执行、证据、拒绝/确认 | 规划目标 |
| Registry | 能力声明、review、测试 | 证明组合一定正确 |
| Future Composition Profile | 组合元数据、证据串联 | 自动信任所有步骤 |

## Workflow Builder 边界

OpenCap 可以未来提供 composition profile，但不应变成低代码 workflow builder。

可以进入 OpenCap 的内容：

- composition evidence schema。
- per-step policy summary。
- plan hash。
- cross-step audit correlation。
- composition conformance tests。

不应进入 OpenCap OSS 核心 V1：

- 拖拽式工作流编辑器。
- 业务流程状态机运行时。
- 任意循环/条件/定时器。
- 通用任务规划算法。

## 关联任务

- T175：composition context audit fields。
- T176：composition profile RFC。
- T177：step-level consent tests。
- T178：plan hash and evidence chain 草案。
