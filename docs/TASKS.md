# 开发任务总表：OpenCap

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
- T198 P1：Usage event schema。
- T199 P1：Quota/budget policy gates。
- T200 P1：Provider rate limit handling。
- T201 P1：Local abuse throttle。
- T202 P2：Paid capability manifest RFC。
- T203 P2：Commerce profile RFC。
- T204 P1：Financial consent/spend cap tests。
- T205 P2：Usage export format。
- T206 P2：Problem details for quota/rate errors。
- T207 P2：Usage evidence conformance tests。
- T209 P1：实现 MCP Tool Projection builder。
- T210 P1：实现 model-visible metadata lint。
- T211 P1：补充 prompt-surface negative fixtures。
- T212 P1：记录 tool projection hash/evidence。
- T213 P1：MCP tools/list 使用 Runtime-generated risk summary。
- T214 P2：Discovery profile RFC。
- T215 P2：Selection evidence record。
- T216 P2：Capability Review Checklist 接入 model-visible text 检查。
- T217 P2：Tool result prompt-surface sanitizer 草案。
- T218 P2：Host tool metadata compatibility records。
- T220 P1：实现 Result Envelope V1。
- T221 P1：实现 output schema validation。
- T222 P1：MCP structuredContent adapter。
- T223 P1：Tool result sanitizer。
- T224 P1：Result provenance/evidence。
- T225 P1：Oversized result handling。
- T226 P2：Host result compatibility records。
- T227 P2：Output selector RFC。
- T228 P2：Resource delivery profile RFC。
- T229 P1：Result sanitizer negative fixtures。
- T230 P2：Taint label tests。
- T231 P1：CLI result envelope output。
- T232 P2：Result Envelope public type exports。
- T234 P1：实现 input classification engine。
- T235 P1：补充 sensitive input classification fixtures。
- T236 P1：实现 Data Egress Policy Gate。
- T237 P1：记录 egress decision audit fields。
- T238 P1：confirmation summary 展示 data classes 和 egress target。
- T239 P1：input provenance audit evidence。
- T240 P1：field-level egress map。
- T241 P2：derived input evidence chain。
- T242 P1：按 execution mapping 做 input minimization。
- T243 P1：redacted egress preview。
- T244 P1：dry-run egress preview。
- T245 P1：internal URL/source/config egress negative tests。
- T246 P2：manifest data class hint RFC。
- T247 P2：organization data policy RFC。
- T249 P1：实现 policy decision trace。
- T250 P1：实现 policy explain CLI。
- T251 P1：实现 policy change audit/ledger。
- T252 P1：实现 policy validate lint。
- T253 P1：实现 policy simulation/diff。
- T254 P1：实现 broad allow safety checks。
- T255 P1：实现 policy override/breakglass controls。
- T256 P2：policy bundle manifest/signing RFC。
- T257 P1：policy simulation fixtures。
- T258 P2：policy incident runbook。
- T259 P2：decision log export。
- T260 P1：policy governance conformance tests。
- T268 P1：定义统一 Runtime Gate 接口和 GateDecision 语义。
- T269 P1：定义 Capability/Policy/Invocation/Compatibility Ledger 存储接口。
- T270 P1：定义 Capability/Trust/Consent/Compatibility Card schema 和生成规则。
- T271 P1：定义 Interoperability Profile evidence record schema。
- T272 P2：设计 Registry index/cache/sync RFC。
- T273 P1：固定 Capability identity、digest、version 和 lifecycle 关系。
- T274 P2：为 SLSA/Sigstore provenance 预留 package 和 release metadata。
- T275 P1：补齐 Capability authoring loop 和 lint 顺序。
- T276 P1：定义 v0.1-v1.0 release maturity gate matrix。

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
- 已完成：T208 P0：补齐用量计量、配额预算、限流滥用和商业边界体系。
- 已完成：T219 P0：补齐 Tool Projection、Prompt Surface、发现选择边界和模型可见元数据治理体系。
- 已完成：T233 P0：补齐 Result Envelope、输出校验、结果净化、结果来源和投递边界体系。
- 已完成：T248 P0：补齐输入数据治理、数据分类、外发策略、输入来源和数据最小化体系。
- 已完成：T261 P0：补齐 Policy Decision Trace、策略生命周期、策略模拟和 override/breakglass 体系。
- 已完成：T262 P0：重新梳理中文文档入口、索引和文档规范。
- 已完成：T263 P0：整理 docs 根目录文件并归位参考、教程、规范和模板。
- 已完成：T264 P0：中文化 docs 子目录结构并同步全仓链接。
- 已完成：T265 P0：补齐整体系统设计 V1。
- 已完成：T266 P0：完成整体设计二次审查和工程补强任务拆解。
- 已完成：T277 P0：创建项目 conda 开发环境。
- 已完成：T267 P0：定义 Runtime Kernel public contract 设计契约。
- 已完成：T001 P0：让 `opencap validate` 调用真实 schema 校验。
- 已完成：T002 P0：抽出可复用 manifest validator API。
- 已完成：T003 P1：补充 schema 单元测试。
- 已完成：T004 P1：定义 registry test case schema。
- 已完成：T005 P2：增加 manifest authoring guide。
- 已完成：T010 P0：实现 OpenCap 本地状态路径 helper。
- 已完成：T011 P0：实现 `opencap install <id>`。
- 已完成：T012 P0：实现 `opencap list`。
- 已完成：T013 P1：实现 CLI 统一错误处理和 exit code。
- 已完成：T014 P1：增加 `--state-dir` 参数。

### T267 P0：定义 Runtime Kernel public contract 设计契约

- [x] T267 P0：定义 Runtime Kernel public contract 设计契约

产出：

- `docs/设计/runtime-kernel-contract-v1.md`
- 文档入口、架构总览、体系蓝图和追踪矩阵已同步引用

范围：

- 固定 `RuntimeKernel`、`RuntimeContext`、`InvocationRequest`、`InvocationPlan`、`GateDecision`、`ConsentRequest`、`ConsentReceipt`、`SecretHandle`、`ResultEnvelope`、`RuntimeError` 和 evidence/audit 的公共形状。
- 明确 CLI、MCP、未来 API 和 Console 只能通过 Runtime public contract 适配，不重新发明调用模型。
- 明确 `invoke` 是唯一允许产生外部副作用的入口，`planInvocation` 不解析 secret、不发请求。

后续：

