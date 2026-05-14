import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

interface PackageJson {
  name: string;
  exports?: Record<string, unknown>;
}

const publicLibraryEntry = {
  types: "./dist/index.d.ts",
  import: "./dist/index.js",
};

async function readPackageJson(relativeUrl: string): Promise<PackageJson> {
  const raw = await readFile(new URL(relativeUrl, import.meta.url), "utf8");
  return JSON.parse(raw) as PackageJson;
}

function expectNoInternalSubpaths(packageJson: PackageJson): void {
  const exportMap = packageJson.exports ?? {};
  const internalSubpaths = Object.keys(exportMap).filter((path) =>
    path.startsWith("./src") || path.startsWith("./dist")
  );

  expect(internalSubpaths, `${packageJson.name} must not expose internal source or dist subpaths`).toEqual([]);
}

describe("package public exports", () => {
  it("defines library entrypoints for importable OpenCap packages", async () => {
    const packages = [
      await readPackageJson("../../spec/package.json"),
      await readPackageJson("../package.json"),
      await readPackageJson("../../mcp/package.json"),
      await readPackageJson("../../sdk-js/package.json"),
    ];

    for (const packageJson of packages) {
      expect(packageJson.exports?.["."], `${packageJson.name} must expose only its public root entrypoint`).toEqual(publicLibraryEntry);
      expect(packageJson.exports?.["./package.json"], `${packageJson.name} should expose package metadata`).toBe("./package.json");
      expectNoInternalSubpaths(packageJson);
    }
  });

  it("exposes spec schemas as explicit public subpaths", async () => {
    const packageJson = await readPackageJson("../../spec/package.json");

    expect(packageJson.exports?.["./schema/manifest.schema.json"]).toBe("./schema/manifest.schema.json");
    expect(packageJson.exports?.["./schema/registry-test.schema.json"]).toBe("./schema/registry-test.schema.json");
    expect(packageJson.exports?.["./schema/capability-advisory.schema.json"]).toBe("./schema/capability-advisory.schema.json");
    expectNoInternalSubpaths(packageJson);
  });

  it("keeps the CLI package bin-only", async () => {
    const packageJson = await readPackageJson("../../cli/package.json");

    expect(packageJson.exports).toEqual({
      "./package.json": "./package.json",
    });
  });
});
