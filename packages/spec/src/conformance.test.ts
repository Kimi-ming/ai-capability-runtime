import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import {
  CONFORMANCE_SUITE_VERSION,
  CORE_CONFORMANCE_GROUPS,
  validateConformanceRecord,
} from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");

async function loadYaml(path: string): Promise<unknown> {
  return YAML.parse(await readFile(resolve(repoRoot, path), "utf8"));
}

describe("conformance suite skeleton", () => {
  it("declares stable V1 core conformance groups", () => {
    expect(CONFORMANCE_SUITE_VERSION).toBe("0.1.0");
    expect(CORE_CONFORMANCE_GROUPS).toEqual([
      "C-MAN",
      "C-PKG",
      "C-RUN",
      "C-POL",
      "C-PG",
      "C-CON",
      "C-AUD",
      "C-HTTP",
      "C-MCP",
      "C-REG",
      "C-SEC",
    ]);
  });

  it("accepts existing runtime conformance records", async () => {
    for (const path of [
      "packages/runtime/test/fixtures/conformance/policy-governance.yml",
      "packages/runtime/test/fixtures/conformance/threat-model-abuse-cases.yml",
      "packages/runtime/test/fixtures/conformance/agentic-abuse-cases.yml",
      "packages/runtime/test/fixtures/conformance/execution-evidence.yml",
    ]) {
      await expect(loadYaml(path).then(validateConformanceRecord)).resolves.toEqual([]);
    }
  });

  it("rejects incomplete conformance records", () => {
    const issues = validateConformanceRecord({
      subject: { type: "runtime" },
      profile: "policy_governance",
      result: "passed",
      checks: {},
      artifacts: [],
    });

    expect(issues.map((issue) => issue.keyword)).toEqual([
      "conformance-record:missing_subject_name",
      "conformance-record:missing_subject_version",
      "conformance-record:invalid_profile",
      "conformance-record:missing_suite_version",
      "conformance-record:invalid_result",
      "conformance-record:missing_checks",
      "conformance-record:missing_artifacts",
    ]);
  });

  it("rejects unsafe artifact paths", () => {
    const issues = validateConformanceRecord({
      subject: { type: "runtime", name: "opencap-runtime", version: "0.1.0-dev" },
      profile: "opencap.policy_governance.v1",
      suite_version: "0.1.0",
      result: "pass",
      checks: { "C-PG-001": "pass" },
      artifacts: [{ path: "../secret.txt" }, { path: "/tmp/private.log" }],
    });

    expect(issues).toEqual([
      expect.objectContaining({ fieldPath: "/artifacts/0/path", keyword: "conformance-record:unsafe_artifact_path" }),
      expect.objectContaining({ fieldPath: "/artifacts/1/path", keyword: "conformance-record:unsafe_artifact_path" }),
    ]);
  });
});
