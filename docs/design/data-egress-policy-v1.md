# Data Egress Policy V1：数据外发策略

本文定义 OpenCap 如何在执行前判断 tool input 是否可以发送到目标 provider/origin。

## 核心原则

Outbound policy 管“请求去哪里”。Data egress policy 管“什么数据要发出去”。二者必须同时通过，才可以执行。

```text
validated input
  -> data classification
  -> body/url/header rendering preview
  -> egress target resolution
  -> data egress policy
  -> policy/confirmation
  -> secret resolution
```

## Gate 位置

Data Egress Gate 必须在 Secret Resolver 和 Executor 之前运行。原因：如果这次调用会被 egress policy deny，就不应该读取凭据，也不应该构造最终带凭据的请求。

## Policy DSL 草案

```yaml
data_egress:
  default: ask
  rules:
    - match:
        data_class: secret_like
      decision: deny

    - match:
        data_class: pii
        provider: github
      decision: ask

    - match:
        data_class: source_code
        risk: external_send
      decision: ask

    - match:
        data_class: internal_url
      decision: deny
```

## Egress Context

```ts
type DataEgressContextV1 = {
  capabilityId: string;
  provider: string;
  targetOrigin: string;
  resource: string;
  action: string;
  risk: string;
  inputHash: string;
  dataClasses: string[];
  redactedPreview: unknown;
  renderedFields: Array<{
    path: string;
    destination: "url" | "query" | "header" | "body";
    dataClasses: string[];
  }>;
};
```

## Decision

| Decision | 行为 |
| --- | --- |
| `allow` | 继续 policy/confirmation pipeline |
| `ask` | confirmation summary 必须展示 data classes 和 target |
| `deny` | 不解析 secret，不执行，不写 provider request |
| `redact` | 生成 redacted input 后重新校验 output/action 可行性 |

## 与 Policy Engine 的关系

Data egress policy 不取代 risk policy。推荐顺序：

1. input validation。
2. input classification。
3. data egress policy。
4. regular risk policy。
5. confirmation。
6. quota/budget。
7. secret resolution。
8. execution。

如果 egress decision 是 ask，regular policy 也可能 ask。Confirmation Handler 应合并为一个 Runtime-owned confirmation request。

## 测试要求

- secret_like input -> deny before secret resolution。
- pii to external_send -> ask。
- internal_url in body/query -> deny。
- egress deny 写 audit，但 requestStarted false。
- redacted preview 不含 secret 原文。

## 关联任务

- T236：data egress policy gate。
- T237：egress decision audit fields。
- T238：confirmation summary data classes。
