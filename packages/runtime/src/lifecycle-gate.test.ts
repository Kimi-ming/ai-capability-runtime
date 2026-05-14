import { describe, expect, it } from "vitest";
import { evaluateRevokedCapabilityInvokeGate, gateDecisionSemantics } from "./index.js";

describe("revoked capability invoke gate", () => {
  it("denies revoked write and high-risk capabilities before secret resolution", () => {
    const decision = evaluateRevokedCapabilityInvokeGate({
      capabilityId: "github.create_issue",
      lifecycle: "revoked",
      highestRisk: "write",
      advisoryRef: "OCAP-2026-0001",
    });

    expect(decision).toMatchObject({
      gateId: "lifecycle",
      stage: "pre_secret",
      decision: "deny",
      reasonCode: "CAPABILITY_REVOKED_INVOKE_DENY",
      hardBoundary: true,
      evidence: {
        capabilityId: "github.create_issue",
        lifecycle: "revoked",
        highestRisk: "write",
        advisoryRef: "OCAP-2026-0001",
        explicitOverride: false,
        overrideAllowed: false,
        requestStarted: false,
      },
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      secretResolutionAllowed: false,
      executionAllowed: false,
      terminalStatus: "denied",
    });
  });

  it("requires explicit override before revoked read-only capabilities can run", () => {
    const decision = evaluateRevokedCapabilityInvokeGate({
      capabilityId: "github.search_repo",
      lifecycle: "revoked",
      highestRisk: "read_only",
      advisoryRef: "OCAP-2026-0002",
    });

    expect(decision).toMatchObject({
      gateId: "lifecycle",
      stage: "pre_secret",
      decision: "ask",
      reasonCode: "CAPABILITY_REVOKED_READ_ONLY_REQUIRES_OVERRIDE",
      hardBoundary: false,
      evidence: {
        explicitOverride: false,
        overrideAllowed: true,
        requestStarted: false,
      },
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      secretResolutionAllowed: true,
      executionAllowed: false,
      confirmationRequired: true,
      terminalStatus: "confirmation_required",
    });
  });

  it("allows revoked read-only execution only after explicit override and still records warning evidence", () => {
    const decision = evaluateRevokedCapabilityInvokeGate({
      capabilityId: "github.search_repo",
      lifecycle: "revoked",
      highestRisk: "read_only",
      explicitOverride: true,
      advisoryRef: "OCAP-2026-0002",
    });

    expect(decision).toMatchObject({
      gateId: "lifecycle",
      stage: "pre_secret",
      decision: "allow",
      reasonCode: "CAPABILITY_REVOKED_READ_ONLY_OVERRIDE",
      hardBoundary: false,
      evidence: {
        warningRequired: true,
        explicitOverride: true,
        overrideAllowed: true,
        requestStarted: false,
      },
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      secretResolutionAllowed: true,
      executionAllowed: true,
    });
  });

  it("passes through non-revoked capabilities without granting extra policy authority", () => {
    const decision = evaluateRevokedCapabilityInvokeGate({
      capabilityId: "github.create_issue",
      lifecycle: "deprecated",
      highestRisk: "write",
    });

    expect(decision).toMatchObject({
      decision: "allow",
      reasonCode: "CAPABILITY_NOT_REVOKED",
      hardBoundary: false,
      evidence: {
        lifecycle: "deprecated",
        policyEffect: "none",
        requestStarted: false,
      },
    });
  });
});
