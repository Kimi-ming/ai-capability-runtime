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

async function writeAdvisory(root: string, content: string, fileName = "OCAP-2099-0001.yml"): Promise<void> {
  const advisoryDir = join(root, "advisories");
  await mkdir(advisoryDir, { recursive: true });
  await writeFile(join(advisoryDir, fileName), content, "utf8");
}

function warningAdvisory(): string {
  return [
    "schema_version: opencap.capability_advisory.v1",
    "id: OCAP-2099-0001",
    "capability: github.create_issue",
    "affected_versions:",
    "  - <=0.1.0",
    "type: provider_changed",
    "severity: medium",
    "status: published",
    "summary: GitHub issue API behavior changed; review scopes.",
    "published_at: null",
    "modified_at: 2026-05-29T00:00:00Z",
    "actions:",
    "  registry: none",
    "  runtime_default: warn",
    "  fixed_version: null",
    "references:",
    "  - docs/教程/github-fine-grained-token-setup.md",
    "",
  ].join("\n");
}

function revokedAdvisory(): string {
  return [
    "schema_version: opencap.capability_advisory.v1",
    "id: OCAP-2099-0002",
    "capability: github.create_issue",
    "affected_versions:",
    "  - <=0.1.0",
    "type: maintainer_compromise",
    "severity: critical",
    "status: revoked",
    "summary: GitHub issue capability revoked for incident response.",
    "published_at: 2026-05-29T00:00:00Z",
    "modified_at: 2026-05-29T01:00:00Z",
    "actions:",
    "  registry: revoke",
    "  runtime_default: deny",
    "  fixed_version: null",
    "references:",
    "  - docs/安全/capability-advisory-process.md",
    "",
  ].join("\n");
}

