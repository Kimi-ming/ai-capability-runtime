import { createHash } from "node:crypto";
import type { CapabilityManifest } from "@opencap/spec";
import type { CapabilityIdentity, CapabilityLifecycleState } from "./domain.js";

export const CAPABILITY_IDENTITY_VERSION = "opencap.capability_identity.v1" as const;

export type CapabilityIdentityVersion = typeof CAPABILITY_IDENTITY_VERSION;

export interface CreateCapabilityIdentityInput {
  manifest: Pick<CapabilityManifest, "id" | "version">;
  packagePath: string;
  manifestPath: string;
  manifestDigest?: string;
  packageDigest?: string;
  registryCommit?: string;
  lifecycle?: CapabilityLifecycleState;
}

export interface CapabilityIdentityRefV1 {
  identityVersion: CapabilityIdentityVersion;
  id: string;
  version: string;
  manifestDigest?: string;
  packageDigest?: string;
  registryCommit?: string;
  lifecycle?: CapabilityLifecycleState;
  versionedKey: string;
  auditKey: string;
  identityDigest: string;
}

export type CapabilityIdentityValidationSeverity = "error" | "warning";

export type CapabilityIdentityValidationCode =
  | "CAPABILITY_ID_MISSING"
  | "CAPABILITY_VERSION_NOT_SEMVER"
  | "MANIFEST_DIGEST_REQUIRED_FOR_AUDIT_IDENTITY"
  | "MANIFEST_DIGEST_NOT_SHA256"
  | "PACKAGE_DIGEST_NOT_SHA256"
  | "REGISTRY_COMMIT_NOT_HEX";

export interface CapabilityIdentityValidationFinding {
  code: CapabilityIdentityValidationCode;
  severity: CapabilityIdentityValidationSeverity;
  message: string;
}

export interface CapabilityIdentityValidationResult {
  ok: boolean;
  findings: CapabilityIdentityValidationFinding[];
}

export interface CapabilityLifecycleSemantics {
  lifecycle: CapabilityLifecycleState;
  addressable: boolean;
  installAllowedByDefault: boolean;
  executionAllowedByDefault: boolean;
  warningRequired: boolean;
  hardBlock: boolean;
  reasonCode: string;
}

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const SHA256_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const REGISTRY_COMMIT_PATTERN = /^[0-9a-f]{7,40}$/;

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stableJsonValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter((entry) => entry[1] !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableJsonValue(entryValue)]),
    );
  }

  return value;
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value));
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function identityDigestInput(identity: CapabilityIdentity): Record<string, string | undefined> {
  return {
    id: identity.id,
    version: identity.version,
    manifestDigest: identity.manifestDigest,
    packageDigest: identity.packageDigest,
    registryCommit: identity.registryCommit,
  };
}

export function createCapabilityIdentity(input: CreateCapabilityIdentityInput): CapabilityIdentity {
  return {
    id: input.manifest.id,
    version: input.manifest.version,
    packagePath: input.packagePath,
    manifestPath: input.manifestPath,
    manifestDigest: input.manifestDigest,
    packageDigest: input.packageDigest,
    registryCommit: input.registryCommit,
    lifecycle: input.lifecycle,
  };
}

export function capabilityIdentityKey(identity: Pick<CapabilityIdentity, "id" | "version" | "manifestDigest">): string {
  const versionedKey = `${identity.id}@${identity.version}`;
  return identity.manifestDigest ? `${versionedKey}#${identity.manifestDigest}` : versionedKey;
}

export function createCapabilityIdentityRef(identity: CapabilityIdentity): CapabilityIdentityRefV1 {
  return {
    identityVersion: CAPABILITY_IDENTITY_VERSION,
    id: identity.id,
    version: identity.version,
    manifestDigest: identity.manifestDigest,
    packageDigest: identity.packageDigest,
    registryCommit: identity.registryCommit,
    lifecycle: identity.lifecycle,
    versionedKey: `${identity.id}@${identity.version}`,
    auditKey: capabilityIdentityKey(identity),
    identityDigest: sha256(stableJsonStringify(identityDigestInput(identity))),
  };
}

export function validateCapabilityIdentity(identity: CapabilityIdentity): CapabilityIdentityValidationResult {
  const findings: CapabilityIdentityValidationFinding[] = [];

  if (identity.id.trim().length === 0) {
    findings.push({
      code: "CAPABILITY_ID_MISSING",
      severity: "error",
      message: "Capability identity id is required.",
    });
  }

  if (!SEMVER_PATTERN.test(identity.version)) {
    findings.push({
      code: "CAPABILITY_VERSION_NOT_SEMVER",
      severity: "error",
      message: "Capability version must use SemVer shape MAJOR.MINOR.PATCH.",
    });
  }

  if (!identity.manifestDigest) {
    findings.push({
      code: "MANIFEST_DIGEST_REQUIRED_FOR_AUDIT_IDENTITY",
      severity: "error",
      message: "manifestDigest is required for stable audit identity.",
    });
  } else if (!SHA256_DIGEST_PATTERN.test(identity.manifestDigest)) {
    findings.push({
      code: "MANIFEST_DIGEST_NOT_SHA256",
      severity: "error",
      message: "manifestDigest must use sha256:<64 lowercase hex>.",
    });
  }

  if (identity.packageDigest && !SHA256_DIGEST_PATTERN.test(identity.packageDigest)) {
    findings.push({
      code: "PACKAGE_DIGEST_NOT_SHA256",
      severity: "error",
      message: "packageDigest must use sha256:<64 lowercase hex>.",
    });
  }

  if (identity.registryCommit && !REGISTRY_COMMIT_PATTERN.test(identity.registryCommit)) {
    findings.push({
      code: "REGISTRY_COMMIT_NOT_HEX",
      severity: "error",
      message: "registryCommit must be a git commit hex prefix or full hash.",
    });
  }

  return {
    ok: findings.every((finding) => finding.severity !== "error"),
    findings,
  };
}

export function capabilityLifecycleSemantics(lifecycle: CapabilityLifecycleState): CapabilityLifecycleSemantics {
  switch (lifecycle) {
    case "draft":
      return {
        lifecycle,
        addressable: true,
        installAllowedByDefault: false,
        executionAllowedByDefault: false,
        warningRequired: true,
        hardBlock: false,
        reasonCode: "CAPABILITY_DRAFT",
      };
    case "listed":
    case "tested":
    case "audited":
      return {
        lifecycle,
        addressable: true,
        installAllowedByDefault: true,
        executionAllowedByDefault: true,
        warningRequired: false,
        hardBlock: false,
        reasonCode: "CAPABILITY_ACTIVE",
      };
    case "deprecated":
      return {
        lifecycle,
        addressable: true,
        installAllowedByDefault: true,
        executionAllowedByDefault: true,
        warningRequired: true,
        hardBlock: false,
        reasonCode: "CAPABILITY_DEPRECATED",
      };
    case "yanked":
      return {
        lifecycle,
        addressable: true,
        installAllowedByDefault: false,
        executionAllowedByDefault: true,
        warningRequired: true,
        hardBlock: false,
        reasonCode: "CAPABILITY_YANKED",
      };
    case "revoked":
      return {
        lifecycle,
        addressable: true,
        installAllowedByDefault: false,
        executionAllowedByDefault: false,
        warningRequired: true,
        hardBlock: true,
        reasonCode: "CAPABILITY_REVOKED",
      };
  }
}
