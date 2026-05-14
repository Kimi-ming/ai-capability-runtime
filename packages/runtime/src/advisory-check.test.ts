import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  checkInstalledCapabilityAdvisories,
  installCapability,
} from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");

describe("installed capability advisory check", () => {
  it("matches installed capabilities against registry advisory metadata", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-advisory-check-"));

    try {
      await installCapability({
        cwd: repoRoot,
        stateDir,
        id: "http.request_demo",
        env: {},
      });

      const result = await checkInstalledCapabilityAdvisories({
        cwd: repoRoot,
        stateDir,
        registryDir: resolve(repoRoot, "registry"),
        env: {},
      });

      expect(result.invalidAdvisories).toEqual([]);
      expect(result.matches).toEqual([
        expect.objectContaining({
          capabilityId: "http.request_demo",
          installedVersion: "0.1.0",
          advisoryId: "OCAP-2026-0001",
          status: "revoked",
          severity: "critical",
          affected: true,
          runtimeDefault: "deny",
          registryAction: "revoke",
        }),
      ]);
      expect(JSON.stringify(result)).not.toContain("token");
      expect(JSON.stringify(result)).not.toContain("secret");
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it("does not report advisories for unrelated installed capabilities", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-advisory-check-"));

    try {
      await installCapability({
        cwd: repoRoot,
        stateDir,
        id: "github.create_issue",
        env: {},
      });

      const result = await checkInstalledCapabilityAdvisories({
        cwd: repoRoot,
        stateDir,
        registryDir: resolve(repoRoot, "registry"),
        env: {},
      });

      expect(result.matches).toEqual([]);
      expect(result.checkedInstalledCapabilities).toEqual(["github.create_issue"]);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });
});
