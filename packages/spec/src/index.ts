export { lintModelVisibleMetadata } from "./metadata-lint.js";
export type { ModelVisibleMetadataFinding, ModelVisibleMetadataLintRule, ModelVisibleMetadataLintSeverity } from "./metadata-lint.js";
export { buildCapabilityScaffold } from "./capability-scaffold.js";
export type {
  BuildCapabilityScaffoldInput,
  CapabilityScaffold,
  CapabilityScaffoldAuth,
  CapabilityScaffoldFile,
  CapabilityScaffoldHttpMethod,
} from "./capability-scaffold.js";
export {
  OPENAPI_OPERATION_SELECTION_SCHEMA_VERSION,
  buildOpenApiOperationSelectionReport,
} from "./openapi-operation-selection.js";
export type {
  BuildOpenApiOperationSelectionReportOptions,
  OpenApiOperationReviewerHints,
  OpenApiOperationSelectionFinding,
  OpenApiOperationSelectionFindingCode,
  OpenApiOperationSelectionInput,
  OpenApiOperationSelectionReport,
  OpenApiOperationSelectionRisk,
  OpenApiSecurityEvidence,
  OpenApiSecurityRequirementEvidence,
  OpenApiSelectedOperationEvidence,
  OpenApiSelectedServerEvidence,
} from "./openapi-operation-selection.js";
export {
  CONFORMANCE_SUMMARY_SCHEMA_VERSION,
  CONFORMANCE_SUITE_VERSION,
  CORE_CONFORMANCE_GROUPS,
  buildConformanceSummary,
  validateConformanceRecord,
} from "./conformance.js";
export type {
  BuildConformanceSummaryOptions,
  ConformanceRecordSummary,
  ConformanceRecordValidationIssue,
  ConformanceSummary,
  InvalidConformanceRecordSummary,
} from "./conformance.js";
export { lintPrivacyRetentionDoc } from "./privacy-retention-doc-lint.js";
export type { PrivacyRetentionDocFinding, PrivacyRetentionDocLintRule } from "./privacy-retention-doc-lint.js";
export { lintCredentialLifecycleRunbook } from "./credential-lifecycle-doc-lint.js";
export type { CredentialLifecycleRunbookFinding, CredentialLifecycleRunbookLintRule } from "./credential-lifecycle-doc-lint.js";
export { lintGithubFineGrainedTokenGuide } from "./github-token-guide-doc-lint.js";
export type { GithubFineGrainedTokenGuideFinding, GithubFineGrainedTokenGuideLintRule } from "./github-token-guide-doc-lint.js";
export { lintSecurityPolicyDoc } from "./security-policy-doc-lint.js";
export type { SecurityPolicyDocFinding, SecurityPolicyDocLintRule } from "./security-policy-doc-lint.js";
export { lintNpmPublishWorkflow, lintNpmPublishWorkflowFile } from "./npm-publish-workflow-lint.js";
export type { NpmPublishWorkflowFinding, NpmPublishWorkflowLintResult, NpmPublishWorkflowLintRule } from "./npm-publish-workflow-lint.js";
export {
  NPM_PACKAGE_READINESS_SCHEMA_VERSION,
  buildNpmPackageReadinessReport,
  buildNpmPackageReadinessReportFromFile,
  validateNpmPackageReadinessArtifact,
} from "./npm-package-readiness.js";
export type {
  BuildNpmPackageReadinessReportOptions,
  NpmPackageForbiddenFile,
  NpmPackageForbiddenFileReasonCode,
  NpmPackageReadinessArtifactFinding,
  NpmPackageReadinessArtifactFindingCode,
  NpmPackageReadinessArtifactValidationResult,
  NpmPackagePackFile,
  NpmPackageReadinessBlockerCode,
  NpmPackageReadinessFinding,
  NpmPackageReadinessMetadata,
  NpmPackageReadinessPackSummary,
  NpmPackageReadinessReport,
  NpmPackageReadinessWarningCode,
} from "./npm-package-readiness.js";
export { RELEASE_EVIDENCE_SCHEMA_VERSION, buildReleaseEvidenceBundle } from "./release-evidence.js";
export { RELEASE_ARTIFACT_VALIDATION_SCHEMA_VERSION, validateReleaseEvidenceArtifact } from "./release-evidence-artifact.js";
export type {
  BuildReleaseEvidenceBundleInput,
  ReleaseEvidenceBlocker,
  ReleaseEvidenceBlockerCode,
  ReleaseEvidenceBundle,
  ReleaseEvidenceCommandStatus,
  ReleaseEvidenceComponentStatus,
  ReleaseEvidenceComponents,
  ReleaseEvidenceConformanceComponent,
  ReleaseEvidenceDecision,
  ReleaseEvidencePackageComponent,
  ReleaseEvidenceRegistryComponent,
} from "./release-evidence.js";
export { lintLeastPrivilegeAuth } from "./auth-lint.js";
export type { LeastPrivilegeAuthFinding, LeastPrivilegeAuthLintRule, LeastPrivilegeAuthLintSeverity } from "./auth-lint.js";
export { findCapabilityPackageDirs, validateCapabilityPackage, validateCapabilityPackagePath } from "./package-lint.js";
export type {
  CapabilityPackagePathValidationResult,
  CapabilityPackageValidationFailure,
  CapabilityPackageValidationIssue,
  CapabilityPackageValidationResult,
  CapabilityPackageValidationSuccess,
} from "./package-lint.js";
export {
  CAPABILITY_AUTHORING_LOOP_VERSION,
  evaluateCapabilityAuthoringProgress,
  getCapabilityAuthoringLintOrder,
  getCapabilityAuthoringStage,
  isCapabilityAuthoringStageId,
} from "./authoring.js";
export type {
  CapabilityAuthoringBlockTarget,
  CapabilityAuthoringProgress,
  CapabilityAuthoringStage,
  CapabilityAuthoringStageId,
} from "./authoring.js";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative } from "node:path";
import YAML from "yaml";
import { lintLeastPrivilegeAuth, type LeastPrivilegeAuthFinding } from "./auth-lint.js";
import { lintModelVisibleMetadata, type ModelVisibleMetadataFinding } from "./metadata-lint.js";
import { validateCapabilityPackage, type CapabilityPackageValidationIssue } from "./package-lint.js";

export type RiskLevel =
  | "read_only"
  | "write"
  | "external_send"
  | "destructive"
  | "financial"
  | "code_execution"
  | "secret_access";

export type CapabilityType = "http";

export type CapabilityManifestLifecycleStatus = "deprecated" | "yanked" | "revoked";

export interface CapabilityManifestLifecycle {
  status: CapabilityManifestLifecycleStatus;
  reason: string;
  since: string;
  advisory?: string;
  replacement?: string;
  message?: string;
}

export interface CapabilityPermission {
  resource: string;
  action: string;
  risk: RiskLevel;
  confirmation: "allow" | "ask" | "deny";
}

