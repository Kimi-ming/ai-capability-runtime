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
    references: ["docs/安全/capability-advisory-process.md"],
  };
}

async function writeAdvisoryFile(root: string, relativePath: string, value: Record<string, unknown>): Promise<void> {
  const filePath = join(root, relativePath);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeInvalidAdvisory(root: string): Promise<void> {
  const advisoryDir = join(root, "advisories");
  await mkdir(advisoryDir, { recursive: true });
  await writeFile(join(advisoryDir, "OCAP-2099-0003.yml"), "id: not-an-advisory\n", "utf8");
}

describe("OpenCap CLI registry advisory show command", () => {
  it("prints a local Registry advisory detail as JSON without mutating state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-advisory-show-"));

    try {
      const result = await runOpenCapCli(["registry", "advisory", "show", "OCAP-2026-0001", "--registry", registryRoot, "--json"], { cwd });
      const report = JSON.parse(result.stdout) as {
        schemaVersion: string;
        registryPath: string;
        policyEffect: string;
        advisory: {
          id: string;
          capability: string;
          affectedVersions: string[];
          type: string;
          severity: string;
          status: string;
          summary: string;
          publishedAt: string | null;
          modifiedAt: string;
          registryAction: string;
          runtimeDefault: string;
          fixedVersion: string | null;
          references: string[];
          filePath: string;
        };
      };

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(report.schemaVersion).toBe("opencap.registry_advisory_detail.v1");
      expect(report.registryPath).toBe(registryRoot);
      expect(report.policyEffect).toBe("none");
      expect(report.advisory).toMatchObject({
        id: "OCAP-2026-0001",
        capability: "http.request_demo",
        affectedVersions: ["<=0.1.0"],
        type: "unsafe_execution",
        severity: "critical",
        status: "revoked",
        summary: "Demo arbitrary URL request capability is unsafe for default registry installation.",
        publishedAt: null,
        modifiedAt: "2026-05-14T00:00:00Z",
        registryAction: "revoke",
        runtimeDefault: "deny",
        fixedVersion: null,
      });
      expect(report.advisory.references).toContain("docs/生态/capability-deprecation-and-revocation.md");
      expect(report.advisory.filePath).toContain("OCAP-2026-0001.yml");
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("provider raw response");
      await expect(readFile(join(cwd, "opencap.local", "logs.sqlite"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable advisory detail summary", async () => {
    const result = await runOpenCapCli(["registry", "advisory", "show", "OCAP-2026-0001", "--registry", registryRoot]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("OpenCap registry advisory");
    expect(result.stdout).toContain("id: OCAP-2026-0001");
    expect(result.stdout).toContain("capability: http.request_demo");
    expect(result.stdout).toContain("severity: critical");
    expect(result.stdout).toContain("status: revoked");
    expect(result.stdout).toContain("registry action: revoke");
    expect(result.stdout).toContain("runtime default: deny");
    expect(result.stdout).toContain("modified_at: 2026-05-14T00:00:00Z");
  }, 60_000);

  it("returns user errors for not found, duplicate ids, and invalid advisory files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-advisory-show-"));

    try {
      const notFound = await runOpenCapCli([
        "registry",
        "advisory",
        "show",
        "OCAP-2099-9999",
        "--registry",
        registryRoot,
      ], { allowFailure: true });
      expect(notFound.exitCode).toBe(1);
      expect(notFound.stdout).toBe("");
      expect(notFound.stderr).toContain("Capability advisory not found in registry: OCAP-2099-9999");
      expect(notFound.stderr).not.toMatch(/\n\s+at /);

      await writeAdvisoryFile(dir, "advisories/OCAP-2099-0001.yml", advisory("OCAP-2099-0001"));
      await writeAdvisoryFile(dir, "other/advisory.yml", advisory("OCAP-2099-0001", { capability: "demo.other" }));
      const duplicate = await runOpenCapCli([
        "registry",
        "advisory",
        "show",
        "OCAP-2099-0001",
        "--registry",
        dir,
      ], { allowFailure: true });
      expect(duplicate.exitCode).toBe(1);
      expect(duplicate.stdout).toBe("");
      expect(duplicate.stderr).toContain("Multiple registry advisories found for id: OCAP-2099-0001");
      expect(duplicate.stderr).not.toMatch(/\n\s+at /);

      await rm(dir, { recursive: true, force: true });
      const invalidDir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-advisory-show-"));
      await writeInvalidAdvisory(invalidDir);
      const invalid = await runOpenCapCli([
        "registry",
        "advisory",
        "show",
        "OCAP-2099-0003",
        "--registry",
        invalidDir,
      ], { allowFailure: true });
      expect(invalid.exitCode).toBe(1);
      expect(invalid.stdout).toBe("");
      expect(invalid.stderr).toContain("Invalid capability advisories: 1");
      expect(invalid.stderr).not.toMatch(/\n\s+at /);
      await rm(invalidDir, { recursive: true, force: true });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
