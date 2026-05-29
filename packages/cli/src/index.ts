#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { Command } from "commander";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import {
  buildConformanceSummary,
  buildNpmPackageReadinessReportFromFile,
  buildCapabilityScaffold,
  buildRegistryQualitySummary,
  buildReleaseEvidenceBundle,
  formatManifestValidationIssue,
  searchRegistryCapabilities,
  validateReleaseEvidenceArtifact,
  validateCapabilityAdvisoryPath,
  validateManifestPath,
  type CapabilityAdvisory,
  type CapabilityScaffoldAuth,
  type CapabilityScaffoldFile,
  type CapabilityScaffoldHttpMethod,
  type CapabilityManifest,
  type CapabilityManifestLifecycleStatus,
  type ManifestValidationFailure,
  type NpmPackagePackFile,
  type NpmPackageReadinessReport,
  type RegistryCapabilitySearchResult,
  type ReleaseEvidenceBundle,
} from "@opencap/spec";
import { serveOpenCapMcpStdio } from "@opencap/mcp";
import {
  InstallCapabilityError,
  FileRuntimeLedgerStore,
  SqliteAuditLogger,
  RuntimeLedgerAuditLogger,
  buildLocalMetricsSummary,
  type AuditEvent,
  type AuditInvocationStatus,
  CliConfirmationHandler,
  blockedResultEnvelope,
  buildHttpDryRunPlan,
  createCapabilityCard,
  createTrustCardFromInstalledCapability,
  createCapabilityLedgerIdentity,
  createCapabilityIdentity,
  createCapabilityLifecycleWarning,
  createConfirmationAuditEvent,
  createConsentReceiptAuditEvidence,
  checkInstalledCapabilityAdvisories,
  evaluatePolicy,
  executeHttpCapability,
  exportDecisionLogRecords,
  getLocalStatePaths,
  hashInput,
  installCapability,
  listInstalledCapabilities,
  loadInstalledCapabilities,
  loadPolicySet,
  redactInput,
  resolveRegistryDir,
  resultEnvelopeFromDryRunPlan,
  resultEnvelopeFromHttpExecutionResult,
  stableJsonStringify,
  simulatePolicyDiff,
  validatePolicyYml,
  type CapabilityLifecycleWarning,
  type CapabilityLifecycleState,
  type InstalledCapability,
  type InstalledCapabilityAdvisoryCheckResult,
  type InstalledCapabilityAdvisoryMatch,
  type InstalledCapabilityRecord,
  type LedgerRecordKind,
  type LedgerRecordV1,
  type LocalMetricsSummary,
  type TrustSummary,
  type PolicyDecision,
  type PolicySimulationScenario,
  type RiskSummary,
  type ResultEnvelopeV1,
} from "@opencap/runtime";

const program = new Command();
const cliModuleDir = dirname(fileURLToPath(import.meta.url));

type CliExitCode = 1 | 2;

interface LocalMetricsCapabilityRow {
  capabilityId: string;
  invocationsTotal: number;
  statusCounts: LocalMetricsSummary["statusCounts"];
  policyDecisionCounts: LocalMetricsSummary["policyDecisionCounts"];
  errorRate: number;
  durationMs: LocalMetricsSummary["durationMs"];
  lastSeenAt: string;
}

interface LocalMetricsCapabilitiesReport {
  schemaVersion: "opencap.local_metrics_capabilities.v1";
  capabilities: LocalMetricsCapabilityRow[];
  policyEffect: "none";
}

interface LocalMetricsSecurityReport {
  schemaVersion: "opencap.local_metrics_security.v1";
  deniedTotal: number;
  confirmationRequiredTotal: number;
  outboundBlockedTotal: number;
  dataEgressDeniedTotal: number;
  secretMissingTotal: number;
  auditPreflightFailedTotal: number;
  policyEffect: "none";
}

const RELEASE_PACKAGE_PATHS = new Map([
  ["@opencap/spec", "packages/spec/package.json"],
  ["@opencap/cli", "packages/cli/package.json"],
]);

interface NodeError extends Error {
  code?: string;
}

class CliUserInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUserInputError";
  }
}

const USER_ERROR_CODES = new Set(["ENOENT", "ENOTDIR", "EACCES", "EPERM"]);

function setCliError(message: string, exitCode: CliExitCode): void {
  console.error(message);
  process.exitCode = exitCode;
}

function isNodeError(error: unknown): error is NodeError {
  return error instanceof Error;
}

function handleCliError(error: unknown, fallbackMessage: string): void {
  if (error instanceof InstallCapabilityError) {
    setCliError(error.message, 1);
    return;
  }

  if (error instanceof CliUserInputError) {
    setCliError(error.message, 1);
    return;
  }

  if (isNodeError(error) && error.code && USER_ERROR_CODES.has(error.code)) {
    setCliError(error.message, 1);
    return;
  }

  setCliError(error instanceof Error ? error.message : fallbackMessage, 2);
}


async function pathStatus(path: string): Promise<"ok" | "missing"> {
  try {
    await stat(path);
    return "ok";
  } catch {
    return "missing";
  }
}

async function writableStatus(path: string): Promise<"ok" | "missing" | "not_writable"> {
  try {
    await access(path, fsConstants.W_OK);
    return "ok";
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return "missing";
    }
    return "not_writable";
  }
}

function pnpmVersion(): string {
  const result = spawnSync("pnpm", ["--version"], { encoding: "utf8" });
  if (result.status !== 0) {
    return "missing";
  }
  return result.stdout.trim() || "unknown";
}

async function packageVersion(relativePackageJsonPath: string): Promise<string> {
  try {
    const parsed = JSON.parse(await readFile(join(cliModuleDir, relativePackageJsonPath), "utf8")) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : "unknown";
  } catch {
    return "unknown";
  }
}

async function workspacePackageVersions(): Promise<Record<string, string>> {
  return {
    cli: await packageVersion("../package.json"),
    spec: await packageVersion("../../spec/package.json"),
    runtime: await packageVersion("../../runtime/package.json"),
    mcp: await packageVersion("../../mcp/package.json"),
    sdkJs: await packageVersion("../../sdk-js/package.json"),
  };
}

function parseLimit(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CliUserInputError(`Invalid --limit value: ${value}`);
  }

  return parsed;
}

const AUDIT_INVOCATION_STATUSES = new Set<AuditInvocationStatus>(["blocked", "denied", "executed", "dry_run"]);

const POLICY_DECISION_VALUES = new Set<PolicyDecision>(["allow", "ask", "deny"]);
const LEDGER_RECORD_KINDS = new Set<LedgerRecordKind>(["capability", "policy", "invocation", "compatibility"]);
const CAPABILITY_SCAFFOLD_METHODS = new Set<CapabilityScaffoldHttpMethod>(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const CAPABILITY_SCAFFOLD_AUTH_MODES = new Set(["none", "api-key-bearer"]);
const REGISTRY_SEARCH_INCLUDE_LIFECYCLES = new Set<CapabilityManifestLifecycleStatus>(["yanked", "revoked"]);
const CAPABILITY_ADVISORY_SEVERITIES = new Set<CapabilityAdvisory["severity"]>(["low", "medium", "high", "critical"]);
const CAPABILITY_ADVISORY_STATUSES = new Set<CapabilityAdvisory["status"]>([
  "reported",
  "triaged",
  "investigating",
  "fixed",
  "mitigated",
  "revoked",
  "not_affected",
  "published",
]);

interface InitCommandOptions {
  category: string;
  output?: string;
  title?: string;
  description?: string;
  method?: string;
  url?: string;
  auth?: string;
  provider?: string;
  env?: string;
  scope?: string[];
}

interface RegistrySearchCommandOptions {
  registry?: string;
  includeLifecycle?: string;
  json?: boolean;
}

interface RegistryAdvisoryListCommandOptions {
  registry: string;
  capability?: string;
  severity?: string;
  status?: string;
  json?: boolean;
}

interface RegistrySearchReportResult {
  id: string;
  name: string;
  description: string;
  version: string;
  lifecycle: CapabilityManifestLifecycleStatus | "active";
  category: string;
  filePath: string;
}

interface RegistrySearchInvalidResult {
  filePath: string;
  issues: string[];
}

interface RegistrySearchReport {
  schemaVersion: "opencap.registry_search.v1";
  registryPath: string;
  query?: string;
  resultCount: number;
  results: RegistrySearchReportResult[];
  excludedByLifecycle: {
    count: number;
    results: RegistrySearchReportResult[];
  };
  invalidCount: number;
  invalid: RegistrySearchInvalidResult[];
  policyEffect: "none";
}

interface RegistryCapabilityDetailAuth {
  type: string;
  provider?: string;
  env?: string;
  placement?: string;
  scopes: string[];
}

interface RegistryCapabilityDetail {
  id: string;
  name: string;
  description: string;
  version: string;
  lifecycle: CapabilityManifestLifecycleStatus | "active";
  category: string;
  maintainer: string;
  license: string;
  trustLevel: string;
  manifestPath: string;
  auth: RegistryCapabilityDetailAuth;
  permissions: CapabilityManifest["permissions"];
  execution: {
    method: string;
    origin: string;
  };
}

interface RegistryCapabilityDetailReport {
  schemaVersion: "opencap.registry_capability_detail.v1";
  registryPath: string;
  capability: RegistryCapabilityDetail;
  policyEffect: "none";
}

interface AdvisoryCheckInvalidAdvisory {
  filePath: string;
  issues: string[];
}

interface AdvisoryCheckFilters {
  capability?: string;
  severity?: CapabilityAdvisory["severity"];
  status?: CapabilityAdvisory["status"];
}

interface AdvisoryCheckReport {
  schemaVersion: "opencap.advisory_check.v1";
  stateDir: string;
  registryPath: string;
  installedCapabilityCount: number;
  checkedCapabilityCount: number;
  checkedInstalledCapabilities: string[];
  filters: AdvisoryCheckFilters;
  matchCount: number;
  filteredMatchCount: number;
  matches: InstalledCapabilityAdvisoryMatch[];
  invalidAdvisoryCount: number;
  invalidAdvisories: AdvisoryCheckInvalidAdvisory[];
  policyEffect: "none";
}

interface RegistryAdvisoryListItem {
  id: string;
  capability: string;
  severity: CapabilityAdvisory["severity"];
  status: CapabilityAdvisory["status"];
  type: CapabilityAdvisory["type"];
  registryAction: CapabilityAdvisory["actions"]["registry"];
  runtimeDefault: CapabilityAdvisory["actions"]["runtime_default"];
  fixedVersion?: string | null;
  modifiedAt: string;
  summary: string;
  filePath: string;
}

interface RegistryAdvisoryListFilters {
  capability?: string;
  severity?: CapabilityAdvisory["severity"];
  status?: CapabilityAdvisory["status"];
}

interface RegistryAdvisoryListReport {
  schemaVersion: "opencap.registry_advisory_list.v1";
  registryPath: string;
  advisoryCount: number;
  filteredAdvisoryCount: number;
  filters: RegistryAdvisoryListFilters;
  advisories: RegistryAdvisoryListItem[];
  invalidAdvisoryCount: number;
  invalidAdvisories: AdvisoryCheckInvalidAdvisory[];
  policyEffect: "none";
}

interface RegistryAdvisoryDetail extends RegistryAdvisoryListItem {
  affectedVersions: string[];
  publishedAt: string | null;
  references: string[];
}

interface RegistryAdvisoryDetailReport {
  schemaVersion: "opencap.registry_advisory_detail.v1";
  registryPath: string;
  advisory: RegistryAdvisoryDetail;
  policyEffect: "none";
}

function parseLedgerKind(value: string | undefined): LedgerRecordKind | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!LEDGER_RECORD_KINDS.has(value as LedgerRecordKind)) {
    throw new CliUserInputError(`Invalid --kind value: ${value}`);
  }

  return value as LedgerRecordKind;
}

