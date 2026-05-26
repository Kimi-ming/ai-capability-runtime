export type SecurityPolicyDocLintRule =
  | "missing_private_vulnerability_reporting"
  | "missing_no_public_issue"
  | "missing_sensitive_material_boundary"
  | "missing_report_contents"
  | "missing_maintainer_triage_flow"
  | "missing_advisory_process_link"
  | "missing_enablement_note"
  | "missing_official_github_docs";

export interface SecurityPolicyDocFinding {
  rule: SecurityPolicyDocLintRule;
  severity: "error";
  message: string;
}

interface SecurityPolicyDocRequirement {
  rule: SecurityPolicyDocLintRule;
  message: string;
  patterns: RegExp[];
}

const REQUIREMENTS: SecurityPolicyDocRequirement[] = [
  {
    rule: "missing_private_vulnerability_reporting",
    message: "SECURITY.md must prefer GitHub private vulnerability reporting.",
    patterns: [/private vulnerability reporting/i, /Report a vulnerability/i, /私密报告/],
  },
  {
    rule: "missing_no_public_issue",
    message: "SECURITY.md must forbid public issues for undisclosed vulnerabilities.",
    patterns: [/不要在公开 issue/i, /不要.*公开 issue/i],
  },
  {
    rule: "missing_sensitive_material_boundary",
    message: "SECURITY.md must forbid posting secrets, exploit payloads, or unpublished vulnerability details publicly.",
    patterns: [/secret/i, /攻击 payload/i, /未公开漏洞细节/],
  },
  {
    rule: "missing_report_contents",
    message: "SECURITY.md must list the minimum information researchers should include.",
    patterns: [/受影响组件/, /复现步骤/, /影响范围/, /已知缓解/],
  },
  {
    rule: "missing_maintainer_triage_flow",
    message: "SECURITY.md must describe maintainer acknowledgement, triage, fix, and disclosure flow.",
    patterns: [/确认报告/, /triage/i, /修复/, /披露/],
  },
  {
    rule: "missing_advisory_process_link",
    message: "SECURITY.md must link capability advisory handling.",
    patterns: [/docs\/安全\/capability-advisory-process\.md/, /Capability Advisory/],
  },
  {
    rule: "missing_enablement_note",
    message: "SECURITY.md must tell maintainers how to enable/check private vulnerability reporting.",
    patterns: [/Settings.*Advanced Security/i, /Private vulnerability reporting/i, /安全政策链接/],
  },
  {
    rule: "missing_official_github_docs",
    message: "SECURITY.md must link official GitHub private vulnerability reporting docs.",
    patterns: [/docs\.github\.com\/en\/code-security\/security-advisories\/working-with-repository-security-advisories\/configuring-private-vulnerability-reporting-for-a-repository/],
  },
];

export function lintSecurityPolicyDoc(markdown: string): SecurityPolicyDocFinding[] {
  return REQUIREMENTS
    .filter((requirement) => !requirement.patterns.some((pattern) => pattern.test(markdown)))
    .map((requirement) => ({
      rule: requirement.rule,
      severity: "error",
      message: requirement.message,
    }));
}
