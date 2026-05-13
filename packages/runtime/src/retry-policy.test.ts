import { describe, expect, it } from "vitest";
import {
  defaultHttpRetryPolicy,
  evaluateHttpRetryPolicy,
} from "./retry-policy.js";

describe("HTTP retry policy", () => {
  it("does not automatically retry non-idempotent writes", () => {
    expect(
      evaluateHttpRetryPolicy({
        method: "POST",
        statusCode: 500,
        outcome: "failed_after_request",
        sideEffectKind: "write",
        attempt: 0,
        policy: { automatic: true, maxAttempts: 3 },
      }),
    ).toMatchObject({
      shouldRetry: false,
      retryableError: true,
      operationRepeatable: false,
      reasonCode: "non_idempotent_operation",
      retryAttempt: 0,
    });
  });

  it("requires reconcile for unknown write outcomes after timeout", () => {
    expect(
      evaluateHttpRetryPolicy({
        method: "POST",
        errorCode: "HTTP_TIMEOUT",
        outcome: "unknown_after_timeout",
        sideEffectKind: "write",
        attempt: 0,
        policy: { automatic: true, maxAttempts: 3 },
      }),
    ).toMatchObject({
      shouldRetry: false,
      retryableError: true,
      operationRepeatable: false,
      reasonCode: "unknown_outcome_requires_reconcile",
      retryAttempt: 0,
    });
  });

  it("does not retry authentication or authorization failures", () => {
    for (const statusCode of [401, 403]) {
      expect(
        evaluateHttpRetryPolicy({
          method: "GET",
          statusCode,
          outcome: "failed_after_request",
          sideEffectKind: "read",
          attempt: 0,
          policy: { automatic: true, maxAttempts: 3 },
        }),
      ).toMatchObject({
        shouldRetry: false,
        retryableError: false,
        reasonCode: "non_retryable_error",
        retryAttempt: 0,
      });
    }
  });

  it("allows explicit read-only retries for retryable statuses before max attempts", () => {
    expect(
      evaluateHttpRetryPolicy({
        method: "GET",
        statusCode: 503,
        outcome: "failed_after_request",
        sideEffectKind: "read",
        attempt: 0,
        policy: { automatic: true, maxAttempts: 3 },
      }),
    ).toMatchObject({
      shouldRetry: true,
      retryableError: true,
      operationRepeatable: true,
      reasonCode: "retry_allowed",
      retryAttempt: 1,
    });
  });

  it("keeps automatic retries disabled by default", () => {
    expect(defaultHttpRetryPolicy()).toEqual({
      automatic: false,
      maxAttempts: 1,
      retryableStatus: [408, 429, 500, 502, 503, 504],
    });

    expect(
      evaluateHttpRetryPolicy({
        method: "GET",
        statusCode: 503,
        outcome: "failed_after_request",
        sideEffectKind: "read",
      }),
    ).toMatchObject({
      shouldRetry: false,
      reasonCode: "automatic_retry_disabled",
      retryAttempt: 0,
    });
  });

  it("hashes provider idempotency keys in retry evidence", () => {
    const decision = evaluateHttpRetryPolicy({
      method: "POST",
      statusCode: 500,
      outcome: "failed_after_request",
      sideEffectKind: "write",
      attempt: 0,
      idempotencyMode: "provider_key",
      idempotencyKey: "idempotency-key-secret",
      policy: { automatic: true, maxAttempts: 2 },
    });

    expect(decision).toMatchObject({
      shouldRetry: true,
      operationRepeatable: true,
      reasonCode: "retry_allowed",
      retryAttempt: 1,
    });
    expect(decision.idempotencyKeyHash).toMatch(/^sha256:[a-f0-9]{12}$/);
    expect(JSON.stringify(decision)).not.toContain("idempotency-key-secret");
  });
});
