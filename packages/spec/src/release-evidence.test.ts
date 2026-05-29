import { describe, expect, it } from "vitest";
import { buildReleaseEvidenceBundle } from "./index.js";
import type { ConformanceSummary, NpmPackageReadinessReport, RegistryQualitySummary } from "./index.js";

function registrySummary(overrides: Partial<RegistryQualitySummary> = {}): RegistryQualitySummary {
  return {
    schemaVersion: "opencap.registry_quality_summary.v1",
    registryRoot: "registry",
    generatedAt: "2026-05-28T00:00:00.000Z",
    capabilities: [],
    invalidManifests: [],
    invalidAdvisories: [],
    policyEffect: "none",
    ...overrides,
  } as RegistryQualitySummary;
}

function conformanceSummary(overrides: Partial<ConformanceSummary> = {}): ConformanceSummary {
  return {
    schemaVersion: "opencap.conformance_summary.v1",
    suiteVersion: "0.1.0",
    recordRoot: "packages/runtime/test/fixtures/conformance",
    generatedAt: "2026-05-28T00:00:00.000Z",
    recordCount: 1,
    passedRecords: 1,
    failedRecords: 0,
    invalidRecords: 0,
    profiles: ["opencap.policy_governance.v1"],
    records: [],
    invalid: [],
    policyEffect: "none",
    ...overrides,
  } as ConformanceSummary;
}

function packageReadiness(overrides: Partial<NpmPackageReadinessReport> = {}): NpmPackageReadinessReport {
  return {
    schemaVersion: "opencap.npm_package_readiness.v1",
    packageName: "@opencap/spec",
    version: "0.1.0",
    candidate: true,
    metadata: {
      private: false,
      hasMain: true,
      hasTypes: true,
      hasBin: false,
      hasFilesAllowlist: true,
      files: ["dist", "schema", "package.json"],
      exportKeys: [".", "./package.json"],
    },
    pack: {
      evidence: "provided",
      fileCount: 5,
      totalSize: 1234,
      forbiddenFiles: [],
    },
    blockers: [],
    warnings: [],
    policyEffect: "none",
    ...overrides,
  };
}

describe("release evidence bundle", () => {
  it("builds a candidate release evidence bundle from local reports", () => {
    const bundle = buildReleaseEvidenceBundle({
      target: "v0.1 Local Runtime",
      commit: "abc123",
      date: "2026-05-28",
      registryQualitySummary: registrySummary(),
      conformanceSummary: conformanceSummary(),
      packageReadinessReports: [packageReadiness()],
      commands: {
        pnpm_validate: "pass",
        pnpm_test: "pass",
      },
    });

    expect(bundle).toMatchObject({
      schemaVersion: "opencap.release_evidence.v1",
      target: "v0.1 Local Runtime",
      commit: "abc123",
      decision: "candidate",
      policyEffect: "none",
      blockers: [],
      components: {
        registry: {
          status: "pass",
          invalidManifestCount: 0,
          invalidAdvisoryCount: 0,
        },
        conformance: {
          status: "pass",
          failedRecords: 0,
          invalidRecords: 0,
        },
      },
    });
    expect(bundle.components.packages[0]).toMatchObject({
      packageName: "@opencap/spec",
      status: "pass",
      packEvidence: "provided",
      blockerCodes: [],
    });
  });

  it("separates blockers from decision and redacts sensitive text", () => {
    const bundle = buildReleaseEvidenceBundle({
      target: "v0.1 Local Runtime",
      commit: "abc123",
      date: "2026-05-28",
      registryQualitySummary: registrySummary({
        invalidManifests: [{}] as RegistryQualitySummary["invalidManifests"],
        capabilities: [
          {
            id: "http.request_demo",
            blockingReasons: ["advisory:OCAP-2026-0001:revoked"],
            policyEffect: "none",
          },
        ] as RegistryQualitySummary["capabilities"],
      }),
      conformanceSummary: conformanceSummary({
        failedRecords: 1,
        invalidRecords: 1,
      }),
      packageReadinessReports: [
        packageReadiness({
          blockers: [
            {
              code: "NPM_PACKAGE_PRIVATE",
              severity: "blocker",
              message: "private package contains super-secret-token",
            },
          ],
        }),
      ],
      commands: {
        pnpm_validate: "pass",
        pnpm_test: "fail",
      },
      knownGaps: ["Do not leak NPM_TOKEN or /Users/example/private/path"],
    });

    expect(bundle.decision).toBe("block-release-tag");
    expect(bundle.blockers.map((blocker) => blocker.code)).toEqual(expect.arrayContaining([
      "REGISTRY_INVALID_MANIFESTS",
      "REGISTRY_CAPABILITY_BLOCKER",
      "CONFORMANCE_FAILED_RECORDS",
      "CONFORMANCE_INVALID_RECORDS",
      "PACKAGE_READINESS_BLOCKER",
      "COMMAND_FAILED",
    ]));
    expect(JSON.stringify(bundle)).not.toContain("super-secret-token");
    expect(JSON.stringify(bundle)).not.toContain("NPM_TOKEN");
    expect(JSON.stringify(bundle)).not.toContain("/Users/example/private/path");
    expect(bundle.policyEffect).toBe("none");
  });
});
