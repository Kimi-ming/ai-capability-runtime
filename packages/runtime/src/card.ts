import { randomUUID } from "node:crypto";
import type { CapabilityPermission } from "@opencap/spec";
import type { CapabilityIdentity, ConsentRequest, InstallMetadata, InstalledCapabilityRecord, RiskSummary, TrustSummary } from "./domain.js";
import type { CompatibilityLedgerCheck, CompatibilityLedgerRecordV1, CompatibilityLedgerResult } from "./ledger.js";
import type { CapabilityQualityScore } from "./quality-score.js";

export const CARD_SCHEMA_VERSION = "opencap.card.v1" as const;
export const TRUST_CARD_DISCLAIMER = "Trust Card is an evidence summary, not a security guarantee and not an authorization decision." as const;

export type CardSchemaVersion = typeof CARD_SCHEMA_VERSION;
export type CardKind = "capability" | "trust" | "consent" | "compatibility";

export interface CardDocumentBase<Kind extends CardKind = CardKind> {
  schemaVersion: CardSchemaVersion;
  cardKind: Kind;
  cardId: string;
  generatedAt: string;
  generatedBy: "opencap.runtime";
}

export type CardSourceKind = "manifest" | "package" | "review" | "registry" | "ledger" | "audit" | "profile";

export interface CardSourceRef {
  kind: CardSourceKind;
  digest?: string;
  ref?: string;
}

export type CapabilityCardAuthPlacement = "none" | "bearer" | "named_header" | "unknown";

export interface CapabilityCardAuthSummary {
  type?: string;
  provider?: string;
  envName?: string;
  placement: CapabilityCardAuthPlacement;
  scopes: string[];
  credentialValueRedacted: true;
}

export interface CapabilityCardCapabilitySummary {
  id: string;
  version: string;
  name?: string;
  description?: string;
  lifecycle?: CapabilityIdentity["lifecycle"];
  manifestDigest?: string;
  packageDigest?: string;
  registryCommit?: string;
}

export interface CapabilityCardDocumentV1 extends CardDocumentBase<"capability"> {
  capability: CapabilityCardCapabilitySummary;
  summary: string;
  risk: RiskSummary;
  permissions: CapabilityPermission[];
  auth: CapabilityCardAuthSummary;
  install: InstallMetadata;
  trust?: TrustSummary;
  modelVisibleSummary?: string;
  generatedFrom: CardSourceRef[];
}

export type TrustCardTestStatus = "passing" | "failing" | "not_run" | "unknown";
export type TrustCardReviewStatus = "pass" | "warn" | "fail" | "unknown";
export type TrustCardMaintainerStatus = "community" | "verified" | "official" | "unknown";

export interface TrustCardTestSummary {
  status: TrustCardTestStatus;
  lastRun?: string;
  evidenceRef?: string;
}

export interface TrustCardReviewSummary {
  leastPrivilege?: TrustCardReviewStatus;
  reviewedAt?: string;
  reviewDigest?: string;
}

export interface TrustCardAdvisorySummary {
  open: number;
  latest?: string | null;
  refs: string[];
}

export interface TrustCardMaintainerSummary {
  status: TrustCardMaintainerStatus;
  name?: string;
}

export type TrustCardQualitySummary = CapabilityQualityScore;

export interface TrustCardProvenanceSummary {
  manifestDigest?: string;
  packageDigest?: string;
  registryCommit?: string;
  releaseDigest?: string;
}

export interface TrustCardDocumentV1 extends CardDocumentBase<"trust"> {
  capability: Pick<CapabilityIdentity, "id" | "version" | "lifecycle" | "manifestDigest" | "packageDigest" | "registryCommit">;
  trustLevel: TrustSummary["level"];
  lifecycle?: CapabilityIdentity["lifecycle"];
  tests: TrustCardTestSummary;
  review?: TrustCardReviewSummary;
  advisories: TrustCardAdvisorySummary;
  maintainer: TrustCardMaintainerSummary;
  quality?: TrustCardQualitySummary;
  provenance?: TrustCardProvenanceSummary;
  limitations: string[];
  disclaimer: typeof TRUST_CARD_DISCLAIMER;
}

export interface ConsentCardFieldSummary {
  path: string;
  destination: string;
}

export interface ConsentCardDocumentV1 extends CardDocumentBase<"consent"> {
  consentId: string;
  requestId: string;
  capability: CapabilityIdentity;
  action: string;
  targetOrigin?: string;
  egressDataClasses: string[];
  fieldsSent: ConsentCardFieldSummary[];
  risk: RiskSummary;
  policyReason: string;
  expiresAt?: string;
  runtimeGenerated: true;
}

