# 变更日志

本文记录 OpenCap 的重要变更。

项目在 `1.0.0` 之后遵循语义化版本。`0.x` 阶段公共契约仍可能演进，但破坏性变更也必须记录。

## 未发布

### 新增

- `opencap validate <path>` 已接入真实 Capability Manifest schema 校验。
- `@opencap/spec` 导出可复用 manifest loader/validator API。
- Manifest validator 单元测试覆盖合法和非法 schema 场景。
- Registry test case schema 与 `pnpm validate` 集成。
- Capability 编写教程，覆盖从空目录到 validate 通过的最小流程。
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
- Manifest schema 正式定义 `execution.body.type: json` 与 `execution.body.fields` JSON 值映射。
- Runtime output normalization，支持 JSON、text、empty 响应，并在 HTTP execution result 中携带 status code、content type 和 body kind。
- MCP tool name 映射表，支持 Capability id 稳定投影、冲突检测和原始 id metadata。
- Runtime Kernel 公共契约 V1，统一 CLI、MCP 和未来入口的 request/result/error/evidence 语言。
- 项目 conda 开发环境定义和开发环境文档。
- 整体设计二次审查，补齐工程缺口、成熟度评分和 T267-T276 补强任务。
- 整体系统设计 V1，收敛五个平面、三条链路、Runtime Kernel、账本和卡片模型。
- OpenCap V1 项目架构和中文文档体系。
- 能力清单 V1 草案和 HTTP-only 范围。
- 本地运行时、策略、审计、MCP、注册表、安全和治理设计文档。
- GitHub issue 和 pull request 模板已中文化。
- 初始开发者工具注册表示例能力。
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

- 命令行和运行时实现仍处于骨架阶段。
- install/list/invoke/logs/serve 仍处于骨架阶段。
