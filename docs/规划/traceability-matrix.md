# 需求-任务-测试追踪矩阵

本文把 V1 需求、开发任务和验证方式连起来，避免“做了任务但不知道满足了哪个需求”。

## 功能需求追踪

| 需求 | 来源 | 任务 | 验证 | 状态 |
| --- | --- | --- | --- | --- |
| F1 Manifest 校验 | `docs/SPEC.md` | T001, T002, T003 | `pnpm validate`, spec tests | 未完成 |
| F2 Capability 安装 | `docs/SPEC.md` | T010, T011, T020 | install smoke | 未完成 |
| F3 Capability 列表 | `docs/SPEC.md` | T012, T020 | list smoke | 未完成 |
| F4 策略评估 | `docs/SPEC.md` | T030, T031, T032, T033 | policy unit tests | 未完成 |
| F5 确认处理 | `docs/SPEC.md`, ADR 0004 | T032, T073 | CLI/MCP ask tests | 未完成 |
| F6 HTTP 执行 | `docs/SPEC.md` | T050, T051, T052, T053, T054, T055 | invoke dry-run + HTTP tests | 未完成 |
| F7 审计日志 | `docs/SPEC.md` | T040, T041, T042, T043 | log unit tests + smoke | 未完成 |
| F8 MCP Bridge | `docs/SPEC.md`, RFC 0003 | T021, T070, T071, T072, T073, T074 | MCP integration tests | 未完成 |

## 非功能需求追踪

| 非功能需求 | 任务 | 验证 | 状态 |
| --- | --- | --- | --- |
| 本地优先 | T010, T011, T020 | 临时 state dir tests | 未完成 |
| 默认权限约束 | T030, T031, T032 | policy tests | 未完成 |
| 可审计 | T040, T041, T042 | audit tests | 未完成 |
| 不泄露密钥 | T041, T090, T092 | redaction tests | 未完成 |
| MCP 协议不被污染 | T070, T071, T072, T073 | MCP STDIO tests | 未完成 |
| 可贡献 Registry | T004, T080, T081, T082 | CI + docs review | 未完成 |
| 可持续开发 | T110, T111 | check_docs.py | 已完成 |

## P0 技术审查项追踪

| 审查问题 | 决策/任务 | 当前处理 |
| --- | --- | --- |
| MCP STDIO 不能终端 prompt | ADR 0004, T032, T073 | 已决策，未实现 |
| V1 schema 半支持 mcp/local | ADR 0005, T002/T003 | schema 已收敛，测试未补齐 |
| URL 模板风险 | T050, T055, T091 | 未实现 |
| 审计脱敏太抽象 | T041, T092 | 未实现 |
| install 解析规则不明确 | T011 | 已写入任务，未实现 |
| tool name 冲突 | T021, T071 | 未实现 |

## 里程碑追踪

| 里程碑 | 覆盖需求 | 必须完成任务 |
| --- | --- | --- |
| M1 Manifest Validation | F1 | T001-T004 |
| M2 Local Install/List | F2, F3 | T010-T012, T020, T022 |
| M3 Policy + Audit | F4, F5, F7 | T030-T033, T040-T042 |
| M4 HTTP Invoke | F6 | T050-T055, T060-T062 |
| M5 MCP Bridge | F8 | T021, T070-T074 |
| M6 GitHub Demo | F1-F8 | M1-M5 全部完成 |

## 体系化补充追踪

| 需求 | 说明 | 文档 | 任务 | 验证 |
| --- | --- | --- | --- | --- |
| RQ-012 | Capability 生命周期可治理 | `docs/产品/capability-lifecycle.md` | T117, T125 | `check_docs.py`，后续 CLI list 测试 |
| RQ-013 | 协议边界清晰 | `docs/协议/protocol-positioning.md` | T117, T127 | 文档审查，后续 Host matrix |
| RQ-014 | Runtime 契约清晰 | `docs/设计/runtime-contracts.md` | T117, T124 | 类型和单元测试 |
| RQ-015 | 安全威胁可追踪 | `docs/安全/threat-model.md` | T093, T128 | abuse-case smoke tests |
| RQ-016 | 发布质量可门禁 | `docs/运营/release-readiness.md` | T117, T126 | release checklist |

| RQ-017 | HTTP body/auth 可执行 | `docs/设计/http-execution-v1.md` | T053, T130, T131 | schema + executor tests |
| RQ-018 | Policy DSL 格式稳定 | `docs/设计/policy-dsl-v1.md` | T030, T031 | parser/engine tests |
| RQ-019 | 审计失败策略明确 | `docs/设计/audit-log-v1.md` | T040, T132 | audit preflight tests |
| RQ-020 | 出站网络受控 | `docs/安全/outbound-policy-v1.md` | T055, T091, T133 | outbound policy tests |
| RQ-021 | Registry tests 可验证 | `docs/设计/registry-test-format-v1.md` | T004, T080 | registry test schema |

