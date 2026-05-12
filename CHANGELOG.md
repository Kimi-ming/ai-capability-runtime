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
- GitHub Actions workspace tests job 增加 `pnpm build` 门禁，本地已验证 workflow YAML、validate、lint、build 和 test。
- pnpm workspace 全量验证通过：build/test/lint/validate 均可在项目 conda 环境运行。
- 单元测试基础设施现状文档化，明确 spec、runtime、mcp helper 已覆盖的测试入口和 CLI 测试缺口。
- Runtime 临时测试项目 helper，覆盖 install/list/logs 写入显式临时 state dir 且不污染默认 `opencap.local/`。
- CLI 端到端 smoke test，使用临时 `--state-dir` 跑通 validate、install、list、invoke dry-run 和 logs。
- README 快速开始更新为当前真实可运行的 CLI 闭环，并明确 `serve --mcp` 仍是骨架入口。
- 第一次贡献教程，串联环境准备、任务选择、验证、文档同步和提交推送。
- 架构总览新增 V1 Runtime 主路径 Mermaid 图，明确 CLI、Runtime、Policy、Audit、HTTP Executor、Local State 和外部 API 的关系。
- Alpha release checklist，区分发布阻断项和可后续跟进项，并明确未实现能力边界。
- npm package 发布预案补齐 alpha 当前发布判断、trusted publishing/provenance、发布前验证和暂缓发布边界。
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
- CLI `opencap invoke` 输出 Result Envelope 子集：默认人类输出只显示 summary/status/warnings，`--json` 输出结构化 envelope，`--verbose` 仅追加脱敏 evidence。
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
- Discovery Profile V1 RFC，定义 discovery metadata、默认隐藏 yanked/revoked、ranking 不得修改 policy 或触发自动安装/授权。
- Selection evidence record 文档，定义 selected tool、projection hash、available tools hash 等字段，并明确不参与授权。
- Capability Review Checklist 和 Capability 提交模板接入 model-visible text 检查，覆盖 prompt injection、secret 请求和隐藏指令。
- Tool result prompt-surface sanitizer 草案，区分 structuredContent/free text，明确 secret redaction 和 indirect prompt injection 风险边界。
- Runtime Result Envelope V1 builder，统一表达 success、dry_run、blocked、confirmation_required、failed 和 unknown，并为 failed/unknown 提供结构化 error。
- Result Envelope public type export policy，明确 V1 公共类型由 `@opencap/runtime` 导出，CLI/MCP adapter 不复制类型定义，breaking change 必须进入 CHANGELOG 和迁移说明。
- Runtime output schema validation，schema mismatch 会进入 Result Envelope evidence 并返回 `OUTPUT_SCHEMA_INVALID` failed envelope。
- Output Selector V1 RFC，定义 provider JSON body 到 manifest `output` schema 的受限字段投影机制，禁止读取 secret/header/env/request/audit，并规定 missing required output 与 schema mismatch 的失败语义。
- MCP Result Envelope adapter，优先返回 `structuredContent`，`content[].text` 只使用 Runtime-generated summary，并正确映射 `isError`。
- Runtime Tool Result Sanitizer，脱敏 secret-like result、替换 instruction-like provider text、strip HTML/script/comment，并把 findings 写入 Result Envelope warnings/evidence。
- Runtime result sanitizer negative fixtures，覆盖 indirect prompt injection、secret leakage、HTML/script/comment 和 oversized output，并由 `result-sanitizer.test.ts` 自动加载。
- Runtime Result Provenance evidence，记录 redacted structured content digest、transformations 和 taint labels，并覆盖 failed/unknown summary。
- Runtime taint label tests，覆盖 provider 字段级 `provider_untrusted`、Runtime `textSummary` 的 `runtime_generated` 和 redacted 字段的 `secret_redacted`。
- Runtime oversized result handling，限制 provider structured/text result 大小，超限结构化结果替换为 `[TRUNCATED_RESULT]`，超长文本截断，并保留 sanitizer warning、redaction evidence 和 Runtime-generated MCP summary。
- Host tool metadata compatibility records，记录 Claude Desktop、Cursor、自定义 MCP client 对 title、description、outputSchema、annotations 和 `_meta` 的字段兼容性。
- Host result compatibility records，记录 Claude Desktop、Cursor、自定义 MCP client 对 `structuredContent`、`content[].text`、`isError` 和 `outputSchema` 的结果字段行为，并明确 Host 兼容性不是安全授权证据。
- Resource Delivery Profile V1 RFC，定义 large result 默认 summary + handle、resource handle 不是授权、resource content 读取前仍需 sanitizer/policy/audit 的边界。
- 结果信封、输出校验、工具结果净化、结果来源和结果投递边界文档。
- 输入数据治理、数据分类、数据外发策略、输入来源和数据最小化文档。
- Runtime input classification engine，导出 `classifyInput`，识别 secret_like、pii、internal_url、source_code、financial_data 和 free_text_unknown，并生成 redacted preview。
- Runtime sensitive input classification fixtures，覆盖 secret-like、pii、internal URL、source/config 和 large free text unknown，并验证 redacted preview 不含敏感原文。
- Runtime Data Egress Policy Gate，默认阻断 `secret_like` 和 `internal_url` 外发，要求 `pii/source_code` 到 `external_send` 进入确认，并在 deny 时禁止 secret resolution 和执行。
- Runtime Data Egress negative tests，覆盖 private IP、metadata service、`.env` secret assignment、stack trace 和 source diff 外发边界。
- Manifest Data Class Hint RFC，定义 input schema 的 `x-opencap-data-class` 扩展、合并语义、review/lint 边界和兼容策略。
- Organization Data Policy RFC，定义组织级 data egress policy、provider allowlist、metadata-only DLP profile 和 local-first 边界。
- Runtime Policy Decision Trace，risk policy 和 data egress gate 现在生成脱敏 trace，并通过审计事件/SQLite `policy_trace_json` 持久化。
- CLI `opencap invoke --dry-run --explain`，在人类输出中展示 blocking gate、matched rule、reason code、policy revision 和脱敏 evaluated facts。
- Runtime FilePolicyLedger，记录 policy activation、rollback 和 failed activation，本地 ledger 不保存 policy 原文、secret 或 input 原文。
- Runtime/CLI policy validate lint，检测非法 decision/risk、未知字段、重复 rule id 和未命名高风险 allow 规则，并输出 file path、field path 和 rule id。
- Runtime/CLI policy simulation/diff，支持在策略生效前比较 `policyBefore`/`policyAfter` 和场景 fixture，识别 new allow、ask/deny 放宽、敏感数据外发放宽和金融风险放宽，且 report 不包含 input 原文。
- Runtime broad allow safety checks，policy validator 会标记高风险宽泛 allow，simulation 会对 `secret_like`、`pii`、`source_code` 的 broad egress allow 产生 error finding。
- Runtime policy override/breakglass controls，支持受限 `allow_once`、`allow_until`、`deny_override` 和 `breakglass` record，并把 override 结果写入 policy trace 与 audit event。
- Runtime Secret Resolver V1 env provider，支持 env-only `api_key`、bearer/header placement、dry-run 不读取 secret、missing env 结构化错误、query/body placement 拒绝和 forbidden header 检查。
- Runtime credential audit evidence，执行审计事件记录 credential source/env name/placement/resolved/redacted summary，SQLite 可持久化查询且不保存 secret 原文。
- Manifest schema 约束 `api_key` 必须声明 `provider`、`env` 和 `placement`，`header` placement 必须声明 `name`，并拒绝 query/body secret placement。
- Policy simulation fixtures，新增 baseline/scoped/broad policy fixture 和 governance scenario fixture，覆盖风险、数据分类、trust/lifecycle/advisory 事实且不包含真实敏感值。
- Policy 事故响应手册，覆盖撤销 override、激活 deny policy、审查 audit、rollback policy、breakglass 边界和 advisory/revocation 联动。
- Decision log export，新增脱敏 policy decision summary 导出，支持 capability、decision、since/until 过滤，并关联 invocation id、policy revision 和 trace id。
- Policy governance conformance tests，新增 C-PG 一致性测试组和 record fixture，覆盖 decision trace、policy ledger、broad allow simulation、breakglass 硬边界和 audit redaction export。
- Policy bundle manifest/signing RFC，定义 policy bundle digest、optional signature、activation record、failed activation 和 local-first 边界。
- Runtime Data Egress audit fields，记录 egress decision、data classes、target origin、matched rule、redacted preview 和 `requestStarted=false`，SQLite 查询不包含 secret 原文。
- Runtime confirmation egress summary，CLI prompt 与 MCP `confirmation_required` reason 展示 target origin、data classes、fields sent 和 redacted preview。
- Runtime input provenance audit evidence，记录 input source、input hash、derived invocation、egress decision 和 transformations，SQLite 不保存 input 原文。
- Runtime field-level egress map，提取 HTTP URL/query/body 模板引用字段，记录 destination、data classes 和 redacted 状态，不记录字段值。
- Runtime derived input evidence chain，为 tool-derived input 记录上游 invocation 和 source result digest，同时要求派生 input 重新分类和经过 egress policy。
- Runtime input minimization by execution mapping，基于 field-level egress map 只保留被 URL/query/body 引用的字段，不自动外发整个 input。
- Runtime redacted egress preview，展示 target、fields sent、data classes 和脱敏 input，大段文本摘要化且不暴露 secret/source/internal 原文。
- Runtime/CLI dry-run egress preview，`opencap invoke --dry-run` 在 Result Envelope 和人类输出中展示 target origin、fields sent 和 data classes，并记录 `requestStarted=false` 的脱敏审计证据。
- 策略决策追踪、策略生命周期/变更控制、策略模拟/差异评估和临时覆盖/紧急通道文档。
- 中文文档中心、中文文档规范、维护者索引和中文 GitHub 模板。

### 变更

- docs 子目录已从英文分类迁移为中文分类，并同步更新全仓文档链接。
- `github.create_issue` manifest 已包含 JSON body 渲染和 bearer token placement。
- `github.search_repo` 和 `vercel.get_deployments` manifest 已补齐 bearer token placement。

### 已知缺口

- 完整 `opencap serve --mcp` server 尚未实现；当前已有 MCP tool name 映射、`tools/list` 投影和 `tools/call` 路由 helper。
- Console UI、Cloud/团队能力、完整 OAuth flow、SDK/adapters 和 Registry signing 尚未实现。
- Outbound policy 私网阻断、audit failure preflight 和更多 conformance negative tests 仍需补齐。
- CLI command snapshot、stdout/stderr 和 exit code 细粒度测试仍需补齐。
