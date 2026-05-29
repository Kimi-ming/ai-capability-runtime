import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

function releaseEvidenceArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: "opencap.release_evidence.v1",
    target: "v0.1 Local Runtime",
    commit: "abc123",
    date: "2026-05-29",
    generatedAt: "2026-05-29T12:34:56.789Z",
    decision: "candidate",
    commands: {
      pnpm_validate: "pass",
      release_evidence_bundle: "pass",
    },
    components: {
      registry: {
        status: "pass",
        capabilityCount: 0,
        invalidManifestCount: 0,
        invalidAdvisoryCount: 0,
        blockedCapabilityCount: 0,
        blockerRefs: [],
      },
      conformance: {
        status: "pass",
        recordCount: 1,
        passedRecords: 1,
        failedRecords: 0,
        invalidRecords: 0,
        profiles: [],
      },
      packages: [],
    },
    blockers: [],
    knownGaps: [],
    policyEffect: "none",
    ...overrides,
  };
}

async function writeArtifact(dir: string, artifact: unknown, fileName = "release-evidence.json"): Promise<string> {
  const filePath = join(dir, fileName);
  await writeFile(filePath, typeof artifact === "string" ? artifact : JSON.stringify(artifact), "utf8");
  return filePath;
}

describe("OpenCap CLI release artifact validate command", () => {
  it("prints a release artifact validation report as JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-artifact-"));

    try {
      const filePath = await writeArtifact(dir, releaseEvidenceArtifact());
      const result = await runOpenCapCli(["release", "artifact", "validate", "--file", filePath, "--json"]);
      const report = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(report).toMatchObject({
        schemaVersion: "opencap.release_artifact_validation.v1",
        artifactSchemaVersion: "opencap.release_evidence.v1",
        valid: true,
        decision: "candidate",
        blockerCount: 0,
        findings: [],
        policyEffect: "none",
      });
      expect(result.stderr).toBe("");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a human-readable release artifact validation summary", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-artifact-"));

    try {
      const filePath = await writeArtifact(dir, releaseEvidenceArtifact());
      const result = await runOpenCapCli(["release", "artifact", "validate", "--file", filePath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("OpenCap release artifact validation");
      expect(result.stdout).toContain("valid: yes");
      expect(result.stdout).toContain("schema: opencap.release_evidence.v1");
      expect(result.stdout).toContain("decision: candidate");
      expect(result.stdout).toContain("blockers: 0");
      expect(result.stdout).toContain("findings: none");
      expect(result.stderr).toBe("");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns invalid validation reports with exit 1 without leaking sensitive artifact text", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-artifact-"));

    try {
      const filePath = await writeArtifact(dir, releaseEvidenceArtifact({
        knownGaps: ["NPM_TOKEN leaked in /Users/example/private/path and opencap.local/audit.sqlite"],
      }));
      const result = await runOpenCapCli(["release", "artifact", "validate", "--file", filePath, "--json"], { allowFailure: true });
      const report = JSON.parse(result.stdout);
      const reportJson = JSON.stringify(report);

      expect(result.exitCode).toBe(1);
      expect(report.valid).toBe(false);
      expect(report.findings.map((finding: { code: string }) => finding.code)).toContain("RELEASE_ARTIFACT_SENSITIVE_TEXT");
      expect(reportJson).not.toContain("NPM_TOKEN");
      expect(reportJson).not.toContain("/Users/example/private/path");
      expect(result.stderr).toBe("");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns a user error for invalid artifact JSON without a stack trace", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencap-cli-release-artifact-"));

    try {
      const filePath = await writeArtifact(dir, "{not json", "broken.json");
      const result = await runOpenCapCli(["release", "artifact", "validate", "--file", filePath, "--json"], { allowFailure: true });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Invalid release artifact JSON: expected valid JSON.");
      expect(result.stderr).not.toContain("Error:");
      expect(result.stderr).not.toMatch(/\n\s+at /);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
