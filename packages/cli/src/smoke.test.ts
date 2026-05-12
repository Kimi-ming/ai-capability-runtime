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

type CliResult = {
  stdout: string;
  stderr: string;
  exitCode: number | string;
};

async function runOpenCapSmokeStage(
  stage: string,
  args: string[],
  env: NodeJS.ProcessEnv = {},
  options: { allowFailure?: boolean } = {},
): Promise<CliResult> {
  try {
    const result = await execFileAsync("tsx", [cliEntry, ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...env, INIT_CWD: repoRoot },
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });

    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string; code?: number | string };
    if (options.allowFailure) {
      return { stdout: failure.stdout ?? "", stderr: failure.stderr ?? "", exitCode: failure.code ?? "unknown" };
    }

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
      const invalidPolicyPath = join(stateDir, "invalid-policy.yml");
      await writeFile(invalidPolicyPath, `default: ask
rules:
  - id: duplicate
    match:
      risk: harmless
    decision: allow
  - id: duplicate
    match:
      risk: read_only
    decision: allow
`, "utf8");
      const invalidPolicy = await runOpenCapSmokeStage("policy validate invalid", ["policy", "validate", invalidPolicyPath], {}, { allowFailure: true });
      expect(invalidPolicy.exitCode).toBe(1);
      expect(invalidPolicy.stdout).toContain("POLICY_RISK_INVALID");
      expect(invalidPolicy.stdout).toContain("/rules/0/match/risk");
      expect(invalidPolicy.stdout).toContain("rule=duplicate");

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
      const dryRunEnvelope = JSON.parse(dryRun.stdout);
      expect(dryRunEnvelope).toMatchObject({
        envelopeVersion: "opencap.result_envelope.v1",
        capabilityId: "github.create_issue",
        status: "dry_run",
        isError: false,
        structuredContent: {
          request: { method: "POST" },
          egressPreview: {
            targetOrigin: "https://api.github.com",
            fieldsSent: expect.arrayContaining([expect.objectContaining({ path: "/body", destination: "body" })]),
          },
        },
      });
      expect(dryRunEnvelope).not.toHaveProperty("evidence");
      expect(dryRunEnvelope).not.toHaveProperty("policy");
      expect(dryRunEnvelope).not.toHaveProperty("plan");

      const humanDryRun = await runOpenCapSmokeStage("invoke dry-run human", [
        "invoke",
        "github.create_issue",
        "--dry-run",
        "--state-dir",
        stateDir,
        "--input",
        "examples/github-issue-capability/input.json",
      ]);
      expect(humanDryRun.stdout).toContain("github.create_issue dry run generated.");
      expect(humanDryRun.stdout).toContain("status: dry_run");
      expect(humanDryRun.stdout).toContain("warnings: none");
      expect(humanDryRun.stdout).toContain("egress preview:");
      expect(humanDryRun.stdout).toContain("target: https://api.github.com");
      expect(humanDryRun.stdout).toContain("/body -> body");
      expect(humanDryRun.stdout).not.toContain("policy explain:");
      expect(humanDryRun.stdout).not.toContain("resolvedUrl");

      const explainedDryRun = await runOpenCapSmokeStage("invoke dry-run explain", [
        "invoke",
        "github.create_issue",
        "--dry-run",
        "--explain",
        "--state-dir",
        stateDir,
        "--input",
        "examples/github-issue-capability/input.json",
      ]);
      expect(explainedDryRun.stdout).toContain("policy explain:");
      expect(explainedDryRun.stdout).toContain("blocking gate: risk_policy");
      expect(explainedDryRun.stdout).toContain("matched rule: <default>");
      expect(explainedDryRun.stdout).toContain("reason code: RISK_POLICY_DEFAULT_ASK");
      expect(explainedDryRun.stdout).toContain("policy revision: sha256:");
      expect(explainedDryRun.stdout).toContain("capability_id=github.create_issue");
      expect(explainedDryRun.stdout).not.toContain("broken");
      expect(explainedDryRun.stdout).not.toContain("input-secret");

      const failedInvoke = await runOpenCapSmokeStage("invoke secret missing", [
        "invoke",
        "github.create_issue",
        "--state-dir",
        stateDir,
        "--input-json",
        JSON.stringify({ owner: "opencap", repo: "runtime", title: "Bug", body: "broken", token: "input-secret" }),
        "--yes",
        "--json",
        "--verbose",
      ], {}, { allowFailure: true });
      expect(failedInvoke.exitCode).toBe(1);
      const failedEnvelope = JSON.parse(failedInvoke.stdout);
      expect(failedEnvelope).toMatchObject({
        envelopeVersion: "opencap.result_envelope.v1",
        capabilityId: "github.create_issue",
        status: "blocked",
        isError: true,
        structuredContent: { error: { code: "SECRET_MISSING" } },
      });
      expect(failedEnvelope.evidence).toBeDefined();
      expect(JSON.stringify(failedEnvelope)).not.toContain("input-secret");

      const logs = await runOpenCapSmokeStage("logs", ["logs", "--state-dir", stateDir, "--status", "dry_run", "--json"]);
      expect(JSON.parse(logs.stdout)).toEqual(expect.arrayContaining([
        expect.objectContaining({ capabilityId: "github.create_issue", status: "dry_run" }),
      ]));
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);
});