function titleFromCapabilityId(id: string): string {
  return id
    .split(/[._]/)
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function providerFromCapabilityId(id: string): string {
  return id.split(".")[0] ?? id;
}

function providerHostnameFragment(provider: string): string {
  return provider.replace(/_/g, "-");
}

function defaultCredentialEnv(provider: string): string {
  const normalized = provider.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return `${normalized}_API_KEY`;
}

function parseInitMethod(value: string | undefined): CapabilityScaffoldHttpMethod {
  const method = (value ?? "GET").toUpperCase();
  if (!CAPABILITY_SCAFFOLD_METHODS.has(method as CapabilityScaffoldHttpMethod)) {
    throw new CliUserInputError(`Invalid --method value: ${value}`);
  }

  return method as CapabilityScaffoldHttpMethod;
}

function parseInitAuth(id: string, options: InitCommandOptions): CapabilityScaffoldAuth {
  const mode = options.auth ?? "none";
  if (!CAPABILITY_SCAFFOLD_AUTH_MODES.has(mode)) {
    throw new CliUserInputError(`Invalid --auth value: ${mode}`);
  }
  if (mode === "none") {
    return { mode: "none" };
  }

  const provider = options.provider ?? providerFromCapabilityId(id);
  return {
    mode: "api_key_bearer",
    provider,
    env: options.env ?? defaultCredentialEnv(provider),
    scopes: options.scope === undefined || options.scope.length === 0 ? ["read"] : options.scope,
  };
}

function unsafePathParts(path: string): string[] {
  return path.split(/[\\/]+/).filter((part) => part.length > 0);
}

function assertNoPathTraversal(value: string): void {
  if (unsafePathParts(value).includes("..")) {
    throw new CliUserInputError("Unsafe --output path: directory traversal is not allowed.");
  }
}

function assertSafeCapabilityScaffoldOutputDir(resolved: string): void {
  const parts = unsafePathParts(resolved).map((part) => part.toLowerCase());

  if (parts.includes("opencap.local")) {
    throw new CliUserInputError("Unsafe --output path: scaffold files must not be written under opencap.local.");
  }

  for (const part of parts) {
    if (part === ".env" || part.startsWith(".env.")) {
      throw new CliUserInputError("Unsafe --output path: scaffold files must not target .env paths.");
    }
    if (/(token|secret|password)/i.test(part)) {
      throw new CliUserInputError("Unsafe --output path: scaffold paths must not contain token, secret, or password.");
    }
    if (/\.(sqlite|sqlite3|db|log)$/i.test(part)) {
      throw new CliUserInputError("Unsafe --output path: scaffold files must not target database or log paths.");
    }
  }
}

function resolveCapabilityScaffoldOutputDir(id: string, category: string, output: string | undefined): string {
  const requested = output ?? join("registry", category, id);
  assertNoPathTraversal(requested);

  const resolved = resolveCliPath(requested);
  assertSafeCapabilityScaffoldOutputDir(resolved);
  return resolved;
}

async function assertNoExistingScaffoldFiles(outputDir: string, files: CapabilityScaffoldFile[]): Promise<void> {
  for (const file of files) {
    const filePath = join(outputDir, file.path);
    const existing = await stat(filePath).catch((error: unknown) => {
      if (isNodeError(error) && error.code === "ENOENT") {
        return undefined;
      }
      throw error;
    });

    if (existing !== undefined) {
      throw new CliUserInputError(`Refusing to overwrite existing scaffold file: ${filePath}`);
    }
  }
}

async function writeCapabilityScaffoldFiles(outputDir: string, files: CapabilityScaffoldFile[]): Promise<void> {
  await assertNoExistingScaffoldFiles(outputDir, files);

  for (const file of files) {
    const filePath = join(outputDir, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    try {
      await writeFile(filePath, file.content, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (isNodeError(error) && error.code === "EEXIST") {
        throw new CliUserInputError(`Refusing to overwrite existing scaffold file: ${filePath}`);
      }
      throw error;
    }
  }
}

function printCapabilityScaffoldCreated(outputDir: string, files: CapabilityScaffoldFile[]): void {
  console.log("Created Capability scaffold:");
  for (const file of files) {
    console.log(`- ${join(outputDir, file.path)}`);
  }
  console.log("Next:");
  console.log(`  opencap validate ${outputDir}`);
  console.log("  pnpm validate");
}

function buildCliCapabilityScaffold(input: Parameters<typeof buildCapabilityScaffold>[0]) {
  try {
    return buildCapabilityScaffold(input);
  } catch (error) {
    throw new CliUserInputError(error instanceof Error ? error.message : "Invalid Capability scaffold input.");
  }
}

function parseRegistrySearchIncludeLifecycle(value: string | undefined): CapabilityManifestLifecycleStatus[] {
  if (value === undefined) {
    return [];
  }

  const lifecycles = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (lifecycles.length === 0) {
    throw new CliUserInputError("Invalid --include-lifecycle value: expected yanked,revoked.");
  }

  const parsed = new Set<CapabilityManifestLifecycleStatus>();
  for (const lifecycle of lifecycles) {
    if (!REGISTRY_SEARCH_INCLUDE_LIFECYCLES.has(lifecycle as CapabilityManifestLifecycleStatus)) {
      throw new CliUserInputError(`Invalid --include-lifecycle value: ${lifecycle}`);
    }
    parsed.add(lifecycle as CapabilityManifestLifecycleStatus);
  }

  return [...parsed];
}

function parseRegistryAdvisorySeverity(value: string | undefined): CapabilityAdvisory["severity"] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!CAPABILITY_ADVISORY_SEVERITIES.has(value as CapabilityAdvisory["severity"])) {
    throw new CliUserInputError(`Invalid --severity value: ${value}`);
  }

  return value as CapabilityAdvisory["severity"];
}

function parseRegistryAdvisoryStatus(value: string | undefined): CapabilityAdvisory["status"] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!CAPABILITY_ADVISORY_STATUSES.has(value as CapabilityAdvisory["status"])) {
    throw new CliUserInputError(`Invalid --status value: ${value}`);
  }

  return value as CapabilityAdvisory["status"];
}

function resolveRegistryAdvisoryListFilters(options: {
  capability?: string;
  severity?: string;
  status?: string;
}): RegistryAdvisoryListFilters {
  return {
    ...(options.capability === undefined ? {} : { capability: options.capability }),
    ...(options.severity === undefined ? {} : { severity: parseRegistryAdvisorySeverity(options.severity) }),
    ...(options.status === undefined ? {} : { status: parseRegistryAdvisoryStatus(options.status) }),
  };
}

function resolveAdvisoryCheckFilters(options: {
  capability?: string;
  severity?: string;
  status?: string;
}): AdvisoryCheckFilters {
  return {
    ...(options.capability === undefined ? {} : { capability: options.capability }),
    ...(options.severity === undefined ? {} : { severity: parseRegistryAdvisorySeverity(options.severity) }),
    ...(options.status === undefined ? {} : { status: parseRegistryAdvisoryStatus(options.status) }),
  };
}

function registrySearchCategory(result: RegistryCapabilitySearchResult): string {
  const category = result.manifest.metadata.category;
  return typeof category === "string" ? category : "unknown";
}

function registrySearchReportResult(result: RegistryCapabilitySearchResult): RegistrySearchReportResult {
  return {
    id: result.id,
    name: result.name,
    description: result.description,
    version: result.version,
    lifecycle: result.lifecycle,
    category: registrySearchCategory(result),
    filePath: result.filePath,
  };
}

function registrySearchInvalidResult(invalid: ManifestValidationFailure): RegistrySearchInvalidResult {
  return {
    filePath: invalid.filePath,
    issues: invalid.issues.map((issue) => formatManifestValidationIssue(issue)),
  };
}

function buildRegistrySearchReport(search: Awaited<ReturnType<typeof searchRegistryCapabilities>>): RegistrySearchReport {
  const results = search.results.map(registrySearchReportResult);
  const excludedByLifecycle = search.excludedByLifecycle.map(registrySearchReportResult);

  return {
    schemaVersion: "opencap.registry_search.v1",
    registryPath: search.targetPath,
    ...(search.query === undefined ? {} : { query: search.query }),
    resultCount: results.length,
    results,
    excludedByLifecycle: {
      count: excludedByLifecycle.length,
      results: excludedByLifecycle,
    },
    invalidCount: search.invalid.length,
    invalid: search.invalid.map(registrySearchInvalidResult),
    policyEffect: "none",
  };
}

function printRegistrySearchReport(report: RegistrySearchReport): void {
  if (report.results.length === 0) {
    console.log("No registry capabilities found.");
  } else {
    console.log("id version lifecycle category description");
    for (const capability of report.results) {
      console.log([
        capability.id,
        capability.version,
        capability.lifecycle,
        capability.category,
        capability.description,
      ].join(" "));
    }
  }

  console.log(`excluded_by_lifecycle: ${report.excludedByLifecycle.count}`);

  if (report.invalidCount === 0) {
    return;
  }

  console.error(`Invalid registry manifests: ${report.invalidCount}`);
  for (const invalid of report.invalid) {
    console.error(`- ${invalid.filePath}: ${invalid.issues.join("; ")}`);
  }
}

function registryMetadataString(manifest: CapabilityManifest, field: string): string {
  const value = manifest.metadata[field];
  return typeof value === "string" && value.length > 0 ? value : "unknown";
}

function registryAuthPlacement(auth: Record<string, unknown>): string | undefined {
  const placement = auth.placement;
  if (isRecord(placement) && typeof placement.type === "string") {
    return placement.type;
  }
  return undefined;
}

function registryCapabilityAuthDetail(manifest: CapabilityManifest): RegistryCapabilityDetailAuth {
  return {
    type: typeof manifest.auth.type === "string" ? manifest.auth.type : "unknown",
    ...(typeof manifest.auth.provider === "string" ? { provider: manifest.auth.provider } : {}),
    ...(typeof manifest.auth.env === "string" ? { env: manifest.auth.env } : {}),
    ...(registryAuthPlacement(manifest.auth) === undefined ? {} : { placement: registryAuthPlacement(manifest.auth) }),
    scopes: Array.isArray(manifest.auth.scopes)
      ? manifest.auth.scopes.filter((scope): scope is string => typeof scope === "string")
      : [],
  };
}

function registryExecutionOrigin(manifest: CapabilityManifest): string {
  const url = typeof manifest.execution.url === "string" ? manifest.execution.url : "";
  try {
    return new URL(url).origin;
  } catch {
    const match = url.match(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]+/i);
    return match?.[0] ?? "unknown";
  }
}

function registryCapabilityDetail(result: RegistryCapabilitySearchResult): RegistryCapabilityDetail {
  return {
    id: result.id,
    name: result.name,
    description: result.description,
    version: result.version,
    lifecycle: result.lifecycle,
    category: registrySearchCategory(result),
    maintainer: registryMetadataString(result.manifest, "maintainer"),
    license: registryMetadataString(result.manifest, "license"),
    trustLevel: registryMetadataString(result.manifest, "trust_level"),
    manifestPath: result.filePath,
    auth: registryCapabilityAuthDetail(result.manifest),
    permissions: result.manifest.permissions.map((permission) => ({ ...permission })),
    execution: {
      method: result.manifest.execution.method ?? "unknown",
      origin: registryExecutionOrigin(result.manifest),
    },
  };
}

function buildRegistryCapabilityDetailReport(
  registryPath: string,
  result: RegistryCapabilitySearchResult,
): RegistryCapabilityDetailReport {
  return {
    schemaVersion: "opencap.registry_capability_detail.v1",
    registryPath,
    capability: registryCapabilityDetail(result),
    policyEffect: "none",
  };
}

