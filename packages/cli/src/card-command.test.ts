import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
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

async function snapshotStateFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  const snapshots: string[] = [];

  for (const entry of entries) {
    const relativePath = join(prefix, entry.name);
    if (entry.isDirectory()) {
      snapshots.push(...await snapshotStateFiles(root, relativePath));
      continue;
    }

    const fileStat = await stat(join(root, relativePath));
    snapshots.push(`${relativePath}:${fileStat.size}:${fileStat.mtimeMs}`);
  }

  return snapshots.sort();
}

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

describe("OpenCap CLI card command", () => {
  it("prints a redacted Capability Card JSON document for an installed Capability", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-card-state-"));

    try {
      await runOpenCapCli(["install", "github.create_issue", "--state-dir", stateDir]);

      const result = await runOpenCapCli(["card", "github.create_issue", "--state-dir", stateDir, "--json"]);
      const card = JSON.parse(result.stdout) as {
        schemaVersion: string;
        cardKind: string;
        generatedBy: string;
        capability: { id: string; version: string; name: string };
        summary: string;
        risk: { highestRisk: string; requiresConfirmation: boolean };
        permissions: Array<{ resource: string; action: string; risk: string; confirmation: string }>;
        auth: { provider: string; envName: string; placement: string; scopes: string[]; credentialValueRedacted: boolean };
        install: { source: string; sourceRef: string };
        generatedFrom: Array<{ kind: string; digest?: string; ref?: string }>;
      };

      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain("GITHUB_TOKEN");
      expect(card).toMatchObject({
        schemaVersion: "opencap.card.v1",
        cardKind: "capability",
        generatedBy: "opencap.runtime",
        capability: {
          id: "github.create_issue",
          version: "0.1.0",
          name: "Create GitHub Issue",
        },
        summary: "Create a GitHub issue from structured input.",
        risk: {
          highestRisk: "write",
          requiresConfirmation: true,
        },
        auth: {
          provider: "github",
          envName: "GITHUB_TOKEN",
          placement: "bearer",
          scopes: ["issues:write"],
          credentialValueRedacted: true,
        },
        install: {
          source: "registry",
          sourceRef: "github.create_issue",
        },
      });
      expect(card.permissions).toEqual([
        {
          resource: "github.issue",
          action: "create",
          risk: "write",
          confirmation: "ask",
        },
      ]);
      expect(card.generatedFrom.some((source) => source.kind === "manifest" && source.digest?.startsWith("sha256:"))).toBe(true);
      expect(result.stdout).not.toContain("secret");
      expect(result.stdout).not.toContain("Authorization");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns a user error when the Capability is not installed", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-card-state-"));

    try {
      const result = await runOpenCapCli(["card", "github.create_issue", "--state-dir", stateDir, "--json"], {
        allowFailure: true,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Installed capability not found: github.create_issue");
      expect(result.stderr).not.toContain("Error:");
      expect(result.stderr).not.toContain("at ");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("prints a Trust Card JSON document for an installed Capability without mutating state", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-card-state-"));

    try {
      await runOpenCapCli(["install", "github.create_issue", "--state-dir", stateDir]);
      const before = await snapshotStateFiles(stateDir);

      const result = await runOpenCapCli(["card", "github.create_issue", "--state-dir", stateDir, "--kind", "trust", "--json"]);
      const card = JSON.parse(result.stdout) as {
        schemaVersion: string;
        cardKind: string;
        generatedBy: string;
        capability: { id: string; version: string; manifestDigest?: string };
        trustLevel: string;
        advisories: { open: number; refs: string[] };
        maintainer: { status: string; name?: string };
        provenance: { manifestDigest?: string; packageDigest?: string; registryCommit?: string };
        limitations: string[];
        disclaimer: string;
      };

      expect(result.exitCode).toBe(0);
      expect(await snapshotStateFiles(stateDir)).toEqual(before);
      expect(card).toMatchObject({
        schemaVersion: "opencap.card.v1",
        cardKind: "trust",
        generatedBy: "opencap.runtime",
        capability: {
          id: "github.create_issue",
          version: "0.1.0",
        },
        trustLevel: "unverified",
        advisories: {
          open: 0,
          refs: [],
        },
        maintainer: {
          status: "unknown",
          name: "opencap",
        },
      });
      expect(card.provenance.manifestDigest).toMatch(/^sha256:/);
      expect(card.capability.manifestDigest).toBe(card.provenance.manifestDigest);
      expect(card.limitations).toContain("Trust level does not override local policy, consent, outbound policy, or audit.");
      expect(card.disclaimer).toContain("not a security guarantee");
      expect(card.disclaimer).toContain("not an authorization decision");
      expect(result.stdout).not.toContain("GITHUB_TOKEN");
      expect(result.stdout).not.toContain("Authorization");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);

  it("returns a user error for an unsupported card kind", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-cli-card-state-"));

    try {
      const result = await runOpenCapCli(["card", "github.create_issue", "--state-dir", stateDir, "--kind", "consent", "--json"], {
        allowFailure: true,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Invalid --kind value: consent");
      expect(result.stderr).not.toContain("Error:");
      expect(result.stderr).not.toContain("at ");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);
});
