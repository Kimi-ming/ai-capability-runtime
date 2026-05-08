# 签名和来源证明路线图

本文定义 OpenCap 发布和 Registry 供应链的签名路线。

## 背景

OpenCap 的 Registry 和 npm packages 都会成为 AI 能力供应链的一部分。长期需要签名、provenance 和可验证发布。

## V1 前

先做：

- GitHub PR review。
- CI validation。
- CHANGELOG。
- Git tags。
- npm trusted publishing 预案。

## Alpha/Beta

建议：

- npm provenance。
- GitHub release notes。
- OpenSSF Scorecard baseline。
- branch protection。

## V1 后

考虑：

- Sigstore/cosign keyless signing。
- signed release artifacts。
- SBOM。
- registry index signing。
- capability package digest pinning。

## Sigstore 方向

Sigstore/cosign 支持 keyless signing，使用 OIDC identity、短期证书和 transparency log。它适合未来签名 release artifact、registry index 或 OCI artifact。

OpenCap V1 不直接实现 cosign，但发布文档应避免与该方向冲突。

## Registry Signing

未来可设计：

```text
registry commit -> generated index -> signed index -> client verifies signature/digest
```

但本地 policy 仍然优先于签名。签名证明来源，不证明安全。

## 风险

- 签名被误解为安全认证。
- 维护者身份验证流程复杂。
- 公共 transparency log 可能包含身份信息。
- 自托管企业环境可能不能用 public Sigstore。

因此签名路线必须配合 Trust Card 和 review，不单独作为信任等级。