function formatRegistryCapabilityAuth(auth: RegistryCapabilityDetailAuth): string {
  const parts = [auth.type];
  if (auth.provider !== undefined) {
    parts.push(`provider=${auth.provider}`);
  }
  if (auth.env !== undefined) {
    parts.push(`env=${auth.env}`);
  }
  if (auth.placement !== undefined) {
    parts.push(`placement=${auth.placement}`);
  }
  if (auth.scopes.length > 0) {
    parts.push(`scopes=${auth.scopes.join(",")}`);
  }
  return parts.join(" ");
}

function printRegistryCapabilityDetailReport(report: RegistryCapabilityDetailReport): void {
  const capability = report.capability;
  console.log("OpenCap registry capability");
  console.log(`id: ${capability.id}`);
  console.log(`name: ${capability.name}`);
  console.log(`description: ${capability.description}`);
  console.log(`version: ${capability.version}`);
  console.log(`lifecycle: ${capability.lifecycle}`);
  console.log(`category: ${capability.category}`);
  console.log(`maintainer: ${capability.maintainer}`);
  console.log(`license: ${capability.license}`);
  console.log(`trust: ${capability.trustLevel}`);
  console.log(`auth: ${formatRegistryCapabilityAuth(capability.auth)}`);
  for (const permission of capability.permissions) {
    console.log(`permission: ${permission.resource} ${permission.action} ${permission.risk} ${permission.confirmation}`);
  }
  console.log(`execution: ${capability.execution.method} ${capability.execution.origin}`);
  console.log(`manifest: ${capability.manifestPath}`);
}

function selectRegistryCapabilityResult(
  id: string,
  search: Awaited<ReturnType<typeof searchRegistryCapabilities>>,
): RegistryCapabilitySearchResult {
  if (search.invalid.length > 0) {
    throw new CliUserInputError(`Invalid registry manifests: ${search.invalid.length}`);
  }

  const matches = search.results.filter((result) => result.id === id);
  if (matches.length === 0) {
    throw new CliUserInputError(`Capability not found in registry: ${id}`);
  }
  if (matches.length > 1) {
    throw new CliUserInputError(`Multiple registry capabilities found for id: ${id}`);
  }

  return matches[0];
}

function advisoryCheckInvalidAdvisory(
  invalid: InstalledCapabilityAdvisoryCheckResult["invalidAdvisories"][number],
): AdvisoryCheckInvalidAdvisory {
  return {
    filePath: invalid.filePath,
    issues: invalid.issues.map((issue) => formatManifestValidationIssue(issue)),
  };
}

function buildAdvisoryCheckReport(input: {
  stateDir: string;
  registryPath: string;
  result: InstalledCapabilityAdvisoryCheckResult;
  filters?: AdvisoryCheckFilters;
}): AdvisoryCheckReport {
  const filters = input.filters ?? {};
  const checkedInstalledCapabilities = input.result.checkedInstalledCapabilities
    .filter((capabilityId) => filters.capability === undefined || capabilityId === filters.capability);
  const capabilityMatches = input.result.matches
    .filter((match) => filters.capability === undefined || match.capabilityId === filters.capability);
  const matches = capabilityMatches.filter((match) => {
    if (filters.severity !== undefined && match.severity !== filters.severity) {
      return false;
    }
    if (filters.status !== undefined && match.status !== filters.status) {
      return false;
    }
    return true;
  });

  return {
    schemaVersion: "opencap.advisory_check.v1",
    stateDir: input.stateDir,
    registryPath: input.registryPath,
    installedCapabilityCount: input.result.checkedInstalledCapabilities.length,
    checkedCapabilityCount: checkedInstalledCapabilities.length,
    checkedInstalledCapabilities,
    filters,
    matchCount: capabilityMatches.length,
    filteredMatchCount: matches.length,
    matches: matches.map((match) => ({ ...match, affectedVersions: [...match.affectedVersions] })),
    invalidAdvisoryCount: input.result.invalidAdvisories.length,
    invalidAdvisories: input.result.invalidAdvisories.map(advisoryCheckInvalidAdvisory),
    policyEffect: "none",
  };
}

function advisoryMatchRequiresAction(match: InstalledCapabilityAdvisoryMatch): boolean {
  return match.status === "revoked" || match.registryAction === "revoke" || match.runtimeDefault === "deny";
}

function advisoryCheckExitCode(report: AdvisoryCheckReport): CliExitCode | undefined {
  if (report.invalidAdvisoryCount > 0 || report.matches.some(advisoryMatchRequiresAction)) {
    return 1;
  }
  return undefined;
}

function printAdvisoryCheckReport(report: AdvisoryCheckReport): void {
  console.log(`checked: ${report.checkedCapabilityCount}`);

  if (report.matches.length === 0) {
    console.log("No installed capability advisories found.");
  } else {
    console.log("capability version advisory severity status registry_action runtime_default");
    for (const match of report.matches) {
      console.log([
        match.capabilityId,
        match.installedVersion,
        match.advisoryId,
        match.severity,
        match.status,
        match.registryAction,
        match.runtimeDefault,
      ].join(" "));
    }
  }

  if (report.invalidAdvisoryCount === 0) {
    return;
  }

  console.error(`Invalid capability advisories: ${report.invalidAdvisoryCount}`);
  for (const invalid of report.invalidAdvisories) {
    console.error(`- ${invalid.filePath}: ${invalid.issues.join("; ")}`);
  }
}

function registryAdvisoryListItem(
  valid: Awaited<ReturnType<typeof validateCapabilityAdvisoryPath>>["valid"][number],
): RegistryAdvisoryListItem {
  const advisory = valid.advisory;
  return {
    id: advisory.id,
    capability: advisory.capability,
    severity: advisory.severity,
    status: advisory.status,
    type: advisory.type,
    registryAction: advisory.actions.registry,
    runtimeDefault: advisory.actions.runtime_default,
    fixedVersion: advisory.actions.fixed_version,
    modifiedAt: advisory.modified_at,
    summary: advisory.summary,
    filePath: valid.filePath,
  };
}

function registryAdvisoryListInvalidAdvisory(
  invalid: Awaited<ReturnType<typeof validateCapabilityAdvisoryPath>>["invalid"][number],
): AdvisoryCheckInvalidAdvisory {
  return {
    filePath: invalid.filePath,
    issues: invalid.issues.map((issue) => formatManifestValidationIssue(issue)),
  };
}

function registryAdvisoryDetail(
  valid: Awaited<ReturnType<typeof validateCapabilityAdvisoryPath>>["valid"][number],
): RegistryAdvisoryDetail {
  const item = registryAdvisoryListItem(valid);
  const advisory = valid.advisory;
  return {
    ...item,
    affectedVersions: [...advisory.affected_versions],
    publishedAt: advisory.published_at,
    references: [...(advisory.references ?? [])],
  };
}

function buildRegistryAdvisoryListReport(
  result: Awaited<ReturnType<typeof validateCapabilityAdvisoryPath>>,
  filters: RegistryAdvisoryListFilters = {},
): RegistryAdvisoryListReport {
  const allAdvisories = result.valid
    .map(registryAdvisoryListItem)
    .sort((left, right) => left.id.localeCompare(right.id));
  const advisories = allAdvisories.filter((advisory) => {
    if (filters.capability !== undefined && advisory.capability !== filters.capability) {
      return false;
    }
    if (filters.severity !== undefined && advisory.severity !== filters.severity) {
      return false;
    }
    if (filters.status !== undefined && advisory.status !== filters.status) {
      return false;
    }
    return true;
  });

  return {
    schemaVersion: "opencap.registry_advisory_list.v1",
    registryPath: result.targetPath,
    advisoryCount: allAdvisories.length,
    filteredAdvisoryCount: advisories.length,
    filters,
    advisories,
    invalidAdvisoryCount: result.invalid.length,
    invalidAdvisories: result.invalid.map(registryAdvisoryListInvalidAdvisory),
    policyEffect: "none",
  };
}

function printRegistryAdvisoryListReport(report: RegistryAdvisoryListReport): void {
  if (report.advisories.length === 0) {
    console.log("No registry advisories found.");
  } else {
    console.log("advisory capability severity status registry_action runtime_default modified_at");
    for (const advisory of report.advisories) {
      console.log([
        advisory.id,
        advisory.capability,
        advisory.severity,
        advisory.status,
        advisory.registryAction,
        advisory.runtimeDefault,
        advisory.modifiedAt,
      ].join(" "));
    }
  }

  if (report.invalidAdvisoryCount === 0) {
    return;
  }

  console.error(`Invalid capability advisories: ${report.invalidAdvisoryCount}`);
  for (const invalid of report.invalidAdvisories) {
    console.error(`- ${invalid.filePath}: ${invalid.issues.join("; ")}`);
  }
}

function selectRegistryAdvisory(
  id: string,
  result: Awaited<ReturnType<typeof validateCapabilityAdvisoryPath>>,
): Awaited<ReturnType<typeof validateCapabilityAdvisoryPath>>["valid"][number] {
  if (result.invalid.length > 0) {
    throw new CliUserInputError(`Invalid capability advisories: ${result.invalid.length}`);
  }

  const matches = result.valid.filter((valid) => valid.advisory.id === id);
  if (matches.length === 0) {
    throw new CliUserInputError(`Capability advisory not found in registry: ${id}`);
  }
  if (matches.length > 1) {
    throw new CliUserInputError(`Multiple registry advisories found for id: ${id}`);
  }

  return matches[0];
}

function buildRegistryAdvisoryDetailReport(
  registryPath: string,
  valid: Awaited<ReturnType<typeof validateCapabilityAdvisoryPath>>["valid"][number],
): RegistryAdvisoryDetailReport {
  return {
    schemaVersion: "opencap.registry_advisory_detail.v1",
    registryPath,
    advisory: registryAdvisoryDetail(valid),
    policyEffect: "none",
  };
}

function printRegistryAdvisoryDetailReport(report: RegistryAdvisoryDetailReport): void {
  const advisory = report.advisory;
  console.log("OpenCap registry advisory");
  console.log(`id: ${advisory.id}`);
  console.log(`capability: ${advisory.capability}`);
  console.log(`affected versions: ${advisory.affectedVersions.join(",")}`);
  console.log(`type: ${advisory.type}`);
  console.log(`severity: ${advisory.severity}`);
  console.log(`status: ${advisory.status}`);
  console.log(`summary: ${advisory.summary}`);
  console.log(`published_at: ${advisory.publishedAt ?? "null"}`);
  console.log(`modified_at: ${advisory.modifiedAt}`);
  console.log(`registry action: ${advisory.registryAction}`);
  console.log(`runtime default: ${advisory.runtimeDefault}`);
  console.log(`fixed version: ${advisory.fixedVersion ?? "null"}`);
  console.log(`references: ${advisory.references.length > 0 ? advisory.references.join(",") : "none"}`);
  console.log(`file: ${advisory.filePath}`);
}

function parsePolicyDecision(value: string | undefined): PolicyDecision | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!POLICY_DECISION_VALUES.has(value as PolicyDecision)) {
    throw new CliUserInputError(`Invalid --decision value: ${value}`);
  }

  return value as PolicyDecision;
}

function formatDecisionLogLine(record: {
  timestamp: string;
  invocationId: string;
  capabilityId: string;
  policyDecision: string;
  status: string;
  policyRevision?: string;
  traceId?: string;
  reasonCode?: string;
}): string {
  return [
    record.timestamp,
    record.invocationId,
    record.capabilityId,
    record.policyDecision,
    record.status,
    record.policyRevision ?? "-",
    record.traceId ?? "-",
    record.reasonCode ?? "-",
  ].join(" ");
}

