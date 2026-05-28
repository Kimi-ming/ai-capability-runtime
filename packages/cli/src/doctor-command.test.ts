import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

async function runOpenCapCli(args: string[], options: { allowFailure?: boolean; env?: NodeJS.ProcessEnv } = {}): Promise<CliResult> {
  try {
    const result = await execFileAsync("tsx", [cliEntry, ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...options.env, INIT_CWD: repoRoot },
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

describe("OpenCap CLI doctor command", () => {
  it("prints empty state diagnostics as redacted JSON", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-doctor-state-"));

    try {
      const result = await runOpenCapCli([
        "doctor",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--json",
      ], { env: { OPENCAP_DOCTOR_SECRET: "super-secret-token" } });
      const report = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(report).toMatchObject({
        schemaVersion: "opencap.doctor.v1",
        environment: {
          node: expect.stringMatching(/^v\d+\./),
          pnpm: expect.any(String),
        },
        registry: {
          path: registryRoot,
          status: "ok",
        },
        stateDir: {
          path: stateDir,
          status: "ok",
          writable: "ok",
        },
        installed: {
          total: 0,
          valid: 0,
          invalid: 0,
        },
        policy: {
          path: join(stateDir, "policies.yml"),
          status: "ok",
        },
        packages: {
          cli: "0.1.0",
          spec: "0.1.0",
          runtime: "0.1.0",
          mcp: "0.1.0",
          sdkJs: "0.1.0",
        },
      });
      expect(result.stdout).not.toContain("super-secret-token");
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("GITHUB_TOKEN");
      expect(result.stderr).not.toContain("Error:");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("reports installed and invalid entries in JSON without changing human output", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-doctor-state-"));

    try {
      await runOpenCapCli(["install", "github.search_repo", "--state-dir", stateDir]);
      await mkdir(join(stateDir, "installed", "broken.capability"), { recursive: true });
      await writeFile(join(stateDir, "installed", "broken.capability", "manifest.yml"), "id: broken.capability\n", "utf8");

      const jsonResult = await runOpenCapCli([
        "doctor",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--json",
      ]);
      const report = JSON.parse(jsonResult.stdout);

      expect(jsonResult.exitCode).toBe(0);
      expect(report.installed).toEqual({
        total: 2,
        valid: 1,
        invalid: 1,
      });

      const humanResult = await runOpenCapCli(["doctor", "--state-dir", stateDir, "--registry", registryRoot]);
      expect(humanResult.exitCode).toBe(0);
      expect(humanResult.stdout).toContain("OpenCap doctor");
      expect(humanResult.stdout).toContain("installed: 2 total, 1 invalid");
      expect(humanResult.stdout).toContain(`policy: ok ${join(stateDir, "policies.yml")}`);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);
});
