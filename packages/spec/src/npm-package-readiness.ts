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

const DEFAULT_ALLOWED_PACKAGES = ["@opencap/spec", "@opencap/cli"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
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
