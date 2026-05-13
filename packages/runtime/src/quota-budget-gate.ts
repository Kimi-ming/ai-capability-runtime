import { createGateDecision, type GateDecision, type GateDecisionKind } from "./domain.js";

export type QuotaBudgetDecision = "allow" | "warn" | "ask" | "deny";

export interface QuotaBudgetMatch {
  capabilityId?: string;
  risk?: string;
  trustLevel?: string;
}

export interface QuotaLimit {
  count: number;
  used: number;
  window: string;
}

export interface BudgetLimit {
  amount: number;
  spent: number;
  currency: string;
  window: string;
}

export interface QuotaRule {
  id: string;
  match: QuotaBudgetMatch;
  limit: QuotaLimit;
  decision: QuotaBudgetDecision;
}

export interface BudgetRule {
  id: string;
  match: QuotaBudgetMatch;
  limit: BudgetLimit;
  decision: QuotaBudgetDecision;
}

export interface QuotaBudgetContext {
  capabilityId: string;
  risk: string;
  trustLevel?: string;
  qualityScore?: number;
}

export interface QuotaBudgetPolicy {
  quotas?: QuotaRule[];
  budgets?: BudgetRule[];
}

export interface QuotaBudgetEvidence {
  quotaRuleId?: string;
  quotaDecision?: QuotaBudgetDecision;
  quotaWindow?: string;
  quotaRemaining?: number;
  budgetRuleId?: string;
  budgetDecision?: QuotaBudgetDecision;
  budgetWindow?: string;
  budgetRemaining?: number;
  budgetCurrency?: string;
}

function matches(match: QuotaBudgetMatch, context: QuotaBudgetContext): boolean {
  return (
    (match.capabilityId === undefined || match.capabilityId === context.capabilityId) &&
    (match.risk === undefined || match.risk === context.risk) &&
    (match.trustLevel === undefined || match.trustLevel === context.trustLevel)
  );
}

function gateDecisionKind(decision: QuotaBudgetDecision): GateDecisionKind {
  if (decision === "deny") {
    return "deny";
  }

  if (decision === "ask") {
    return "ask";
  }

  return "allow";
}

function quotaGate(rule: QuotaRule): GateDecision<QuotaBudgetEvidence> {
  const remaining = Math.max(0, rule.limit.count - rule.limit.used);
  const decision = gateDecisionKind(rule.decision);

  return createGateDecision({
    gateId: "quota",
    stage: "pre_secret",
    decision,
    reasonCode: `QUOTA_${rule.decision.toUpperCase()}`,
    summary: `Quota rule ${rule.id} returned ${rule.decision}.`,
    evidence: {
      quotaRuleId: rule.id,
      quotaDecision: rule.decision,
      quotaWindow: rule.limit.window,
      quotaRemaining: remaining,
    },
  });
}

function budgetGate(rule: BudgetRule): GateDecision<QuotaBudgetEvidence> {
  const remaining = Math.max(0, rule.limit.amount - rule.limit.spent);
  const decision = gateDecisionKind(rule.decision);

  return createGateDecision({
    gateId: "budget",
    stage: "pre_secret",
    decision,
    reasonCode: `BUDGET_${rule.decision.toUpperCase()}`,
    summary: `Budget rule ${rule.id} returned ${rule.decision}.`,
    evidence: {
      budgetRuleId: rule.id,
      budgetDecision: rule.decision,
      budgetWindow: rule.limit.window,
      budgetRemaining: remaining,
      budgetCurrency: rule.limit.currency,
    },
  });
}

export function evaluateQuotaBudgetGate(
  context: QuotaBudgetContext,
  policy: QuotaBudgetPolicy,
): GateDecision<QuotaBudgetEvidence> {
  const budgetRule = policy.budgets?.find((rule) => matches(rule.match, context) && rule.limit.spent >= rule.limit.amount);
  if (budgetRule !== undefined) {
    return budgetGate(budgetRule);
  }

  const quotaRule = policy.quotas?.find((rule) => matches(rule.match, context) && rule.limit.used >= rule.limit.count);
  if (quotaRule !== undefined) {
    return quotaGate(quotaRule);
  }

  const quotaWarning = policy.quotas?.find((rule) => matches(rule.match, context) && rule.decision === "warn");
  if (quotaWarning !== undefined) {
    return quotaGate(quotaWarning);
  }

  return createGateDecision({
    gateId: "quota",
    stage: "pre_secret",
    decision: "allow",
    reasonCode: "QUOTA_BUDGET_ALLOW",
    summary: "No quota or budget rule blocked execution.",
    evidence: {},
  });
}