function ledgerRecordCapabilityId(record: LedgerRecordV1): string | undefined {
  if (record.recordKind === "policy") {
    return undefined;
  }

  return record.capability?.id;
}

function formatLedgerLine(record: LedgerRecordV1): string {
  return [
    record.recordedAt,
    record.recordKind,
    ledgerRecordCapabilityId(record) ?? "-",
    "status" in record ? record.status : "event" in record ? record.event : "result" in record ? record.result : "-",
    record.recordId,
  ].join(" ");
}

function formatDurationMetric(value: number | null): string {
  return value === null ? "n/a" : String(value);
}

function printLocalMetricsSummary(summary: LocalMetricsSummary): void {
  console.log("OpenCap local metrics");
  console.log(`window: ${summary.window.since ?? "*"}..${summary.window.until ?? "*"}`);
  if (summary.capabilityId !== undefined) {
    console.log(`capability: ${summary.capabilityId}`);
  }
  console.log(`invocations: ${summary.invocationsTotal}`);
  console.log([
    "status:",
    `executed=${summary.statusCounts.executed}`,
    `dry_run=${summary.statusCounts.dry_run}`,
    `blocked=${summary.statusCounts.blocked}`,
    `denied=${summary.statusCounts.denied}`,
  ].join(" "));
  console.log([
    "policy decisions:",
    `allow=${summary.policyDecisionCounts.allow}`,
    `ask=${summary.policyDecisionCounts.ask}`,
    `deny=${summary.policyDecisionCounts.deny}`,
  ].join(" "));
  console.log(`confirmation required: ${summary.confirmationRequiredTotal}`);
  console.log(`outbound blocked: ${summary.outboundBlockedTotal}`);
  console.log(`data egress denied: ${summary.dataEgressDeniedTotal}`);
  console.log(`secret missing: ${summary.secretMissingTotal}`);
  console.log(`audit preflight failed: ${summary.auditPreflightFailedTotal}`);
  console.log(`duration_ms: p50=${formatDurationMetric(summary.durationMs.p50)} p95=${formatDurationMetric(summary.durationMs.p95)}`);
}

function localMetricsErrorRate(summary: LocalMetricsSummary): number {
  if (summary.invocationsTotal === 0) {
    return 0;
  }

  const errorLike = summary.statusCounts.blocked + summary.statusCounts.denied;
  return Number((errorLike / summary.invocationsTotal).toFixed(4));
}

function buildLocalMetricsCapabilitiesReport(events: AuditEvent[]): LocalMetricsCapabilitiesReport {
  const grouped = new Map<string, AuditEvent[]>();
  for (const event of events) {
    grouped.set(event.capabilityId, [...(grouped.get(event.capabilityId) ?? []), event]);
  }

  const capabilities = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([capabilityId, capabilityEvents]) => {
      const summary = buildLocalMetricsSummary(capabilityEvents, { capabilityId });
      const lastSeenAt = capabilityEvents
        .map((event) => event.timestamp)
        .sort((left, right) => right.localeCompare(left))[0];

      return {
        capabilityId,
        invocationsTotal: summary.invocationsTotal,
        statusCounts: summary.statusCounts,
        policyDecisionCounts: summary.policyDecisionCounts,
        errorRate: localMetricsErrorRate(summary),
        durationMs: summary.durationMs,
        lastSeenAt,
      };
    });

  return {
    schemaVersion: "opencap.local_metrics_capabilities.v1",
    capabilities,
    policyEffect: "none",
  };
}

function buildLocalMetricsSecurityReport(events: AuditEvent[]): LocalMetricsSecurityReport {
  const summary = buildLocalMetricsSummary(events);
  const deniedTotal = events.filter((event) => event.status === "denied" || event.policyDecision === "deny").length;

  return {
    schemaVersion: "opencap.local_metrics_security.v1",
    deniedTotal,
    confirmationRequiredTotal: summary.confirmationRequiredTotal,
    outboundBlockedTotal: summary.outboundBlockedTotal,
    dataEgressDeniedTotal: summary.dataEgressDeniedTotal,
    secretMissingTotal: summary.secretMissingTotal,
    auditPreflightFailedTotal: summary.auditPreflightFailedTotal,
    policyEffect: "none",
  };
}

function printLocalMetricsCapabilitiesReport(report: LocalMetricsCapabilitiesReport): void {
  if (report.capabilities.length === 0) {
    console.log("No capability metrics found.");
    return;
  }

  console.log("capability invocations error_rate last_seen");
  for (const capability of report.capabilities) {
    console.log([
      capability.capabilityId,
      capability.invocationsTotal,
      capability.errorRate,
      capability.lastSeenAt,
    ].join(" "));
  }
}

function printLocalMetricsSecurityReport(report: LocalMetricsSecurityReport): void {
  console.log("OpenCap security metrics");
  console.log(`denied: ${report.deniedTotal}`);
  console.log(`confirmation required: ${report.confirmationRequiredTotal}`);
  console.log(`outbound blocked: ${report.outboundBlockedTotal}`);
  console.log(`data egress denied: ${report.dataEgressDeniedTotal}`);
  console.log(`secret missing: ${report.secretMissingTotal}`);
  console.log(`audit preflight failed: ${report.auditPreflightFailedTotal}`);
}

function releasePackageJsonPath(packageName: string, cwd: string): string {
  const relativePath = RELEASE_PACKAGE_PATHS.get(packageName);
  if (relativePath === undefined) {
    throw new CliUserInputError(`Unsupported --package value: ${packageName}`);
  }

  return resolve(cwd, relativePath);
}

async function readNpmPackJsonFiles(packJsonPath: string): Promise<NpmPackagePackFile[]> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(packJsonPath, "utf8"));
  } catch {
    throw new CliUserInputError(`Invalid --pack-json: expected npm pack --dry-run --json output at ${packJsonPath}`);
  }

  const packRecord = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!isRecord(packRecord) || !Array.isArray(packRecord.files)) {
    throw new CliUserInputError("Invalid --pack-json: expected an object with a files array.");
  }

  return packRecord.files.map((file, index) => {
    if (!isRecord(file) || typeof file.path !== "string") {
      throw new CliUserInputError(`Invalid --pack-json: files[${index}] must include a path.`);
    }

    return {
      path: file.path,
      size: typeof file.size === "number" && Number.isFinite(file.size) ? file.size : undefined,
    };
  });
}

function resolveReleaseGeneratedAt(value: string | undefined): string {
  const generatedAt = value === undefined ? new Date() : new Date(value);
  if (Number.isNaN(generatedAt.getTime())) {
    throw new CliUserInputError("Invalid --generated-at value: expected ISO timestamp.");
  }

  return generatedAt.toISOString();
}

function resolveReleaseDate(value: string | undefined, generatedAt: string): string {
  if (value === undefined) {
    return generatedAt.slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new CliUserInputError("Invalid --date value: expected YYYY-MM-DD.");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new CliUserInputError("Invalid --date value: expected YYYY-MM-DD.");
  }

  return value;
}

interface SafeJsonOutputLabels {
  artifact: string;
  fileName: string;
}

function resolveSafeJsonOutputPath(value: string, labels: SafeJsonOutputLabels): string {
  const resolved = resolveCliPath(value);
  const parts = resolved.split(/[\\/]+/).map((part) => part.toLowerCase());
  const fileName = basename(resolved).toLowerCase();

  if (parts.includes("opencap.local")) {
    throw new CliUserInputError(`Unsafe --output path: ${labels.artifact} must not be written under opencap.local.`);
  }
  if (fileName === ".env" || fileName.startsWith(".env.")) {
    throw new CliUserInputError(`Unsafe --output path: ${labels.artifact} must not target .env files.`);
  }
  if (/(token|secret|password)/i.test(fileName)) {
    throw new CliUserInputError(`Unsafe --output path: ${labels.fileName} must not contain token, secret, or password.`);
  }
  if (/\.(sqlite|sqlite3|db|log)$/i.test(fileName)) {
    throw new CliUserInputError(`Unsafe --output path: ${labels.artifact} must not target database or log files.`);
  }

  return resolved;
}

async function writeSafeJsonOutput(outputPath: string, value: unknown, labels: SafeJsonOutputLabels): Promise<void> {
  const resolved = resolveSafeJsonOutputPath(outputPath, labels);
  const existing = await stat(resolved).catch((error: unknown) => {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  });

  if (existing?.isDirectory()) {
    throw new CliUserInputError("Unsafe --output path: expected a file path, received a directory.");
  }

  const parentDir = dirname(resolved);
  await mkdir(parentDir, { recursive: true });
  const tempPath = join(parentDir, `.${basename(resolved)}.${process.pid}.${Date.now()}.tmp`);

  try {
    await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(tempPath, resolved);
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

async function writeReleaseJsonOutput(outputPath: string, value: unknown): Promise<void> {
  await writeSafeJsonOutput(outputPath, value, {
    artifact: "release artifacts",
    fileName: "release artifact names",
  });
}

async function writeAdvisoryJsonOutput(outputPath: string, value: unknown): Promise<void> {
  await writeSafeJsonOutput(outputPath, value, {
    artifact: "advisory evidence files",
    fileName: "advisory evidence file names",
  });
}

async function writeReleaseEvidenceOutput(outputPath: string, bundle: ReleaseEvidenceBundle): Promise<void> {
  await writeReleaseJsonOutput(outputPath, bundle);
}

function printNpmPackageReadinessReport(report: NpmPackageReadinessReport): void {
  console.log("OpenCap package readiness");
  console.log(`package: ${report.packageName ?? "<missing>"}`);
  console.log(`version: ${report.version ?? "<missing>"}`);
  console.log(`candidate: ${report.candidate ? "yes" : "no"}`);
  console.log(`private: ${report.metadata.private ? "yes" : "no"}`);
  console.log(`entrypoints: main=${report.metadata.hasMain ? "yes" : "no"} types=${report.metadata.hasTypes ? "yes" : "no"} bin=${report.metadata.hasBin ? "yes" : "no"} exports=${report.metadata.exportKeys.length > 0 ? report.metadata.exportKeys.join(",") : "none"}`);
  console.log(`pack evidence: ${report.pack.evidence}`);
  console.log(`pack files: ${report.pack.fileCount}`);
  console.log(`forbidden files: ${report.pack.forbiddenFiles.length}`);

  if (report.blockers.length === 0) {
    console.log("blockers: none");
  } else {
    console.log("blockers:");
    for (const blocker of report.blockers) {
      console.log(`- ${blocker.code}: ${blocker.message}`);
    }
  }

  if (report.warnings.length === 0) {
    console.log("warnings: none");
  } else {
    console.log("warnings:");
    for (const warning of report.warnings) {
      console.log(`- ${warning.code}: ${warning.message}`);
    }
  }

  if (report.pack.forbiddenFiles.length > 0) {
    console.log("forbidden file details:");
    for (const file of report.pack.forbiddenFiles) {
      console.log(`- ${file.reasonCode}: ${file.path}`);
    }
  }
}

function printReleaseEvidenceBundle(bundle: ReleaseEvidenceBundle): void {
  console.log("OpenCap release evidence");
  console.log(`target: ${bundle.target}`);
  console.log(`commit: ${bundle.commit}`);
  console.log(`date: ${bundle.date}`);
  console.log(`generatedAt: ${bundle.generatedAt}`);
  console.log(`decision: ${bundle.decision}`);
  console.log(`registry: ${bundle.components.registry.status}`);
  console.log(`conformance: ${bundle.components.conformance.status}`);
  console.log(`packages: ${bundle.components.packages.length}`);

  if (bundle.components.packages.length > 0) {
    console.log("package readiness:");
    for (const packageReport of bundle.components.packages) {
      console.log([
        packageReport.packageName ?? "<missing>",
        packageReport.status,
        `pack=${packageReport.packEvidence}`,
        `blockers=${packageReport.blockerCodes.length === 0 ? "none" : packageReport.blockerCodes.join(",")}`,
      ].join(" "));
    }
  }

  if (bundle.blockers.length === 0) {
    console.log("blockers: none");
    return;
  }

  console.log("blockers:");
  for (const blocker of bundle.blockers) {
    console.log(`- ${blocker.code} ${blocker.source}${blocker.ref ? ` ${blocker.ref}` : ""}`);
  }
}

async function readReleaseArtifactJson(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new CliUserInputError("Invalid release artifact JSON: expected valid JSON.");
    }
    throw error;
  }
}

