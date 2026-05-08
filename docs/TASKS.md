# TASKS：OpenCap 开发任务总表

本文是 OpenCap 的开发任务源。后续每次开发都应从这里选择任务、完成验证，并更新状态。

状态标记：

- `[ ]` 未开始
- `[~]` 进行中
- `[x]` 已完成且已验证
- `[!]` 阻塞
- `[?]` 需要确认

优先级：

- P0：没有它 V1 不能成立
- P1：V1 必须完成
- P2：V1 体验和贡献质量增强
- P3：V1 之后

## 可执行任务清单

### P0：V1 必须先完成

- T001 P0：让 `opencap validate` 调用真实 schema 校验。
- T002 P0：抽出可复用 manifest validator API。
- T010 P0：实现 OpenCap 本地状态路径 helper。
- T011 P0：实现 `opencap install <id>`。
- T012 P0：实现 `opencap list`。
- T020 P0：实现 Installed Capability Loader。
- T030 P0：实现 policy 文件格式和 parser。
- T031 P0：实现 Policy Engine。
- T032 P0：实现 Confirmation Handler 接口。
- T040 P0：确定并实现日志存储。
- T041 P0：实现 redaction 和 input hash。
- T050 P0：实现 URL 模板渲染。
- T051 P0：实现 dry-run executor。
- T052 P0：实现 HTTP executor。
- T060 P0：实现 `opencap invoke <id> --dry-run`。
- T070 P0：选择 MCP TypeScript SDK 并接入。
- T071 P0：实现 MCP `tools/list`。
- T072 P0：实现 MCP `tools/call` 路由。
- T090 P0：实现禁止 token passthrough 的约束。
- T100 P0：修正并跑通 pnpm workspace。
- T101 P0：CI 基础通过。

### P1：V1 完整体验

- T003 P1：补充 schema 单元测试。
- T004 P1：定义 registry test case schema。
- T013 P1：实现 CLI 统一错误处理和 exit code。
- T014 P1：增加 `--state-dir` 参数。
- T021 P1：实现 Capability id 与 MCP tool name 映射表。
- T022 P1：实现本地状态初始化。
- T033 P1：记录 ask/deny 的审计日志。
- T042 P1：实现 `opencap logs`。
- T053 P1：定义 HTTP request body manifest 字段。
- T054 P1：实现 output normalization。
- T055 P1：处理 arbitrary URL Capability 风险。
- T061 P1：实现真实 `opencap invoke`。
- T062 P1：添加示例 input 文件。
- T073 P1：定义 MCP `confirmation_required` 结果格式。
- T080 P1：Registry manifest CI 校验。
- T081 P1：Capability Review Checklist。
- T082 P1：补充 Registry README。
- T091 P1：最小 outbound policy 设计。
- T092 P1：审计日志隐私分级。
- T102 P1：单元测试基础设施。
- T103 P1：临时目录测试工具。
- T112 P1：README 跟随实现更新。
- T113 P1：新增贡献者上手教程。
- T116 P1：维护术语表和文档索引。
- T120 P1：定义 alpha release checklist。
- T121 P1：CHANGELOG。

### P2/P3：增强和后续扩展

