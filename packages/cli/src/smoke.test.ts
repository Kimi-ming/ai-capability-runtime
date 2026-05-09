import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
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
};

async function runOpenCapSmokeStage(stage: string, args: string[], env: NodeJS.ProcessEnv = {}): Promise<CliResult> {
  try {
    const result = await execFileAsync("tsx", [cliEntry, ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...env, INIT_CWD: repoRoot },
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });

    return { stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string; code?: number | string };
    throw new Error(
      [
        `OpenCap CLI smoke stage failed: ${stage}`,
        `exitCode: ${failure.code ?? "unknown"}`,
        `args: ${args.join(" ")}`,
        `stdout:\n${failure.stdout ?? ""}`,
        `stderr:\n${failure.stderr ?? ""}`,
      ].join("\n"),
      { cause: error },
    );
  }
}

describe("OpenCap CLI smoke test", () => {
  it("runs validate, install, list, invoke dry-run, and logs with a temporary state dir", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-smoke-state-"));

    try {
      await runOpenCapSmokeStage("validate", ["validate", "registry/developer-tools/github.create_issue"]);
      await runOpenCapSmokeStage("install", ["install", "github.create_issue", "--state-dir", stateDir]);

      const list = await runOpenCapSmokeStage("list", ["list", "--state-dir", stateDir, "--json"]);
      expect(JSON.parse(list.stdout)).toMatchObject([
        { id: "github.create_issue", status: "enabled", type: "http" },
      ]);

      const dryRun = await runOpenCapSmokeStage("invoke dry-run", [
        "invoke",
        "github.create_issue",
        "--dry-run",
        "--state-dir",
        stateDir,
        "--input",
        "examples/github-issue-capability/input.json",
        "--json",
      ]);
      expect(JSON.parse(dryRun.stdout)).toMatchObject({
        capabilityId: "github.create_issue",
        mode: "dry_run",
        plan: { method: "POST" },
      });

      const logs = await runOpenCapSmokeStage("logs", ["logs", "--state-dir", stateDir, "--status", "dry_run", "--json"]);
      expect(JSON.parse(logs.stdout)).toMatchObject([
        { capabilityId: "github.create_issue", status: "dry_run" },
      ]);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);
});
