import { describe, expect, it } from "vitest";
import { buildReleaseEvidenceBundle, validateReleaseEvidenceArtifact } from "./index.js";

function validArtifact() {
  return buildReleaseEvidenceBundle({
    target: "v0.1 Local Runtime",
    commit: "abc123",
    date: "2026-05-29",
    generatedAt: "2026-05-29T12:34:56.789Z",
    registryQualitySummary: {
      schemaVersion: "opencap.registry_quality_summary.v1",
      registryRoot: "registry",
      generatedAt: "2026-05-29T12:34:56.789Z",
      capabilities: [],
      invalidManifests: [],
      invalidAdvisories: [],
      policyEffect: "none",
    },
    conformanceSummary: {
      schemaVersion: "opencap.conformance_summary.v1",
      suiteVersion: "0.1.0",
      recordRoot: "packages/runtime/test/fixtures/conformance",
      generatedAt: "2026-05-29T12:34:56.789Z",
      recordCount: 1,
      passedRecords: 1,
      failedRecords: 0,
      invalidRecords: 0,
      profiles: ["opencap.policy_governance.v1"],
      records: [],
      invalid: [],
      policyEffect: "none",
    },
    commands: {
      pnpm_validate: "pass",
      release_evidence_bundle: "pass",
    },
    knownGaps: ["real Host UI smoke is pending external evidence"],
  });
}

describe("release evidence artifact validation", () => {
  it("validates a saved release evidence bundle artifact", () => {
    const report = validateReleaseEvidenceArtifact(validArtifact());

    expect(report).toMatchObject({
      schemaVersion: "opencap.release_artifact_validation.v1",
      artifactSchemaVersion: "opencap.release_evidence.v1",
      valid: true,
      decision: "candidate",
      blockerCount: 0,
      findings: [],
      policyEffect: "none",
    });
  });

  it("reports structural and sensitive artifact findings without leaking details", () => {
    const artifact = {
      ...validArtifact(),
      generatedAt: "not-a-date",
      policyEffect: "allow",
      commands: {
        pnpm_validate: "maybe",
      },
      knownGaps: [
        "Do not leak NPM_TOKEN, Authorization: Bearer value, /Users/example/private/path, opencap.local/audit.sqlite, provider raw response",
      ],
    };

    const report = validateReleaseEvidenceArtifact(artifact);
    const codes = report.findings.map((finding) => finding.code);
    const reportJson = JSON.stringify(report);

    expect(report.valid).toBe(false);
    expect(codes).toEqual(expect.arrayContaining([
      "RELEASE_ARTIFACT_TIMESTAMP_INVALID",
      "RELEASE_ARTIFACT_POLICY_EFFECT_INVALID",
      "RELEASE_ARTIFACT_COMMAND_STATUS_INVALID",
      "RELEASE_ARTIFACT_SENSITIVE_TEXT",
    ]));
    expect(reportJson).not.toContain("NPM_TOKEN");
    expect(reportJson).not.toContain("Authorization: Bearer");
    expect(reportJson).not.toContain("/Users/example/private/path");
    expect(report.policyEffect).toBe("none");
  });

  it("rejects non release evidence artifacts", () => {
    const report = validateReleaseEvidenceArtifact({
      schemaVersion: "opencap.other.v1",
      policyEffect: "none",
    });

    expect(report.valid).toBe(false);
    expect(report.artifactSchemaVersion).toBe("opencap.other.v1");
    expect(report.findings.map((finding) => finding.code)).toContain("RELEASE_ARTIFACT_SCHEMA_VERSION_INVALID");
  });
});
