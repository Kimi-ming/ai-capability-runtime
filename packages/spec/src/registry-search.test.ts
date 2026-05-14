import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { searchRegistryCapabilities, type CapabilityManifest } from "./index.js";

function manifest(id: string, lifecycle?: CapabilityManifest["lifecycle"]): CapabilityManifest {
  return {
    id,
    name: id,
    description: `Capability ${id}.`,
    version: "0.1.0",
    type: "http",
    lifecycle,
    input: { type: "object" },
    output: { type: "object" },
    auth: { type: "none" },
    permissions: [{ resource: "test.resource", action: "read", risk: "read_only", confirmation: "allow" }],
    execution: { method: "GET", url: "https://example.com", timeout_ms: 10000 },
    metadata: { category: "developer-tools", maintainer: "opencap", license: "MIT", trust_level: "experimental" },
  };
}

async function writeManifest(root: string, capability: CapabilityManifest): Promise<void> {
  const dir = join(root, "registry", "developer-tools", capability.id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "manifest.json"), JSON.stringify(capability, null, 2));
}

describe("registry capability search", () => {
  it("excludes yanked and revoked capabilities by default", async () => {
    const root = await mkdtemp(join(tmpdir(), "opencap-registry-search-"));

    try {
      await writeManifest(root, manifest("github.create_issue"));
      await writeManifest(root, manifest("github.old_issue", { status: "deprecated", reason: "superseded", since: "2026-05-14" }));
      await writeManifest(root, manifest("github.yanked_issue", { status: "yanked", reason: "provider_changed", since: "2026-05-14" }));
      await writeManifest(root, manifest("github.revoked_issue", { status: "revoked", reason: "unsafe_execution", since: "2026-05-14", advisory: "OCAP-2026-0001" }));

      const visible = await searchRegistryCapabilities(join(root, "registry"), { query: "github" });

      expect(visible.results.map((result) => result.id)).toEqual(["github.create_issue", "github.old_issue"]);
      expect(visible.excludedByLifecycle.map((result) => result.id)).toEqual(["github.revoked_issue", "github.yanked_issue"]);

      const all = await searchRegistryCapabilities(join(root, "registry"), {
        query: "github",
        includeLifecycle: ["yanked", "revoked"],
      });

      expect(all.results.map((result) => result.id)).toEqual([
        "github.create_issue",
        "github.old_issue",
        "github.revoked_issue",
        "github.yanked_issue",
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
