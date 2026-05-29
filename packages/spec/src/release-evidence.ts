import type { ConformanceSummary } from "./conformance.js";
import type { NpmPackageReadinessReport } from "./npm-package-readiness.js";
import type { RegistryQualitySummary } from "./index.js";

export const RELEASE_EVIDENCE_SCHEMA_VERSION = "opencap.release_evidence.v1" as const;

export type ReleaseEvidenceCommandStatus = "pass" | "fail" | "not-run";
export type ReleaseEvidenceDecision = "candidate" | "block-release-tag" | "release";
export type ReleaseEvidenceComponentStatus = "pass" | "fail" | "not-run";

export type ReleaseEvidenceBlockerCode =
  | "REGISTRY_INVALID_MANIFESTS"
  | "REGISTRY_INVALID_ADVISORIES"
  | "REGISTRY_CAPABILITY_BLOCKER"
  | "CONFORMANCE_FAILED_RECORDS"
  | "CONFORMANCE_INVALID_RECORDS"
  | "PACKAGE_READINESS_BLOCKER"
  | "COMMAND_FAILED";

export interface ReleaseEvidenceBlocker {
  code: ReleaseEvidenceBlockerCode;
  source: "registry" | "conformance" | "package" | "command";
  message: string;
  ref?: string;
}

export interface ReleaseEvidenceRegistryComponent {
  status: ReleaseEvidenceComponentStatus;
  schemaVersion?: string;
  generatedAt?: string;
  capabilityCount: number;
  invalidManifestCount: number;
  invalidAdvisoryCount: number;
  blockedCapabilityCount: number;
  blockerRefs: string[];
}

export interface ReleaseEvidenceConformanceComponent {
  status: ReleaseEvidenceComponentStatus;
  schemaVersion?: string;
  suiteVersion?: string;
  recordCount: number;
  passedRecords: number;
  failedRecords: number;
  invalidRecords: number;
  profiles: string[];
}

export interface ReleaseEvidencePackageComponent {
  packageName: string | null;
  version: string | null;
  status: ReleaseEvidenceComponentStatus;
  candidate: boolean;
  private: boolean;
  packEvidence: "provided" | "not-run";
  packFileCount: number;
  forbiddenFileCount: number;
  blockerCodes: string[];
  warningCodes: string[];
}

export interface ReleaseEvidenceComponents {
  registry: ReleaseEvidenceRegistryComponent;
  conformance: ReleaseEvidenceConformanceComponent;
  packages: ReleaseEvidencePackageComponent[];
}

export interface ReleaseEvidenceBundle {
  schemaVersion: typeof RELEASE_EVIDENCE_SCHEMA_VERSION;
  target: string;
  commit: string;
  date: string;
  generatedAt: string;
  decision: ReleaseEvidenceDecision;
  commands: Record<string, ReleaseEvidenceCommandStatus>;
  components: ReleaseEvidenceComponents;
  blockers: ReleaseEvidenceBlocker[];
  knownGaps: string[];
  policyEffect: "none";
}

export interface BuildReleaseEvidenceBundleInput {
  target: string;
  commit: string;
  date: string;
  generatedAt?: string;
  decision?: ReleaseEvidenceDecision;
  commands?: Record<string, ReleaseEvidenceCommandStatus>;
  registryQualitySummary?: RegistryQualitySummary;
  conformanceSummary?: ConformanceSummary;
  packageReadinessReports?: NpmPackageReadinessReport[];
  knownGaps?: string[];
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/\b[A-Z0-9_]*(TOKEN|SECRET|PASSWORD|AUTH|COOKIE|KEY)[A-Z0-9_]*\b/g, "[REDACTED_ENV]")
    .replace(/\/Users\/[^\s,;:]+/g, "[REDACTED_PATH]")
    .replace(/\b[\w.-]*(secret|token|password|credential)[\w.-]*\b/gi, "[REDACTED_SECRET]");
}

function commandBlockers(commands: Record<string, ReleaseEvidenceCommandStatus>): ReleaseEvidenceBlocker[] {
  return Object.entries(commands)
    .filter(([, status]) => status === "fail")
    .map(([command]) => ({
      code: "COMMAND_FAILED" as const,
      source: "command" as const,
      message: `Required release evidence command failed: ${redactSensitiveText(command)}.`,
      ref: redactSensitiveText(command),
    }));
}

function registryComponent(summary: RegistryQualitySummary | undefined): ReleaseEvidenceRegistryComponent {
  if (!summary) {
    return {
      status: "not-run",
      capabilityCount: 0,
      invalidManifestCount: 0,
      invalidAdvisoryCount: 0,
      blockedCapabilityCount: 0,
      blockerRefs: [],
    };
  }

  const blockedCapabilities = summary.capabilities.filter((capability) => capability.blockingReasons.length > 0);
  return {
    status: summary.invalidManifests.length > 0 || summary.invalidAdvisories.length > 0 || blockedCapabilities.length > 0 ? "fail" : "pass",
    schemaVersion: summary.schemaVersion,
    generatedAt: summary.generatedAt,
    capabilityCount: summary.capabilities.length,
    invalidManifestCount: summary.invalidManifests.length,
    invalidAdvisoryCount: summary.invalidAdvisories.length,
    blockedCapabilityCount: blockedCapabilities.length,
    blockerRefs: blockedCapabilities.map((capability) => capability.id),
  };
}

