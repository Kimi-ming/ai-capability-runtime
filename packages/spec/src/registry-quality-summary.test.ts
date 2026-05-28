import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildRegistryQualitySummary } from "./index.js";

const testSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testSourceFile), "../../..");

describe("registry quality summary", () => {
  it("summarizes quality evidence for the current registry without granting policy authority", async () => {
    const summary = await buildRegistryQualitySummary(resolve(repoRoot, "registry"), {
      generatedAt: "2026-05-28T00:00:00Z",
    });

    expect(summary).toMatchObject({
      schemaVersion: "opencap.registry_quality_summary.v1",
      generatedAt: "2026-05-28T00:00:00Z",
      policyEffect: "none",
    });
    expect(summary.capabilities.map((capability) => capability.id)).toEqual([
      "github.create_issue",
      "github.search_repo",
      "http.request_demo",
      "slack.send_message",
      "vercel.get_deployments",
    ]);
    expect(summary.capabilities.every((capability) => capability.qualityScore.policyEffect === "none")).toBe(true);
    expect(summary.capabilities.every((capability) => capability.manifestValidation.status === "pass")).toBe(true);
    expect(summary.capabilities.every((capability) => capability.packageLint.status === "pass")).toBe(true);
    expect(summary.capabilities.every((capability) => capability.registryTests.status === "pass")).toBe(true);
    expect(summary.capabilities.every((capability) => capability.authLeastPrivilege.status === "pass")).toBe(true);

    const revokedDemo = summary.capabilities.find((capability) => capability.id === "http.request_demo");
    expect(revokedDemo).toMatchObject({
      lifecycle: { status: "active" },
      advisory: {
        status: "revoked",
        open: 1,
        ids: ["OCAP-2026-0001"],
        runtimeDefault: "deny",
      },
      defaultInstallTrusted: false,
    });
    expect(revokedDemo?.blockingReasons).toEqual(expect.arrayContaining([
      "advisory:OCAP-2026-0001:revoked",
    ]));
    expect(revokedDemo?.qualityScore.band).not.toBe("verified");
  });
});