export interface CapabilityManifestPackageProvenance {
  source: "git" | "local" | "future_oci" | "future_slsa";
  repository?: string;
  path?: string;
  commit?: string;
  digest?: string;
  buildType?: "manual_review" | "future_slsa" | "future_sigstore" | "future_oci";
}

export interface CapabilityManifestReleaseProvenance {
  publisher?: "manual" | "npm_trusted_publishing" | "future_sigstore" | "future_org_signature";
  provenance?: "none" | "npm" | "future_slsa" | "future_sigstore";
  workflowRef?: string;
  attestationDigest?: string;
  transparencyLogRef?: string;
}

export interface CapabilityManifestProvenance {
  package?: CapabilityManifestPackageProvenance;
  release?: CapabilityManifestReleaseProvenance;
  policyEffect: "none";
}

export interface CapabilityManifestExecutionReconcile {
  strategy: "manual" | "provider_lookup";
  hint: string;
  provider_request_id_field?: string;
  resource_ref_fields?: string[];
  retry_guidance: "do_not_retry_until_reconciled";
  policy_effect: "none";
}

export interface CapabilityManifestExecutionBody {
  type?: "json";
  fields: Record<string, unknown>;
}

export interface CapabilityManifestExecution extends Record<string, unknown> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url?: string;
  timeout_ms?: number;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: CapabilityManifestExecutionBody;
  reconcile?: CapabilityManifestExecutionReconcile;
}

export interface CapabilityManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  type: CapabilityType;
  lifecycle?: CapabilityManifestLifecycle;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  auth: Record<string, unknown>;
  permissions: CapabilityPermission[];
  execution: CapabilityManifestExecution;
  provenance?: CapabilityManifestProvenance;
  metadata: Record<string, unknown>;
}

export interface ManifestValidationIssue {
  filePath: string;
  fieldPath: string;
  message: string;
  keyword?: string;
}

export interface ManifestValidationSuccess {
  ok: true;
  filePath: string;
  manifest: CapabilityManifest;
}

export interface ManifestValidationFailure {
  ok: false;
  filePath: string;
  issues: ManifestValidationIssue[];
}

export type ManifestValidationResult = ManifestValidationSuccess | ManifestValidationFailure;

export interface ManifestPathValidationResult {
  targetPath: string;
  manifests: string[];
  valid: ManifestValidationSuccess[];
  invalid: ManifestValidationFailure[];
}

export interface RegistryCapabilitySearchResult {
  id: string;
  name: string;
  description: string;
  version: string;
  lifecycle: CapabilityManifestLifecycleStatus | "active";
  filePath: string;
  manifest: CapabilityManifest;
}

export interface RegistryCapabilitySearchOptions {
  query?: string;
  includeLifecycle?: CapabilityManifestLifecycleStatus[];
}

export interface RegistryCapabilitySearchResults {
  targetPath: string;
  query?: string;
  results: RegistryCapabilitySearchResult[];
  excludedByLifecycle: RegistryCapabilitySearchResult[];
  invalid: ManifestValidationFailure[];
}

export const REGISTRY_QUALITY_SUMMARY_SCHEMA_VERSION = "opencap.registry_quality_summary.v1" as const;
export const REGISTRY_QUALITY_SCORE_RUBRIC_VERSION = "opencap.quality_score.v1" as const;
export const REGISTRY_INDEX_SCHEMA_VERSION = "opencap.registry.index.v1" as const;
export const REGISTRY_INDEX_PROFILE = "opencap.registry.index_cache_sync.v1" as const;
export const REGISTRY_INDEX_VALIDATION_SCHEMA_VERSION = "opencap.registry_index_validation.v1" as const;

export type RegistryQualitySummarySchemaVersion = typeof REGISTRY_QUALITY_SUMMARY_SCHEMA_VERSION;
export type RegistryIndexSchemaVersion = typeof REGISTRY_INDEX_SCHEMA_VERSION;
export type RegistryIndexProfile = typeof REGISTRY_INDEX_PROFILE;
export type RegistryIndexSource = "local" | "git";
export type RegistryIndexSignatureStatus = "none";
export type RegistryIndexValidationSchemaVersion = typeof REGISTRY_INDEX_VALIDATION_SCHEMA_VERSION;
export type RegistryIndexArtifactFindingCode =
  | "REGISTRY_INDEX_ARTIFACT_NOT_OBJECT"
  | "REGISTRY_INDEX_SCHEMA_VERSION_INVALID"
  | "REGISTRY_INDEX_PROFILE_INVALID"
  | "REGISTRY_INDEX_GENERATED_AT_INVALID"
  | "REGISTRY_INDEX_CAPABILITY_COUNT_INVALID"
  | "REGISTRY_INDEX_CAPABILITY_COUNT_MISMATCH"
  | "REGISTRY_INDEX_INVALID_MANIFEST_COUNT_INVALID"
  | "REGISTRY_INDEX_SIGNATURE_STATUS_INVALID"
  | "REGISTRY_INDEX_POLICY_EFFECT_INVALID"
  | "REGISTRY_INDEX_DIGEST_INVALID"
  | "REGISTRY_INDEX_DIGEST_MISMATCH"
  | "REGISTRY_INDEX_CAPABILITY_INVALID"
  | "REGISTRY_INDEX_CAPABILITY_PATH_UNSAFE"
  | "REGISTRY_INDEX_CAPABILITY_DIGEST_INVALID"
  | "REGISTRY_INDEX_CAPABILITY_POLICY_EFFECT_INVALID"
  | "REGISTRY_INDEX_CAPABILITY_QUALITY_INVALID"
  | "REGISTRY_INDEX_SENSITIVE_TEXT";
export type RegistryQualityEvidenceStatus = "pass" | "fail";
export type RegistryQualityAdvisoryStatus = "none" | CapabilityAdvisoryStatus;
export type RegistryQualityScoreBand = "incomplete" | "experimental" | "listed" | "tested" | "verified";

export interface RegistryIndexRegistryMetadata {
  source: RegistryIndexSource;
  repository?: string;
  commit?: string;
}

export interface RegistryIndexGeneratorMetadata {
  name: string;
  version: string;
  commit?: string;
}

export interface RegistryIndexQualitySummary {
  rubricVersion: typeof REGISTRY_QUALITY_SCORE_RUBRIC_VERSION;
  total: number;
  band: RegistryQualityScoreBand;
  policyEffect: "none";
}

export interface RegistryIndexCapability {
  id: string;
  name: string;
  version: string;
  category: string;
  path: string;
  manifestDigest: string;
  lifecycle: CapabilityManifestLifecycleStatus | "active";
  trustLevel: string;
  quality: RegistryIndexQualitySummary;
  advisoryRefs: string[];
  defaultInstallTrusted: boolean;
  blockingReasons: string[];
  policyEffect: "none";
}