- T005 P2：增加 manifest authoring guide。
- T015 P2：增加 `opencap doctor`。
- T034 P2：支持 `--yes` 非交互确认。
- T043 P2：增加日志筛选。
- T074 P2：MCP Host 手动测试文档。
- T083 P2：添加 GitHub Issue/PR templates。
- T084 P2：新增更多示例 Capability。
- T093 P2：威胁模型文档。
- T104 P2：端到端 smoke test。
- T114 P2：新增架构图。
- T122 P2：版本策略。
- T123 P2：npm package 发布预案。
- T124 P1：将领域模型落入 TypeScript 类型和 Runtime 接口。
- T125 P1：在 `opencap list` 输出 Capability lifecycle/trust card 基础字段。
- T126 P1：把发布门禁整理成可执行 release checklist。
- T127 P2：维护 MCP Host 兼容性矩阵。
- T128 P2：把威胁模型 Abuse Cases 转成 smoke tests。
- T129 P2：补充 Registry 供应链 review 工作流。
- T130 P1：实现 `auth.placement` schema 测试和 executor 映射。
- T131 P1：实现 `execution.body.fields` 渲染测试。
- T132 P1：实现 audit failure preflight 测试。
- T133 P1：实现 outbound policy 私网阻断测试。
- T134 P1：按 CLI 契约补齐命令 snapshot tests。
- T135 P1：按本地状态契约实现 state dir precedence tests。
- T136 P1：按 MCP 接口契约增加 tool mapping tests。
- T137 P1：实现错误模型和 exit code tests。
- T138 P2：增加 privacy retention 文档测试或 lint。
- T139 P1：CI 安全基线 workflow。
- T140 P1：把 Capability 分类落入 Registry 指南。
- T141 P1：把 Capability Review Checklist 接入 PR 流程。
- T142 P2：维护 Host compatibility test records。
- T143 P2：从 audit log 派生本地指标命令草案。
- T144 P2：补充 RFC 模板文件。
- T145 P1：定义 package public exports。
- T146 P2：OpenAPI adapter RFC 草案。
- T147 P2：Registry index signing RFC 草案。
- T148 P1：npm trusted publishing workflow 草案。
- T151 P1：实现 Capability Package lint。
- T152 P1：把 consent receipt 落入 audit log 字段和测试。
- T153 P2：建立 conformance suite skeleton。
- T154 P2：维护 Host compatibility evidence records。
- T155 P2：把 Agentic abuse cases 转成 smoke tests。
- T156 P2：MCP elicitation profile RFC。
- T157 P2：A2A Agent Card mapping RFC。
- T158 P1：Trust Card generation rules。
- T159 P0：实现 Secret Resolver V1 env provider。
- T160 P1：补齐 `auth.scopes` 和 credential descriptor schema 测试。
- T161 P1：实现 least-privilege auth lint。
- T162 P2：补充 credential lifecycle smoke/runbook 验证。
- T163 P2：Remote Runtime OAuth profile RFC。
- T164 P1：实现 secret resolution ordering 和 audit evidence tests。
- T165 P2：GitHub fine-grained token setup guide。
- T167 P1：将 execution semantics 落入 TypeScript 类型和 audit 字段。
- T168 P1：实现 unknown outcome audit tests。
- T169 P2：Retry/idempotency manifest RFC。
- T170 P2：实现 retry policy tests。
- T171 P2：Duplicate invocation detector 草案。
- T172 P2：Reconcile hint manifest field。
- T173 P2：Execution evidence conformance record。
- T175 P2：Composition context audit fields。
- T176 P2：Composition profile RFC。
- T177 P2：Step-level consent tests for composition。
- T178 P2：Plan hash and evidence chain 草案。
- T179 P2：Capability graph metadata RFC。
- T180 P2：Risk amplification review checklist。
- T181 P2：Registry graph index 草案。
- T182 P2：Compensation capability review rules。
- T183 P2：Composition failure recovery smoke tests。
- T185 P1：Trust level transition tests。
- T186 P1：Revoked capability invoke warning/deny behavior。
- T187 P1：Capability advisory YAML schema。
- T188 P1：Revocation metadata in registry。
- T189 P1：Installed capability advisory check。
- T190 P2：SECURITY.md 对齐 private reporting。
- T191 P1：Lifecycle status schema for deprecated/yanked/revoked。
- T192 P1：Install/list/invoke lifecycle warnings。
- T193 P2：Registry search excludes yanked/revoked by default。
- T194 P2：Quality score rubric implementation draft。
- T195 P2：Trust Card includes quality score。
- T196 P1：Score cannot override policy tests。

### 已完成

- 已完成：T110 P0：中文文档体系。
- 已完成：T111 P0：开发任务体系。
- 已完成：T115 P0：体系化项目管理文档。
- 已完成：T093 P2：威胁模型文档。
- 已完成：T117 P0：产品、协议、数据、安全体系化蓝图。
- 已完成：T118 P0：收敛 V1 执行、策略、审计和供应链关键决策。
- 已完成：T119 P0：补齐实现前接口契约和运行模型。
- 已完成：T120 P0：补齐生态、社区和可观测性体系。
- 已完成：T121 P1：CHANGELOG。
- 已完成：T122 P2：版本策略。
- 已完成：T123 P2：npm package 发布预案。
- 已完成：T149 P0：补齐演进、发布和兼容性体系。
- 已完成：T150 P0：补齐互操作、确认同意、一致性和 Agentic 风险体系。
- 已完成：T166 P0：补齐身份、授权和凭据生命周期体系。
- 已完成：T174 P0：补齐执行可靠性、副作用安全和失败恢复体系。
- 已完成：T184 P0：补齐组合边界、能力图和多步执行体系。
- 已完成：T197 P0：补齐信任模型、安全公告、撤销和质量评分体系。