- T124/T145：把设计契约落入 `packages/runtime` TypeScript exports。
- T268：补齐统一 Runtime Gate 接口和 Gate registry。
- T220/T231：把 Result Envelope 落到 Runtime 和 CLI 输出。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
git diff --check
```



---

## 当前推荐顺序

1. T015 `opencap doctor`
2. T020 Installed Capability Loader
3. T030 Policy parser/engine
4. T040 Audit log
5. T050 HTTP executor dry-run
6. T060 `opencap invoke`
7. T070 MCP bridge
8. T080 Registry manifest CI 校验
9. T081 Capability Review Checklist
10. T021 Capability id 与 MCP tool name 映射表

---

## Epic A：Spec 和 Manifest 校验

### T001 P0：让 `opencap validate` 调用真实 schema 校验

- [x] T001 P0：让 `opencap validate` 调用真实 schema 校验

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

完成记录：`opencap validate` 已调用 `@opencap/spec` validator；支持单 Capability 目录、registry 目录和 `manifest.yml` / `manifest.yaml` / `manifest.json` 文件；非法 manifest 返回非 0 exit code，并输出文件路径和 JSON Pointer 风格字段路径。AJV 已切换到 draft 2020-12 validator。

### T002 P0：抽出可复用 manifest validator API

- [x] T002 P0：抽出可复用 manifest validator API

目标：Runtime、CLI、CI 都能复用同一套校验逻辑。

完成记录：`@opencap/spec` 已导出 `loadManifest`、`validateManifest`、`validateManifestFile`、`validateManifestPath`、`findManifestFiles` 和结构化 validation result 类型；CLI 只负责路径解析和输出格式化。

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

- [x] T003 P1：补充 schema 单元测试

验收标准：

- `packages/spec` 有 validator 单元测试文件。
- 测试直接调用 `validateManifest` 或 `validateManifestFile`，无需通过 CLI 输出断言。
- 合法 HTTP manifest 通过。
- `type: mcp` 失败。
- 缺少 `permissions` 失败。
- 非法 risk 失败。
- timeout 小于 100 失败。
- metadata 缺 trust level 失败。
- 失败结果至少断言一个 JSON Pointer 风格字段路径。

验证：

```bash
pnpm --filter @opencap/spec test
pnpm --filter @opencap/spec build
```

完成记录：已新增 `packages/spec/src/index.test.ts`，覆盖合法 HTTP manifest、非法 type、缺少 permissions、非法 risk、timeout 过小、metadata 缺 trust level，并断言 JSON Pointer 风格字段路径。

### T004 P1：定义 registry test case schema

- [x] T004 P1：定义 registry test case schema

目标：让 `tests/basic.yml` 有可校验格式。

产出：

- `packages/spec/schema/registry-test.schema.json`
- `docs/社区/registry-guidelines.md` 更新
- 示例 tests 修正

验收标准：

- 新增 registry test case JSON Schema。
- schema 能表达 `name`、`input`、`expect.status`、`expect.output` 或 `expect.error`。
- 现有 `registry/**/tests/basic.yml` 按 schema 通过校验或被修正为通过。
- Registry 指南说明 test case 的最小字段和用途。
- 后续 CI 可以复用该 schema，不需要读取 Runtime 实现。

验证：

```bash
pnpm validate
pnpm --filter @opencap/spec build
```

完成记录：已新增 `packages/spec/schema/registry-test.schema.json` 和 `packages/spec/src/validate-registry.ts`；`pnpm validate` 现在同时校验 manifests 与 `registry/**/tests/basic.yml`；现有 registry 测试样例已补齐 `capability`、`mode` 和 `expect.status`。

### T005 P2：增加 manifest authoring guide

- [x] T005 P2：增加 manifest authoring guide

目标：让贡献者能从空目录写出一个通过 `opencap validate` / `pnpm validate` 的 HTTP Capability。

产出：

- `docs/教程/write-a-capability.md`
- 示例从空目录到通过 validate

验收标准：

- 教程使用中文，覆盖 manifest 必填字段、权限、auth、execution、metadata 和 tests/basic.yml。
- 教程给出可复制的最小 HTTP Capability 示例。
- 教程说明如何运行 `pnpm validate` 和 `opencap validate <path>`。
- 教程明确不放真实 token，测试 env 只能使用假值。
- `docs/README.md` 的“我要贡献 Capability 或 Registry 条目”路径加入该教程。

验证：

```bash
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
pnpm validate
```

完成记录：已新增 `docs/教程/write-a-capability.md`，覆盖最小 HTTP Capability、README、`tests/basic.yml`、单能力校验、registry 校验和常见错误；`docs/README.md` 已加入教程入口。

---

## Epic B：CLI 基础能力

### T010 P0：实现 OpenCap 本地状态路径 helper

- [x] T010 P0：实现 OpenCap 本地状态路径 helper

目标：统一管理 `opencap.local/` 路径。

验收标准：

- 默认路径是 repo/current working directory 下的 `opencap.local`
- 支持未来通过 env 或 flag 覆盖
- 创建必要目录时不影响 registry 源文件

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/runtime build
```

完成记录：`@opencap/runtime` 已导出 `resolveStateDir`、`getLocalStatePaths`、`ensureLocalStateDir`、`DEFAULT_STATE_DIR_NAME` 和 `OPENCAP_STATE_DIR_ENV`；默认路径、env、显式 stateDir 优先级、目录结构和最小目录创建均有单元测试覆盖。

### T011 P0：实现 `opencap install <id>`

- [x] T011 P0：实现 `opencap install <id>`

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

完成记录：`@opencap/runtime` 已导出 `installCapability` 和 `InstallCapabilityError`；CLI `install` 已支持 `--state-dir`、`--registry` 和 `--force`。安装会校验 manifest、复制完整 Capability 目录、默认拒绝覆盖，`--force` 可替换。

### T012 P0：实现 `opencap list`

- [x] T012 P0：实现 `opencap list`

目标：显示已安装 Capability。

验收标准：

- 空安装状态有友好提示
- 有安装时显示 id/version/type/risk/trust level
- 损坏 manifest 有错误提示但不中断全部列表

验证：

```bash
pnpm --filter @opencap/cli dev -- list --state-dir /private/tmp/opencap-cli-install-smoke
pnpm --filter @opencap/runtime test
```

完成记录：`@opencap/runtime` 已导出 `listInstalledCapabilities`；CLI `list` 支持 `--state-dir` 和 `--json`。空状态输出友好提示，已安装状态显示 id/version/type/risk/trust/status，损坏 manifest 标记为 `invalid` 且不阻断其他条目。

### T013 P1：实现 CLI 统一错误处理和 exit code

- [x] T013 P1：实现 CLI 统一错误处理和 exit code

目标：让 CLI 命令使用统一错误格式和 exit code，避免每个 command 自己散写 `try/catch`。

验收标准：

- 用户错误 exit 1。
- unexpected/internal error exit 2。
- 成功 exit 0。
- 错误消息简洁，不默认输出 stack trace。
- validate/install/list 使用同一组 CLI error helper。
- 现有 validate/install/list smoke 行为保持不变。