export interface RegistryIndex {
  schemaVersion: RegistryIndexSchemaVersion;
  profile: RegistryIndexProfile;
  generatedAt: string;
  registry: RegistryIndexRegistryMetadata;
  generator: RegistryIndexGeneratorMetadata;
  capabilityCount: number;
  invalidManifestCount: number;
  capabilities: RegistryIndexCapability[];
  signatureStatus: RegistryIndexSignatureStatus;
  indexDigest: string;
  policyEffect: "none";
}

export interface BuildRegistryIndexOptions {
  generatedAt?: string;
  registry?: Partial<RegistryIndexRegistryMetadata> & { source?: RegistryIndexSource };
  generator?: Partial<RegistryIndexGeneratorMetadata>;
}

export interface RegistryIndexArtifactFinding {
  code: RegistryIndexArtifactFindingCode;
  severity: "blocker";
  path: string;
  message: string;
}

export interface RegistryIndexArtifactValidationReport {
  schemaVersion: RegistryIndexValidationSchemaVersion;
  valid: boolean;
  artifactSchemaVersion?: string;
  profile?: string;
  indexDigest?: string;
  findingCount: number;
  findings: RegistryIndexArtifactFinding[];
  policyEffect: "none";
}

export interface RegistryQualityScoreDimensions {
  manifest: number;
  docs: number;
  tests: number;
  security: number;
  maintenance: number;
  compatibility: number;
  evidence: number;
}

export interface RegistryQualityScore {
  rubricVersion: typeof REGISTRY_QUALITY_SCORE_RUBRIC_VERSION;
  total: number;
  band: RegistryQualityScoreBand;
  dimensions: RegistryQualityScoreDimensions;
  generatedAt: string;
  policyEffect: "none";
}

export interface RegistryQualityCheckSummary {
  status: RegistryQualityEvidenceStatus;
  issues: string[];
}

export interface RegistryQualityRegistryTestSummary extends RegistryQualityCheckSummary {
  count: number;
}

export interface RegistryQualityLifecycleSummary {
  status: CapabilityManifestLifecycleStatus | "active";
  advisory?: string;
}

export interface RegistryQualityAdvisorySummary {
  status: RegistryQualityAdvisoryStatus;
  open: number;
  ids: string[];
  runtimeDefault?: CapabilityAdvisoryRuntimeDefault;
}

export interface RegistryCapabilityQualitySummary {
  id: string;
  category: string;
  version: string;
  manifestPath: string;
  packageDir: string;
  manifestValidation: RegistryQualityCheckSummary;
  packageLint: RegistryQualityCheckSummary;
  registryTests: RegistryQualityRegistryTestSummary;
  authLeastPrivilege: RegistryQualityCheckSummary;
  lifecycle: RegistryQualityLifecycleSummary;
  advisory: RegistryQualityAdvisorySummary;
  qualityScore: RegistryQualityScore;
  defaultInstallTrusted: boolean;
  blockingReasons: string[];
  policyEffect: "none";
}

export interface RegistryQualitySummary {
  schemaVersion: RegistryQualitySummarySchemaVersion;
  registryRoot: string;
  generatedAt: string;
  capabilities: RegistryCapabilityQualitySummary[];
  invalidManifests: ManifestValidationFailure[];
  invalidAdvisories: CapabilityAdvisoryValidationFailure[];
  policyEffect: "none";
}

export interface BuildRegistryQualitySummaryOptions {
  generatedAt?: string;
}

let compiledManifestValidator: ValidateFunction | undefined;
let compiledRegistryTestValidator: ValidateFunction | undefined;
let compiledCapabilityAdvisoryValidator: ValidateFunction | undefined;

async function compileSchema(schemaFileName: string): Promise<ValidateFunction> {
  const schemaPath = new URL(`../schema/${schemaFileName}`, import.meta.url);
  const schema = JSON.parse(await readFile(schemaPath, "utf8")) as object;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

async function getManifestValidator() {
  if (!compiledManifestValidator) {
    compiledManifestValidator = await compileSchema("manifest.schema.json");
  }

  return compiledManifestValidator;
}

async function getRegistryTestValidator() {
  if (!compiledRegistryTestValidator) {
    compiledRegistryTestValidator = await compileSchema("registry-test.schema.json");
  }

  return compiledRegistryTestValidator;
}

async function getCapabilityAdvisoryValidator() {
  if (!compiledCapabilityAdvisoryValidator) {
    compiledCapabilityAdvisoryValidator = await compileSchema("capability-advisory.schema.json");
  }

  return compiledCapabilityAdvisoryValidator;
}

function isManifestFileName(fileName: string): boolean {
  return ["manifest.yml", "manifest.yaml", "manifest.json"].includes(basename(fileName));
}

async function findManifestsInDirectory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findManifestsInDirectory(path)));
    } else if (entry.isFile() && isManifestFileName(entry.name)) {
      files.push(path);
    }
  }

  return files.sort();
}

export async function findManifestFiles(targetPath: string): Promise<string[]> {
  const info = await stat(targetPath);

  if (info.isFile()) {
    return isManifestFileName(targetPath) ? [targetPath] : [];
  }

  if (info.isDirectory()) {
    return findManifestsInDirectory(targetPath);
  }

  return [];
}

export async function loadManifest(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  const ext = extname(filePath).toLowerCase();

  if (ext === ".json") {
    return JSON.parse(raw);
  }

  return YAML.parse(raw);
}

function normalizeInstancePath(error: ErrorObject): string {
  if (error.keyword === "required" && typeof error.params.missingProperty === "string") {
    return `${error.instancePath || ""}/${error.params.missingProperty}` || "/";
  }

  if (error.keyword === "additionalProperties" && typeof error.params.additionalProperty === "string") {
    return `${error.instancePath || ""}/${error.params.additionalProperty}` || "/";
  }

  return error.instancePath || "/";
}

function issuesFromAjvErrors(filePath: string, errors: ErrorObject[] | null | undefined): ManifestValidationIssue[] {
  return (errors ?? []).map((error) => ({
    filePath,
    fieldPath: normalizeInstancePath(error),
    message: error.message ?? "is invalid",
    keyword: error.keyword,
  }));
}

export async function validateManifest(manifest: unknown, filePath = "<memory>"): Promise<ManifestValidationResult> {
  const validator = await getManifestValidator();
  const valid = validator(manifest);

  if (valid) {
    return {
      ok: true,
      filePath,
      manifest: manifest as CapabilityManifest,
    };
  }

  return {
    ok: false,
    filePath,
    issues: issuesFromAjvErrors(filePath, validator.errors),
  };
}

export async function validateManifestFile(filePath: string): Promise<ManifestValidationResult> {
  try {
    const manifest = await loadManifest(filePath);
    return validateManifest(manifest, filePath);
  } catch (error) {
    return {
      ok: false,
      filePath,
      issues: [
        {
          filePath,
          fieldPath: "/",
          message: error instanceof Error ? error.message : "failed to read manifest",
          keyword: "parse",
        },
      ],
    };
  }
}

