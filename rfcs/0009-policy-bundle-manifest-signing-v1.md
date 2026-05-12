# RFC 0009：Policy Bundle Manifest 与签名 V1

状态：草案
日期：2026-05-12

## 摘要

本文为未来本地 policy bundle、组织 policy bundle 和可选签名留下兼容路径。V1 不要求实现远程 policy server，也不让 Cloud/org bundle 成为 OSS Runtime 启动依赖。

## 背景

OpenCap 当前以本地 `policies.yml` 和 `FilePolicyLedger` 作为策略治理对象。后续如果支持组织策略或可分发策略包，需要在不破坏 local-first 的前提下表达：

- bundle digest。
- bundle revision。
- optional signature。
- activation record。
- failed activation 不覆盖当前 active policy。

## Bundle Manifest 草案

```yaml
schema: opencap.policy_bundle.v1
bundle_id: local.default
revision: 2026-05-12T00-00-00Z
digest: sha256:...
created_at: 2026-05-12T00:00:00Z
source:
  type: local_file # local_file | local_bundle | future_org_bundle
  path: ./policies.yml
policies:
  - path: policies.yml
    digest: sha256:...
signature:
  type: none # none | future_sigstore | future_org_signature
  identity: null
compatibility:
  opencap_runtime: ">=0.1.0 <0.2.0"
```

## Activation Record

Policy bundle activation 必须追加记录，不得覆盖历史：

```ts
type PolicyBundleActivationRecordV1 = {
  kind: "activation" | "rollback" | "failed_activation";
  bundleId: string;
  fromRevision?: string;
  toRevision: string;
  bundleDigest: string;
  policyDigest: string;
  signatureStatus: "none" | "verified" | "failed" | "unsupported";
  changedBy: "local_user" | "automation" | "future_org_admin";
  reason?: string;
  activatedAt: string;
};
```

## 失败语义

- bundle parse 失败：记录 `failed_activation`，不修改 active policy。
- digest mismatch：记录 `failed_activation`，不修改 active policy。
- signature failed：记录 `failed_activation`，不修改 active policy。
- simulation 发现 high-risk broad allow：记录 failed 或 rejected，不修改 active policy。
- rollback：重新激活旧 revision，并追加新的 rollback record，不删除失败记录。

## 签名边界

签名证明来源和完整性，不证明策略安全。即使签名通过，仍必须经过：

- policy validate。
- policy simulation/diff。
- broad allow safety checks。
- local user 或 future org activation policy。

## Local-first 约束

- OSS Runtime 启动不得依赖 Cloud/org bundle。
- 没有网络时仍可使用本地 active policy。
- future org bundle 只能收紧或提供默认策略，不得绕过本地 hard safety floor。
- 本地用户必须能查看 active revision、digest 和 activation record。

## 非目标

- V1 不实现 Sigstore/cosign 调用。
- V1 不实现远程组织策略下发。
- V1 不实现多管理员审批。
- V1 不把签名作为 trust level 的替代。

## 后续任务

- 定义 policy bundle JSON/YAML schema。
- 在 `FilePolicyLedger` 中加入 bundle id/signature status 字段。
- 在 policy activation 前强制运行 simulation/diff。
- 设计 future org bundle 与 local override 的优先级。