验证：

```bash
pnpm --filter @opencap/cli build
pnpm --filter @opencap/cli dev -- validate /private/tmp/non-existent-opencap-path
pnpm --filter @opencap/cli dev -- install missing.capability --state-dir /private/tmp/opencap-cli-install-smoke
```

完成记录：CLI 新增 `runCliAction`、`handleCliError` 和 `setCliError` helper；validate/install/list 已统一使用 helper。已验证用户错误 exit 1、成功路径保持 exit 0，默认不输出 stack trace。

### T014 P1：增加 `--state-dir` 参数

- [x] T014 P1：增加 `--state-dir` 参数

目标：测试和用户可以指定状态目录。

适用命令：

- `install`
- `list`
- `invoke`
- `logs`
- `serve`

验收标准：

- 已实现命令 `install` 和 `list` 保持 `--state-dir` 行为。
- 尚未实现的 `invoke`、`logs` 和 `serve` 先接受 `--state-dir` 参数并保持骨架行为。
- `--state-dir` 解析结果仍覆盖 `OPENCAP_STATE_DIR` 和默认路径。

验证：

```bash
pnpm --filter @opencap/cli dev -- install github.create_issue --state-dir /private/tmp/opencap-cli-state-dir-smoke --force
pnpm --filter @opencap/cli dev -- list --state-dir /private/tmp/opencap-cli-state-dir-smoke
pnpm --filter @opencap/cli build
```

完成记录：`install`、`list` 已保持真实 `--state-dir` 行为；`invoke`、`logs`、`serve` 已接受 `--state-dir` 并保持骨架输出。

### T015 P2：增加 `opencap doctor`

- [ ] T015 P2：增加 `opencap doctor`

目标：提供一个只读诊断命令，帮助开发者确认本地环境、registry 和 state dir 的基础健康状态。

检查：

- Node/pnpm 版本
- registry 是否存在
- state dir 是否可写
- installed manifest 是否有效
- policy 文件是否有效

验收标准：

- `opencap doctor` 命令可运行。
- 输出至少包含 Node 版本、pnpm 可用性、registry 路径、state dir 路径、installed 目录状态。
- doctor 不修改 registry 或 state dir 内容，除非用户后续显式要求 repair。
- 缺少 registry 或 state dir 不应导致 stack trace。
- `--state-dir` 和 `--registry` 可用于指定检查路径。

验证：

```bash
pnpm --filter @opencap/cli dev -- doctor --state-dir /private/tmp/opencap-cli-state-dir-smoke
pnpm --filter @opencap/cli build
```

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

- `docs/教程/connect-mcp-host.md`

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

- `docs/教程/review-a-capability.md`
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

- `docs/安全/threat-model.md`
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

- `docs/教程/first-contribution.md`

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
- `docs/规划/v1-milestones.md`
- `docs/规划/traceability-matrix.md`
- `docs/RISKS.md`
- `docs/规划/task-template.md`
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

已完成：新增 `docs/安全/threat-model.md`，覆盖资产、信任边界、攻击者模型、主要威胁、Abuse Cases、安全不变量和关联任务。

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


### T208 P0：补齐用量计量、配额预算、限流滥用和商业边界体系

- [x] T208 P0：补齐用量计量、配额预算、限流滥用和商业边界体系

已完成：新增用量计量、配额与预算策略、限流与滥用控制、付费能力与商业边界、用量证据、Usage/Commerce/Abuse 调研，并新增 ADR 0038-0040。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、CHANGELOG 和 HANDOFF。

验收标准：

- Usage Event 被定义为本地可观测和限额证据，不是账单记录。
- Quota/Budget Gate 在 Secret Resolver 和 Executor 前运行。
- Rate limit 和 abuse control 能区分 local throttle 与 provider 429。
- Financial capability 必须 explicit consent 和 spend budget，不自动 retry。
- Paid capability/agentic commerce 被明确放入 future commerce profile，不进入 V1 主路径。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


## Epic N：Tool Projection 和 Prompt Surface Governance

### T209 P1：实现 MCP Tool Projection builder

- [ ] T209 P1：实现 MCP Tool Projection builder

目标：`@opencap/mcp` 不再临时拼接 tool description，而是通过明确的 projection builder 生成模型可见 MCP tool metadata。

涉及文件：

- `packages/mcp/src/index.ts`
- `packages/mcp/src/tool-projection.ts`
- `packages/mcp/src/tool-projection.test.ts`

验收标准：

- projection 输出包含 `projectionVersion`、`capabilityId`、`toolName`、`title`、`description`、`inputSchema`、`outputSchema`。
- description 使用 Runtime 模板。
- 不读取 README 或远程文档。
- tool name 映射仍然 deterministic。

验证：

```bash
pnpm --filter @opencap/mcp test
```

### T210 P1：实现 model-visible metadata lint

- [ ] T210 P1：实现 model-visible metadata lint

目标：对 manifest name、description、input/output schema descriptions 执行 prompt-surface lint。

涉及文件：

- `packages/spec/src/metadata-lint.ts`
- `packages/spec/src/index.ts`
- `packages/spec/src/metadata-lint.test.ts`

验收标准：

- 检测 instruction override。
- 检测 forced tool choice。
- 检测 bypass governance。
- 检测 secret exfiltration。
- 输出结构化 finding。

验证：

```bash
pnpm --filter @opencap/spec test
```

### T211 P1：补充 prompt-surface negative fixtures

- [ ] T211 P1：补充 prompt-surface negative fixtures

目标：把 tool description injection、schema poisoning、hidden text 等风险转成可复用测试夹具。

涉及文件：

- `packages/spec/fixtures/invalid/*.yml`
- `packages/spec/src/metadata-lint.test.ts`

验收标准：

- `ignore previous instructions` fixture 失败。
- `always call this tool` fixture 失败。
- schema field 要求填入 token fixture 失败。
- hidden unicode fixture 失败。

验证：

```bash
pnpm --filter @opencap/spec test
```

### T212 P1：记录 tool projection hash/evidence

- [ ] T212 P1：记录 tool projection hash/evidence

目标：Runtime 或 MCP layer 能生成 projection hash，供 audit/evidence 使用。

涉及文件：

- `packages/mcp/src/tool-projection.ts`
- `packages/runtime/src/`
- `docs/设计/audit-log-v1.md`

验收标准：

- 相同输入生成相同 projection hash。
- description 或 schema 改变会改变 projection hash。
- audit/evidence 文档说明字段。

验证：

```bash
pnpm --filter @opencap/mcp test
```

### T213 P1：MCP tools/list 使用 Runtime-generated risk summary

- [ ] T213 P1：MCP tools/list 使用 Runtime-generated risk summary

目标：tools/list 的风险和权限摘要来自 Runtime/manifest structured permissions，而不是自由文本。

