import { describe, expect, it } from "vitest";
import { createUsageEventFromAuditEvent } from "./index.js";
import type { AuditEvent } from "./index.js";

function baseAuditEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: "audit_123",
    timestamp: "2026-05-27T00:00:00.000Z",
    channel: "cli",
    capabilityId: "github.create_issue",
    status: "executed",
    policyDecision: "allow",
    confirmationStatus: "not_required",
    reason: "Executed",
    requestStarted: true,
    risk: undefined,
    ...overrides,
  } as AuditEvent;
}

describe("usage event schema", () => {
  it("derives a redacted blocked usage event from audit evidence", () => {
    const event = createUsageEventFromAuditEvent(
      baseAuditEvent({
        status: "blocked",
        policyDecision: "deny",
        confirmationStatus: "denied",
        reason: "Data egress denied",
        requestStarted: false,
        inputHash: "sha256:input",
        inputRedactedJson: "{\"body\":\"secret customer text\"}",
        credentialRedacted: "sha256:credential",
      }),
      {
        capabilityVersion: "0.1.0",
        provider: "github",
        category: "developer-tools",
        risk: "write",
        generatedAt: "2026-05-27T00:00:01.000Z",
      },
    );

    expect(event).toMatchObject({
      schema: "opencap.usage_event.v1",
      invocationId: "audit_123",
      capabilityId: "github.create_issue",
      capabilityVersion: "0.1.0",
      provider: "github",
      category: "developer-tools",
      outcome: "blocked",
      requestStarted: false,
      httpRequestCount: 0,
      intentCount: 1,
      retryAttempt: 0,
      sourceAuditHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      generatedAt: "2026-05-27T00:00:01.000Z",
      policyEffect: "none",
      billingEffect: "none",
    });
    expect(JSON.stringify(event)).not.toContain("secret customer text");
    expect(JSON.stringify(event)).not.toContain("credential");
  });

  it("keeps dry-run usage separate from real execution", () => {
    const event = createUsageEventFromAuditEvent(
      baseAuditEvent({
        status: "dry_run",
        requestStarted: false,
        executionOutcome: undefined,
      }),
      {
        capabilityVersion: "0.1.0",
        risk: "write",
        generatedAt: "2026-05-27T00:00:01.000Z",
      },
    );

    expect(event).toMatchObject({
      outcome: "dry_run",
      dryRun: true,
      requestStarted: false,
      httpRequestCount: 0,
      billingEffect: "none",
    });
  });

  it("records retry attempt without counting it as another user intent", () => {
    const event = createUsageEventFromAuditEvent(
      baseAuditEvent({
        executionOutcome: "unknown_after_timeout",
        executionRetryAttempt: 2,
        requestStarted: true,
      }),
      {
        capabilityVersion: "0.1.0",
        risk: "write",
        generatedAt: "2026-05-27T00:00:01.000Z",
      },
    );

    expect(event).toMatchObject({
      outcome: "unknown_after_timeout",
      requestStarted: true,
      httpRequestCount: 1,
      retryAttempt: 2,
      intentCount: 1,
    });
  });

  it("marks lifecycle status for revoked or deprecated usage", () => {
    const event = createUsageEventFromAuditEvent(baseAuditEvent(), {
      capabilityVersion: "0.1.0",
      risk: "write",
      lifecycleStatus: "revoked",
      generatedAt: "2026-05-27T00:00:01.000Z",
    });

    expect(event).toMatchObject({
      lifecycleStatus: "revoked",
      sourceAuditHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
    });
  });
});
