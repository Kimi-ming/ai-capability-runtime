# RFC 0001：能力清单 V1

## 状态

草案

## 摘要

定义 OpenCap Capability Manifest 的第一个稳定形态。

## 动机

AI Host 需要一种可预测方式理解工具能做什么、需要什么输入、返回什么输出、需要哪些权限，以及如何执行。

如果没有 manifest 标准，每个 Agent 或 Host 都必须逐个集成工具。

## 提案

OpenCap Capability Manifest 必须包含：

- 身份
- 描述
- 版本
- 类型
- 输入 schema
- 输出 schema
- 认证声明
- 权限声明
- 执行声明
- 元数据

V1 只支持 HTTP execution。

## 兼容性

Manifest 应能映射到 MCP tool metadata，同时保留 OpenCap 的权限和审计语义。

## 待解决问题

- manifest id 是否需要全局命名空间？
- output schema 是否必须对所有 Capability 强制？
- Registry trust metadata 应放在 manifest 内还是旁边？
