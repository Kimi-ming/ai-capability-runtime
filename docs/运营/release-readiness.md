# 发布门禁：OpenCap V1

本文定义 OpenCap 从开发骨架到 alpha、beta、V1 的发布门禁。发布不能只看功能数量，要看可信闭环是否成立。

## 使用方式

每次准备发布或打 milestone tag 前，维护者必须先判断当前目标属于哪一个成熟度阶段，再逐项核对对应 hard gate。未满足 hard gate 时不能发布；允许缺口只能写入 release notes、`docs/HANDOFF.md`、`docs/TASKS.md` 或 `docs/RISKS.md`，不能写成已支持能力。

## 发布成熟度阶段

```text
v0.1 Local Runtime
v0.2 Evidence Registry
v0.3 Interop Profiles
v0.4 Adapter Layer
v0.5 Policy Operations
v1.0 Capability Network
```

详细工程里程碑见 `docs/规划/v1-milestones.md`；版本兼容口径见 `docs/规范/versioning-and-compatibility.md`。

## Gate 维度

| 维度 | 关注问题 | 证据来源 |
| --- | --- | --- |
| Runtime | 本地 CLI/Runtime 是否能安全执行 V1 HTTP Capability | `pnpm test`、CLI smoke、audit log、Result Envelope |
| Registry / Trust | Capability 是否可提交、校验、评审、撤销和解释信任状态 | `pnpm validate`、review checklist、trust/lifecycle/advisory 文档 |
| Interop | Host 能否以稳定 profile 发现和调用能力 | MCP tests、Host compatibility records、manual smoke |
| Policy / Ops | 策略、审计、override、incident 和 decision log 是否可运营 | policy conformance tests、runbooks、decision log export |
| Docs / Release hygiene | 发布承诺、已知缺口和兼容变化是否准确 | README、CHANGELOG、HANDOFF、TASKS、RISKS、release notes |

## v0.1-v1.0 Maturity Gate Matrix

| 阶段 | 发布承诺 | Hard gates | 证据 | 允许缺口 | 不得宣称 |
| --- | --- | --- | --- | --- | --- |
| v0.1 Local Runtime | 早期开发者可在本地验证、安装、dry-run/execute HTTP Capability，并查看审计日志 | Runtime 主路径通过；`pnpm validate/test/build/lint` 通过；dry-run 不解析 secret；deny/ask 未确认不执行；审计日志不保存 secret 原文；README 快速开始真实 | CLI smoke、Runtime tests、`docs/TESTING.md`、`docs/HANDOFF.md` | 完整 MCP server、Console、SDK、provenance、复杂 registry trust 可作为明确限制 | 不能宣称 V1 稳定、完整 MCP server、团队/Cloud/OAuth 可用 |
| v0.2 Evidence Registry | 外部贡献者可提交、测试、评审和追踪 Capability 包 | Authoring loop 通过；Registry CI 覆盖 manifest、metadata lint、registry tests；review checklist 使用；trust/lifecycle/advisory 状态有文档入口；unsafe capability 明确标记 | `pnpm validate`、Capability review notes、Registry docs、trust/advisory docs | 签名 registry、质量评分、verified capability 可延后 | 不能宣称中心化 marketplace、官方认证或签名供应链完成 |
| v0.3 Interop Profiles | 至少一个 MCP Host profile 有可复现兼容记录，CLI/MCP result shape 稳定 | MCP tools/list 和 tools/call tests 通过；Result Envelope adapter 有测试；Host compatibility matrix 至少包含一组完成 smoke；known gaps 明确 | MCP tests、Host compatibility records、manual smoke 记录 | A2A、Apps SDK、所有 Host 全覆盖可延后 | 不能宣称“兼容所有 Host”或绕过 Runtime pipeline |
| v0.4 Adapter Layer | OpenAPI/MCP proxy/A2A/Apps SDK adapter 可以生成或映射受控草稿，但不能绕过治理 | Adapter 输出必须进入 authoring loop；生成 manifest 不跳过 lint/review/tests；adapter 不持有用户授权边界；相关非目标写入 docs | Adapter fixtures、authoring validation、design/RFC、review checklist | 完整远程 Runtime、workflow runtime、Agent planning 可延后 | 不能把 Capability 伪装成 Agent 或把 adapter 当授权层 |
| v0.5 Policy Operations | 组织级策略变更、模拟、override、incident 和 decision log 可运营 | Policy ledger、validate、simulate/diff、override/breakglass 和 decision log export 通过；incident runbook 完整；hard boundary 不能被 breakglass 绕过；High policy risks 有处理状态 | Policy governance conformance、runbooks、decision log export、RISKS | 外部 DLP、企业控制台、合规认证可延后 | 不能宣称合规认证、中心化遥测或可绕过审计 |
| v1.0 Capability Network | 本地优先 Capability Runtime 和治理闭环稳定，公共契约进入 SemVer 保护 | 所有 V1 P0/P1 完成且验证；High risks 缓解或接受；公共契约、migration、CHANGELOG、release notes、tag/npm 策略明确；主路径 docs 全同步；GitHub checks 通过 | Full workspace verification、traceability、CHANGELOG、release notes、tag/npm evidence | V1 明确非目标可以保留，但必须在 release notes 中列出 | 不能宣称 Cloud marketplace、付费商业闭环或未实现 adapter 稳定 |

