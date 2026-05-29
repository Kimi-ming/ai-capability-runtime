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

function testManifest(id: string, options: { lifecycle?: TestLifecycle; category?: string } = {}): Record<string, unknown> {
  const category = options.category ?? "developer-tools";
  return {
    id,
    name: id,
    description: `Capability ${id}.`,
    version: "0.1.0",
    type: "http",
    ...(options.lifecycle === undefined ? {} : {
      lifecycle: {
        status: options.lifecycle,
        reason: "test lifecycle",
        since: "2026-05-29",
        ...(options.lifecycle === "revoked" ? { advisory: "OCAP-2099-0002" } : {}),
      },
    }),
    input: { type: "object" },
    output: { type: "object" },
    auth: { type: "none" },
    permissions: [{ resource: id, action: "read", risk: "read_only", confirmation: "allow" }],
    execution: { method: "GET", url: "https://example.com/status", timeout_ms: 10000 },
    metadata: {
      category,
      maintainer: "opencap",
      license: "MIT",
      trust_level: "experimental",
    },
  };
}

async function writeManifest(root: string, manifest: Record<string, unknown>, category = "developer-tools"): Promise<void> {
  const id = String(manifest.id);
  const dir = join(root, category, id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "manifest.yml"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

describe("OpenCap CLI registry show command", () => {
  it("prints redacted Capability details as JSON without mutating local state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-show-"));

    try {
      const result = await runOpenCapCli(["registry", "show", "github.search_repo", "--registry", registryRoot, "--json"], { cwd });
      const detail = JSON.parse(result.stdout) as {
        schemaVersion: string;
        policyEffect: string;
        capability: {
          id: string;
          name: string;
          version: string;
          lifecycle: string;
          category: string;
          maintainer: string;
          license: string;
          trustLevel: string;
          manifestPath: string;
          auth: { type: string; provider: string; env: string; placement: string; scopes: string[] };
          permissions: Array<{ resource: string; action: string; risk: string; confirmation: string }>;
          execution: { method: string; origin: string };
        };
      };

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(await pathExists(join(cwd, "opencap.local"))).toBe(false);
      expect(detail.schemaVersion).toBe("opencap.registry_capability_detail.v1");
      expect(detail.policyEffect).toBe("none");
      expect(detail.capability).toMatchObject({
        id: "github.search_repo",
        name: "Search GitHub Repository",
        version: "0.1.0",
        lifecycle: "active",
        category: "developer-tools",
        maintainer: "opencap",
        license: "MIT",
        trustLevel: "experimental",
        auth: {
          type: "api_key",
          provider: "github",
          env: "GITHUB_TOKEN",
          placement: "bearer",
          scopes: ["read"],
        },
        execution: {
          method: "GET",
          origin: "https://api.github.com",
        },
      });
      expect(detail.capability.permissions).toEqual([
        { resource: "github.search", action: "read", risk: "read_only", confirmation: "allow" },
      ]);
      expect(detail.capability.manifestPath).toContain("github.search_repo/manifest.yml");
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("provider raw response");
      expect(result.stdout).not.toContain("OpenCap smoke test message");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable Capability detail summary", async () => {
    const result = await runOpenCapCli(["registry", "show", "github.search_repo", "--registry", registryRoot]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("OpenCap registry capability");
    expect(result.stdout).toContain("id: github.search_repo");
    expect(result.stdout).toContain("lifecycle: active");
    expect(result.stdout).toContain("auth: api_key provider=github env=GITHUB_TOKEN placement=bearer scopes=read");
    expect(result.stdout).toContain("permission: github.search read read_only allow");
    expect(result.stdout).toContain("execution: GET https://api.github.com");
  }, 60_000);

  it("hides revoked capabilities unless explicitly included", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-show-"));
    const tempRegistry = join(dir, "registry");

    try {
      await writeManifest(tempRegistry, testManifest("demo.revoked", { lifecycle: "revoked" }));

      const hidden = await runOpenCapCli(["registry", "show", "demo.revoked", "--registry", tempRegistry], { allowFailure: true });
      expect(hidden.exitCode).toBe(1);
      expect(hidden.stdout).toBe("");
      expect(hidden.stderr).toContain("Capability not found in registry: demo.revoked");
      expect(hidden.stderr).not.toMatch(/\n\s+at /);

      const shown = await runOpenCapCli([
        "registry",
        "show",
        "demo.revoked",
        "--registry",
        tempRegistry,
        "--include-lifecycle",
        "yanked,revoked",
        "--json",
      ]);
      const detail = JSON.parse(shown.stdout) as { capability: { id: string; lifecycle: string } };
      expect(detail.capability).toMatchObject({ id: "demo.revoked", lifecycle: "revoked" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns user errors for ambiguous ids, invalid include lifecycle values, and invalid manifests", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-registry-show-"));
    const tempRegistry = join(dir, "registry");

    try {
      await writeManifest(tempRegistry, testManifest("demo.duplicate", { category: "developer-tools" }), "developer-tools");
      await writeManifest(tempRegistry, testManifest("demo.duplicate", { category: "productivity" }), "productivity");

      const duplicate = await runOpenCapCli(["registry", "show", "demo.duplicate", "--registry", tempRegistry], { allowFailure: true });
      expect(duplicate.exitCode).toBe(1);
      expect(duplicate.stdout).toBe("");
      expect(duplicate.stderr).toContain("Multiple registry capabilities found for id: demo.duplicate");
      expect(duplicate.stderr).not.toMatch(/\n\s+at /);

      const invalidLifecycle = await runOpenCapCli([
        "registry",
        "show",
        "demo.duplicate",
        "--registry",
        tempRegistry,
        "--include-lifecycle",
        "deleted",
      ], { allowFailure: true });
      expect(invalidLifecycle.exitCode).toBe(1);
      expect(invalidLifecycle.stdout).toBe("");
      expect(invalidLifecycle.stderr).toContain("Invalid --include-lifecycle value: deleted");
      expect(invalidLifecycle.stderr).not.toMatch(/\n\s+at /);

      const missing = await runOpenCapCli(["registry", "show", "demo.missing", "--registry", tempRegistry], { allowFailure: true });
      expect(missing.exitCode).toBe(1);
      expect(missing.stderr).toContain("Capability not found in registry: demo.missing");
      expect(missing.stderr).not.toMatch(/\n\s+at /);

      await mkdir(join(tempRegistry, "developer-tools", "broken"), { recursive: true });
      await writeFile(join(tempRegistry, "developer-tools", "broken", "manifest.yml"), "id: broken\n", "utf8");

      const invalidRegistry = await runOpenCapCli(["registry", "show", "demo.duplicate", "--registry", tempRegistry], { allowFailure: true });
      expect(invalidRegistry.exitCode).toBe(1);
      expect(invalidRegistry.stdout).toBe("");
      expect(invalidRegistry.stderr).toContain("Invalid registry manifests: 1");
      expect(invalidRegistry.stderr).not.toMatch(/\n\s+at /);
      await expect(readFile(join(dir, "opencap.local", "logs.sqlite"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