export async function validateManifestPath(targetPath: string): Promise<ManifestPathValidationResult> {
  const manifests = await findManifestFiles(targetPath);
  const results = await Promise.all(manifests.map((manifestPath) => validateManifestFile(manifestPath)));

  return {
    targetPath,
    manifests,
    valid: results.filter((result): result is ManifestValidationSuccess => result.ok),
    invalid: results.filter((result): result is ManifestValidationFailure => !result.ok),
  };
}

function registrySearchResult(result: ManifestValidationSuccess): RegistryCapabilitySearchResult {
  return {
    id: result.manifest.id,
    name: result.manifest.name,
    description: result.manifest.description,
    version: result.manifest.version,
    lifecycle: result.manifest.lifecycle?.status ?? "active",
    filePath: result.filePath,
    manifest: result.manifest,
  };
}

function matchesRegistrySearchQuery(result: RegistryCapabilitySearchResult, query: string | undefined): boolean {
  if (query === undefined || query.trim().length === 0) {
    return true;
  }
  const normalizedQuery = query.toLowerCase();
  return [result.id, result.name, result.description].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export async function searchRegistryCapabilities(
  targetPath: string,
  options: RegistryCapabilitySearchOptions = {},
): Promise<RegistryCapabilitySearchResults> {
  const validation = await validateManifestPath(targetPath);
  const includeLifecycle = new Set(options.includeLifecycle ?? []);
  const results: RegistryCapabilitySearchResult[] = [];
  const excludedByLifecycle: RegistryCapabilitySearchResult[] = [];

  for (const valid of validation.valid) {
    const result = registrySearchResult(valid);
    if (!matchesRegistrySearchQuery(result, options.query)) {
      continue;
    }
    if ((result.lifecycle === "yanked" || result.lifecycle === "revoked") && !includeLifecycle.has(result.lifecycle)) {
      excludedByLifecycle.push(result);
      continue;
    }
    results.push(result);
  }

  return {
    targetPath,
    query: options.query,
    results: results.sort((left, right) => left.id.localeCompare(right.id)),
    excludedByLifecycle: excludedByLifecycle.sort((left, right) => left.id.localeCompare(right.id)),
    invalid: validation.invalid,
  };
}

function issuesFromMetadataFindings(filePath: string, findings: ModelVisibleMetadataFinding[]): ManifestValidationIssue[] {
  return findings.map((finding) => ({
    filePath,
    fieldPath: finding.path,
    message: finding.message,
    keyword: `model-visible-metadata-lint:${finding.rule}`,
  }));
}

function issuesFromLeastPrivilegeAuthFindings(filePath: string, findings: LeastPrivilegeAuthFinding[]): ManifestValidationIssue[] {
  return findings.map((finding) => ({
    filePath,
    fieldPath: finding.path,
    message: finding.message,
    keyword: `least-privilege-auth-lint:${finding.rule}`,
  }));
}

export async function validateCapabilityAuthoringManifest(
  manifest: unknown,
  filePath = "<memory>",
): Promise<ManifestValidationResult> {
  const schemaResult = await validateManifest(manifest, filePath);

  if (!schemaResult.ok) {
    return schemaResult;
  }

  const metadataFindings = lintModelVisibleMetadata(schemaResult.manifest);

  if (metadataFindings.length > 0) {
    return {
      ok: false,
      filePath,
      issues: issuesFromMetadataFindings(filePath, metadataFindings),
    };
  }

  const leastPrivilegeFindings = lintLeastPrivilegeAuth(schemaResult.manifest);

  if (leastPrivilegeFindings.length > 0) {
    return {
      ok: false,
      filePath,
      issues: issuesFromLeastPrivilegeAuthFindings(filePath, leastPrivilegeFindings),
    };
  }

  return schemaResult;
}

export async function validateCapabilityAuthoringManifestFile(filePath: string): Promise<ManifestValidationResult> {
  try {
    const manifest = await loadManifest(filePath);
    return validateCapabilityAuthoringManifest(manifest, filePath);
  } catch (error) {
    return {
      ok: false,
      filePath,
      issues: [
        {
          filePath,
          fieldPath: "/",
          message: error instanceof Error ? error.message : "failed to read manifest",
          keyword: "parse",
        },
      ],
    };
  }
}

export async function validateCapabilityAuthoringManifestPath(targetPath: string): Promise<ManifestPathValidationResult> {
  const manifests = await findManifestFiles(targetPath);
  const results = await Promise.all(manifests.map((manifestPath) => validateCapabilityAuthoringManifestFile(manifestPath)));

  return {
    targetPath,
    manifests,
    valid: results.filter((result): result is ManifestValidationSuccess => result.ok),
    invalid: results.filter((result): result is ManifestValidationFailure => !result.ok),
  };
}


export interface RegistryTestValidationIssue extends ManifestValidationIssue {}

export interface RegistryTestValidationSuccess {
  ok: true;
  filePath: string;
  testCase: unknown;
}

export interface RegistryTestValidationFailure {
  ok: false;
  filePath: string;
  issues: RegistryTestValidationIssue[];
}

export type RegistryTestValidationResult = RegistryTestValidationSuccess | RegistryTestValidationFailure;

export interface RegistryTestPathValidationResult {
  targetPath: string;
  testCases: string[];
  valid: RegistryTestValidationSuccess[];
  invalid: RegistryTestValidationFailure[];
}

export type CapabilityAdvisoryType =
  | "malicious"
  | "overbroad_permissions"
  | "credential_leak"
  | "unsafe_execution"
  | "misleading_metadata"
  | "provider_changed"
  | "maintainer_compromise";

export type CapabilityAdvisorySeverity = "low" | "medium" | "high" | "critical";
export type CapabilityAdvisoryStatus = "reported" | "triaged" | "investigating" | "fixed" | "mitigated" | "revoked" | "not_affected" | "published";
export type CapabilityAdvisoryRegistryAction = "none" | "freeze" | "yank" | "revoke";
export type CapabilityAdvisoryRuntimeDefault = "warn" | "ask" | "deny";

export interface CapabilityAdvisory {
  schema_version: "opencap.capability_advisory.v1";
  id: string;
  capability: string;
  affected_versions: string[];
  type: CapabilityAdvisoryType;
  severity: CapabilityAdvisorySeverity;
  status: CapabilityAdvisoryStatus;
  summary: string;
  published_at: string | null;
  modified_at: string;
  actions: {
    registry: CapabilityAdvisoryRegistryAction;
    runtime_default: CapabilityAdvisoryRuntimeDefault;
    fixed_version: string | null;
  };
  references?: string[];
}

export interface CapabilityAdvisoryValidationIssue extends ManifestValidationIssue {}

export interface CapabilityAdvisoryValidationSuccess {
  ok: true;
  filePath: string;
  advisory: CapabilityAdvisory;
}

export interface CapabilityAdvisoryValidationFailure {
  ok: false;
  filePath: string;
  issues: CapabilityAdvisoryValidationIssue[];
}

export type CapabilityAdvisoryValidationResult = CapabilityAdvisoryValidationSuccess | CapabilityAdvisoryValidationFailure;

export interface CapabilityAdvisoryPathValidationResult {
  targetPath: string;
  advisories: string[];
  valid: CapabilityAdvisoryValidationSuccess[];
  invalid: CapabilityAdvisoryValidationFailure[];
}

function isRegistryTestFileName(fileName: string): boolean {
  return ["basic.yml", "basic.yaml", "basic.json"].includes(basename(fileName));
}

async function findRegistryTestsInDirectory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findRegistryTestsInDirectory(path)));
    } else if (entry.isFile() && isRegistryTestFileName(entry.name) && dir.endsWith("tests")) {
      files.push(path);
    }
  }

  return files.sort();
}