---

## 当前推荐顺序

1. T001 `opencap validate` 接真实校验
2. T002 spec validator API
3. T010 local state helper
4. T011 install/list
5. T020 Installed Capability Loader
6. T030 Policy parser/engine
7. T040 Audit log
8. T050 HTTP executor dry-run
9. T060 `opencap invoke`
10. T070 MCP bridge

---

## Epic A：Spec 和 Manifest 校验

### T001 P0：让 `opencap validate` 调用真实 schema 校验

- [ ] T001 P0：让 `opencap validate` 调用真实 schema 校验

目标：CLI 不再输出 scaffold 文本，而是能校验指定 Capability 或 registry 路径。

涉及文件：

- `packages/cli/src/index.ts`
- `packages/spec/src/validate-manifests.mjs`
- `packages/spec/src/index.ts`

验收标准：

- `opencap validate registry/developer-tools/github.create_issue` 成功
- 非法 manifest 返回非 0 exit code
- 错误输出包含文件路径和字段路径
- 命令支持单 Capability 目录和 registry 目录

验证：

```bash
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
pnpm validate
```

### T002 P0：抽出可复用 manifest validator API

- [ ] T002 P0：抽出可复用 manifest validator API

目标：Runtime、CLI、CI 都能复用同一套校验逻辑。

验收标准：

- `@opencap/spec` 导出 `validateManifest` 和 `loadManifest`
- 支持 YAML 和 JSON
- 返回结构化错误，不直接 `process.exit`
- CLI 只负责格式化输出

验证：

```bash
pnpm --filter @opencap/spec test
pnpm --filter @opencap/spec build
```

### T003 P1：补充 schema 单元测试

- [ ] T003 P1：补充 schema 单元测试

覆盖：

- 合法 HTTP manifest
- `type: mcp` 失败
- 缺少 `permissions` 失败
- 非法 risk 失败
- timeout 小于 100 失败
- metadata 缺 trust level 失败

### T004 P1：定义 registry test case schema

- [ ] T004 P1：定义 registry test case schema

目标：让 `tests/basic.yml` 有可校验格式。

产出：

- `packages/spec/schema/registry-test.schema.json`
- `docs/registry-guidelines.md` 更新
- 示例 tests 修正

### T005 P2：增加 manifest authoring guide

- [ ] T005 P2：增加 manifest authoring guide

产出：

- `docs/guides/write-a-capability.md`
- 示例从空目录到通过 validate

---

## Epic B：CLI 基础能力

### T010 P0：实现 OpenCap 本地状态路径 helper

- [ ] T010 P0：实现 OpenCap 本地状态路径 helper

目标：统一管理 `opencap.local/` 路径。

验收标准：

- 默认路径是 repo/current working directory 下的 `opencap.local`
- 支持未来通过 env 或 flag 覆盖
- 创建必要目录时不影响 registry 源文件

### T011 P0：实现 `opencap install <id>`

- [ ] T011 P0：实现 `opencap install <id>`

目标：把 registry Capability 安装到本地状态。

验收标准：

- 搜索 `registry/**/<id>/manifest.yml`
- 找不到时报错
- 多个匹配时报错
- 安装时复制完整目录
- 已安装目录存在时给出明确处理策略：覆盖需 `--force`，默认拒绝

验证：

```bash
pnpm --filter @opencap/cli dev -- install github.create_issue
ls opencap.local/installed/github.create_issue
```

### T012 P0：实现 `opencap list`

- [ ] T012 P0：实现 `opencap list`

目标：显示已安装 Capability。

验收标准：

- 空安装状态有友好提示
- 有安装时显示 id/version/type/risk/trust level
- 损坏 manifest 有错误提示但不中断全部列表

### T013 P1：实现 CLI 统一错误处理和 exit code

- [ ] T013 P1：实现 CLI 统一错误处理和 exit code

要求：

- 用户错误 exit 1
- unexpected error exit 2
- 成功 exit 0
- 错误消息简洁，不默认输出 stack trace

### T014 P1：增加 `--state-dir` 参数

- [ ] T014 P1：增加 `--state-dir` 参数

目标：测试和用户可以指定状态目录。

适用命令：

