# 策略临时覆盖与紧急通道 V1

本文定义 OpenCap 如何处理临时策略放行和紧急场景，避免 override 变成绕过安全边界的后门。

## 核心原则

Override 只能影响普通 risk policy 的最终决策，不能绕过：

- schema validation。
- data egress deny。
- outbound private network block。
- secret resolver ordering。
- audit logging。
- revoked/malicious capability block。
- financial explicit confirmation。

## Override 类型

| 类型 | 用途 | 默认期限 |
| --- | --- | --- |
| `allow_once` | 当前 invocation 放行一次 | 当前 invocation |
| `allow_until` | 临时放行某能力/目标 | 有过期时间 |
| `deny_override` | 临时收紧策略 | 有过期时间 |
| `breakglass` | 事故处理临时通道 | 最短期限 + 强制审计 |

## Override Record

```ts
type PolicyOverrideRecordV1 = {
  overrideId: string;
  type: "allow_once" | "allow_until" | "deny_override" | "breakglass";
  capabilityId?: string;
  targetOrigin?: string;
  risk?: string;
  dataClasses?: string[];
  reason: string;
  expiresAt: string;
  createdBy: "local_user" | "future_org_admin";
  createdAt: string;
};
```

## Breakglass 约束

- 必须有 reason。
- 必须有短过期时间。
- 必须写 audit。
- 必须进入 policy decision trace。
- 不允许用于 revoked/malicious capability。
- 不允许绕过 egress deny 的 secret_like/internal_url。
- financial 仍需要 explicit confirmation。

## 非目标

- V1 不实现远程审批流。
- V1 不实现多管理员投票。
- V1 不允许环境变量偷偷启用全局 allow。

## 测试要求

- allow_once 只对当前 invocation 生效。
- expired override 不生效。
- breakglass 不能覆盖 data egress deny。
- override trace 写入 audit。
- revoked capability 不能被 breakglass 放行。

## 关联任务

- T255：policy override/breakglass controls。
- T258：policy incident runbook。
- T260：policy conformance tests。
