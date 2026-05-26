export type PrivacyRetentionDocLintRule =
  | "missing_local_first_boundary"
  | "missing_no_remote_telemetry"
  | "missing_secret_redaction"
  | "missing_input_hash"
  | "missing_retention_policy"
  | "missing_manual_deletion"
  | "missing_host_log_boundary"
  | "missing_non_goals";

export interface PrivacyRetentionDocFinding {
  rule: PrivacyRetentionDocLintRule;
  severity: "error";
  message: string;
}

interface PrivacyRetentionRequirement {
  rule: PrivacyRetentionDocLintRule;
  message: string;
  patterns: RegExp[];
}

const REQUIREMENTS: PrivacyRetentionRequirement[] = [
  {
    rule: "missing_local_first_boundary",
    message: "Privacy retention docs must state that V1 data stays local and user-controlled.",
    patterns: [/本地优先/, /用户掌控\s*state dir/, /本地数据/],
  },
  {
    rule: "missing_no_remote_telemetry",
    message: "Privacy retention docs must state that V1 does not upload telemetry or remote audit logs by default.",
    patterns: [/不默认上传遥测/, /不上传遥测/, /不引入远程遥测/, /远程审计保留策略/],
  },
  {
    rule: "missing_secret_redaction",
    message: "Privacy retention docs must require secret and credential redaction.",
    patterns: [/不记录\s*secret\s*原文/i, /脱敏后写日志/, /Authorization header/],
  },
  {
    rule: "missing_input_hash",
    message: "Privacy retention docs must require input hashes instead of raw input as the durable correlation handle.",
    patterns: [/input_hash/, /input hash/i, /输入保存.*hash/],
  },
  {
    rule: "missing_retention_policy",
    message: "Privacy retention docs must define the V1 retention behavior and future retention_days shape.",
    patterns: [/V1\s*不自动删除日志/, /retention_days/],
  },
  {
    rule: "missing_manual_deletion",
    message: "Privacy retention docs must explain how users manually delete local state or audit logs.",
    patterns: [/rm -rf opencap\.local/, /删除\s*opencap\.local\/logs\.sqlite/, /删除\s*opencap\.local\//],
  },
  {
    rule: "missing_host_log_boundary",
    message: "Privacy retention docs must warn that OpenCap cannot control Host-side logs.",
    patterns: [/Host\s*可能记录\s*tool call arguments/, /OpenCap\s*不控制\s*Host\s*自己的日志/],
  },
  {
    rule: "missing_non_goals",
    message: "Privacy retention docs must list V1 non-goals for privacy retention scope.",
    patterns: [/##\s*非目标/, /V1\s*不实现/],
  },
];

export function lintPrivacyRetentionDoc(markdown: string): PrivacyRetentionDocFinding[] {
  return REQUIREMENTS
    .filter((requirement) => !requirement.patterns.some((pattern) => pattern.test(markdown)))
    .map((requirement) => ({
      rule: requirement.rule,
      severity: "error",
      message: requirement.message,
    }));
}
