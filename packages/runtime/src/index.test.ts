import { mkdtemp, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_POLICIES_YML,
  DEFAULT_STATE_DIR_NAME,
  OPENCAP_STATE_DIR_ENV,
  InstallCapabilityError,
  PolicyParseError,
  OpenCapRuntime,
  ensureLocalStateDir,
  getLocalStatePaths,
  installCapability,
  listInstalledCapabilities,
  loadInstalledCapabilities,
  loadPolicySet,
  parsePolicyYml,
  resolveStateDir,
} from "./index.js";


async function writeCapability(root: string, category: string, id: string, manifestId = id): Promise<string> {
  const dir = join(root, "registry", category, id);
  await mkdir(join(dir, "tests"), { recursive: true });
  await writeFile(
    join(dir, "manifest.yml"),
    `id: ${manifestId}
name: Test Capability
description: Test Capability.
version: 0.1.0
type: http
input:
  type: object
output:
  type: object
auth:
  type: none
permissions:
  - resource: test.resource
    action: read
    risk: read_only
    confirmation: allow
execution:
  method: GET
  url: https://example.com
  timeout_ms: 10000
metadata:
  category: developer-tools
  maintainer: opencap
  license: MIT
  trust_level: experimental
`,
  );
  await writeFile(join(dir, "README.md"), `# ${id}\n`);
  await writeFile(
    join(dir, "tests", "basic.yml"),
    `name: basic
capability: ${id}
mode: dry_run
expect:
  status: dry_run
  request:
    method: GET
    url: https://example.com
`,
  );
  return dir;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("state dir helpers", () => {
  it("uses <cwd>/opencap.local by default", () => {
    const cwd = "/tmp/opencap-project";

    expect(resolveStateDir({ cwd, env: {} })).toBe(resolve(cwd, DEFAULT_STATE_DIR_NAME));
  });

  it("uses OPENCAP_STATE_DIR before the default", () => {
    const cwd = "/tmp/opencap-project";

    expect(resolveStateDir({ cwd, env: { [OPENCAP_STATE_DIR_ENV]: "custom-state" } })).toBe(
      resolve(cwd, "custom-state"),
    );
  });

  it("uses explicit stateDir before OPENCAP_STATE_DIR", () => {
    const cwd = "/tmp/opencap-project";

    expect(
      resolveStateDir({
        cwd,
        stateDir: "flag-state",
        env: { [OPENCAP_STATE_DIR_ENV]: "env-state" },
      }),
    ).toBe(resolve(cwd, "flag-state"));
  });

  it("returns stable local state paths", () => {
    const root = "/tmp/opencap-project/opencap.local";
    const paths = getLocalStatePaths(root);

    expect(paths.root).toBe(resolve(root));
    expect(paths.installedDir).toBe(resolve(root, "installed"));
    expect(paths.tmpDir).toBe(resolve(root, "tmp"));
    expect(paths.policiesFile).toBe(resolve(root, "policies.yml"));
    expect(paths.logsDatabaseFile).toBe(resolve(root, "logs.sqlite"));
  });

  it("creates the required V1 state files and directories", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-runtime-"));
    const paths = await ensureLocalStateDir({ cwd, env: {} });

    expect(await exists(paths.root)).toBe(true);
    expect(await exists(paths.installedDir)).toBe(true);
    expect(await exists(paths.tmpDir)).toBe(true);
    expect(await readFile(paths.policiesFile, "utf8")).toBe(DEFAULT_POLICIES_YML);
    expect(await exists(paths.logsDatabaseFile)).toBe(false);
    expect(await exists(paths.cacheDir)).toBe(false);
    expect(await exists(resolve(cwd, "registry"))).toBe(false);
  });

  it("does not overwrite an existing policies file", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-runtime-"));
    const paths = getLocalStatePaths({ cwd, env: {} });
    const customPolicy = "default: deny\nrules: []\n";

    await mkdir(paths.root, { recursive: true });
    await writeFile(paths.policiesFile, customPolicy);

    await ensureLocalStateDir({ cwd, env: {} });

    await expect(readFile(paths.policiesFile, "utf8")).resolves.toBe(customPolicy);
  });

  it("initializes OpenCapRuntime with resolved state paths", () => {
    const runtime = new OpenCapRuntime({ cwd: "/tmp/opencap-project", env: {} });

    expect(runtime.stateDir).toBe(resolve("/tmp/opencap-project", DEFAULT_STATE_DIR_NAME));
    expect(runtime.statePaths.installedDir).toBe(resolve(runtime.stateDir, "installed"));
  });

  it("lets OpenCapRuntime initialize local state on demand", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-runtime-"));
    const runtime = new OpenCapRuntime({ cwd, env: {} });
    const paths = await runtime.ensureLocalStateDir();

    expect(await exists(paths.installedDir)).toBe(true);
    await expect(readFile(paths.policiesFile, "utf8")).resolves.toBe(DEFAULT_POLICIES_YML);
  });
});


