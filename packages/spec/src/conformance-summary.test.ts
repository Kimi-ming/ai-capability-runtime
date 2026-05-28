import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildConformanceSummary } from "./index.js";

const testSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testSourceFile), "../../..");
const conformanceRoot = resolve(repoRoot, "packages/runtime/test/fixtures/conformance");

describe("conformance summary", () => {
  it("summarizes current conformance records as evidence without policy authority", async () => {
    const summary = await buildConformanceSummary(conformanceRoot, {
      generatedAt: "2026-05-28T00:00:00Z",
    });

    expect(summary).toMatchObject({
      schemaVersion: "opencap.conformance_summary.v1",
      suiteVersion: "0.1.0",
      generatedAt: "2026-05-28T00:00:00Z",
      recordRoot: conformanceRoot,
      recordCount: 6,
      passedRecords: 6,
      failedRecords: 0,
      invalidRecords: 0,
      policyEffect: "none",
    });
    expect(summary.profiles).toEqual([
      "opencap.agentic_abuse_cases.v1",
      "opencap.composition_recovery.v1",
      "opencap.execution_evidence.v1",
      "opencap.policy_governance.v1",
      "opencap.threat_model_abuse_cases.v1",
      "opencap.usage_evidence.v1",
    ]);
    expect(summary.records.map((record) => record.path)).toEqual([
      "agentic-abuse-cases.yml",
      "composition-recovery.yml",
      "execution-evidence.yml",
      "policy-governance.yml",
      "threat-model-abuse-cases.yml",
      "usage-evidence.yml",
    ]);
    expect(summary.records.every((record) => record.checks.total > 0)).toBe(true);
    expect(summary.records.every((record) => record.artifacts.count > 0)).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("Authorization");
    expect(JSON.stringify(summary)).not.toContain("GITHUB_TOKEN");
  });

  it("reports invalid records without copying raw record data", async () => {
    const root = await mkdtemp(join(tmpdir(), "opencap-conformance-summary-"));
    await mkdir(join(root, "nested"), { recursive: true });
    await writeFile(join(root, "nested", "bad.yml"), `subject:
  type: runtime
profile: not-a-profile
result: passed
secret: super-secret-token
checks: {}
artifacts: []
`, "utf8");

    const summary = await buildConformanceSummary(root, {
      generatedAt: "2026-05-28T00:00:00Z",
    });

    expect(summary.recordCount).toBe(1);
    expect(summary.records).toEqual([]);
    expect(summary.invalidRecords).toBe(1);
    expect(summary.invalid).toEqual([
      expect.objectContaining({
        path: "nested/bad.yml",
        issues: expect.arrayContaining([
          expect.objectContaining({ keyword: "conformance-record:invalid_profile" }),
          expect.objectContaining({ keyword: "conformance-record:invalid_result" }),
          expect.objectContaining({ keyword: "conformance-record:missing_artifacts" }),
        ]),
      }),
    ]);
    expect(JSON.stringify(summary)).not.toContain("super-secret-token");
  });
});
