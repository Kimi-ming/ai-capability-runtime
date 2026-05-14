import { describe, expect, it } from "vitest";
import { validateCapabilityAdvisory, type CapabilityAdvisoryValidationFailure } from "./index.js";

function baseAdvisory() {
  return {
    schema_version: "opencap.capability_advisory.v1",
    id: "OCAP-2026-0001",
    capability: "github.create_issue",
    affected_versions: ["<=0.1.0"],
    type: "overbroad_permissions",
    severity: "high",
    status: "investigating",
    summary: "Capability requests broader token permissions than documented.",
    published_at: null,
    modified_at: "2026-05-08T00:00:00Z",
    actions: {
      registry: "freeze",
      runtime_default: "warn",
      fixed_version: null,
    },
  };
}

async function expectInvalidField(advisory: unknown, fieldPath: string) {
  const result = await validateCapabilityAdvisory(advisory, "advisory.yml");
  expect(result.ok).toBe(false);
  const failure = result as CapabilityAdvisoryValidationFailure;
  expect(failure.issues.map((issue) => issue.fieldPath)).toContain(fieldPath);
}

describe("validateCapabilityAdvisory", () => {
  it("accepts a valid Capability advisory YAML shape", async () => {
    const result = await validateCapabilityAdvisory(baseAdvisory(), "advisory.yml");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.advisory.id).toBe("OCAP-2026-0001");
      expect(result.advisory.actions.runtime_default).toBe("warn");
    }
  });

  it("rejects malformed advisory ids, capability ids, and severity values", async () => {
    const invalidId = baseAdvisory();
    invalidId.id = "GHSA-demo";
    await expectInvalidField(invalidId, "/id");

    const invalidCapability = baseAdvisory();
    invalidCapability.capability = "GitHub";
    await expectInvalidField(invalidCapability, "/capability");

    const invalidSeverity = baseAdvisory();
    invalidSeverity.severity = "urgent";
    await expectInvalidField(invalidSeverity, "/severity");
  });

  it("requires affected versions, modified timestamp, and bounded runtime defaults", async () => {
    const missingVersions = baseAdvisory();
    missingVersions.affected_versions = [];
    await expectInvalidField(missingVersions, "/affected_versions");

    const missingModified = baseAdvisory() as Record<string, unknown>;
    delete missingModified.modified_at;
    await expectInvalidField(missingModified, "/modified_at");

    const invalidRuntimeDefault = baseAdvisory();
    invalidRuntimeDefault.actions.runtime_default = "execute";
    await expectInvalidField(invalidRuntimeDefault, "/actions/runtime_default");
  });

  it("uses status and action enums that support freeze, revoke, and published records", async () => {
    for (const [status, registryAction, runtimeDefault] of [
      ["reported", "none", "warn"],
      ["fixed", "none", "warn"],
      ["revoked", "revoke", "deny"],
      ["published", "freeze", "ask"],
    ] as const) {
      const advisory = baseAdvisory();
      advisory.status = status;
      advisory.actions.registry = registryAction;
      advisory.actions.runtime_default = runtimeDefault;

      const result = await validateCapabilityAdvisory(advisory, "advisory.yml");

      expect(result.ok).toBe(true);
    }
  });
});
