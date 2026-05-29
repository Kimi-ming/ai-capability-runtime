import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

async function writeInvalidAdvisory(root: string): Promise<void> {
  const advisoryDir = join(root, "advisories");
  await mkdir(advisoryDir, { recursive: true });
  await writeFile(join(advisoryDir, "OCAP-2099-0003.yml"), "id: not-an-advisory\n", "utf8");
}

describe("OpenCap CLI registry advisory list command", () => {
  it("prints local Registry advisory metadata as JSON without mutating state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-advisory-list-"));

    try {
      const result = await runOpenCapCli(["registry", "advisory", "list", "--registry", registryRoot, "--json"], { cwd });
      const report = JSON.parse(result.stdout) as {
        schemaVersion: string;
        policyEffect: string;
        registryPath: string;
        advisoryCount: number;
        invalidAdvisoryCount: number;
        advisories: Array<{
          id: string;
          capability: string;
          severity: string;
          status: string;
          registryAction: string;
          runtimeDefault: string;
          modifiedAt: string;
        }>;
      };

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(report.schemaVersion).toBe("opencap.registry_advisory_list.v1");
      expect(report.policyEffect).toBe("none");
      expect(report.registryPath).toBe(registryRoot);
      expect(report.advisoryCount).toBe(1);
      expect(report.invalidAdvisoryCount).toBe(0);
      expect(report.advisories).toEqual([
        expect.objectContaining({
          id: "OCAP-2026-0001",
          capability: "http.request_demo",
          severity: "critical",
          status: "revoked",
          registryAction: "revoke",
          runtimeDefault: "deny",
          modifiedAt: "2026-05-14T00:00:00Z",
        }),
      ]);
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("provider raw response");
      await expect(readFile(join(cwd, "opencap.local", "logs.sqlite"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable advisory table and friendly empty summary", async () => {
    const result = await runOpenCapCli(["registry", "advisory", "list", "--registry", registryRoot]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("advisory capability severity status registry_action runtime_default modified_at");
    expect(result.stdout).toContain("OCAP-2026-0001 http.request_demo critical revoked revoke deny 2026-05-14T00:00:00Z");

    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-advisory-list-"));
    try {
      const empty = await runOpenCapCli(["registry", "advisory", "list", "--registry", dir]);
      expect(empty.exitCode).toBe(0);
      expect(empty.stdout).toContain("No registry advisories found.");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("emits invalid advisory summaries and exits 1 in JSON mode", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-advisory-list-"));

    try {
      await writeInvalidAdvisory(dir);

      const result = await runOpenCapCli([
        "registry",
        "advisory",
        "list",
        "--registry",
        dir,
        "--json",
      ], { allowFailure: true });
      const report = JSON.parse(result.stdout) as { invalidAdvisoryCount: number; invalidAdvisories: Array<{ filePath: string; issues: string[] }> };

      expect(result.exitCode).toBe(1);
      expect(report.invalidAdvisoryCount).toBe(1);
      expect(report.invalidAdvisories[0].filePath).toContain("OCAP-2099-0003.yml");
      expect(result.stderr).not.toMatch(/\n\s+at /);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