涉及文件：

- `packages/mcp/src/index.ts`
- `packages/mcp/src/tool-projection.ts`

验收标准：

- description 包含结构化 permissions/risk summary。
- manifest description 不能覆盖 risk summary。
- 空 permissions 时报 validation error，而不是生成空风险描述。

验证：

```bash
pnpm --filter @opencap/mcp test
```

### T214 P2：Discovery profile RFC

- [ ] T214 P2：Discovery profile RFC

目标：定义未来 registry search/discovery 的 profile，避免自动安装、自动授权或商业排名污染安全边界。

涉及文件：

- `rfcs/`
- `docs/生态/discovery-and-selection-boundary.md`

验收标准：

- RFC 明确 discovery metadata。
- RFC 明确 ranking 不能修改 policy。
- RFC 明确 revoked/yanked 默认隐藏。

验证：

```bash
git diff --check
```

### T215 P2：Selection evidence record

- [ ] T215 P2：Selection evidence record

目标：定义 Host/model 选择工具时可选记录的 evidence 字段。

涉及文件：

- `docs/生态/discovery-and-selection-boundary.md`
- `docs/质量/execution-evidence-v1.md`

验收标准：

- selection evidence 只用于审计和调试。
- 字段包含 selected tool、projection hash、available tools hash。
- 文档明确不用于授权。

验证：

```bash
git diff --check
```

### T216 P2：Capability Review Checklist 接入 model-visible text 检查

- [ ] T216 P2：Capability Review Checklist 接入 model-visible text 检查

目标：Registry 人工评审能显式检查 tool description、schema description 和 README 中的提示注入风险。

涉及文件：

- `docs/社区/capability-review-checklist.md`
- `.github/ISSUE_TEMPLATE/capability_submission.yml`

验收标准：

- checklist 包含 model-visible text 检查。
- template 提醒提交者不要写入 prompt injection 或 secret 请求。

验证：

```bash
ruby -e "require 'yaml'; Dir['.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T217 P2：Tool result prompt-surface sanitizer 草案

- [ ] T217 P2：Tool result prompt-surface sanitizer 草案

目标：定义 provider response/error 进入模型上下文前的最小 sanitization 和结构化输出策略。

涉及文件：

- `docs/安全/prompt-surface-security-v1.md`
- `docs/设计/output-normalization-v1.md` 或后续等价文档

验收标准：

- 区分 structuredContent 和 free text。
- 明确 secret redaction。
- 明确 indirect prompt injection 作为 risk，不承诺完全消除。

验证：

```bash
git diff --check
```

### T218 P2：Host tool metadata compatibility records

- [ ] T218 P2：Host tool metadata compatibility records

目标：记录不同 MCP Host 对 title、description、outputSchema、annotations 和 `_meta` 的处理差异。

涉及文件：

- `docs/生态/host-compatibility-matrix.md`
- `docs/生态/interoperability-profiles.md`

验收标准：

- 至少记录 Claude Desktop、Cursor、自定义 MCP client 的字段支持情况。
- 兼容性声明绑定 Host 版本和测试日期。

验证：

```bash
git diff --check
```

### T219 P0：补齐 Tool Projection、Prompt Surface、发现选择边界和模型可见元数据治理体系

- [x] T219 P0：补齐 Tool Projection、Prompt Surface、发现选择边界和模型可见元数据治理体系

已完成：新增 Tool Projection V1、Prompt Surface Security、Discovery and Selection Boundary、Model-visible Metadata Lint、工具描述/prompt-surface 调研，并新增 ADR 0041-0043。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、Capability Review Checklist、CHANGELOG、HANDOFF 和 MCP scaffold helper。

验收标准：

- MCP tool projection 被定义为 Runtime-owned。
- model-visible metadata 被定义为 security surface。
- discovery/selection 被明确排除为授权来源。
- tool description 不再被旧文档描述为直接透传 manifest description。
- 相关风险、任务、测试和追踪矩阵闭环。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


## Epic O：Result Governance 和 Output Boundary

### T220 P1：实现 Result Envelope V1

- [ ] T220 P1：实现 Result Envelope V1

目标：Runtime 统一返回 `ResultEnvelopeV1`，MCP/CLI 只做 adapter。

涉及文件：

- `packages/runtime/src/`
- `packages/mcp/src/`
- `packages/runtime/src/result-envelope.test.ts`

验收标准：

- success、dry_run、blocked、confirmation_required、failed、unknown 都能表达。
- envelope 包含 invocationId、capabilityId、status、outcome、isError、warnings、evidence。
- failed/unknown 不只返回自由文本。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T221 P1：实现 output schema validation

- [ ] T221 P1：实现 output schema validation

目标：声明 output schema 的 Capability 只有在 structured output 校验通过后才能返回 success。

涉及文件：

- `packages/runtime/src/`
- `packages/spec/src/`
- `packages/runtime/src/output-validation.test.ts`

验收标准：

- 缺 required output 字段失败。
- 类型不匹配失败。
- schema validation finding 进入 evidence。
- output schema mismatch 不标记 success。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T222 P1：MCP structuredContent adapter

- [ ] T222 P1：MCP structuredContent adapter

目标：MCP result 优先返回 `structuredContent`，`content[].text` 只放 Runtime-generated summary。

涉及文件：

- `packages/mcp/src/`
- `packages/mcp/src/result-adapter.test.ts`

验收标准：

- success result 包含 structuredContent。
- text summary 不包含 provider raw output。
- failed/blocked/confirmation_required 都结构化。
- isError 映射正确。

验证：

```bash
pnpm --filter @opencap/mcp test
```

### T223 P1：Tool result sanitizer

- [ ] T223 P1：Tool result sanitizer

目标：对 provider response/error body 做 secret redaction、prompt-surface marker、size/content-type guard。

涉及文件：

- `packages/runtime/src/result-sanitizer.ts`
- `packages/runtime/src/result-sanitizer.test.ts`

验收标准：

- token/cookie/private key 被脱敏。
- instruction-like provider text 不直接进入 content text。
- HTML/script/comment 被 strip 或 summarize。
- sanitizer finding 进入 warnings/evidence。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T224 P1：Result provenance/evidence

- [ ] T224 P1：Result provenance/evidence

目标：记录 result provenance、content digest、transformations 和 taint labels。

涉及文件：

- `packages/runtime/src/`
- `docs/质量/execution-evidence-v1.md`

验收标准：

- provider_untrusted/runtime_generated/secret_redacted/sanitized_text labels 可表达。
- digest 基于 redacted structured content。
- failed/unknown result 也有 provenance summary。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T225 P1：Oversized result handling

- [ ] T225 P1：Oversized result handling

目标：限制 provider JSON/text 大小，避免上下文污染、内存压力和成本失控。

涉及文件：

- `packages/runtime/src/`
- `packages/runtime/src/result-limits.test.ts`

验收标准：

- 超大 JSON 被阻断或截断并记录 warning。
- 超大 text 不直接进入 MCP content。
- limits 不影响 audit redaction。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T226 P2：Host result compatibility records

- [ ] T226 P2：Host result compatibility records

目标：记录不同 MCP Host 对 structuredContent、content text、isError、outputSchema 的处理差异。

涉及文件：

- `docs/生态/host-compatibility-matrix.md`
- `docs/生态/result-delivery-boundary.md`

验收标准：

- 记录 Host、版本、日期、字段行为和证据。
- 明确 OpenCap 安全不依赖 Host 正确处理 structuredContent。

验证：

```bash
git diff --check
```

### T227 P2：Output selector RFC

- [ ] T227 P2：Output selector RFC

目标：定义从 provider raw JSON 映射到 manifest output schema 的 selector 机制。

涉及文件：

- `rfcs/`
- `docs/质量/output-validation-v1.md`

验收标准：

- selector 不能读取 secret。
- selector 输出必须通过 output schema。
- missing required output 失败。

验证：

```bash
git diff --check
```

### T228 P2：Resource delivery profile RFC

- [ ] T228 P2：Resource delivery profile RFC

目标：定义未来大结果、resource links、embedded resources 的投递和读取边界。

涉及文件：

- `rfcs/`
- `docs/生态/result-delivery-boundary.md`

验收标准：

- resource handle 不是授权。
- resource content 进入模型前仍需 sanitizer。
- large result 默认 summary + handle。

验证：

```bash
git diff --check
```

### T229 P1：Result sanitizer negative fixtures

- [ ] T229 P1：Result sanitizer negative fixtures

目标：把间接 prompt injection、secret leakage、HTML/script、oversized output 转成测试夹具。

涉及文件：

- `packages/runtime/fixtures/result-sanitizer/`
- `packages/runtime/src/result-sanitizer.test.ts`

验收标准：

- provider text 要求模型忽略指令时不直出。
- provider body 含 token 时脱敏。
- HTML script/comment 不进入 content text。
- oversized output 有 warning。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T230 P2：Taint label tests

- [ ] T230 P2：Taint label tests

目标：验证 result provenance 中 provider_untrusted、runtime_generated、secret_redacted、sanitized_text labels。

涉及文件：

- `packages/runtime/src/result-provenance.test.ts`

验收标准：

- provider 字段被标记 provider_untrusted。
- Runtime summary 被标记 runtime_generated。
- redacted 字段被标记 secret_redacted。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T231 P1：CLI result envelope output

- [ ] T231 P1：CLI result envelope output

目标：CLI `invoke` 支持 Result Envelope 子集输出，并保持 secret redaction。

涉及文件：

- `packages/cli/src/`
- `docs/设计/cli-contract-v1.md`

验收标准：

- `--json` 输出 structured result envelope subset。
- 默认人类输出只显示 summary、status、warnings。
- `--verbose` 也只显示 redacted evidence。

验证：

```bash
pnpm --filter @opencap/cli test
```

### T232 P2：Result Envelope public type exports

- [ ] T232 P2：Result Envelope public type exports

目标：定义 Result Envelope 是否由 `@opencap/runtime` 或独立 contract 包导出。

涉及文件：

- `packages/runtime/src/index.ts`
- `packages/spec/src/index.ts` 或 future contracts package
- `docs/规范/versioning-and-compatibility.md`

验收标准：

- 公共类型版本化。
- breaking change 进入 CHANGELOG。
- MCP/CLI adapter 不复制类型定义。

验证：

```bash
pnpm --filter @opencap/runtime build
```

### T233 P0：补齐 Result Envelope、输出校验、结果净化、结果来源和投递边界体系

- [x] T233 P0：补齐 Result Envelope、输出校验、结果净化、结果来源和投递边界体系

已完成：新增 Result Envelope V1、Output Validation V1、Tool Result Sanitization V1、Result Provenance V1、Result Delivery Boundary、Result Governance 调研，并新增 ADR 0044-0046。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、README、CHANGELOG、HANDOFF、MCP interface、HTTP execution 和 execution evidence 文档。

验收标准：

- Provider raw output 默认不进入模型上下文。
- 声明 output schema 的结果必须通过校验后才能 success。
- Result Envelope 成为 Runtime 到 MCP/CLI 的稳定输出边界。
- Tool result sanitizer、provenance、taint label 和 delivery boundary 均进入任务队列。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```


