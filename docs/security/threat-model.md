# 威胁模型：OpenCap V1

本文把 OpenCap V1 的主要资产、信任边界、攻击路径和控制措施系统化。它补充 `docs/security/security-model.md` 和 `docs/RISKS.md`。

## 保护资产

| 资产 | 为什么重要 |
| --- | --- |
| 用户密钥 | 泄露后可直接操作外部服务 |
| 用户授权意图 | AI 误操作或被诱导操作会造成真实后果 |
| Capability manifest | 决定 AI 能调用什么以及怎么调用 |
| Policy 文件 | 决定执行前允许、询问或拒绝 |
| Audit log | 事后追踪和合规依据 |
| Registry 内容 | 供应链入口，影响用户安装什么 |
| MCP STDIO 流 | 被污染会破坏 Host 协议交互 |

## 信任边界

```text
AI Host / Model
  | untrusted tool arguments
  v
OpenCap MCP Bridge
  | protocol-adapted invocation
  v
OpenCap Runtime Trust Boundary
  | validated input, policy, confirmation, secret resolution
  v
External API Boundary
```

Registry 也是独立边界：registry 中的 manifest 不能因为通过了 schema 就被视为安全。

## 攻击者模型

- 恶意 Capability 作者：提交看似正常但权限过宽或隐藏外发的 manifest。
- 被 prompt injection 影响的模型：诱导调用高风险工具或构造恶意参数。
- 恶意 Host/client：伪造调用上下文或反复触发工具。
- 本地同机攻击者：读取状态目录、日志或环境变量。
- 外部服务异常或被攻陷：返回恶意内容、错误结构或过大响应。

## 主要威胁和控制措施

| ID | 威胁 | V1 控制 | 后续增强 |
| --- | --- | --- | --- |
| T-01 | 权限过宽 | manifest 显式 permissions；review checklist | permission linter |
| T-02 | Prompt injection 诱导写操作 | policy 默认 ask；确认展示输入摘要 | prompt-injection aware risk scoring |
| T-03 | 密钥写入日志 | redaction；input hash；secret resolver 不返回原文 | OS keychain / vault |
| T-04 | Token passthrough | ADR 和 runtime 禁止 MCP token 下传 | remote auth test suite |
| T-05 | SSRF / 内网探测 | `http.request_demo` 高风险标记；outbound policy 任务 | allowlist / deny private IP |
| T-06 | MCP STDIO 污染 | ask 不用终端 prompt；返回 structured result | Host compatibility matrix |
| T-07 | Capability 供应链污染 | Git-based review；CI schema check | signing / provenance |
| T-08 | 审计缺失 | audit logger 核心路径 | append-only / export to OTel |
| T-09 | 输出注入 | output normalization；MCP result 标记 | content safety filters |
| T-10 | 破坏性操作误执行 | destructive 默认 deny | stronger confirmation policy |
| T-11 | 日志隐私过度收集 | 默认脱敏和哈希 | retention policy |
| T-12 | tool name 冲突 | MCP 启动 fail fast | namespace policy |
| T-13 | policy 变更静默放宽权限 | policy ledger、simulation/diff、broad allow findings | signed policy bundles |
| T-14 | override/breakglass 变成无审计后门 | override record、短过期时间、硬安全边界不可绕过 | multi-admin approval |

## Abuse Cases

### AC-001：模型被诱导创建错误 Issue

防护：`github.create_issue` 是 write 风险，默认 ask；确认文本展示 owner、repo、title、body 摘要。

### AC-002：恶意 Capability 把 token 放进 URL

防护：schema 不足以完全防止；review checklist 和 secret redaction 必须检查 URL 模板；执行时禁止把 secret 渲染进 query string，除非显式声明且高风险。

### AC-003：任意 URL demo 访问内网

防护：V1 标记为 unsafe/high risk；后续 outbound policy 阻止 private IP、localhost、link-local、metadata service。

### AC-004：MCP Host 不支持确认

防护：Runtime 返回 `confirmation_required`，不执行真实请求，不向 stdout 输出 prompt。

### AC-005：日志数据库损坏

防护：调用主流程应报告 audit failure；V1 发布前要决定审计失败时是否阻断执行。默认安全取向：写操作审计失败时不执行，读操作可配置。

### AC-006：用户误把高风险写操作设成 allow

防护：policy validate/simulation 产生 broad allow finding；ask/deny -> allow 需要 diff report；activation 写入 policy ledger。

### AC-007：紧急通道被当成永久后门

防护：breakglass 必须有 reason、短过期时间和 audit；不能覆盖 data egress deny、outbound private block、revoked/malicious capability block。

## 安全不变量

- 默认策略是 `ask`。
- `deny` 和未确认的 `ask` 不得解析密钥、不得执行 HTTP。
- 密钥不得出现在 stdout、stderr、MCP result、audit log 中。
- 所有 HTTP 请求必须有 timeout。
- 任意 URL 或未知域名能力必须被视为高风险。
- Registry trust level 不覆盖本地 policy。
- Policy 变更必须可追踪、可回滚、可模拟。
- Breakglass 不得绕过审计、数据外发阻断、出站私网阻断、密钥解析顺序或 revoked/malicious block。

## 关联任务

- T041：redaction 和 input hash。
- T055：arbitrary URL Capability 风险处理。
- T073：MCP `confirmation_required` 结果格式。
- T090：禁止 token passthrough。
- T091：outbound policy。
- T092：审计日志隐私分级。
- T128：把 abuse cases 转成 smoke tests。
- T249：policy decision trace。
- T253：policy simulation/diff。
- T255：policy override/breakglass controls。
