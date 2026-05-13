import { createHash } from "node:crypto";
import type { ExecutionOutcome, ExecutionSideEffectKind } from "./domain.js";

export type HttpRetryIdempotencyMode =
  | "none"
  | "method"
  | "provider_key"
  | "conditional"
  | "external_reconcile";

export type HttpRetryReasonCode =
  | "retry_allowed"
  | "automatic_retry_disabled"
  | "max_attempts_reached"
  | "non_retryable_error"
  | "non_idempotent_operation"
  | "unknown_outcome_requires_reconcile";

export interface HttpRetryPolicyV1 {
  automatic: boolean;
  maxAttempts: number;
  retryableStatus: number[];
}

export interface HttpRetryPolicyInput {
  method: string;
  statusCode?: number;
  errorCode?: string;
  outcome?: ExecutionOutcome;
  sideEffectKind?: ExecutionSideEffectKind;
  attempt?: number;
  idempotencyMode?: HttpRetryIdempotencyMode;
  idempotencyKey?: string;
  policy?: Partial<HttpRetryPolicyV1>;
}

export interface HttpRetryPolicyDecision {
  shouldRetry: boolean;
  retryableError: boolean;
  operationRepeatable: boolean;
  reasonCode: HttpRetryReasonCode;
  retryAttempt: number;
  maxAttempts: number;
  idempotencyMode: HttpRetryIdempotencyMode;
  idempotencyKeyHash?: string;
}

const DEFAULT_RETRYABLE_STATUS = [408, 429, 500, 502, 503, 504];
const METHOD_REPEATABLE = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);

export function defaultHttpRetryPolicy(): HttpRetryPolicyV1 {
  return {
    automatic: false,
    maxAttempts: 1,
    retryableStatus: [...DEFAULT_RETRYABLE_STATUS],
  };
}

function normalizeRetryPolicy(policy: Partial<HttpRetryPolicyV1> | undefined): HttpRetryPolicyV1 {
  const defaults = defaultHttpRetryPolicy();
  return {
    automatic: policy?.automatic ?? defaults.automatic,
    maxAttempts: policy?.maxAttempts ?? defaults.maxAttempts,
    retryableStatus: policy?.retryableStatus ?? defaults.retryableStatus,
  };
}

function hashIdempotencyKey(key: string | undefined): string | undefined {
  if (key === undefined) {
    return undefined;
  }

  return `sha256:${createHash("sha256").update(key).digest("hex").slice(0, 12)}`;
}

function retryableError(input: HttpRetryPolicyInput, policy: HttpRetryPolicyV1): boolean {
  if (input.statusCode === 401 || input.statusCode === 403) {
    return false;
  }

  if (input.statusCode !== undefined) {
    return policy.retryableStatus.includes(input.statusCode);
  }

  return input.errorCode === "HTTP_TIMEOUT" || input.errorCode === "NETWORK_ERROR";
}

function operationRepeatable(input: HttpRetryPolicyInput, idempotencyMode: HttpRetryIdempotencyMode): boolean {
  if (input.outcome === "unknown_after_timeout" && input.sideEffectKind !== "read") {
    return false;
  }

  if (idempotencyMode === "provider_key") {
    return input.idempotencyKey !== undefined && input.idempotencyKey.length > 0;
  }

  if (idempotencyMode === "conditional") {
    return true;
  }

  if (input.sideEffectKind === "read") {
    return METHOD_REPEATABLE.has(input.method.toUpperCase());
  }

  if (idempotencyMode === "method") {
    return METHOD_REPEATABLE.has(input.method.toUpperCase());
  }

  return false;
}

export function evaluateHttpRetryPolicy(input: HttpRetryPolicyInput): HttpRetryPolicyDecision {
  const policy = normalizeRetryPolicy(input.policy);
  const attempt = input.attempt ?? 0;
  const idempotencyMode = input.idempotencyMode ?? "none";
  const errorIsRetryable = retryableError(input, policy);
  const repeatable = operationRepeatable(input, idempotencyMode);
  const idempotencyKeyHash = hashIdempotencyKey(input.idempotencyKey);

  if (!errorIsRetryable) {
    return {
      shouldRetry: false,
      retryableError: false,
      operationRepeatable: repeatable,
      reasonCode: "non_retryable_error",
      retryAttempt: attempt,
      maxAttempts: policy.maxAttempts,
      idempotencyMode,
      idempotencyKeyHash,
    };
  }

  if (input.outcome === "unknown_after_timeout" && input.sideEffectKind !== "read") {
    return {
      shouldRetry: false,
      retryableError: true,
      operationRepeatable: false,
      reasonCode: "unknown_outcome_requires_reconcile",
      retryAttempt: attempt,
      maxAttempts: policy.maxAttempts,
      idempotencyMode,
      idempotencyKeyHash,
    };
  }

  if (!repeatable) {
    return {
      shouldRetry: false,
      retryableError: true,
      operationRepeatable: false,
      reasonCode: "non_idempotent_operation",
      retryAttempt: attempt,
      maxAttempts: policy.maxAttempts,
      idempotencyMode,
      idempotencyKeyHash,
    };
  }

  if (!policy.automatic) {
    return {
      shouldRetry: false,
      retryableError: true,
      operationRepeatable: true,
      reasonCode: "automatic_retry_disabled",
      retryAttempt: attempt,
      maxAttempts: policy.maxAttempts,
      idempotencyMode,
      idempotencyKeyHash,
    };
  }

  if (attempt + 1 >= policy.maxAttempts) {
    return {
      shouldRetry: false,
      retryableError: true,
      operationRepeatable: true,
      reasonCode: "max_attempts_reached",
      retryAttempt: attempt,
      maxAttempts: policy.maxAttempts,
      idempotencyMode,
      idempotencyKeyHash,
    };
  }

  return {
    shouldRetry: true,
    retryableError: true,
    operationRepeatable: true,
    reasonCode: "retry_allowed",
    retryAttempt: attempt + 1,
    maxAttempts: policy.maxAttempts,
    idempotencyMode,
    idempotencyKeyHash,
  };
}
