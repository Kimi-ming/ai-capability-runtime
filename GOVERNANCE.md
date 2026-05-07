# 治理说明

OpenCap 是面向 AI 原生能力层的开放标准和开源 Runtime。

## 项目角色

- 贡献者：提交代码、文档、Registry 条目和 RFC
- 维护者：评审变更并管理发布
- 安全评审者：评估安全敏感的 Runtime 和 Registry 变化
- 核心维护者：处理兼容性、治理和路线图决策

## 决策方式

常规变更采用 lazy consensus。涉及以下内容时，维护者可以要求 RFC：

- manifest 兼容性
- 权限语义
- Registry 信任等级
- Runtime 调用行为
- MCP 或 Host-facing 接口

## Registry 治理

Registry 是 Git-based 社区注册表。进入 Registry 表示条目通过了项目定义的检查，但不代表 OpenCap 对第三方服务或维护者做绝对背书。

以下情况可能导致条目被移除或降级：

- 权限声明误导用户
- 隐藏外部调用
- 校验失败
- 安全敏感但长期无人维护
- 违反项目行为准则

## 商业使用

开源项目名为 OpenCap。未来可以存在托管版或企业版，但核心标准、Runtime 和 Registry 治理应保持无需托管服务也能使用。
