import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintNpmPublishWorkflowFile } from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");
const workflowPath = resolve(repoRoot, ".github/workflows/npm-publish.yml");

async function writeWorkflowFixture(content: string): Promise<{ dir: string; file: string }> {
  const dir = await mkdtemp(join(tmpdir(), "opencap-npm-workflow-lint-"));
  const file = join(dir, "npm-publish.yml");
  await writeFile(file, content, "utf8");
  return { dir, file };
}

describe("npm publish workflow lint", () => {
  it("accepts the real manual dry-run npm publish workflow", async () => {
    const result = await lintNpmPublishWorkflowFile(workflowPath);

    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("rejects automatic triggers, non-candidate packages, token auth, and real publish commands", async () => {
    const fixture = await writeWorkflowFixture(`
name: unsafe npm publish
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      package:
        type: choice
        options:
          - "@opencap/runtime"
      dry_run:
        type: boolean
        default: false
permissions:
  contents: write
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: echo "$\{{ secrets.NPM_TOKEN }}"
      - run: pnpm --filter "@opencap/runtime" publish --provenance --access public
`);

    try {
      const result = await lintNpmPublishWorkflowFile(fixture.file);

      expect(result.ok).toBe(false);
      expect(result.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining([
        "NPM_PUBLISH_WORKFLOW_AUTOMATIC_TRIGGER",
        "NPM_PUBLISH_WORKFLOW_DRY_RUN_DEFAULT_REQUIRED",
        "NPM_PUBLISH_WORKFLOW_PACKAGE_NOT_ALLOWED",
        "NPM_PUBLISH_WORKFLOW_FORBIDS_NPM_TOKEN",
        "NPM_PUBLISH_WORKFLOW_REAL_PUBLISH_FORBIDDEN",
        "NPM_PUBLISH_WORKFLOW_CONTENTS_READ_REQUIRED",
      ]));
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
