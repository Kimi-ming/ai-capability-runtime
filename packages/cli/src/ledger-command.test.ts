import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(cliSourceFile), "../../..");
const cliEntry = resolve(repoRoot, "packages/cli/src/index.ts");

type CliResult = {
  stdout: string;
  stderr: string;
  exitCode: number | string;
};

async function runOpenCapCli(args: string[], options: { allowFailure?: boolean } = {}): Promise<CliResult> {
  try {
    const result = await execFileAsync("tsx", [cliEntry, ...args], {
      cwd: repoRoot,
      env: { ...process.env, INIT_CWD: repoRoot },
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });

    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string; code?: number | string };
    if (options.allowFailure) {
      return { stdout: failure.stdout ?? "", stderr: failure.stderr ?? "", exitCode: failure.code ?? "unknown" };
    }
    throw error;
  }
}

describe("OpenCap CLI ledger export command", () => {
  it("prints a friendly message for an empty ledger", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-ledger-state-"));

    try {
      const result = await runOpenCapCli(["ledger", "export", "--state-dir", stateDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("No ledger records found.");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("exports redacted ledger records as JSON with kind, capability, and limit filters", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-ledger-state-"));

    try {
      await runOpenCapCli(["install", "github.create_issue", "--state-dir", stateDir]);
      await runOpenCapCli([
        "invoke",
        "github.create_issue",
        "--dry-run",
        "--state-dir",
        stateDir,
        "--input",
        "examples/github-issue-capability/input.json",
        "--json",
      ]);
      await runOpenCapCli([
        "invoke",
        "github.create_issue",
        "--state-dir",
        stateDir,
        "--input-json",
        JSON.stringify({ owner: "opencap", repo: "runtime", title: "Bug", body: "broken", token: "input-secret" }),
        "--yes",
        "--json",
      ], { allowFailure: true });

      const all = await runOpenCapCli(["ledger", "export", "--state-dir", stateDir, "--json"]);
      const allRecords = JSON.parse(all.stdout);
      expect(allRecords).toEqual(expect.arrayContaining([
        expect.objectContaining({ recordKind: "capability", capability: expect.objectContaining({ id: "github.create_issue" }) }),
        expect.objectContaining({ recordKind: "invocation", status: "dry_run" }),
        expect.objectContaining({ recordKind: "invocation", status: "blocked" }),
      ]));
      expect(all.stdout).not.toContain("input-secret");
      expect(all.stdout).not.toContain("broken");

      const invocationOnly = await runOpenCapCli([
        "ledger",
        "export",
        "--state-dir",
        stateDir,
        "--json",
        "--kind",
        "invocation",
        "--capability",
        "github.create_issue",
        "--limit",
        "1",
      ]);
      const invocationRecords = JSON.parse(invocationOnly.stdout);

      expect(invocationRecords).toHaveLength(1);
      expect(invocationRecords[0]).toMatchObject({
        recordKind: "invocation",
        capability: { id: "github.create_issue" },
      });
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns user errors for invalid filters without printing a stack", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-ledger-state-"));

    try {
      const invalidKind = await runOpenCapCli([
        "ledger",
        "export",
        "--state-dir",
        stateDir,
        "--kind",
        "secret",
      ], { allowFailure: true });
      expect(invalidKind.exitCode).toBe(1);
      expect(invalidKind.stdout).toBe("");
      expect(invalidKind.stderr).toContain("Invalid --kind value: secret");
      expect(invalidKind.stderr).not.toContain("Error:");
      expect(invalidKind.stderr).not.toContain("at ");

      const invalidLimit = await runOpenCapCli([
        "ledger",
        "export",
        "--state-dir",
        stateDir,
        "--limit",
        "nope",
      ], { allowFailure: true });
      expect(invalidLimit.exitCode).toBe(1);
      expect(invalidLimit.stdout).toBe("");
      expect(invalidLimit.stderr).toContain("Invalid --limit value: nope");
      expect(invalidLimit.stderr).not.toContain("Error:");
      expect(invalidLimit.stderr).not.toContain("at ");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);
});
