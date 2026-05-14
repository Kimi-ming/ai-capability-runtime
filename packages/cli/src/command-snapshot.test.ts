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

function normalizeCliOutput(result: CliResult, stateDir?: string): CliResult {
  const normalize = (value: string): string => {
    let normalized = value.split(repoRoot).join("<repo>");
    if (stateDir !== undefined) {
      normalized = normalized.split(stateDir).join("<state>");
    }
    normalized = normalized.replace(/\(node:\d+\)/g, "(node:<pid>)");
    return normalized.trimEnd();
  };

  return {
    stdout: normalize(result.stdout),
    stderr: normalize(result.stderr),
    exitCode: result.exitCode,
  };
}

describe("OpenCap CLI command snapshots", () => {
  it("matches the validate and empty state command output contract", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-snapshot-state-"));

    try {
      const validate = normalizeCliOutput(await runOpenCapCli(["validate", "registry/developer-tools/github.create_issue"]), stateDir);
      const emptyList = normalizeCliOutput(await runOpenCapCli(["list", "--state-dir", stateDir]), stateDir);
      const emptyLogs = normalizeCliOutput(await runOpenCapCli(["logs", "--state-dir", stateDir]), stateDir);
      const emptyDecisionLog = normalizeCliOutput(await runOpenCapCli(["decision-log", "export", "--state-dir", stateDir]), stateDir);

      expect({ validate, emptyList, emptyLogs, emptyDecisionLog }).toMatchInlineSnapshot(`
        {
          "emptyDecisionLog": {
            "exitCode": 0,
            "stderr": "(node:<pid>) ExperimentalWarning: SQLite is an experimental feature and might change at any time
        (Use \`node --trace-warnings ...\` to show where the warning was created)",
            "stdout": "No decision log records found.",
          },
          "emptyList": {
            "exitCode": 0,
            "stderr": "",
            "stdout": "No installed capabilities found.",
          },
          "emptyLogs": {
            "exitCode": 0,
            "stderr": "(node:<pid>) ExperimentalWarning: SQLite is an experimental feature and might change at any time
        (Use \`node --trace-warnings ...\` to show where the warning was created)",
            "stdout": "No invocation logs found.",
          },
          "validate": {
            "exitCode": 0,
            "stderr": "",
            "stdout": "Valid manifest: <repo>/registry/developer-tools/github.create_issue/manifest.yml",
          },
        }
      `);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("matches installed list and policy validation command output contract", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-snapshot-state-"));

    try {
      await runOpenCapCli(["install", "github.create_issue", "--state-dir", stateDir]);

      const humanList = normalizeCliOutput(await runOpenCapCli(["list", "--state-dir", stateDir]), stateDir);
      const jsonList = normalizeCliOutput(await runOpenCapCli(["list", "--state-dir", stateDir, "--json"]), stateDir);

      const invalidPolicyPath = join(stateDir, "invalid-policy.yml");
      await writeFile(invalidPolicyPath, `default: ask
rules:
  - id: invalid-risk
    match:
      risk: harmless
    decision: allow
`, "utf8");
      const invalidPolicy = normalizeCliOutput(await runOpenCapCli(["policy", "validate", invalidPolicyPath], { allowFailure: true }), stateDir);

      expect({ humanList, jsonList, invalidPolicy }).toMatchInlineSnapshot(`
        {
          "humanList": {
            "exitCode": 0,
            "stderr": "",
            "stdout": "id version type risk lifecycle trust maintainer license status
        github.create_issue 0.1.0 http write installed experimental opencap MIT enabled",
          },
          "invalidPolicy": {
            "exitCode": 1,
            "stderr": "",
            "stdout": "error POLICY_RISK_INVALID <state>/invalid-policy.yml/rules/0/match/risk rule=invalid-risk: Policy risk must be one of: read_only, write, external_send, destructive, financial, code_execution, secret_access.",
          },
          "jsonList": {
            "exitCode": 0,
            "stderr": "",
            "stdout": "[
          {
            "id": "github.create_issue",
            "installPath": "<state>/installed/github.create_issue",
            "version": "0.1.0",
            "type": "http",
            "risk": "write",
            "lifecycle": "installed",
            "trustLevel": "experimental",
            "maintainer": "opencap",
            "license": "MIT",
            "status": "enabled"
          }
        ]",
          },
        }
      `);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);
});
