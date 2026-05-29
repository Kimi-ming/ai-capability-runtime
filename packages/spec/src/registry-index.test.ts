import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildRegistryIndex } from "./index.js";

const testSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testSourceFile), "../../..");

describe("registry index", () => {
  it("builds a local discovery index without granting trust or leaking raw manifests", async () => {
    const index = await buildRegistryIndex(resolve(repoRoot, "registry"), {
      generatedAt: "2026-05-29T00:00:00.000Z",
      registry: {
        source: "git",
        repository: "https://github.com/Kimi-ming/ai-capability-runtime",
        commit: "abcdef1234567890",
      },
    });

    expect(index).toMatchObject({
      schemaVersion: "opencap.registry.index.v1",
      profile: "opencap.registry.index_cache_sync.v1",
      generatedAt: "2026-05-29T00:00:00.000Z",
      registry: {
        source: "git",
        repository: "https://github.com/Kimi-ming/ai-capability-runtime",
        commit: "abcdef1234567890",
      },
      signatureStatus: "none",
      policyEffect: "none",
      invalidManifestCount: 0,
      capabilityCount: 5,
    });
    expect(index.indexDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(index.capabilities.map((capability) => capability.id)).toEqual([
      "github.create_issue",
      "github.search_repo",
      "http.request_demo",
      "slack.send_message",
      "vercel.get_deployments",
    ]);

    const createIssue = index.capabilities.find((capability) => capability.id === "github.create_issue");
    expect(createIssue).toMatchObject({
      version: "0.1.0",
      category: "developer-tools",
      path: "developer-tools/github.create_issue/manifest.yml",
      lifecycle: "active",
      trustLevel: "experimental",
      quality: {
        rubricVersion: "opencap.quality_score.v1",
        band: "verified",
        policyEffect: "none",
      },
      advisoryRefs: [],
      defaultInstallTrusted: true,
      policyEffect: "none",
    });
    expect(createIssue?.manifestDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(createIssue?.path).not.toMatch(/^\//);
    expect(createIssue?.path).not.toContain("..");

    const revokedDemo = index.capabilities.find((capability) => capability.id === "http.request_demo");
    expect(revokedDemo).toMatchObject({
      advisoryRefs: ["OCAP-2026-0001"],
      defaultInstallTrusted: false,
      blockingReasons: expect.arrayContaining(["advisory:OCAP-2026-0001:revoked"]),
    });

    const serialized = JSON.stringify(index);
    expect(serialized).not.toContain("GITHUB_TOKEN");
    expect(serialized).not.toContain("Authorization");
    expect(serialized).not.toContain("opencap.local");
    expect(serialized).not.toContain("/Users/");
    expect(serialized).not.toContain("execution");
    expect(serialized).not.toContain("input");
    expect(serialized).not.toContain("output");
  });

  it("computes a stable digest for identical index content", async () => {
    const first = await buildRegistryIndex(resolve(repoRoot, "registry"), {
      generatedAt: "2026-05-29T00:00:00.000Z",
    });
    const second = await buildRegistryIndex(resolve(repoRoot, "registry"), {
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    expect(first.indexDigest).toBe(second.indexDigest);
    expect(first.capabilities.map((capability) => capability.manifestDigest)).toEqual(
      second.capabilities.map((capability) => capability.manifestDigest),
    );
  });
});
