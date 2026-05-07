# ADR 0007：以 Capability 生命周期作为治理主线

日期：2026-05-07

状态：已接受

## 背景

OpenCap 如果只维护 registry 目录，会很容易变成薄工具列表。真正的价值在于 Capability 从定义、校验、评审、安装、启用、调用到审计的完整治理链路。

## 决策

OpenCap 文档、任务、CLI 和未来 UI 都以 Capability 生命周期作为主线：

```text
Draft -> Validated -> Listed -> Reviewed -> Installed -> Enabled -> Invoked -> Audited -> Deprecated / Removed
```

V1 不一定实现所有状态的命令，但必须在文档、任务和数据模型中保持这条生命周期。

## 影响

- `opencap validate` 对应 Draft -> Validated。
- `opencap install/list` 对应 Listed/Reviewed -> Installed/Enabled。
- `opencap invoke/serve --mcp/logs` 对应 Invoked -> Audited。
- Registry review 和 Trust Card 必须围绕生命周期状态表达。
- 未来 Console 不应只是工具列表，而应展示 lifecycle、policy、risk 和 audit。

## 取舍

这个设计会让 V1 文档比普通 CLI 项目更重，但能避免生态型项目早期只剩目录和 demo。接受这个复杂度。