export async function findRegistryTestFiles(targetPath: string): Promise<string[]> {
  const info = await stat(targetPath);

  if (info.isFile()) {
    return isRegistryTestFileName(targetPath) ? [targetPath] : [];
  }

  if (info.isDirectory()) {
    return findRegistryTestsInDirectory(targetPath);
  }

  return [];
}

export async function loadRegistryTestCase(filePath: string): Promise<unknown> {
  return loadManifest(filePath);
}

export async function validateRegistryTestCase(testCase: unknown, filePath = "<memory>"): Promise<RegistryTestValidationResult> {
  const validator = await getRegistryTestValidator();
  const valid = validator(testCase);

  if (valid) {
    return {
      ok: true,
      filePath,
      testCase,
    };
  }

  return {
    ok: false,
    filePath,
    issues: issuesFromAjvErrors(filePath, validator.errors),
  };
}

export async function validateRegistryTestFile(filePath: string): Promise<RegistryTestValidationResult> {
  try {
    const testCase = await loadRegistryTestCase(filePath);
    return validateRegistryTestCase(testCase, filePath);
  } catch (error) {
    return {
      ok: false,
      filePath,
      issues: [
        {
          filePath,
          fieldPath: "/",
          message: error instanceof Error ? error.message : "failed to read registry test",
          keyword: "parse",
        },
      ],
    };
  }
}

export async function validateRegistryTestPath(targetPath: string): Promise<RegistryTestPathValidationResult> {
  const testCases = await findRegistryTestFiles(targetPath);
  const results = await Promise.all(testCases.map((testPath) => validateRegistryTestFile(testPath)));

  return {
    targetPath,
    testCases,
    valid: results.filter((result): result is RegistryTestValidationSuccess => result.ok),
    invalid: results.filter((result): result is RegistryTestValidationFailure => !result.ok),
  };
}

function isCapabilityAdvisoryFileName(fileName: string): boolean {
  return ["advisory.yml", "advisory.yaml", "advisory.json"].includes(basename(fileName)) || /^OCAP-[0-9]{4}-[0-9]{4}\.(ya?ml|json)$/.test(fileName);
}

async function findCapabilityAdvisoriesInDirectory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findCapabilityAdvisoriesInDirectory(path)));
    } else if (entry.isFile() && isCapabilityAdvisoryFileName(entry.name)) {
      files.push(path);
    }
  }

  return files.sort();
}

export async function findCapabilityAdvisoryFiles(targetPath: string): Promise<string[]> {
  const info = await stat(targetPath);

  if (info.isFile()) {
    return isCapabilityAdvisoryFileName(targetPath) ? [targetPath] : [];
  }

  if (info.isDirectory()) {
    return findCapabilityAdvisoriesInDirectory(targetPath);
  }

  return [];
}

export async function loadCapabilityAdvisory(filePath: string): Promise<unknown> {
  return loadManifest(filePath);
}

export async function validateCapabilityAdvisory(advisory: unknown, filePath = "<memory>"): Promise<CapabilityAdvisoryValidationResult> {
  const validator = await getCapabilityAdvisoryValidator();
  const valid = validator(advisory);

  if (valid) {
    return {
      ok: true,
      filePath,
      advisory: advisory as CapabilityAdvisory,
    };
  }

  return {
    ok: false,
    filePath,
    issues: issuesFromAjvErrors(filePath, validator.errors),
  };
}

export async function validateCapabilityAdvisoryFile(filePath: string): Promise<CapabilityAdvisoryValidationResult> {
  try {
    const advisory = await loadCapabilityAdvisory(filePath);
    return validateCapabilityAdvisory(advisory, filePath);
  } catch (error) {
    return {
      ok: false,
      filePath,
      issues: [
        {
          filePath,
          fieldPath: "/",
          message: error instanceof Error ? error.message : "failed to read capability advisory",
          keyword: "parse",
        },
      ],
    };
  }
}

export async function validateCapabilityAdvisoryPath(targetPath: string): Promise<CapabilityAdvisoryPathValidationResult> {
  const advisories = await findCapabilityAdvisoryFiles(targetPath);
  const results = await Promise.all(advisories.map((advisoryPath) => validateCapabilityAdvisoryFile(advisoryPath)));

  return {
    targetPath,
    advisories,
    valid: results.filter((result): result is CapabilityAdvisoryValidationSuccess => result.ok),
    invalid: results.filter((result): result is CapabilityAdvisoryValidationFailure => !result.ok),
  };
}

const REGISTRY_QUALITY_DIMENSION_WEIGHTS: RegistryQualityScoreDimensions = {
  manifest: 15,
  docs: 15,
  tests: 20,
  security: 20,
  maintenance: 10,
  compatibility: 10,
  evidence: 10,
};

function registryQualityBand(total: number): RegistryQualityScoreBand {
  if (total >= 90) {
    return "verified";
  }
  if (total >= 75) {
    return "tested";
  }
  if (total >= 60) {
    return "listed";
  }
  if (total >= 40) {
    return "experimental";
  }
  return "incomplete";
}

function clampRegistryQualityDimension(score: number, max: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(score), 0), max);
}

function calculateRegistryQualityScore(dimensions: RegistryQualityScoreDimensions, generatedAt: string): RegistryQualityScore {
  const clamped: RegistryQualityScoreDimensions = {
    manifest: clampRegistryQualityDimension(dimensions.manifest, REGISTRY_QUALITY_DIMENSION_WEIGHTS.manifest),
    docs: clampRegistryQualityDimension(dimensions.docs, REGISTRY_QUALITY_DIMENSION_WEIGHTS.docs),
    tests: clampRegistryQualityDimension(dimensions.tests, REGISTRY_QUALITY_DIMENSION_WEIGHTS.tests),
    security: clampRegistryQualityDimension(dimensions.security, REGISTRY_QUALITY_DIMENSION_WEIGHTS.security),
    maintenance: clampRegistryQualityDimension(dimensions.maintenance, REGISTRY_QUALITY_DIMENSION_WEIGHTS.maintenance),
    compatibility: clampRegistryQualityDimension(dimensions.compatibility, REGISTRY_QUALITY_DIMENSION_WEIGHTS.compatibility),
    evidence: clampRegistryQualityDimension(dimensions.evidence, REGISTRY_QUALITY_DIMENSION_WEIGHTS.evidence),
  };
  const total = Object.values(clamped).reduce((sum, score) => sum + score, 0);

  return {
    rubricVersion: REGISTRY_QUALITY_SCORE_RUBRIC_VERSION,
    total,
    band: registryQualityBand(total),
    dimensions: clamped,
    generatedAt,
    policyEffect: "none",
  };
}

