import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import {
  buildCapabilityScaffold,
  validateCapabilityAuthoringManifestPath,
  validateCapabilityPackage,
  validateManifestPath,
  validateRegistryTestPath,
} from "./index.js";

const baseScaffoldInput = {
  id: "example.echo",
  title: "Example Echo",
  description: "Echo a message through an example API.",
  category: "developer-tools",
  method: "GET" as const,
  urlTemplate: "https://api.example.com/echo?message={{message}}",
  auth: {
    mode: "api_key_bearer" as const,
    provider: "example",
    env: "EXAMPLE_API_KEY",
    scopes: ["read"],
  },
};

async function writeScaffoldFiles(packageDir: string, files: Array<{ path: string; content: string }>): Promise<void> {
  for (const file of files) {
    const filePath = join(packageDir, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file.content, "utf8");
  }
}

describe("Capability scaffold helper", () => {
  it("generates a validate-ready V1 HTTP Capability package scaffold", async () => {
    const scaffold = buildCapabilityScaffold(baseScaffoldInput);
    const tempRoot = await mkdtemp(join(tmpdir(), "opencap-capability-scaffold-"));
    const packageDir = join(tempRoot, baseScaffoldInput.category, baseScaffoldInput.id);

    try {
      await writeScaffoldFiles(packageDir, scaffold.files);

      expect(scaffold.files.map((file) => file.path)).toEqual(["manifest.yml", "README.md", "tests/basic.yml"]);

      const manifestFile = scaffold.files.find((file) => file.path === "manifest.yml");
      const manifest = YAML.parse(manifestFile?.content ?? "");
      expect(manifest).toMatchObject({
        id: "example.echo",
        name: "Example Echo",
        description: "Echo a message through an example API.",
        version: "0.1.0",
        type: "http",
        auth: {
          type: "api_key",
          provider: "example",
          env: "EXAMPLE_API_KEY",
          placement: { type: "bearer" },
          scopes: ["read"],
        },
        permissions: [
          {
            resource: "example.echo",
            action: "read",
            risk: "read_only",
            confirmation: "allow",
          },
        ],
        metadata: {
          category: "developer-tools",
          trust_level: "experimental",
        },
      });

      const registryTest = YAML.parse(scaffold.files.find((file) => file.path === "tests/basic.yml")?.content ?? "");
      expect(registryTest).toMatchObject({
        capability: "example.echo",
        mode: "dry_run",
        input: { message: "example" },
        expect: {
          status: "dry_run",
          request: {
            method: "GET",
            url: "https://api.example.com/echo?message=example",
          },
          permission: {
            risk: "read_only",
            decision: "allow",
          },
        },
      });

      const manifestResult = await validateManifestPath(packageDir);
      const authoringResult = await validateCapabilityAuthoringManifestPath(packageDir);
      const packageResult = await validateCapabilityPackage(packageDir);
      const registryTestResult = await validateRegistryTestPath(packageDir);

      expect(manifestResult.invalid).toEqual([]);
      expect(authoringResult.invalid).toEqual([]);
      expect(packageResult).toMatchObject({ ok: true, capabilityId: "example.echo", category: "developer-tools" });
      expect(registryTestResult.invalid).toEqual([]);
      expect(registryTestResult.valid).toHaveLength(1);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("keeps scaffold output free of secret values and local-only paths", () => {
    const scaffold = buildCapabilityScaffold(baseScaffoldInput);
    const outputText = scaffold.files.map((file) => file.content).join("\n");

    expect(outputText).not.toContain("Authorization: Bearer");
    expect(outputText).not.toContain("NPM_TOKEN");
    expect(outputText).not.toContain("/Users/");
    expect(outputText).not.toContain("opencap.local");
    expect(outputText).not.toContain("provider raw response");
  });

  it("rejects unsafe scaffold inputs before generating files", () => {
    expect(() => buildCapabilityScaffold({ ...baseScaffoldInput, id: "token.leak" })).toThrow(/Unsafe capability id/);
    expect(() => buildCapabilityScaffold({ ...baseScaffoldInput, category: "../private" })).toThrow(/Invalid category/);
    expect(() => buildCapabilityScaffold({ ...baseScaffoldInput, title: "" })).toThrow(/title/);
    expect(() => buildCapabilityScaffold({ ...baseScaffoldInput, type: "mcp" as "http" })).toThrow(/HTTP/);
  });
});