describe("OpenCap CLI advisory check command", () => {
  it("reports installed revoked advisories as JSON and exits 1 without reading secrets", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-"));

    try {
      await runOpenCapCli(["install", "http.request_demo", "--state-dir", stateDir, "--registry", registryRoot]);

      const result = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--json",
      ], { allowFailure: true });
      const report = JSON.parse(result.stdout) as {
        schemaVersion: string;
        policyEffect: string;
        stateDir: string;
        registryPath: string;
        checkedCapabilityCount: number;
        invalidAdvisoryCount: number;
        matches: Array<{
          capabilityId: string;
          installedVersion: string;
          advisoryId: string;
          severity: string;
          status: string;
          registryAction: string;
          runtimeDefault: string;
        }>;
      };

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toBe("");
      expect(report.schemaVersion).toBe("opencap.advisory_check.v1");
      expect(report.policyEffect).toBe("none");
      expect(report.stateDir).toBe(stateDir);
      expect(report.registryPath).toBe(registryRoot);
      expect(report.checkedCapabilityCount).toBe(1);
      expect(report.invalidAdvisoryCount).toBe(0);
      expect(report.matches).toEqual([
        expect.objectContaining({
          capabilityId: "http.request_demo",
          installedVersion: "0.1.0",
          advisoryId: "OCAP-2026-0001",
          severity: "critical",
          status: "revoked",
          registryAction: "revoke",
          runtimeDefault: "deny",
        }),
      ]);
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("provider raw response");
      expect(result.stdout).not.toContain("OpenCap smoke test message");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("keeps warning-only advisories at exit 0", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-"));
    const stateDir = join(dir, "state");
    const advisoryRegistry = join(dir, "registry");

    try {
      await runOpenCapCli(["install", "github.create_issue", "--state-dir", stateDir, "--registry", registryRoot]);
      await writeAdvisory(advisoryRegistry, warningAdvisory());

      const result = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        advisoryRegistry,
        "--json",
      ]);
      const report = JSON.parse(result.stdout) as { matches: Array<{ advisoryId: string; runtimeDefault: string; registryAction: string }> };

      expect(result.exitCode).toBe(0);
      expect(report.matches).toEqual([
        expect.objectContaining({
          advisoryId: "OCAP-2099-0001",
          runtimeDefault: "warn",
          registryAction: "none",
        }),
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("filters advisory checks to one installed capability while preserving installed counts", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-"));

    try {
      await runOpenCapCli(["install", "github.create_issue", "--state-dir", stateDir, "--registry", registryRoot]);
      await runOpenCapCli(["install", "http.request_demo", "--state-dir", stateDir, "--registry", registryRoot]);

      const safe = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--capability",
        "github.create_issue",
        "--json",
      ]);
      const safeReport = JSON.parse(safe.stdout) as {
        filters: { capability?: string };
        installedCapabilityCount: number;
        checkedCapabilityCount: number;
        checkedInstalledCapabilities: string[];
        matches: unknown[];
      };

      expect(safe.exitCode).toBe(0);
      expect(safeReport.filters).toEqual({ capability: "github.create_issue" });
      expect(safeReport.installedCapabilityCount).toBe(2);
      expect(safeReport.checkedCapabilityCount).toBe(1);
      expect(safeReport.checkedInstalledCapabilities).toEqual(["github.create_issue"]);
      expect(safeReport.matches).toEqual([]);

      const revoked = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--capability",
        "http.request_demo",
        "--json",
      ], { allowFailure: true });
      const revokedReport = JSON.parse(revoked.stdout) as {
        filters: { capability?: string };
        installedCapabilityCount: number;
        checkedCapabilityCount: number;
        checkedInstalledCapabilities: string[];
        matches: Array<{ capabilityId: string; advisoryId: string; runtimeDefault: string }>;
      };

      expect(revoked.exitCode).toBe(1);
      expect(revokedReport.filters).toEqual({ capability: "http.request_demo" });
      expect(revokedReport.installedCapabilityCount).toBe(2);
      expect(revokedReport.checkedCapabilityCount).toBe(1);
      expect(revokedReport.checkedInstalledCapabilities).toEqual(["http.request_demo"]);
      expect(revokedReport.matches).toEqual([
        expect.objectContaining({
          capabilityId: "http.request_demo",
          advisoryId: "OCAP-2026-0001",
          runtimeDefault: "deny",
        }),
      ]);

      const missing = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--capability",
        "demo.missing",
      ]);

      expect(missing.exitCode).toBe(0);
      expect(missing.stdout).toContain("checked: 0");
      expect(missing.stdout).toContain("No installed capability advisories found.");
      await expect(readFile(join(stateDir, "logs.sqlite"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("filters advisory check matches by severity and status while preserving raw match counts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-"));
    const stateDir = join(dir, "state");
    const advisoryRegistry = join(dir, "registry");

    try {
      await runOpenCapCli(["install", "github.create_issue", "--state-dir", stateDir, "--registry", registryRoot]);
      await writeAdvisory(advisoryRegistry, warningAdvisory(), "OCAP-2099-0001.yml");
      await writeAdvisory(advisoryRegistry, revokedAdvisory(), "OCAP-2099-0002.yml");

      const warningOnly = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        advisoryRegistry,
        "--severity",
        "medium",
        "--status",
        "published",
        "--json",
      ]);
      const warningReport = JSON.parse(warningOnly.stdout) as {
        filters: { severity?: string; status?: string };
        matchCount: number;
        filteredMatchCount: number;
        policyEffect: string;
        matches: Array<{ advisoryId: string; severity: string; status: string; runtimeDefault: string }>;
      };

      expect(warningOnly.exitCode).toBe(0);
      expect(warningReport.filters).toEqual({ severity: "medium", status: "published" });
      expect(warningReport.matchCount).toBe(2);
      expect(warningReport.filteredMatchCount).toBe(1);
      expect(warningReport.policyEffect).toBe("none");
      expect(warningReport.matches).toEqual([
        expect.objectContaining({
          advisoryId: "OCAP-2099-0001",
          severity: "medium",
          status: "published",
          runtimeDefault: "warn",
        }),
      ]);

      const revokedOnly = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        advisoryRegistry,
        "--severity",
        "critical",
        "--status",
        "revoked",
        "--json",
      ], { allowFailure: true });
      const revokedReport = JSON.parse(revokedOnly.stdout) as {
        filters: { severity?: string; status?: string };
        matchCount: number;
        filteredMatchCount: number;
        matches: Array<{ advisoryId: string; severity: string; status: string; runtimeDefault: string }>;
      };

      expect(revokedOnly.exitCode).toBe(1);
      expect(revokedReport.filters).toEqual({ severity: "critical", status: "revoked" });
      expect(revokedReport.matchCount).toBe(2);
      expect(revokedReport.filteredMatchCount).toBe(1);
      expect(revokedReport.matches).toEqual([
        expect.objectContaining({
          advisoryId: "OCAP-2099-0002",
          severity: "critical",
          status: "revoked",
          runtimeDefault: "deny",
        }),
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("rejects invalid advisory check severity and status filters as user errors", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-"));

    try {
      const invalidSeverity = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--severity",
        "urgent",
      ], { allowFailure: true });

      expect(invalidSeverity.exitCode).toBe(1);
      expect(invalidSeverity.stderr).toContain("Invalid --severity value: urgent");
      expect(invalidSeverity.stderr).not.toMatch(/\n\s+at /);

      const invalidStatus = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--status",
        "closed",
      ], { allowFailure: true });

      expect(invalidStatus.exitCode).toBe(1);
      expect(invalidStatus.stderr).toContain("Invalid --status value: closed");
      expect(invalidStatus.stderr).not.toMatch(/\n\s+at /);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("writes advisory check JSON evidence to safe output files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-output-"));
    const stateDir = join(dir, "state");
    const revokedOutput = join(dir, "evidence", "revoked-advisory-check.json");
    const warningRegistry = join(dir, "warning-registry");
    const warningOutput = join(dir, "evidence", "warning-advisory-check.json");

    try {
      await runOpenCapCli(["install", "http.request_demo", "--state-dir", stateDir, "--registry", registryRoot]);

      const revoked = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--output",
        revokedOutput,
        "--json",
      ], { allowFailure: true });
      const revokedStdoutReport = JSON.parse(revoked.stdout) as { schemaVersion: string; matches: Array<{ advisoryId: string }> };
      const revokedFileReport = JSON.parse(await readFile(revokedOutput, "utf8")) as typeof revokedStdoutReport;

      expect(revoked.exitCode).toBe(1);
      expect(revokedFileReport).toEqual(revokedStdoutReport);
      expect(revokedFileReport.schemaVersion).toBe("opencap.advisory_check.v1");
      expect(revokedFileReport.matches).toEqual([
        expect.objectContaining({ advisoryId: "OCAP-2026-0001" }),
      ]);
      await expect(readFile(join(stateDir, "logs.sqlite"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });

      await runOpenCapCli(["install", "github.create_issue", "--state-dir", stateDir, "--registry", registryRoot]);
      await writeAdvisory(warningRegistry, warningAdvisory());

      const warning = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        warningRegistry,
        "--capability",
        "github.create_issue",
        "--output",
        warningOutput,
      ]);
      const warningFileReport = JSON.parse(await readFile(warningOutput, "utf8")) as {
        schemaVersion: string;
        filters: { capability?: string };
        matches: Array<{ advisoryId: string }>;
      };

      expect(warning.exitCode).toBe(0);
      expect(warning.stdout).toContain("OCAP-2099-0001");
      expect(warning.stdout.trim().startsWith("{")).toBe(false);
      expect(warningFileReport.schemaVersion).toBe("opencap.advisory_check.v1");
      expect(warningFileReport.filters).toEqual({ capability: "github.create_issue" });
      expect(warningFileReport.matches).toEqual([
        expect.objectContaining({ advisoryId: "OCAP-2099-0001" }),
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("rejects unsafe advisory check output paths without partial files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-output-"));
    const stateDir = join(dir, "state");
    const outputPath = join(dir, ".env.advisory-check.json");

    try {
      const result = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        registryRoot,
        "--output",
        outputPath,
      ], { allowFailure: true });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Unsafe --output path:");
      expect(result.stderr).not.toMatch(/\n\s+at /);
      await expect(readFile(outputPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a friendly empty human summary without writing audit logs", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-"));

    try {
      const result = await runOpenCapCli(["advisory", "check", "--state-dir", stateDir, "--registry", registryRoot]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("No installed capability advisories found.");
      expect(result.stdout).toContain("checked: 0");
      await expect(readFile(join(stateDir, "logs.sqlite"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns exit 1 for invalid advisory files while emitting JSON summary", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-advisory-check-"));
    const stateDir = join(dir, "state");
    const advisoryRegistry = join(dir, "registry");

    try {
      await writeAdvisory(advisoryRegistry, "id: not-an-advisory\n");

      const result = await runOpenCapCli([
        "advisory",
        "check",
        "--state-dir",
        stateDir,
        "--registry",
        advisoryRegistry,
        "--severity",
        "low",
        "--status",
        "published",
        "--json",
      ], { allowFailure: true });
      const report = JSON.parse(result.stdout) as { invalidAdvisoryCount: number; invalidAdvisories: Array<{ filePath: string; issues: string[] }> };

      expect(result.exitCode).toBe(1);
      expect(report.invalidAdvisoryCount).toBe(1);
      expect(report.invalidAdvisories[0].filePath).toContain("OCAP-2099-0001.yml");
      expect(result.stderr).not.toMatch(/\n\s+at /);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
