import { describe, expect, it } from "vitest";
import { gateDecisionSemantics } from "./domain.js";
import { evaluateFinancialConsentSpendGate } from "./financial-consent-spend-gate.js";

describe("financial consent and spend cap gate", () => {
  it("requires explicit consent for financial risk before secret resolution or execution", () => {
    const decision = evaluateFinancialConsentSpendGate(
      {
        capabilityId: "payments.charge",
        risk: "financial",
        consentDecision: "unavailable",
        trustLevel: "official",
        qualityScore: 100,
      },
      { budgets: [] },
    );

    expect(decision).toMatchObject({
      gateId: "financial_consent",
      stage: "pre_secret",
      decision: "ask",
      reasonCode: "FINANCIAL_CONSENT_REQUIRED",
      evidence: {
        financialConsentRequired: true,
        financialConsentApproved: false,
        consentDecision: "unavailable",
      },
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      confirmationRequired: true,
      executionAllowed: false,
      terminalStatus: "confirmation_required",
    });
  });

  it("checks spend cap after consent and blocks over-budget financial calls", () => {
    const decision = evaluateFinancialConsentSpendGate(
      {
        capabilityId: "payments.charge",
        risk: "financial",
        consentDecision: "approved",
        trustLevel: "official",
        qualityScore: 100,
      },
      {
        budgets: [{
          id: "financial-daily",
          match: { risk: "financial" },
          limit: { amount: 50, spent: 50, currency: "USD", window: "1d" },
          decision: "deny",
        }],
      },
    );

    expect(decision).toMatchObject({
      gateId: "budget",
      stage: "pre_secret",
      decision: "deny",
      reasonCode: "BUDGET_DENY",
      evidence: {
        budgetRuleId: "financial-daily",
        budgetDecision: "deny",
        budgetWindow: "1d",
        budgetRemaining: 0,
        budgetCurrency: "USD",
        financialConsentRequired: true,
        financialConsentApproved: true,
        consentDecision: "approved",
      },
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      secretResolutionAllowed: false,
      executionAllowed: false,
      terminalStatus: "denied",
    });
  });

  it("keeps financial evidence free of payment inputs and secrets", () => {
    const decision = evaluateFinancialConsentSpendGate(
      {
        capabilityId: "payments.charge",
        risk: "financial",
        consentDecision: "approved",
        trustLevel: "tested",
        qualityScore: 95,
      },
      {
        budgets: [{
          id: "financial-daily",
          match: { risk: "financial" },
          limit: { amount: 100, spent: 20, currency: "USD", window: "1d" },
          decision: "warn",
        }],
      },
    );

    expect(decision).toMatchObject({
      decision: "allow",
      evidence: {
        financialConsentRequired: true,
        financialConsentApproved: true,
        budgetDecision: "warn",
        budgetRemaining: 80,
      },
    });
    expect(JSON.stringify(decision)).not.toContain("card_");
    expect(JSON.stringify(decision)).not.toContain("provider-secret");
    expect(JSON.stringify(decision)).not.toContain("raw input");
  });

  it("does not trigger financial consent for non-financial risk", () => {
    const decision = evaluateFinancialConsentSpendGate(
      {
        capabilityId: "github.search_repo",
        risk: "read_only",
      },
      { budgets: [] },
    );

    expect(decision).toMatchObject({
      gateId: "financial_consent",
      decision: "allow",
      reasonCode: "FINANCIAL_CONSENT_NOT_REQUIRED",
      evidence: {
        financialConsentRequired: false,
        financialConsentApproved: false,
      },
    });
  });
});