function issueSummaries(issues: Array<ManifestValidationIssue | CapabilityPackageValidationIssue>): string[] {
  return issues.map((issue) => `${issue.keyword ?? "issue"} ${issue.fieldPath}: ${issue.message}`);
}

function stringMetadata(manifest: CapabilityManifest, field: string): string | undefined {
  const value = manifest.metadata[field];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function booleanMetadata(manifest: CapabilityManifest, field: string): boolean {
  return manifest.metadata[field] === true;
}

function advisorySummaryForCapability(advisories: CapabilityAdvisory[], capabilityId: string): RegistryQualityAdvisorySummary {
  const matching = advisories.filter((advisory) => advisory.capability === capabilityId);
  const mostSevere = matching.find((advisory) => advisory.status === "revoked") ?? matching[0];

  return {
    status: mostSevere?.status ?? "none",
    open: matching.length,
    ids: matching.map((advisory) => advisory.id).sort(),
    runtimeDefault: mostSevere?.actions.runtime_default,
  };
}

function blockingReasonsForCapability(
  manifest: CapabilityManifest,
  lifecycle: RegistryQualityLifecycleSummary,
  advisory: RegistryQualityAdvisorySummary,
): string[] {
  const reasons: string[] = [];

  if (lifecycle.status === "revoked" || lifecycle.status === "yanked") {
    reasons.push(`lifecycle:${lifecycle.status}`);
  }
  if (advisory.status === "revoked" || advisory.runtimeDefault === "deny") {
    for (const advisoryId of advisory.ids) {
      reasons.push(`advisory:${advisoryId}:${advisory.status}`);
    }
  }
  if (booleanMetadata(manifest, "unsafe_by_default")) {
    reasons.push("metadata:unsafe_by_default");
  }

  return [...new Set(reasons)].sort();
}

function defaultInstallTrustedFromEvidence(
  checks: {
    manifestValidation: RegistryQualityCheckSummary;
    packageLint: RegistryQualityCheckSummary;
    registryTests: RegistryQualityRegistryTestSummary;
    authLeastPrivilege: RegistryQualityCheckSummary;
  },
  blockingReasons: string[],
): boolean {
  return checks.manifestValidation.status === "pass"
    && checks.packageLint.status === "pass"
    && checks.registryTests.status === "pass"
    && checks.registryTests.count > 0
    && checks.authLeastPrivilege.status === "pass"
    && blockingReasons.length === 0;
}

function qualityDimensions(input: {
  manifestValidation: RegistryQualityCheckSummary;
  packageLint: RegistryQualityCheckSummary;
  registryTests: RegistryQualityRegistryTestSummary;
  authLeastPrivilege: RegistryQualityCheckSummary;
  advisory: RegistryQualityAdvisorySummary;
  manifest: CapabilityManifest;
}): RegistryQualityScoreDimensions {
  const hasDocs = input.packageLint.status === "pass";
  const hasMaintainer = stringMetadata(input.manifest, "maintainer") !== undefined;
  const hasLicense = stringMetadata(input.manifest, "license") !== undefined;
  const securityPasses = input.authLeastPrivilege.status === "pass" && input.advisory.status !== "revoked" && input.advisory.runtimeDefault !== "deny";

  return {
    manifest: input.manifestValidation.status === "pass" ? 15 : 0,
    docs: hasDocs ? 15 : 0,
    tests: input.registryTests.status === "pass" && input.registryTests.count > 0 ? 20 : 0,
    security: securityPasses ? 20 : 0,
    maintenance: hasMaintainer && hasLicense ? 10 : hasMaintainer || hasLicense ? 5 : 0,
    compatibility: 0,
    evidence: input.manifestValidation.status === "pass" && input.packageLint.status === "pass" && input.registryTests.status === "pass" ? 10 : 0,
  };
}

export async function buildRegistryQualitySummary(
  registryRoot: string,
  options: BuildRegistryQualitySummaryOptions = {},
): Promise<RegistryQualitySummary> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const manifestValidation = await validateManifestPath(registryRoot);
  const advisoryValidation = await validateCapabilityAdvisoryPath(registryRoot);
  const validAdvisories = advisoryValidation.valid.map((result) => result.advisory);
  const capabilities = await Promise.all(manifestValidation.valid.map(async (valid): Promise<RegistryCapabilityQualitySummary> => {
    const manifest = valid.manifest;
    const packageDir = dirname(valid.filePath);
    const category = stringMetadata(manifest, "category") ?? basename(dirname(packageDir));
    const authoring = await validateCapabilityAuthoringManifestFile(valid.filePath);
    const packageLint = await validateCapabilityPackage(packageDir);
    const registryTests = await validateRegistryTestPath(packageDir);
    const authFindings = lintLeastPrivilegeAuth(manifest);
    const manifestValidationSummary: RegistryQualityCheckSummary = {
      status: authoring.ok ? "pass" : "fail",
      issues: authoring.ok ? [] : issueSummaries(authoring.issues),
    };
    const packageLintSummary: RegistryQualityCheckSummary = {
      status: packageLint.ok ? "pass" : "fail",
      issues: packageLint.ok ? [] : issueSummaries(packageLint.issues),
    };
    const registryTestsSummary: RegistryQualityRegistryTestSummary = {
      status: registryTests.invalid.length === 0 && registryTests.valid.length > 0 ? "pass" : "fail",
      count: registryTests.valid.length,
      issues: registryTests.invalid.flatMap((invalid) => issueSummaries(invalid.issues)),
    };
    const authLeastPrivilegeSummary: RegistryQualityCheckSummary = {
      status: authFindings.length === 0 ? "pass" : "fail",
      issues: authFindings.map((finding) => `least-privilege-auth-lint:${finding.rule} ${finding.path}: ${finding.message}`),
    };
    const lifecycle: RegistryQualityLifecycleSummary = {
      status: manifest.lifecycle?.status ?? "active",
      advisory: manifest.lifecycle?.advisory,
    };
    const advisory = advisorySummaryForCapability(validAdvisories, manifest.id);
    const blockingReasons = blockingReasonsForCapability(manifest, lifecycle, advisory);
    const qualityScore = calculateRegistryQualityScore(qualityDimensions({
      manifestValidation: manifestValidationSummary,
      packageLint: packageLintSummary,
      registryTests: registryTestsSummary,
      authLeastPrivilege: authLeastPrivilegeSummary,
      advisory,
      manifest,
    }), generatedAt);

    return {
      id: manifest.id,
      category,
      version: manifest.version,
      manifestPath: valid.filePath,
      packageDir,
      manifestValidation: manifestValidationSummary,
      packageLint: packageLintSummary,
      registryTests: registryTestsSummary,
      authLeastPrivilege: authLeastPrivilegeSummary,
      lifecycle,
      advisory,
      qualityScore,
      defaultInstallTrusted: defaultInstallTrustedFromEvidence({
        manifestValidation: manifestValidationSummary,
        packageLint: packageLintSummary,
        registryTests: registryTestsSummary,
        authLeastPrivilege: authLeastPrivilegeSummary,
      }, blockingReasons),
      blockingReasons,
      policyEffect: "none",
    };
  }));

  return {
    schemaVersion: REGISTRY_QUALITY_SUMMARY_SCHEMA_VERSION,
    registryRoot,
    generatedAt,
    capabilities: capabilities.sort((left, right) => left.id.localeCompare(right.id)),
    invalidManifests: manifestValidation.invalid,
    invalidAdvisories: advisoryValidation.invalid,
    policyEffect: "none",
  };
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stableJsonValue(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableJsonValue(entryValue)]),
    );
  }

  return value;
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value));
}

