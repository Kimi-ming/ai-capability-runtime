import { createHash } from "node:crypto";
import type { CapabilityLifecycleState, ExecutionOutcome } from "./domain.js";
import type { AuditEvent, AuditInvocationStatus } from "./index.js";

export const USAGE_EVENT_SCHEMA = "opencap.usage_event.v1" as const;

export type UsageEventSchema = typeof USAGE_EVENT_SCHEMA;
export type UsageEventSubject = "local_user" | "unknown";
export type UsageEventChannel = "cli" | "mcp" | "console" | "api";
export type UsageEventOutcome =
  | "success"
  | "blocked"
  | "failed_before_request"
  | "failed_after_request"
  | "unknown_after_timeout"
  | "partial"
  | "dry_run";

export interface UsageEventV1 {
  schema: UsageEventSchema;
  eventId: string;
  invocationId: string;
  capabilityId: string;
  capabilityVersion: string;
  provider?: string;
  category?: string;
  subject: UsageEventSubject;
  channel: UsageEventChannel;
  startedAt: string;
  completedAt?: string;
  generatedAt: string;
  outcome: UsageEventOutcome;
  status: AuditInvocationStatus;
  risk: string;
  requestStarted: boolean;
  dryRun: boolean;
  httpRequestCount: number;
  intentCount: 1;
  retryAttempt: number;
  durationMs?: number;
  quotaDecision?: "allowed" | "blocked" | "warned";
  budgetDecision?: "allowed" | "blocked" | "warned";
  lifecycleStatus?: CapabilityLifecycleState;
  sourceAuditHash: string;
  policyEffect: "none";
  billingEffect: "none";
}

export interface CreateUsageEventOptions {
  capabilityVersion: string;
  provider?: string;
  category?: string;
  risk: string;
  generatedAt?: string;
  completedAt?: string;
  durationMs?: number;
  quotaDecision?: UsageEventV1["quotaDecision"];
  budgetDecision?: UsageEventV1["budgetDecision"];
  lifecycleStatus?: CapabilityLifecycleState;
}

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJsonStringify(nested)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableJsonStringify(value)).digest("hex")}`;
}

function eventIdFromAudit(event: AuditEvent): string {
  return `ue_${createHash("sha256").update(`${event.id}:${event.timestamp}`).digest("hex").slice(0, 16)}`;
}

function outcomeFromAudit(event: AuditEvent): UsageEventOutcome {
  if (event.status === "dry_run") {
    return "dry_run";
  }

  if (event.status === "blocked" || event.status === "denied") {
    return "blocked";
  }

  return executionOutcomeToUsageOutcome(event.executionOutcome);
}

function executionOutcomeToUsageOutcome(outcome: ExecutionOutcome | undefined): UsageEventOutcome {
  switch (outcome) {
    case "blocked":
      return "blocked";
    case "failed_before_request":
      return "failed_before_request";
    case "failed_after_request":
      return "failed_after_request";
    case "unknown_after_timeout":
      return "unknown_after_timeout";
    case "partial":
      return "partial";
    case "success":
    case undefined:
      return "success";
  }
}

function sourceAuditHash(event: AuditEvent): string {
  return sha256({
    id: event.id,
    timestamp: event.timestamp,
    channel: event.channel,
    capabilityId: event.capabilityId,
    status: event.status,
    policyDecision: event.policyDecision,
    confirmationStatus: event.confirmationStatus,
    requestStarted: event.requestStarted,
    executionOutcome: event.executionOutcome,
    executionRetryAttempt: event.executionRetryAttempt,
    executionProviderRequestId: event.executionProviderRequestId,
    matchedRuleId: event.matchedRuleId,
    inputHash: event.inputHash,
  });
}

export function createUsageEventFromAuditEvent(event: AuditEvent, options: CreateUsageEventOptions): UsageEventV1 {
  const requestStarted = event.requestStarted ?? false;

  return {
    schema: USAGE_EVENT_SCHEMA,
    eventId: eventIdFromAudit(event),
    invocationId: event.id,
    capabilityId: event.capabilityId,
    capabilityVersion: options.capabilityVersion,
    provider: options.provider,
    category: options.category,
    subject: event.consentSubject ?? "unknown",
    channel: event.channel,
    startedAt: event.timestamp,
    completedAt: options.completedAt,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    outcome: outcomeFromAudit(event),
    status: event.status,
    risk: options.risk,
    requestStarted,
    dryRun: event.status === "dry_run",
    httpRequestCount: requestStarted ? 1 : 0,
    intentCount: 1,
    retryAttempt: event.executionRetryAttempt ?? 0,
    durationMs: options.durationMs,
    quotaDecision: options.quotaDecision,
    budgetDecision: options.budgetDecision,
    lifecycleStatus: options.lifecycleStatus,
    sourceAuditHash: sourceAuditHash(event),
    policyEffect: "none",
    billingEffect: "none",
  };
}
