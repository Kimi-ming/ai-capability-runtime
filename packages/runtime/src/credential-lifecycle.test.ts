import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CapabilityManifest } from "@opencap/spec";
import {
  executeHttpCapability,
  InMemoryAuditLogger,
  installCapability,
  listInstalledCapabilities,
} from "./index.js";

function credentialLifecycleManifest(): CapabilityManifest {
  return {
    id: "github.create_issue",
    name: "Create GitHub Issue",
    description: "Create a GitHub issue for credential lifecycle smoke tests.",
    version: "0.1.0",
    type: "http",
    input: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        title: { type: "string" },
      },
      required: ["owner", "repo", "title"],
    },
    output: { type: "object" },
    auth: {
      type: "api_key",
      provider: "github",
      env: "GITHUB_TOKEN",
      placement: { type: "bearer" },
      scopes: ["issues:write"],
    },
    permissions: [{ resource: "github.issue", action: "create", risk: "write", confirmation: "ask" }],
    execution: {
      method: "POST",
      url: "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
      body: { fields: { title: "title" } },
      timeout_ms: 1000,
    },
    metadata: {
      category: "developer-tools",
      provider: "github",
      maintainer: "opencap",
      license: "MIT",
      trust_level: "experimental",
    },
  };
}

async function writeRegistryCapability(root: string, manifest: CapabilityManifest): Promise<void> {
  const dir = join(root, "registry", "developer-tools", manifest.id);
  await mkdir(join(dir, "tests"), { recursive: true });
  await writeFile(join(dir, "manifest.yml"), [
    `id: ${manifest.id}`,
    `name: ${manifest.name}`,
    `description: ${manifest.description}`,
    `version: ${manifest.version}`,
    "type: http",
    "input:",
    "  type: object",
    "  properties:",
    "    owner:",
    "      type: string",
    "    repo:",
    "      type: string",
    "    title:",
    "      type: string",
    "  required:",
    "    - owner",
    "    - repo",
    "    - title",
    "output:",
    "  type: object",
    "auth:",
    "  type: api_key",
    "  provider: github",
    "  env: GITHUB_TOKEN",
    "  placement:",
    "    type: bearer",
    "  scopes:",
    "    - issues:write",
    "permissions:",
    "  - resource: github.issue",
    "    action: create",
    "    risk: write",
    "    confirmation: ask",
    "execution:",
    "  method: POST",
    "  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues",
    "  body:",
    "    type: json",
    "    fields:",
    "      title: title",
    "  timeout_ms: 1000",
    "metadata:",
    "  category: developer-tools",
    "  maintainer: opencap",
    "  license: MIT",
    "  trust_level: experimental",
    "",
  ].join("\n"));
  await writeFile(join(dir, "README.md"), "# Create GitHub Issue\n");
  await writeFile(join(dir, "tests", "basic.yml"), [
    "name: dry run",
    `capability: ${manifest.id}`,
    "mode: dry_run",
    "expect:",
    "  status: dry_run",
    "",
  ].join("\n"));
}

describe("credential lifecycle smoke", () => {
  it("rotates env credentials without changing manifest auth and without leaking secret values", async () => {
    const manifest = credentialLifecycleManifest();
    const seenAuthorization: string[] = [];
    const fetchImpl: typeof fetch = async (_url, init) => {
      seenAuthorization.push(new Headers(init?.headers).get("Authorization") ?? "");
      return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { "content-type": "application/json" } });
    };

    const firstLogger = new InMemoryAuditLogger();
    const secondLogger = new InMemoryAuditLogger();

    await executeHttpCapability(
      manifest,
      { owner: "opencap", repo: "runtime", title: "Rotate token" },
      { env: { GITHUB_TOKEN: "first-provider-token" }, auditLogger: firstLogger, fetch: fetchImpl },
    );
    await executeHttpCapability(
      manifest,
      { owner: "opencap", repo: "runtime", title: "Rotate token" },
      { env: { GITHUB_TOKEN: "second-provider-token" }, auditLogger: secondLogger, fetch: fetchImpl },
    );

    expect(seenAuthorization).toEqual(["Bearer first-provider-token", "Bearer second-provider-token"]);
    expect(manifest.auth).toMatchObject({ env: "GITHUB_TOKEN", placement: { type: "bearer" }, scopes: ["issues:write"] });
    expect(firstLogger.events[0].credentialRedacted).toMatch(/^sha256:[a-f0-9]{12}$/);
    expect(secondLogger.events[0].credentialRedacted).toMatch(/^sha256:[a-f0-9]{12}$/);
    expect(firstLogger.events[0].credentialRedacted).not.toBe(secondLogger.events[0].credentialRedacted);
    expect(JSON.stringify(firstLogger.events)).not.toContain("first-provider-token");
    expect(JSON.stringify(secondLogger.events)).not.toContain("second-provider-token");
  });

  it("distinguishes missing env from external provider 401 in audit evidence", async () => {
    const manifest = credentialLifecycleManifest();
    const missingLogger = new InMemoryAuditLogger();
    const unauthorizedLogger = new InMemoryAuditLogger();
    let fetchCalls = 0;
    const fetchImpl: typeof fetch = async () => {
      fetchCalls += 1;
      return new Response(JSON.stringify({ message: "bad credentials", token: "provider-secret" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    };

    const missing = await executeHttpCapability(
      manifest,
      { owner: "opencap", repo: "runtime", title: "Missing token" },
      { env: {}, auditLogger: missingLogger, fetch: fetchImpl },
    );
    const unauthorized = await executeHttpCapability(
      manifest,
      { owner: "opencap", repo: "runtime", title: "Bad token" },
      { env: { GITHUB_TOKEN: "provider-secret" }, auditLogger: unauthorizedLogger, fetch: fetchImpl },
    );

    expect(missing).toMatchObject({ status: "secret_missing", error: { code: "SECRET_MISSING" } });
    expect(unauthorized).toMatchObject({ status: "http_error", statusCode: 401, error: { code: "HTTP_ERROR" } });
    expect(fetchCalls).toBe(1);
    expect(missingLogger.events[0]).toMatchObject({
      status: "blocked",
      reason: "Missing required environment credential: GITHUB_TOKEN.",
      requestStarted: false,
    });
    expect(unauthorizedLogger.events[0]).toMatchObject({
      status: "executed",
      executionOutcome: "failed_after_request",
      executionHttpStatus: 401,
      requestStarted: true,
      credentialResolved: true,
    });
    expect(JSON.stringify(missingLogger.events)).not.toContain("provider-secret");
    expect(JSON.stringify(unauthorizedLogger.events)).not.toContain("provider-secret");
  });

  it("does not show env credential values in installed capability summaries", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-credential-list-"));
    const stateDir = join(cwd, "state");

    try {
      await writeRegistryCapability(cwd, credentialLifecycleManifest());
      await installCapability({ cwd, stateDir, id: "github.create_issue", env: { GITHUB_TOKEN: "provider-secret" } });

      const summaries = await listInstalledCapabilities({ cwd, stateDir, env: { GITHUB_TOKEN: "provider-secret" } });

      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({ id: "github.create_issue", status: "enabled", risk: "write" });
      expect(JSON.stringify(summaries)).not.toContain("provider-secret");
      expect(JSON.stringify(summaries)).not.toContain("GITHUB_TOKEN");
      expect(JSON.stringify(summaries)).not.toContain("Authorization");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
