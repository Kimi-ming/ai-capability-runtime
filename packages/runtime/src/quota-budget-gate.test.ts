import { describe, expect, it } from "vitest";
import { gateDecisionSemantics } from "./domain.js";
import { evaluateQuotaBudgetGate } from "./quota-budget-gate.js";

describe("quota and budget gate", () => {
  it("denies count-based quota before secret resolution or execution", () => {
    const decision = evaluateQuotaBudgetGate(
      {
        capabilityId: "github.create_issue",
        risk: "write",
      },
      {
        quotas: [{
          id: "github-issues-daily",
          match: { capabilityId: "github.create_issue" },
          limit: { count: 20, used: 20, window: "1d" },
          decision: "deny",
        }],
      },
    );

    expect(decision).toMatchObject({
      gateId: "quota",
      stage: "pre_secret",
      decision: "deny",
      reasonCode: "QUOTA_DENY",
      evidence: {
        quotaRuleId: "github-issues-daily",
        quotaDecision: "deny",
        quotaWindow: "1d",
        quotaRemaining: 0,
      },
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      secretResolutionAllowed: false,
      executionAllowed: false,
      terminalStatus: "denied",
    });
  });

  it("turns quota ask into a confirmation-required gate", () => {
    const decision = evaluateQuotaBudgetGate(
      {
        capabilityId: "slack.send_message",
        risk: "external_send",
      },
      {
        quotas: [{
          id: "slack-send-daily",
          match: { capabilityId: "slack.send_message" },
          limit: { count: 10, used: 10, window: "1d" },
          decision: "ask",
        }],
      },
    );

    expect(decision).toMatchObject({
      gateId: "quota",
      stage: "pre_secret",
      decision: "ask",
      reasonCode: "QUOTA_ASK",
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      confirmationRequired: true,
      executionAllowed: false,
      terminalStatus: "confirmation_required",
    });
  });

  it("does not let trust level or quality score bypass budget deny", () => {
    const decision = evaluateQuotaBudgetGate(
      {
        capabilityId: "payments.charge",
        risk: "financial",
        trustLevel: "verified",
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
        budgetCurrency: "USD",
      },
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      secretResolutionAllowed: false,
      executionAllowed: false,
    });
  });

  it("keeps quota evidence free of input, output, and secret values", () => {
    const decision = evaluateQuotaBudgetGate(
      {
        capabilityId: "github.create_issue",
        risk: "write",
        trustLevel: "tested",
        qualityScore: 91,
      },
      {
        quotas: [{
          id: "github-issues-daily",
          match: { capabilityId: "github.create_issue" },
          limit: { count: 20, used: 19, window: "1d" },
          decision: "warn",
        }],
      },
    );

    expect(decision).toMatchObject({
      decision: "allow",
      reasonCode: "QUOTA_WARN",
      evidence: {
        quotaDecision: "warn",
        quotaRemaining: 1,
      },
    });
    expect(JSON.stringify(decision)).not.toContain("provider-secret");
    expect(JSON.stringify(decision)).not.toContain("raw input");
    expect(JSON.stringify(decision)).not.toContain("raw output");
  });
});
