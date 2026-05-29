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

async function writeRegistryIndexArtifact(cwd: string): Promise<string> {
  const filePath = join(cwd, "registry-index.json");
  await runOpenCapCli([
    "registry",
    "index",
    "build",
    "--registry",
    registryRoot,
    "--output",
    filePath,
    "--json",
  ], { cwd });
  return filePath;
}

describe("OpenCap CLI registry index validate command", () => {
  it("prints a valid Registry index validation report as JSON without mutating local state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-index-validate-"));

    try {
      const artifactPath = await writeRegistryIndexArtifact(cwd);
      const result = await runOpenCapCli(["registry", "index", "validate", "--file", artifactPath, "--json"], { cwd });
      const report = JSON.parse(result.stdout) as {
        schemaVersion: string;
        valid: boolean;
        artifactSchemaVersion: string;
        profile: string;
        findingCount: number;
        policyEffect: string;
      };

      expect(result.exitCode).toBe(0);
      expect(await pathExists(join(cwd, "opencap.local"))).toBe(false);
      expect(report).toMatchObject({
        schemaVersion: "opencap.registry_index_validation.v1",
        valid: true,
        artifactSchemaVersion: "opencap.registry.index.v1",
        profile: "opencap.registry.index_cache_sync.v1",
        findingCount: 0,
        policyEffect: "none",
      });
      expect(result.stdout).not.toContain("GITHUB_TOKEN");
      expect(result.stdout).not.toContain("Authorization");
      expect(result.stdout).not.toContain("/Users/");
      expect(result.stderr).toBe("");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable validation summary", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-index-validate-"));

    try {
      const artifactPath = await writeRegistryIndexArtifact(cwd);
      const result = await runOpenCapCli(["registry", "index", "validate", "--file", artifactPath], { cwd });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("OpenCap registry index validation");
      expect(result.stdout).toContain("valid: yes");
      expect(result.stdout).toContain("schema: opencap.registry.index.v1");
      expect(result.stdout).toContain("profile: opencap.registry.index_cache_sync.v1");
      expect(result.stdout).toContain("digest: sha256:");
      expect(result.stdout).toContain("findings: none");
      expect(result.stdout.trim().startsWith("{")).toBe(false);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("writes invalid validation reports before returning exit 1 without leaking raw artifact text", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-index-validate-"));
    const artifactPath = join(cwd, "unsafe-registry-index.json");
    const outputPath = join(cwd, "reports", "registry-index-validation.json");

    try {
      await writeFile(artifactPath, JSON.stringify({
        schemaVersion: "opencap.registry.index.v1",
        profile: "opencap.registry.index_cache_sync.v1",
        generatedAt: "2026-05-29T00:00:00.000Z",
        capabilityCount: 1,
        invalidManifestCount: 0,
        capabilities: [{
          id: "github.create_issue",
          name: "Create GitHub Issue",
          version: "0.1.0",
          category: "developer-tools",
          path: "/Users/kimi/private/manifest.yml",
          manifestDigest: "sha256:not-a-real-digest",
          lifecycle: "active",
          trustLevel: "experimental",
          quality: {
            rubricVersion: "opencap.quality_score.v1",
            total: 90,
            band: "verified",
            policyEffect: "allow",
          },
          advisoryRefs: [],
          defaultInstallTrusted: true,
          blockingReasons: [],
          policyEffect: "allow",
        }],
        input: { token: "GITHUB_TOKEN" },
        providerRawResponse: "https://api.github.com/repos/demo/private",
        signatureStatus: "signed",
        indexDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        policyEffect: "allow",
      }), "utf8");

      const result = await runOpenCapCli([
        "registry",
        "index",
        "validate",
        "--file",
        artifactPath,
        "--output",
        outputPath,
        "--json",
      ], { allowFailure: true, cwd });
      const stdoutReport = JSON.parse(result.stdout);
      const fileReport = JSON.parse(await readFile(outputPath, "utf8"));
      const serialized = JSON.stringify(fileReport);

      expect(result.exitCode).toBe(1);
      expect(fileReport).toEqual(stdoutReport);
      expect(fileReport.valid).toBe(false);
      expect(fileReport.findingCount).toBeGreaterThan(0);
      expect(serialized).not.toContain("GITHUB_TOKEN");
      expect(serialized).not.toContain("https://api.github.com");
      expect(serialized).not.toContain("/Users/");
      expect(serialized).not.toContain("Authorization");
      expect(result.stderr).toBe("");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);

  it("rejects unsafe output paths and invalid JSON without partial validation reports", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-cli-registry-index-validate-"));
    const artifactPath = join(cwd, "broken-registry-index.json");
    const unsafeFile = join(cwd, ".env.registry-index-validation.json");
    const unsafeDir = join(cwd, "artifact-dir");
    const reportPath = join(cwd, "reports", "registry-index-validation.json");

    try {
      await mkdir(unsafeDir);
      await writeFile(artifactPath, "{not json", "utf8");

      const unsafe = await runOpenCapCli([
        "registry",
        "index",
        "validate",
        "--file",
        artifactPath,
        "--output",
        unsafeFile,
      ], { allowFailure: true, cwd });
      expect(unsafe.exitCode).toBe(1);
      expect(unsafe.stderr).toContain("Unsafe --output path:");
      expect(await pathExists(unsafeFile)).toBe(false);

      const unsafeDirectory = await runOpenCapCli([
        "registry",
        "index",
        "validate",
        "--file",
        artifactPath,
        "--output",
        unsafeDir,
      ], { allowFailure: true, cwd });
      expect(unsafeDirectory.exitCode).toBe(1);
      expect(unsafeDirectory.stderr).toContain("Unsafe --output path:");

      const invalidJson = await runOpenCapCli([
        "registry",
        "index",
        "validate",
        "--file",
        artifactPath,
        "--output",
        reportPath,
      ], { allowFailure: true, cwd });
      expect(invalidJson.exitCode).toBe(1);
      expect(invalidJson.stdout).toBe("");
      expect(invalidJson.stderr).toContain("Invalid Registry index artifact JSON");
      expect(invalidJson.stderr).not.toMatch(/\n\s+at /);
      expect(await pathExists(reportPath)).toBe(false);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);
});
