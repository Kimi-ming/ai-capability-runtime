import type { InputDataClass } from "./input-classifier.js";

export type DataEgressDecision = "allow" | "ask" | "deny" | "redact";
export type DataEgressDestination = "url" | "query" | "header" | "body";

export interface RenderedEgressField {
  path: string;
  destination: DataEgressDestination;
  dataClasses: InputDataClass[];
}

export interface DataEgressContext {
  capabilityId: string;
  provider: string;
  targetOrigin: string;
  resource: string;
  action: string;
  risk: string;
  inputHash: string;
  dataClasses: InputDataClass[];
  redactedPreview: unknown;
  renderedFields: RenderedEgressField[];
}

export interface DataEgressPolicyMatch {
  dataClass?: InputDataClass;
  provider?: string;
  targetOrigin?: string;
  risk?: string;
  destination?: DataEgressDestination;
}

export interface DataEgressPolicyRule {
  id?: string;
  match: DataEgressPolicyMatch;
  decision: DataEgressDecision;
  reasonCode?: string;
  summary?: string;
}

export interface DataEgressPolicySet {
  default: DataEgressDecision;
  rules: DataEgressPolicyRule[];
}

export interface DataEgressDecisionEvidence {
  capabilityId: string;
  provider: string;
  targetOrigin: string;
  resource: string;
  action: string;
  risk: string;
  inputHash: string;
  dataClasses: InputDataClass[];
  renderedFields: RenderedEgressField[];
  matchedFields: RenderedEgressField[];
  redactedPreview: unknown;
}

export interface DataEgressDecisionResult {
  gateId: "data_egress";
  stage: "pre_secret";
  decision: DataEgressDecision;
  reasonCode: string;
  summary: string;
  matchedRuleId?: string;
  secretResolutionAllowed: boolean;
  executionAllowed: boolean;
  evidence: DataEgressDecisionEvidence;
}

const DEFAULT_POLICY_RULES: DataEgressPolicyRule[] = [
  {
    id: "deny-secret-like",
    match: { dataClass: "secret_like" },
    decision: "deny",
    reasonCode: "DATA_EGRESS_SECRET_LIKE_DENIED",
    summary: "secret_like data cannot be sent to external providers by default.",
  },
  {
    id: "deny-internal-url",
    match: { dataClass: "internal_url" },
    decision: "deny",
    reasonCode: "DATA_EGRESS_INTERNAL_URL_DENIED",
    summary: "internal_url data cannot be sent to external providers by default.",
  },
  {
    id: "ask-pii-external-send",
    match: { dataClass: "pii", risk: "external_send" },
    decision: "ask",
    reasonCode: "DATA_EGRESS_PII_EXTERNAL_SEND_ASK",
    summary: "pii sent through external_send requires confirmation.",
  },
  {
    id: "ask-source-code-external-send",
    match: { dataClass: "source_code", risk: "external_send" },
    decision: "ask",
    reasonCode: "DATA_EGRESS_SOURCE_CODE_EXTERNAL_SEND_ASK",
    summary: "source_code sent through external_send requires confirmation.",
  },
];

const DECISION_RANK: Record<DataEgressDecision, number> = {
  allow: 0,
  ask: 1,
  redact: 2,
  deny: 3,
};

export function defaultDataEgressPolicy(): DataEgressPolicySet {
  return {
    default: "allow",
    rules: DEFAULT_POLICY_RULES.map((rule) => ({
      ...rule,
      match: { ...rule.match },
    })),
  };
}

function dataClassesForRule(context: DataEgressContext, rule: DataEgressPolicyRule): InputDataClass[] {
  if (rule.match.dataClass !== undefined) {
    return context.dataClasses.includes(rule.match.dataClass) ? [rule.match.dataClass] : [];
  }

  return context.dataClasses;
}

