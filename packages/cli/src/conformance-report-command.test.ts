import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(cliSourceFile), "../../..");
const cliEntry = resolve(repoRoot, "packages/cli/src/index.ts");
const conformanceRoot = resolve(repoRoot, "packages/runtime/test/fixtures/conformance");

type CliResult = {
  stdout: string;
  stderr: string;
  exitCode: number | string;
};

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function runOpenCapCli(args: string[], options: { allowFailure?: boolean; cwd?: string } = {}): Promise<CliResult> {
  const cwd = options.cwd ?? repoRoot;
  try {
    const result = await execFileAsync("tsx", [cliEntry, ...args], {
      cwd,
      env: { ...process.env, INIT_CWD: cwd },
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

describe("OpenCap CLI conformance report command", () => {
  it("prints a conformance summary as JSON without mutating local state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-conformance-report-"));

    try {
      const result = await runOpenCapCli(["conformance", "report", "--records", conformanceRoot, "--json"], { cwd });
      const summary = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(await pathExists(join(cwd, "opencap.local"))).toBe(false);
      expect(summary).toMatchObject({
        schemaVersion: "opencap.conformance_summary.v1",
        suiteVersion: "0.1.0",
        recordCount: 6,
        passedRecords: 6,
        failedRecords: 0,
        invalidRecords: 0,
        policyEffect: "none",
      });
      expect(summary.profiles).toContain("opencap.composition_recovery.v1");
      expect(result.stdout).not.toContain("GITHUB_TOKEN");
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("super-secret-token");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable conformance report", async () => {
    const result = await runOpenCapCli(["conformance", "report", "--records", conformanceRoot]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("profile result checks artifacts path");
    expect(result.stdout).toContain("opencap.policy_governance.v1 pass 5 3 policy-governance.yml");
    expect(result.stdout).toContain("opencap.composition_recovery.v1 pass 5 4 composition-recovery.yml");
  }, 60_000);

  it("reports invalid records without printing raw record data", async () => {
    const recordsRoot = await mkdtemp(join(tmpdir(), "opencap-cli-conformance-invalid-"));
    await mkdir(join(recordsRoot, "nested"), { recursive: true });
    await writeFile(join(recordsRoot, "nested", "bad.yml"), `subject:
  type: runtime
profile: invalid
result: passed
secret: super-secret-token
checks: {}
artifacts: []
`, "utf8");

    try {
      const result = await runOpenCapCli(["conformance", "report", "--records", recordsRoot, "--json"], { allowFailure: true });
      const summary = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(1);
      expect(summary.invalidRecords).toBe(1);
      expect(summary.invalid[0].path).toBe("nested/bad.yml");
      expect(result.stdout).not.toContain("super-secret-token");
      expect(result.stderr).toBe("");
    } finally {
      await rm(recordsRoot, { recursive: true, force: true });
    }
  }, 60_000);

  it("writes conformance summary JSON evidence to safe output files", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-conformance-report-output-"));
    const jsonOutput = join(cwd, "reports", "conformance-summary.json");
    const humanOutput = join(cwd, "reports", "conformance-summary-human.json");

    try {
      const json = await runOpenCapCli([
        "conformance",
        "report",
        "--records",
        conformanceRoot,
        "--output",
        jsonOutput,
        "--json",
      ], { cwd });
      const stdoutReport = JSON.parse(json.stdout) as { schemaVersion: string; recordCount: number };
      const fileReport = JSON.parse(await readFile(jsonOutput, "utf8")) as typeof stdoutReport;

      expect(json.exitCode).toBe(0);
      expect(fileReport).toEqual(stdoutReport);
      expect(fileReport.schemaVersion).toBe("opencap.conformance_summary.v1");
      expect(fileReport.recordCount).toBe(6);

      const human = await runOpenCapCli([
        "conformance",
        "report",
        "--records",
        conformanceRoot,
        "--output",
        humanOutput,
      ], { cwd });
      const humanFileReport = JSON.parse(await readFile(humanOutput, "utf8")) as { schemaVersion: string; recordCount: number };

      expect(human.exitCode).toBe(0);
      expect(human.stdout).toContain("profile result checks artifacts path");
      expect(human.stdout.trim().startsWith("{")).toBe(false);
      expect(humanFileReport.schemaVersion).toBe("opencap.conformance_summary.v1");
      expect(humanFileReport.recordCount).toBe(6);
      expect(await pathExists(join(cwd, "opencap.local"))).toBe(false);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("writes invalid conformance summary output without raw record secrets", async () => {
    const recordsRoot = await mkdtemp(join(tmpdir(), "opencap-cli-conformance-invalid-output-"));
    const outputPath = join(recordsRoot, "reports", "conformance-invalid.json");
    await mkdir(join(recordsRoot, "nested"), { recursive: true });
    await writeFile(join(recordsRoot, "nested", "bad.yml"), `subject:
  type: runtime
profile: invalid
result: passed
secret: super-secret-token
checks: {}
artifacts: []
`, "utf8");

    try {
      const result = await runOpenCapCli([
        "conformance",
        "report",
        "--records",
        recordsRoot,
        "--output",
        outputPath,
        "--json",
      ], { allowFailure: true });
      const stdoutReport = JSON.parse(result.stdout);
      const fileReport = JSON.parse(await readFile(outputPath, "utf8"));

      expect(result.exitCode).toBe(1);
      expect(fileReport).toEqual(stdoutReport);
      expect(fileReport.invalidRecords).toBe(1);
      expect(JSON.stringify(fileReport)).not.toContain("super-secret-token");
      expect(result.stdout).not.toContain("super-secret-token");
      expect(result.stderr).toBe("");
    } finally {
      await rm(recordsRoot, { recursive: true, force: true });
    }
  }, 60_000);

  it("rejects unsafe conformance report output paths without partial files", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-conformance-report-output-"));
    const outputPath = join(cwd, ".env.conformance-summary.json");

    try {
      const result = await runOpenCapCli([
        "conformance",
        "report",
        "--records",
        conformanceRoot,
        "--output",
        outputPath,
      ], { allowFailure: true, cwd });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Unsafe --output path:");
      expect(result.stderr).not.toMatch(/\n\s+at /);
      expect(await pathExists(outputPath)).toBe(false);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);
});