| RQ-022 | CLI 行为稳定 | `docs/设计/cli-contract-v1.md` | T013, T134 | CLI snapshot/exit tests |
| RQ-023 | 本地状态可测试可删除 | `docs/设计/local-state-v1.md` | T010, T014, T135 | state dir precedence tests |
| RQ-024 | MCP Bridge 行为稳定 | `docs/设计/mcp-interface-v1.md` | T070-T073, T136 | MCP mapping tests |
| RQ-025 | 错误模型统一 | `docs/设计/error-model-v1.md` | T013, T137 | error mapping tests |
| RQ-026 | 隐私保留规则明确 | `docs/安全/privacy-retention-v1.md` | T041, T092, T138 | redaction/log tests |
| RQ-027 | CI 安全基线明确 | `docs/运营/ci-security-baseline.md` | T101, T139 | GitHub Actions checks |

| RQ-028 | Capability 分类清晰 | `docs/生态/capability-taxonomy.md` | T140 | registry docs review |
| RQ-029 | Host 兼容性可追踪 | `docs/生态/host-compatibility-matrix.md` | T127, T142 | host test records |
| RQ-030 | 贡献路径清晰 | `docs/社区/contributor-journey.md` | T141 | PR template/checklist |
| RQ-031 | RFC 治理清晰 | `docs/社区/rfc-process.md` | T144 | RFC template |
| RQ-032 | 可观测性边界清晰 | `docs/运营/observability-metrics-v1.md` | T143 | audit-derived metrics |
| RQ-033 | OSS/Cloud 边界清晰 | `docs/生态/open-core-boundary.md` | T120 | ADR 0017 |