function printReleaseArtifactValidationReport(report: ReturnType<typeof validateReleaseEvidenceArtifact>): void {
  console.log("OpenCap release artifact validation");
  console.log(`valid: ${report.valid ? "yes" : "no"}`);
  console.log(`schema: ${report.artifactSchemaVersion ?? "<missing>"}`);
  console.log(`decision: ${report.decision ?? "<invalid>"}`);
  console.log(`blockers: ${report.blockerCount}`);

  if (report.findings.length === 0) {
    console.log("findings: none");
    return;
  }

  console.log("findings:");
  for (const finding of report.findings) {
    console.log(`- ${finding.code} ${finding.path}: ${finding.message}`);
  }
}

function parseAuditStatus(value: string | undefined): AuditInvocationStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!AUDIT_INVOCATION_STATUSES.has(value as AuditInvocationStatus)) {
    throw new CliUserInputError(`Invalid --status value: ${value}`);
  }

  return value as AuditInvocationStatus;
}

function parseSince(value: string | undefined): string | undefined {
  return parseIsoTimeOption("--since", value);
}

function parseUntil(value: string | undefined): string | undefined {
  return parseIsoTimeOption("--until", value);
}

function parseIsoTimeOption(optionName: "--since" | "--until", value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new CliUserInputError(`Invalid ${optionName} value: ${value}`);
  }

  return timestamp.toISOString();
}

function formatLogLine(event: {
  timestamp: string;
  capabilityId: string;
  policyDecision: string;
  status: string;
  confirmationStatus: string;
  reason: string;
}): string {
  return [
    event.timestamp,
    event.capabilityId,
    event.policyDecision,
    event.status,
    event.confirmationStatus,
    "-",
    event.reason,
  ].join(" ");
}

async function policyStatus(policyPath: string): Promise<string> {
  try {
    const raw = await readFile(policyPath, "utf8");
    YAML.parse(raw);
    return "ok";
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return "missing_default_ask";
    }
    return "invalid";
  }
}


