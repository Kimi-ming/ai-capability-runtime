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

async function runOpenCapCli(args: string[]): Promise<CliResult> {
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
    return { stdout: failure.stdout ?? "", stderr: failure.stderr ?? "", exitCode: failure.code ?? "unknown" };
  }
}

describe("OpenCap CLI error exit codes", () => {
  it("returns exit 1 for user-correctable invoke errors", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-error-exit-state-"));

    try {
      const missingCapability = await runOpenCapCli([
        "invoke",
        "github.create_issue",
        "--state-dir",
        stateDir,
        "--json",
      ]);
      expect(missingCapability.exitCode).toBe(1);
      expect(missingCapability.stdout).toBe("");
      expect(missingCapability.stderr).toContain("Installed capability not found: github.create_issue");
      expect(missingCapability.stderr).not.toContain("Error:");
      expect(missingCapability.stderr).not.toContain("at ");

      const invalidInputJson = await runOpenCapCli([
        "invoke",
        "github.create_issue",
        "--state-dir",
        stateDir,
        "--input-json",
        "{",
      ]);
      expect(invalidInputJson.exitCode).toBe(1);
      expect(invalidInputJson.stdout).toBe("");
      expect(invalidInputJson.stderr).toContain("Invalid --input-json value");
      expect(invalidInputJson.stderr).not.toContain("SyntaxError");
      expect(invalidInputJson.stderr).not.toContain("at ");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns exit 1 for invalid command option values", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-error-exit-state-"));

    try {
      const invalidLimit = await runOpenCapCli(["logs", "--state-dir", stateDir, "--limit", "nope"]);

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