| RQ-034 | 版本兼容策略明确 | `docs/规范/versioning-and-compatibility.md` | T122, T149 | CHANGELOG/release checks |
| RQ-035 | Manifest 演进可迁移 | `docs/规范/manifest-evolution.md` | T149 | schema migration review |
| RQ-036 | Registry 分发可追溯 | `docs/生态/registry-distribution.md` | T147 | registry index RFC |
| RQ-037 | SDK/Adapter 不污染 V1 主路径 | `docs/设计/sdk-and-adapter-boundary.md` | T145, T146 | RFC/ADR review |
| RQ-038 | 包发布供应链清晰 | `docs/运营/package-publishing-v1.md` | T123, T148 | trusted publishing workflow |
| RQ-039 | 质量门禁可执行 | `docs/质量/quality-gates.md` | T126 | release checklist |
| RQ-040 | Capability package 结构稳定 | `docs/设计/capability-package-v1.md` | T151, T158 | package lint + trust card review |
| RQ-041 | 用户确认可审计 | `docs/设计/confirmation-and-consent-v1.md` | T152, T073 | consent receipt + confirmation_required tests |
| RQ-042 | 互操作声明可证明 | `docs/生态/interoperability-profiles.md` | T154, T156, T157 | host evidence records |
| RQ-043 | 一致性测试成体系 | `docs/质量/conformance-suite-v1.md` | T153 | conformance record checks |
| RQ-044 | Agentic 风险转控制和测试 | `docs/安全/agentic-risk-mapping.md` | T128, T155 | abuse-case smoke tests |
| RQ-045 | 身份授权边界清晰 | `docs/安全/identity-and-auth-model.md` | T090, T159, T163 | auth boundary negative tests |
| RQ-046 | Secret Resolver 行为稳定 | `docs/设计/secret-resolver-v1.md` | T159, T164 | resolver ordering + redaction tests |
| RQ-047 | 凭据生命周期可操作 | `docs/运营/credential-lifecycle.md` | T162, T165 | runbook smoke + README review |
| RQ-048 | 最小权限评审可执行 | `docs/安全/least-privilege-review.md` | T161, T165 | registry lint/review checklist |
| RQ-049 | 远程 OAuth 不污染 V1 | `docs/生态/oauth-and-remote-runtime-boundary.md` | T163 | RFC/ADR review |
| RQ-050 | 执行语义稳定 | `docs/设计/execution-semantics-v1.md` | T167, T168 | outcome/audit tests |
| RQ-051 | 重试与幂等受控 | `docs/设计/retry-and-idempotency-v1.md` | T169, T170 | retry/idempotency tests |
| RQ-052 | 失败恢复可操作 | `docs/运营/failure-recovery-runbook.md` | T171, T172 | recovery smoke/reconcile review |
| RQ-053 | 执行证据可证明 | `docs/质量/execution-evidence-v1.md` | T173 | conformance evidence record |
| RQ-054 | 组合边界清晰 | `docs/设计/composition-boundary-v1.md` | T176, T177 | composition profile review |
| RQ-055 | 能力图可表达关系和风险 | `docs/生态/capability-graph-v1.md` | T179, T180, T181 | graph metadata/review tests |
| RQ-056 | 多步执行不掩盖单步证据 | `docs/设计/multi-step-execution-boundary.md` | T175, T178 | evidence chain tests |
| RQ-057 | 组合失败恢复可操作 | `docs/运营/composition-failure-runbook.md` | T182, T183 | recovery smoke tests |
| RQ-058 | Trust level 可解释且不覆盖 policy | `docs/生态/trust-model-v1.md` | T185, T196 | trust/policy negative tests |
| RQ-059 | Capability advisory 可追踪 | `docs/安全/capability-advisory-process.md` | T187, T189, T190 | advisory schema/checks |
| RQ-060 | Deprecated/yanked/revoked 生命周期清晰 | `docs/生态/capability-deprecation-and-revocation.md` | T188, T191, T192, T193 | lifecycle warnings/search tests |
| RQ-061 | Quality Score 不被误用为安全认证 | `docs/质量/capability-quality-score.md` | T194, T195, T196 | score/policy tests |
| RQ-062 | Usage event 非账单语义清晰 | `docs/运营/usage-metering-v1.md` | T198, T205 | usage event/export tests |
| RQ-063 | 配额预算在执行前阻断 | `docs/设计/quota-and-budget-policy-v1.md` | T199, T204 | quota/budget gate tests |
| RQ-064 | 限流和滥用控制清晰 | `docs/安全/rate-limit-and-abuse-control-v1.md` | T200, T201, T206 | rate limit/problem details tests |
| RQ-065 | 商业交易不污染 V1 主路径 | `docs/生态/paid-capability-and-commerce-boundary.md` | T202, T203 | RFC/ADR review |
| RQ-066 | 用量证据可追溯到 audit | `docs/质量/usage-evidence-v1.md` | T207 | usage evidence conformance |
| RQ-067 | MCP tool projection 由 Runtime 控制 | `docs/设计/tool-projection-v1.md` | T209, T212, T213 | projection builder/hash tests |
| RQ-068 | 模型可见提示面受治理 | `docs/安全/prompt-surface-security-v1.md` | T210, T211, T217 | prompt-surface negative tests |
| RQ-069 | 发现和选择不等于授权 | `docs/生态/discovery-and-selection-boundary.md` | T214, T215 | discovery profile/selection evidence review |
| RQ-070 | 模型可见元数据可 lint | `docs/质量/model-visible-metadata-lint-v1.md` | T210, T216 | metadata lint + review checklist |
| RQ-071 | Runtime 输出边界稳定 | `docs/设计/result-envelope-v1.md` | T220, T222, T231 | result envelope tests |
| RQ-072 | Output schema 校验后才成功 | `docs/质量/output-validation-v1.md` | T221, T054 | output validation tests |
| RQ-073 | Tool result 不污染模型上下文 | `docs/安全/tool-result-sanitization-v1.md` | T223, T229 | result sanitizer negative tests |
| RQ-074 | 结果来源和转换可追踪 | `docs/质量/result-provenance-v1.md` | T224, T230 | provenance/taint tests |
| RQ-075 | 结果投递不依赖 Host 安全行为 | `docs/生态/result-delivery-boundary.md` | T226, T231 | Host result compatibility records |
| RQ-076 | Tool input 外发前受治理 | `docs/安全/input-data-governance-v1.md` | T234, T238 | input governance tests |
| RQ-077 | 敏感数据可分类 | `docs/安全/data-classification-v1.md` | T234, T235 | classification fixtures |
| RQ-078 | Data Egress Gate 在 secret 前阻断 | `docs/设计/data-egress-policy-v1.md` | T236, T237 | egress gate ordering tests |
| RQ-079 | 输入来源和字段外发可追踪 | `docs/质量/input-provenance-v1.md` | T239, T240, T241 | provenance/evidence tests |
| RQ-080 | Runtime 只外发必要字段 | `docs/安全/data-minimization-and-redaction-v1.md` | T242, T243, T244 | minimization/dry-run preview tests |
| RQ-081 | Policy decision 可解释可审计 | `docs/设计/policy-decision-trace-v1.md` | T249, T250, T259 | trace/explain/audit tests |
| RQ-082 | Policy 变更可版本化可回滚 | `docs/运营/policy-lifecycle-and-change-control.md` | T251, T252, T256 | policy ledger + validate tests |
| RQ-083 | 高风险 broad allow 上线前可发现 | `docs/质量/policy-simulation-and-diff-v1.md` | T253, T254, T260 | simulation/diff conformance |
| RQ-084 | Override 和 breakglass 不绕过硬边界 | `docs/安全/policy-override-and-breakglass-v1.md` | T255, T258, T260 | override/breakglass negative tests |
| RQ-085 | 整体设计能把标准、控制、执行、信任和互操作收敛为可执行模型 | `docs/设计/整体系统设计-v1.md` | T265 | 文档闭环检查 + 架构审查 |
| RQ-086 | 整体设计缺口可追踪到工程补强任务 | `docs/评审/整体设计二次审查-2026-05-08.md` | T266-T276 | 文档闭环检查 + 后续契约/测试 |
| RQ-087 | 体系化设计不脱离实现主路径 | `docs/RISKS.md`, `docs/TASKS.md` | T001, T268-T276 | T001 保持首位 + 文档闭环检查 |
| RQ-088 | Runtime Kernel 公共契约统一 CLI、MCP 和未来入口 | `docs/设计/runtime-kernel-contract-v1.md` | T267, T124, T145, T220, T268 | 类型导出、adapter 依赖检查、ResultEnvelope tests |
