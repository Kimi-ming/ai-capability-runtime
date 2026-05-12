import { defaultPolicySet, evaluatePolicy, parsePolicyYml, type PolicyDecision, type PolicyEvaluationResult, type PolicyRisk, type PolicySet } from "./index.js";
import type { InputDataClass } from "./input-classifier.js";

export type PolicySimulationDiffCategory =
  | "new_allow"
  | "new_deny"
  | "ask_to_allow"
  | "deny_to_ask"
  | "data_egress_relaxed"
  | "financial_relaxed"
  | "broad_data_egress_allow";

export type PolicySimulationSeverity = "info" | "warning" | "error";

export interface PolicySimulationScenario {
  id: string;
  capabilityId: string;
  resource: string;
  action: string;
  risk: PolicyRisk;
  dataClasses?: InputDataClass[];
  targetOrigin?: string;
  expectedDecision?: PolicyDecision;
  inputPreview?: unknown;
}

export interface PolicySimulationInput {
  policyBefore?: string;
  policyAfter: string;
  capabilities?: string[];
  scenarios: PolicySimulationScenario[];
}

export interface PolicySimulationFinding {
  category: PolicySimulationDiffCategory;
  severity: PolicySimulationSeverity;
  code: string;
  message: string;
  scenarioId: string;
  capabilityId: string;
  risk: PolicyRisk;
  beforeDecision: PolicyDecision;
  afterDecision: PolicyDecision;
  dataClasses?: InputDataClass[];
  targetOrigin?: string;
}

export interface PolicySimulationReport {
  ok: boolean;
  findings: PolicySimulationFinding[];
}

const SENSITIVE_EGRESS_CLASSES = new Set<InputDataClass>([
  "secret_like",
  "pii",
  "source_code",
  "internal_url",
  "financial_data",
]);

function parseSimulationPolicy(raw: string | undefined, sourcePath: string): PolicySet {
  if (raw === undefined) {
    return defaultPolicySet(sourcePath);
  }

  return parsePolicyYml(raw, sourcePath);
}

function scenarioEvaluation(policy: PolicySet, scenario: PolicySimulationScenario): PolicyEvaluationResult {
  return evaluatePolicy(policy, {
    capabilityId: scenario.capabilityId,
    permissions: [{
      resource: scenario.resource,
      action: scenario.action,
      risk: scenario.risk,
    }],
  });
}

function sensitiveDataClasses(dataClasses: InputDataClass[] | undefined): InputDataClass[] {
  return [...new Set((dataClasses ?? []).filter((dataClass) => SENSITIVE_EGRESS_CLASSES.has(dataClass)))].sort();
}

function finding(input: Omit<PolicySimulationFinding, "code" | "message"> & { code: string; message: string }): PolicySimulationFinding {
  return input;
}

function addDecisionDiff(findings: PolicySimulationFinding[], scenario: PolicySimulationScenario, beforeDecision: PolicyDecision, afterDecision: PolicyDecision): void {
  if (beforeDecision === afterDecision) {
    return;
  }

  if (afterDecision === "allow" && beforeDecision === "ask") {
    findings.push(finding({
      category: "ask_to_allow",
      severity: scenario.risk === "destructive" || scenario.risk === "financial" ? "error" : "warning",
      code: "POLSIM_ASK_TO_ALLOW",
      message: `Policy change removes human confirmation for ${scenario.capabilityId}.`,
      scenarioId: scenario.id,
      capabilityId: scenario.capabilityId,
      risk: scenario.risk,
      beforeDecision,
      afterDecision,
      targetOrigin: scenario.targetOrigin,
    }));
    return;
  }

  if (afterDecision === "allow" && beforeDecision === "deny") {
    findings.push(finding({
      category: "new_allow",
      severity: scenario.risk === "destructive" || scenario.risk === "financial" ? "error" : "warning",
      code: "POLSIM_NEW_ALLOW",
      message: `Policy change allows a scenario that was previously denied: ${scenario.capabilityId}.`,
      scenarioId: scenario.id,
      capabilityId: scenario.capabilityId,
      risk: scenario.risk,
      beforeDecision,
      afterDecision,
      targetOrigin: scenario.targetOrigin,
    }));
    return;
  }

  if (beforeDecision === "deny" && afterDecision === "ask") {
    findings.push(finding({
      category: "deny_to_ask",
      severity: "warning",
      code: "POLSIM_DENY_TO_ASK",
      message: `Policy change turns a deny into human confirmation for ${scenario.capabilityId}.`,
      scenarioId: scenario.id,
      capabilityId: scenario.capabilityId,
      risk: scenario.risk,
      beforeDecision,
      afterDecision,
      targetOrigin: scenario.targetOrigin,
    }));
    return;
  }

  if (afterDecision === "deny" && beforeDecision !== "deny") {
    findings.push(finding({
      category: "new_deny",
      severity: "info",
      code: "POLSIM_NEW_DENY",
      message: `Policy change blocks a scenario that was previously ${beforeDecision}: ${scenario.capabilityId}.`,
      scenarioId: scenario.id,
      capabilityId: scenario.capabilityId,
      risk: scenario.risk,
      beforeDecision,
      afterDecision,
      targetOrigin: scenario.targetOrigin,
    }));
  }
}

