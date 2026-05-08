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

  it("rejects metadata without trust level", async () => {
    const manifest = baseManifest();
    delete (manifest.metadata as Record<string, unknown>).trust_level;

    await expectInvalidField(manifest, "/metadata/trust_level");
  });
});