export interface CompatibilityCardDocumentV1 extends CardDocumentBase<"compatibility"> {
  host: CompatibilityLedgerRecordV1["host"];
  profile: CompatibilityLedgerRecordV1["profile"];
  capability?: CompatibilityLedgerRecordV1["capability"];
  opencapVersion?: string;
  opencapCommit?: string;
  result: CompatibilityLedgerResult;
  checkedAt: string;
  checks: CompatibilityLedgerCheck[];
  knownGaps: string[];
  evidenceRef?: string;
  notes?: string;
}

export type CardDocumentV1 =
  | CapabilityCardDocumentV1
  | TrustCardDocumentV1
  | ConsentCardDocumentV1
  | CompatibilityCardDocumentV1;

export interface CreateCardOptions {
  cardId?: string;
  generatedAt?: string;
}

export interface CreateCapabilityCardInput extends CreateCardOptions {
  capability: InstalledCapabilityRecord;
}

export interface CreateTrustCardInput extends CreateCardOptions {
  capability: CapabilityIdentity;
  trust?: TrustSummary;
  tests?: TrustCardTestSummary;
  review?: TrustCardReviewSummary;
  advisories?: TrustCardAdvisorySummary;
  maintainer?: TrustCardMaintainerSummary;
  quality?: TrustCardQualitySummary;
  provenance?: TrustCardProvenanceSummary;
  limitations?: string[];
}

export interface CreateTrustCardFromInstalledCapabilityInput extends CreateCardOptions {
  capability: InstalledCapabilityRecord;
  tests?: TrustCardTestSummary;
  review?: TrustCardReviewSummary;
  quality?: TrustCardQualitySummary;
  limitations?: string[];
}

export interface CreateConsentCardInput extends CreateCardOptions {
  consent: ConsentRequest;
}

export interface CreateCompatibilityCardInput extends CreateCardOptions {
  record: CompatibilityLedgerRecordV1;
}

const CARD_PREFIX: Record<CardKind, string> = {
  capability: "cap",
  trust: "trust",
  consent: "consent",
  compatibility: "compat",
};

function generatedAt(options: CreateCardOptions): string {
  return options.generatedAt ?? new Date().toISOString();
}

function cardBase<Kind extends CardKind>(kind: Kind, options: CreateCardOptions): CardDocumentBase<Kind> {
  return {
    schemaVersion: CARD_SCHEMA_VERSION,
    cardKind: kind,
    cardId: options.cardId ?? createCardId(kind),
    generatedAt: generatedAt(options),
    generatedBy: "opencap.runtime",
  };
}