## Epic P：Input Governance 和 Data Egress Boundary

### T234 P1：实现 input classification engine

- [ ] T234 P1：实现 input classification engine

目标：对 validated input 执行本地分类，识别 secret_like、pii、source_code、internal_url、financial_data、free_text_unknown 等类别。

涉及文件：

- `packages/runtime/src/input-classifier.ts`
- `packages/runtime/src/input-classifier.test.ts`

验收标准：

- token-like 字段和值被识别为 secret_like。
- email/phone-like 被识别为 pii。
- localhost/private IP/metadata URL 被识别为 internal_url。
- `.env`/diff/stack trace 被识别为 source_code 或 secret_like。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T235 P1：补充 sensitive input classification fixtures

- [ ] T235 P1：补充 sensitive input classification fixtures

目标：建立可复用输入分类测试夹具。

涉及文件：

- `packages/runtime/fixtures/input-classification/`
- `packages/runtime/src/input-classifier.test.ts`

验收标准：

- secret-like fixture。
- pii fixture。
- internal URL fixture。
- source/config fixture。
- large free text unknown fixture。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T236 P1：实现 Data Egress Policy Gate

- [ ] T236 P1：实现 Data Egress Policy Gate

目标：根据 data classes、provider、target origin、risk 和 destination 判断外发 allow/ask/deny/redact。

涉及文件：

- `packages/runtime/src/data-egress-policy.ts`
- `packages/runtime/src/invoke-pipeline.ts`
- `docs/设计/data-egress-policy-v1.md`

验收标准：

- secret_like 默认 deny。
- internal_url 默认 deny。
- pii/source_code 到 external_send 默认 ask。
- egress deny 不解析 secret、不执行。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T237 P1：记录 egress decision audit fields

- [ ] T237 P1：记录 egress decision audit fields

目标：audit log 记录 data classes、egress target、egress decision、policy rule id 和 redacted preview。

涉及文件：

- `docs/设计/audit-log-v1.md`
- `packages/runtime/src/audit*`

验收标准：

- egress deny 也写 audit。
- requestStarted false。
- audit 不含 secret 原文。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T238 P1：confirmation summary 展示 data classes 和 egress target

- [ ] T238 P1：confirmation summary 展示 data classes 和 egress target

