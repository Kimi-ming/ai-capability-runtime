# 调研：信任、安全公告与撤销 2026-05-08

本文记录本轮信任模型、安全公告和能力撤销体系参考的外部来源。

## 参考来源

- GitHub private vulnerability reporting: https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability
- GitHub configuring private vulnerability reporting: https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository
- OpenSSF Scorecard: https://openssf.org/projects/scorecard/
- OSV schema: https://ossf.github.io/osv-schema/
- OpenVEX: https://openssf.org/projects/openvex/
- SLSA v1.0 levels: https://slsa.dev/spec/v1.0/levels

## 对 OpenCap 的影响

### 安全报告需要私密通道

GitHub 支持 public repo 的 private vulnerability reporting。OpenCap 应在 `SECURITY.md` 和维护者手册中鼓励私密报告，不要求报告者公开漏洞细节。

### OSV 适合作为未来 advisory 交换格式

OSV schema 明确表达漏洞 ID、modified、affected packages、versions/ranges 等字段。OpenCap 可以先用轻量 YAML，再映射到 OSV。

### VEX 适合表达“是否受影响”

OpenVEX 用来表达漏洞对产品是否实际可利用。OpenCap 未来可以用 VEX 风格说明某 Capability 或 Runtime 是否受某 advisory 影响。

### Scorecard/SLSA 提供供应链信任语言

OpenSSF Scorecard 是自动化安全风险检查；SLSA 强调 provenance 和构建来源。OpenCap 的 Trust Card 应引用这些证据，但不能把它们误称为绝对安全认证。

## 新增文档

- `docs/ecosystem/trust-model-v1.md`
- `docs/security/capability-advisory-process.md`
- `docs/ecosystem/capability-deprecation-and-revocation.md`
- `docs/quality/capability-quality-score.md`

## 后续问题

- Advisory YAML 是否映射 OSV 1.x。
- Revoked capability 本地执行是否默认硬阻断。
- Trust level 是否需要维护者身份验证流程。
- Quality Score 是否进入 `opencap list`。
