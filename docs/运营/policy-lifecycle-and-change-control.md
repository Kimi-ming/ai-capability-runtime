# 策略生命周期与变更控制

本文定义 OpenCap 如何把本地 policy 当作可审计、可版本化、可回滚的治理对象。

## 核心原则

Policy 文件不是普通配置。它决定 AI 能否调用真实世界能力，因此每次变更都应能回答：谁改了什么、为什么改、影响哪些能力、是否经过模拟、如何回滚。

## Policy Set

```ts
type PolicySetV1 = {
  policySetId: string;
  revision: string;
  source: "local_file" | "local_bundle" | "future_org_bundle";
  path?: string;
  createdAt: string;
  activatedAt?: string;
  digest: string;
  status: "draft" | "validated" | "active" | "superseded" | "rejected";
};
```

## 生命周期

```text
draft
  -> validate
  -> simulate
  -> activate
  -> supersede
  -> archive
```

失败状态：

- `invalid_syntax`
- `unsafe_broad_allow`
- `simulation_required`
- `activation_failed`

## 变更记录

```ts
type PolicyChangeRecordV1 = {
  changeId: string;
  policySetId: string;
  fromRevision?: string;
  toRevision: string;
  changedBy: "local_user" | "automation" | "future_org_admin";
  reason?: string;
  diffSummary: string[];
  simulationSummary?: string;
  activatedAt?: string;
};
```

## V1 本地行为

V1 可以从简单本地文件开始：

- 默认 policy 文件位于 state/config 路径。
- 每次激活 policy 时计算 digest。
- policy validate 生成 findings。
- policy change 记录写入本地 audit 或 policy ledger。
- rollback 只是重新激活旧 revision，不删除历史。

## Runtime 实现状态

截至 2026-05-12，`@opencap/runtime` 已新增 `FilePolicyLedger`：

- `activate()` 记录 activation，包含 policySetId、fromRevision、toRevision、digest、reason、diffSummary 和 activatedAt，并更新 active policy 指针。
- `rollback()` 作为一条新的 rollback activation 记录追加到 ledger，不删除历史。
- `recordFailedActivation()` 只追加 failed_activation 记录，不覆盖当前 active policy。
- ledger 记录只保存 digest、revision、reason 和 diff summary，不保存 policyContent、input 原文或 secret value；reason/diff summary 会做基础 secret redaction。


## Future Policy Bundle

未来可以引入 policy bundle，但必须保持 OSS local-first：

- bundle digest。
- optional signature。
- activation record。
- failed activation 不覆盖当前 active policy。
- remote/org bundle 不进入 V1 主路径。

## 非目标

- V1 不实现多租户组织策略。
- V1 不要求远程 policy server。
- V1 不允许 Cloud policy 成为本地 Runtime 启动依赖。

## 关联任务

- T251：policy change audit。
- T252：policy validate lint。
- T256：policy bundle manifest/signing RFC。
