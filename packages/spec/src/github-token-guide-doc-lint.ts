export type GithubFineGrainedTokenGuideLintRule =
  | "missing_official_sources"
  | "missing_fine_grained_pat_preference"
  | "missing_single_repository_scope"
  | "missing_issues_write_permission"
  | "missing_expiration_guidance"
  | "missing_org_approval_note"
  | "missing_env_only_setup"
  | "missing_rotation_and_revocation"
  | "missing_classic_token_warning";

export interface GithubFineGrainedTokenGuideFinding {
  rule: GithubFineGrainedTokenGuideLintRule;
  severity: "error";
  message: string;
}

interface GithubFineGrainedTokenGuideRequirement {
  rule: GithubFineGrainedTokenGuideLintRule;
  message: string;
  patterns: RegExp[];
}

const REQUIREMENTS: GithubFineGrainedTokenGuideRequirement[] = [
  {
    rule: "missing_official_sources",
    message: "GitHub token setup guide must link to official GitHub token and create-issue API docs.",
    patterns: [/docs\.github\.com\/en\/authentication\/keeping-your-account-and-data-secure\/managing-your-personal-access-tokens/, /docs\.github\.com\/en\/rest\/issues\/issues/],
  },
  {
    rule: "missing_fine_grained_pat_preference",
    message: "GitHub token setup guide must prefer fine-grained personal access tokens.",
    patterns: [/fine-grained personal access token/i, /fine-grained PAT/i, /优先使用\s*fine-grained/i],
  },
  {
    rule: "missing_single_repository_scope",
    message: "GitHub token setup guide must limit the token to the target repository.",
    patterns: [/Only select repositories/i, /只选择目标仓库/, /单个目标仓库/],
  },
  {
    rule: "missing_issues_write_permission",
    message: "GitHub token setup guide must require Issues repository permission with write access.",
    patterns: [/Issues.*write/i, /Issues.*写权限/, /issues:write/],
  },
  {
    rule: "missing_expiration_guidance",
    message: "GitHub token setup guide must require a short expiration and rotation date.",
    patterns: [/Expiration/i, /过期时间/, /轮换日期/],
  },
  {
    rule: "missing_org_approval_note",
    message: "GitHub token setup guide must mention organization approval or pending state.",
    patterns: [/pending/i, /组织.*审批/, /organization administrator/i],
  },
  {
    rule: "missing_env_only_setup",
    message: "GitHub token setup guide must keep the token in GITHUB_TOKEN and outside manifests, tests, and inputs.",
    patterns: [/export GITHUB_TOKEN=/, /manifest/, /tool input/, /tests/],
  },
  {
    rule: "missing_rotation_and_revocation",
    message: "GitHub token setup guide must explain rotation and revocation checks.",
    patterns: [/轮换/, /撤销/, /opencap invoke.*dry-run/],
  },
  {
    rule: "missing_classic_token_warning",
    message: "GitHub token setup guide must warn against classic tokens and broad repo/admin scopes.",
    patterns: [/classic token/i, /repo.*admin/i, /全仓库/, /admin/],
  },
];

export function lintGithubFineGrainedTokenGuide(markdown: string): GithubFineGrainedTokenGuideFinding[] {
  return REQUIREMENTS
    .filter((requirement) => !requirement.patterns.some((pattern) => pattern.test(markdown)))
    .map((requirement) => ({
      rule: requirement.rule,
      severity: "error",
      message: requirement.message,
    }));
}
