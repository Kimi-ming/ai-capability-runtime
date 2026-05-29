import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
const conformanceRoot = resolve(repoRoot, "packages/runtime/test/fixtures/conformance");

type CliResult = {
  stdout: string;
  stderr: string;
  exitCode: number | string;
};

async function runOpenCapCli(args: string[], options: { allowFailure?: boolean } = {}): Promise<CliResult> {
  try {
    const result = await execFileAsync("tsx", [cliEntry, ...args], {
      cwd: repoRoot,
      env: { ...process.env, INIT_CWD: repoRoot },
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

async function writePackJson(files: Array<{ path: string; size: number }>): Promise<{ dir: string; file: string }> {
  const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-evidence-pack-"));
  const file = join(dir, "pack.json");
  await writeFile(file, JSON.stringify([{ files }]), "utf8");
  return { dir, file };
}

describe("OpenCap CLI release evidence command", () => {
  it("prints a redacted release evidence bundle as JSON", async () => {
    const result = await runOpenCapCli([
      "release",
      "evidence",
      "--registry",
      registryRoot,
      "--records",
      conformanceRoot,
      "--json",
    ]);
    const bundle = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(bundle).toMatchObject({
      schemaVersion: "opencap.release_evidence.v1",
      target: "v0.1 Local Runtime",
      decision: "block-release-tag",
      policyEffect: "none",
      components: {
        conformance: {
          status: "pass",
          failedRecords: 0,
          invalidRecords: 0,
        },
      },
    });
    expect(bundle.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(bundle.date).not.toBe("1970-01-01");
    expect(Date.parse(bundle.generatedAt)).not.toBeNaN();
    expect(bundle.generatedAt).not.toBe("1970-01-01T00:00:00.000Z");
    expect(bundle.components.packages).toEqual([]);
    expect(bundle.blockers.map((blocker: { code: string }) => blocker.code)).toContain("REGISTRY_CAPABILITY_BLOCKER");
    expect(result.stdout).not.toContain("NPM_TOKEN");
    expect(result.stdout).not.toContain("Authorization");
    expect(result.stdout).not.toContain("super-secret-token");
    expect(result.stderr).toBe("");
  }, 60_000);

  it("uses --generated-at for reproducible release evidence timestamps", async () => {
    const result = await runOpenCapCli([
      "release",
      "evidence",
      "--registry",
      registryRoot,
      "--records",
      conformanceRoot,
      "--generated-at",
      "2026-05-29T12:34:56.789Z",
      "--json",
    ]);
    const bundle = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(bundle.generatedAt).toBe("2026-05-29T12:34:56.789Z");
    expect(bundle.date).toBe("2026-05-29");
  }, 60_000);

  it("includes package readiness evidence when package and pack JSON are provided", async () => {
    const fixture = await writePackJson([
      { path: "dist/index.js", size: 10 },
      { path: "schema/manifest.schema.json", size: 20 },
      { path: "package.json", size: 30 },
    ]);

    try {
      const result = await runOpenCapCli([
        "release",
        "evidence",
        "--registry",
        registryRoot,
        "--records",
        conformanceRoot,
        "--package",
        "@opencap/spec",
        "--pack-json",
        fixture.file,
        "--json",
      ]);
      const bundle = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(bundle.components.packages).toEqual([
        expect.objectContaining({
          packageName: "@opencap/spec",
          packEvidence: "provided",
          packFileCount: 3,
          blockerCodes: expect.arrayContaining(["NPM_PACKAGE_PRIVATE"]),
        }),
      ]);
      expect(bundle.blockers.map((blocker: { code: string }) => blocker.code)).toContain("PACKAGE_READINESS_BLOCKER");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable release evidence summary", async () => {
    const result = await runOpenCapCli([
      "release",
      "evidence",
      "--registry",
      registryRoot,
      "--records",
      conformanceRoot,
      "--generated-at",
      "2026-05-29T12:34:56.789Z",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("OpenCap release evidence");
    expect(result.stdout).toContain("date: 2026-05-29");
    expect(result.stdout).toContain("generatedAt: 2026-05-29T12:34:56.789Z");
    expect(result.stdout).toContain("decision: block-release-tag");
    expect(result.stdout).toContain("registry: fail");
    expect(result.stdout).toContain("conformance: pass");
    expect(result.stdout).toContain("blockers:");
  }, 60_000);

  it("returns user errors for invalid release evidence timestamps without stack traces", async () => {
    const invalidGeneratedAt = await runOpenCapCli([
      "release",
      "evidence",
      "--registry",
      registryRoot,
      "--records",
      conformanceRoot,
      "--generated-at",
      "not-a-date",
    ], { allowFailure: true });

    expect(invalidGeneratedAt.exitCode).toBe(1);
    expect(invalidGeneratedAt.stderr).toContain("Invalid --generated-at value: expected ISO timestamp.");
    expect(invalidGeneratedAt.stderr).not.toContain("Error:");
    expect(invalidGeneratedAt.stderr).not.toMatch(/\n\s+at /);

    const invalidDate = await runOpenCapCli([
      "release",
      "evidence",
      "--registry",
      registryRoot,
      "--records",
      conformanceRoot,
      "--date",
      "2026-99-99",
    ], { allowFailure: true });

    expect(invalidDate.exitCode).toBe(1);
    expect(invalidDate.stderr).toContain("Invalid --date value: expected YYYY-MM-DD.");
    expect(invalidDate.stderr).not.toContain("Error:");
    expect(invalidDate.stderr).not.toMatch(/\n\s+at /);
  }, 60_000);

  it("returns user errors for package options without stack traces", async () => {
    const missingPack = await runOpenCapCli([
      "release",
      "evidence",
      "--registry",
      registryRoot,
      "--records",
      conformanceRoot,
      "--package",
      "@opencap/spec",
    ], { allowFailure: true });

    expect(missingPack.exitCode).toBe(1);
    expect(missingPack.stderr).toContain("Use --pack-json when --package is provided.");
    expect(missingPack.stderr).not.toContain("Error:");
    expect(missingPack.stderr).not.toContain("at ");

    const unsupported = await runOpenCapCli([
      "release",
      "evidence",
      "--registry",
      registryRoot,
      "--records",
      conformanceRoot,
      "--package",
      "@opencap/runtime",
      "--pack-json",
      "missing.json",
    ], { allowFailure: true });

    expect(unsupported.exitCode).toBe(1);
    expect(unsupported.stderr).toContain("Unsupported --package value: @opencap/runtime");
    expect(unsupported.stderr).not.toContain("Error:");
    expect(unsupported.stderr).not.toContain("at ");
  }, 60_000);
});
