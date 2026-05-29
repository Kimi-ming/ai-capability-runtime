import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
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

describe("OpenCap CLI registry index command", () => {
  it("prints a redacted Registry index artifact as JSON without mutating local state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-index-"));

    try {
      const result = await runOpenCapCli(["registry", "index", "build", "--registry", registryRoot, "--json"], { cwd });
      const index = JSON.parse(result.stdout) as {
        schemaVersion: string;
        profile: string;
        capabilityCount: number;
        invalidManifestCount: number;
        signatureStatus: string;
        indexDigest: string;
        policyEffect: string;
        capabilities: Array<{
          id: string;
          path: string;
          manifestDigest: string;
          defaultInstallTrusted: boolean;
          blockingReasons: string[];
          policyEffect: string;
        }>;
      };

      expect(result.exitCode).toBe(0);
      expect(await pathExists(join(cwd, "opencap.local"))).toBe(false);
      expect(index).toMatchObject({
        schemaVersion: "opencap.registry.index.v1",
        profile: "opencap.registry.index_cache_sync.v1",
        capabilityCount: 5,
        invalidManifestCount: 0,
        signatureStatus: "none",
        policyEffect: "none",
      });
      expect(index.indexDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(index.capabilities.every((capability) => capability.policyEffect === "none")).toBe(true);
      expect(index.capabilities.every((capability) => !capability.path.startsWith("/") && !capability.path.includes(".."))).toBe(true);
      expect(index.capabilities.every((capability) => capability.manifestDigest.match(/^sha256:[0-9a-f]{64}$/))).toBe(true);
      expect(index.capabilities.find((capability) => capability.id === "http.request_demo")).toMatchObject({
        defaultInstallTrusted: false,
        blockingReasons: expect.arrayContaining(["advisory:OCAP-2026-0001:revoked"]),
      });
      expect(result.stdout).not.toContain("GITHUB_TOKEN");
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("https://api.github.com");
      expect(result.stdout).not.toContain("opencap.local");
      expect(result.stdout).not.toContain("/Users/");
      expect(result.stdout).not.toContain("execution");
      expect(result.stdout).not.toContain("input");
      expect(result.stdout).not.toContain("output");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable registry index summary", async () => {
    const result = await runOpenCapCli(["registry", "index", "build", "--registry", registryRoot]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("OpenCap registry index");
    expect(result.stdout).toContain("capabilities: 5");
    expect(result.stdout).toContain("invalid manifests: 0");
    expect(result.stdout).toContain("signature: none");
    expect(result.stdout).toContain("digest: sha256:");
    expect(result.stdout).toContain("blocking:");
    expect(result.stdout).toContain("http.request_demo advisory:OCAP-2026-0001:revoked");
    expect(result.stdout.trim().startsWith("{")).toBe(false);
  }, 60_000);

  it("writes Registry index JSON artifacts to safe output files", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-index-output-"));
    const jsonOutput = join(cwd, "reports", "registry-index.json");
    const humanOutput = join(cwd, "reports", "registry-index-human.json");

    try {
      const json = await runOpenCapCli([
        "registry",
        "index",
        "build",
        "--registry",
        registryRoot,
        "--output",
        jsonOutput,
        "--json",
      ], { cwd });
      const stdoutIndex = JSON.parse(json.stdout) as { schemaVersion: string; capabilities: unknown[] };
      const fileIndex = JSON.parse(await readFile(jsonOutput, "utf8")) as typeof stdoutIndex;

      expect(json.exitCode).toBe(0);
      expect(fileIndex).toEqual(stdoutIndex);
      expect(fileIndex.schemaVersion).toBe("opencap.registry.index.v1");
      expect(fileIndex.capabilities).toHaveLength(5);

      const human = await runOpenCapCli([
        "registry",
        "index",
        "build",
        "--registry",
        registryRoot,
        "--output",
        humanOutput,
      ], { cwd });
      const humanFileIndex = JSON.parse(await readFile(humanOutput, "utf8")) as { schemaVersion: string; capabilities: unknown[] };

      expect(human.exitCode).toBe(0);
      expect(human.stdout).toContain("OpenCap registry index");
      expect(human.stdout.trim().startsWith("{")).toBe(false);
      expect(humanFileIndex.schemaVersion).toBe("opencap.registry.index.v1");
      expect(humanFileIndex.capabilities).toHaveLength(5);
      expect(await pathExists(join(cwd, "opencap.local"))).toBe(false);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("rejects unsafe Registry index output paths without partial files", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-index-output-"));
    const unsafeFile = join(cwd, ".env.registry-index.json");
    const unsafeDir = join(cwd, "artifact-dir");

    try {
      await mkdir(unsafeDir);

      for (const outputPath of [unsafeFile, unsafeDir]) {
        const result = await runOpenCapCli([
          "registry",
          "index",
          "build",
          "--registry",
          registryRoot,
          "--output",
          outputPath,
        ], { allowFailure: true, cwd });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toBe("");
        expect(result.stderr).toContain("Unsafe --output path:");
        expect(result.stderr).not.toMatch(/\n\s+at /);
      }

      expect(await pathExists(unsafeFile)).toBe(false);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);
});