- `install`
- `list`
- `invoke`
- `logs`
- `serve`

### T015 P2：增加 `opencap doctor`

- [ ] T015 P2：增加 `opencap doctor`

检查：

- Node/pnpm 版本
- registry 是否存在
- state dir 是否可写
- installed manifest 是否有效
- policy 文件是否有效

---

## Epic C：Runtime State 和 Capability Loading

### T020 P0：实现 Installed Capability Loader

- [ ] T020 P0：实现 Installed Capability Loader

目标：Runtime 能从 `opencap.local/installed` 加载能力。

验收标准：

- 只加载 schema 合法 manifest
- 返回 install path
- 保留 manifest version
- 错误可被 CLI/MCP 层展示

### T021 P1：实现 Capability id 与 MCP tool name 映射表

- [ ] T021 P1：实现 Capability id 与 MCP tool name 映射表

验收标准：

- `github.create_issue` -> `github_create_issue`
- 启动时检测冲突
- tool metadata 保留原始 id

### T022 P1：实现本地状态初始化

- [ ] T022 P1：实现本地状态初始化

目标：首次运行命令时自动创建必要目录。

目录：

- `installed/`
- `logs.sqlite` 或日志父目录
- `policies.yml` 默认模板

---

## Epic D：Policy 和 Confirmation

### T030 P0：实现 policy 文件格式和 parser

- [ ] T030 P0：实现 policy 文件格式和 parser

目标：读取 `opencap.local/policies.yml`。

默认策略：

```yaml
default: ask
rules:
  - match:
      risk: read_only
    decision: allow
  - match:
      risk: write
    decision: ask
  - match:
      risk: destructive
    decision: deny
```

验收标准：

- 缺 policy 文件时使用默认策略
- 非法 decision 报错
- 非法 risk 报错

### T031 P0：实现 Policy Engine

- [ ] T031 P0：实现 Policy Engine

输入：

- capability id
- permissions
- risk
- channel
- host
- input summary

输出：

- decision
- reason
- matched rule

验收标准：

- read_only -> allow
- write -> ask
- destructive -> deny
- 无匹配使用 default

### T032 P0：实现 Confirmation Handler 接口

- [ ] T032 P0：实现 Confirmation Handler 接口

目标：Policy Engine 不负责用户交互。

V1 handler：

- CLI terminal handler
- MCP no-elicitation handler

验收标准：

- CLI ask 可以 prompt
- MCP ask 返回 `confirmation_required`
- deny 不进入 confirmation

### T033 P1：记录 ask/deny 的审计日志

- [ ] T033 P1：记录 ask/deny 的审计日志

要求：

- ask 未确认也写日志
- deny 也写日志
- 日志中 status 区分 blocked/denied/executed

### T034 P2：支持 `--yes` 非交互确认

- [ ] T034 P2：支持 `--yes` 非交互确认

只允许 CLI 模式使用。

限制：

- 不得影响 MCP 模式
- financial/destructive 默认不允许 `--yes` 绕过，除非策略明确允许

---

## Epic E：Audit Log

### T040 P0：确定并实现日志存储

- [ ] T040 P0：确定并实现日志存储

推荐：SQLite。

验收标准：

- 自动创建表
- 写入 invocation log
- 查询最近 N 条
- 支持测试时使用临时 state dir

### T041 P0：实现 redaction 和 input hash

- [ ] T041 P0：实现 redaction 和 input hash

默认脱敏字段：

- token
- secret
- password
- api_key
- authorization

验收标准：

- 嵌套对象也脱敏
- 保留字段存在但值为 `[REDACTED]`
- input hash 稳定

### T042 P1：实现 `opencap logs`

- [ ] T042 P1：实现 `opencap logs`

验收标准：

- 默认显示最近 20 条
- 支持 `--json`
- 显示 capability id、decision、status、duration
- 错误日志可读

### T043 P2：增加日志筛选

- [ ] T043 P2：增加日志筛选

参数：

- `--capability`
- `--status`
- `--since`
- `--limit`

---

## Epic F：HTTP Executor

### T050 P0：实现 URL 模板渲染

- [ ] T050 P0：实现 URL 模板渲染

要求：

- 变量来自已校验 input
- 缺变量时报错
- URL encode 规则明确
- 审计记录 resolved URL

### T051 P0：实现 dry-run executor

- [ ] T051 P0：实现 dry-run executor

目标：先不发真实请求也能看到将执行什么。