function resolveCliPath(path: string): string {
  return isAbsolute(path) ? path : resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

async function parseInvokeInput(options: { input?: string; inputJson?: string }): Promise<unknown> {
  if (options.input !== undefined && options.inputJson !== undefined) {
    throw new CliUserInputError("Use either --input or --input-json, not both.");
  }

  if (options.inputJson !== undefined) {
    try {
      return JSON.parse(options.inputJson);
    } catch {
      throw new CliUserInputError("Invalid --input-json value: expected valid JSON.");
    }
  }

  if (options.input !== undefined) {
    const inputPath = resolveCliPath(options.input);
    try {
      return JSON.parse(await readFile(inputPath, "utf8"));
    } catch (error) {
      if (isNodeError(error) && error.code && USER_ERROR_CODES.has(error.code)) {
        throw error;
      }
      throw new CliUserInputError(`Invalid --input JSON file: ${options.input}`);
    }
  }

  return {};
}


function cliEnvelopeSubset(envelope: ResultEnvelopeV1, verbose: boolean | undefined): Omit<ResultEnvelopeV1, "evidence"> | ResultEnvelopeV1 {
  if (verbose) {
    return envelope;
  }

  const { evidence: _evidence, ...withoutEvidence } = envelope;
  return withoutEvidence;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function egressPreviewFromEnvelope(envelope: ResultEnvelopeV1): Record<string, unknown> | undefined {
  if (!isRecord(envelope.structuredContent) || !isRecord(envelope.structuredContent.egressPreview)) {
    return undefined;
  }

  return envelope.structuredContent.egressPreview;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function printEgressPreview(preview: Record<string, unknown>): void {
  console.log("egress preview:");

  if (typeof preview.targetOrigin === "string") {
    console.log(`target: ${preview.targetOrigin}`);
  }

  const dataClasses = stringArray(preview.dataClasses);
  console.log(`data classes: ${dataClasses.length === 0 ? "none" : dataClasses.join(", ")}`);

  if (!Array.isArray(preview.fieldsSent) || preview.fieldsSent.length === 0) {
    console.log("fields sent: none");
    return;
  }

  console.log("fields sent:");
  for (const field of preview.fieldsSent) {
    if (!isRecord(field)) {
      continue;
    }

    const path = typeof field.path === "string" ? field.path : "<unknown>";
    const destination = typeof field.destination === "string" ? field.destination : "unknown";
    const fieldClasses = stringArray(field.dataClasses);
    const suffix = fieldClasses.length === 0 ? "" : ` [${fieldClasses.join(", ")}]`;
    console.log(`- ${path} -> ${destination}${suffix}`);
  }
}


function parsePolicyScenariosDocument(raw: string): PolicySimulationScenario[] {
  const parsed = YAML.parse(raw) as unknown;
  const scenarios = Array.isArray(parsed) ? parsed : isRecord(parsed) ? parsed.scenarios : undefined;

  if (!Array.isArray(scenarios)) {
    throw new Error("Policy simulation scenarios file must contain a scenarios array.");
  }

  return scenarios.map((scenario, index) => {
    if (!isRecord(scenario)) {
      throw new Error(`Policy simulation scenario at index ${index} must be an object.`);
    }

    return {
      id: String(scenario.id ?? `scenario-${index}`),
      capabilityId: String(scenario.capabilityId ?? scenario.capability_id ?? ""),
      resource: String(scenario.resource ?? ""),
      action: String(scenario.action ?? ""),
      risk: scenario.risk as PolicySimulationScenario["risk"],
      dataClasses: Array.isArray(scenario.dataClasses) ? scenario.dataClasses as PolicySimulationScenario["dataClasses"] : Array.isArray(scenario.data_classes) ? scenario.data_classes as PolicySimulationScenario["dataClasses"] : [],
      targetOrigin: typeof scenario.targetOrigin === "string" ? scenario.targetOrigin : typeof scenario.target_origin === "string" ? scenario.target_origin : undefined,
      expectedDecision: scenario.expectedDecision as PolicySimulationScenario["expectedDecision"],
    };
  });
}

function formatPolicySimulationFinding(finding: {
  severity: string;
  category: string;
  scenarioId: string;
  capabilityId: string;
  beforeDecision: string;
  afterDecision: string;
  risk: string;
  targetOrigin?: string;
}): string {
  const target = finding.targetOrigin === undefined ? "" : ` target=${finding.targetOrigin}`;
  return `${finding.severity} ${finding.category} scenario=${finding.scenarioId} capability=${finding.capabilityId} ${finding.beforeDecision}->${finding.afterDecision} risk=${finding.risk}${target}`;
}

function printPolicyExplain(trace: ResultEnvelopeV1["evidence"]["policyTrace"]): void {
  if (trace === undefined) {
    return;
  }

  console.log("policy explain:");
  console.log(`final decision: ${trace.decision}`);
  console.log(`blocking gate: ${trace.executionAllowed ? "none" : trace.gate}`);
  console.log(`matched rule: ${trace.matchedRuleId ?? "<default>"}`);
  console.log(`reason code: ${trace.reasonCode}`);
  console.log(`policy revision: ${trace.policyRevision}`);
  console.log(`secret resolution: ${trace.secretResolutionAllowed ? "allowed" : "blocked"}`);
  console.log(`execution: ${trace.executionAllowed ? "allowed" : "blocked"}`);

  if (trace.evaluatedFacts.length > 0) {
    console.log("evaluated facts:");
    for (const fact of trace.evaluatedFacts) {
      console.log(`- ${fact}`);
    }
  }
}

function printInvokeResult(envelope: ResultEnvelopeV1, options: { json?: boolean; verbose?: boolean }): void {
  if (options.json) {
    console.log(JSON.stringify(cliEnvelopeSubset(envelope, options.verbose), null, 2));
    return;
  }

  console.log(envelope.textSummary ?? `${envelope.capabilityId} ${envelope.status}.`);
  console.log(`status: ${envelope.status}`);
  if (envelope.warnings.length === 0) {
    console.log("warnings: none");
  } else {
    console.log("warnings:");
    for (const warning of envelope.warnings) {
      console.log(`- ${warning.severity} ${warning.code}: ${warning.message}`);
    }
  }

  const egressPreview = egressPreviewFromEnvelope(envelope);
  if (egressPreview !== undefined) {
    printEgressPreview(egressPreview);
  }

  if (options.verbose) {
    console.log("evidence:");
    console.log(JSON.stringify(envelope.evidence, null, 2));
  }
}

function trustLevelFromMetadata(metadata: Record<string, unknown>): string | undefined {
  return typeof metadata.trust_level === "string" ? metadata.trust_level : undefined;
}

const TRUST_LEVELS = new Set<TrustSummary["level"]>([
  "unverified",
  "listed",
  "tested",
  "maintainer_verified",
  "official",
]);

function trustSummaryFromManifest(manifest: CapabilityManifest): TrustSummary | undefined {
  const trustLevel = trustLevelFromMetadata(manifest.metadata);

  if (trustLevel === undefined || !TRUST_LEVELS.has(trustLevel as TrustSummary["level"])) {
    return undefined;
  }

  return { level: trustLevel as TrustSummary["level"] };
}

const RISK_ORDER: Array<CapabilityManifest["permissions"][number]["risk"]> = [
  "read_only",
  "write",
  "external_send",
  "destructive",
  "financial",
  "code_execution",
  "secret_access",
];

function riskSummaryFromManifest(manifest: CapabilityManifest): RiskSummary {
  const risks = new Set(manifest.permissions.map((permission) => permission.risk));
  const highestRisk = [...RISK_ORDER].reverse().find((risk) => risks.has(risk)) ?? "unknown";

  return {
    highestRisk,
    requiresConfirmation: manifest.permissions.some((permission) => permission.confirmation !== "allow"),
    permissions: manifest.permissions,
  };
}

function sha256Digest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

async function manifestDigest(manifestPath: string): Promise<string> {
  return sha256Digest(await readFile(manifestPath, "utf8"));
}

async function createCapabilityCardForInstalled(capability: InstalledCapability) {
  return createCapabilityCard({
    capability: await createCardInstalledCapabilityRecord(capability),
  });
}

async function createTrustCardForInstalled(capability: InstalledCapability) {
  return createTrustCardFromInstalledCapability({
    capability: await createCardInstalledCapabilityRecord(capability),
  });
}

async function createCardInstalledCapabilityRecord(capability: InstalledCapability): Promise<InstalledCapabilityRecord> {
  const installPathStatus = await stat(capability.installPath);

  return {
    identity: createCapabilityIdentity({
      manifest: capability.manifest,
      packagePath: capability.installPath,
      manifestPath: capability.manifestPath,
      manifestDigest: await manifestDigest(capability.manifestPath),
      lifecycle: capability.manifest.lifecycle?.status as CapabilityLifecycleState | undefined,
    }),
    manifest: capability.manifest,
    install: {
      installedAt: installPathStatus.mtime.toISOString(),
      source: "registry",
      sourceRef: capability.id,
    },
    trust: trustSummaryFromManifest(capability.manifest),
    derived: {
      riskSummary: riskSummaryFromManifest(capability.manifest),
      modelVisibleSummary: capability.manifest.description,
    },
  };
}

type CliCardKind = "capability" | "trust";

function parseCardKind(value: string | undefined): CliCardKind {
  if (value === undefined || value === "capability") {
    return "capability";
  }
  if (value === "trust") {
    return "trust";
  }

  throw new CliUserInputError(`Invalid --kind value: ${value}`);
}

async function runCliAction(action: () => Promise<void>, fallbackMessage: string): Promise<void> {
  try {
    await action();
  } catch (error) {
    handleCliError(error, fallbackMessage);
  }
}


program
  .name("opencap")
  .description("OpenCap CLI for Capability development and runtime control.")
  .version("0.1.0");

program
  .command("init")
  .argument("<id>", "Capability id, for example github.create_issue")
  .requiredOption("--category <name>", "Registry category slug for the Capability package")
  .option("--output <dir>", "Output Capability package directory")
  .option("--title <title>", "Human-readable Capability name")
  .option("--description <text>", "Human-readable Capability description")
  .option("--method <method>", "HTTP method for the scaffold", "GET")
  .option("--url <template>", "Fixed HTTP URL template for the scaffold")
  .option("--auth <mode>", "Auth mode: none or api-key-bearer", "none")
  .option("--provider <slug>", "Credential provider slug for api-key-bearer auth")
  .option("--env <name>", "Environment variable name for api-key-bearer auth")
  .option("--scope <scope...>", "Credential scope for api-key-bearer auth")
  .description("Create a local V1 HTTP Capability scaffold.")
  .action((id: string, options: InitCommandOptions) => runCliAction(async () => {
    const category = options.category;
    const outputDir = resolveCapabilityScaffoldOutputDir(id, category, options.output);
    const provider = providerFromCapabilityId(id);
    const scaffold = buildCliCapabilityScaffold({
      id,
      title: options.title ?? titleFromCapabilityId(id),
      description: options.description ?? `Scaffold for ${id}.`,
      category,
      method: parseInitMethod(options.method),
      urlTemplate: options.url ?? `https://api.${providerHostnameFragment(provider)}.example.com/{{message}}`,
      auth: parseInitAuth(id, options),
    });

    await writeCapabilityScaffoldFiles(outputDir, scaffold.files);
    printCapabilityScaffoldCreated(outputDir, scaffold.files);
  }, "Failed to create Capability scaffold"));

program
  .command("validate")
  .argument("[path]", "Capability or registry path", ".")
  .description("Validate Capability manifests.")
  .action((path: string) => runCliAction(async () => {
    const targetPath = isAbsolute(path) ? path : resolve(process.env.INIT_CWD ?? process.cwd(), path);
    const result = await validateManifestPath(targetPath);

    if (result.manifests.length === 0) {
      setCliError(`No manifests found under ${path}`, 1);
      return;
    }

    for (const valid of result.valid) {
      console.log(`Valid manifest: ${valid.filePath}`);
    }

    for (const invalid of result.invalid) {
      console.error(`Invalid manifest: ${invalid.filePath}`);
      for (const issue of invalid.issues) {
        console.error(`  ${formatManifestValidationIssue(issue)}`);
      }
    }

    if (result.invalid.length > 0) {
      process.exitCode = 1;
    }
  }, "Failed to validate manifests"));


function formatPolicyFinding(finding: { severity: string; code: string; filePath: string; fieldPath: string; message: string; ruleId?: string }): string {
  const rule = finding.ruleId === undefined ? "" : ` rule=${finding.ruleId}`;
  return `${finding.severity} ${finding.code} ${finding.filePath}${finding.fieldPath}${rule}: ${finding.message}`;
}

function printLifecycleWarning(warning: CapabilityLifecycleWarning | undefined): void {
  if (warning === undefined) {
    return;
  }
  console.error(`Warning: ${warning.summary}`);
}

program
  .command("install")
  .argument("<id>", "Capability id")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--registry <path>", "Registry root directory")
  .option("--force", "Replace an existing installed Capability")
  .description("Install a Capability from the registry.")
  .action((id: string, options: { stateDir?: string; registry?: string; force?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const result = await installCapability({
      id,
      cwd,
      env: process.env,
      stateDir: options.stateDir,
      registryDir: options.registry,
      force: options.force,
    });

    console.log(`Installed ${result.id} to ${result.destinationDir}`);
    for (const warning of result.warnings) {
      printLifecycleWarning(warning);
    }
  }, `Failed to install ${id}`));

program
  .command("list")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .description("List installed Capabilities.")
  .action((options: { stateDir?: string; json?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const installed = await listInstalledCapabilities({ cwd, env: process.env, stateDir: options.stateDir });

    if (options.json) {
      console.log(JSON.stringify(installed, null, 2));
      return;
    }

    if (installed.length === 0) {
      console.log("No installed capabilities found.");
      return;
    }

    console.log("id version type risk lifecycle trust maintainer license status");
    for (const capability of installed) {
      console.log(
        `${capability.id} ${capability.version ?? "-"} ${capability.type ?? "-"} ${capability.risk} ${capability.lifecycle} ${capability.trustLevel ?? "-"} ${capability.maintainer ?? "-"} ${capability.license ?? "-"} ${capability.status}`,
      );
      printLifecycleWarning(capability.lifecycleWarning);
    }
  }, "Failed to list installed capabilities"));

program
  .command("card")
  .argument("<id>", "Installed Capability id")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--kind <kind>", "Card kind: capability or trust", "capability")
  .option("--json", "Output JSON")
  .description("Generate a local Capability Card for an installed Capability.")
  .action((id: string, options: { stateDir?: string; kind?: string; json?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const cardKind = parseCardKind(options.kind);
    const loaded = await loadInstalledCapabilities({ cwd, env: process.env, stateDir: options.stateDir });
    const capability = loaded.capabilities.find((installed) => installed.id === id);

    if (capability === undefined) {
      throw new CliUserInputError(`Installed capability not found: ${id}`);
    }

    const card = cardKind === "trust"
      ? await createTrustCardForInstalled(capability)
      : await createCapabilityCardForInstalled(capability);

    if (options.json) {
      console.log(JSON.stringify(card, null, 2));
      return;
    }

    if (card.cardKind === "trust") {
      console.log(`Trust Card ${card.capability.id}@${card.capability.version}`);
      console.log(`schema: ${card.schemaVersion}`);
      console.log(`trust: ${card.trustLevel}`);
      console.log(`maintainer: ${card.maintainer.name ?? card.maintainer.status}`);
      console.log(`disclaimer: ${card.disclaimer}`);
      return;
    }

    console.log(`Capability Card ${card.capability.id}@${card.capability.version}`);
    console.log(`schema: ${card.schemaVersion}`);
    console.log(`risk: ${card.risk.highestRisk}`);
    console.log(`auth: ${card.auth.provider ?? card.auth.type ?? "none"} ${card.auth.placement}`);
    console.log(`credential: redacted`);
  }, `Failed to generate Capability Card for ${id}`));




const policyCommand = program
  .command("policy")
  .description("Inspect and validate OpenCap policy files.");

policyCommand
  .command("validate")
  .argument("<path>", "Policy YAML file")
  .option("--json", "Output JSON")
  .description("Validate and lint a policy file before activation.")
  .action((path: string, options: { json?: boolean }) => runCliAction(async () => {
    const filePath = resolveCliPath(path);
    const result = validatePolicyYml(await readFile(filePath, "utf8"), { sourcePath: filePath });

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.findings.length === 0) {
      console.log(`Policy valid: ${filePath}`);
    } else {
      for (const finding of result.findings) {
        console.log(formatPolicyFinding(finding));
      }
    }

    if (!result.ok) {
      process.exitCode = 1;
    }
  }, `Failed to validate policy ${path}`));

policyCommand
  .command("simulate")
  .option("--before <path>", "Policy YAML before the change")
  .requiredOption("--after <path>", "Policy YAML after the change")
  .requiredOption("--scenarios <path>", "Policy simulation scenarios YAML file")
  .option("--json", "Output JSON")
  .description("Simulate policy changes before activation and report decision diff findings.")
  .action((options: { before?: string; after: string; scenarios: string; json?: boolean }) => runCliAction(async () => {
    const beforePath = options.before === undefined ? undefined : resolveCliPath(options.before);
    const afterPath = resolveCliPath(options.after);
    const scenariosPath = resolveCliPath(options.scenarios);
    const report = simulatePolicyDiff({
      policyBefore: beforePath === undefined ? undefined : await readFile(beforePath, "utf8"),
      policyAfter: await readFile(afterPath, "utf8"),
      scenarios: parsePolicyScenariosDocument(await readFile(scenariosPath, "utf8")),
    });

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else if (report.findings.length === 0) {
      console.log("Policy simulation diff: no changes.");
    } else {
      for (const finding of report.findings) {
        console.log(formatPolicySimulationFinding(finding));
      }
    }

    if (!report.ok) {
      process.exitCode = 1;
    }
  }, "Failed to simulate policy diff"));

program
  .command("doctor")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--registry <path>", "Registry root directory")
  .option("--json", "Output JSON")
  .description("Check local OpenCap development environment health.")
  .action((options: { stateDir?: string; registry?: string; json?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const registryDir = resolveRegistryDir({ cwd, env: process.env, registryDir: options.registry });
    const statePaths = getLocalStatePaths({ cwd, env: process.env, stateDir: options.stateDir });
    const installed = await listInstalledCapabilities({ cwd, env: process.env, stateDir: options.stateDir });
    const invalidInstalled = installed.filter((capability) => capability.status === "invalid");
    const policy = await policyStatus(statePaths.policiesFile);
    const report = {
      schemaVersion: "opencap.doctor.v1",
      environment: {
        node: process.version,
        pnpm: pnpmVersion(),
      },
      registry: {
        path: registryDir,
        status: await pathStatus(registryDir),
      },
      stateDir: {
        path: statePaths.root,
        status: await pathStatus(statePaths.root),
        writable: await writableStatus(statePaths.root),
      },
      installed: {
        total: installed.length,
        valid: installed.length - invalidInstalled.length,
        invalid: invalidInstalled.length,
      },
      policy: {
        path: statePaths.policiesFile,
        status: policy,
      },
      packages: await workspacePackageVersions(),
    };

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log("OpenCap doctor");
    console.log(`node: ${report.environment.node}`);
    console.log(`pnpm: ${report.environment.pnpm}`);
    console.log(`registry: ${report.registry.status} ${report.registry.path}`);
    console.log(`state_dir: ${report.stateDir.status} ${report.stateDir.path}`);
    console.log(`state_dir_writable: ${report.stateDir.writable}`);
    console.log(`installed: ${report.installed.total} total, ${report.installed.invalid} invalid`);
    console.log(`policy: ${report.policy.status} ${report.policy.path}`);
  }, "Failed to run doctor"));

program
  .command("invoke")
  .argument("<id>", "Capability id")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--input <file>", "JSON input file")
  .option("--input-json <json>", "Inline JSON input")
  .option("--dry-run", "Build an invocation plan without external execution")
  .option("--yes", "Approve CLI ask confirmations when allowed")
  .option("--json", "Output JSON")
  .option("--verbose", "Include redacted evidence in invoke output")
  .option("--explain", "Show policy decision trace summary")
  .description("Invoke an installed Capability.")
  .action((id: string, options: { stateDir?: string; input?: string; inputJson?: string; dryRun?: boolean; yes?: boolean; json?: boolean; verbose?: boolean; explain?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const input = await parseInvokeInput(options);
    const loaded = await loadInstalledCapabilities({ cwd, env: process.env, stateDir: options.stateDir });
    const capability = loaded.capabilities.find((installed) => installed.id === id);

    if (capability === undefined) {
      throw new CliUserInputError(`Installed capability not found: ${id}`);
    }

    if (!options.json) {
      printLifecycleWarning(createCapabilityLifecycleWarning(capability.manifest, "invoke"));
    }

    const policySet = await loadPolicySet({ cwd, env: process.env, stateDir: options.stateDir });
    const policy = evaluatePolicy(policySet, {
      capabilityId: capability.id,
      permissions: capability.manifest.permissions,
      channel: "cli",
      trustLevel: trustLevelFromMetadata(capability.manifest.metadata),
    });
    const sqliteLogger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });
    const capabilityIdentities = new Map(loaded.capabilities.map((installed) => [installed.id, createCapabilityLedgerIdentity({
      manifest: installed.manifest,
      packagePath: installed.installPath,
      manifestPath: installed.manifestPath,
    })]));
    const logger = new RuntimeLedgerAuditLogger(
      sqliteLogger,
      new FileRuntimeLedgerStore({ cwd, env: process.env, stateDir: options.stateDir }),
      { capabilityIdentityResolver: (capabilityId) => capabilityIdentities.get(capabilityId) },
    );

    try {
      if (options.dryRun) {
        const plan = await buildHttpDryRunPlan(capability.manifest, input);
        await logger.record({
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          channel: "cli",
          capabilityId: capability.id,
          status: "dry_run",
          policyDecision: policy.decision,
          confirmationStatus: policy.decision === "deny" ? "denied" : "approved",
          reason: `Dry run plan generated. ${policy.reason}`,
          matchedRuleId: policy.matchedRuleId,
          inputHash: hashInput(input),
          inputRedactedJson: stableJsonStringify(redactInput(input)),
          resolvedUrl: plan.url,
          requestStarted: false,
          executionHttpMethod: plan.method,
          egressDataClasses: plan.egressPreview?.dataClasses,
          egressTargetOrigin: plan.egressPreview?.targetOrigin,
          egressRedactedPreviewJson: plan.egressPreview === undefined ? undefined : stableJsonStringify(plan.egressPreview),
          policyTrace: policy.decisionTrace,
        });
        const envelope = resultEnvelopeFromDryRunPlan(plan, {
          evidence: {
            policyDecision: policy.decision,
            inputHash: hashInput(input),
            policyTrace: policy.decisionTrace,
          },
        });
        printInvokeResult(envelope, { json: options.json, verbose: options.verbose });
        if (options.explain && !options.json) {
          printPolicyExplain(policy.decisionTrace);
        }
        return;
      }

      const confirmationRequest = {
        capabilityId: capability.id,
        policy,
        channel: "cli" as const,
        operationSummary: capability.id,
        input,
      };
      const confirmation = await new CliConfirmationHandler({ assumeYes: options.yes }).confirm(confirmationRequest);

      if (confirmation.status !== "approved") {
        await logger.record(createConfirmationAuditEvent(confirmationRequest, confirmation));
        process.exitCode = 1;
        const envelope = blockedResultEnvelope({
          capabilityId: capability.id,
          reason: confirmation.reason,
          evidence: {
            policyDecision: policy.decision,
            confirmationStatus: confirmation.status,
            inputHash: hashInput(input),
          },
        });
        printInvokeResult(envelope, { json: options.json, verbose: options.verbose });
        return;
      }

      const result = await executeHttpCapability(capability.manifest, input, {
        env: process.env,
        auditLogger: logger,
        channel: "cli",
        consentReceipt: createConsentReceiptAuditEvidence(confirmationRequest, confirmation),
      });
      const envelope = resultEnvelopeFromHttpExecutionResult(result, {
        evidence: {
          policyDecision: policy.decision,
          confirmationStatus: confirmation.status,
          inputHash: hashInput(input),
        },
      });
      if (envelope.isError) {
        process.exitCode = 1;
      }
      printInvokeResult(envelope, { json: options.json, verbose: options.verbose });
    } finally {
      sqliteLogger.close();
    }
  }, `Failed to invoke ${id}`));

