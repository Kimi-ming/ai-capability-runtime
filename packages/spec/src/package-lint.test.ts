import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateCapabilityPackagePath, validateCapabilityPackage, type CapabilityPackageValidationFailure } from "./index.js";

async function writeValidPackage(root: string, id = "github.create_issue") {
  const packageDir = join(root, "developer-tools", id);
  await mkdir(join(packageDir, "tests"), { recursive: true });
  await writeFile(
    join(packageDir, "manifest.yml"),
    [
      `id: ${id}`,
      "name: Create GitHub Issue",
      "description: Create a GitHub issue from structured input.",
      "version: 0.1.0",
      "type: http",
      "input:",
      "  type: object",
      "output:",
      "  type: object",
      "auth:",
      "  type: none",
      "permissions:",
      "  - resource: github.issue",
      "    action: create",
      "    risk: write",
      "    confirmation: ask",
      "execution:",
      "  method: POST",
      "  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues",
      "  timeout_ms: 10000",
      "metadata:",
      "  category: developer-tools",
      "  maintainer: opencap",
      "  license: MIT",
      "  trust_level: experimental",
      "",
    ].join("\n"),
  );
  await writeFile(join(packageDir, "README.md"), `# ${id}\n\nCreates a GitHub issue.\n`);
  await writeFile(
    join(packageDir, "tests", "basic.yml"),
    [
      "name: creates issue",
      `capability: ${id}`,
      "mode: dry_run",
      "input:",
      "  owner: opencap",
      "  repo: demo",
      "  title: Hello",
      "expect:",
      "  status: dry_run",
      "",
    ].join("\n"),
  );
  return packageDir;
}

async function withTempRegistry<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await mkdtemp(join(tmpdir(), "opencap-package-lint-"));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("Capability package lint", () => {
  it("accepts a package with manifest, README, tests, and matching identity", async () => {
    await withTempRegistry(async (root) => {
      const packageDir = await writeValidPackage(root);

      const result = await validateCapabilityPackage(packageDir);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.packageDir).toBe(packageDir);
        expect(result.capabilityId).toBe("github.create_issue");
        expect(result.category).toBe("developer-tools");
      }
    });
  });

  it("rejects missing required package files before registry publication", async () => {
    await withTempRegistry(async (root) => {
      const packageDir = await writeValidPackage(root);
      await rm(join(packageDir, "README.md"));
      await rm(join(packageDir, "tests", "basic.yml"));

      const result = await validateCapabilityPackage(packageDir);

      expect(result.ok).toBe(false);
      const failure = result as CapabilityPackageValidationFailure;
      expect(failure.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fieldPath: "/README.md", keyword: "capability-package-lint:missing_readme" }),
          expect.objectContaining({ fieldPath: "/tests", keyword: "capability-package-lint:missing_registry_test" }),
        ]),
      );
    });
  });

  it("rejects manifest identity that does not match the package path", async () => {
    await withTempRegistry(async (root) => {
      const packageDir = await writeValidPackage(root, "github.create_issue");
      const manifestPath = join(packageDir, "manifest.yml");
      const rawManifest = await readFile(manifestPath, "utf8");
      await writeFile(
        manifestPath,
        rawManifest.replace("id: github.create_issue", "id: github.search_repo").replace("category: developer-tools", "category: data"),
      );

      const result = await validateCapabilityPackage(packageDir);

      expect(result.ok).toBe(false);
      const failure = result as CapabilityPackageValidationFailure;
      expect(failure.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fieldPath: "/id", keyword: "capability-package-lint:id_path_mismatch" }),
          expect.objectContaining({ fieldPath: "/metadata/category", keyword: "capability-package-lint:category_path_mismatch" }),
        ]),
      );
    });
  });

  it("rejects local state, secret-shaped, and database files inside capability packages", async () => {
    await withTempRegistry(async (root) => {
      const packageDir = await writeValidPackage(root);
      await writeFile(join(packageDir, ".env"), "GITHUB_TOKEN=secret\n");
      await mkdir(join(packageDir, "opencap.local"));
      await writeFile(join(packageDir, "audit.sqlite"), "");

      const result = await validateCapabilityPackage(packageDir);

      expect(result.ok).toBe(false);
      const failure = result as CapabilityPackageValidationFailure;
      expect(failure.issues.map((issue) => issue.keyword)).toEqual(
        expect.arrayContaining([
          "capability-package-lint:forbidden_file",
          "capability-package-lint:forbidden_directory",
          "capability-package-lint:forbidden_database",
        ]),
      );
    });
  });

  it("validates every package under a registry path", async () => {
    await withTempRegistry(async (root) => {
      await writeValidPackage(root, "github.create_issue");
      const invalidDir = await writeValidPackage(root, "github.search_repo");
      await rm(join(invalidDir, "README.md"));

      const result = await validateCapabilityPackagePath(root);

      expect(result.packages).toHaveLength(2);
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0]?.packageDir).toBe(invalidDir);
    });
  });
});