验收标准：

- 输出 method/url/body/auth mode/risk
- 不读取 secret 原值
- 不发网络请求
- 写 audit log

### T052 P0：实现 HTTP executor

- [ ] T052 P0：实现 HTTP executor

支持：

- GET
- POST
- PUT
- PATCH
- DELETE
- JSON body
- timeout
- API key header 策略

### T053 P1：定义 HTTP request body manifest 字段

- [ ] T053 P1：定义 HTTP request body manifest 字段

当前 manifest 没有明确 body 映射。

需要设计：

- 默认 body 是否等于 input 去掉 path params？
- 是否引入 `execution.body` 模板？
- labels 等字段如何进入 GitHub API body？

产出：

- RFC 或 ADR
- schema 更新
- `github.create_issue` manifest 更新

### T054 P1：实现 output normalization

- [ ] T054 P1：实现 output normalization

目标：HTTP 响应转成 Capability output。

要求：

- JSON response 解析
- 非 JSON response 包装
- status code 进入错误处理
- output schema 校验

### T055 P1：处理 arbitrary URL Capability 风险

- [ ] T055 P1：处理 arbitrary URL Capability 风险

要求：

- `http.request_demo` 标记 unsafe-by-default
- docs 说明 outbound policy 风险
- Runtime 可检测 URL 完全由输入提供的情况并提高风险提示

---

## Epic G：CLI Invoke

### T060 P0：实现 `opencap invoke <id> --dry-run`

- [ ] T060 P0：实现 `opencap invoke <id> --dry-run`

验收标准：

- 从 installed 读取 Capability
- 支持 `--input <file>`
- 支持 inline JSON input
- 走 validate/policy/audit/executor dry-run

### T061 P1：实现真实 `opencap invoke`

- [ ] T061 P1：实现真实 `opencap invoke`

验收标准：

- write 操作默认 ask
- read_only 操作按 policy 自动 allow
- secret 缺失时给明确错误
- 结果支持 pretty 和 json 输出

### T062 P1：添加示例 input 文件

- [ ] T062 P1：添加示例 input 文件

新增：

- `examples/github-issue-capability/input.json`
- `examples/simple-http-capability/input.json`

---

## Epic H：MCP Bridge

### T070 P0：选择 MCP TypeScript SDK 并接入

- [ ] T070 P0：选择 MCP TypeScript SDK 并接入

任务：

- 确认 package 名和版本
- 添加依赖
- 写最小 MCP server
- 不破坏 STDIO 输出

### T071 P0：实现 tools/list

- [ ] T071 P0：实现 tools/list

验收标准：

- 已安装 Capability 暴露为 tools
- inputSchema 来自 manifest
- description 包含风险摘要
- tool name 冲突时启动失败

### T072 P0：实现 tools/call 路由

- [ ] T072 P0：实现 tools/call 路由

验收标准：

- MCP call -> runtime invoke
- allow 执行
- deny 返回结构化错误
- ask 无 elicitation 返回 confirmation_required
- audit log 全覆盖

### T073 P1：MCP confirmation_required 结果格式

- [ ] T073 P1：MCP confirmation_required 结果格式

需要定义：

- result content
- structured metadata
- host 如何让用户重试
- 是否生成 confirmation token

### T074 P2：MCP Host 手动测试文档

- [ ] T074 P2：MCP Host 手动测试文档

新增：

- `docs/guides/connect-mcp-host.md`

---

## Epic I：Registry 和 Capability 生态

### T080 P1：Registry manifest CI 校验

- [ ] T080 P1：Registry manifest CI 校验

目标：PR/push 自动校验 registry manifests。

要求：

- `pnpm validate` 覆盖 registry
- schema 错误 fail CI
- 示例 tests 格式也校验

### T081 P1：Capability Review Checklist

- [ ] T081 P1：Capability Review Checklist

新增：

- `docs/guides/review-a-capability.md`
- 权限、风险、外部端点、README、测试、维护者检查

### T082 P1：补充 Registry README

- [ ] T082 P1：补充 Registry README

新增：

- `registry/README.md`
- 分类说明
- trust level 说明
- 提交流程

### T083 P2：添加 GitHub Issue/PR templates

- [ ] T083 P2：添加 GitHub Issue/PR templates

新增：

- bug report
- feature request
- capability submission
- technical design proposal

### T084 P2：新增更多示例 Capability