目标：用户确认写操作或外发操作时，能看到将发送给谁、发送哪些数据类别。

涉及文件：

- `docs/设计/confirmation-and-consent-v1.md`
- `packages/runtime/src/confirmation*`

验收标准：

- confirmation request 包含 target origin。
- 包含 data classes。
- 包含 fields sent。
- preview 已脱敏。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T239 P1：input provenance audit evidence

- [ ] T239 P1：input provenance audit evidence

目标：记录 input source、input hash、derivedFromInvocationId、egress decision 和 transformations。

涉及文件：

- `packages/runtime/src/`
- `docs/质量/input-provenance-v1.md`

验收标准：

- model_generated/user_supplied/tool_derived/runtime_generated 可表达。
- tool_derived 记录来源 invocation。
- 不记录 input 原文。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T240 P1：field-level egress map

- [ ] T240 P1：field-level egress map

目标：记录 input 字段分别进入 URL/query/header/body 的映射。

涉及文件：

- `packages/runtime/src/http-renderer.ts`
- `packages/runtime/src/egress-map.test.ts`

验收标准：

- 每个 rendered field 有 destination。
- 未引用字段不出现在 map 中。
- destination 包含 data classes。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T241 P2：derived input evidence chain

- [ ] T241 P2：derived input evidence chain

目标：当 input 来自上一步工具结果时，记录上游 invocation 和 result digest。

涉及文件：

- `docs/质量/input-provenance-v1.md`
- `docs/设计/multi-step-execution-boundary.md`

验收标准：

- 记录 derivedFromInvocationId。
- 记录 source result digest。
- derived input 仍需重新分类和 egress policy。

验证：

```bash
git diff --check
```

### T242 P1：按 execution mapping 做 input minimization

- [ ] T242 P1：按 execution mapping 做 input minimization

目标：只发送 execution.url/query/header/body 引用的 input 字段。

涉及文件：

- `packages/runtime/src/http-renderer.ts`
- `packages/runtime/src/input-minimization.test.ts`

验收标准：

- 未引用 input 字段不进入 request。
- 不自动把整个 input 当 body。
- optional missing field 被省略。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T243 P1：redacted egress preview

- [ ] T243 P1：redacted egress preview

目标：为 confirmation、dry-run 和 audit 生成脱敏外发预览。

涉及文件：

- `packages/runtime/src/egress-preview.ts`
- `packages/runtime/src/egress-preview.test.ts`

验收标准：

- preview 显示 target、fields sent、data classes。
- secret-like 字段不出现原文。
- 大段文本摘要化。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T244 P1：dry-run egress preview

- [ ] T244 P1：dry-run egress preview

目标：`opencap invoke --dry-run` 展示请求计划和 redacted egress preview，不读取 secret 原值，不发请求。

涉及文件：

- `packages/cli/src/`
- `packages/runtime/src/`

验收标准：

- dry-run 输出 target origin。
- 输出 fields sent 和 data classes。
- 不读取 secret 原值。
- requestStarted false。

验证：

```bash
pnpm --filter @opencap/cli test
pnpm --filter @opencap/runtime test
```

### T245 P1：internal URL/source/config egress negative tests

- [ ] T245 P1：internal URL/source/config egress negative tests

目标：验证内部 URL、源码、配置和 secret-like 文本不会静默外发。

涉及文件：

- `packages/runtime/src/data-egress-policy.test.ts`

验收标准：

- private IP URL in body/query -> deny。
- `.env` content -> deny or redact+ask。
- stack trace/source diff -> ask。
- metadata service URL -> deny。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T246 P2：manifest data class hint RFC

- [ ] T246 P2：manifest data class hint RFC

目标：定义 manifest input schema 的 `x-opencap-data-class` hint。

涉及文件：

- `rfcs/`
- `docs/安全/data-classification-v1.md`

验收标准：

- hint 不能降低 classifier finding。
- hint 可提高 review 透明度。
- schema extension 有兼容策略。

验证：

```bash
git diff --check
```

### T247 P2：organization data policy RFC

- [ ] T247 P2：organization data policy RFC

目标：定义未来组织级 data egress policy、provider allowlist 和 DLP provider profile。

涉及文件：

- `rfcs/`
- `docs/设计/data-egress-policy-v1.md`

验收标准：

- local-first OSS 仍可独立运行。
- 组织策略不把 Cloud 变成 V1 主路径依赖。
- 外部 DLP provider 不默认接收 input 原文。

验证：

```bash
git diff --check
```

### T248 P0：补齐输入数据治理、数据分类、外发策略、输入来源和数据最小化体系

- [x] T248 P0：补齐输入数据治理、数据分类、外发策略、输入来源和数据最小化体系

已完成：新增 Input Data Governance V1、Data Classification V1、Data Egress Policy V1、Input Provenance V1、Data Minimization and Redaction V1、Input Egress 调研，并新增 ADR 0047-0049。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、README、CHANGELOG 和 HANDOFF。

验收标准：

- Tool input 在分类前视为 untrusted data。
- Data Egress Gate 在 Secret Resolver 和 Executor 前运行。
- Runtime 只外发 execution mapping 引用字段。
- confirmation/dry-run/audit 都使用 redacted egress preview。
- PII/source/internal URL/secret-like input 风险进入任务、测试和风险登记。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

---

## Epic Q：Policy Governance

### T249 P1：实现 policy decision trace

- [ ] T249 P1：实现 policy decision trace

目标：每次 risk policy、data egress、quota/budget、outbound、lifecycle gate 的决策都能生成脱敏 trace。

涉及文件：

- `packages/runtime/src/policy*`
- `packages/runtime/src/audit*`
- `docs/设计/policy-decision-trace-v1.md`

验收标准：

- trace 包含 policySetId、policyRevision、gate、decision、matchedRuleId、reasonCode。
- trace 记录 evaluated facts 的脱敏摘要。
- default decision used 可见。
- deny trace 中 `secretResolutionAllowed=false`。
- trace 不包含 input 原文、secret-like value 或 token。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T250 P1：实现 policy explain CLI

- [ ] T250 P1：实现 policy explain CLI

目标：用户可以通过 CLI 理解某次调用为什么被允许、确认、拒绝或阻断。

涉及文件：

- `packages/cli/src/`
- `packages/runtime/src/policy*`
- `docs/设计/cli-contract-v1.md`

验收标准：

- `opencap invoke <id> --dry-run --explain` 展示 effective decision summary。
- 输出包含 blocking gate、matched rule、reason code、policy revision。
- MCP 结果只暴露简短 reason code，不暴露完整内部 policy。
- explain 输出默认不显示敏感 input 原文。

验证：

```bash
pnpm --filter @opencap/cli test
pnpm --filter @opencap/runtime test
```

