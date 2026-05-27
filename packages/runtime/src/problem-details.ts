import type { GateDecision } from "./domain.js";
import type { QuotaBudgetEvidence } from "./quota-budget-gate.js";

export type ProblemDetailsType =
  | "urn:opencap:problem:quota-exceeded"
  | "urn:opencap:problem:budget-exceeded"
  | "urn:opencap:problem:provider-rate-limited";

export interface ProblemDetailsV1 {
  type: ProblemDetailsType;
  title: string;
  status: 429;
  detail: string;
  reasonCode: string;
  capabilityId: string;
  gateId: string;
  policyId?: string;
  retryAfterMs?: number;
  retryAfterAt?: string;
  resetAt?: string;
  headerNames?: string[];
  usageMetric?: "invocation_count" | "spend_cap";
  usageLimit?: number;
  usageRemaining?: number;
  usageUnit?: string;
  usageWindow?: string;
  redactionProfile: "opencap.problem_details.v1";
  policyEffect?: "none";
}

export interface CreateQuotaBudgetProblemDetailsInput {
  capabilityId: string;
  gate: GateDecision<QuotaBudgetEvidence>;
}

export interface CreateProviderRateLimitProblemDetailsInput {
  capabilityId: string;
  providerRateLimit: {
    providerStatus: 429;
    retryAfterMs?: number;
    retryAfterAt?: string;
    rateLimitResetAt?: string;
    headerNames: string[];
  };
}

const SAFE_RATE_LIMIT_HEADERS = new Set(["retry-after", "ratelimit-reset"]);

function safeHeaderNames(headerNames: string[]): string[] {
  return headerNames
    .map((header) => header.toLowerCase())
    .filter((header) => SAFE_RATE_LIMIT_HEADERS.has(header));
}

export function createProblemDetailsFromQuotaBudgetGate(
  input: CreateQuotaBudgetProblemDetailsInput,
): ProblemDetailsV1 | undefined {
  const evidence = input.gate.evidence;

  if (input.gate.gateId === "quota" && evidence.quotaRuleId !== undefined) {
    return {
      type: "urn:opencap:problem:quota-exceeded",
      title: "Quota exceeded",
      status: 429,
      detail: `Quota rule ${evidence.quotaRuleId} denied ${input.capabilityId} before secret resolution.`,
      reasonCode: input.gate.reasonCode,
      capabilityId: input.capabilityId,
      gateId: "quota",
      policyId: evidence.quotaRuleId,
      usageMetric: "invocation_count",
      usageLimit: evidence.quotaLimit,
      usageRemaining: evidence.quotaRemaining,
      usageWindow: evidence.quotaWindow,
      redactionProfile: "opencap.problem_details.v1",
    };
  }

  if (input.gate.gateId === "budget" && evidence.budgetRuleId !== undefined) {
    return {
      type: "urn:opencap:problem:budget-exceeded",
      title: "Budget exceeded",
      status: 429,
      detail: `Budget rule ${evidence.budgetRuleId} denied ${input.capabilityId} before secret resolution.`,
      reasonCode: input.gate.reasonCode,
      capabilityId: input.capabilityId,
      gateId: "budget",
      policyId: evidence.budgetRuleId,
      usageMetric: "spend_cap",
      usageLimit: evidence.budgetLimit,
      usageRemaining: evidence.budgetRemaining,
      usageUnit: evidence.budgetCurrency,
      usageWindow: evidence.budgetWindow,
      redactionProfile: "opencap.problem_details.v1",
      policyEffect: "none",
    };
  }

  return undefined;
}

export function createProblemDetailsFromProviderRateLimit(
  input: CreateProviderRateLimitProblemDetailsInput,
): ProblemDetailsV1 {
  return {
    type: "urn:opencap:problem:provider-rate-limited",
    title: "Provider rate limited",
    status: 429,
    detail: `Provider returned HTTP 429 for ${input.capabilityId}.`,
    reasonCode: "PROVIDER_RATE_LIMITED",
    capabilityId: input.capabilityId,
    gateId: "provider_rate_limit",
    retryAfterMs: input.providerRateLimit.retryAfterMs,
    retryAfterAt: input.providerRateLimit.retryAfterAt,
    resetAt: input.providerRateLimit.rateLimitResetAt,
    headerNames: safeHeaderNames(input.providerRateLimit.headerNames),
    redactionProfile: "opencap.problem_details.v1",
    policyEffect: "none",
  };
}
