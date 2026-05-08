# Traceability Matrix：需求-任务-测试追踪矩阵

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
| RQ-012 | Capability 生命周期可治理 | `docs/product/capability-lifecycle.md` | T117, T125 | `check_docs.py`，后续 CLI list 测试 |
| RQ-013 | 协议边界清晰 | `docs/protocols/protocol-positioning.md` | T117, T127 | 文档审查，后续 Host matrix |
| RQ-014 | Runtime 契约清晰 | `docs/design/runtime-contracts.md` | T117, T124 | 类型和单元测试 |
| RQ-015 | 安全威胁可追踪 | `docs/security/threat-model.md` | T093, T128 | abuse-case smoke tests |
| RQ-016 | 发布质量可门禁 | `docs/operations/release-readiness.md` | T117, T126 | release checklist |

| RQ-017 | HTTP body/auth 可执行 | `docs/design/http-execution-v1.md` | T053, T130, T131 | schema + executor tests |
| RQ-018 | Policy DSL 格式稳定 | `docs/design/policy-dsl-v1.md` | T030, T031 | parser/engine tests |
| RQ-019 | 审计失败策略明确 | `docs/design/audit-log-v1.md` | T040, T132 | audit preflight tests |
| RQ-020 | 出站网络受控 | `docs/security/outbound-policy-v1.md` | T055, T091, T133 | outbound policy tests |
| RQ-021 | Registry tests 可验证 | `docs/design/registry-test-format-v1.md` | T004, T080 | registry test schema |

| RQ-022 | CLI 行为稳定 | `docs/design/cli-contract-v1.md` | T013, T134 | CLI snapshot/exit tests |
| RQ-023 | 本地状态可测试可删除 | `docs/design/local-state-v1.md` | T010, T014, T135 | state dir precedence tests |
| RQ-024 | MCP Bridge 行为稳定 | `docs/design/mcp-interface-v1.md` | T070-T073, T136 | MCP mapping tests |
| RQ-025 | 错误模型统一 | `docs/design/error-model-v1.md` | T013, T137 | error mapping tests |
| RQ-026 | 隐私保留规则明确 | `docs/security/privacy-retention-v1.md` | T041, T092, T138 | redaction/log tests |
| RQ-027 | CI 安全基线明确 | `docs/operations/ci-security-baseline.md` | T101, T139 | GitHub Actions checks |

| RQ-028 | Capability 分类清晰 | `docs/ecosystem/capability-taxonomy.md` | T140 | registry docs review |
| RQ-029 | Host 兼容性可追踪 | `docs/ecosystem/host-compatibility-matrix.md` | T127, T142 | host test records |
| RQ-030 | 贡献路径清晰 | `docs/community/contributor-journey.md` | T141 | PR template/checklist |
| RQ-031 | RFC 治理清晰 | `docs/community/rfc-process.md` | T144 | RFC template |
| RQ-032 | 可观测性边界清晰 | `docs/operations/observability-metrics-v1.md` | T143 | audit-derived metrics |
| RQ-033 | OSS/Cloud 边界清晰 | `docs/ecosystem/open-core-boundary.md` | T120 | ADR 0017 |

