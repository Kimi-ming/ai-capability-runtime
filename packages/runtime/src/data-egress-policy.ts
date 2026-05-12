import { createHash } from "node:crypto";
import type { InputDataClass } from "./input-classifier.js";
import { POLICY_TRACE_VERSION, type PolicyDecisionTraceV1 } from "./policy-trace.js";

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
  id?: string;
  revision?: string;
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
  decisionTrace: PolicyDecisionTraceV1;
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
    id: "opencap.default_data_egress",
    revision: dataEgressPolicyRevision({ default: "allow", rules: DEFAULT_POLICY_RULES }),
    default: "allow",
    rules: DEFAULT_POLICY_RULES.map((rule) => ({
      ...rule,
      match: { ...rule.match },
    })),
  };
}


function stablePolicyJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stablePolicyJson).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stablePolicyJson(nested)}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function dataEgressPolicyRevision(policy: DataEgressPolicySet): string {
  return policy.revision ?? `sha256:${createHash("sha256").update(stablePolicyJson({ default: policy.default, rules: policy.rules })).digest("hex")}`;
}

function dataEgressEvaluatedFacts(context: DataEgressContext): string[] {
  return [
    `capability_id=${context.capabilityId}`,
    `provider=${context.provider}`,
    `target_origin=${context.targetOrigin}`,
    `resource=${context.resource}`,
    `action=${context.action}`,
    `risk=${context.risk}`,
    `data_classes=${context.dataClasses.join(",") || "none"}`,
    `rendered_fields=${context.renderedFields.map((field) => `${field.path}:${field.destination}:${field.dataClasses.join("+") || "none"}`).join("|") || "none"}`,
  ];
}

function dataEgressDecisionTrace(
  context: DataEgressContext,
  policy: DataEgressPolicySet,
  decision: DataEgressDecision,
  reasonCode: string,
  summary: string,
  matchedRuleId: string | undefined,
): PolicyDecisionTraceV1 {
  return {
    traceVersion: POLICY_TRACE_VERSION,
    policySetId: policy.id ?? "opencap.inline_data_egress",
    policyRevision: dataEgressPolicyRevision(policy),
    gate: "data_egress",
    decision,
    matchedRuleId,
    defaultDecisionUsed: matchedRuleId === undefined,
    evaluatedFacts: dataEgressEvaluatedFacts(context),
    reasonCode,
    humanReadableSummary: summary,
    secretResolutionAllowed: decisionAllowsSecretResolution(decision),
    executionAllowed: decisionAllowsExecution(decision),
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
    decisionTrace: dataEgressDecisionTrace(context, policy, finalDecision, finalReasonCode, finalSummary, finalMatchedRuleId),
  };
}
