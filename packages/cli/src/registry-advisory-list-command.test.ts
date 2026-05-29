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

function advisory(id: string, options: { capability?: string; severity?: string; status?: string } = {}): Record<string, unknown> {
  return {
    schema_version: "opencap.capability_advisory.v1",
    id,
    capability: options.capability ?? "demo.capability",
    affected_versions: ["<=0.1.0"],
    type: "unsafe_execution",
    severity: options.severity ?? "high",
    status: options.status ?? "investigating",
    summary: `Advisory ${id}.`,
    published_at: null,
    modified_at: "2026-05-29T00:00:00Z",
    actions: {
      registry: "freeze",
      runtime_default: "ask",
      fixed_version: null,
    },
  };
}

async function writeAdvisoryFile(root: string, relativePath: string, value: Record<string, unknown>): Promise<void> {
  const filePath = join(root, relativePath);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
        filteredAdvisoryCount: number;
        filters: {
          capability?: string;
          severity?: string;
          status?: string;
        };
      };

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(report.schemaVersion).toBe("opencap.registry_advisory_list.v1");
      expect(report.policyEffect).toBe("none");
      expect(report.registryPath).toBe(registryRoot);
      expect(report.advisoryCount).toBe(1);
      expect(report.filteredAdvisoryCount).toBe(1);
      expect(report.filters).toEqual({});
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

  it("filters advisories by capability, severity, and status with stable JSON metadata", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-advisory-list-"));

    try {
      await writeAdvisoryFile(dir, "advisories/OCAP-2099-0001.yml", advisory("OCAP-2099-0001", {
        capability: "demo.alpha",
        severity: "high",
        status: "investigating",
      }));
      await writeAdvisoryFile(dir, "advisories/OCAP-2099-0002.yml", advisory("OCAP-2099-0002", {
        capability: "demo.beta",
        severity: "critical",
        status: "revoked",
      }));

      const result = await runOpenCapCli([
        "registry",
        "advisory",
        "list",
        "--registry",
        dir,
        "--capability",
        "demo.beta",
        "--severity",
        "critical",
        "--status",
        "revoked",
        "--json",
      ]);
      const report = JSON.parse(result.stdout) as {
        advisoryCount: number;
        filteredAdvisoryCount: number;
        filters: { capability?: string; severity?: string; status?: string };
        advisories: Array<{ id: string; capability: string; severity: string; status: string }>;
      };

      expect(result.exitCode).toBe(0);
      expect(report.advisoryCount).toBe(2);
      expect(report.filteredAdvisoryCount).toBe(1);
      expect(report.filters).toEqual({ capability: "demo.beta", severity: "critical", status: "revoked" });
      expect(report.advisories).toEqual([
        expect.objectContaining({
          id: "OCAP-2099-0002",
          capability: "demo.beta",
          severity: "critical",
          status: "revoked",
        }),
      ]);

      const empty = await runOpenCapCli([
        "registry",
        "advisory",
        "list",
        "--registry",
        dir,
        "--capability",
        "demo.missing",
      ]);
      expect(empty.exitCode).toBe(0);
      expect(empty.stdout).toContain("No registry advisories found.");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns user errors for invalid severity and status filter values", async () => {
    const invalidSeverity = await runOpenCapCli([
      "registry",
      "advisory",
      "list",
      "--registry",
      registryRoot,
      "--severity",
      "urgent",
    ], { allowFailure: true });
    expect(invalidSeverity.exitCode).toBe(1);
    expect(invalidSeverity.stdout).toBe("");
    expect(invalidSeverity.stderr).toContain("Invalid --severity value: urgent");
    expect(invalidSeverity.stderr).not.toMatch(/\n\s+at /);

    const invalidStatus = await runOpenCapCli([
      "registry",
      "advisory",
      "list",
      "--registry",
      registryRoot,
      "--status",
      "closed",
    ], { allowFailure: true });
    expect(invalidStatus.exitCode).toBe(1);
    expect(invalidStatus.stdout).toBe("");
    expect(invalidStatus.stderr).toContain("Invalid --status value: closed");
    expect(invalidStatus.stderr).not.toMatch(/\n\s+at /);
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
