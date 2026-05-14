import type { RiskLevel } from "@opencap/spec";
import { createGateDecision, type CapabilityLifecycleState, type GateDecision } from "./domain.js";

export interface RevokedCapabilityInvokeGateInput {
  capabilityId: string;
  lifecycle?: CapabilityLifecycleState;
  highestRisk: RiskLevel | "unknown";
  explicitOverride?: boolean;
  advisoryRef?: string;
}

export interface RevokedCapabilityInvokeGateEvidence {
  capabilityId: string;
  lifecycle?: CapabilityLifecycleState;
  highestRisk: RiskLevel | "unknown";
  advisoryRef?: string;
  warningRequired: boolean;
  explicitOverride: boolean;
  overrideAllowed: boolean;
  policyEffect: "none";
  requestStarted: false;
}

export type RevokedCapabilityInvokeGateDecision = GateDecision<RevokedCapabilityInvokeGateEvidence>;

function overrideAllowedForRevokedRisk(risk: RiskLevel | "unknown"): boolean {
  return risk === "read_only";
}

function revokedEvidence(input: RevokedCapabilityInvokeGateInput, overrideAllowed: boolean, warningRequired: boolean): RevokedCapabilityInvokeGateEvidence {
  return {
    capabilityId: input.capabilityId,
    lifecycle: input.lifecycle,
    highestRisk: input.highestRisk,
    advisoryRef: input.advisoryRef,
    warningRequired,
    explicitOverride: input.explicitOverride ?? false,
    overrideAllowed,
    policyEffect: "none",
    requestStarted: false,
  };
}

export function evaluateRevokedCapabilityInvokeGate(input: RevokedCapabilityInvokeGateInput): RevokedCapabilityInvokeGateDecision {
  if (input.lifecycle !== "revoked") {
    return createGateDecision({
      gateId: "lifecycle",
      stage: "pre_secret",
      decision: "allow",
      reasonCode: "CAPABILITY_NOT_REVOKED",
      summary: "Capability is not revoked; lifecycle gate does not grant additional policy authority.",
      evidence: revokedEvidence(input, false, input.lifecycle === "deprecated" || input.lifecycle === "yanked"),
      hardBoundary: false,
    });
  }

  const overrideAllowed = overrideAllowedForRevokedRisk(input.highestRisk);
  if (!overrideAllowed) {
    return createGateDecision({
      gateId: "lifecycle",
      stage: "pre_secret",
      decision: "deny",
      reasonCode: "CAPABILITY_REVOKED_INVOKE_DENY",
      summary: "Revoked write or high-risk capabilities are denied before secret resolution or outbound execution.",
      evidence: revokedEvidence(input, false, true),
      hardBoundary: true,
    });
  }

  if (input.explicitOverride === true) {
    return createGateDecision({
      gateId: "lifecycle",
      stage: "pre_secret",
      decision: "allow",
      reasonCode: "CAPABILITY_REVOKED_READ_ONLY_OVERRIDE",
      summary: "Revoked read-only capability is allowed only because an explicit local override was supplied.",
      evidence: revokedEvidence(input, true, true),
      hardBoundary: false,
    });
  }

  return createGateDecision({
    gateId: "lifecycle",
    stage: "pre_secret",
    decision: "ask",
    reasonCode: "CAPABILITY_REVOKED_READ_ONLY_REQUIRES_OVERRIDE",
    summary: "Revoked read-only capability requires an explicit local override before execution.",
    evidence: revokedEvidence(input, true, true),
    hardBoundary: false,
  });
}