function addEgressRelaxation(findings: PolicySimulationFinding[], scenario: PolicySimulationScenario, beforeDecision: PolicyDecision, afterDecision: PolicyDecision): void {
  if (afterDecision !== "allow" || beforeDecision === "allow") {
    return;
  }

  const dataClasses = sensitiveDataClasses(scenario.dataClasses);
  if (dataClasses.length === 0) {
    return;
  }

  findings.push(finding({
    category: "data_egress_relaxed",
    severity: "error",
    code: "POLSIM_DATA_EGRESS_RELAXED",
    message: `Policy change allows sensitive data egress for ${scenario.capabilityId}.`,
    scenarioId: scenario.id,
    capabilityId: scenario.capabilityId,
    risk: scenario.risk,
    beforeDecision,
    afterDecision,
    dataClasses,
    targetOrigin: scenario.targetOrigin,
  }));
}

function isBroadAllow(policy: PolicySet, evaluation: PolicyEvaluationResult): boolean {
  if (evaluation.decision !== "allow") {
    return false;
  }

  if (evaluation.matchedRuleIndex === undefined) {
    return policy.default === "allow";
  }

  const rule = policy.rules[evaluation.matchedRuleIndex];
  return rule.match.capabilityId === undefined || rule.match.resource === undefined || rule.match.action === undefined;
}

function addBroadDataEgressAllow(
  findings: PolicySimulationFinding[],
  scenario: PolicySimulationScenario,
  beforeDecision: PolicyDecision,
  afterDecision: PolicyDecision,
): void {
  if (afterDecision !== "allow") {
    return;
  }

  const dataClasses = sensitiveDataClasses(scenario.dataClasses).filter((dataClass) => dataClass === "secret_like" || dataClass === "pii" || dataClass === "source_code");
  if (dataClasses.length === 0) {
    return;
  }

  findings.push(finding({
    category: "broad_data_egress_allow",
    severity: "error",
    code: "POLSIM_BROAD_DATA_EGRESS_ALLOW",
    message: `Broad allow rule permits sensitive data egress for ${scenario.capabilityId}.`,
    scenarioId: scenario.id,
    capabilityId: scenario.capabilityId,
    risk: scenario.risk,
    beforeDecision,
    afterDecision,
    dataClasses,
    targetOrigin: scenario.targetOrigin,
  }));
}

function addFinancialRelaxation(findings: PolicySimulationFinding[], scenario: PolicySimulationScenario, beforeDecision: PolicyDecision, afterDecision: PolicyDecision): void {
  if (scenario.risk !== "financial" || afterDecision !== "allow" || beforeDecision === "allow") {
    return;
  }

  findings.push(finding({
    category: "financial_relaxed",
    severity: "error",
    code: "POLSIM_FINANCIAL_RELAXED",
    message: `Policy change allows a financial scenario that was previously ${beforeDecision}: ${scenario.capabilityId}.`,
    scenarioId: scenario.id,
    capabilityId: scenario.capabilityId,
    risk: scenario.risk,
    beforeDecision,
    afterDecision,
    dataClasses: scenario.dataClasses,
    targetOrigin: scenario.targetOrigin,
  }));
}

export function simulatePolicyDiff(input: PolicySimulationInput): PolicySimulationReport {
  const policyBefore = parseSimulationPolicy(input.policyBefore, "<policy-before>");
  const policyAfter = parseSimulationPolicy(input.policyAfter, "<policy-after>");
  const findings: PolicySimulationFinding[] = [];

  for (const scenario of input.scenarios) {
    const beforeEvaluation = scenarioEvaluation(policyBefore, scenario);
    const afterEvaluation = scenarioEvaluation(policyAfter, scenario);
    const beforeDecision = beforeEvaluation.decision;
    const afterDecision = afterEvaluation.decision;

    addDecisionDiff(findings, scenario, beforeDecision, afterDecision);
    addEgressRelaxation(findings, scenario, beforeDecision, afterDecision);
    if (isBroadAllow(policyAfter, afterEvaluation)) {
      addBroadDataEgressAllow(findings, scenario, beforeDecision, afterDecision);
    }
    addFinancialRelaxation(findings, scenario, beforeDecision, afterDecision);
  }

  return {
    ok: findings.every((item) => item.severity === "info"),
    findings,
  };
}
