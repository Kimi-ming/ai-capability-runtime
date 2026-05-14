import { describe, expect, it } from "vitest";
import { evaluateTrustLevelTransition } from "./index.js";

describe("Trust level transition contract", () => {
  it("allows stepwise upgrades only when the required evidence is present", () => {
    const transition = evaluateTrustLevelTransition({
      from: "listed",
      to: "tested",
      evidence: {
        registryTests: "passing",
        conformanceRef: "registry/developer-tools/github.create_issue/tests/basic.yml",
        openHighAdvisories: 0,
      },
      reason: "Registry tests and conformance passed.",
    });

    expect(transition).toMatchObject({
      allowed: true,
      kind: "upgrade",
      from: "listed",
      to: "tested",
      policyEffect: "none",
      auditRequired: true,
      requiresRegistryReview: true,
      findings: [],
    });
  });

  it("denies skipped upgrades and reports missing evidence", () => {
    const transition = evaluateTrustLevelTransition({
      from: "listed",
      to: "official",
      evidence: {
        registryTests: "passing",
        openHighAdvisories: 0,
      },
      reason: "Skipping review for a trusted maintainer.",
    });

    expect(transition.allowed).toBe(false);
    expect(transition.kind).toBe("upgrade");
    expect(transition.policyEffect).toBe("none");
    expect(transition.findings.map((finding) => finding.code)).toEqual([
      "TRUST_UPGRADE_MUST_BE_STEPWISE",
      "TRUST_OFFICIAL_REQUIRES_CORE_MAINTAINER",
      "TRUST_OFFICIAL_REQUIRES_RELEASE_GATE",
    ]);
  });

  it("freezes promotion while high advisories or failing tests are present", () => {
    const transition = evaluateTrustLevelTransition({
      from: "listed",
      to: "tested",
      evidence: {
        registryTests: "failing",
        conformanceRef: "registry/developer-tools/github.create_issue/tests/basic.yml",
        openHighAdvisories: 1,
      },
      reason: "Promotion requested before advisory is closed.",
    });

    expect(transition).toMatchObject({
      allowed: false,
      kind: "freeze",
      from: "listed",
      to: "tested",
      policyEffect: "none",
      auditRequired: true,
      requiresRegistryReview: true,
    });
    expect(transition.findings.map((finding) => finding.code)).toContain("TRUST_TRANSITION_FROZEN_BY_HIGH_ADVISORY");
  });

  it("allows downgrade and revocation transitions without granting policy authority", () => {
    const downgrade = evaluateTrustLevelTransition({
      from: "maintainer_verified",
      to: "listed",
      evidence: {
        reviewDigest: "sha256:review",
        reasonRef: "OCAP-2026-0001",
      },
      reason: "Maintainer verification expired.",
    });
    const revoked = evaluateTrustLevelTransition({
      from: "tested",
      to: "revoked",
      evidence: {
        revocationRef: "OCAP-2026-0002",
        openHighAdvisories: 1,
      },
      reason: "Credential leak advisory is unresolved.",
    });

    expect(downgrade).toMatchObject({
      allowed: true,
      kind: "downgrade",
      policyEffect: "none",
      lifecycleEffect: undefined,
    });
    expect(revoked).toMatchObject({
      allowed: true,
      kind: "revoke",
      policyEffect: "none",
      lifecycleEffect: "revoked",
    });
  });
});
