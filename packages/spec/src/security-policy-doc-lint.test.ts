import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintSecurityPolicyDoc } from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");

describe("SECURITY.md policy lint", () => {
  it("accepts the repository security policy", async () => {
    const markdown = await readFile(resolve(repoRoot, "SECURITY.md"), "utf8");

    expect(lintSecurityPolicyDoc(markdown)).toEqual([]);
  });

  it("reports missing private reporting boundaries", () => {
    const findings = lintSecurityPolicyDoc([
      "# Security",
      "",
      "Please report issues responsibly.",
      "",
    ].join("\n"));

    expect(findings.map((finding) => finding.rule)).toEqual([
      "missing_private_vulnerability_reporting",
      "missing_no_public_issue",
      "missing_sensitive_material_boundary",
      "missing_report_contents",
      "missing_maintainer_triage_flow",
      "missing_advisory_process_link",
      "missing_enablement_note",
      "missing_official_github_docs",
    ]);
  });
});
