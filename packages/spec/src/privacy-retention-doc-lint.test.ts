import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintPrivacyRetentionDoc } from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");

describe("privacy retention doc lint", () => {
  it("accepts the V1 privacy retention document", async () => {
    const markdown = await readFile(resolve(repoRoot, "docs/安全/privacy-retention-v1.md"), "utf8");

    expect(lintPrivacyRetentionDoc(markdown)).toEqual([]);
  });

  it("reports missing privacy retention boundaries in incomplete docs", () => {
    const findings = lintPrivacyRetentionDoc([
      "# Privacy",
      "",
      "Audit logs exist.",
      "Users can inspect summaries.",
      "",
    ].join("\n"));

    expect(findings.map((finding) => finding.rule)).toEqual([
      "missing_local_first_boundary",
      "missing_no_remote_telemetry",
      "missing_secret_redaction",
      "missing_input_hash",
      "missing_retention_policy",
      "missing_manual_deletion",
      "missing_host_log_boundary",
      "missing_non_goals",
    ]);
  });
});
