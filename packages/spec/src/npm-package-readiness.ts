import { readFile } from "node:fs/promises";

export const NPM_PACKAGE_READINESS_SCHEMA_VERSION = "opencap.npm_package_readiness.v1" as const;

export type NpmPackageReadinessBlockerCode =
  | "NPM_PACKAGE_NAME_MISSING"
  | "NPM_PACKAGE_VERSION_MISSING"
  | "NPM_PACKAGE_NOT_ALPHA_CANDIDATE"
  | "NPM_PACKAGE_PRIVATE"
  | "NPM_PACKAGE_FILES_ALLOWLIST_MISSING"
  | "NPM_PACKAGE_FILES_ALLOWLIST_UNSAFE"
  | "NPM_PACKAGE_MISSING_PUBLIC_ENTRY"
  | "NPM_PACKAGE_MISSING_TYPES"
  | "NPM_PACKAGE_FORBIDDEN_PACK_FILE";

export type NpmPackageReadinessWarningCode = "NPM_PACKAGE_PACK_FILES_NOT_RUN";

export type NpmPackageForbiddenFileReasonCode =
  | "ENV_FILE"
  | "LOCAL_STATE"
  | "DATABASE_OR_LOG"
  | "SECRET_SHAPED_FILE";

export interface NpmPackageReadinessFinding {
  code: NpmPackageReadinessBlockerCode | NpmPackageReadinessWarningCode;
  severity: "blocker" | "warning";
  message: string;
  path?: string;
}

export interface NpmPackageForbiddenFile {
  path: string;
  reasonCode: NpmPackageForbiddenFileReasonCode;
}

export interface NpmPackagePackFile {
  path: string;
  size?: number;
}

export interface NpmPackageReadinessMetadata {
  private: boolean;
  hasMain: boolean;
  hasTypes: boolean;
  hasBin: boolean;
  hasFilesAllowlist: boolean;
  files: string[];
  exportKeys: string[];
}

export interface NpmPackageReadinessPackSummary {
  evidence: "provided" | "not-run";
  fileCount: number;
  totalSize: number;
  forbiddenFiles: NpmPackageForbiddenFile[];
}

export interface NpmPackageReadinessReport {
  schemaVersion: typeof NPM_PACKAGE_READINESS_SCHEMA_VERSION;
  packageName: string | null;
  version: string | null;
  packageJsonPath?: string;
  candidate: boolean;
  metadata: NpmPackageReadinessMetadata;
  pack: NpmPackageReadinessPackSummary;
  blockers: NpmPackageReadinessFinding[];
  warnings: NpmPackageReadinessFinding[];
  policyEffect: "none";
}

export interface BuildNpmPackageReadinessReportOptions {
  packageJsonPath?: string;
  allowedPackages?: string[];
  packFiles?: NpmPackagePackFile[];
}

export type NpmPackageReadinessArtifactFindingCode =
  | "NPM_PACKAGE_READINESS_ARTIFACT_NOT_OBJECT"
  | "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_SCHEMA_VERSION"
  | "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_POLICY_EFFECT"
  | "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD";

export interface NpmPackageReadinessArtifactFinding {
  code: NpmPackageReadinessArtifactFindingCode;
  path: string;
  message: string;
}

export type NpmPackageReadinessArtifactValidationResult =
  | {
      ok: true;
      artifact: NpmPackageReadinessReport;
      findings: [];
    }
  | {
      ok: false;
      findings: NpmPackageReadinessArtifactFinding[];
    };

