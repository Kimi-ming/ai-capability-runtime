# 项目运行模型

本文定义 OpenCap 前期开发如何持续推进，避免文档、任务、风险和代码各走各的。

## 工作节奏

每次任务遵循：

```text
Read docs
  -> choose task
  -> check risks/ADRs
  -> implement or design
  -> verify
  -> update docs
  -> commit and push
```

## 文档优先级

当文档冲突时：

1. `docs/decisions/*.md` 的已接受 ADR。
2. `docs/SPEC.md` 的 V1 范围。
3. `docs/design/*.md` 的模块契约。
4. `docs/TASKS.md` 的执行任务。
5. `README.md` 的用户入口。

发现冲突时，不直接猜；应更新文档或新增 ADR。

## 角色分工

| 角色 | 关注点 | 主要文档 |
| --- | --- | --- |
| 产品架构 | 定位、用户、范围 | strategy/use-cases/SPEC |
| 协议架构 | MCP/A2A/OpenAPI 边界 | protocol-positioning/runtime-contracts |
| Runtime 工程 | pipeline、state、executor | domain-model/runtime-contracts/http-execution |
| 安全工程 | policy、secret、audit、SSRF | threat-model/outbound-policy/security/security-model |
| Policy 治理 | decision trace、policy lifecycle、simulation、override | policy-dsl/policy-decision-trace/policy-lifecycle |
| Registry 维护 | review、trust、tests | community/registry-guidelines/supply-chain-governance |
| 发布经理 | 版本、CI、release gates | release-readiness/ROADMAP/TASKS |

## 任务状态规则

- 没有验收标准的任务不能进入实现。
- 没有验证的任务不能标记 `[x]`。
- 发现 High 风险必须更新 `docs/RISKS.md`。
- 影响后续实现的设计必须写 ADR。
- 每轮结束必须提交并推送 GitHub。

## 风险处理 SLA

| 风险等级 | 处理要求 |
| --- | --- |
| High | 进入实现前必须有 ADR、任务或明确接受 |
| Medium | 进入相关 milestone 前必须有缓解计划 |
| Low | 可在任务或文档中跟踪 |

## 发布门禁

发布前必须通过：

- docs audit。
- docs loop check。
- `git diff --check`。
- JSON/YAML parse。
- workspace validate/test，若依赖已安装。
- High 风险复核。
- Policy broad allow 和 breakglass 复核。

## 开发阶段转换

当前是架构和需求明确阶段。进入实现阶段的信号：

- T001/T002/T010 可以开始连续实现。
- R002/R003/R014 这些 High 设计风险已被 ADR 收敛。
- README 不再承诺未实现命令为已可用。

## 当前下一步

下一步仍然是：

```text
T001 P0：让 opencap validate 调用真实 schema 校验
```

实现时需要优先参考：

- `docs/spec/capability-manifest.md`
- `docs/design/domain-model.md`
- `docs/design/runtime-contracts.md`
- `docs/design/http-execution-v1.md`
