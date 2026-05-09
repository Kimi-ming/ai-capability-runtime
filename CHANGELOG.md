# 变更日志

本文记录 OpenCap 的重要变更。

项目在 `1.0.0` 之后遵循语义化版本。`0.x` 阶段公共契约仍可能演进，但破坏性变更也必须记录。

## 未发布

### 新增

- 威胁模型补充状态化矩阵，覆盖 SSRF、secret leakage、malicious capability、tool description prompt injection、confused deputy 和 overbroad capability。
- `opencap validate <path>` 已接入真实 Capability Manifest schema 校验。
- `@opencap/spec` 导出可复用 manifest loader/validator API。
- Manifest validator 单元测试覆盖合法和非法 schema 场景。
- Registry test case schema 与 `pnpm validate` 集成。
- GitHub Actions Registry CI，push/pull_request 时使用固定 Node/pnpm 和 frozen lockfile 运行 `pnpm validate`。
- pnpm workspace 全量验证通过：build/test/lint/validate 均可在项目 conda 环境运行。
- 单元测试基础设施现状文档化，明确 spec、runtime、mcp helper 已覆盖的测试入口和 CLI 测试缺口。
- Runtime 临时测试项目 helper，覆盖 install/list/logs 写入显式临时 state dir 且不污染默认 `opencap.local/`。
- CLI 端到端 smoke test，使用临时 `--state-dir` 跑通 validate、install、list、invoke dry-run 和 logs。
- README 快速开始更新为当前真实可运行的 CLI 闭环，并明确 `serve --mcp` 仍是骨架入口。
- 第一次贡献教程，串联环境准备、任务选择、验证、文档同步和提交推送。
- 架构总览新增 V1 Runtime 主路径 Mermaid 图，明确 CLI、Runtime、Policy、Audit、HTTP Executor、Local State 和外部 API 的关系。
- Alpha release checklist，区分发布阻断项和可后续跟进项，并明确未实现能力边界。
- 版本和兼容性策略补强，明确 package、manifest schema、Registry compatibility 和 `0.x` breaking change 记录规则。
- Capability 编写教程，覆盖从空目录到 validate 通过的最小流程。
- MCP Host 手动测试指南，覆盖 Claude Desktop、Claude Code、Cursor 配置、tools/list、tools/call、confirmation_required 和排障路径。
- Capability PR 评审指南，覆盖维护者合并前的阻断项、follow-up 项和安全检查。
- Registry README，说明目录结构、分类、trust level、提交流程和安全边界。
- Runtime 本地状态路径 helper，支持默认路径、env 和显式 state dir。
- `opencap install <id>` 已接入本地 state dir 安装逻辑，支持 `--state-dir`、`--registry` 和 `--force`。
- `opencap list` 已接入本地 state dir 读取，支持普通输出和 `--json`。
- CLI validate/install/list 使用统一错误处理 helper 和 exit code 语义。
- CLI `invoke` 骨架命令，以及 `invoke`、`logs`、`serve` 的 `--state-dir` 参数。
- `opencap doctor` 只读诊断命令，输出本地环境、registry、state dir、installed 和 policy 状态。
- Runtime Installed Capability Loader，加载合法 installed capability 并报告 invalid entries。
- Runtime 本地状态初始化会创建 `installed/`、`tmp/` 和默认 `policies.yml`，并保留用户已有策略文件。
- Runtime Policy parser，支持 `policies.yml` 解析、默认 ask policy、decision/risk 校验和结构化错误。
- Runtime Policy Engine，支持按规则匹配 permission、默认决策和 deny/ask/allow 聚合。
- Runtime Confirmation Handler 接口，包含 CLI prompt handler 和 MCP no-elicitation handler。
- Runtime 内存审计事件，记录 confirmation_required、deny 和 approved confirmation 的状态。
- CLI `--yes` 确认边界，普通 CLI ask 可自动批准，destructive/financial 和 deny 不可绕过。
- SQLite Audit Logger，使用 Node 内置 `node:sqlite` 创建 `invocations` 表、写入审计事件并查询最近记录。
- Runtime redaction 和 input hash，支持递归脱敏、稳定 JSON、SHA-256 hash，并持久化到 SQLite 审计记录。
- `opencap logs` 接入 SQLite 审计日志查询，支持默认最近 20 条、`--limit` 和 `--json`。
- `opencap logs` 支持 `--capability`、`--status`、`--since` 筛选。
- Runtime URL 模板渲染，支持 `{{field}}`、URL encoding 和结构化错误。
- Runtime dry-run executor，生成 HTTP 调用计划并写入 `dry_run` 审计事件。
- Runtime HTTP executor，支持真实请求、env 凭据、timeout、2xx/非 2xx 归一化结果和 resolved URL 审计证据。
- Runtime 测试锁定 token passthrough 禁止约束：普通 input token/api_key/authorization 不能替代 manifest `auth.env`。
- Manifest schema 正式定义 `execution.body.type: json` 与 `execution.body.fields` JSON 值映射。
- Runtime output normalization，支持 JSON、text、empty 响应，并在 HTTP execution result 中携带 status code、content type 和 body kind。
- Arbitrary URL 风险标记和 Runtime 检测，`http.request_demo` 已声明 unsafe-by-default，dry-run plan 会暴露 `arbitrary_url` warning。
- `opencap invoke <id> --dry-run`，支持 installed capability、`--input`、`--input-json`、policy evaluation、dry-run plan 和 SQLite 审计记录。
- 真实 `opencap invoke` 接入 CLI confirmation 和 HTTP executor，支持 `--yes`、`--json`、secret missing 错误和 read-only policy allow 执行。
- 新增 GitHub Issue 和 simple HTTP 的示例 input 文件，并在示例 README 中加入 `opencap invoke --dry-run --input` 命令。
- MCP `tools/list` projection builder，支持 installed Capability 到 MCP tool payload，并保留 tool name collision 检测。
- MCP Tool Projection builder，统一生成 `projectionVersion`、capability id、tool name、title、description、input/output schema 等模型可见 metadata。
- MCP Tool Projection evidence，生成稳定 `projectionHash` 并在 tool metadata 中暴露，用于未来 audit/evidence 关联。
- MCP tools/list description 改为使用 Runtime-generated permission/risk/confirmation summary，并阻止 manifest description 伪造风险摘要。
- `@opencap/spec` 新增 model-visible metadata lint，检测 instruction override、forced tool choice、bypass governance 和 secret exfiltration，并返回结构化 finding。
- `@opencap/spec` 新增 prompt-surface negative fixtures，覆盖 tool description injection、schema poisoning、schema token collection 和 hidden unicode injection。
- MCP `tools/call` 核心路由，支持 allow 执行、deny 结构化错误、ask 无 elicitation 返回 `CONFIRMATION_REQUIRED`，并写入 confirmation audit。
- MCP `confirmation_required` 结果格式稳定，包含 content 文案、`CONFIRMATION_REQUIRED` code、capability id、policy decision 和 V1 retry hint。
- MCP tool name 映射表，支持 Capability id 稳定投影、冲突检测和原始 id metadata。
- Runtime Kernel 公共契约 V1，统一 CLI、MCP 和未来入口的 request/result/error/evidence 语言。
- 项目 conda 开发环境定义和开发环境文档。
- 整体设计二次审查，补齐工程缺口、成熟度评分和 T267-T276 补强任务。
- 整体系统设计 V1，收敛五个平面、三条链路、Runtime Kernel、账本和卡片模型。
- OpenCap V1 项目架构和中文文档体系。
- 能力清单 V1 草案和 HTTP-only 范围。
- 本地运行时、策略、审计、MCP、注册表、安全和治理设计文档。
- 审计日志隐私分级，定义 public/operational/redacted/never-record-secret 等级和 debug 模式边界。
- 最小 outbound policy 设计补强，明确默认决策表、Runtime gate 入口、dry-run/真实执行行为和测试计划。
- GitHub issue 和 pull request 模板已中文化。
- GitHub feature request issue template，并修正 Capability 提交模板的 secret 提示和安全政策链接。
- 初始开发者工具注册表示例能力。
- 新增 `slack.send_message` 示例 Capability，覆盖 `external_send` 风险和 Slack `chat.postMessage` dry-run fixture。
- 互操作 profile、确认同意模型、能力包契约、一致性测试和 Agentic 风险映射文档。
- 身份授权模型、Secret Resolver 契约、凭据生命周期手册、最小权限评审和远程 OAuth 边界文档。
- 执行语义、重试幂等规则、失败恢复手册和执行证据文档。
- 组合边界、能力图、多步执行、组合失败恢复和 Saga/workflow 调研文档。
- 信任模型、能力安全公告流程、弃用/撤销生命周期和能力质量评分文档。
- 用量计量、配额预算策略、限流滥用控制、商业边界和用量证据文档。
- 工具投影、模型可见提示面安全、发现选择边界和模型可见元数据检查文档。
- 结果信封、输出校验、工具结果净化、结果来源和结果投递边界文档。
- 输入数据治理、数据分类、数据外发策略、输入来源和数据最小化文档。
- 策略决策追踪、策略生命周期/变更控制、策略模拟/差异评估和临时覆盖/紧急通道文档。
- 中文文档中心、中文文档规范、维护者索引和中文 GitHub 模板。

### 变更

- docs 子目录已从英文分类迁移为中文分类，并同步更新全仓文档链接。
- `github.create_issue` manifest 已包含 JSON body 渲染和 bearer token placement。

### 已知缺口

- 完整 `opencap serve --mcp` server 尚未实现；当前已有 MCP tool name 映射、`tools/list` 投影和 `tools/call` 路由 helper。
- Console UI、Cloud/团队能力、完整 OAuth flow、SDK/adapters 和 Registry signing 尚未实现。
- Outbound policy 私网阻断、Secret Resolver 调用顺序、audit failure preflight 和更多 conformance negative tests 仍需补齐。
- CLI command snapshot、stdout/stderr 和 exit code 细粒度测试仍需补齐。
