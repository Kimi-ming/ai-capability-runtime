# RFC 0002：权限模型

## 状态

草案

## 摘要

定义 OpenCap 如何声明、评估和审计 Capability 权限。

## 动机

AI 驱动的行动比普通 API 调用更需要权限模型。模型会动态选择行动，用户必须清楚这些行动能改变什么。

## 提案

每个 Capability 声明一个或多个权限：

```yaml
permissions:
  - resource: github.issue
    action: create
    risk: write
    confirmation: ask
```

Runtime 根据本地策略评估权限，并返回：

- `allow`
- `ask`
- `deny`

## 风险类型

V1 风险类型：

- `read_only`
- `write`
- `external_send`
- `destructive`
- `financial`
- `code_execution`
- `secret_access`

## 审计

每次调用都要记录策略决策和确认结果。

## 待解决问题

- 策略规则是否应匹配 Host identity？
- 策略规则是否应匹配输入值？
- 一次性确认应如何存储？
