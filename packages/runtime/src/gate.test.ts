import { describe, expect, it } from "vitest";
import {
  createGateDecision,
  gateDecisionSemantics,
  type GateDecision,
  type RuntimeGate,
} from "./domain.js";

describe("Runtime Gate public contract", () => {
  it("maps gate decisions to execution semantics", () => {
    expect(gateDecisionSemantics("allow")).toEqual({
      secretResolutionAllowed: true,
      executionAllowed: true,
      confirmationRequired: false,
      transformedInputRequired: false,
    });

    expect(gateDecisionSemantics("ask")).toEqual({
      secretResolutionAllowed: true,
      executionAllowed: false,
      confirmationRequired: true,
      transformedInputRequired: false,
      terminalStatus: "confirmation_required",
    });

    expect(gateDecisionSemantics("deny")).toEqual({
      secretResolutionAllowed: false,
      executionAllowed: false,
      confirmationRequired: false,
      transformedInputRequired: false,
      terminalStatus: "denied",
    });

    expect(gateDecisionSemantics("block")).toEqual({
      secretResolutionAllowed: false,
      executionAllowed: false,
      confirmationRequired: false,
      transformedInputRequired: false,
      terminalStatus: "blocked",
    });

    expect(gateDecisionSemantics("redact")).toEqual({
      secretResolutionAllowed: false,
      executionAllowed: false,
      confirmationRequired: false,
      transformedInputRequired: true,
    });
  });

  it("creates gate decisions with safe hard-boundary defaults", () => {
    const blockDecision = createGateDecision({
      gateId: "audit_preflight",
      stage: "pre_execution",
      decision: "block",
      reasonCode: "AUDIT_PREFLIGHT_FAILED",
      summary: "Audit preflight failed.",
      evidence: { logger: "sqlite" },
    });

    expect(blockDecision).toMatchObject({
      gateId: "audit_preflight",
      stage: "pre_execution",
      decision: "block",
      hardBoundary: true,
    });

    const askDecision = createGateDecision({
      gateId: "risk_policy",
      stage: "pre_secret",
      decision: "ask",
      reasonCode: "WRITE_REQUIRES_CONFIRMATION",
      summary: "Write operation requires confirmation.",
      evidence: { risk: "write" },
    });

    expect(askDecision.hardBoundary).toBe(false);
    expect(gateDecisionSemantics(askDecision).confirmationRequired).toBe(true);
  });

  it("allows gate evaluators to return decisions synchronously or asynchronously", async () => {
    const syncGate: RuntimeGate<undefined, { matchedRuleId: string }> = {
      gateId: "risk_policy",
      stage: "pre_secret",
      evaluate: (_input) => createGateDecision({
        gateId: "risk_policy",
        stage: "pre_secret",
        decision: "allow",
        reasonCode: "RISK_POLICY_ALLOW",
        summary: "Risk policy allowed the call.",
        evidence: { matchedRuleId: "allow-read" },
      }),
    };

    const asyncGate: RuntimeGate<undefined, { lifecycle: string }> = {
      gateId: "lifecycle",
      stage: "pre_secret",
      evaluate: async (_input) => createGateDecision({
        gateId: "lifecycle",
        stage: "pre_secret",
        decision: "block",
        reasonCode: "CAPABILITY_REVOKED",
        summary: "Revoked capability cannot execute.",
        evidence: { lifecycle: "revoked" },
      }),
    };

    const decisions: GateDecision[] = [
      await syncGate.evaluate(undefined),
      await asyncGate.evaluate(undefined),
    ];

    expect(decisions.map((decision) => decision.decision)).toEqual(["allow", "block"]);
    expect(decisions[1].hardBoundary).toBe(true);
  });
});
