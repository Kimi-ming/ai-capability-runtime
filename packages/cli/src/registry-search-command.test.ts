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
const registryRoot = resolve(repoRoot, "registry");

type CliResult = {
  stdout: string;
  stderr: string;
  exitCode: number | string;
};

type TestLifecycle = "deprecated" | "yanked" | "revoked";

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

function testManifest(id: string, lifecycle?: TestLifecycle): Record<string, unknown> {
  return {
    id,
    name: id,
    description: `Capability ${id}.`,
    version: "0.1.0",
    type: "http",
    ...(lifecycle === undefined ? {} : {
      lifecycle: {
        status: lifecycle,
        reason: "test lifecycle",
        since: "2026-05-29",
        ...(lifecycle === "revoked" ? { advisory: "OCAP-2099-0001" } : {}),
      },
    }),
    input: { type: "object" },
    output: { type: "object" },
    auth: { type: "none" },
    permissions: [{ resource: id, action: "read", risk: "read_only", confirmation: "allow" }],
    execution: { method: "GET", url: "https://example.com/status", timeout_ms: 10000 },
    metadata: {
      category: "developer-tools",
      maintainer: "opencap",
      license: "MIT",
      trust_level: "experimental",
    },
  };
}

async function writeManifest(root: string, manifest: Record<string, unknown>): Promise<void> {
  const category = "developer-tools";
  const id = String(manifest.id);
  const dir = join(root, category, id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "manifest.yml"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

describe("OpenCap CLI registry search command", () => {
  it("prints a JSON registry search report without mutating local state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-search-"));

    try {
      const result = await runOpenCapCli(["registry", "search", "github", "--registry", registryRoot, "--json"], { cwd });
      const report = JSON.parse(result.stdout) as {
        schemaVersion: string;
        query: string;
        policyEffect: string;
        resultCount: number;
        invalidCount: number;
        results: Array<{ id: string; category: string; lifecycle: string }>;
        excludedByLifecycle: { count: number };
      };

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(await pathExists(join(cwd, "opencap.local"))).toBe(false);
      expect(report.schemaVersion).toBe("opencap.registry_search.v1");
      expect(report.query).toBe("github");
      expect(report.policyEffect).toBe("none");
      expect(report.invalidCount).toBe(0);
      expect(report.results.map((capability) => capability.id)).toEqual(["github.create_issue", "github.search_repo"]);
      expect(report.results.every((capability) => capability.category === "developer-tools")).toBe(true);
      expect(report.results.every((capability) => capability.lifecycle === "active")).toBe(true);
      expect(report.resultCount).toBe(2);
      expect(report.excludedByLifecycle.count).toBe(0);
      expect(result.stdout).not.toContain("GITHUB_TOKEN");
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("OpenCap smoke test message");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("hides yanked and revoked capabilities unless explicitly included", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-search-"));
    const tempRegistry = join(dir, "registry");

    try {
      await writeManifest(tempRegistry, testManifest("demo.active"));
      await writeManifest(tempRegistry, testManifest("demo.deprecated", "deprecated"));
      await writeManifest(tempRegistry, testManifest("demo.yanked", "yanked"));
      await writeManifest(tempRegistry, testManifest("demo.revoked", "revoked"));

      const defaultResult = await runOpenCapCli(["registry", "search", "demo", "--registry", tempRegistry, "--json"]);
      const defaultReport = JSON.parse(defaultResult.stdout) as {
        results: Array<{ id: string }>;
        excludedByLifecycle: { count: number; results: Array<{ id: string; lifecycle: string }> };
      };
      expect(defaultReport.results.map((capability) => capability.id)).toEqual(["demo.active", "demo.deprecated"]);
      expect(defaultReport.excludedByLifecycle).toMatchObject({
        count: 2,
        results: [
          { id: "demo.revoked", lifecycle: "revoked" },
          { id: "demo.yanked", lifecycle: "yanked" },
        ],
      });

      const includedResult = await runOpenCapCli([
        "registry",
        "search",
        "demo",
        "--registry",
        tempRegistry,
        "--include-lifecycle",
        "yanked,revoked",
        "--json",
      ]);
      const includedReport = JSON.parse(includedResult.stdout) as { results: Array<{ id: string }> };
      expect(includedReport.results.map((capability) => capability.id)).toEqual([
        "demo.active",
        "demo.deprecated",
        "demo.revoked",
        "demo.yanked",
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable search summary", async () => {
    const result = await runOpenCapCli(["registry", "search", "github", "--registry", registryRoot]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("id version lifecycle category description");
    expect(result.stdout).toContain("github.create_issue 0.1.0 active developer-tools");
    expect(result.stdout).toContain("github.search_repo 0.1.0 active developer-tools");
    expect(result.stdout).toContain("excluded_by_lifecycle: 0");
  }, 60_000);

  it("returns user errors for invalid include lifecycle values and invalid manifests", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-search-"));
    const tempRegistry = join(dir, "registry");

    try {
      const invalidLifecycle = await runOpenCapCli([
        "registry",
        "search",
        "demo",
        "--registry",
        tempRegistry,
        "--include-lifecycle",
        "deleted",
      ], { allowFailure: true });
      expect(invalidLifecycle.exitCode).toBe(1);
      expect(invalidLifecycle.stdout).toBe("");
      expect(invalidLifecycle.stderr).toContain("Invalid --include-lifecycle value: deleted");
      expect(invalidLifecycle.stderr).not.toMatch(/\n\s+at /);

      await mkdir(join(tempRegistry, "developer-tools", "broken"), { recursive: true });
      await writeFile(join(tempRegistry, "developer-tools", "broken", "manifest.yml"), "id: broken\n", "utf8");

      const invalidRegistry = await runOpenCapCli([
        "registry",
        "search",
        "broken",
        "--registry",
        tempRegistry,
        "--json",
      ], { allowFailure: true });
      const invalidReport = JSON.parse(invalidRegistry.stdout) as { invalidCount: number };
      expect(invalidRegistry.exitCode).toBe(1);
      expect(invalidReport.invalidCount).toBe(1);
      expect(invalidRegistry.stderr).not.toMatch(/\n\s+at /);
      await expect(readFile(join(dir, "opencap.local", "logs.sqlite"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