function stringField(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

function stringArrayField(record: Record<string, unknown> | undefined, key: string): string[] {
  const value = record?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function authPlacement(auth: Record<string, unknown> | undefined): CapabilityCardAuthPlacement {
  const type = stringField(auth, "type");
  if (type === "none") {
    return "none";
  }

  const placement = auth?.placement;
  if (typeof placement === "object" && placement !== null) {
    const placementType = stringField(placement as Record<string, unknown>, "type");
    if (placementType === "bearer") {
      return "bearer";
    }
    if (placementType === "header") {
      return "named_header";
    }
  }

  return "unknown";
}

function authSummary(auth: Record<string, unknown> | undefined): CapabilityCardAuthSummary {
  return {
    type: stringField(auth, "type"),
    provider: stringField(auth, "provider"),
    envName: stringField(auth, "env"),
    placement: authPlacement(auth),
    scopes: stringArrayField(auth, "scopes"),
    credentialValueRedacted: true,
  };
}

function generatedFrom(capability: InstalledCapabilityRecord): CardSourceRef[] {
  const refs: CardSourceRef[] = [];

  if (capability.identity.manifestDigest) {
    refs.push({ kind: "manifest", digest: capability.identity.manifestDigest });
  }
  if (capability.identity.packageDigest) {
    refs.push({ kind: "package", digest: capability.identity.packageDigest });
  }
  if (capability.trust?.reviewDigest) {
    refs.push({ kind: "review", digest: capability.trust.reviewDigest });
  }
  if (capability.identity.registryCommit) {
    refs.push({ kind: "registry", ref: capability.identity.registryCommit });
  }

  return refs;
}

function defaultAdvisories(trust: TrustSummary | undefined): TrustCardAdvisorySummary {
  const refs = trust?.advisories ?? [];
  return {
    open: refs.length,
    latest: refs[0] ?? null,
    refs,
  };
}

function maintainerStatusFromTrust(trust: TrustSummary | undefined): TrustCardMaintainerStatus {
  if (trust?.level === "official") {
    return "official";
  }
  if (trust?.level === "maintainer_verified") {
    return "verified";
  }
  if (trust?.level === "listed" || trust?.level === "tested") {
    return "community";
  }
  return "unknown";
}

function defaultTrustCardLimitations(limitations: string[] | undefined, quality: TrustCardQualitySummary | undefined): string[] {
  return [
    ...(limitations ?? []),
    "Trust level does not override local policy, consent, outbound policy, or audit.",
    ...(quality ? ["Quality score is explanatory evidence and has no policy effect."] : []),
    "Trust Card is generated from available evidence and may lag behind provider or registry changes.",
  ];
}

function compatibilityKnownGaps(checks: CompatibilityLedgerCheck[]): string[] {
  return checks
    .filter((check) => check.result !== "pass" && check.result !== "supported")
    .map((check) => `${check.id}: ${check.summary ?? check.result}`);
}

export function createCardId(kind: CardKind): string {
  return `card_${CARD_PREFIX[kind]}_${randomUUID()}`;
}

export function createCapabilityCard(input: CreateCapabilityCardInput): CapabilityCardDocumentV1 {
  const capability = input.capability;
  const manifest = capability.manifest;

  return {
    ...cardBase("capability", input),
    capability: {
      id: capability.identity.id,
      version: capability.identity.version,
      name: manifest?.name,
      description: manifest?.description,
      lifecycle: capability.identity.lifecycle,
      manifestDigest: capability.identity.manifestDigest,
      packageDigest: capability.identity.packageDigest,
      registryCommit: capability.identity.registryCommit,
    },
    summary: manifest?.description ?? capability.derived.modelVisibleSummary ?? capability.identity.id,
    risk: capability.derived.riskSummary,
    permissions: manifest?.permissions ?? capability.derived.riskSummary.permissions ?? [],
    auth: authSummary(manifest?.auth),
    install: capability.install,
    trust: capability.trust,
    modelVisibleSummary: capability.derived.modelVisibleSummary,
    generatedFrom: generatedFrom(capability),
  };
}

export function createTrustCard(input: CreateTrustCardInput): TrustCardDocumentV1 {
  return {
    ...cardBase("trust", input),
    capability: {
      id: input.capability.id,
      version: input.capability.version,
      lifecycle: input.capability.lifecycle,
      manifestDigest: input.capability.manifestDigest,
      packageDigest: input.capability.packageDigest,
      registryCommit: input.capability.registryCommit,
    },
    trustLevel: input.trust?.level ?? "unverified",
    lifecycle: input.capability.lifecycle,
    tests: input.tests ?? { status: "unknown" },
    review: input.review,
    advisories: input.advisories ?? defaultAdvisories(input.trust),
    maintainer: input.maintainer ?? { status: "unknown" },
    quality: input.quality,
    provenance: input.provenance,
    limitations: input.limitations ?? [],
    disclaimer: TRUST_CARD_DISCLAIMER,
  };
}

export function createTrustCardFromInstalledCapability(input: CreateTrustCardFromInstalledCapabilityInput): TrustCardDocumentV1 {
  const capability = input.capability;
  const maintainerName = stringField(capability.manifest?.metadata, "maintainer");
  const review = input.review ?? (capability.trust?.reviewDigest ? { reviewDigest: capability.trust.reviewDigest } : undefined);

  return createTrustCard({
    cardId: input.cardId,
    generatedAt: input.generatedAt,
    capability: capability.identity,
    trust: capability.trust,
    tests: input.tests ?? { status: "unknown" },
    review,
    advisories: defaultAdvisories(capability.trust),
    maintainer: {
      status: maintainerStatusFromTrust(capability.trust),
      name: maintainerName,
    },
    quality: input.quality,
    provenance: {
      manifestDigest: capability.identity.manifestDigest,
      packageDigest: capability.identity.packageDigest,
      registryCommit: capability.identity.registryCommit,
    },
    limitations: defaultTrustCardLimitations(input.limitations, input.quality),
  });
}

export function createConsentCard(input: CreateConsentCardInput): ConsentCardDocumentV1 {
  const consent = input.consent;

  return {
    ...cardBase("consent", input),
    consentId: consent.consentId,
    requestId: consent.requestId,
    capability: consent.capability,
    action: consent.actionSummary,
    targetOrigin: consent.egressSummary.targetOrigin,
    egressDataClasses: consent.egressSummary.dataClasses,
    fieldsSent: consent.egressSummary.fieldsSent ?? [],
    risk: consent.riskSummary,
    policyReason: consent.policyReason,
    expiresAt: consent.expiresAt,
    runtimeGenerated: true,
  };
}

export function createCompatibilityCard(input: CreateCompatibilityCardInput): CompatibilityCardDocumentV1 {
  const record = input.record;

  return {
    ...cardBase("compatibility", input),
    host: record.host,
    profile: record.profile,
    capability: record.capability,
    opencapVersion: record.opencapVersion,
    opencapCommit: record.opencapCommit,
    result: record.result,
    checkedAt: record.checkedAt,
    checks: record.checks,
    knownGaps: compatibilityKnownGaps(record.checks),
    evidenceRef: record.evidenceRef,
    notes: record.notes,
  };
}