const DEFAULT_ALLOWED_PACKAGES = ["@opencap/spec", "@opencap/cli"];
const READINESS_BLOCKER_CODES = new Set<NpmPackageReadinessBlockerCode>([
  "NPM_PACKAGE_NAME_MISSING",
  "NPM_PACKAGE_VERSION_MISSING",
  "NPM_PACKAGE_NOT_ALPHA_CANDIDATE",
  "NPM_PACKAGE_PRIVATE",
  "NPM_PACKAGE_FILES_ALLOWLIST_MISSING",
  "NPM_PACKAGE_FILES_ALLOWLIST_UNSAFE",
  "NPM_PACKAGE_MISSING_PUBLIC_ENTRY",
  "NPM_PACKAGE_MISSING_TYPES",
  "NPM_PACKAGE_FORBIDDEN_PACK_FILE",
]);
const READINESS_WARNING_CODES = new Set<NpmPackageReadinessWarningCode>([
  "NPM_PACKAGE_PACK_FILES_NOT_RUN",
]);
const FORBIDDEN_FILE_REASON_CODES = new Set<NpmPackageForbiddenFileReasonCode>([
  "ENV_FILE",
  "LOCAL_STATE",
  "DATABASE_OR_LOG",
  "SECRET_SHAPED_FILE",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function addArtifactFinding(
  findings: NpmPackageReadinessArtifactFinding[],
  code: NpmPackageReadinessArtifactFindingCode,
  path: string,
  message: string,
): void {
  findings.push({ code, path, message });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validateStringOrNullField(
  record: Record<string, unknown>,
  key: string,
  path: string,
  findings: NpmPackageReadinessArtifactFinding[],
): void {
  const value = record[key];
  if (value !== null && typeof value !== "string") {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", path, `${path} must be a string or null.`);
  }
}

function validateBooleanField(
  record: Record<string, unknown>,
  key: string,
  path: string,
  findings: NpmPackageReadinessArtifactFinding[],
): void {
  if (typeof record[key] !== "boolean") {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", path, `${path} must be a boolean.`);
  }
}

function validateMetadataArtifact(value: unknown, findings: NpmPackageReadinessArtifactFinding[]): void {
  if (!isRecord(value)) {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/metadata", "/metadata must be an object.");
    return;
  }

  for (const key of ["private", "hasMain", "hasTypes", "hasBin", "hasFilesAllowlist"] as const) {
    validateBooleanField(value, key, `/metadata/${key}`, findings);
  }
  if (!isStringArray(value.files)) {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/metadata/files", "/metadata/files must be an array of strings.");
  }
  if (!isStringArray(value.exportKeys)) {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/metadata/exportKeys", "/metadata/exportKeys must be an array of strings.");
  }
}

function validateForbiddenFilesArtifact(value: unknown, findings: NpmPackageReadinessArtifactFinding[]): void {
  if (!Array.isArray(value)) {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/pack/forbiddenFiles", "/pack/forbiddenFiles must be an array.");
    return;
  }

  value.forEach((entry, index) => {
    const path = `/pack/forbiddenFiles/${index}`;
    if (!isRecord(entry)) {
      addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", path, `${path} must be an object.`);
      return;
    }
    if (typeof entry.path !== "string" || entry.path.length === 0) {
      addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", `${path}/path`, `${path}/path must be a non-empty string.`);
    }
    if (typeof entry.reasonCode !== "string" || !FORBIDDEN_FILE_REASON_CODES.has(entry.reasonCode as NpmPackageForbiddenFileReasonCode)) {
      addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", `${path}/reasonCode`, `${path}/reasonCode must be a known forbidden file reason.`);
    }
  });
}

function validatePackArtifact(value: unknown, findings: NpmPackageReadinessArtifactFinding[]): void {
  if (!isRecord(value)) {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/pack", "/pack must be an object.");
    return;
  }

  if (value.evidence !== "provided" && value.evidence !== "not-run") {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/pack/evidence", "/pack/evidence must be provided or not-run.");
  }
  if (!isNonNegativeFiniteNumber(value.fileCount)) {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/pack/fileCount", "/pack/fileCount must be a non-negative number.");
  }
  if (!isNonNegativeFiniteNumber(value.totalSize)) {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/pack/totalSize", "/pack/totalSize must be a non-negative number.");
  }
  validateForbiddenFilesArtifact(value.forbiddenFiles, findings);
}

function validateFindingArtifacts(
  value: unknown,
  path: "/blockers" | "/warnings",
  expectedSeverity: "blocker" | "warning",
  allowedCodes: Set<NpmPackageReadinessBlockerCode> | Set<NpmPackageReadinessWarningCode>,
  findings: NpmPackageReadinessArtifactFinding[],
): void {
  if (!Array.isArray(value)) {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", path, `${path} must be an array.`);
    return;
  }

  value.forEach((entry, index) => {
    const entryPath = `${path}/${index}`;
    if (!isRecord(entry)) {
      addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", entryPath, `${entryPath} must be an object.`);
      return;
    }
    if (typeof entry.code !== "string" || !allowedCodes.has(entry.code as never)) {
      addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", `${entryPath}/code`, `${entryPath}/code must be a known ${expectedSeverity} code.`);
    }
    if (entry.severity !== expectedSeverity) {
      addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", `${entryPath}/severity`, `${entryPath}/severity must be ${expectedSeverity}.`);
    }
    if (typeof entry.message !== "string" || entry.message.length === 0) {
      addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", `${entryPath}/message`, `${entryPath}/message must be a non-empty string.`);
    }
    if (entry.path !== undefined && typeof entry.path !== "string") {
      addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", `${entryPath}/path`, `${entryPath}/path must be a string when present.`);
    }
  });
}

export function validateNpmPackageReadinessArtifact(value: unknown): NpmPackageReadinessArtifactValidationResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      findings: [
        {
          code: "NPM_PACKAGE_READINESS_ARTIFACT_NOT_OBJECT",
          path: "/",
          message: "Package readiness artifact must be a JSON object.",
        },
      ],
    };
  }

  const findings: NpmPackageReadinessArtifactFinding[] = [];
  if (value.schemaVersion !== NPM_PACKAGE_READINESS_SCHEMA_VERSION) {
    addArtifactFinding(
      findings,
      "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_SCHEMA_VERSION",
      "/schemaVersion",
      `Package readiness artifact schemaVersion must be ${NPM_PACKAGE_READINESS_SCHEMA_VERSION}.`,
    );
  }
  validateStringOrNullField(value, "packageName", "/packageName", findings);
  validateStringOrNullField(value, "version", "/version", findings);
  if (value.packageJsonPath !== undefined && typeof value.packageJsonPath !== "string") {
    addArtifactFinding(findings, "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_FIELD", "/packageJsonPath", "/packageJsonPath must be a string when present.");
  }
  validateBooleanField(value, "candidate", "/candidate", findings);
  validateMetadataArtifact(value.metadata, findings);
  validatePackArtifact(value.pack, findings);
  validateFindingArtifacts(value.blockers, "/blockers", "blocker", READINESS_BLOCKER_CODES, findings);
  validateFindingArtifacts(value.warnings, "/warnings", "warning", READINESS_WARNING_CODES, findings);
  if (value.policyEffect !== "none") {
    addArtifactFinding(
      findings,
      "NPM_PACKAGE_READINESS_ARTIFACT_INVALID_POLICY_EFFECT",
      "/policyEffect",
      "/policyEffect must be none.",
    );
  }

  if (findings.length > 0) {
    return { ok: false, findings };
  }

  return {
    ok: true,
    artifact: value as unknown as NpmPackageReadinessReport,
    findings: [],
  };
}

