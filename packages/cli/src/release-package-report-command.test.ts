import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(cliSourceFile), "../../..");
const cliEntry = resolve(repoRoot, "packages/cli/src/index.ts");

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
  const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-pack-"));
  const file = join(dir, "pack.json");
  await writeFile(file, JSON.stringify([{ files }]), "utf8");
  return { dir, file };
}

async function writeNpmPackDryRunJson(packageDir: string): Promise<{ dir: string; file: string }> {
  const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-pack-smoke-"));
  const result = await execFileAsync("npm", ["pack", "--dry-run", "--json"], {
    cwd: packageDir,
    env: {
      ...process.env,
      npm_config_cache: join(dir, "npm-cache"),
    },
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  const file = join(dir, "pack.json");
  await writeFile(file, result.stdout, "utf8");
  return { dir, file };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("OpenCap CLI release package report command", () => {
  it("prints package readiness as JSON without running npm publish", async () => {
    const result = await runOpenCapCli(["release", "package", "report", "--package", "@opencap/spec", "--json"]);
    const report = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(report).toMatchObject({
      schemaVersion: "opencap.npm_package_readiness.v1",
      packageName: "@opencap/spec",
      version: "0.1.0",
      candidate: true,
      pack: {
        evidence: "not-run",
      },
      policyEffect: "none",
    });
    expect(report.blockers.map((blocker: { code: string }) => blocker.code)).toContain("NPM_PACKAGE_PRIVATE");
    expect(result.stdout).not.toContain("NPM_TOKEN");
    expect(result.stdout).not.toContain("NODE_AUTH_TOKEN");
    expect(result.stderr).toBe("");
  }, 60_000);

  it("accepts npm pack dry-run JSON and reports forbidden files", async () => {
    const fixture = await writePackJson([
      { path: "dist/index.js", size: 10 },
      { path: ".env", size: 20 },
      { path: "opencap.local/audit.db", size: 30 },
      { path: "logs/token.log", size: 40 },
    ]);

    try {
      const result = await runOpenCapCli([
        "release",
        "package",
        "report",
        "--package",
        "@opencap/spec",
        "--pack-json",
        fixture.file,
        "--json",
      ]);
      const report = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(report.pack).toMatchObject({
        evidence: "provided",
        fileCount: 4,
        totalSize: 100,
      });
      expect(report.pack.forbiddenFiles.map((file: { reasonCode: string }) => file.reasonCode)).toEqual(expect.arrayContaining([
        "ENV_FILE",
        "LOCAL_STATE",
        "DATABASE_OR_LOG",
        "SECRET_SHAPED_FILE",
      ]));
      expect(report.blockers.map((blocker: { code: string }) => blocker.code)).toContain("NPM_PACKAGE_FORBIDDEN_PACK_FILE");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable package readiness report", async () => {
    const result = await runOpenCapCli(["release", "package", "report", "--package", "@opencap/cli"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("OpenCap package readiness");
    expect(result.stdout).toContain("package: @opencap/cli");
    expect(result.stdout).toContain("pack evidence: not-run");
    expect(result.stdout).toContain("blockers:");
    expect(result.stdout).toContain("NPM_PACKAGE_PRIVATE");
  }, 60_000);

  it("writes package readiness JSON evidence to safe output files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-package-output-"));
    const jsonOutput = join(dir, "reports", "package-readiness.json");
    const humanOutput = join(dir, "reports", "package-readiness-human.json");

    try {
      const json = await runOpenCapCli([
        "release",
        "package",
        "report",
        "--package",
        "@opencap/spec",
        "--output",
        jsonOutput,
        "--json",
      ]);
      const stdoutReport = JSON.parse(json.stdout) as { schemaVersion: string; packageName: string };
      const fileReport = JSON.parse(await readFile(jsonOutput, "utf8")) as typeof stdoutReport;

      expect(json.exitCode).toBe(0);
      expect(fileReport).toEqual(stdoutReport);
      expect(fileReport.schemaVersion).toBe("opencap.npm_package_readiness.v1");
      expect(fileReport.packageName).toBe("@opencap/spec");

      const human = await runOpenCapCli([
        "release",
        "package",
        "report",
        "--package",
        "@opencap/cli",
        "--output",
        humanOutput,
      ]);
      const humanFileReport = JSON.parse(await readFile(humanOutput, "utf8")) as { schemaVersion: string; packageName: string };

      expect(human.exitCode).toBe(0);
      expect(human.stdout).toContain("OpenCap package readiness");
      expect(human.stdout.trim().startsWith("{")).toBe(false);
      expect(humanFileReport.schemaVersion).toBe("opencap.npm_package_readiness.v1");
      expect(humanFileReport.packageName).toBe("@opencap/cli");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("runs local npm pack dry-run smoke for alpha candidate packages", async () => {
    for (const candidate of [
      { packageName: "@opencap/spec", packageDir: resolve(repoRoot, "packages/spec") },
      { packageName: "@opencap/cli", packageDir: resolve(repoRoot, "packages/cli") },
    ]) {
      const fixture = await writeNpmPackDryRunJson(candidate.packageDir);

      try {
        const result = await runOpenCapCli([
          "release",
          "package",
          "report",
          "--package",
          candidate.packageName,
          "--pack-json",
          fixture.file,
          "--json",
        ]);
        const report = JSON.parse(result.stdout);

        expect(result.exitCode).toBe(0);
        expect(report.packageName).toBe(candidate.packageName);
        expect(report.pack.evidence).toBe("provided");
        expect(report.pack.fileCount).toBeGreaterThan(0);
        expect(report.pack.forbiddenFiles).toEqual([]);
        expect(report.blockers.map((blocker: { code: string }) => blocker.code)).toContain("NPM_PACKAGE_PRIVATE");
        expect(result.stdout).not.toContain("NPM_TOKEN");
        expect(result.stdout).not.toContain("NODE_AUTH_TOKEN");
      } finally {
        await rm(fixture.dir, { recursive: true, force: true });
      }
    }
  }, 60_000);

  it("returns user errors for unsupported package and invalid pack JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-package-error-"));
    const unsupportedOutput = join(dir, "unsupported.json");
    const invalidPackOutput = join(dir, "invalid-pack.json");

    const unsupported = await runOpenCapCli([
      "release",
      "package",
      "report",
      "--package",
      "@opencap/runtime",
      "--output",
      unsupportedOutput,
    ], { allowFailure: true });
    expect(unsupported.exitCode).toBe(1);
    expect(unsupported.stderr).toContain("Unsupported --package value: @opencap/runtime");
    expect(unsupported.stderr).not.toContain("Error:");
    expect(unsupported.stderr).not.toContain("at ");
    expect(await pathExists(unsupportedOutput)).toBe(false);

    const fixture = await writePackJson([]);
    await writeFile(fixture.file, "{}", "utf8");

    try {
      const invalidPack = await runOpenCapCli([
        "release",
        "package",
        "report",
        "--package",
        "@opencap/spec",
        "--pack-json",
        fixture.file,
        "--output",
        invalidPackOutput,
      ], { allowFailure: true });
      expect(invalidPack.exitCode).toBe(1);
      expect(invalidPack.stderr).toContain("Invalid --pack-json");
      expect(invalidPack.stderr).not.toContain("Error:");
      expect(invalidPack.stderr).not.toContain("at ");
      expect(await pathExists(invalidPackOutput)).toBe(false);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("rejects unsafe package readiness output paths without partial files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-package-output-"));
    const outputPath = join(dir, ".env.package-readiness.json");

    try {
      const result = await runOpenCapCli([
        "release",
        "package",
        "report",
        "--package",
        "@opencap/spec",
        "--output",
        outputPath,
      ], { allowFailure: true });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Unsafe --output path:");
      expect(result.stderr).not.toMatch(/\n\s+at /);
      expect(await pathExists(outputPath)).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
