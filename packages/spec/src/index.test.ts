import { describe, expect, it } from "vitest";
import { validateManifest, type ManifestValidationFailure } from "./index.js";

function baseManifest() {
  return {
    id: "github.create_issue",
    name: "Create GitHub Issue",
    description: "Create a GitHub issue from structured input.",
    version: "0.1.0",
    type: "http",
    input: {
      type: "object",
      required: ["owner", "repo", "title"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        title: { type: "string" },
      },
    },
    output: {
      type: "object",
      properties: {
        issue_url: { type: "string" },
      },
    },
    auth: {
      type: "api_key",
      provider: "github",
      env: "GITHUB_TOKEN",
      placement: {
        type: "bearer",
      },
      scopes: ["issues:write"],
    },
    permissions: [
      {
        resource: "github.issue",
        action: "create",
        risk: "write",
        confirmation: "ask",
      },
    ],
    execution: {
      method: "POST",
      url: "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
      timeout_ms: 10000,
      body: {
        type: "json",
        fields: {
          title: "{{title}}",
        },
      },
    },
    metadata: {
      category: "developer-tools",
      maintainer: "opencap",
      license: "MIT",
      trust_level: "experimental",
    },
  };
}

async function expectInvalidField(manifest: unknown, fieldPath: string) {
  const result = await validateManifest(manifest, "fixture.yml");
  expect(result.ok).toBe(false);
  const failure = result as ManifestValidationFailure;
  expect(failure.issues.map((issue) => issue.fieldPath)).toContain(fieldPath);
}

describe("validateManifest", () => {
  it("accepts a valid HTTP manifest", async () => {
    const result = await validateManifest(baseManifest(), "fixture.yml");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.id).toBe("github.create_issue");
    }
  });

  it("rejects unsupported capability types", async () => {
    const manifest = baseManifest();
    manifest.type = "mcp";

    await expectInvalidField(manifest, "/type");
  });

  it("rejects manifests without permissions", async () => {
    const manifest = baseManifest() as Record<string, unknown>;
    delete manifest.permissions;

    await expectInvalidField(manifest, "/permissions");
  });

  it("rejects invalid permission risk values", async () => {
    const manifest = baseManifest();
    manifest.permissions[0].risk = "banana";

    await expectInvalidField(manifest, "/permissions/0/risk");
  });

  it("rejects timeouts below the minimum", async () => {
    const manifest = baseManifest();
    manifest.execution.timeout_ms = 50;

    await expectInvalidField(manifest, "/execution/timeout_ms");
  });


  it("accepts JSON body field mappings", async () => {
    const manifest = baseManifest();
    const fields = manifest.execution.body.fields as Record<string, unknown>;
    fields.title = "{{title}}";
    fields.body = "Issue: {{body}}";
    fields.labels = "{{labels}}";
    fields.pinned = false;
    fields.priority = 1;
    fields.metadata = { source: "opencap" };
    fields.nullable = null;

    const result = await validateManifest(manifest, "fixture.yml");

    expect(result.ok).toBe(true);
  });

  it("accepts api_key header placement when a header name is declared", async () => {
    const manifest = baseManifest();
    (manifest.auth as Record<string, unknown>).placement = { type: "header", name: "X-API-Key" };

    const result = await validateManifest(manifest, "fixture.yml");

    expect(result.ok).toBe(true);
  });

  it("requires explicit placement for api_key auth", async () => {
    const manifest = baseManifest();
    delete (manifest.auth as Record<string, unknown>).placement;

    await expectInvalidField(manifest, "/auth/placement");
  });

  it("requires env and provider for api_key auth", async () => {
    const manifest = baseManifest();
    delete (manifest.auth as Record<string, unknown>).env;
    delete (manifest.auth as Record<string, unknown>).provider;

    await expectInvalidField(manifest, "/auth/env");
    await expectInvalidField(manifest, "/auth/provider");
  });

  it("auth credential descriptor requires explicit scopes for api_key auth", async () => {
    const manifest = baseManifest();
    delete (manifest.auth as Record<string, unknown>).scopes;

    await expectInvalidField(manifest, "/auth/scopes");
  });

  it("auth credential descriptor rejects empty, blank, or duplicate scopes", async () => {
    for (const [scopes, fieldPath] of [
      [[], "/auth/scopes"],
      [[""], "/auth/scopes/0"],
      [["issues:write", "issues:write"], "/auth/scopes"],
    ] as const) {
      const manifest = baseManifest();
      (manifest.auth as Record<string, unknown>).scopes = scopes;

      await expectInvalidField(manifest, fieldPath);
    }
  });

  it("auth credential descriptor validates env var references and provider slugs", async () => {
    const invalidEnv = baseManifest();
    invalidEnv.auth.env = "github-token";
    await expectInvalidField(invalidEnv, "/auth/env");

    const invalidProvider = baseManifest();
    invalidProvider.auth.provider = "GitHub";
    await expectInvalidField(invalidProvider, "/auth/provider");
  });

  it("requires a safe header name for header placement", async () => {
    const manifest = baseManifest();
    manifest.auth.placement = { type: "header" };

    await expectInvalidField(manifest, "/auth/placement/name");
  });

  it("auth credential descriptor rejects unsafe custom credential header names", async () => {
    for (const headerName of ["", "Bad Header", "Authorization", "Cookie"]) {
      const manifest = baseManifest();
      (manifest.auth as Record<string, unknown>).placement = { type: "header", name: headerName };

      await expectInvalidField(manifest, "/auth/placement/name");
    }
  });

  it("auth credential descriptor rejects credential fields for auth none", async () => {
    const manifest = baseManifest();
    manifest.auth = {
      type: "none",
      provider: "github",
      env: "GITHUB_TOKEN",
      placement: { type: "bearer" },
      scopes: ["issues:write"],
    };

    await expectInvalidField(manifest, "/auth");
  });

  it("rejects query and body auth placements", async () => {
    for (const placement of ["query", "body"]) {
      const manifest = baseManifest();
      manifest.auth.placement = { type: placement };

      await expectInvalidField(manifest, "/auth/placement/type");
    }
  });

  it("requires JSON body fields when execution body is declared", async () => {
    const manifest = baseManifest();
    delete (manifest.execution.body as Record<string, unknown>).fields;

    await expectInvalidField(manifest, "/execution/body/fields");
  });

  it("rejects non-JSON body field mappings", async () => {
    const manifest = baseManifest();
    (manifest.execution.body.fields as Record<string, unknown>).title = undefined;

    await expectInvalidField(manifest, "/execution/body/fields/title");
  });


  it("accepts arbitrary URL safety metadata", async () => {
    const manifest = baseManifest();
    const metadata = manifest.metadata as Record<string, unknown>;
    metadata.network_access = "arbitrary_url";
    metadata.unsafe_by_default = true;
    metadata.risk_notes = "Requests a user-provided URL and requires outbound policy.";

    const result = await validateManifest(manifest, "fixture.yml");

    expect(result.ok).toBe(true);
  });

  it("rejects unknown network access metadata", async () => {
    const manifest = baseManifest();
    (manifest.metadata as Record<string, unknown>).network_access = "anything";

    await expectInvalidField(manifest, "/metadata/network_access");
  });

  it("rejects metadata without trust level", async () => {
    const manifest = baseManifest();
    delete (manifest.metadata as Record<string, unknown>).trust_level;

    await expectInvalidField(manifest, "/metadata/trust_level");
  });
});
