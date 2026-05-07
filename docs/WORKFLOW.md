# WORKFLOW：开发工作流

本文定义 OpenCap 的日常开发方式。目标是让每次开发都能被文档驱动、被测试验证、被交接恢复。

## 标准开发循环

```text
1. 读取 docs/HANDOFF.md
2. 读取 docs/TASKS.md 中的下一项 ready task
3. 读取相关 SPEC/ARCHITECTURE/DECISIONS/TESTING
4. 将任务标记为 [~]
5. 实现最小可验证改动
6. 运行任务验证和基础验证
7. 更新 TASKS/TESTING/HANDOFF/必要文档
8. 提交并推送 GitHub
```

## Definition of Ready

一个任务可以开始，必须满足：

- 有清楚目标
- 有验收标准
- 有验证方式
- 没有阻塞依赖
- 相关架构或决策已明确
- 不需要新的产品方向判断

不满足时，先拆任务或补文档，不直接写代码。

## Definition of Done

一个任务完成，必须满足：

- 代码或文档改动已完成
- 验收标准逐项满足
- 运行了对应验证
- 失败或跳过的验证已记录原因
- `docs/TASKS.md` 状态已更新
- `docs/HANDOFF.md` 已更新
- 相关 SPEC/ARCHITECTURE/TESTING/DECISIONS 已同步
- 已提交并推送到 GitHub

## 任务状态流转

```text
[ ] 未开始
  -> [~] 进行中
  -> [x] 已完成且已验证
  -> [!] 阻塞
  -> [?] 需要确认
```

规则：

- `[x]` 只能用于已验证任务。
- `[!]` 必须写明阻塞原因和解除条件。
- `[?]` 必须写明需要谁确认什么问题。
- 大任务如果超过一个可验证提交，应拆成更小任务。

## 提交规则

提交信息使用动词开头，描述本次真实变化：

```text
Implement manifest validation
Add local install workflow
Document audit log schema
```

每次任务结束后必须 push。

## 分支策略

当前阶段可以直接在 `main` 上推进，因为项目尚处早期且单人快速迭代。

进入多人协作后改为：

```text
main
  <- feature/<task-id>-short-name
  <- docs/<topic>
```

## 验证层级

### L0：文档和格式

- `git diff --check`
- JSON 解析
- YAML 解析
- `check_docs.py`

### L1：包级测试

- `pnpm --filter @opencap/spec test`
- `pnpm --filter @opencap/runtime test`
- `pnpm --filter @opencap/cli test`

### L2：工作区测试

- `pnpm validate`
- `pnpm test`
- `pnpm build`

### L3：端到端 smoke

- validate
- install
- list
- invoke dry-run
- logs
- serve --mcp

## 什么时候写 ADR

以下情况必须写 `docs/decisions/NNNN-title.md`：

- 改变 V1 范围
- 引入新依赖或协议
- 改变 manifest schema
- 改变权限语义
- 改变审计日志结构
- 改变本地状态格式
- 安全边界发生变化

## 什么时候更新风险登记

以下情况必须更新 `docs/RISKS.md`：

- 发现新的安全风险
- 发现实现复杂度可能超过预期
- 外部协议或依赖不确定
- 当前方案有明显替代方案但未决策
- 某风险已经被实现或决策缓解