function registryBlockers(summary: RegistryQualitySummary | undefined): ReleaseEvidenceBlocker[] {
  if (!summary) {
    return [];
  }

  const blockers: ReleaseEvidenceBlocker[] = [];
  if (summary.invalidManifests.length > 0) {
    blockers.push({
      code: "REGISTRY_INVALID_MANIFESTS",
      source: "registry",
      message: "Registry quality summary contains invalid manifests.",
    });
  }

  if (summary.invalidAdvisories.length > 0) {
    blockers.push({
      code: "REGISTRY_INVALID_ADVISORIES",
      source: "registry",
      message: "Registry quality summary contains invalid advisory records.",
    });
  }

  for (const capability of summary.capabilities.filter((entry) => entry.blockingReasons.length > 0)) {
    blockers.push({
      code: "REGISTRY_CAPABILITY_BLOCKER",
      source: "registry",
      message: "Registry capability has blocking quality, lifecycle, advisory, auth, or package evidence.",
      ref: capability.id,
    });
  }

  return blockers;
}

function conformanceComponent(summary: ConformanceSummary | undefined): ReleaseEvidenceConformanceComponent {
  if (!summary) {
    return {
      status: "not-run",
      recordCount: 0,
      passedRecords: 0,
      failedRecords: 0,
      invalidRecords: 0,
      profiles: [],
    };
  }

  return {
    status: summary.failedRecords > 0 || summary.invalidRecords > 0 ? "fail" : "pass",
    schemaVersion: summary.schemaVersion,
    suiteVersion: summary.suiteVersion,
    recordCount: summary.recordCount,
    passedRecords: summary.passedRecords,
    failedRecords: summary.failedRecords,
    invalidRecords: summary.invalidRecords,
    profiles: [...summary.profiles].sort(),
  };
}

function conformanceBlockers(summary: ConformanceSummary | undefined): ReleaseEvidenceBlocker[] {
  if (!summary) {
    return [];
  }

  const blockers: ReleaseEvidenceBlocker[] = [];
  if (summary.failedRecords > 0) {
    blockers.push({
      code: "CONFORMANCE_FAILED_RECORDS",
      source: "conformance",
      message: "Conformance summary contains failed records.",
    });
  }
  if (summary.invalidRecords > 0) {
    blockers.push({
      code: "CONFORMANCE_INVALID_RECORDS",
      source: "conformance",
      message: "Conformance summary contains invalid records.",
    });
  }
  return blockers;
}

function packageComponent(report: NpmPackageReadinessReport): ReleaseEvidencePackageComponent {
  const blockerCodes = report.blockers.map((blocker) => blocker.code).sort();
  return {
    packageName: report.packageName,
    version: report.version,
    status: blockerCodes.length > 0 ? "fail" : "pass",
    candidate: report.candidate,
    private: report.metadata.private,
    packEvidence: report.pack.evidence,
    packFileCount: report.pack.fileCount,
    forbiddenFileCount: report.pack.forbiddenFiles.length,
    blockerCodes,
    warningCodes: report.warnings.map((warning) => warning.code).sort(),
  };
}

function packageBlockers(reports: NpmPackageReadinessReport[]): ReleaseEvidenceBlocker[] {
  return reports.flatMap((report) =>
    report.blockers.map((blocker) => ({
      code: "PACKAGE_READINESS_BLOCKER" as const,
      source: "package" as const,
      message: `Package readiness blocker: ${blocker.code}.`,
      ref: report.packageName ?? undefined,
    })),
  );
}

function resolveDecision(input: BuildReleaseEvidenceBundleInput, blockers: ReleaseEvidenceBlocker[]): ReleaseEvidenceDecision {
  if (blockers.length > 0) {
    return "block-release-tag";
  }

  return input.decision ?? "candidate";
}

export function buildReleaseEvidenceBundle(input: BuildReleaseEvidenceBundleInput): ReleaseEvidenceBundle {
  const commands = input.commands ?? {};
  const packageReports = input.packageReadinessReports ?? [];
  const blockers = [
    ...registryBlockers(input.registryQualitySummary),
    ...conformanceBlockers(input.conformanceSummary),
    ...packageBlockers(packageReports),
    ...commandBlockers(commands),
  ];

  return {
    schemaVersion: RELEASE_EVIDENCE_SCHEMA_VERSION,
    target: redactSensitiveText(input.target),
    commit: redactSensitiveText(input.commit),
    date: redactSensitiveText(input.date),
    generatedAt: input.generatedAt ?? new Date(0).toISOString(),
    decision: resolveDecision(input, blockers),
    commands,
    components: {
      registry: registryComponent(input.registryQualitySummary),
      conformance: conformanceComponent(input.conformanceSummary),
      packages: packageReports.map(packageComponent),
    },
    blockers,
    knownGaps: (input.knownGaps ?? []).map(redactSensitiveText),
    policyEffect: "none",
  };
}
