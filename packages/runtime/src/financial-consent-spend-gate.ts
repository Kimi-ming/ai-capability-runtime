import { createGateDecision, type GateDecision } from "./domain.js";
import { evaluateQuotaBudgetGate, type QuotaBudgetEvidence, type QuotaBudgetPolicy } from "./quota-budget-gate.js";

export type FinancialConsentDecision = "approved" | "rejected" | "unavailable" | "expired";

export interface FinancialConsentSpendContext {
  capabilityId: string;
  risk: string;
  consentDecision?: FinancialConsentDecision;
  trustLevel?: string;
  qualityScore?: number;
}

export interface FinancialConsentSpendEvidence extends QuotaBudgetEvidence {
  financialConsentRequired: boolean;
  financialConsentApproved: boolean;
  consentDecision?: FinancialConsentDecision;
}

function consentEvidence(context: FinancialConsentSpendContext): FinancialConsentSpendEvidence {
  const financialConsentRequired = context.risk === "financial";
  return {
    financialConsentRequired,
    financialConsentApproved: financialConsentRequired && context.consentDecision === "approved",
    consentDecision: context.consentDecision,
  };
}

function mergeFinancialEvidence(
  decision: GateDecision<QuotaBudgetEvidence>,
  context: FinancialConsentSpendContext,
): GateDecision<FinancialConsentSpendEvidence> {
  return {
    ...decision,
    evidence: {
      ...decision.evidence,
      ...consentEvidence(context),
    },
  };
}

export function evaluateFinancialConsentSpendGate(
  context: FinancialConsentSpendContext,
  policy: QuotaBudgetPolicy,
): GateDecision<FinancialConsentSpendEvidence> {
  if (context.risk !== "financial") {
    return createGateDecision({
      gateId: "financial_consent",
      stage: "pre_secret",
      decision: "allow",
      reasonCode: "FINANCIAL_CONSENT_NOT_REQUIRED",
      summary: "Financial consent is not required for non-financial risk.",
      evidence: consentEvidence(context),
    });
  }

  if (context.consentDecision !== "approved") {
    return createGateDecision({
      gateId: "financial_consent",
      stage: "pre_secret",
      decision: "ask",
      reasonCode: "FINANCIAL_CONSENT_REQUIRED",
      summary: "Financial actions require explicit approved consent.",
      evidence: consentEvidence(context),
    });
  }

  const spendDecision = evaluateQuotaBudgetGate(
    {
      capabilityId: context.capabilityId,
      risk: context.risk,
      trustLevel: context.trustLevel,
      qualityScore: context.qualityScore,
    },
    policy,
  );

  return mergeFinancialEvidence(spendDecision, context);
}
