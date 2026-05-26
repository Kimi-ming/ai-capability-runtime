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

npm trusted publishing workflow 草案见 `docs/运营/npm-trusted-publishing-workflow.md`。草案要求 GitHub Actions OIDC、`npm-production` environment、无长期 npm token、发布前 tarball 内容审查和 release evidence。

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

参考：

- SLSA provenance specification: <https://slsa.dev/spec/v1.0/provenance>
- Sigstore keyless signing overview: <https://docs.sigstore.dev/cosign/signing/overview/>
- npm provenance statements: <https://docs.npmjs.com/generating-provenance-statements>
- npm trusted publishing: <https://docs.npmjs.com/trusted-publishers>

## Manifest Provenance 预留

Capability manifest 可以声明可选 `provenance` 对象，用来预留 package 和 release 级 metadata：

- `provenance.package` 记录 Git/local/future OCI/SLSA package source、path、commit、digest 和 build type。
- `provenance.release` 记录 manual/npm trusted publishing/future Sigstore/org signature publisher、provenance 类型、workflow ref、attestation digest 和 transparency log ref。
- `provenance.policyEffect` 必须固定为 `none`。

该字段只用于来源证明和审查 evidence，不改变 Registry trust level、本地 install policy、Runtime policy、confirmation、outbound policy 或 audit。

## Registry Signing

未来可设计：

```text
registry commit -> generated index -> signed index -> client verifies signature/digest
```

但本地 policy 仍然优先于签名。签名证明来源，不证明安全。

Registry index signing 草案见 `rfcs/0013-registry-index-signing-v1.md`。该 RFC 预留 signed index envelope、manifest digest、index digest、signature metadata 和 verification evidence，但不把 signed index 放入 V1 本地 install 主路径。

## 风险

- 签名被误解为安全认证。
- 维护者身份验证流程复杂。
- 公共 transparency log 可能包含身份信息。
- 自托管企业环境可能不能用 public Sigstore。

因此签名路线必须配合 Trust Card 和 review，不单独作为信任等级。

## Policy Bundle

Policy bundle 签名路线见 `rfcs/0009-policy-bundle-manifest-signing-v1.md`。该 RFC 明确：

- bundle digest、revision 和 activation record 是未来兼容点。
- optional signature 不能替代 validate、simulation/diff 或 broad allow safety checks。
- failed activation 不覆盖当前 active policy。
- Cloud/org bundle 不能成为 OSS Runtime 启动依赖。
