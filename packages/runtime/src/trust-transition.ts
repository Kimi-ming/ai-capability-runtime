import type { CapabilityLifecycleState, TrustSummary } from "./domain.js";

export type TrustTransitionTarget = TrustSummary["level"] | "revoked";
export type TrustTransitionKind = "noop" | "upgrade" | "downgrade" | "freeze" | "revoke";
export type TrustTransitionPolicyEffect = "none";
export type TrustTransitionFindingSeverity = "error" | "warning";

export type TrustTransitionFindingCode =
  | "TRUST_TRANSITION_REASON_REQUIRED"
  | "TRUST_UPGRADE_MUST_BE_STEPWISE"
  | "TRUST_LISTED_REQUIRES_MANIFEST_VALID"
  | "TRUST_LISTED_REQUIRES_PACKAGE_VALID"
  | "TRUST_LISTED_REQUIRES_REVIEW_CHECKLIST"
  | "TRUST_TESTED_REQUIRES_PASSING_REGISTRY_TESTS"
  | "TRUST_TESTED_REQUIRES_CONFORMANCE_REF"
  | "TRUST_TRANSITION_FROZEN_BY_HIGH_ADVISORY"
  | "TRUST_MAINTAINER_VERIFIED_REQUIRES_IDENTITY"
  | "TRUST_MAINTAINER_VERIFIED_REQUIRES_LEAST_PRIVILEGE_REVIEW"
  | "TRUST_MAINTAINER_VERIFIED_REQUIRES_FRESH_REVIEW"
  | "TRUST_OFFICIAL_REQUIRES_CORE_MAINTAINER"
  | "TRUST_OFFICIAL_REQUIRES_RELEASE_GATE"
  | "TRUST_REVOKED_REQUIRES_REVOCATION_REF";

export interface TrustTransitionEvidence {
  manifestValid?: boolean;
  packageValid?: boolean;
  reviewChecklistPassed?: boolean;
  registryTests?: "passing" | "failing" | "not_run" | "unknown";
  conformanceRef?: string;
  leastPrivilegeReview?: "pass" | "warn" | "fail" | "unknown";
  reviewFresh?: boolean;
  maintainerVerified?: boolean;
  coreMaintainer?: boolean;
  releaseGate?: "pass" | "fail" | "unknown";
  openHighAdvisories?: number;
  reasonRef?: string;
  reviewDigest?: string;
  revocationRef?: string;
}

export interface TrustTransitionInput {
  from: TrustSummary["level"];
  to: TrustTransitionTarget;
  evidence?: TrustTransitionEvidence;
  reason?: string;
}

export interface TrustTransitionFinding {
  code: TrustTransitionFindingCode;
  severity: TrustTransitionFindingSeverity;
  message: string;
}

export interface TrustTransitionDecision {
  allowed: boolean;
  kind: TrustTransitionKind;
  from: TrustSummary["level"];
  to: TrustTransitionTarget;
  policyEffect: TrustTransitionPolicyEffect;
  auditRequired: true;
  requiresRegistryReview: true;
  lifecycleEffect?: Extract<CapabilityLifecycleState, "revoked">;
  findings: TrustTransitionFinding[];
}

const TRUST_LEVEL_ORDER: TrustSummary["level"][] = ["unverified", "listed", "tested", "maintainer_verified", "official"];

function addFinding(findings: TrustTransitionFinding[], code: TrustTransitionFindingCode, message: string): void {
  findings.push({ code, severity: "error", message });
}

function trustLevelIndex(level: TrustSummary["level"]): number {
  return TRUST_LEVEL_ORDER.indexOf(level);
}

function baseTransitionKind(from: TrustSummary["level"], to: TrustTransitionTarget): TrustTransitionKind {
  if (to === "revoked") {
    return "revoke";
  }
  const fromIndex = trustLevelIndex(from);
  const toIndex = trustLevelIndex(to);
  if (toIndex === fromIndex) {
    return "noop";
  }
  return toIndex > fromIndex ? "upgrade" : "downgrade";
}

function hasBlockingAdvisory(evidence: TrustTransitionEvidence): boolean {
  return (evidence.openHighAdvisories ?? 0) > 0;
}

