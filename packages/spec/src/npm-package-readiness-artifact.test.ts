import { describe, expect, it } from "vitest";
import {
  buildNpmPackageReadinessReport,
  validateNpmPackageReadinessArtifact,
  type NpmPackageReadinessReport,
} from "./index.js";

function validReadinessArtifact(): NpmPackageReadinessReport {
  return buildNpmPackageReadinessReport(
    {
      name: "@opencap/spec",
      version: "0.1.0",
      private: false,
      main: "dist/index.js",
      types: "dist/index.d.ts",
      files: ["dist", "package.json", "schema"],
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
        { path: "dist/index.js", size: 123 },
        { path: "schema/manifest.schema.json", size: 456 },
      ],
    },
  );
}

describe("npm package readiness artifact validation", () => {
  it("accepts a saved package readiness artifact without changing policy effect", () => {
    const result = validateNpmPackageReadinessArtifact(validReadinessArtifact());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact.schemaVersion).toBe("opencap.npm_package_readiness.v1");
      expect(result.artifact.packageName).toBe("@opencap/spec");
      expect(result.artifact.pack.evidence).toBe("provided");
      expect(result.artifact.policyEffect).toBe("none");
    }
  });

  it("rejects schema version and policy effect drift", () => {
    const result = validateNpmPackageReadinessArtifact({
      ...validReadinessArtifact(),
      schemaVersion: "opencap.npm_package_readiness.v2",
      policyEffect: "allow",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.findings.map((finding) => finding.path)).toEqual(expect.arrayContaining([
        "/schemaVersion",
        "/policyEffect",
      ]));
      expect(JSON.stringify(result.findings)).not.toContain("Error:");
    }
  });

  it("rejects artifacts missing core readiness sections", () => {
    const result = validateNpmPackageReadinessArtifact({
      schemaVersion: "opencap.npm_package_readiness.v1",
      packageName: "@opencap/spec",
      policyEffect: "none",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.findings.map((finding) => finding.path)).toEqual(expect.arrayContaining([
        "/version",
        "/candidate",
        "/metadata",
        "/pack",
        "/blockers",
        "/warnings",
      ]));
    }
  });

  it("rejects non-object package readiness artifacts", () => {
    const result = validateNpmPackageReadinessArtifact(null);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.findings).toEqual([
        {
          code: "NPM_PACKAGE_READINESS_ARTIFACT_NOT_OBJECT",
          path: "/",
          message: "Package readiness artifact must be a JSON object.",
        },
      ]);
    }
  });
});