function hasRecordOrStringExport(value: unknown): boolean {
  return typeof value === "string" || isRecord(value);
}

function exportKeys(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value).sort() : [];
}

function hasBin(value: unknown): boolean {
  if (typeof value === "string") {
    return value.length > 0;
  }
  return isRecord(value) && Object.keys(value).length > 0;
}

function packageFiles(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : [];
}

function normalizedPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function forbiddenFileReasons(path: string): NpmPackageForbiddenFileReasonCode[] {
  const normalized = normalizedPath(path);
  const segments = normalized.split("/");
  const basename = segments[segments.length - 1] ?? normalized;
  const lower = normalized.toLowerCase();
  const basenameLower = basename.toLowerCase();
  const reasons: NpmPackageForbiddenFileReasonCode[] = [];

  if (basenameLower === ".env" || basenameLower.startsWith(".env.")) {
    reasons.push("ENV_FILE");
  }

  if (lower === "opencap.local" || lower.startsWith("opencap.local/") || lower.includes("/opencap.local/")) {
    reasons.push("LOCAL_STATE");
  }

  if (/\.(sqlite|sqlite3|db|log)$/i.test(basenameLower)) {
    reasons.push("DATABASE_OR_LOG");
  }

  const secretShapedName = /(^|[-_.])(secret|token|credential|private-key|apikey|api-key|authorization|cookie)([-_.]|$)/i.test(basenameLower);
  const codeArtifact = /\.(js|d\.ts|js\.map)$/i.test(basenameLower);
  if (secretShapedName && !codeArtifact) {
    reasons.push("SECRET_SHAPED_FILE");
  }

  return reasons;
}

function filesAllowlistUnsafeEntries(files: string[]): string[] {
  return files.filter((entry) => {
    const normalized = normalizedPath(entry);
    const lower = normalized.toLowerCase();
    const firstSegment = lower.split("/")[0] ?? lower;
    return (
      firstSegment === "src" ||
      firstSegment === "test" ||
      firstSegment === "tests" ||
      firstSegment === "fixtures" ||
      forbiddenFileReasons(normalized).length > 0
    );
  });
}

function addBlocker(blockers: NpmPackageReadinessFinding[], finding: NpmPackageReadinessFinding): void {
  if (!blockers.some((blocker) => blocker.code === finding.code && blocker.path === finding.path)) {
    blockers.push(finding);
  }
}

function packSummary(packFiles: NpmPackagePackFile[] | undefined): NpmPackageReadinessPackSummary {
  if (!packFiles) {
    return {
      evidence: "not-run",
      fileCount: 0,
      totalSize: 0,
      forbiddenFiles: [],
    };
  }

  const forbiddenFiles = packFiles.flatMap((file) =>
    forbiddenFileReasons(file.path).map((reasonCode) => ({
      path: normalizedPath(file.path),
      reasonCode,
    })),
  );

  return {
    evidence: "provided",
    fileCount: packFiles.length,
    totalSize: packFiles.reduce((total, file) => total + (typeof file.size === "number" && Number.isFinite(file.size) ? file.size : 0), 0),
    forbiddenFiles,
  };
}