program
  .command("serve")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--mcp", "Expose installed Capabilities as MCP tools")
  .description("Start the OpenCap runtime.")
  .action((options: { stateDir?: string; mcp?: boolean }) => runCliAction(async () => {
    if (options.mcp) {
      await serveOpenCapMcpStdio({
        cwd: process.env.INIT_CWD ?? process.cwd(),
        stateDir: options.stateDir,
        env: process.env,
      });
      return;
    }

    console.log("runtime is not implemented yet");
  }, "Failed to start runtime"));

const ledgerCommand = program
  .command("ledger")
  .description("Inspect local Runtime Ledger records.");

const conformanceCommand = program
  .command("conformance")
  .description("Inspect conformance evidence records.");

const registryCommand = program
  .command("registry")
  .description("Inspect local Registry evidence.");

const registryAdvisoryCommand = registryCommand
  .command("advisory")
  .description("Inspect local Registry advisory evidence.");

const advisoryCommand = program
  .command("advisory")
  .description("Inspect local Capability advisory evidence.");

const metricsCommand = program
  .command("metrics")
  .description("Inspect local audit metrics.");

const releaseCommand = program
  .command("release")
  .description("Inspect local release evidence.");

const releasePackageCommand = releaseCommand
  .command("package")
  .description("Inspect npm package release readiness.");

const releaseArtifactCommand = releaseCommand
  .command("artifact")
  .description("Inspect saved release evidence artifacts.");

conformanceCommand
  .command("report")
  .requiredOption("--records <path>", "Conformance records root directory")
  .option("--json", "Output JSON")
  .description("Generate a conformance evidence summary report.")
  .action((options: { records: string; json?: boolean }) => runCliAction(async () => {
    const recordsRoot = resolveCliPath(options.records);
    const summary = await buildConformanceSummary(recordsRoot);

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
      if (summary.invalidRecords > 0 || summary.failedRecords > 0) {
        process.exitCode = 1;
      }
      return;
    }

    console.log("profile result checks artifacts path");
    for (const record of summary.records) {
      console.log([
        record.profile,
        record.result,
        record.checks.total,
        record.artifacts.count,
        record.path,
      ].join(" "));
    }

    for (const invalid of summary.invalid) {
      console.log([
        "invalid",
        "invalid",
        invalid.issues.length,
        "-",
        invalid.path,
      ].join(" "));
    }

    if (summary.invalidRecords > 0 || summary.failedRecords > 0) {
      process.exitCode = 1;
    }
  }, "Failed to generate conformance report"));

advisoryCommand
  .command("check")
  .requiredOption("--state-dir <path>", "Local OpenCap state directory")
  .requiredOption("--registry <path>", "Registry root directory")
  .option("--capability <id>", "Filter checks by installed capability id")
  .option("--severity <value>", "Filter advisory matches by severity")
  .option("--status <value>", "Filter advisory matches by status")
  .option("--output <path>", "Write advisory check JSON report to a file")
  .option("--json", "Output JSON")
  .description("Check installed capabilities against local Registry advisories.")
  .action((options: { stateDir: string; registry: string; capability?: string; severity?: string; status?: string; output?: string; json?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const filters = resolveAdvisoryCheckFilters(options);
    const stateDir = getLocalStatePaths({ cwd, env: process.env, stateDir: options.stateDir }).root;
    const registryPath = resolveRegistryDir({ cwd, env: process.env, registryDir: options.registry });
    const result = await checkInstalledCapabilityAdvisories({
      cwd,
      env: process.env,
      stateDir: options.stateDir,
      registryDir: options.registry,
    });
    const report = buildAdvisoryCheckReport({
      stateDir,
      registryPath,
      result,
      filters,
    });
    const exitCode = advisoryCheckExitCode(report);

    if (options.output !== undefined) {
      await writeAdvisoryJsonOutput(options.output, report);
    }

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      if (exitCode !== undefined) {
        process.exitCode = exitCode;
      }
      return;
    }

    printAdvisoryCheckReport(report);
    if (exitCode !== undefined) {
      process.exitCode = exitCode;
    }
  }, "Failed to check Capability advisories"));

registryAdvisoryCommand
  .command("show")
  .argument("<advisory-id>", "Capability advisory id to inspect")
  .requiredOption("--registry <path>", "Registry root directory")
  .option("--json", "Output JSON")
  .description("Show a local Registry Capability advisory detail.")
  .action((id: string, options: { registry: string; json?: boolean }) => runCliAction(async () => {
    const registryPath = resolveCliPath(options.registry);
    const result = await validateCapabilityAdvisoryPath(registryPath);
    const selected = selectRegistryAdvisory(id, result);
    const report = buildRegistryAdvisoryDetailReport(result.targetPath, selected);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    printRegistryAdvisoryDetailReport(report);
  }, "Failed to show Registry advisory"));

registryAdvisoryCommand
  .command("list")
  .requiredOption("--registry <path>", "Registry root directory")
  .option("--capability <id>", "Filter advisories by capability id")
  .option("--severity <value>", "Filter advisories by severity: low,medium,high,critical")
  .option("--status <value>", "Filter advisories by advisory status")
  .option("--json", "Output JSON")
  .description("List local Registry Capability advisories.")
  .action((options: RegistryAdvisoryListCommandOptions) => runCliAction(async () => {
    const registryPath = resolveCliPath(options.registry);
    const filters = resolveRegistryAdvisoryListFilters(options);
    const result = await validateCapabilityAdvisoryPath(registryPath);
    const report = buildRegistryAdvisoryListReport(result, filters);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      if (report.invalidAdvisoryCount > 0) {
        process.exitCode = 1;
      }
      return;
    }

    printRegistryAdvisoryListReport(report);
    if (report.invalidAdvisoryCount > 0) {
      process.exitCode = 1;
    }
  }, "Failed to list Registry advisories"));

registryCommand
  .command("search")
  .argument("[query]", "Search query matched against id, name, and description")
  .option("--registry <path>", "Registry root directory", "registry")
  .option("--include-lifecycle <values>", "Comma-separated lifecycle statuses to include: yanked,revoked")
  .option("--json", "Output JSON")
  .description("Search local Registry capabilities without installing them.")
  .action((query: string | undefined, options: RegistrySearchCommandOptions) => runCliAction(async () => {
    const registryRoot = resolveCliPath(options.registry ?? "registry");
    const includeLifecycle = parseRegistrySearchIncludeLifecycle(options.includeLifecycle);
    const search = await searchRegistryCapabilities(registryRoot, { query, includeLifecycle });
    const report = buildRegistrySearchReport(search);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      if (report.invalidCount > 0) {
        process.exitCode = 1;
      }
      return;
    }

    printRegistrySearchReport(report);
    if (report.invalidCount > 0) {
      process.exitCode = 1;
    }
  }, "Failed to search Registry"));

registryCommand
  .command("show")
  .argument("<id>", "Capability id to inspect")
  .option("--registry <path>", "Registry root directory", "registry")
  .option("--include-lifecycle <values>", "Comma-separated lifecycle statuses to include: yanked,revoked")
  .option("--json", "Output JSON")
  .description("Show a local Registry Capability summary without installing it.")
  .action((id: string, options: RegistrySearchCommandOptions) => runCliAction(async () => {
    const registryRoot = resolveCliPath(options.registry ?? "registry");
    const includeLifecycle = parseRegistrySearchIncludeLifecycle(options.includeLifecycle);
    const search = await searchRegistryCapabilities(registryRoot, { query: id, includeLifecycle });
    const selected = selectRegistryCapabilityResult(id, search);
    const report = buildRegistryCapabilityDetailReport(search.targetPath, selected);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    printRegistryCapabilityDetailReport(report);
  }, "Failed to show Registry capability"));