function sha256Digest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function stableJsonDigest(value: unknown): string {
  return sha256Digest(stableJsonStringify(value));
}

function registryIndexManifestPath(registryRoot: string, manifestPath: string): string {
  const relativePath = relative(registryRoot, manifestPath).split(/[/\\]+/).join("/");

  if (relativePath.length === 0 || relativePath === ".." || relativePath.startsWith("../") || isAbsolute(relativePath)) {
    throw new Error(`Manifest path is outside the registry root: ${manifestPath}`);
  }

  return relativePath;
}

function registryIndexRegistryMetadata(options?: BuildRegistryIndexOptions["registry"]): RegistryIndexRegistryMetadata {
  const metadata: RegistryIndexRegistryMetadata = {
    source: options?.source ?? "local",
  };

  if (options?.repository !== undefined) {
    metadata.repository = options.repository;
  }
  if (options?.commit !== undefined) {
    metadata.commit = options.commit;
  }

  return metadata;
}

function registryIndexGeneratorMetadata(options?: BuildRegistryIndexOptions["generator"]): RegistryIndexGeneratorMetadata {
  const metadata: RegistryIndexGeneratorMetadata = {
    name: options?.name ?? "opencap-spec",
    version: options?.version ?? "0.1.0",
  };

  if (options?.commit !== undefined) {
    metadata.commit = options.commit;
  }

  return metadata;
}

export async function buildRegistryIndex(
  registryRoot: string,
  options: BuildRegistryIndexOptions = {},
): Promise<RegistryIndex> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const [manifestValidation, qualitySummary] = await Promise.all([
    validateManifestPath(registryRoot),
    buildRegistryQualitySummary(registryRoot, { generatedAt }),
  ]);
  const qualityByCapabilityId = new Map(qualitySummary.capabilities.map((capability) => [capability.id, capability]));
  const capabilities: RegistryIndexCapability[] = manifestValidation.valid.map((valid): RegistryIndexCapability => {
    const manifest = valid.manifest;
    const quality = qualityByCapabilityId.get(manifest.id);
    const packageDir = dirname(valid.filePath);
    const category = quality?.category ?? stringMetadata(manifest, "category") ?? basename(dirname(packageDir));

    return {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      category,
      path: registryIndexManifestPath(registryRoot, valid.filePath),
      manifestDigest: stableJsonDigest(manifest),
      lifecycle: quality?.lifecycle.status ?? manifest.lifecycle?.status ?? "active",
      trustLevel: stringMetadata(manifest, "trust_level") ?? "unverified",
      quality: {
        rubricVersion: REGISTRY_QUALITY_SCORE_RUBRIC_VERSION,
        total: quality?.qualityScore.total ?? 0,
        band: quality?.qualityScore.band ?? "incomplete",
        policyEffect: "none",
      },
      advisoryRefs: quality?.advisory.ids ?? [],
      defaultInstallTrusted: quality?.defaultInstallTrusted ?? false,
      blockingReasons: quality?.blockingReasons ?? [],
      policyEffect: "none",
    };
  }).sort((left, right) => left.id.localeCompare(right.id));

  const indexWithoutDigest = {
    schemaVersion: REGISTRY_INDEX_SCHEMA_VERSION,
    profile: REGISTRY_INDEX_PROFILE,
    generatedAt,
    registry: registryIndexRegistryMetadata(options.registry),
    generator: registryIndexGeneratorMetadata(options.generator),
    capabilityCount: capabilities.length,
    invalidManifestCount: manifestValidation.invalid.length,
    capabilities,
    signatureStatus: "none" as const,
    policyEffect: "none" as const,
  };

  return {
    ...indexWithoutDigest,
    indexDigest: stableJsonDigest(indexWithoutDigest),
  };
}

const SHA256_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const REGISTRY_INDEX_BANDS = new Set<RegistryQualityScoreBand>([
  "incomplete",
  "experimental",
  "listed",
  "tested",
  "verified",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function registryIndexArtifactString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function registryIndexArtifactNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function registryIndexArtifactPolicyEffect(value: unknown): value is "none" {
  return value === "none";
}

function registryIndexArtifactDate(value: unknown): boolean {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function registryIndexArtifactRelativePath(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  return !value.startsWith("/")
    && !value.startsWith("\\")
    && !value.split(/[/\\]+/).includes("..")
    && !/^[A-Za-z]:[\\/]/.test(value);
}

function pushRegistryIndexFinding(
  findings: RegistryIndexArtifactFinding[],
  code: RegistryIndexArtifactFindingCode,
  path: string,
  message: string,
): void {
  findings.push({
    code,
    severity: "blocker",
    path,
    message,
  });
}

function validateRegistryIndexQuality(
  value: unknown,
  path: string,
  findings: RegistryIndexArtifactFinding[],
): void {
  if (!isRecord(value)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_QUALITY_INVALID", path, "Capability quality summary must be an object.");
    return;
  }

  if (value.rubricVersion !== REGISTRY_QUALITY_SCORE_RUBRIC_VERSION) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_QUALITY_INVALID", `${path}.rubricVersion`, "Capability quality rubric version is invalid.");
  }
  const total = registryIndexArtifactNumber(value.total);
  if (total === undefined || total < 0 || total > 100) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_QUALITY_INVALID", `${path}.total`, "Capability quality total must be between 0 and 100.");
  }
  if (typeof value.band !== "string" || !REGISTRY_INDEX_BANDS.has(value.band as RegistryQualityScoreBand)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_QUALITY_INVALID", `${path}.band`, "Capability quality band is invalid.");
  }
  if (!registryIndexArtifactPolicyEffect(value.policyEffect)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_QUALITY_INVALID", `${path}.policyEffect`, "Capability quality policyEffect must be none.");
  }
}

function validateRegistryIndexCapability(
  value: unknown,
  path: string,
  findings: RegistryIndexArtifactFinding[],
): void {
  if (!isRecord(value)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_INVALID", path, "Capability index entry must be an object.");
    return;
  }

  for (const field of ["id", "name", "version", "category", "lifecycle", "trustLevel"] as const) {
    if (registryIndexArtifactString(value[field]) === undefined) {
      pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_INVALID", `${path}.${field}`, `Capability ${field} must be a string.`);
    }
  }
  if (!registryIndexArtifactRelativePath(value.path)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_PATH_UNSAFE", `${path}.path`, "Capability manifest path must be relative and stay within the Registry checkout.");
  }
  if (typeof value.manifestDigest !== "string" || !SHA256_DIGEST_PATTERN.test(value.manifestDigest)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_DIGEST_INVALID", `${path}.manifestDigest`, "Capability manifestDigest must use sha256:<64 lowercase hex>.");
  }
  validateRegistryIndexQuality(value.quality, `${path}.quality`, findings);
  if (!Array.isArray(value.advisoryRefs) || !value.advisoryRefs.every((entry) => typeof entry === "string")) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_INVALID", `${path}.advisoryRefs`, "Capability advisoryRefs must be an array of strings.");
  }
  if (typeof value.defaultInstallTrusted !== "boolean") {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_INVALID", `${path}.defaultInstallTrusted`, "Capability defaultInstallTrusted must be a boolean.");
  }
  if (!Array.isArray(value.blockingReasons) || !value.blockingReasons.every((entry) => typeof entry === "string")) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_INVALID", `${path}.blockingReasons`, "Capability blockingReasons must be an array of strings.");
  }
  if (!registryIndexArtifactPolicyEffect(value.policyEffect)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_POLICY_EFFECT_INVALID", `${path}.policyEffect`, "Capability policyEffect must be none.");
  }
}