function validateUpgradeTarget(target: TrustSummary["level"], evidence: TrustTransitionEvidence, findings: TrustTransitionFinding[]): void {
  if (target === "listed") {
    if (evidence.manifestValid !== true) {
      addFinding(findings, "TRUST_LISTED_REQUIRES_MANIFEST_VALID", "listed requires a valid manifest.");
    }
    if (evidence.packageValid !== true) {
      addFinding(findings, "TRUST_LISTED_REQUIRES_PACKAGE_VALID", "listed requires a valid capability package.");
    }
    if (evidence.reviewChecklistPassed !== true) {
      addFinding(findings, "TRUST_LISTED_REQUIRES_REVIEW_CHECKLIST", "listed requires a passed capability review checklist.");
    }
  }

  if (target === "tested") {
    if (evidence.registryTests !== "passing") {
      addFinding(findings, "TRUST_TESTED_REQUIRES_PASSING_REGISTRY_TESTS", "tested requires passing registry tests.");
    }
    if (!evidence.conformanceRef) {
      addFinding(findings, "TRUST_TESTED_REQUIRES_CONFORMANCE_REF", "tested requires a conformance evidence reference.");
    }
  }

  if (target === "maintainer_verified") {
    if (evidence.maintainerVerified !== true) {
      addFinding(findings, "TRUST_MAINTAINER_VERIFIED_REQUIRES_IDENTITY", "maintainer_verified requires maintainer or service ownership verification.");
    }
    if (evidence.leastPrivilegeReview !== "pass") {
      addFinding(findings, "TRUST_MAINTAINER_VERIFIED_REQUIRES_LEAST_PRIVILEGE_REVIEW", "maintainer_verified requires a passing least-privilege review.");
    }
    if (evidence.reviewFresh !== true) {
      addFinding(findings, "TRUST_MAINTAINER_VERIFIED_REQUIRES_FRESH_REVIEW", "maintainer_verified requires a fresh review.");
    }
  }

  if (target === "official") {
    if (evidence.coreMaintainer !== true) {
      addFinding(findings, "TRUST_OFFICIAL_REQUIRES_CORE_MAINTAINER", "official requires OpenCap core maintainer ownership.");
    }
    if (evidence.releaseGate !== "pass") {
      addFinding(findings, "TRUST_OFFICIAL_REQUIRES_RELEASE_GATE", "official requires a passing release gate.");
    }
  }
}

export function evaluateTrustLevelTransition(input: TrustTransitionInput): TrustTransitionDecision {
  const evidence = input.evidence ?? {};
  const findings: TrustTransitionFinding[] = [];
  let kind = baseTransitionKind(input.from, input.to);

  if (!input.reason?.trim()) {
    addFinding(findings, "TRUST_TRANSITION_REASON_REQUIRED", "trust transitions require a human-readable reason.");
  }

  if (kind === "upgrade" && (hasBlockingAdvisory(evidence) || evidence.registryTests === "failing")) {
    kind = "freeze";
    if (hasBlockingAdvisory(evidence)) {
      addFinding(findings, "TRUST_TRANSITION_FROZEN_BY_HIGH_ADVISORY", "high open advisories freeze trust promotion.");
    }
    if (evidence.registryTests === "failing") {
      addFinding(findings, "TRUST_TESTED_REQUIRES_PASSING_REGISTRY_TESTS", "failing registry tests freeze trust promotion.");
    }
  }

  if (kind === "upgrade" || kind === "freeze") {
    const requestedLevel = input.to === "revoked" ? undefined : input.to;
    if (requestedLevel !== undefined) {
      if (trustLevelIndex(requestedLevel) - trustLevelIndex(input.from) !== 1) {
        addFinding(findings, "TRUST_UPGRADE_MUST_BE_STEPWISE", "trust upgrades must move one level at a time.");
      }
      validateUpgradeTarget(requestedLevel, evidence, findings);
    }
  }

  if (kind === "revoke" && !evidence.revocationRef) {
    addFinding(findings, "TRUST_REVOKED_REQUIRES_REVOCATION_REF", "revoked requires a revocation or advisory reference.");
  }

  return {
    allowed: findings.length === 0 && kind !== "freeze",
    kind,
    from: input.from,
    to: input.to,
    policyEffect: "none",
    auditRequired: true,
    requiresRegistryReview: true,
    lifecycleEffect: kind === "revoke" ? "revoked" : undefined,
    findings,
  };
}
