# 发布和来源证明补充调研

日期：2026-05-07

## 参考来源

- Semantic Versioning 2.0.0：https://semver.org/
- npm Trusted Publishing：https://docs.npmjs.com/trusted-publishers
- npm provenance：https://docs.npmjs.com/generating-provenance-statements
- Sigstore overview：https://docs.sigstore.dev/
- Sigstore cosign signing overview：https://docs.sigstore.dev/cosign/signing/overview/

## 发现

SemVer 要求项目声明公共 API，并用 major/minor/patch 表达兼容性。OpenCap 的公共 API 不只是 TypeScript exports，还包括 manifest schema、CLI、Policy DSL、Audit log 和 MCP result shape。

npm trusted publishing 使用 CI/CD OIDC 生成短期凭据，可以减少长期 token 风险；在公开仓库和公开包等条件下可自动生成 provenance。

Sigstore/cosign 使用 keyless signing、短期证书和 transparency log，适合未来签名 release artifacts、registry indexes 或 OCI artifacts。

## 对 OpenCap 的影响

- 新增版本和兼容性策略。
- 新增 manifest 演进策略。
- 新增包发布策略。
- 新增签名和 provenance 路线图。
- 新增质量门禁和维护者手册。