- [ ] T084 P2：新增更多示例 Capability

候选：

- `slack.send_message`，external_send 风险
- `notion.create_page`，write 风险
- `sentry.list_issues`，read_only 风险
- `postgres.query_readonly`，read_only 但敏感数据风险

---

## Epic J：安全加固

### T090 P0：禁止 token passthrough 的实现约束

- [ ] T090 P0：禁止 token passthrough 的实现约束

要求：

- Runtime 不接受 Host 直接传入 token 作为普通 input 替代 auth
- manifest auth.env 是 V1 唯一 credential 来源
- logs 脱敏 authorization 类字段

### T091 P1：最小 outbound policy 设计

- [ ] T091 P1：最小 outbound policy 设计

目标：限制 HTTP executor 的目标域。

候选设计：

- manifest 声明 `execution.allowed_hosts`
- Runtime 校验 resolved URL host
- arbitrary URL Capability 必须显式声明

### T092 P1：审计日志隐私分级

- [ ] T092 P1：审计日志隐私分级

定义：

- 默认 redacted
- debug 模式可更多字段，但需要显式开启
- 不记录 secret 原文

### T093 P2：威胁模型文档

- [ ] T093 P2：威胁模型文档

新增：

- `docs/security/threat-model.md`
- prompt injection
- confused deputy
- overbroad capability
- secret exfiltration
- unsafe arbitrary URL

---

## Epic K：测试和 CI

### T100 P0：修正并跑通 pnpm workspace

- [ ] T100 P0：修正并跑通 pnpm workspace

目标：首次 `pnpm install` 后仓库可 build/test。

验收标准：

- 生成并提交 `pnpm-lock.yaml`
- `pnpm build` 通过或明确拆分可执行包
- `pnpm test` 通过

### T101 P0：CI 基础通过

- [ ] T101 P0：CI 基础通过

要求：

- install
- validate
- test
- build

### T102 P1：单元测试基础设施

- [ ] T102 P1：单元测试基础设施

范围：

- spec
- runtime
- mcp helper
- cli command behavior

### T103 P1：临时目录测试工具

- [ ] T103 P1：临时目录测试工具

目标：测试 install/list/logs 不污染真实 `opencap.local/`。

### T104 P2：端到端 smoke test

- [ ] T104 P2：端到端 smoke test

目标：用 fixture 跑通 validate/install/list/invoke dry-run/logs。

---

## Epic L：文档和开发者体验

### T110 P0：中文文档体系

- [x] T110 P0：中文文档体系

已完成：核心 README、docs、RFC、registry/example 说明中文化。

验证：

- `git diff --check`
- JSON 解析
- YAML 解析

### T111 P0：开发任务体系

- [x] T111 P0：开发任务体系

本任务创建：

- `docs/TASKS.md`
- `docs/SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
- `docs/DECISIONS.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`
- `AGENTS.md`

### T112 P1：README 跟随实现更新

- [ ] T112 P1：README 跟随实现更新

当 CLI 可用后，更新快速开始为真实命令。

### T113 P1：新增贡献者上手教程

- [ ] T113 P1：新增贡献者上手教程

新增：

- `docs/guides/first-contribution.md`

### T114 P2：新增架构图

- [ ] T114 P2：新增架构图

候选：

- Mermaid Runtime flow
- package dependency graph
- invocation sequence diagram

---

## Epic M：发布准备

### T120 P1：定义 alpha release checklist

- [ ] T120 P1：定义 alpha release checklist

新增：

- `docs/releases/alpha-checklist.md`

### T121 P1：CHANGELOG

- [ ] T121 P1：CHANGELOG

新增：

- `CHANGELOG.md`

### T122 P2：版本策略

- [ ] T122 P2：版本策略

决策：

- package versions
- schema version
- registry compatibility

### T123 P2：npm package 发布预案

- [ ] T123 P2：npm package 发布预案

范围：

- `@opencap/cli`
- `@opencap/spec`
- `@opencap/runtime`
- `@opencap/mcp`

---

## 阻塞和开放问题

### Q001 `[?]` HTTP body manifest 设计

`github.create_issue` 需要 request body，但当前 `execution` 只有 method/url/timeout。

建议：尽快写 ADR/RFC。

### Q002 `[?]` Audit log 存储选择

当前建议 SQLite，但还未正式决策。

### Q003 `[?]` MCP elicitation 实际兼容性

需要确认目标 MCP SDK 和常见 Host 支持情况。

### Q004 `[?]` Secret Resolver V1 是否只支持 env

当前文档倾向 env-only，但实现前应明确错误提示和扩展接口。

### T115 P0：体系化项目管理文档

- [x] T115 P0：体系化项目管理文档

目标：把任务清单升级为可导航、可追踪、可门禁、可交接的开发体系。

交付物：

- `docs/INDEX.md`
- `docs/WORKFLOW.md`
- `docs/planning/v1-milestones.md`
- `docs/planning/traceability-matrix.md`
- `docs/RISKS.md`
- `docs/TASK_TEMPLATE.md`
- `docs/GLOSSARY.md`

验收标准：

- 文档地图能说明不同角色该读什么
- 追踪矩阵能连接需求、任务和测试
- 里程碑文档能给出阶段退出门禁
- 风险登记能覆盖当前主要技术风险

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
git diff --check
```