function walkRegistryIndexArtifact(value: unknown, path: string, findings: RegistryIndexArtifactFinding[]): void {
  if (typeof value === "string") {
    if (
      /\b[A-Z0-9_]*(TOKEN|SECRET|PASSWORD|API_KEY)[A-Z0-9_]*\b/.test(value)
      || /Authorization|Cookie/i.test(value)
      || /provider raw response/i.test(value)
      || /https:\/\/api\./i.test(value)
      || /opencap\.local/i.test(value)
      || /\/Users\//.test(value)
      || /\.(sqlite|sqlite3|db|log)\b/i.test(value)
    ) {
      pushRegistryIndexFinding(findings, "REGISTRY_INDEX_SENSITIVE_TEXT", path, "Artifact contains disallowed sensitive or raw runtime text.");
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkRegistryIndexArtifact(entry, `${path}[${index}]`, findings));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    const entryPath = path === "$" ? `$.${key}` : `${path}.${key}`;
    if (["auth", "env", "input", "output", "execution", "providerRawResponse", "rawResponse"].includes(key)) {
      pushRegistryIndexFinding(findings, "REGISTRY_INDEX_SENSITIVE_TEXT", entryPath, "Artifact contains a disallowed raw manifest, auth, input/output, execution, or provider field.");
    }
    walkRegistryIndexArtifact(entry, entryPath, findings);
  }
}

export function validateRegistryIndexArtifact(artifact: unknown): RegistryIndexArtifactValidationReport {
  const findings: RegistryIndexArtifactFinding[] = [];

  if (!isRecord(artifact)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_ARTIFACT_NOT_OBJECT", "$", "Registry index artifact must be a JSON object.");
    return {
      schemaVersion: REGISTRY_INDEX_VALIDATION_SCHEMA_VERSION,
      valid: false,
      findingCount: findings.length,
      findings,
      policyEffect: "none",
    };
  }

  const artifactSchemaVersion = registryIndexArtifactString(artifact.schemaVersion);
  const profile = registryIndexArtifactString(artifact.profile);
  const indexDigest = registryIndexArtifactString(artifact.indexDigest);

  if (artifactSchemaVersion !== REGISTRY_INDEX_SCHEMA_VERSION) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_SCHEMA_VERSION_INVALID", "$.schemaVersion", "Registry index schemaVersion is invalid.");
  }
  if (profile !== REGISTRY_INDEX_PROFILE) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_PROFILE_INVALID", "$.profile", "Registry index profile is invalid.");
  }
  if (!registryIndexArtifactDate(artifact.generatedAt)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_GENERATED_AT_INVALID", "$.generatedAt", "Registry index generatedAt must be an ISO-like timestamp.");
  }

  const capabilityCount = registryIndexArtifactNumber(artifact.capabilityCount);
  if (capabilityCount === undefined || !Number.isInteger(capabilityCount) || capabilityCount < 0) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_COUNT_INVALID", "$.capabilityCount", "Registry index capabilityCount must be a non-negative integer.");
  }
  const invalidManifestCount = registryIndexArtifactNumber(artifact.invalidManifestCount);
  if (invalidManifestCount === undefined || !Number.isInteger(invalidManifestCount) || invalidManifestCount < 0) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_INVALID_MANIFEST_COUNT_INVALID", "$.invalidManifestCount", "Registry index invalidManifestCount must be a non-negative integer.");
  }

  const capabilities = Array.isArray(artifact.capabilities) ? artifact.capabilities : undefined;
  if (!capabilities) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_INVALID", "$.capabilities", "Registry index capabilities must be an array.");
  } else {
    if (capabilityCount !== undefined && capabilityCount !== capabilities.length) {
      pushRegistryIndexFinding(findings, "REGISTRY_INDEX_CAPABILITY_COUNT_MISMATCH", "$.capabilityCount", "Registry index capabilityCount must equal capabilities length.");
    }
    capabilities.forEach((capability, index) => validateRegistryIndexCapability(capability, `$.capabilities[${index}]`, findings));
  }

  if (artifact.signatureStatus !== "none") {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_SIGNATURE_STATUS_INVALID", "$.signatureStatus", "Registry index signatureStatus must be none.");
  }
  if (!registryIndexArtifactPolicyEffect(artifact.policyEffect)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_POLICY_EFFECT_INVALID", "$.policyEffect", "Registry index policyEffect must be none.");
  }
  if (indexDigest === undefined || !SHA256_DIGEST_PATTERN.test(indexDigest)) {
    pushRegistryIndexFinding(findings, "REGISTRY_INDEX_DIGEST_INVALID", "$.indexDigest", "Registry indexDigest must use sha256:<64 lowercase hex>.");
  } else {
    const { indexDigest: _indexDigest, ...withoutDigest } = artifact;
    if (stableJsonDigest(withoutDigest) !== indexDigest) {
      pushRegistryIndexFinding(findings, "REGISTRY_INDEX_DIGEST_MISMATCH", "$.indexDigest", "Registry indexDigest does not match artifact content.");
    }
  }

  walkRegistryIndexArtifact(artifact, "$", findings);

  return {
    schemaVersion: REGISTRY_INDEX_VALIDATION_SCHEMA_VERSION,
    valid: findings.length === 0,
    artifactSchemaVersion,
    profile,
    indexDigest,
    findingCount: findings.length,
    findings,
    policyEffect: "none",
  };
}

export function formatManifestValidationIssue(issue: ManifestValidationIssue): string {
  return `${issue.fieldPath} ${issue.message}`;
}
