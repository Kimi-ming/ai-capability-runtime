import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { exportDecisionLogRecords } from "./decision-log.js";
import { defaultPolicySet, evaluatePolicy, SqliteAuditLogger, type AuditEvent } from "./index.js";

function auditEvent(input: Partial<AuditEvent> = {}): AuditEvent {
  const policy = evaluatePolicy(defaultPolicySet("test-policy"), {
    capabilityId: input.capabilityId ?? "github.create_issue",
    permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
  });

  return {
    id: input.id ?? "inv-1",
    timestamp: input.timestamp ?? "2026-05-12T00:00:00.000Z",
    channel: "cli",
    capabilityId: input.capabilityId ?? "github.create_issue",
    status: input.status ?? "blocked",
    policyDecision: input.policyDecision ?? "ask",
    confirmationStatus: input.confirmationStatus ?? "confirmation_required",
    reason: input.reason ?? "requires confirmation",
    matchedRuleId: input.matchedRuleId,
    inputHash: input.inputHash ?? "sha256:input-digest",
    inputRedactedJson: JSON.stringify({ token: "[REDACTED]", body: "synthetic" }),
    egressRedactedPreviewJson: JSON.stringify({ redactedInput: "synthetic" }),
    policyTrace: input.policyTrace ?? policy.decisionTrace,
  };
}

describe("decision log export", () => {
  it("exports redacted policy decision summaries with trace identity", () => {
    const records = exportDecisionLogRecords([auditEvent()]);

    expect(records).toEqual([expect.objectContaining({
      invocationId: "inv-1",
      capabilityId: "github.create_issue",
      policyDecision: "ask",
      policyRevision: expect.stringMatching(/^sha256:/),
      traceId: expect.stringMatching(/^sha256:/),
      inputHash: "sha256:input-digest",
    })]);
    expect(JSON.stringify(records)).not.toContain("synthetic");
    expect(JSON.stringify(records)).not.toContain("token");
  });

  it("filters audit logs by capability, time range, and policy decision before export", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-decision-log-"));
    const logger = new SqliteAuditLogger({ databaseFile: join(dir, "logs.sqlite") });

    try {
      await logger.record(auditEvent({ id: "before", timestamp: "2026-05-11T23:59:00.000Z" }));
      await logger.record(auditEvent({ id: "match", timestamp: "2026-05-12T00:10:00.000Z", policyDecision: "deny", status: "denied", confirmationStatus: "denied" }));
      await logger.record(auditEvent({ id: "other", timestamp: "2026-05-12T00:11:00.000Z", capabilityId: "slack.send_message", policyDecision: "deny" }));
      await logger.record(auditEvent({ id: "after", timestamp: "2026-05-12T00:20:00.000Z", policyDecision: "deny" }));

      const events = await logger.recent(20, {
        capabilityId: "github.create_issue",
        policyDecision: "deny",
        since: "2026-05-12T00:00:00.000Z",
        until: "2026-05-12T00:15:00.000Z",
      });

      expect(exportDecisionLogRecords(events).map((record) => record.invocationId)).toEqual(["match"]);
    } finally {
      logger.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
