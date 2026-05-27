import { describe, expect, it } from "vitest";
import { createUsageExportEnvelope, serializeUsageExportJsonl } from "./index.js";
import type { UsageEventV1 } from "./index.js";

function baseUsageEvent(overrides: Partial<UsageEventV1> = {}): UsageEventV1 {
  return {
    schema: "opencap.usage_event.v1",
    eventId: "ue_123",
    invocationId: "audit_123",
    capabilityId: "github.create_issue",
    capabilityVersion: "0.1.0",
    provider: "github",
    category: "developer-tools",
    subject: "local_user",
    channel: "cli",
    startedAt: "2026-05-27T00:00:00.000Z",
    completedAt: "2026-05-27T00:00:01.000Z",
    generatedAt: "2026-05-27T00:00:02.000Z",
    outcome: "success",
    status: "executed",
    risk: "write",
    requestStarted: true,
    dryRun: false,
    httpRequestCount: 1,
    intentCount: 1,
    retryAttempt: 0,
    durationMs: 1200,
    sourceAuditHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    policyEffect: "none",
    billingEffect: "none",
    ...overrides,
  };
}

describe("usage export format", () => {
  it("creates a JSON export envelope with filters, redaction profile, and compatibility metadata", () => {
    const eventWithUnsafeExtras = {
      ...baseUsageEvent(),
      inputRedactedJson: "{\"body\":\"secret customer text\"}",
      credentialRedacted: "sha256:credential",
      providerRawResponse: "secret provider output",
    } as UsageEventV1;

    const envelope = createUsageExportEnvelope([eventWithUnsafeExtras], {
      generatedAt: "2026-05-27T00:00:03.000Z",
      filters: {
        since: "2026-05-26T00:00:00.000Z",
        until: "2026-05-27T00:00:00.000Z",
        capabilityIds: ["github.create_issue"],
        channels: ["cli"],
        outcomes: ["success"],
        dryRun: false,
      },
    });

    expect(envelope).toMatchObject({
      schema: "opencap.usage_export.v1",
      exportVersion: "1",
      generatedAt: "2026-05-27T00:00:03.000Z",
      format: "json",
      eventCount: 1,
      filters: {
        capabilityIds: ["github.create_issue"],
        channels: ["cli"],
        outcomes: ["success"],
      },
      redactionProfile: "opencap.usage_export.redaction.v1",
      compatibility: {
        usageEventSchema: "opencap.usage_event.v1",
        additiveFieldsAllowed: true,
      },
    });
    expect(envelope.events[0]).toMatchObject({
      schema: "opencap.usage_event.v1",
      eventId: "ue_123",
      billingEffect: "none",
      policyEffect: "none",
    });
    expect(JSON.stringify(envelope)).not.toContain("secret customer text");
    expect(JSON.stringify(envelope)).not.toContain("credential");
    expect(JSON.stringify(envelope)).not.toContain("provider output");
  });

  it("serializes JSONL with a header envelope followed by sanitized usage events", () => {
    const jsonl = serializeUsageExportJsonl([baseUsageEvent()], {
      generatedAt: "2026-05-27T00:00:03.000Z",
      filters: { capabilityIds: ["github.create_issue"] },
    });
    const lines = jsonl.trimEnd().split("\n").map((line) => JSON.parse(line));

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      schema: "opencap.usage_export.header.v1",
      exportVersion: "1",
      format: "jsonl",
      eventCount: 1,
      redactionProfile: "opencap.usage_export.redaction.v1",
    });
    expect(lines[1]).toMatchObject({
      schema: "opencap.usage_event.v1",
      eventId: "ue_123",
      billingEffect: "none",
    });
  });

  it("rejects events that are not non-billing usage event v1 records", () => {
    expect(() =>
      createUsageExportEnvelope([{ ...baseUsageEvent(), billingEffect: "external_profile" } as unknown as UsageEventV1], {
        generatedAt: "2026-05-27T00:00:03.000Z",
      }),
    ).toThrow(/billingEffect=none/);

    expect(() =>
      serializeUsageExportJsonl([{ ...baseUsageEvent(), schema: "opencap.usage_event.v2" } as unknown as UsageEventV1], {
        generatedAt: "2026-05-27T00:00:03.000Z",
      }),
    ).toThrow(/opencap\.usage_event\.v1/);
  });
});
