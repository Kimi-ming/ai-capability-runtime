import { execFile } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(cliSourceFile), "../../..");
const cliEntry = resolve(repoRoot, "packages/cli/src/index.ts");
const registryRoot = resolve(repoRoot, "registry");

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

describe("OpenCap CLI registry report command", () => {
  it("prints a redacted registry quality summary as JSON without mutating local state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-report-"));

    try {
      const result = await runOpenCapCli(["registry", "report", "--registry", registryRoot, "--json"], { cwd });
      const summary = JSON.parse(result.stdout) as {
        schemaVersion: string;
        policyEffect: string;
        capabilities: Array<{
          id: string;
          category: string;
          advisory: { status: string; ids: string[] };
          qualityScore: { band: string; policyEffect: string };
          defaultInstallTrusted: boolean;
          blockingReasons: string[];
        }>;
      };

      expect(result.exitCode).toBe(0);
      expect(await pathExists(join(cwd, "opencap.local"))).toBe(false);
      expect(summary.schemaVersion).toBe("opencap.registry_quality_summary.v1");
      expect(summary.policyEffect).toBe("none");
      expect(summary.capabilities).toHaveLength(5);
      expect(summary.capabilities.every((capability) => capability.qualityScore.policyEffect === "none")).toBe(true);
      expect(summary.capabilities.find((capability) => capability.id === "http.request_demo")).toMatchObject({
        category: "developer-tools",
        advisory: {
          status: "revoked",
          ids: ["OCAP-2026-0001"],
        },
        defaultInstallTrusted: false,
        blockingReasons: expect.arrayContaining(["advisory:OCAP-2026-0001:revoked"]),
      });
      expect(result.stdout).not.toContain("GITHUB_TOKEN");
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("OpenCap smoke test message");
      expect(result.stdout).not.toContain("C0123456789");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable registry report with quality and blocking summaries", async () => {
    const result = await runOpenCapCli(["registry", "report", "--registry", registryRoot]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("id category lifecycle advisory quality default_install blocking_reasons");
    expect(result.stdout).toContain("github.create_issue developer-tools active none");
    expect(result.stdout).toContain("http.request_demo developer-tools active revoked");
    expect(result.stdout).toContain("advisory:OCAP-2026-0001:revoked");
    expect(result.stdout).toContain("metadata:unsafe_by_default");
  }, 60_000);
});
