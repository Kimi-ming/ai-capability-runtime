export { lintModelVisibleMetadata } from "./metadata-lint.js";
export type { ModelVisibleMetadataFinding, ModelVisibleMetadataLintRule, ModelVisibleMetadataLintSeverity } from "./metadata-lint.js";
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
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
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

export type RegistryQualitySummarySchemaVersion = typeof REGISTRY_QUALITY_SUMMARY_SCHEMA_VERSION;
export type RegistryQualityEvidenceStatus = "pass" | "fail";
export type RegistryQualityAdvisoryStatus = "none" | CapabilityAdvisoryStatus;
export type RegistryQualityScoreBand = "incomplete" | "experimental" | "listed" | "tested" | "verified";

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

export function formatManifestValidationIssue(issue: ManifestValidationIssue): string {
  return `${issue.fieldPath} ${issue.message}`;
}