### T251 P1：实现 policy change audit/ledger

- [ ] T251 P1：实现 policy change audit/ledger

目标：policy 激活、回滚和覆盖都留下本地可查询记录。

涉及文件：

- `packages/runtime/src/policy-ledger*`
- `packages/cli/src/`
- `docs/运营/policy-lifecycle-and-change-control.md`

验收标准：

- 每次 policy activation 记录 revision、digest、from/to revision、reason。
- rollback 是重新激活旧 revision，不删除历史。
- failed activation 不覆盖当前 active policy。
- ledger 记录不包含 secret 或 input 原文。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T252 P1：实现 policy validate lint

- [ ] T252 P1：实现 policy validate lint

目标：在 policy 生效前发现语法错误、未知字段、未知 risk/decision 和危险规则。

涉及文件：

- `packages/runtime/src/policy-validator*`
- `packages/cli/src/`
- `docs/设计/policy-dsl-v1.md`

验收标准：

- 非法 decision/risk 返回结构化错误。
- 重复 rule id 返回 warning/error。
- 未命名高风险 allow rule 返回 finding。
- 输出包含文件路径、字段路径和 rule id。

验证：

```bash
pnpm --filter @opencap/runtime test
pnpm --filter @opencap/cli test
```

### T253 P1：实现 policy simulation/diff

- [ ] T253 P1：实现 policy simulation/diff

目标：策略变更生效前，能看到哪些场景从 ask/deny 变成 allow，哪些能力被收紧。

涉及文件：

- `packages/runtime/src/policy-simulation*`
- `packages/cli/src/`
- `docs/质量/policy-simulation-and-diff-v1.md`

验收标准：

- 支持 policyBefore/policyAfter + scenarios。
- 识别 `new_allow`、`ask_to_allow`、`deny_to_ask`、`data_egress_relaxed`。
- simulation report 不含 input 原文。
- unchanged policy 产生 empty diff。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T254 P1：实现 broad allow safety checks

- [ ] T254 P1：实现 broad allow safety checks

目标：防止高风险 broad allow 静默进入 active policy。

涉及文件：

- `packages/runtime/src/policy-validator*`
- `packages/runtime/src/policy-simulation*`

验收标准：

- `risk: write` + `decision: allow` 无 capability/resource 限定时产生 high finding。
- `external_send`、`destructive`、`financial` allow 缺少确认边界时阻断或高危告警。
- data class 为 `secret_like`、`pii`、`source_code` 时 broad egress allow 产生 error。
- findings 可被 policy activation 使用。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T255 P1：实现 policy override/breakglass controls

- [ ] T255 P1：实现 policy override/breakglass controls

目标：支持有限的本地临时 override，同时保证它不能变成无审计后门。

涉及文件：

- `packages/runtime/src/policy-override*`
- `packages/runtime/src/audit*`
- `docs/安全/policy-override-and-breakglass-v1.md`

验收标准：

- 支持 `allow_once`、`allow_until`、`deny_override`、`breakglass` 记录。
- expired override 不生效。
- breakglass 必须有 reason 和短过期时间。
- override 写入 policy trace 和 audit。
- override 不能覆盖 data egress deny、outbound private block、revoked/malicious block。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T256 P2：policy bundle manifest/signing RFC

- [ ] T256 P2：policy bundle manifest/signing RFC

目标：为未来本地 bundle、组织 bundle 和签名策略留下兼容路径，但不进入 V1 主路径。

涉及文件：

- `rfcs/`
- `docs/运营/policy-lifecycle-and-change-control.md`
- `docs/安全/signing-and-provenance-roadmap.md`

验收标准：

- RFC 定义 bundle digest、optional signature、activation record。
- 明确 failed activation 不覆盖当前 active policy。
- 明确 Cloud/org bundle 不能成为 OSS Runtime 启动依赖。

验证：

```bash
git diff --check
```

### T257 P1：policy simulation fixtures

- [ ] T257 P1：policy simulation fixtures

目标：建立一组稳定场景用于 policy simulation、broad allow 检查和 conformance。

涉及文件：

- `packages/runtime/test/fixtures/policies/`
- `packages/runtime/test/fixtures/policy-scenarios/`

验收标准：

- 覆盖 read_only、write、external_send、destructive、financial。
- 覆盖 pii、secret_like、source_code、internal_url。
- 覆盖 trust/lifecycle/advisory 事实。
- fixture 不包含真实 secret 或个人数据。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T258 P2：policy incident runbook

- [ ] T258 P2：policy incident runbook

目标：当用户误放开策略、能力被滥用或需要紧急阻断时，有可操作恢复流程。

涉及文件：

- `docs/运营/policy-incident-runbook.md`
- `docs/安全/policy-override-and-breakglass-v1.md`

验收标准：

- 包含 revoke override、activate deny policy、review audit、rollback policy 的步骤。
- 明确哪些场景允许 breakglass，哪些场景必须 deny。
- 与 capability advisory/revocation 流程相互引用。

验证：

```bash
git diff --check
```

### T259 P2：decision log export

- [ ] T259 P2：decision log export

目标：允许用户导出脱敏 policy trace 和 decision summary，用于本地复盘或组织审查。

涉及文件：

- `packages/cli/src/`
- `packages/runtime/src/audit*`

验收标准：

- 支持按 capability、time range、decision 筛选。
- export 不包含 input 原文、secret-like value 或 token。
- export 关联 invocation id、policy revision 和 trace id。

验证：

```bash
pnpm --filter @opencap/cli test
pnpm --filter @opencap/runtime test
```

### T260 P1：policy governance conformance tests

- [ ] T260 P1：policy governance conformance tests

目标：把 policy governance 的安全承诺转成一致性测试组。

涉及文件：

- `docs/质量/conformance-suite-v1.md`
- `packages/runtime/src/**/*.test.ts`

验收标准：

- 覆盖 decision trace。
- 覆盖 policy change audit。
- 覆盖 broad allow simulation。
- 覆盖 override/breakglass negative tests。
- 覆盖 audit redaction。

验证：

```bash
pnpm --filter @opencap/runtime test
```

### T261 P0：补齐 Policy Decision Trace、策略生命周期、策略模拟和 override/breakglass 体系

- [x] T261 P0：补齐 Policy Decision Trace、策略生命周期、策略模拟和 override/breakglass 体系

已完成：新增 Policy Decision Trace V1、Policy Lifecycle and Change Control、Policy Simulation and Diff V1、Policy Override and Breakglass V1、Policy Governance 调研，并新增 ADR 0050-0053。同步更新 SYSTEM、INDEX、DECISIONS、TASKS、RISKS、TESTING、追踪矩阵、README、CHANGELOG 和 HANDOFF。

验收标准：