registryCommand
  .command("report")
  .option("--registry <path>", "Registry root directory", "registry")
  .option("--json", "Output JSON")
  .description("Generate a local Registry quality summary report.")
  .action((options: { registry?: string; json?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const registryRoot = isAbsolute(options.registry ?? "registry")
      ? options.registry ?? "registry"
      : resolve(cwd, options.registry ?? "registry");
    const summary = await buildRegistryQualitySummary(registryRoot);

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    console.log("id category lifecycle advisory quality default_install blocking_reasons");
    for (const capability of summary.capabilities) {
      console.log([
        capability.id,
        capability.category,
        capability.lifecycle.status,
        capability.advisory.status,
        capability.qualityScore.band,
        capability.defaultInstallTrusted ? "yes" : "no",
        capability.blockingReasons.length > 0 ? capability.blockingReasons.join(",") : "-",
      ].join(" "));
    }
  }, "Failed to generate Registry report"));

releasePackageCommand
  .command("report")
  .requiredOption("--package <workspace-name>", "Workspace package name to inspect")
  .option("--pack-json <path>", "Path to npm pack --dry-run --json output")
  .option("--json", "Output JSON")
  .description("Generate a local npm package readiness report.")
  .action((options: { package: string; packJson?: string; json?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const packageJsonPath = releasePackageJsonPath(options.package, cwd);
    const packFiles = options.packJson === undefined
      ? undefined
      : await readNpmPackJsonFiles(resolveCliPath(options.packJson));
    const report = await buildNpmPackageReadinessReportFromFile(packageJsonPath, { packFiles });

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    printNpmPackageReadinessReport(report);
  }, "Failed to generate release package report"));

releaseCommand
  .command("evidence")
  .requiredOption("--registry <path>", "Registry root directory")
  .requiredOption("--records <path>", "Conformance records root directory")
  .option("--package <workspace-name>", "Workspace package name to include")
  .option("--pack-json <path>", "Path to npm pack --dry-run --json output")
  .option("--target <name>", "Release target name", "v0.1 Local Runtime")
  .option("--commit <sha>", "Release source commit", "local")
  .option("--date <date>", "Release evidence date")
  .option("--generated-at <iso>", "Release evidence generation timestamp")
  .option("--output <path>", "Write release evidence JSON bundle to a file")
  .option("--json", "Output JSON")
  .description("Generate a local release evidence bundle.")
  .action((options: { registry: string; records: string; package?: string; packJson?: string; target?: string; commit?: string; date?: string; generatedAt?: string; output?: string; json?: boolean }) => runCliAction(async () => {
    if (options.package !== undefined && options.packJson === undefined) {
      throw new CliUserInputError("Use --pack-json when --package is provided.");
    }
    if (options.package === undefined && options.packJson !== undefined) {
      throw new CliUserInputError("Use --package when --pack-json is provided.");
    }

    const cwd = process.env.INIT_CWD ?? process.cwd();
    const generatedAt = resolveReleaseGeneratedAt(options.generatedAt);
    const releaseDate = resolveReleaseDate(options.date, generatedAt);
    const registryRoot = resolveCliPath(options.registry);
    const recordsRoot = resolveCliPath(options.records);
    const registryQualitySummary = await buildRegistryQualitySummary(registryRoot);
    const conformanceSummary = await buildConformanceSummary(recordsRoot);
    const packageReadinessReports: NpmPackageReadinessReport[] = [];

    if (options.package !== undefined && options.packJson !== undefined) {
      const packageJsonPath = releasePackageJsonPath(options.package, cwd);
      const packFiles = await readNpmPackJsonFiles(resolveCliPath(options.packJson));
      packageReadinessReports.push(await buildNpmPackageReadinessReportFromFile(packageJsonPath, { packFiles }));
    }

    const bundle = buildReleaseEvidenceBundle({
      target: options.target ?? "v0.1 Local Runtime",
      commit: options.commit ?? "local",
      date: releaseDate,
      generatedAt,
      registryQualitySummary,
      conformanceSummary,
      packageReadinessReports,
      commands: {
        registry_report: "pass",
        conformance_report: "pass",
        package_readiness_report: packageReadinessReports.length > 0 ? "pass" : "not-run",
      },
    });

    if (options.output !== undefined) {
      await writeReleaseEvidenceOutput(options.output, bundle);
    }

    if (options.json) {
      console.log(JSON.stringify(bundle, null, 2));
      return;
    }

    printReleaseEvidenceBundle(bundle);
  }, "Failed to generate release evidence"));

releaseArtifactCommand
  .command("validate")
  .requiredOption("--file <path>", "Release evidence JSON artifact to validate")
  .option("--output <path>", "Write validation report JSON to a file")
  .option("--json", "Output JSON")
  .description("Validate a saved release evidence artifact.")
  .action((options: { file: string; output?: string; json?: boolean }) => runCliAction(async () => {
    const artifact = await readReleaseArtifactJson(resolveCliPath(options.file));
    const report = validateReleaseEvidenceArtifact(artifact);

    if (options.output !== undefined) {
      await writeReleaseJsonOutput(options.output, report);
    }

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReleaseArtifactValidationReport(report);
    }

    if (!report.valid) {
      process.exitCode = 1;
    }
  }, "Failed to validate release artifact"));

ledgerCommand
  .command("export")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--kind <kind>", "Filter by ledger kind: capability, policy, invocation, compatibility")
  .option("--capability <id>", "Filter by Capability id")
  .option("--limit <number>", "Number of ledger records to export", "100")
  .description("Export redacted Runtime Ledger records.")
  .action((options: { stateDir?: string; json?: boolean; kind?: string; capability?: string; limit?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const kind = parseLedgerKind(options.kind);
    const limit = parseLimit(options.limit, 100);
    const store = new FileRuntimeLedgerStore({ cwd, env: process.env, stateDir: options.stateDir });
    const records: LedgerRecordV1[] = [];

    if (kind === undefined || kind === "capability") {
      records.push(...(await store.listCapabilityRecords({ capabilityId: options.capability })).records);
    }
    if ((kind === undefined || kind === "policy") && options.capability === undefined) {
      records.push(...(await store.listPolicyRecords()).records);
    }
    if (kind === undefined || kind === "invocation") {
      records.push(...(await store.listInvocationRecords({ capabilityId: options.capability })).records);
    }
    if (kind === undefined || kind === "compatibility") {
      records.push(...(await store.listCompatibilityRecords({ capabilityId: options.capability })).records);
    }

    const limited = records
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt) || left.recordId.localeCompare(right.recordId))
      .slice(0, limit);

    if (options.json) {
      console.log(JSON.stringify(limited, null, 2));
      return;
    }

    if (limited.length === 0) {
      console.log("No ledger records found.");
      return;
    }

    console.log("recorded_at kind capability_id status record_id");
    for (const record of limited) {
      console.log(formatLedgerLine(record));
    }
  }, "Failed to export ledger records"));

metricsCommand
  .command("summary")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--since <iso-time>", "Filter metrics at or after an ISO timestamp")
  .option("--until <iso-time>", "Filter metrics at or before an ISO timestamp")
  .option("--capability <id>", "Filter metrics by Capability id")
  .description("Summarize local audit metrics.")
  .action((options: { stateDir?: string; json?: boolean; since?: string; until?: string; capability?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const since = parseSince(options.since);
    const until = parseUntil(options.until);
    const logger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });

    try {
      const events = await logger.recent(10_000, {
        since,
        until,
        capabilityId: options.capability,
      });
      const summary = buildLocalMetricsSummary(events, {
        since,
        until,
        capabilityId: options.capability,
      });

      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      printLocalMetricsSummary(summary);
    } finally {
      logger.close();
    }
  }, "Failed to summarize local audit metrics"));

metricsCommand
  .command("capabilities")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--since <iso-time>", "Filter metrics at or after an ISO timestamp")
  .option("--until <iso-time>", "Filter metrics at or before an ISO timestamp")
  .description("Summarize local audit metrics by Capability.")
  .action((options: { stateDir?: string; json?: boolean; since?: string; until?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const since = parseSince(options.since);
    const until = parseUntil(options.until);
    const logger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });

    try {
      const events = await logger.recent(10_000, { since, until });
      const report = buildLocalMetricsCapabilitiesReport(events);

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      printLocalMetricsCapabilitiesReport(report);
    } finally {
      logger.close();
    }
  }, "Failed to summarize capability metrics"));

metricsCommand
  .command("security")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--since <iso-time>", "Filter metrics at or after an ISO timestamp")
  .option("--until <iso-time>", "Filter metrics at or before an ISO timestamp")
  .description("Summarize local security audit metrics.")
  .action((options: { stateDir?: string; json?: boolean; since?: string; until?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const since = parseSince(options.since);
    const until = parseUntil(options.until);
    const logger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });

    try {
      const events = await logger.recent(10_000, { since, until });
      const report = buildLocalMetricsSecurityReport(events);

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      printLocalMetricsSecurityReport(report);
    } finally {
      logger.close();
    }
  }, "Failed to summarize security metrics"));

program
  .command("logs")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--limit <number>", "Number of recent log entries to show", "20")
  .option("--capability <id>", "Filter logs by Capability id")
  .option("--status <status>", "Filter logs by status: blocked, denied, executed, dry_run")
  .option("--since <iso-time>", "Filter logs at or after an ISO timestamp")
  .description("Show invocation logs.")
  .action((options: { stateDir?: string; json?: boolean; limit?: string; capability?: string; status?: string; since?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const limit = parseLimit(options.limit, 20);
    const query = {
      capabilityId: options.capability,
      status: parseAuditStatus(options.status),
      since: parseSince(options.since),
    };
    const logger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });

    try {
      const events = await logger.recent(limit, query);

      if (options.json) {
        console.log(JSON.stringify(events, null, 2));
        return;
      }

      if (events.length === 0) {
        console.log("No invocation logs found.");
        return;
      }

      console.log("timestamp capability_id decision status confirmation duration_ms reason");
      for (const event of events) {
        console.log(formatLogLine(event));
      }
    } finally {
      logger.close();
    }
  }, "Failed to read invocation logs"));

const decisionLogCommand = program
  .command("decision-log")
  .description("Export redacted policy decision logs.");

decisionLogCommand
  .command("export")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--limit <number>", "Number of recent decision records to export", "100")
  .option("--capability <id>", "Filter by Capability id")
  .option("--decision <decision>", "Filter by policy decision: allow, ask, deny")
  .option("--since <iso-time>", "Filter records at or after an ISO timestamp")
  .option("--until <iso-time>", "Filter records at or before an ISO timestamp")
  .description("Export redacted policy trace and decision summaries.")
  .action((options: { stateDir?: string; json?: boolean; limit?: string; capability?: string; decision?: string; since?: string; until?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const logger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });

    try {
      const events = await logger.recent(parseLimit(options.limit, 100), {
        capabilityId: options.capability,
        policyDecision: parsePolicyDecision(options.decision),
        since: parseSince(options.since),
        until: parseSince(options.until),
      });
      const records = exportDecisionLogRecords(events);

      if (options.json) {
        console.log(JSON.stringify(records, null, 2));
        return;
      }

      if (records.length === 0) {
        console.log("No decision log records found.");
        return;
      }

      console.log("timestamp invocation_id capability_id decision status policy_revision trace_id reason_code");
      for (const record of records) {
        console.log(formatDecisionLogLine(record));
      }
    } finally {
      logger.close();
    }
  }, "Failed to export decision logs"));

const argv = process.argv[2] === "--" ? [process.argv[0], process.argv[1], ...process.argv.slice(3)] : process.argv;

await program.parseAsync(argv);