function fieldMatches(rule: DataEgressPolicyRule, field: RenderedEgressField): boolean {
  if (rule.match.destination !== undefined && field.destination !== rule.match.destination) {
    return false;
  }

  if (rule.match.dataClass !== undefined && !field.dataClasses.includes(rule.match.dataClass)) {
    return false;
  }

  return true;
}

function ruleMatches(context: DataEgressContext, rule: DataEgressPolicyRule): boolean {
  if (rule.match.provider !== undefined && context.provider !== rule.match.provider) {
    return false;
  }

  if (rule.match.targetOrigin !== undefined && context.targetOrigin !== rule.match.targetOrigin) {
    return false;
  }

  if (rule.match.risk !== undefined && context.risk !== rule.match.risk) {
    return false;
  }

  if (rule.match.dataClass !== undefined && !context.dataClasses.includes(rule.match.dataClass)) {
    return false;
  }

  if (rule.match.destination !== undefined && !context.renderedFields.some((field) => fieldMatches(rule, field))) {
    return false;
  }

  return true;
}

function matchedFields(context: DataEgressContext, rule: DataEgressPolicyRule): RenderedEgressField[] {
  return context.renderedFields.filter((field) => fieldMatches(rule, field));
}

function defaultReasonCode(decision: DataEgressDecision): string {
  return `DATA_EGRESS_${decision.toUpperCase()}`;
}

function defaultSummary(decision: DataEgressDecision): string {
  return `Data egress policy decided ${decision}.`;
}

function isStricterDecision(next: DataEgressDecision, current: DataEgressDecision): boolean {
  return DECISION_RANK[next] > DECISION_RANK[current];
}

function decisionAllowsSecretResolution(decision: DataEgressDecision): boolean {
  return decision !== "deny";
}

function decisionAllowsExecution(decision: DataEgressDecision): boolean {
  return decision === "allow";
}

export function evaluateDataEgressPolicy(
  context: DataEgressContext,
  policy: DataEgressPolicySet = defaultDataEgressPolicy(),
): DataEgressDecisionResult {
  let finalDecision = policy.default;
  let finalReasonCode = defaultReasonCode(policy.default);
  let finalSummary = defaultSummary(policy.default);
  let finalMatchedRuleId: string | undefined;
  let finalMatchedFields: RenderedEgressField[] = [];

  for (const rule of policy.rules) {
    if (!ruleMatches(context, rule)) {
      continue;
    }

    const ruleFields = matchedFields(context, rule);
    const ruleClasses = dataClassesForRule(context, rule);
    if (rule.match.dataClass !== undefined && ruleFields.length === 0 && ruleClasses.length === 0) {
      continue;
    }

    if (!isStricterDecision(rule.decision, finalDecision) && rule.decision !== finalDecision) {
      continue;
    }

    finalDecision = rule.decision;
    finalReasonCode = rule.reasonCode ?? defaultReasonCode(rule.decision);
    finalSummary = rule.summary ?? defaultSummary(rule.decision);
    finalMatchedRuleId = rule.id;
    finalMatchedFields = ruleFields;
  }

  return {
    gateId: "data_egress",
    stage: "pre_secret",
    decision: finalDecision,
    reasonCode: finalReasonCode,
    summary: finalSummary,
    matchedRuleId: finalMatchedRuleId,
    secretResolutionAllowed: decisionAllowsSecretResolution(finalDecision),
    executionAllowed: decisionAllowsExecution(finalDecision),
    evidence: {
      capabilityId: context.capabilityId,
      provider: context.provider,
      targetOrigin: context.targetOrigin,
      resource: context.resource,
      action: context.action,
      risk: context.risk,
      inputHash: context.inputHash,
      dataClasses: [...context.dataClasses],
      renderedFields: context.renderedFields.map((field) => ({
        path: field.path,
        destination: field.destination,
        dataClasses: [...field.dataClasses],
      })),
      matchedFields: finalMatchedFields.map((field) => ({
        path: field.path,
        destination: field.destination,
        dataClasses: [...field.dataClasses],
      })),
      redactedPreview: context.redactedPreview,
    },
  };
}