- 每个 policy/gate decision 都有 redacted trace 设计。
- Policy 变更有 revision、digest、activation、rollback 和 change record 设计。
- Broad allow 和 ask/deny -> allow 有 simulation/diff 检查路径。
- Override/breakglass 不能绕过 audit、egress deny、outbound block、secret ordering 或 revoked block。
- 相关风险、任务、conformance 和 ADR 均进入文档体系。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T262 P0：重新梳理中文文档入口、索引和文档规范

- [x] T262 P0：重新梳理中文文档入口、索引和文档规范

已完成：新增 `docs/README.md` 作为中文文档中心，新增 `docs/社区/documentation-governance.md` 作为中文文档规范，重写 `docs/INDEX.md` 为维护者索引，收敛根 `README.md` 的超长文档清单，并中文化 GitHub issue/PR 模板、变更日志、AGENTS 和一批用户可见标题。

验收标准：

- 新人可以从 `docs/README.md` 进入文档，不需要在文件树里盲找。
- `docs/INDEX.md` 只承担维护者索引职责，不再堆全部文档流水账。
- README 只保留关键入口，不再复制完整文档目录。
- 文档默认中文，技术专有名词保留规则写入规范。
- GitHub 模板和显眼文档标题中文化。

验证：

```bash
git diff --check
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T263 P0：整理 docs 根目录文件并归位参考、教程、规范和模板

- [x] T263 P0：整理 docs 根目录文件并归位参考、教程、规范和模板

已完成：将散落在 `docs/` 根目录的普通文档移动到对应目录：介绍进入 `docs/概览/`，快速开始进入 `docs/教程/`，能力清单进入 `docs/规范/`，权限和安全模型进入 `docs/安全/`，运行时架构进入 `docs/设计/`，Registry 指南和中文文档规范进入 `docs/社区/`，任务模板进入 `docs/规划/`。同步更新全仓引用、文档中心、维护者索引和交接文档。

验收标准：

- `docs/` 根目录只保留核心入口、状态和治理文件。
- 被移动文档的全仓引用已更新。
- 文档中心和维护者索引反映新的目录职责。
- 自动化仍能找到 `docs/TASKS.md`、`docs/HANDOFF.md`、`docs/TESTING.md` 等核心文件。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T264 P0：中文化 docs 子目录结构并同步全仓链接

- [x] T264 P0：中文化 docs 子目录结构并同步全仓链接

已完成：将 `docs/community`、`docs/design`、`docs/security`、`docs/research` 等英文子目录统一迁移为 `docs/社区/`、`docs/设计/`、`docs/安全/`、`docs/调研/` 等中文目录；同步更新 README、AGENTS、GitHub 模板、文档入口、维护者索引、任务表、追踪矩阵和各设计/调研文档中的相对链接。真实工程路径仍保持 `packages/spec` 等代码目录名，避免破坏构建和工具链。

验收标准：

- `docs/` 下一层目录全部使用中文业务分类。
- 全仓不再引用旧的英文文档子目录路径。
- 文档中心、维护者索引和中文文档规范说明新的目录职责。
- 工程代码路径没有被文档目录中文化误改。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T265 P0：补齐整体系统设计 V1

- [x] T265 P0：补齐整体系统设计 V1

已完成：新增 `docs/设计/整体系统设计-v1.md`，把 OpenCap 的总体架构收敛为标准面、控制面、执行面、信任面和互操作面五个平面，并明确能力供应链、调用执行链、证据反馈链、Runtime Kernel、四种账本、四张卡片、执行前门禁顺序和分阶段生态闭环。同步更新文档中心、维护者索引、体系蓝图、架构总览、产品规格、追踪矩阵、变更日志和交接记录。

验收标准：

- 整体设计能解释 OpenCap 为什么不是 Agent、Marketplace 或单纯 MCP 聚合器。
- Runtime Kernel 与 MCP/A2A/Apps SDK/OpenAPI adapter 的边界清晰。
- 设计能把现有安全、策略、审计、Registry、互操作和质量文档串起来。
- 下一步实现入口仍保持 T001，不因新增设计改变 V1 主路径。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T266 P0：完成整体设计二次审查和工程补强任务拆解

- [x] T266 P0：完成整体设计二次审查和工程补强任务拆解

已完成：新增 `docs/评审/整体设计二次审查-2026-05-08.md`，从工程闭环角度复盘整体设计，明确 Runtime Kernel public contract、Gate 抽象、Ledger、Card、Profile evidence、Registry sync、Capability identity、Provenance、Authoring loop 和 Release maturity gates 十个补强方向。同步新增 T267-T276 后续任务，并更新文档中心、维护者索引、体系蓝图、追踪矩阵、变更日志和交接记录。

验收标准：

- 二次审查不新增产品范围，而是把现有整体设计压实为工程对象和验收问题。
- 每个主要缺口都有建议产物和对应任务编号。
- 下一步实现入口仍保持 T001，架构补强任务作为并行契约工作推进。
- 外部标准参考只作为边界校准，不把 OpenCap 绑定到单一协议或平台。

验证：

```bash
git diff --check
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/check_docs.py .
python3 /Users/kimi/.codex/skills/continuous-doc-dev/scripts/audit_docs.py .
node -e "for (const f of ['package.json','tsconfig.base.json','packages/spec/package.json','packages/spec/schema/manifest.schema.json','packages/cli/package.json','packages/runtime/package.json','packages/mcp/package.json','packages/sdk-js/package.json','apps/console/package.json','apps/registry-web/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
ruby -e "require 'yaml'; Dir['**/*.yml','.github/**/*.yml','.github/**/*.yaml'].each { |f| YAML.load_file(f) }; puts 'yaml ok'"
```

### T277 P0：创建项目 conda 开发环境

- [x] T277 P0：创建项目 conda 开发环境

已完成：创建 `ai-capability-runtime` conda 环境，路径为 `/opt/anaconda3/envs/ai-capability-runtime`，包含 Python 3.11、Node.js 22 和 pnpm 9.15。新增 `environment.yml` 和 `docs/教程/开发环境.md`，安装 pnpm workspace 依赖并生成 `pnpm-lock.yaml`，同步 README、文档中心、验证策略和交接记录。

验收标准：

- `conda env list` 能看到 `ai-capability-runtime`。
- 环境内 Python、Node.js、pnpm 版本可查询。
- 仓库包含可复现的 `environment.yml`。
- 仓库包含 `pnpm-lock.yaml`。
- 文档说明如何激活环境和安装依赖。

验证：

```bash
/opt/anaconda3/envs/ai-capability-runtime/bin/python --version
/opt/anaconda3/envs/ai-capability-runtime/bin/node --version
/opt/anaconda3/envs/ai-capability-runtime/bin/pnpm --version
pnpm build
pnpm test
```
