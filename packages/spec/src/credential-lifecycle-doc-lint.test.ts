import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintCredentialLifecycleRunbook } from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");

describe("credential lifecycle runbook lint", () => {
  it("accepts the V1 credential lifecycle runbook", async () => {
    const markdown = await readFile(resolve(repoRoot, "docs/运营/credential-lifecycle.md"), "utf8");

    expect(lintCredentialLifecycleRunbook(markdown)).toEqual([]);
  });

  it("reports missing credential lifecycle smoke boundaries", () => {
    const findings = lintCredentialLifecycleRunbook([
      "# Credential lifecycle",
      "",
      "Credentials are configured by users.",
      "",
    ].join("\n"));

    expect(findings.map((finding) => finding.rule)).toEqual([
      "missing_env_only_model",
      "missing_policy_consent_order",
      "missing_no_secret_storage",
      "missing_rotation_without_manifest_change",
      "missing_missing_env_error",
      "missing_external_401_distinction",
      "missing_audit_redaction",
      "missing_list_redaction",
    ]);
  });
});
