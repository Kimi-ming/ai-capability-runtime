import { describe, expect, it } from "vitest";
import { buildLocalMetricsSummary, LOCAL_METRICS_SCHEMA_VERSION, type AuditEvent } from "./index.js";

function auditEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: overrides.id ?? "inv-1",
    timestamp: overrides.timestamp ?? "2026-05-28T00:00:00.000Z",
    channel: "cli",
    capabilityId: overrides.capabilityId ?? "github.create_issue",
    status: overrides.status ?? "executed",
    policyDecision: overrides.policyDecision ?? "allow",
    confirmationStatus: overrides.confirmationStatus ?? "approved",
    reason: overrides.reason ?? "ok",
    ...overrides,
  };
}

describe("local audit metrics summary", () => {
  it("summarizes audit events with filters, counts, duration percentiles, and no raw payload copies", () => {
    const summary = buildLocalMetricsSummary([
      auditEvent({
        id: "before-window",
        timestamp: "2026-05-27T23:59:59.000Z",
        capabilityId: "github.create_issue",
      }),
      auditEvent({
        id: "success-fast",
        timestamp: "2026-05-28T00:01:00.000Z",
        capabilityId: "github.create_issue",
        status: "executed",
        policyDecision: "allow",
        executionRequestStartedAt: "2026-05-28T00:01:00.000Z",
        executionResponseReceivedAt: "2026-05-28T00:01:00.100Z",
        inputRedactedJson: "{\"body\":\"secret customer text\"}",
        egressRedactedPreviewJson: "{\"token\":\"super-secret-token\"}",
      }),
      auditEvent({
        id: "needs-confirmation",
        timestamp: "2026-05-28T00:02:00.000Z",
        capabilityId: "github.create_issue",
        status: "blocked",
        policyDecision: "ask",
        confirmationStatus: "confirmation_required",
      }),
      auditEvent({
        id: "outbound-blocked",
        timestamp: "2026-05-28T00:03:00.000Z",
        capabilityId: "github.create_issue",
        status: "blocked",
        policyDecision: "allow",
        confirmationStatus: "approved",
        outboundDecision: "block",
        outboundReasonCode: "OUTBOUND_BLOCKED",
      }),
      auditEvent({
        id: "egress-denied",
        timestamp: "2026-05-28T00:04:00.000Z",
        capabilityId: "github.create_issue",
        status: "denied",
        policyDecision: "deny",
        confirmationStatus: "denied",
        egressDecision: "deny",
      }),
      auditEvent({
        id: "secret-missing",
        timestamp: "2026-05-28T00:05:00.000Z",
        capabilityId: "github.create_issue",
        status: "blocked",
        policyDecision: "allow",
        confirmationStatus: "approved",
        executionOutcome: "failed_before_request",
      }),
      auditEvent({
        id: "audit-failed",
        timestamp: "2026-05-28T00:06:00.000Z",
        capabilityId: "github.create_issue",
        status: "blocked",
        policyDecision: "allow",
        confirmationStatus: "approved",
        policyTrace: {
          traceVersion: "opencap.policy_trace.v1",
          policySetId: "local",
          policyRevision: "sha256:policy",
          gate: "risk_policy",
          decision: "deny",
          reasonCode: "AUDIT_PREFLIGHT_FAILED",
          defaultDecisionUsed: false,
          evaluatedFacts: [],
          humanReadableSummary: "Audit preflight failed.",
          secretResolutionAllowed: false,
          executionAllowed: false,
        },
      }),
      auditEvent({
        id: "success-slow",
        timestamp: "2026-05-28T00:07:00.000Z",
        capabilityId: "github.create_issue",
        status: "executed",
        policyDecision: "allow",
        executionRequestStartedAt: "2026-05-28T00:07:00.000Z",
        executionResponseReceivedAt: "2026-05-28T00:07:00.900Z",
      }),
      auditEvent({
        id: "other-capability",
        timestamp: "2026-05-28T00:08:00.000Z",
        capabilityId: "slack.send_message",
      }),
    ], {
      since: "2026-05-28T00:00:00.000Z",
      until: "2026-05-28T00:10:00.000Z",
      capabilityId: "github.create_issue",
    });

    expect(summary).toMatchObject({
      schemaVersion: LOCAL_METRICS_SCHEMA_VERSION,
      window: {
        since: "2026-05-28T00:00:00.000Z",
        until: "2026-05-28T00:10:00.000Z",
      },
      capabilityId: "github.create_issue",
      invocationsTotal: 7,
      statusCounts: {
        executed: 2,
        blocked: 4,
        denied: 1,
        dry_run: 0,
      },
      policyDecisionCounts: {
        allow: 5,
        ask: 1,
        deny: 1,
      },
      confirmationRequiredTotal: 1,
      outboundBlockedTotal: 1,
      dataEgressDeniedTotal: 1,
      secretMissingTotal: 1,
      auditPreflightFailedTotal: 1,
      durationMs: {
        p50: 100,
        p95: 900,
      },
      policyEffect: "none",
    });

    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain("secret customer text");
    expect(serialized).not.toContain("super-secret-token");
    expect(serialized).not.toContain("inputRedactedJson");
    expect(serialized).not.toContain("egressRedactedPreviewJson");
    expect(serialized).not.toContain("Authorization");
  });

  it("returns zero counts and null duration percentiles for an empty window", () => {
    const summary = buildLocalMetricsSummary([], {
      since: "2026-05-28T00:00:00.000Z",
      until: "2026-05-28T01:00:00.000Z",
    });

    expect(summary).toMatchObject({
      invocationsTotal: 0,
      confirmationRequiredTotal: 0,
      outboundBlockedTotal: 0,
      dataEgressDeniedTotal: 0,
      secretMissingTotal: 0,
      auditPreflightFailedTotal: 0,
      durationMs: {
        p50: null,
        p95: null,
      },
      policyEffect: "none",
    });
  });
});