### T093 P2：威胁模型文档

- [x] T093 P2：威胁模型文档

已完成：新增 `docs/security/threat-model.md`，覆盖资产、信任边界、攻击者模型、主要威胁、Abuse Cases、安全不变量和关联任务。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
```

### T117 P0：产品、协议、数据、安全体系化蓝图

- [x] T117 P0：产品、协议、数据、安全体系化蓝图

已完成：新增产品战略、用户场景、Capability 生命周期、领域模型、Runtime 契约、协议定位、发布门禁和协议生态补充调研，并将它们接入 README、INDEX、SPEC、ARCHITECTURE、DECISIONS、RISKS。

验收标准：

- 新文档能回答 OpenCap 的定位、用户、对象、生命周期、运行时边界、协议边界、安全边界和发布标准。
- README 和 `docs/INDEX.md` 能导航到新增文档。
- ADR 索引包含新增决策。
- 风险登记反映 SQLite 和生命周期相关风险状态。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
```


### T118 P0：收敛 V1 执行、策略、审计和供应链关键决策

- [x] T118 P0：收敛 V1 执行、策略、审计和供应链关键决策

已完成：新增体系蓝图、HTTP 执行设计、Policy DSL、Audit Log、Registry Test Format、Outbound Policy、供应链治理、项目运行模型和风险治理调研。新增 ADR 0008-0012，并更新 schema、GitHub Capability manifest、风险登记、测试策略、README、INDEX 和任务表。

验收标准：

- R002/R014 被 ADR 明确缓解。
- R003/R004 进入明确设计和实现任务。
- `github.create_issue` manifest 具备 JSON body 和 bearer token placement。
- Policy DSL 格式唯一。
- Registry test format 有稳定 V1 字段。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T119 P0：补齐实现前接口契约和运行模型

- [x] T119 P0：补齐实现前接口契约和运行模型

已完成：新增 CLI 契约、本地状态、配置模型、MCP 接口、错误模型、隐私与数据保留、CI 安全基线和 V1 实施计划。新增 ADR 0013-0015，并更新 SYSTEM、README、INDEX、DECISIONS、任务、追踪矩阵和交接文档。

验收标准：

- T001 之后的 CLI 行为有明确 stdout/stderr/exit code。
- T010/T014 的 state dir 解析规则明确。
- T070-T073 的 MCP tools/confirmation 行为明确。
- T013/T137 的错误分类和 exit code 明确。
- 发布前 CI/security baseline 明确。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T120 P0：补齐生态、社区和可观测性体系

- [x] T120 P0：补齐生态、社区和可观测性体系

已完成：新增 Capability 分类、Host 兼容性矩阵、开源核心边界、贡献者路径、Capability Review Checklist、RFC 流程、可观测性指标、Open Questions 和生态调研；新增 GitHub issue/PR templates；新增 ADR 0016-0018。

验收标准：

- Registry 能力分类和粒度规则清晰。
- 外部贡献者路径清晰。
- Capability PR 有评审清单。
- 大型设计变化有 RFC 流程。
- V1 可观测性边界清楚，默认无远程遥测。
- OSS/Cloud 边界清楚。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T149 P0：补齐演进、发布和兼容性体系

- [x] T149 P0：补齐演进、发布和兼容性体系

已完成：新增版本和兼容性策略、Manifest 演进策略、Registry 分发模型、SDK/Adapter 边界、包发布策略、签名和 provenance 路线图、质量门禁、维护者手册、发布调研，并新增 CHANGELOG。新增 ADR 0019-0022。