export function buildNpmPackageReadinessReport(
  packageJson: Record<string, unknown>,
  options: BuildNpmPackageReadinessReportOptions = {},
): NpmPackageReadinessReport {
  const packageName = stringValue(packageJson.name);
  const version = stringValue(packageJson.version);
  const allowedPackages = new Set(options.allowedPackages ?? DEFAULT_ALLOWED_PACKAGES);
  const candidate = packageName ? allowedPackages.has(packageName) : false;
  const metadata: NpmPackageReadinessMetadata = {
    private: packageJson.private === true,
    hasMain: typeof packageJson.main === "string" && packageJson.main.length > 0,
    hasTypes: typeof packageJson.types === "string" && packageJson.types.length > 0,
    hasBin: hasBin(packageJson.bin),
    hasFilesAllowlist: packageFiles(packageJson.files).length > 0,
    files: packageFiles(packageJson.files),
    exportKeys: exportKeys(packageJson.exports),
  };
  const pack = packSummary(options.packFiles);
  const blockers: NpmPackageReadinessFinding[] = [];
  const warnings: NpmPackageReadinessFinding[] = [];

  if (!packageName) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_NAME_MISSING",
      severity: "blocker",
      path: "/name",
      message: "package.json must declare a package name before publish readiness can be assessed.",
    });
  }

  if (!version) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_VERSION_MISSING",
      severity: "blocker",
      path: "/version",
      message: "package.json must declare a package version before publish readiness can be assessed.",
    });
  }

  if (packageName && !candidate) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_NOT_ALPHA_CANDIDATE",
      severity: "blocker",
      path: "/name",
      message: "package is not in the current alpha npm publish candidate allowlist.",
    });
  }

  if (metadata.private) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_PRIVATE",
      severity: "blocker",
      path: "/private",
      message: "package is still marked private; keep this blocker until maintainers intentionally prepare an npm alpha release.",
    });
  }

  if (!metadata.hasFilesAllowlist) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_FILES_ALLOWLIST_MISSING",
      severity: "blocker",
      path: "/files",
      message: "package must define a files allowlist before npm publish readiness can be accepted.",
    });
  }

  const unsafeFiles = filesAllowlistUnsafeEntries(metadata.files);
  if (unsafeFiles.length > 0) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_FILES_ALLOWLIST_UNSAFE",
      severity: "blocker",
      path: "/files",
      message: `package files allowlist contains unsafe entries: ${unsafeFiles.join(", ")}`,
    });
  }

  if (!metadata.hasBin && !metadata.hasMain && !hasRecordOrStringExport(packageJson.exports)) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_MISSING_PUBLIC_ENTRY",
      severity: "blocker",
      path: "/exports",
      message: "package must expose a public entrypoint through bin, main, or exports before publishing.",
    });
  }

  if (!metadata.hasBin && !metadata.hasTypes) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_MISSING_TYPES",
      severity: "blocker",
      path: "/types",
      message: "library package must publish TypeScript declarations.",
    });
  }

  if (pack.evidence === "not-run") {
    warnings.push({
      code: "NPM_PACKAGE_PACK_FILES_NOT_RUN",
      severity: "warning",
      message: "npm pack dry-run file summary was not provided; tarball content evidence is not complete.",
    });
  }

  if (pack.forbiddenFiles.length > 0) {
    addBlocker(blockers, {
      code: "NPM_PACKAGE_FORBIDDEN_PACK_FILE",
      severity: "blocker",
      path: "/pack/files",
      message: "npm pack dry-run file summary contains forbidden local state, secret-shaped, database, env, or log files.",
    });
  }

  return {
    schemaVersion: NPM_PACKAGE_READINESS_SCHEMA_VERSION,
    packageName,
    version,
    packageJsonPath: options.packageJsonPath,
    candidate,
    metadata,
    pack,
    blockers,
    warnings,
    policyEffect: "none",
  };
}

export async function buildNpmPackageReadinessReportFromFile(
  packageJsonPath: string,
  options: Omit<BuildNpmPackageReadinessReportOptions, "packageJsonPath"> = {},
): Promise<NpmPackageReadinessReport> {
  const parsed = JSON.parse(await readFile(packageJsonPath, "utf8")) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("package.json must contain a JSON object.");
  }
  return buildNpmPackageReadinessReport(parsed, {
    ...options,
    packageJsonPath,
  });
}
