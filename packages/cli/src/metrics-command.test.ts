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

async function seedAuditEvents(stateDir: string): Promise<void> {
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
    JSON.stringify({
      owner: "opencap",
      repo: "runtime",
      title: "Bug",
      body: "secret customer text",
      token: "super-secret-token",
    }),
    "--yes",
    "--json",
  ], { allowFailure: true });
}

describe("OpenCap CLI metrics summary command", () => {
  it("prints a redacted local metrics summary as JSON", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-metrics-state-"));

    try {
      await seedAuditEvents(stateDir);

      const result = await runOpenCapCli([
        "metrics",
        "summary",
        "--state-dir",
        stateDir,
        "--capability",
        "github.create_issue",
        "--json",
      ]);
      const summary = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(summary).toMatchObject({
        schemaVersion: "opencap.local_metrics.v1",
        capabilityId: "github.create_issue",
        invocationsTotal: 2,
        statusCounts: {
          dry_run: 1,
          blocked: 1,
          executed: 0,
          denied: 0,
        },
        secretMissingTotal: 1,
        policyEffect: "none",
      });
      expect(result.stdout).not.toContain("secret customer text");
      expect(result.stdout).not.toContain("super-secret-token");
      expect(result.stdout).not.toContain("inputRedactedJson");
      expect(result.stderr).not.toContain("Error:");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable metrics summary", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-metrics-state-"));

    try {
      await seedAuditEvents(stateDir);

      const result = await runOpenCapCli([
        "metrics",
        "summary",
        "--state-dir",
        stateDir,
        "--capability",
        "github.create_issue",
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("OpenCap local metrics");
      expect(result.stdout).toContain("invocations: 2");
      expect(result.stdout).toContain("status: executed=0 dry_run=1 blocked=1 denied=0");
      expect(result.stdout).toContain("secret missing: 1");
      expect(result.stdout).not.toContain("secret customer text");
      expect(result.stdout).not.toContain("super-secret-token");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns user errors for invalid time filters without printing a stack", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-metrics-state-"));

    try {
      const invalidSince = await runOpenCapCli([
        "metrics",
        "summary",
        "--state-dir",
        stateDir,
        "--since",
        "not-a-date",
      ], { allowFailure: true });
      expect(invalidSince.exitCode).toBe(1);
      expect(invalidSince.stdout).toBe("");
      expect(invalidSince.stderr).toContain("Invalid --since value: not-a-date");
      expect(invalidSince.stderr).not.toContain("Error:");
      expect(invalidSince.stderr).not.toContain("at ");

      const invalidUntil = await runOpenCapCli([
        "metrics",
        "summary",
        "--state-dir",
        stateDir,
        "--until",
        "nope",
      ], { allowFailure: true });
      expect(invalidUntil.exitCode).toBe(1);
      expect(invalidUntil.stdout).toBe("");
      expect(invalidUntil.stderr).toContain("Invalid --until value: nope");
      expect(invalidUntil.stderr).not.toContain("Error:");
      expect(invalidUntil.stderr).not.toContain("at ");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints per-capability metrics as redacted JSON", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-metrics-state-"));

    try {
      await seedAuditEvents(stateDir);

      const result = await runOpenCapCli([
        "metrics",
        "capabilities",
        "--state-dir",
        stateDir,
        "--json",
      ]);
      const report = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(report).toMatchObject({
        schemaVersion: "opencap.local_metrics_capabilities.v1",
        policyEffect: "none",
      });
      expect(report.capabilities).toEqual([
        expect.objectContaining({
          capabilityId: "github.create_issue",
          invocationsTotal: 2,
          statusCounts: {
            dry_run: 1,
            blocked: 1,
            executed: 0,
            denied: 0,
          },
          policyDecisionCounts: {
            allow: expect.any(Number),
            ask: expect.any(Number),
            deny: 0,
          },
          errorRate: 0.5,
          lastSeenAt: expect.any(String),
        }),
      ]);
      expect(result.stdout).not.toContain("secret customer text");
      expect(result.stdout).not.toContain("super-secret-token");
      expect(result.stdout).not.toContain("inputRedactedJson");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints security metrics as JSON and human-readable output", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-metrics-state-"));

    try {
      await seedAuditEvents(stateDir);

      const jsonResult = await runOpenCapCli([
        "metrics",
        "security",
        "--state-dir",
        stateDir,
        "--json",
      ]);
      const report = JSON.parse(jsonResult.stdout);

      expect(jsonResult.exitCode).toBe(0);
      expect(report).toMatchObject({
        schemaVersion: "opencap.local_metrics_security.v1",
        deniedTotal: 0,
        outboundBlockedTotal: 0,
        dataEgressDeniedTotal: 0,
        secretMissingTotal: 1,
        auditPreflightFailedTotal: 0,
        policyEffect: "none",
      });
      expect(jsonResult.stdout).not.toContain("secret customer text");
      expect(jsonResult.stdout).not.toContain("super-secret-token");

      const humanResult = await runOpenCapCli([
        "metrics",
        "security",
        "--state-dir",
        stateDir,
      ]);
      expect(humanResult.exitCode).toBe(0);
      expect(humanResult.stdout).toContain("OpenCap security metrics");
      expect(humanResult.stdout).toContain("secret missing: 1");
      expect(humanResult.stdout).not.toContain("secret customer text");
      expect(humanResult.stdout).not.toContain("super-secret-token");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);
});
