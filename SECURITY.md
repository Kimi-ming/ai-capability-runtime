# 安全政策

OpenCap 的目标是让 AI 调用外部工具时更安全、更可审计、更容易推理。它提供权限边界、调用日志和验证元数据，但不保证每个第三方 Capability 都绝对安全。

## 安全目标

- 每个 Capability 都必须声明权限
- 执行前必须经过策略检查
- 高风险操作需要人工确认或明确拒绝
- 密钥必须被限定作用域
- 调用日志必须可追踪
- Registry 条目必须有清晰的信任信息

## 风险类型

- `read_only`：只读，不改变外部状态
- `write`：创建或更新外部状态
- `external_send`：向外部系统或人员发送内容
- `destructive`：删除、覆盖或难以恢复的操作
- `financial`：付款、扣费、交易或订阅
- `code_execution`：执行本地或远程代码/命令
- `secret_access`：读取、返回、转换或暴露密钥材料

普通 API 调用中由 Runtime 使用凭据，不等于 Capability 拥有 `secret_access` 权限。

## 漏洞报告

请不要在公开 issue 中提交安全漏洞。不要在公开 issue、PR、讨论、聊天记录或模型可见文本中粘贴 secret、攻击 payload、未公开漏洞细节、真实 provider token、私有 URL 或可直接复现攻击的完整数据。

优先使用 GitHub private vulnerability reporting。仓库启用后，研究者可在 Security -> Advisories 页面点击 Report a vulnerability，把报告私密提交给维护者。官方说明见 [Configuring private vulnerability reporting for a repository](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository)。

如果 GitHub 私密报告入口暂不可用，请按仓库安全政策链接联系维护者，并在主题中标明 `OpenCap security report`。请提供：

- 受影响组件
- 复现步骤
- 影响范围
- 已知缓解方案
- 是否涉及 secret、Capability manifest、Registry package、policy、audit log、MCP Host 或外部 provider

维护者处理流程：

1. 确认报告已收到，并避免要求报告者公开补充敏感信息。
2. triage 影响范围、严重级别和是否涉及真实 secret。
3. 必要时创建 draft security advisory 或按 `docs/安全/capability-advisory-process.md` 进入 Capability Advisory 流程。
4. 修复或缓解后，再协调披露、公告、revocation/freeze 或 release note。

维护者应定期检查 GitHub private vulnerability reporting 是否启用：Repository Settings -> Advanced Security -> Private vulnerability reporting。`.github/ISSUE_TEMPLATE/config.yml` 的安全政策链接应指向仓库 Security policy 页面，而不是公开 issue 模板。

项目会确认报告、调查问题，并在需要时发布安全公告。