验收标准：

- 公共契约和破坏性变化规则明确。
- Manifest schema 演进有迁移规则。
- V1 Registry 分发保持 Git-based、本地 install。
- SDK/adapters 不阻塞 V1 主路径。
- npm trusted publishing/provenance 方向明确。
- 质量门禁覆盖 schema/CLI/state/policy/audit/HTTP/MCP/registry/release。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T150 P0：补齐互操作、确认同意、一致性和 Agentic 风险体系

- [x] T150 P0：补齐互操作、确认同意、一致性和 Agentic 风险体系

已完成：新增互操作 Profiles、确认与同意模型、Capability Package V1、一致性测试体系、Agentic 风险映射、互操作与 Agentic security 调研，并新增 ADR 0023-0026。同步更新 README、INDEX、SYSTEM、DECISIONS、RISKS、TESTING、追踪矩阵和 HANDOFF。

验收标准：

- 兼容性声明必须绑定 profile 和 evidence record。
- `ask` 的确认语义被建模为 Runtime-owned consent request/receipt。
- Registry 中 Capability package 的最小目录契约清晰。
- Conformance suite 覆盖 manifest/package/runtime/policy/consent/audit/http/mcp/registry/security。
- Agentic AI 风险能映射到 OpenCap 控制和后续测试任务。
- 修正 T124 编号冲突，已完成的演进发布体系改为 T149。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T166 P0：补齐身份、授权和凭据生命周期体系

- [x] T166 P0：补齐身份、授权和凭据生命周期体系

已完成：新增身份与授权模型、Secret Resolver V1、凭据生命周期 Runbook、最小权限评审、OAuth 与远程 Runtime 边界、身份授权调研，并新增 ADR 0027-0029。同步更新 README、INDEX、SYSTEM、DECISIONS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- V1 下游凭据来源限定为 manifest 声明的 env var。
- Host/client/input token 不能作为下游 provider token。
- Secret Resolver 的输入、输出、调用顺序和 dry-run 行为清晰。
- 凭据创建、配置、轮换、撤销和泄露响应流程清晰。
- Capability least-privilege review 有可执行检查项。
- 远程 Runtime OAuth 被明确排除在 V1 主路径外，后续必须走 profile/RFC。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T174 P0：补齐执行可靠性、副作用安全和失败恢复体系

- [x] T174 P0：补齐执行可靠性、副作用安全和失败恢复体系

已完成：新增执行语义、重试与幂等、失败恢复、执行证据、执行可靠性调研，并新增 ADR 0030-0031。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- 非幂等写操作 V1 不自动 retry。
- 请求发出后的 timeout 被建模为 `unknown_after_timeout`。
- outcome、request_started、retryAttempt、providerRequestId 等执行证据字段清晰。
- failure recovery runbook 明确请求前失败、请求后失败、5xx/429、timeout unknown 的恢复路径。
- idempotency key 支持被定义为后续 RFC，不混入 V1 主路径。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T184 P0：补齐组合边界、能力图和多步执行体系

- [x] T184 P0：补齐组合边界、能力图和多步执行体系

已完成：新增组合边界、能力图、多步执行边界、组合失败恢复、组合/Saga 调研，并新增 ADR 0032-0034。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- V1 明确不内置 workflow runtime。
- 多步组合中每一步都必须独立 policy、consent、secret、execution、audit。
- compositionId/planHash 只作为 evidence，不作为授权。
- compensation 被定义为独立 Capability invocation，不是隐式 rollback。
- 能力图作为 registry 元数据和风险放大分析基础，而不是自动执行许可。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


### T197 P0：补齐信任模型、安全公告、撤销和质量评分体系

- [x] T197 P0：补齐信任模型、安全公告、撤销和质量评分体系

已完成：新增 Trust 模型、Capability Advisory 流程、能力弃用/下架/撤销、能力质量评分、Trust/Advisory/Revocation 调研，并新增 ADR 0035-0037。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- Trust level 被定义为证据摘要，不覆盖本地 policy。
- Revoked capability 保留可寻址记录，不能从历史中静默消失。
- Advisory lifecycle 覆盖 reported/triaged/investigating/fixed/mitigated/revoked/published。
- Deprecated/yanked/revoked 的 Registry 和 Runtime 行为清晰。
- Quality Score 只解释成熟度，不能绕过 risk、policy、consent。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```