| RQ-034 | 版本兼容策略明确 | `docs/spec/versioning-and-compatibility.md` | T122, T149 | CHANGELOG/release checks |
| RQ-035 | Manifest 演进可迁移 | `docs/spec/manifest-evolution.md` | T149 | schema migration review |
| RQ-036 | Registry 分发可追溯 | `docs/ecosystem/registry-distribution.md` | T147 | registry index RFC |
| RQ-037 | SDK/Adapter 不污染 V1 主路径 | `docs/design/sdk-and-adapter-boundary.md` | T145, T146 | RFC/ADR review |
| RQ-038 | 包发布供应链清晰 | `docs/operations/package-publishing-v1.md` | T123, T148 | trusted publishing workflow |
| RQ-039 | 质量门禁可执行 | `docs/quality/quality-gates.md` | T126 | release checklist |
| RQ-040 | Capability package 结构稳定 | `docs/design/capability-package-v1.md` | T151, T158 | package lint + trust card review |
| RQ-041 | 用户确认可审计 | `docs/design/confirmation-and-consent-v1.md` | T152, T073 | consent receipt + confirmation_required tests |
| RQ-042 | 互操作声明可证明 | `docs/ecosystem/interoperability-profiles.md` | T154, T156, T157 | host evidence records |
| RQ-043 | 一致性测试成体系 | `docs/quality/conformance-suite-v1.md` | T153 | conformance record checks |
| RQ-044 | Agentic 风险转控制和测试 | `docs/security/agentic-risk-mapping.md` | T128, T155 | abuse-case smoke tests |
| RQ-045 | 身份授权边界清晰 | `docs/security/identity-and-auth-model.md` | T090, T159, T163 | auth boundary negative tests |
| RQ-046 | Secret Resolver 行为稳定 | `docs/design/secret-resolver-v1.md` | T159, T164 | resolver ordering + redaction tests |
| RQ-047 | 凭据生命周期可操作 | `docs/operations/credential-lifecycle.md` | T162, T165 | runbook smoke + README review |
| RQ-048 | 最小权限评审可执行 | `docs/security/least-privilege-review.md` | T161, T165 | registry lint/review checklist |
| RQ-049 | 远程 OAuth 不污染 V1 | `docs/ecosystem/oauth-and-remote-runtime-boundary.md` | T163 | RFC/ADR review |
| RQ-050 | 执行语义稳定 | `docs/design/execution-semantics-v1.md` | T167, T168 | outcome/audit tests |
| RQ-051 | 重试与幂等受控 | `docs/design/retry-and-idempotency-v1.md` | T169, T170 | retry/idempotency tests |
| RQ-052 | 失败恢复可操作 | `docs/operations/failure-recovery-runbook.md` | T171, T172 | recovery smoke/reconcile review |
| RQ-053 | 执行证据可证明 | `docs/quality/execution-evidence-v1.md` | T173 | conformance evidence record |
| RQ-054 | 组合边界清晰 | `docs/design/composition-boundary-v1.md` | T176, T177 | composition profile review |
| RQ-055 | 能力图可表达关系和风险 | `docs/ecosystem/capability-graph-v1.md` | T179, T180, T181 | graph metadata/review tests |
| RQ-056 | 多步执行不掩盖单步证据 | `docs/design/multi-step-execution-boundary.md` | T175, T178 | evidence chain tests |
| RQ-057 | 组合失败恢复可操作 | `docs/operations/composition-failure-runbook.md` | T182, T183 | recovery smoke tests |
| RQ-058 | Trust level 可解释且不覆盖 policy | `docs/ecosystem/trust-model-v1.md` | T185, T196 | trust/policy negative tests |
| RQ-059 | Capability advisory 可追踪 | `docs/security/capability-advisory-process.md` | T187, T189, T190 | advisory schema/checks |
| RQ-060 | Deprecated/yanked/revoked 生命周期清晰 | `docs/ecosystem/capability-deprecation-and-revocation.md` | T188, T191, T192, T193 | lifecycle warnings/search tests |
| RQ-061 | Quality Score 不被误用为安全认证 | `docs/quality/capability-quality-score.md` | T194, T195, T196 | score/policy tests |
| RQ-062 | Usage event 非账单语义清晰 | `docs/operations/usage-metering-v1.md` | T198, T205 | usage event/export tests |
| RQ-063 | 配额预算在执行前阻断 | `docs/design/quota-and-budget-policy-v1.md` | T199, T204 | quota/budget gate tests |
| RQ-064 | 限流和滥用控制清晰 | `docs/security/rate-limit-and-abuse-control-v1.md` | T200, T201, T206 | rate limit/problem details tests |
| RQ-065 | 商业交易不污染 V1 主路径 | `docs/ecosystem/paid-capability-and-commerce-boundary.md` | T202, T203 | RFC/ADR review |
| RQ-066 | 用量证据可追溯到 audit | `docs/quality/usage-evidence-v1.md` | T207 | usage evidence conformance |
