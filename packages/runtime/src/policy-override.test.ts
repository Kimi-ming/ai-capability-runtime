import { describe, expect, it } from "vitest";
import {
  applyPolicyOverrides,
  consumePolicyOverride,
  createPolicyOverrideAuditEvent,
  validatePolicyOverrideRecord,
  type PolicyOverrideRecordV1,
} from "./policy-override.js";
import { defaultPolicySet, evaluatePolicy } from "./index.js";

const now = new Date("2026-05-12T00:00:00.000Z");

function basePolicy(decision: "allow" | "ask" | "deny" = "ask") {
  return evaluatePolicy({ ...defaultPolicySet("test-policy"), default: decision }, {
    capabilityId: "github.create_issue",
    permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
  });
}

function override(input: Partial<PolicyOverrideRecordV1>): PolicyOverrideRecordV1 {
  return {
    overrideId: "override-1",
    type: "allow_until",
    capabilityId: "github.create_issue",
    risk: "write",
    reason: "temporary local approval",
    expiresAt: "2026-05-12T00:10:00.000Z",
    createdBy: "local_user",
    createdAt: "2026-05-12T00:00:00.000Z",
    ...input,
  };
}

describe("policy override controls", () => {
  it("applies allow_once once and records override facts in policy trace", () => {
    const record = override({ type: "allow_once", invocationId: "inv-1" });
    const consumed = consumePolicyOverride(basePolicy("ask"), [record], {
      now,
      invocationId: "inv-1",
      capabilityId: "github.create_issue",
      risk: "write",
      gates: { dataEgressDecision: "allow", outboundAllowed: true, capabilityStatus: "active" },
    });

    expect(consumed.result).toMatchObject({ decision: "allow", overrideApplied: true, overrideId: "override-1" });
    expect(consumed.remainingOverrides).toEqual([]);
    expect(consumed.result.policyTrace.evaluatedFacts).toEqual(expect.arrayContaining([
      "override_id=override-1",
      "override_type=allow_once",
      "override_applied=true",
    ]));
  });

  it("ignores expired overrides", () => {
    const result = applyPolicyOverrides(basePolicy("deny"), [override({ expiresAt: "2026-05-11T23:59:00.000Z" })], {
      now,
      capabilityId: "github.create_issue",
      risk: "write",
      gates: { dataEgressDecision: "allow", outboundAllowed: true, capabilityStatus: "active" },
    });

    expect(result).toMatchObject({ decision: "deny", overrideApplied: false });
    expect(result.policyTrace.evaluatedFacts).toEqual(expect.arrayContaining(["override_ignored=expired"]));
  });

  it("requires breakglass reason and short expiration", () => {
    expect(validatePolicyOverrideRecord(override({ type: "breakglass", reason: "", expiresAt: "2026-05-12T00:05:00.000Z" }), now)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "OVERRIDE_REASON_REQUIRED" }),
    ]));

    expect(validatePolicyOverrideRecord(override({ type: "breakglass", expiresAt: "2026-05-12T01:00:00.000Z" }), now)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "BREAKGLASS_EXPIRATION_TOO_LONG" }),
    ]));
  });

  it("does not let breakglass bypass data egress deny, outbound block, or revoked capability", () => {
    const record = override({ type: "breakglass", reason: "incident mitigation", expiresAt: "2026-05-12T00:05:00.000Z" });

    for (const gates of [
      { dataEgressDecision: "deny" as const, outboundAllowed: true, capabilityStatus: "active" as const },
      { dataEgressDecision: "allow" as const, outboundAllowed: false, capabilityStatus: "active" as const },
      { dataEgressDecision: "allow" as const, outboundAllowed: true, capabilityStatus: "revoked" as const },
    ]) {
      const result = applyPolicyOverrides(basePolicy("deny"), [record], {
        now,
        capabilityId: "github.create_issue",
        risk: "write",
        gates,
      });
      expect(result.decision).toBe("deny");
      expect(result.overrideApplied).toBe(false);
      expect(result.policyTrace.evaluatedFacts).toContain("override_applied=false");
    }
  });

  it("creates audit event evidence with override trace and without policy body", () => {
    const result = applyPolicyOverrides(basePolicy("ask"), [override({ type: "allow_until" })], {
      now,
      capabilityId: "github.create_issue",
      risk: "write",
      gates: { dataEgressDecision: "allow", outboundAllowed: true, capabilityStatus: "active" },
    });
    const auditEvent = createPolicyOverrideAuditEvent(result, { channel: "cli", capabilityId: "github.create_issue" }, now);

    expect(auditEvent).toMatchObject({
      capabilityId: "github.create_issue",
      policyDecision: "allow",
      confirmationStatus: "approved",
      matchedRuleId: "override:override-1",
    });
    expect(JSON.stringify(auditEvent)).not.toContain("default:");
    expect(auditEvent.policyTrace?.evaluatedFacts).toContain("override_id=override-1");
  });
});
