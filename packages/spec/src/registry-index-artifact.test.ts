import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  REGISTRY_INDEX_VALIDATION_SCHEMA_VERSION,
  buildRegistryIndex,
  validateRegistryIndexArtifact,
} from "./index.js";

const testSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testSourceFile), "../../..");

describe("registry index artifact validation", () => {
  it("validates a saved Registry index artifact without granting policy authority", async () => {
    const index = await buildRegistryIndex(resolve(repoRoot, "registry"), {
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    const report = validateRegistryIndexArtifact(index);

    expect(report).toMatchObject({
      schemaVersion: REGISTRY_INDEX_VALIDATION_SCHEMA_VERSION,
      valid: true,
      artifactSchemaVersion: "opencap.registry.index.v1",
      profile: "opencap.registry.index_cache_sync.v1",
      indexDigest: index.indexDigest,
      findingCount: 0,
      findings: [],
      policyEffect: "none",
    });
  });

  it("rejects unsafe or tampered Registry index artifacts with redacted findings", async () => {
    const index = await buildRegistryIndex(resolve(repoRoot, "registry"), {
      generatedAt: "2026-05-29T00:00:00.000Z",
    });
    const tampered = structuredClone(index) as typeof index & {
      input?: unknown;
      providerRawResponse?: unknown;
    };
    tampered.policyEffect = "allow" as "none";
    tampered.signatureStatus = "signed" as "none";
    tampered.capabilityCount = 999;
    tampered.input = { token: "GITHUB_TOKEN" };
    tampered.providerRawResponse = {
      url: "https://api.github.com/repos/demo/private",
      log: "/Users/kimi/opencap.local/logs.sqlite",
    };
    tampered.capabilities[0] = {
      ...tampered.capabilities[0],
      path: "/Users/kimi/private/manifest.yml",
      policyEffect: "allow" as "none",
      quality: {
        ...tampered.capabilities[0].quality,
        policyEffect: "allow" as "none",
      },
    };

    const report = validateRegistryIndexArtifact(tampered);
    const codes = report.findings.map((finding) => finding.code);
    const serializedReport = JSON.stringify(report);

    expect(report.valid).toBe(false);
    expect(report.findingCount).toBeGreaterThanOrEqual(7);
    expect(codes).toEqual(expect.arrayContaining([
      "REGISTRY_INDEX_CAPABILITY_COUNT_MISMATCH",
      "REGISTRY_INDEX_DIGEST_MISMATCH",
      "REGISTRY_INDEX_POLICY_EFFECT_INVALID",
      "REGISTRY_INDEX_SIGNATURE_STATUS_INVALID",
      "REGISTRY_INDEX_CAPABILITY_PATH_UNSAFE",
      "REGISTRY_INDEX_CAPABILITY_POLICY_EFFECT_INVALID",
      "REGISTRY_INDEX_SENSITIVE_TEXT",
    ]));
    expect(report.policyEffect).toBe("none");
    expect(serializedReport).not.toContain("GITHUB_TOKEN");
    expect(serializedReport).not.toContain("Authorization");
    expect(serializedReport).not.toContain("https://api.github.com");
    expect(serializedReport).not.toContain("/Users/");
    expect(serializedReport).not.toContain("opencap.local");
    expect(serializedReport).not.toContain("logs.sqlite");
  });

  it("reports non-object artifacts without echoing raw content", () => {
    const report = validateRegistryIndexArtifact("GITHUB_TOKEN=/Users/kimi/opencap.local/logs.sqlite");

    expect(report).toMatchObject({
      schemaVersion: REGISTRY_INDEX_VALIDATION_SCHEMA_VERSION,
      valid: false,
      findingCount: 1,
      policyEffect: "none",
    });
    expect(report.findings[0]).toMatchObject({
      code: "REGISTRY_INDEX_ARTIFACT_NOT_OBJECT",
      path: "$",
    });
    expect(JSON.stringify(report)).not.toContain("GITHUB_TOKEN");
    expect(JSON.stringify(report)).not.toContain("/Users/");
    expect(JSON.stringify(report)).not.toContain("opencap.local");
  });
});
