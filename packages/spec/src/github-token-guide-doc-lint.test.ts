import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintGithubFineGrainedTokenGuide } from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");

describe("GitHub fine-grained token setup guide lint", () => {
  it("accepts the GitHub fine-grained token setup guide", async () => {
    const markdown = await readFile(resolve(repoRoot, "docs/教程/github-fine-grained-token-setup.md"), "utf8");

    expect(lintGithubFineGrainedTokenGuide(markdown)).toEqual([]);
  });

  it("reports missing least-privilege GitHub token setup boundaries", () => {
    const findings = lintGithubFineGrainedTokenGuide([
      "# GitHub token",
      "",
      "Create a token and put it in the environment.",
      "",
    ].join("\n"));

    expect(findings.map((finding) => finding.rule)).toEqual([
      "missing_official_sources",
      "missing_fine_grained_pat_preference",
      "missing_single_repository_scope",
      "missing_issues_write_permission",
      "missing_expiration_guidance",
      "missing_org_approval_note",
      "missing_env_only_setup",
      "missing_rotation_and_revocation",
      "missing_classic_token_warning",
    ]);
  });
});
