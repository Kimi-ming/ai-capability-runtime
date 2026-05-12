import { parse as parseYaml } from "yaml";

const POLICY_DECISIONS = ["allow", "ask", "deny"] as const;
const POLICY_RISKS = [
  "read_only",
  "write",
  "external_send",
  "destructive",
  "financial",
  "code_execution",
  "secret_access",
] as const;

type PolicyDecision = (typeof POLICY_DECISIONS)[number];
type PolicyRisk = (typeof POLICY_RISKS)[number];

export type PolicyValidationSeverity = "error" | "warning";

export type PolicyValidationFindingCode =
  | "POLICY_YAML_INVALID"
  | "POLICY_SCHEMA_INVALID"
  | "POLICY_FIELD_UNKNOWN"
  | "POLICY_DECISION_INVALID"
  | "POLICY_RISK_INVALID"
  | "POLICY_RULE_ID_DUPLICATE"
  | "POLICY_HIGH_RISK_ALLOW_UNNAMED"
  | "POLICY_BROAD_ALLOW_HIGH_RISK"
  | "POLICY_BROAD_ALLOW_REQUIRES_BOUNDARY";

export interface PolicyValidationFinding {
  severity: PolicyValidationSeverity;
  code: PolicyValidationFindingCode;
  message: string;
  filePath: string;
  fieldPath: string;
  ruleId?: string;
}

export interface PolicyValidationResult {
  ok: boolean;
  findings: PolicyValidationFinding[];
}

export interface PolicyValidationOptions {
  sourcePath?: string;
}

