import { describe, expect, it } from "vitest";
import type { CapabilityManifest } from "@opencap/spec";
import {
  CAPABILITY_IDENTITY_VERSION,
  capabilityIdentityKey,
  capabilityLifecycleSemantics,
  createCapabilityIdentity,
  createCapabilityIdentityRef,
  validateCapabilityIdentity,
  type CapabilityIdentity,
} from "./index.js";

const manifest = {
  id: "github.create_issue",
  name: "Create GitHub Issue",
  description: "Create a GitHub issue from structured input.",
  version: "0.1.0",
  type: "http",
  input: { type: "object" },
  output: { type: "object" },
  auth: { type: "none" },
  permissions: [{ resource: "github.issue", action: "create", risk: "write", confirmation: "ask" }],
  execution: { method: "POST", url: "https://api.github.com" },
  metadata: {},
} satisfies CapabilityManifest;

const manifestDigest = `sha256:${"a".repeat(64)}`;
const packageDigest = `sha256:${"b".repeat(64)}`;

describe("Capability identity public contract", () => {
  it("creates identity from manifest version and declared digest evidence", () => {
    const identity = createCapabilityIdentity({
      manifest,
      packagePath: "/tmp/opencap/installed/github.create_issue",
      manifestPath: "/tmp/opencap/installed/github.create_issue/manifest.yml",
      manifestDigest,
      packageDigest,
      registryCommit: "abcdef0",
      lifecycle: "listed",
    });

    expect(identity).toEqual({
      id: "github.create_issue",
      version: "0.1.0",
      packagePath: "/tmp/opencap/installed/github.create_issue",
      manifestPath: "/tmp/opencap/installed/github.create_issue/manifest.yml",
      manifestDigest,
      packageDigest,
      registryCommit: "abcdef0",
      lifecycle: "listed",
    });
  });

  it("uses id, version, and manifest digest as the stable audit identity", () => {
    const identity = createCapabilityIdentity({
      manifest,
      packagePath: "/tmp/opencap/a",
      manifestPath: "/tmp/opencap/a/manifest.yml",
      manifestDigest,
      packageDigest,
      lifecycle: "listed",
    });

    const sameCapabilityDifferentPath = {
      ...identity,
      packagePath: "/different/local/path",
      manifestPath: "/different/local/path/manifest.yml",
    } satisfies CapabilityIdentity;
    const revokedSnapshot = { ...identity, lifecycle: "revoked" } satisfies CapabilityIdentity;

    const ref = createCapabilityIdentityRef(identity);

    expect(ref).toMatchObject({
      identityVersion: CAPABILITY_IDENTITY_VERSION,
      id: "github.create_issue",
      version: "0.1.0",
      manifestDigest,
      packageDigest,
      versionedKey: "github.create_issue@0.1.0",
      auditKey: `github.create_issue@0.1.0#${manifestDigest}`,
      lifecycle: "listed",
    });
    expect(ref.identityDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(capabilityIdentityKey(identity)).toBe(`github.create_issue@0.1.0#${manifestDigest}`);
    expect(createCapabilityIdentityRef(sameCapabilityDifferentPath).identityDigest).toBe(ref.identityDigest);
    expect(createCapabilityIdentityRef(revokedSnapshot).identityDigest).toBe(ref.identityDigest);
    expect(createCapabilityIdentityRef(revokedSnapshot).lifecycle).toBe("revoked");
  });

  it("validates SemVer and digest shapes without treating package digest as manifest identity", () => {
    const invalid = validateCapabilityIdentity({
      id: "github.create_issue",
      version: "banana",
      packagePath: "/tmp/opencap/installed/github.create_issue",
      manifestPath: "/tmp/opencap/installed/github.create_issue/manifest.yml",
      manifestDigest: "md5:not-accepted",
      packageDigest: "sha1:not-accepted",
      lifecycle: "listed",
    });

    expect(invalid.ok).toBe(false);
    expect(invalid.findings.map((finding) => finding.code)).toEqual([
      "CAPABILITY_VERSION_NOT_SEMVER",
      "MANIFEST_DIGEST_NOT_SHA256",
      "PACKAGE_DIGEST_NOT_SHA256",
    ]);

    const packageOnly = validateCapabilityIdentity({
      id: "github.create_issue",
      version: "0.1.0",
      packagePath: "/tmp/opencap/installed/github.create_issue",
      manifestPath: "/tmp/opencap/installed/github.create_issue/manifest.yml",
      packageDigest,
      lifecycle: "listed",
    });

    expect(packageOnly.ok).toBe(false);
    expect(packageOnly.findings.map((finding) => finding.code)).toContain("MANIFEST_DIGEST_REQUIRED_FOR_AUDIT_IDENTITY");
  });

  it("keeps lifecycle addressable while fixing default install and execution behavior", () => {
    expect(capabilityLifecycleSemantics("listed")).toMatchObject({
      addressable: true,
      installAllowedByDefault: true,
      executionAllowedByDefault: true,
      warningRequired: false,
      hardBlock: false,
    });
    expect(capabilityLifecycleSemantics("deprecated")).toMatchObject({
      addressable: true,
      installAllowedByDefault: true,
      executionAllowedByDefault: true,
      warningRequired: true,
      hardBlock: false,
    });
    expect(capabilityLifecycleSemantics("yanked")).toMatchObject({
      addressable: true,
      installAllowedByDefault: false,
      executionAllowedByDefault: true,
      warningRequired: true,
      hardBlock: false,
    });
    expect(capabilityLifecycleSemantics("revoked")).toMatchObject({
      addressable: true,
      installAllowedByDefault: false,
      executionAllowedByDefault: false,
      warningRequired: true,
      hardBlock: true,
      reasonCode: "CAPABILITY_REVOKED",
    });
  });

  it("exposes identity helpers from the runtime root entrypoint", async () => {
    const runtime = await import("./index.js");

    expect(runtime.CAPABILITY_IDENTITY_VERSION).toBe(CAPABILITY_IDENTITY_VERSION);
    expect(runtime.capabilityIdentityKey({
      id: "github.create_issue",
      version: "0.1.0",
      manifestDigest,
    })).toBe(`github.create_issue@0.1.0#${manifestDigest}`);
  });
});
