import { describe, expect, it } from "vitest";
import {
  createProblemDetailsFromProviderRateLimit,
  createProblemDetailsFromQuotaBudgetGate,
  evaluateQuotaBudgetGate,
} from "./index.js";

describe("problem details for quota and rate errors", () => {
  it("creates quota-exceeded problem details from quota deny evidence", () => {
    const gate = evaluateQuotaBudgetGate(
      { capabilityId: "github.create_issue", risk: "write" },
      {
        quotas: [{
          id: "github-issues-daily",
          match: { capabilityId: "github.create_issue" },
          limit: { count: 20, used: 20, window: "1d" },
          decision: "deny",
        }],
      },
    );

    const problem = createProblemDetailsFromQuotaBudgetGate({
      capabilityId: "github.create_issue",
      gate,
    });

    expect(problem).toEqual({
      type: "urn:opencap:problem:quota-exceeded",
      title: "Quota exceeded",
      status: 429,
      detail: "Quota rule github-issues-daily denied github.create_issue before secret resolution.",
      reasonCode: "QUOTA_DENY",
      capabilityId: "github.create_issue",
      gateId: "quota",
      policyId: "github-issues-daily",
      usageMetric: "invocation_count",
      usageLimit: 20,
      usageRemaining: 0,
      usageWindow: "1d",
      redactionProfile: "opencap.problem_details.v1",
    });
  });

  it("creates budget-exceeded problem details without changing policy semantics", () => {
    const gate = evaluateQuotaBudgetGate(
      { capabilityId: "payments.charge", risk: "financial", trustLevel: "verified", qualityScore: 100 },
      {
        budgets: [{
          id: "financial-daily",
          match: { risk: "financial" },
          limit: { amount: 50, spent: 50, currency: "USD", window: "1d" },
          decision: "deny",
        }],
      },
    );

    const problem = createProblemDetailsFromQuotaBudgetGate({
      capabilityId: "payments.charge",
      gate,
    });

    expect(problem).toMatchObject({
      type: "urn:opencap:problem:budget-exceeded",
      title: "Budget exceeded",
      status: 429,
      reasonCode: "BUDGET_DENY",
      capabilityId: "payments.charge",
      gateId: "budget",
      policyId: "financial-daily",
      usageMetric: "spend_cap",
      usageLimit: 50,
      usageRemaining: 0,
      usageUnit: "USD",
      usageWindow: "1d",
      redactionProfile: "opencap.problem_details.v1",
      policyEffect: "none",
    });
  });

  it("creates provider-rate-limited problem details from safe 429 evidence", () => {
    const problem = createProblemDetailsFromProviderRateLimit({
      capabilityId: "github.create_issue",
      providerRateLimit: {
        providerStatus: 429,
        retryAfterMs: 30000,
        retryAfterAt: "2030-01-01T00:00:30.000Z",
        rateLimitResetAt: "2030-01-01T01:00:00.000Z",
        headerNames: ["retry-after", "ratelimit-reset", "authorization", "x-provider-secret"],
      },
    });

    expect(problem).toEqual({
      type: "urn:opencap:problem:provider-rate-limited",
      title: "Provider rate limited",
      status: 429,
      detail: "Provider returned HTTP 429 for github.create_issue.",
      reasonCode: "PROVIDER_RATE_LIMITED",
      capabilityId: "github.create_issue",
      gateId: "provider_rate_limit",
      retryAfterMs: 30000,
      retryAfterAt: "2030-01-01T00:00:30.000Z",
      resetAt: "2030-01-01T01:00:00.000Z",
      headerNames: ["retry-after", "ratelimit-reset"],
      redactionProfile: "opencap.problem_details.v1",
      policyEffect: "none",
    });
  });

  it("keeps problem details free of raw input output and secret values", () => {
    const gate = evaluateQuotaBudgetGate(
      {
        capabilityId: "slack.send_message",
        risk: "external_send",
      },
      {
        quotas: [{
          id: "slack-send-daily",
          match: { capabilityId: "slack.send_message" },
          limit: { count: 10, used: 10, window: "1d" },
          decision: "deny",
        }],
      },
    );

    const problem = createProblemDetailsFromQuotaBudgetGate({
      capabilityId: "slack.send_message",
      gate,
    });

    const serialized = JSON.stringify(problem);
    expect(serialized).not.toContain("provider-secret");
    expect(serialized).not.toContain("Authorization");
    expect(serialized).not.toContain("raw input");
    expect(serialized).not.toContain("raw output");
  });
});