describe("policy parser", () => {
  it("loads the default ask policy when policies.yml is missing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-policy-"));
    const paths = getLocalStatePaths({ cwd, env: {} });

    await expect(loadPolicySet({ cwd, env: {} })).resolves.toEqual({
      default: "ask",
      rules: [],
      sourcePath: paths.policiesFile,
    });
  });

  it("parses a structured policy set", () => {
    expect(
      parsePolicyYml(`default: ask
rules:
  - id: allow-read
    match:
      capability_id: github.search_repo
      risk: read_only
      resource: github.repo
      action: search
      channel: mcp
      host: cursor
      trust_level: tested
    decision: allow
    reason: Tested read-only search is allowed.
`),
    ).toEqual({
      default: "ask",
      sourcePath: "policies.yml",
      rules: [
        {
          id: "allow-read",
          match: {
            capabilityId: "github.search_repo",
            risk: "read_only",
            resource: "github.repo",
            action: "search",
            channel: "mcp",
            host: "cursor",
            trustLevel: "tested",
          },
          decision: "allow",
          reason: "Tested read-only search is allowed.",
        },
      ],
    });
  });

  it("rejects invalid decisions", () => {
    expect(() => parsePolicyYml("default: maybe\nrules: []\n")).toThrow(PolicyParseError);
    expect(() => parsePolicyYml("default: maybe\nrules: []\n")).toThrow(/default/);
  });

  it("rejects invalid risk values", () => {
    expect(() =>
      parsePolicyYml(`default: ask
rules:
  - match:
      risk: harmless
    decision: allow
`),
    ).toThrow(PolicyParseError);
  });
});

describe("installCapability", () => {
  it("copies a registry capability into local state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");

    const result = await installCapability({ cwd, id: "github.create_issue", env: {} });

    expect(result.destinationDir).toBe(resolve(cwd, "opencap.local", "installed", "github.create_issue"));
    expect(await exists(join(result.destinationDir, "manifest.yml"))).toBe(true);
    expect(await exists(join(result.destinationDir, "README.md"))).toBe(true);
    expect(await exists(join(result.destinationDir, "tests", "basic.yml"))).toBe(true);
    expect(await exists(resolve(cwd, "registry", "developer-tools", "github.create_issue", "manifest.yml"))).toBe(true);
  });

  it("fails when the capability is missing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await mkdir(join(cwd, "registry"), { recursive: true });

    await expect(installCapability({ cwd, id: "missing.capability", env: {} })).rejects.toMatchObject({
      code: "CAPABILITY_NOT_FOUND",
    });
  });

  it("fails when more than one registry entry matches", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await writeCapability(cwd, "productivity", "github.create_issue");

    await expect(installCapability({ cwd, id: "github.create_issue", env: {} })).rejects.toMatchObject({
      code: "CAPABILITY_AMBIGUOUS",
    });
  });

  it("refuses to overwrite an installed capability without force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    await expect(installCapability({ cwd, id: "github.create_issue", env: {} })).rejects.toBeInstanceOf(
      InstallCapabilityError,
    );
    await expect(installCapability({ cwd, id: "github.create_issue", env: {} })).rejects.toMatchObject({
      code: "CAPABILITY_ALREADY_INSTALLED",
    });
  });

  it("replaces an installed capability with force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    const first = await installCapability({ cwd, id: "github.create_issue", env: {} });
    await writeFile(join(first.destinationDir, "README.md"), "local edit");

    await installCapability({ cwd, id: "github.create_issue", force: true, env: {} });

    await expect(readFile(join(first.destinationDir, "README.md"), "utf8")).resolves.toBe("# github.create_issue\n");
  });
});


describe("listInstalledCapabilities", () => {
  it("returns an empty list and initializes state when no capabilities are installed", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-list-"));
    const paths = getLocalStatePaths({ cwd, env: {} });

    await expect(listInstalledCapabilities({ cwd, env: {} })).resolves.toEqual([]);
    expect(await exists(paths.installedDir)).toBe(true);
    await expect(readFile(paths.policiesFile, "utf8")).resolves.toBe(DEFAULT_POLICIES_YML);
  });

  it("lists installed capability summaries", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-list-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    await expect(listInstalledCapabilities({ cwd, env: {} })).resolves.toMatchObject([
      {
        id: "github.create_issue",
        version: "0.1.0",
        type: "http",
        risk: "read_only",
        trustLevel: "experimental",
        status: "enabled",
      },
    ]);
  });

  it("marks invalid installed manifests without blocking valid entries", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-list-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    const badDir = join(cwd, "opencap.local", "installed", "bad.capability");
    await mkdir(badDir, { recursive: true });
    await writeFile(join(badDir, "manifest.yml"), "id: bad.capability\n");

    const result = await listInstalledCapabilities({ cwd, env: {} });

    expect(result).toHaveLength(2);
    expect(result.find((item) => item.id === "github.create_issue")?.status).toBe("enabled");
    expect(result.find((item) => item.id === "bad.capability")).toMatchObject({
      status: "invalid",
      risk: "unknown",
    });
  });
});


describe("loadInstalledCapabilities", () => {
  it("loads valid installed capabilities with install path and manifest version", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-loader-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    const result = await loadInstalledCapabilities({ cwd, env: {} });

    expect(result.invalid).toEqual([]);
    expect(result.capabilities).toMatchObject([
      {
        id: "github.create_issue",
        version: "0.1.0",
        installPath: resolve(cwd, "opencap.local", "installed", "github.create_issue"),
        manifestPath: resolve(cwd, "opencap.local", "installed", "github.create_issue", "manifest.yml"),
      },
    ]);
  });

  it("does not load invalid installed manifests", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-loader-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    const badDir = join(cwd, "opencap.local", "installed", "bad.capability");
    await mkdir(badDir, { recursive: true });
    await writeFile(join(badDir, "manifest.yml"), "id: bad.capability\n");

    const result = await loadInstalledCapabilities({ cwd, env: {} });

    expect(result.capabilities.map((capability) => capability.id)).toEqual(["github.create_issue"]);
    expect(result.invalid).toMatchObject([
      {
        id: "bad.capability",
        installPath: badDir,
      },
    ]);
  });

  it("wires OpenCapRuntime.loadInstalledCapabilities to the loader", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-loader-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });
    const runtime = new OpenCapRuntime({ cwd, env: {} });

    await expect(runtime.loadInstalledCapabilities()).resolves.toMatchObject([
      {
        id: "github.create_issue",
        version: "0.1.0",
      },
    ]);
  });
});
