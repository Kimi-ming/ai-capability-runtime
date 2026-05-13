import { describe, expect, it } from "vitest";
import { lintLeastPrivilegeAuth, type CapabilityManifest, type LeastPrivilegeAuthLintRule } from "./index.js";

function baseManifest(overrides: Partial<CapabilityManifest> = {}): CapabilityManifest {
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
        owner: { type: "string", description: "Repository owner." },
        repo: { type: "string", description: "Repository name." },
        title: { type: "string", description: "Issue title." },
      },
    },
    output: {
      type: "object",
      properties: {
        issue_url: { type: "string", description: "Created issue URL." },
      },
    },
    auth: {
      type: "api_key",
      provider: "github",
      env: "GITHUB_TOKEN",
      placement: { type: "bearer" },
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
    },
    metadata: {
      category: "developer-tools",
      maintainer: "opencap",
      license: "MIT",
      trust_level: "experimental",
    },
    ...overrides,
  };
}

function expectRules(manifest: CapabilityManifest, rules: LeastPrivilegeAuthLintRule[]) {
  expect(lintLeastPrivilegeAuth(manifest).map((finding) => finding.rule)).toEqual(rules);
}

describe("lintLeastPrivilegeAuth", () => {
  it("returns no findings for matching provider permissions and write scope", () => {
    expect(lintLeastPrivilegeAuth(baseManifest())).toEqual([]);
  });

  it("skips auth none capabilities", () => {
    const manifest = baseManifest({ auth: { type: "none" } });

    expect(lintLeastPrivilegeAuth(manifest)).toEqual([]);
  });

  it("flags auth provider and permission resource mismatches", () => {
    const manifest = baseManifest();
    manifest.permissions[0] = {
      resource: "slack.message",
      action: "send",
      risk: "external_send",
      confirmation: "ask",
    };

    const findings = lintLeastPrivilegeAuth(manifest);

    expect(findings).toEqual([
      expect.objectContaining({
        rule: "provider_permission_mismatch",
        severity: "error",
        path: "/permissions/0/resource",
        evidence: expect.objectContaining({
          provider: "github",
          resource: "slack.message",
        }),
      }),
    ]);
  });

  it("flags write-like scopes on read-only permissions", () => {
    const manifest = baseManifest();
    manifest.permissions[0] = {
      resource: "github.issue",
      action: "read",
      risk: "read_only",
      confirmation: "allow",
    };

    expectRules(manifest, ["read_only_permission_with_write_scope"]);
  });

  it("flags elevated permissions that only declare read-only scopes", () => {
    const manifest = baseManifest();
    (manifest.auth as Record<string, unknown>).scopes = ["issues:read"];

    const findings = lintLeastPrivilegeAuth(manifest);

    expect(findings).toEqual([
      expect.objectContaining({
        rule: "elevated_permission_without_elevated_scope",
        path: "/auth/scopes",
        evidence: expect.objectContaining({
          risk: "write",
          scopes: ["issues:read"],
        }),
      }),
    ]);
  });

  it("flags wildcard and provider-wide scopes as overbroad", () => {
    const manifest = baseManifest();
    (manifest.auth as Record<string, unknown>).scopes = ["repo", "admin:org", "*:*"];

    expectRules(manifest, ["overbroad_scope", "overbroad_scope", "overbroad_scope"]);
  });
});