const ROOT_KEYS = new Set(["default", "rules"]);
const RULE_KEYS = new Set(["id", "match", "decision", "reason"]);
const MATCH_KEYS = new Set(["capability_id", "risk", "resource", "action", "channel", "host", "trust_level"]);
const DECISIONS = new Set<string>(POLICY_DECISIONS);
const RISKS = new Set<string>(POLICY_RISKS);
const HIGH_RISK_ALLOW = new Set<PolicyRisk>(["write", "external_send", "destructive", "financial", "code_execution", "secret_access"]);
const STRICT_BOUNDARY_ALLOW = new Set<PolicyRisk>(["external_send", "destructive", "financial"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finding(input: {
  severity: PolicyValidationSeverity;
  code: PolicyValidationFindingCode;
  message: string;
  filePath: string;
  fieldPath: string;
  ruleId?: string;
}): PolicyValidationFinding {
  return input;
}

function addUnknownFields(findings: PolicyValidationFinding[], record: Record<string, unknown>, allowed: Set<string>, filePath: string, fieldPath: string, ruleId?: string): void {
  for (const key of Object.keys(record)) {
    if (allowed.has(key)) {
      continue;
    }

    findings.push(finding({
      severity: "error",
      code: "POLICY_FIELD_UNKNOWN",
      message: `Unknown policy field: ${key}.`,
      filePath,
      fieldPath: `${fieldPath}/${key}`,
      ruleId,
    }));
  }
}

function hasStringField(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string" && record[key].trim().length > 0;
}

function addBroadAllowFindings(
  findings: PolicyValidationFinding[],
  rule: Record<string, unknown>,
  match: Record<string, unknown>,
  risk: PolicyRisk,
  filePath: string,
  fieldPath: string,
  ruleId?: string,
): void {
  if (rule.decision !== "allow") {
    return;
  }

  const hasCapability = hasStringField(match, "capability_id");
  const hasResource = hasStringField(match, "resource");
  const hasAction = hasStringField(match, "action");

  if (risk === "write" && !hasCapability && !hasResource) {
    findings.push(finding({
      severity: "warning",
      code: "POLICY_BROAD_ALLOW_HIGH_RISK",
      message: "Broad allow for write risk should be scoped by capability_id or resource before activation.",
      filePath,
      fieldPath,
      ruleId,
    }));
  }

  if (STRICT_BOUNDARY_ALLOW.has(risk) && (!hasCapability || !hasResource || !hasAction)) {
    findings.push(finding({
      severity: "error",
      code: "POLICY_BROAD_ALLOW_REQUIRES_BOUNDARY",
      message: `Allow rule for ${risk} must be scoped by capability_id, resource, and action.`,
      filePath,
      fieldPath,
      ruleId,
    }));
  }
}

function validateDecision(findings: PolicyValidationFinding[], value: unknown, filePath: string, fieldPath: string, ruleId?: string): value is PolicyDecision {
  if (typeof value === "string" && DECISIONS.has(value)) {
    return true;
  }

  findings.push(finding({
    severity: "error",
    code: "POLICY_DECISION_INVALID",
    message: `Policy decision must be one of: ${POLICY_DECISIONS.join(", ")}.`,
    filePath,
    fieldPath,
    ruleId,
  }));
  return false;
}

function validateRisk(findings: PolicyValidationFinding[], value: unknown, filePath: string, fieldPath: string, ruleId?: string): value is PolicyRisk {
  if (value === undefined) {
    return false;
  }

  if (typeof value === "string" && RISKS.has(value)) {
    return true;
  }

  findings.push(finding({
    severity: "error",
    code: "POLICY_RISK_INVALID",
    message: `Policy risk must be one of: ${POLICY_RISKS.join(", ")}.`,
    filePath,
    fieldPath,
    ruleId,
  }));
  return false;
}

function validateRule(findings: PolicyValidationFinding[], rule: unknown, index: number, filePath: string, seenRuleIds: Set<string>): void {
  const fieldPath = `/rules/${index}`;
  if (!isRecord(rule)) {
    findings.push(finding({
      severity: "error",
      code: "POLICY_SCHEMA_INVALID",
      message: "Policy rule must be an object.",
      filePath,
      fieldPath,
    }));
    return;
  }

  const ruleId = typeof rule.id === "string" && rule.id.trim().length > 0 ? rule.id : undefined;
  addUnknownFields(findings, rule, RULE_KEYS, filePath, fieldPath, ruleId);

  if (ruleId !== undefined) {
    if (seenRuleIds.has(ruleId)) {
      findings.push(finding({
        severity: "warning",
        code: "POLICY_RULE_ID_DUPLICATE",
        message: `Duplicate policy rule id: ${ruleId}.`,
        filePath,
        fieldPath: `${fieldPath}/id`,
        ruleId,
      }));
    }
    seenRuleIds.add(ruleId);
  }

  let risk: PolicyRisk | undefined;
  let match: Record<string, unknown> | undefined;
  if (isRecord(rule.match)) {
    match = rule.match;
    addUnknownFields(findings, rule.match, MATCH_KEYS, filePath, `${fieldPath}/match`, ruleId);
    if (validateRisk(findings, rule.match.risk, filePath, `${fieldPath}/match/risk`, ruleId)) {
      risk = rule.match.risk;
    }
  } else {
    findings.push(finding({
      severity: "error",
      code: "POLICY_SCHEMA_INVALID",
      message: "Policy rule match must be an object.",
      filePath,
      fieldPath: `${fieldPath}/match`,
      ruleId,
    }));
  }

  const decisionValid = validateDecision(findings, rule.decision, filePath, `${fieldPath}/decision`, ruleId);
  if (decisionValid && risk !== undefined && match !== undefined) {
    addBroadAllowFindings(findings, rule, match, risk, filePath, fieldPath, ruleId);
  }

  if (decisionValid && rule.decision === "allow" && ruleId === undefined && risk !== undefined && HIGH_RISK_ALLOW.has(risk)) {
    findings.push(finding({
      severity: "warning",
      code: "POLICY_HIGH_RISK_ALLOW_UNNAMED",
      message: `Unnamed allow rule covers high-risk permission: ${risk}.`,
      filePath,
      fieldPath,
    }));
  }
}

export function validatePolicyYml(raw: string, options: PolicyValidationOptions = {}): PolicyValidationResult {
  const filePath = options.sourcePath ?? "policies.yml";
  const findings: PolicyValidationFinding[] = [];
  let parsed: unknown;

  try {
    parsed = parseYaml(raw);
  } catch (error) {
    findings.push(finding({
      severity: "error",
      code: "POLICY_YAML_INVALID",
      message: `Policy YAML is invalid: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      fieldPath: "/",
    }));
    return { ok: false, findings };
  }

  if (!isRecord(parsed)) {
    findings.push(finding({
      severity: "error",
      code: "POLICY_SCHEMA_INVALID",
      message: "Policy document must be an object.",
      filePath,
      fieldPath: "/",
    }));
    return { ok: false, findings };
  }

  addUnknownFields(findings, parsed, ROOT_KEYS, filePath, "");
  validateDecision(findings, parsed.default, filePath, "/default");

  if (parsed.rules !== undefined && !Array.isArray(parsed.rules)) {
    findings.push(finding({
      severity: "error",
      code: "POLICY_SCHEMA_INVALID",
      message: "Policy rules must be an array.",
      filePath,
      fieldPath: "/rules",
    }));
  }

  const seenRuleIds = new Set<string>();
  if (Array.isArray(parsed.rules)) {
    parsed.rules.forEach((rule, index) => validateRule(findings, rule, index, filePath, seenRuleIds));
  }

  return {
    ok: findings.every((item) => item.severity !== "error"),
    findings,
  };
}