## 阶段对应口径

### Alpha 发布条件

Alpha 对应 v0.1 Local Runtime。目标：让早期开发者能本地试用并反馈设计。

必须满足：

- `pnpm install` 成功并提交 lockfile。
- `pnpm validate` 成功。
- `opencap validate` 可校验 registry 和单个 capability。
- `opencap install/list` 可用。
- `opencap invoke --dry-run` 可显示调用计划并写日志。
- MCP helper 或 `serve --mcp` 当前状态写入 release notes；若完整 server 未完成，必须作为 alpha 限制明示。
- README 有真实可执行命令，不展示未实现功能为已完成。
- `docs/HANDOFF.md` 指向下一步。

### Beta 发布条件

Beta 至少覆盖 v0.2 Evidence Registry 和 v0.3 Interop Profiles。目标：让外部贡献者可以新增 Capability，并让至少一个 Host profile 有可复现兼容证据。

必须满足：

- `github.create_issue` demo 可在真实 token 下执行。
- `opencap logs` 可查看调用记录。
- MCP `confirmation_required` 行为稳定。
- Registry CI 校验 manifest、model-visible metadata lint 和 tests。
- Capability Review Checklist 完成。
- 至少一个外部风格示例通过 review。
- Host compatibility matrix 至少有一个完成 smoke 的 profile。

### V1 发布条件

V1 目标：可信本地 Runtime 成立。

必须满足：

- 所有 P0/P1 任务完成并验证。
- threat model 中的 High 风险有缓解或明确接受。
- 所有 CLI 命令有测试或 smoke test。
- 文档索引、README、SPEC、ARCHITECTURE、TESTING、HANDOFF 同步。
- 发布说明写明 V1 非目标和已知风险。
- tag、CHANGELOG、npm package 策略明确。

## Hard Blocker Rules

任一阶段出现以下情况都不得发布：

- 写操作无法审计。
- 密钥可能进入日志、README、manifest、tests 或 model-visible result。
- MCP STDIO 模式需要终端 prompt。
- `deny` 后仍会解析密钥或执行 HTTP。
- `ask` 未确认时仍会执行 Capability。
- README 中的主路径命令不可运行且未说明。
- High 风险无记录、无缓解、无接受理由。
- Release notes 宣称了 matrix 中“不得宣称”的能力。

## 发布前检查清单

```bash
git status --short --branch
git diff --check
pnpm install
pnpm validate
pnpm test
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
pnpm --filter @opencap/cli dev -- list
```

在实现前期，未能运行的命令必须在 `docs/HANDOFF.md` 标注原因。

## 文档同步清单

每次发布前检查：

- `README.md`：快速开始是否真实。
- `docs/SPEC.md`：V1 范围是否准确。
- `docs/TASKS.md`：任务状态是否真实。
- `docs/TESTING.md`：命令是否可跑。
- `docs/RISKS.md`：High 风险是否处理。
- `docs/DECISIONS.md`：新增 ADR 是否索引。
- `docs/HANDOFF.md`：下一步是否明确。
