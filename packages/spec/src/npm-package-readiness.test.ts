import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildNpmPackageReadinessReport, buildNpmPackageReadinessReportFromFile } from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");

describe("npm package readiness report", () => {
  it("summarizes current alpha candidate package metadata without changing publish state", async () => {
    const specReport = await buildNpmPackageReadinessReportFromFile(resolve(repoRoot, "packages/spec/package.json"));
    const cliReport = await buildNpmPackageReadinessReportFromFile(resolve(repoRoot, "packages/cli/package.json"));

    expect(specReport.schemaVersion).toBe("opencap.npm_package_readiness.v1");
    expect(specReport.packageName).toBe("@opencap/spec");
    expect(specReport.version).toBe("0.1.0");
    expect(specReport.candidate).toBe(true);
    expect(specReport.metadata.private).toBe(true);
    expect(specReport.metadata.hasMain).toBe(true);
    expect(specReport.metadata.hasTypes).toBe(true);
    expect(specReport.blockers.map((blocker) => blocker.code)).toContain("NPM_PACKAGE_PRIVATE");
    expect(specReport.pack.evidence).toBe("not-run");
    expect(specReport.policyEffect).toBe("none");

    expect(cliReport.packageName).toBe("@opencap/cli");
    expect(cliReport.metadata.hasBin).toBe(true);
    expect(cliReport.blockers.map((blocker) => blocker.code)).not.toContain("NPM_PACKAGE_MISSING_PUBLIC_ENTRY");
    expect(cliReport.policyEffect).toBe("none");
  });

  it("reports forbidden tarball files from an npm pack dry-run summary", () => {
    const report = buildNpmPackageReadinessReport(
      {
        name: "@opencap/spec",
        version: "0.1.0",
        private: false,
        main: "dist/index.js",
        types: "dist/index.d.ts",
        exports: {
          ".": {
            import: "./dist/index.js",
            types: "./dist/index.d.ts",
          },
          "./package.json": "./package.json",
        },
      },
      {
        packFiles: [
          { path: "dist/index.js", size: 10 },
          { path: ".env", size: 20 },
          { path: "opencap.local/audit.sqlite", size: 30 },
          { path: "logs/provider-debug.log", size: 40 },
          { path: "fixtures/api-token.txt", size: 50 },
        ],
      },
    );

    expect(report.pack.evidence).toBe("provided");
    expect(report.pack.fileCount).toBe(5);
    expect(report.pack.totalSize).toBe(150);
    expect(report.pack.forbiddenFiles.map((file) => file.reasonCode)).toEqual(expect.arrayContaining([
      "ENV_FILE",
      "LOCAL_STATE",
      "DATABASE_OR_LOG",
      "SECRET_SHAPED_FILE",
    ]));
    expect(report.blockers.map((blocker) => blocker.code)).toContain("NPM_PACKAGE_FORBIDDEN_PACK_FILE");
    expect(JSON.stringify(report)).not.toContain("secret-value");
    expect(report.policyEffect).toBe("none");
  });
});
