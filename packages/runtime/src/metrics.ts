import type { AuditEvent, AuditInvocationStatus, PolicyDecision } from "./index.js";

export const LOCAL_METRICS_SCHEMA_VERSION = "opencap.local_metrics.v1";

export interface LocalMetricsWindow {
  since?: string;
  until?: string;
}

export interface BuildLocalMetricsSummaryOptions extends LocalMetricsWindow {
  capabilityId?: string;
}

export interface LocalMetricsCountSet {
  blocked: number;
  denied: number;
  executed: number;
  dry_run: number;
}

export interface LocalMetricsPolicyDecisionCounts {
  allow: number;
  ask: number;
  deny: number;
}

export interface LocalMetricsDurationSummary {
  p50: number | null;
  p95: number | null;
}

export interface LocalMetricsSummary {
  schemaVersion: typeof LOCAL_METRICS_SCHEMA_VERSION;
  window: LocalMetricsWindow;
  capabilityId?: string;
  invocationsTotal: number;
  statusCounts: LocalMetricsCountSet;
  policyDecisionCounts: LocalMetricsPolicyDecisionCounts;
  confirmationRequiredTotal: number;
  outboundBlockedTotal: number;
  dataEgressDeniedTotal: number;
  secretMissingTotal: number;
  auditPreflightFailedTotal: number;
  durationMs: LocalMetricsDurationSummary;
  policyEffect: "none";
}

function emptyStatusCounts(): LocalMetricsCountSet {
  return {
    blocked: 0,
    denied: 0,
    executed: 0,
    dry_run: 0,
  };
}

function emptyPolicyDecisionCounts(): LocalMetricsPolicyDecisionCounts {
  return {
    allow: 0,
    ask: 0,
    deny: 0,
  };
}

function isInWindow(event: AuditEvent, options: BuildLocalMetricsSummaryOptions): boolean {
  if (options.since !== undefined && event.timestamp < options.since) {
    return false;
  }

  if (options.until !== undefined && event.timestamp > options.until) {
    return false;
  }

  return options.capabilityId === undefined || event.capabilityId === options.capabilityId;
}

function incrementStatus(counts: LocalMetricsCountSet, status: AuditInvocationStatus): void {
  counts[status] += 1;
}

function incrementPolicyDecision(counts: LocalMetricsPolicyDecisionCounts, decision: PolicyDecision): void {
  counts[decision] += 1;
}

function durationFromEvent(event: AuditEvent): number | undefined {
  if (event.executionRequestStartedAt === undefined || event.executionResponseReceivedAt === undefined) {
    return undefined;
  }

  const startedAt = new Date(event.executionRequestStartedAt).getTime();
  const completedAt = new Date(event.executionResponseReceivedAt).getTime();
  if (Number.isNaN(startedAt) || Number.isNaN(completedAt) || completedAt < startedAt) {
    return undefined;
  }

  return completedAt - startedAt;
}

function percentile(values: number[], percentileValue: number): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(percentileValue * sorted.length) - 1);
  return sorted[Math.min(index, sorted.length - 1)];
}

function isSecretMissing(event: AuditEvent): boolean {
  return event.executionOutcome === "failed_before_request"
    || event.policyTrace?.reasonCode === "SECRET_MISSING";
}

function isAuditPreflightFailed(event: AuditEvent): boolean {
  return event.policyTrace?.reasonCode === "AUDIT_PREFLIGHT_FAILED";
}

export function buildLocalMetricsSummary(
  events: AuditEvent[],
  options: BuildLocalMetricsSummaryOptions = {},
): LocalMetricsSummary {
  const statusCounts = emptyStatusCounts();
  const policyDecisionCounts = emptyPolicyDecisionCounts();
  const durationValues: number[] = [];
  let confirmationRequiredTotal = 0;
  let outboundBlockedTotal = 0;
  let dataEgressDeniedTotal = 0;
  let secretMissingTotal = 0;
  let auditPreflightFailedTotal = 0;

  const filteredEvents = events.filter((event) => isInWindow(event, options));

  for (const event of filteredEvents) {
    incrementStatus(statusCounts, event.status);
    incrementPolicyDecision(policyDecisionCounts, event.policyDecision);

    if (event.confirmationStatus === "confirmation_required") {
      confirmationRequiredTotal += 1;
    }
    if (event.outboundDecision === "block") {
      outboundBlockedTotal += 1;
    }
    if (event.egressDecision === "deny") {
      dataEgressDeniedTotal += 1;
    }
    if (isSecretMissing(event)) {
      secretMissingTotal += 1;
    }
    if (isAuditPreflightFailed(event)) {
      auditPreflightFailedTotal += 1;
    }

    const duration = durationFromEvent(event);
    if (duration !== undefined) {
      durationValues.push(duration);
    }
  }

  return {
    schemaVersion: LOCAL_METRICS_SCHEMA_VERSION,
    window: {
      since: options.since,
      until: options.until,
    },
    capabilityId: options.capabilityId,
    invocationsTotal: filteredEvents.length,
    statusCounts,
    policyDecisionCounts,
    confirmationRequiredTotal,
    outboundBlockedTotal,
    dataEgressDeniedTotal,
    secretMissingTotal,
    auditPreflightFailedTotal,
    durationMs: {
      p50: percentile(durationValues, 0.5),
      p95: percentile(durationValues, 0.95),
    },
    policyEffect: "none",
  };
}
