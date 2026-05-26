export type CredentialLifecycleRunbookLintRule =
  | "missing_env_only_model"
  | "missing_policy_consent_order"
  | "missing_no_secret_storage"
  | "missing_rotation_without_manifest_change"
  | "missing_missing_env_error"
  | "missing_external_401_distinction"
  | "missing_audit_redaction"
  | "missing_list_redaction";

export interface CredentialLifecycleRunbookFinding {
  rule: CredentialLifecycleRunbookLintRule;
  severity: "error";
  message: string;
}

interface CredentialLifecycleRunbookRequirement {
  rule: CredentialLifecycleRunbookLintRule;
  message: string;
  patterns: RegExp[];
}

const REQUIREMENTS: CredentialLifecycleRunbookRequirement[] = [
  {
    rule: "missing_env_only_model",
    message: "Credential lifecycle runbooks must state that V1 credentials come from local environment variables.",
    patterns: [/manifest\s*只声明\s*env var\s*名称/i, /本地环境中提供凭据/],
  },
  {
    rule: "missing_policy_consent_order",
    message: "Credential lifecycle runbooks must state that Secret Resolver runs after validation, policy, consent, and outbound gates.",
    patterns: [/policy\s*允许/i, /ask\s*已确认/i, /outbound policy\s*允许目标域名/i, /Secret Resolver\s*能找到声明\s*env var/i],
  },
  {
    rule: "missing_no_secret_storage",
    message: "Credential lifecycle runbooks must forbid storing secret values in OpenCap files or inputs.",
    patterns: [/V1\s*不存储\s*secret/i, /把\s*token\s*写进\s*manifest/, /MCP Host\s*通过\s*tool input\s*传\s*token/],
  },
  {
    rule: "missing_rotation_without_manifest_change",
    message: "Credential lifecycle runbooks must explain that token rotation can update the env value without changing the manifest.",
    patterns: [/相同\s*env var\s*更新本地环境/i, /dry-run\s*确认\s*auth\s*配置仍然匹配/i],
  },
  {
    rule: "missing_missing_env_error",
    message: "Credential lifecycle runbooks must require clear missing env errors.",
    patterns: [/缺少\s*env var\s*时错误清楚/, /secret missing/i],
  },
  {
    rule: "missing_external_401_distinction",
    message: "Credential lifecycle runbooks must require audit distinction between missing secrets and external 401s.",
    patterns: [/区分\s*secret missing\s*和\s*external 401/i, /认证失败/],
  },
  {
    rule: "missing_audit_redaction",
    message: "Credential lifecycle runbooks must require audit logs to record credential references, not values.",
    patterns: [/Audit records reference, not value/i, /audit log\s*记录失败类别，不记录\s*token/i],
  },
  {
    rule: "missing_list_redaction",
    message: "Credential lifecycle runbooks must require capability list or Console views not to show credential values.",
    patterns: [/capability list\s*不显示凭据值/i, /Console 不能展示/i, /secret 原文/],
  },
];

export function lintCredentialLifecycleRunbook(markdown: string): CredentialLifecycleRunbookFinding[] {
  return REQUIREMENTS
    .filter((requirement) => !requirement.patterns.some((pattern) => pattern.test(markdown)))
    .map((requirement) => ({
      rule: requirement.rule,
      severity: "error",
      message: requirement.message,
    }));
}
