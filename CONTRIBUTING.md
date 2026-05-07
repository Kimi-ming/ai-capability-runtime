# 贡献指南

OpenCap 欢迎标准、Runtime、Registry、文档和工具链方面的贡献。项目还在早期，清晰的设计反馈和代码同样重要。

## 可以贡献什么

- Capability Manifest schema
- 权限模型和策略行为
- Runtime 与 MCP 接口
- CLI 命令
- Registry 条目
- OpenAPI、HTTP、MCP、CLI adapters
- 文档、示例和测试

## Registry 条目要求

每个 Capability 条目必须包含：

- `manifest.yml`
- `README.md`
- `tests/` 下至少一个测试样例
- 明确声明权限和风险等级
- 维护者信息和许可证
- 不隐藏 manifest 未声明的外部调用
- 默认不执行破坏性操作

## Capability 信任等级

- `experimental`：实验性条目，只做基础结构检查
- `listed`：通过 schema 校验并进入 registry
- `tested`：有测试并通过验证
- `verified`：维护者身份或服务所有权已验证
- `official`：由 OpenCap 核心团队维护

## RFC 流程

以下变化需要 RFC：

- manifest 兼容性变化
- 权限语义变化
- Runtime API 变化
- MCP 暴露方式变化
- Registry 治理规则变化
- 信任元数据变化

新增 RFC 时，在 `rfcs/` 下使用下一个编号。

## 本地开发

```bash
pnpm install
pnpm build
pnpm test
```

项目坚持小而清晰的 TypeScript-first 结构，方便贡献者理解完整系统。
