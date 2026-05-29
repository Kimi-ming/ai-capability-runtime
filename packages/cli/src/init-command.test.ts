import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import YAML from "yaml";
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

describe("OpenCap CLI init command", () => {
  it("creates a local Capability scaffold without touching state", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-init-"));
    const outputDir = join(dir, "example.echo");

    try {
      const result = await runOpenCapCli([
        "init",
        "example.echo",
        "--category",
        "developer-tools",
        "--output",
        outputDir,
        "--title",
        "Example Echo",
        "--description",
        "Echo a message through an example API.",
        "--url",
        "https://api.example.com/echo?message={{message}}",
        "--auth",
        "api-key-bearer",
        "--provider",
        "example",
        "--env",
        "EXAMPLE_API_KEY",
        "--scope",
        "read",
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("Created Capability scaffold");
      expect(result.stdout).toContain(`opencap validate ${outputDir}`);
      expect(result.stdout).toContain("pnpm validate");

      const manifest = YAML.parse(await readFile(join(outputDir, "manifest.yml"), "utf8"));
      const registryTest = YAML.parse(await readFile(join(outputDir, "tests/basic.yml"), "utf8"));
      const readme = await readFile(join(outputDir, "README.md"), "utf8");

      expect(manifest).toMatchObject({
        id: "example.echo",
        type: "http",
        metadata: { category: "developer-tools" },
        auth: { type: "api_key", provider: "example", env: "EXAMPLE_API_KEY" },
      });
      expect(registryTest).toMatchObject({
        capability: "example.echo",
        expect: { status: "dry_run" },
      });
      expect(readme).toContain("Example Echo");

      const validateResult = await runOpenCapCli(["validate", outputDir]);
      expect(validateResult.exitCode).toBe(0);
      expect(validateResult.stdout).toContain("Valid manifest:");

      await expect(readFile(join(outputDir, "opencap.local", "logs.sqlite"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("refuses to overwrite existing scaffold files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-init-"));
    const outputDir = join(dir, "existing");

    try {
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, "manifest.yml"), "keep me", "utf8");

      const result = await runOpenCapCli([
        "init",
        "example.echo",
        "--category",
        "developer-tools",
        "--output",
        outputDir,
      ], { allowFailure: true });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Refusing to overwrite existing scaffold file:");
      expect(result.stderr).not.toContain("Error:");
      expect(result.stderr).not.toMatch(/\n\s+at /);
      expect(await readFile(join(outputDir, "manifest.yml"), "utf8")).toBe("keep me");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("rejects unsafe output directories without leaving scaffold files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-init-"));
    const outputDir = join(dir, "opencap.local", "example.echo");

    try {
      const result = await runOpenCapCli([
        "init",
        "example.echo",
        "--category",
        "developer-tools",
        "--output",
        outputDir,
      ], { allowFailure: true });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Unsafe --output path:");
      expect(result.stderr).not.toContain("Error:");
      expect(result.stderr).not.toMatch(/\n\s+at /);
      await expect(readFile(join(outputDir, "manifest.yml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns a user error for invalid ids without a stack trace", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-init-"));
    const outputDir = join(dir, "invalid");

    try {
      const result = await runOpenCapCli([
        "init",
        "token.leak",
        "--category",
        "developer-tools",
        "--output",
        outputDir,
      ], { allowFailure: true });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Unsafe capability id:");
      expect(result.stderr).not.toContain("Error:");
      expect(result.stderr).not.toMatch(/\n\s+at /);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
