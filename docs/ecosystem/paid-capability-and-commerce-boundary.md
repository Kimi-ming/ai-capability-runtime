# 付费能力与商业交易边界

本文定义 OpenCap OSS 与未来 paid capability、agentic commerce、结算和交易协议之间的边界。

## 核心原则

V1 不做付费能力和交易执行。OpenCap OSS 可以定义 usage evidence、risk、financial consent 和 future commerce profile，但不能把计费或交易混入本地 Runtime 主路径。

## 分层

```text
OpenCap OSS
  - manifest
  - policy
  - consent
  - audit
  - usage evidence
  - local quota/budget

Future Commerce Profile
  - price metadata
  - merchant identity
  - purchase authorization
  - settlement evidence
  - refund/dispute status

Future Cloud/Marketplace
  - billing account
  - tax/invoice
  - payout
  - fraud controls
  - commercial discovery
```

## Paid Capability 元数据草案

```yaml
commerce:
  mode: free | paid | external
  pricing:
    unit: invocation
    amount: 0.02
    currency: USD
  settlement:
    provider: stripe
  requires_commerce_profile: true
```

V1 schema 不实现该字段。它属于 future RFC。

## Financial Capability

即使不是 paid capability，只要会支付、扣费、下单、交易，都属于 `financial` risk。

规则：

- 必须 explicit human confirmation。
- 必须展示 amount、currency、merchant/provider、recipient。
- 必须有 spend budget gate。
- 必须写 audit 和 usage event。
- 不自动 retry。

## Agentic Commerce 协议边界

OpenAI Agentic Commerce Protocol、Google AP2 等方向说明，Agent 代表用户完成购买会需要用户授权、商家、支付网络和交易证据共同参与。OpenCap 未来可以做 commerce profile adapter，但 V1 不实现购买流程。

## OSS/Cloud 边界

必须留在 OSS：

- financial risk model。
- local spend budget policy。
- invocation/usage evidence。
- audit log。
- consent receipt。

可以属于 Future Cloud：

- merchant onboarding。
- payout/settlement。
- invoice/tax。
- fraud/risk scoring。
- paid marketplace ranking。

## 非目标

- V1 不处理信用卡、钱包或银行账户。
- V1 不代表用户付款。
- V1 不做 connected accounts。
- V1 不做 revenue share。
- V1 不把 usage event 当作 invoice line item。

## 关联任务

- T202：paid capability manifest RFC。
- T203：commerce profile RFC。
- T204：financial consent/spend cap tests。
