export { classifyInput } from "./input-classifier.js";
export type { InputClassificationAction, InputClassificationConfidence, InputClassificationFinding, InputClassificationOptions, InputClassificationResult, InputDataClass } from "./input-classifier.js";
export { createDryRunEnvelope, createGateDecision, createRuntimeRequestId, gateDecisionSemantics } from "./domain.js";
export type { AuditPreview, AuditWriteResult, CallerDescriptor, CapabilityIdentity, CapabilityLifecycleState, CapabilitySelector, ConsentReceipt, ConsentRequest, DerivedCapabilityMetadata, EgressSummary, ExecutionEvidence, ExecutionOutcome, ExecutionSideEffectKind, GateDecision, GateDecisionInput, GateDecisionKind, GateDecisionSemantics, GateStage, GateTerminalStatus, HostCapability, HostDescriptor, InstallMetadata, InstalledCapabilityRecord, InvocationChannel, InvocationPlanV1, InvocationRequestV1, PlannedExecution, ResultEvidence, ResultProvenance, RiskSummary, RuntimeContext, RuntimeEnvironment, RuntimeErrorCategory, RuntimeErrorV1, RuntimeGate, RuntimeGateId, RuntimeKernel, RuntimeResultEnvelope, RuntimeResultStatus, TrustSummary } from "./domain.js";
export { defaultDataEgressPolicy, evaluateDataEgressPolicy } from "./data-egress-policy.js";
export { buildFieldLevelEgressMap } from "./egress-map.js";
export { minimizeInputByEgressMap } from "./input-minimization.js";
export { buildRedactedEgressPreview } from "./egress-preview.js";
export { evaluateQuotaBudgetGate } from "./quota-budget-gate.js";
export { createProblemDetailsFromProviderRateLimit, createProblemDetailsFromQuotaBudgetGate } from "./problem-details.js";
export { evaluateFinancialConsentSpendGate } from "./financial-consent-spend-gate.js";
export { defaultExternalSendAbuseThrottleRule, evaluateAbuseThrottleGate } from "./abuse-throttle.js";
export { POLICY_TRACE_VERSION } from "./policy-trace.js";
export { FileRuntimeLedgerStore, LEDGER_RECORD_VERSION, createLedgerRecordId } from "./ledger.js";
export { CARD_SCHEMA_VERSION, TRUST_CARD_DISCLAIMER, createCapabilityCard, createCardId, createCompatibilityCard, createConsentCard, createTrustCard, createTrustCardFromInstalledCapability } from "./card.js";
export { CAPABILITY_IDENTITY_VERSION, capabilityIdentityKey, capabilityLifecycleSemantics, createCapabilityIdentity, createCapabilityIdentityRef, validateCapabilityIdentity } from "./identity.js";
export { FilePolicyLedger } from "./policy-ledger.js";
export { validatePolicyYml } from "./policy-validator.js";
export { simulatePolicyDiff } from "./policy-simulation.js";
export { applyPolicyOverrides, consumePolicyOverride, createPolicyOverrideAuditEvent, validatePolicyOverrideRecord } from "./policy-override.js";
export { exportDecisionLogRecords } from "./decision-log.js";
export { credentialAuditEvidence, resolveEnvCredential } from "./secret-resolver.js";
export { defaultHttpRetryPolicy, evaluateHttpRetryPolicy } from "./retry-policy.js";
export { evaluateCompositionFailureRecovery } from "./composition-recovery.js";
export { USAGE_EVENT_SCHEMA, createUsageEventFromAuditEvent } from "./usage-event.js";
export { USAGE_EXPORT_HEADER_SCHEMA, USAGE_EXPORT_REDACTION_PROFILE, USAGE_EXPORT_SCHEMA, USAGE_EXPORT_VERSION, createUsageExportEnvelope, createUsageExportJsonlHeader, serializeUsageExportJsonl } from "./usage-export.js";
export { evaluateTrustLevelTransition } from "./trust-transition.js";
export { evaluateRevokedCapabilityInvokeGate } from "./lifecycle-gate.js";
export { CAPABILITY_QUALITY_SCORE_RUBRIC_VERSION, calculateCapabilityQualityScore } from "./quality-score.js";
export type { DataEgressContext, DataEgressDecision, DataEgressDecisionEvidence, DataEgressDecisionResult, DataEgressDestination, DataEgressPolicyMatch, DataEgressPolicyRule, DataEgressPolicySet, RenderedEgressField } from "./data-egress-policy.js";
export type { EgressMapManifestLike, FieldLevelEgressMap, FieldLevelEgressMapEntry } from "./egress-map.js";
export type { MinimizedInputResult } from "./input-minimization.js";
export type { RedactedEgressPreview, RedactedEgressPreviewOptions } from "./egress-preview.js";
export type { BudgetLimit, BudgetRule, QuotaBudgetContext, QuotaBudgetDecision, QuotaBudgetEvidence, QuotaBudgetMatch, QuotaBudgetPolicy, QuotaLimit, QuotaRule } from "./quota-budget-gate.js";
export type { CreateProviderRateLimitProblemDetailsInput, CreateQuotaBudgetProblemDetailsInput, ProblemDetailsType, ProblemDetailsV1 } from "./problem-details.js";
export type { FinancialConsentDecision, FinancialConsentSpendContext, FinancialConsentSpendEvidence } from "./financial-consent-spend-gate.js";
export type { AbuseThrottleContext, AbuseThrottleDecision, AbuseThrottleEvidence, AbuseThrottleLimit, AbuseThrottleMatch, AbuseThrottlePolicy, AbuseThrottleRule, AbuseThrottleUsageSnapshot } from "./abuse-throttle.js";
export type { PolicyDecisionTraceDecision, PolicyDecisionTraceGate, PolicyDecisionTraceV1 } from "./policy-trace.js";
export type { CapabilityLedgerEvent, CapabilityLedgerQuery, CapabilityLedgerRecordV1, CapabilityLedgerStore, CompatibilityCheckResult, CompatibilityLedgerCapabilityRef, CompatibilityLedgerCheck, CompatibilityLedgerHostRef, CompatibilityLedgerLookup, CompatibilityLedgerProfileRef, CompatibilityLedgerQuery, CompatibilityLedgerRecordV1, CompatibilityLedgerResult, CompatibilityLedgerStore, InvocationLedgerConsentSummary, InvocationLedgerExecutionSummary, InvocationLedgerQuery, InvocationLedgerRecordV1, InvocationLedgerStore, LedgerAppendResult, LedgerQueryOptions, LedgerQueryResult, LedgerRecordBase, LedgerRecordKind, LedgerRecordV1, LedgerRecordVersion, PolicyLedgerChangedBy, PolicyLedgerEvent, PolicyLedgerQuery, PolicyLedgerRecordV1, PolicyLedgerStore, RuntimeLedgerStore } from "./ledger.js";
export type { CapabilityCardAuthPlacement, CapabilityCardAuthSummary, CapabilityCardCapabilitySummary, CapabilityCardDocumentV1, CardDocumentBase, CardDocumentV1, CardKind, CardSchemaVersion, CardSourceKind, CardSourceRef, CompatibilityCardDocumentV1, ConsentCardDocumentV1, ConsentCardFieldSummary, CreateCapabilityCardInput, CreateCardOptions, CreateCompatibilityCardInput, CreateConsentCardInput, CreateTrustCardFromInstalledCapabilityInput, CreateTrustCardInput, TrustCardAdvisorySummary, TrustCardDocumentV1, TrustCardMaintainerStatus, TrustCardMaintainerSummary, TrustCardProvenanceSummary, TrustCardQualitySummary, TrustCardReviewStatus, TrustCardReviewSummary, TrustCardTestStatus, TrustCardTestSummary } from "./card.js";
export type { CapabilityIdentityRefV1, CapabilityIdentityValidationCode, CapabilityIdentityValidationFinding, CapabilityIdentityValidationResult, CapabilityIdentityValidationSeverity, CapabilityIdentityVersion, CapabilityLifecycleSemantics, CreateCapabilityIdentityInput } from "./identity.js";
export type { ActivatePolicyRevisionInput, FailedPolicyActivationInput, FilePolicyLedgerOptions, PolicyActiveRevisionV1, PolicyChangedBy, PolicyChangeKind, PolicyChangeRecordV1 } from "./policy-ledger.js";
export type { PolicyValidationFinding, PolicyValidationFindingCode, PolicyValidationOptions, PolicyValidationResult, PolicyValidationSeverity } from "./policy-validator.js";
export type { PolicySimulationDiffCategory, PolicySimulationFinding, PolicySimulationInput, PolicySimulationReport, PolicySimulationScenario, PolicySimulationSeverity } from "./policy-simulation.js";
export type { ConsumedPolicyOverrideResult, PolicyOverrideCapabilityStatus, PolicyOverrideContext, PolicyOverrideCreatedBy, PolicyOverrideDataEgressDecision, PolicyOverrideRecordV1, PolicyOverrideResult, PolicyOverrideSafetyGates, PolicyOverrideType, PolicyOverrideValidationCode, PolicyOverrideValidationFinding } from "./policy-override.js";
export type { DecisionLogRecord } from "./decision-log.js";
export type { CredentialAuditEvidence, ResolvedCredential, ResolvedCredentialType, SecretCredentialApplyMode, SecretCredentialSource, SecretExecutionTarget, SecretResolveMode, SecretResolveRequest, SecretResolverAuth } from "./secret-resolver.js";
export type { HttpRetryIdempotencyMode, HttpRetryPolicyDecision, HttpRetryPolicyInput, HttpRetryPolicyV1, HttpRetryReasonCode } from "./retry-policy.js";
export type { CompositionFailureRecoveryAction, CompositionFailureRecoveryDecision, CompositionFailureRecoveryInput, CompositionFailureRecoveryOutcome, CompositionRecoveryStep, CompositionStepRecoveryOutcome, CompositionStepRole, CompositionStepSideEffectKind } from "./composition-recovery.js";
export type { CreateUsageEventOptions, UsageEventChannel, UsageEventOutcome, UsageEventSchema, UsageEventSubject, UsageEventV1 } from "./usage-event.js";
export type { CreateUsageExportOptions, UsageExportCompatibility, UsageExportEnvelopeV1, UsageExportFilters, UsageExportFormat, UsageExportHeaderSchema, UsageExportHeaderV1, UsageExportRedactionProfile, UsageExportSchema, UsageExportVersion } from "./usage-export.js";
export type { TrustTransitionDecision, TrustTransitionEvidence, TrustTransitionFinding, TrustTransitionFindingCode, TrustTransitionFindingSeverity, TrustTransitionInput, TrustTransitionKind, TrustTransitionPolicyEffect, TrustTransitionTarget } from "./trust-transition.js";
export type { RevokedCapabilityInvokeGateDecision, RevokedCapabilityInvokeGateEvidence, RevokedCapabilityInvokeGateInput } from "./lifecycle-gate.js";
export type { CapabilityQualityScore, CapabilityQualityScoreBand, CapabilityQualityScoreDimensions, CapabilityQualityScoreInput, CapabilityQualityScoreRubricVersion } from "./quality-score.js";
export { sanitizeToolResult } from "./result-sanitizer.js";
export type { ResultSanitizerFinding, ResultSanitizerFindingCode, SanitizedToolResult, ToolResultSanitizerOptions } from "./result-sanitizer.js";
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { stdin as processStdin, stdout as processStdout } from "node:process";
import { createInterface } from "node:readline/promises";
import type { DatabaseSync } from "node:sqlite";
import { dirname, join, resolve } from "node:path";
import {
  validateCapabilityAdvisoryPath,
  validateManifestFile,
  type CapabilityAdvisory,
  type CapabilityAdvisoryValidationFailure,
  type CapabilityManifest,
  type CapabilityManifestLifecycleStatus,
  type CapabilityPermission,
} from "@opencap/spec";
import { parse as parseYaml } from "yaml";
import { buildFieldLevelEgressMap as buildFieldLevelEgressMapForRuntime } from "./egress-map.js";
import { buildRedactedEgressPreview as buildRedactedEgressPreviewForRuntime, type RedactedEgressPreview } from "./egress-preview.js";
import { classifyInput as classifyInputForRuntime } from "./input-classifier.js";
import { minimizeInputByEgressMap as minimizeInputByEgressMapForRuntime } from "./input-minimization.js";
import { POLICY_TRACE_VERSION, type PolicyDecisionTraceV1 } from "./policy-trace.js";
import { sanitizeToolResult, type ResultSanitizerFinding, type ToolResultSanitizerOptions } from "./result-sanitizer.js";
import type { DataEgressContext, DataEgressDecision, DataEgressDecisionResult } from "./data-egress-policy.js";
import { SecretMissingError, credentialAuditEvidence, resolveEnvCredential, type CredentialAuditEvidence } from "./secret-resolver.js";
import type { ExecutionEvidence, ExecutionOutcome, ExecutionSideEffectKind } from "./domain.js";

export const DEFAULT_STATE_DIR_NAME = "opencap.local";
export const OPENCAP_STATE_DIR_ENV = "OPENCAP_STATE_DIR";
export const DEFAULT_REGISTRY_DIR_NAME = "registry";
export const OPENCAP_REGISTRY_DIR_ENV = "OPENCAP_REGISTRY_DIR";
export const DEFAULT_POLICIES_YML = `default: ask
rules: []
`;

export interface ResolveStateDirOptions {
  cwd?: string;
  stateDir?: string;
  env?: Record<string, string | undefined>;
}

export interface LocalStatePaths {
  root: string;
  installedDir: string;
  tmpDir: string;
  cacheDir: string;
  policiesFile: string;
  logsDatabaseFile: string;
}

export interface ResolveRegistryDirOptions {
  cwd?: string;
  registryDir?: string;
  env?: Record<string, string | undefined>;
}

export interface RuntimeOptions extends ResolveStateDirOptions {}

export interface InstallCapabilityOptions extends ResolveStateDirOptions, ResolveRegistryDirOptions {
  id: string;
  force?: boolean;
}

export interface InstallCapabilityResult {
  id: string;
  sourceDir: string;
  destinationDir: string;
  manifest: CapabilityManifest;
  warnings: CapabilityLifecycleWarning[];
}

export interface InstalledCapability {
  id: string;
  version: string;
  installPath: string;
  manifestPath: string;
  manifest: CapabilityManifest;
}

export interface InstalledCapabilityLoadIssue {
  id: string;
  installPath: string;
  manifestPath: string;
  error: string;
}

export interface InstalledCapabilityLoadResult {
  capabilities: InstalledCapability[];
  invalid: InstalledCapabilityLoadIssue[];
}

export interface InstalledCapabilityAdvisoryMatch {
  capabilityId: string;
  installedVersion: string;
  advisoryId: string;
  severity: CapabilityAdvisory["severity"];
  status: CapabilityAdvisory["status"];
  affected: true;
  affectedVersions: string[];
  registryAction: CapabilityAdvisory["actions"]["registry"];
  runtimeDefault: CapabilityAdvisory["actions"]["runtime_default"];
  fixedVersion?: string | null;
  summary: string;
  modifiedAt: string;
}

export interface InstalledCapabilityAdvisoryCheckResult {
  checkedInstalledCapabilities: string[];
  matches: InstalledCapabilityAdvisoryMatch[];
  invalidAdvisories: CapabilityAdvisoryValidationFailure[];
}

export interface InstalledCapabilitySummary {
  id: string;
  installPath: string;
  version?: string;
  type?: string;
  risk: string;
  lifecycle: "installed" | "invalid" | CapabilityManifestLifecycleStatus;
  lifecycleWarning?: CapabilityLifecycleWarning;
  trustLevel?: string;
  maintainer?: string;
  license?: string;
  status: "enabled" | "invalid";
  error?: string;
}

export type CapabilityLifecycleWarningPhase = "install" | "list" | "invoke";

export interface CapabilityLifecycleWarning {
  phase: CapabilityLifecycleWarningPhase;
  capabilityId: string;
  lifecycle: CapabilityManifestLifecycleStatus;
  reason: string;
  since: string;
  advisory?: string;
  replacement?: string;
  message?: string;
  summary: string;
  warningRequired: true;
  policyEffect: "none";
}

export type InstallCapabilityErrorCode =
  | "REGISTRY_NOT_FOUND"
  | "CAPABILITY_NOT_FOUND"
  | "CAPABILITY_AMBIGUOUS"
  | "CAPABILITY_INVALID"
  | "CAPABILITY_ALREADY_INSTALLED";

export class InstallCapabilityError extends Error {
  constructor(
    public readonly code: InstallCapabilityErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "InstallCapabilityError";
  }
}

export interface InvocationRequest {
  capabilityId: string;
  input: unknown;
  host?: string;
}

export interface InvocationResult {
  ok: boolean;
  output?: unknown;
  error?: string;
}

export type UrlTemplateRenderErrorCode = "URL_TEMPLATE_INPUT_INVALID" | "URL_TEMPLATE_FIELD_MISSING" | "URL_TEMPLATE_FIELD_UNSUPPORTED";

export class UrlTemplateRenderError extends Error {
  constructor(
    public readonly code: UrlTemplateRenderErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "UrlTemplateRenderError";
  }
}

function templateInputRecord(input: unknown): Record<string, unknown> {
  if (!isRecord(input)) {
    throw new UrlTemplateRenderError("URL_TEMPLATE_INPUT_INVALID", "URL template input must be an object.");
  }

  return input;
}

function templateValueToString(fieldName: string, value: unknown): string {
  if (value === undefined || value === null) {
    throw new UrlTemplateRenderError("URL_TEMPLATE_FIELD_MISSING", `Missing URL template field: ${fieldName}`, { fieldName });
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  throw new UrlTemplateRenderError("URL_TEMPLATE_FIELD_UNSUPPORTED", `URL template field ${fieldName} must be a string, number, or boolean.`, {
    fieldName,
  });
}

export function renderUrlTemplate(template: string, input: unknown): string {
  const record = templateInputRecord(input);
  const fullMatch = template.match(FULL_TEMPLATE_PATTERN);

  if (fullMatch) {
    return templateValueToString(fullMatch[1], record[fullMatch[1]]);
  }

  return template.replace(/{{\s*([A-Za-z0-9_-]+)\s*}}/g, (_match, fieldName: string) => {
    const rawValue = templateValueToString(fieldName, record[fieldName]);
    return encodeURIComponent(rawValue);
  });
}

type JsonBodyExecution = {
  type: "json";
  fields?: Record<string, unknown>;
};

type HttpExecution = {
  method: string;
  url: string;
  timeout_ms: number;
  body?: JsonBodyExecution;
};

export interface HttpDryRunPlan {
  status: "dry_run";
  capabilityId: string;
  method: string;
  url: string;
  timeoutMs: number;
  body?: unknown;
  authMode: string;
  risk: string;
  egressPreview?: RedactedEgressPreview;
  warnings?: string[];
}

export interface HttpDryRunOptions {
  auditLogger?: AuditLogger;
  channel?: ConfirmationChannel;
}

const FULL_TEMPLATE_PATTERN = /^{{\s*([A-Za-z0-9_-]+)\s*}}$/;
const TEMPLATE_PATTERN = /{{\s*([A-Za-z0-9_-]+)\s*}}/g;

function templateContainsReference(value: string): boolean {
  TEMPLATE_PATTERN.lastIndex = 0;
  const containsReference = TEMPLATE_PATTERN.test(value);
  TEMPLATE_PATTERN.lastIndex = 0;
  return containsReference;
}

function readTemplateField(input: Record<string, unknown>, fieldName: string): unknown {
  const value = input[fieldName];
  if (value === undefined || value === null) {
    throw new UrlTemplateRenderError("URL_TEMPLATE_FIELD_MISSING", `Missing template field: ${fieldName}`, { fieldName });
  }
  return value;
}

function manifestRequiredInputFields(manifest: CapabilityManifest): Set<string> {
  const inputSchema = manifest.input;
  if (!isRecord(inputSchema) || !Array.isArray(inputSchema.required)) {
    return new Set();
  }

  return new Set(inputSchema.required.filter((field): field is string => typeof field === "string"));
}

function renderBodyTemplate(value: unknown, input: Record<string, unknown>, requiredFields: Set<string>): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const fullMatch = value.match(FULL_TEMPLATE_PATTERN);
  if (fullMatch) {
    const fieldName = fullMatch[1];
    const rendered = input[fieldName];
    if (rendered === undefined || rendered === null) {
      if (requiredFields.has(fieldName)) {
        throw new UrlTemplateRenderError("URL_TEMPLATE_FIELD_MISSING", `Missing template field: ${fieldName}`, { fieldName });
      }
      return undefined;
    }
    return rendered;
  }

  return value.replace(TEMPLATE_PATTERN, (_match, fieldName: string) => String(readTemplateField(input, fieldName)));
}

function renderJsonBody(body: JsonBodyExecution | undefined, input: Record<string, unknown>, requiredFields: Set<string>): unknown {
  if (body === undefined || body.fields === undefined) {
    return undefined;
  }

  const rendered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body.fields)) {
    const renderedValue = renderBodyTemplate(value, input, requiredFields);
    if (renderedValue !== undefined) {
      rendered[key] = renderedValue;
    }
  }

  return rendered;
}


export function detectArbitraryUrlCapability(manifest: CapabilityManifest): boolean {
  const execution = manifest.execution as { url?: unknown };
  return typeof execution.url === "string" && FULL_TEMPLATE_PATTERN.test(execution.url.trim());
}

export function capabilityRiskWarnings(manifest: CapabilityManifest): string[] {
  const metadata = manifest.metadata as { network_access?: unknown; unsafe_by_default?: unknown };
  const warnings: string[] = [];

  if (detectArbitraryUrlCapability(manifest) || metadata.network_access === "arbitrary_url" || metadata.unsafe_by_default === true) {
    warnings.push("arbitrary_url");
  }

  return warnings;
}

function authMode(manifest: CapabilityManifest): string {
  const auth = manifest.auth as { type?: unknown; placement?: { type?: unknown } };
  const authType = typeof auth.type === "string" ? auth.type : "unknown";
  const placement = typeof auth.placement?.type === "string" ? auth.placement.type : undefined;
  return placement === undefined ? authType : `${authType}:${placement}`;
}

export async function buildHttpDryRunPlan(
  manifest: CapabilityManifest,
  input: unknown,
  options: HttpDryRunOptions = {},
): Promise<HttpDryRunPlan> {
  const inputRecord = templateInputRecord(input);
  const execution = manifest.execution as HttpExecution;
  const warnings = capabilityRiskWarnings(manifest);
  const renderedUrl = renderUrlTemplate(execution.url, inputRecord);
  const requiredFields = manifestRequiredInputFields(manifest);
  const inputClassification = classifyInputForRuntime(input);
  const egressMap = buildFieldLevelEgressMapForRuntime(manifest, input, inputClassification);
  const minimizedInput = minimizeInputByEgressMapForRuntime(input, egressMap);
  const egressPreview = buildRedactedEgressPreviewForRuntime({
    targetOrigin: targetOrigin(renderedUrl) ?? "",
    map: egressMap,
    minimizedInput: minimizedInput.input,
    classification: inputClassification,
  });
  const plan: HttpDryRunPlan = {
    status: "dry_run",
    capabilityId: manifest.id,
    method: execution.method,
    url: renderedUrl,
    timeoutMs: execution.timeout_ms,
    body: renderJsonBody(execution.body, inputRecord, requiredFields),
    authMode: authMode(manifest),
    risk: summarizeRisk(manifest),
    egressPreview,
  };

  if (warnings.length > 0) {
    plan.warnings = warnings;
  }

  if (options.auditLogger !== undefined) {
    await options.auditLogger.record({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      channel: options.channel ?? "cli",
      capabilityId: manifest.id,
      status: "dry_run",
      policyDecision: "allow",
      confirmationStatus: "approved",
      reason: "Dry run plan generated.",
      inputHash: hashInput(input),
      inputRedactedJson: stableJsonStringify(redactInput(input)),
      resolvedUrl: renderedUrl,
      requestStarted: false,
      egressDataClasses: egressPreview.dataClasses,
      egressTargetOrigin: egressPreview.targetOrigin,
      egressRedactedPreviewJson: stableJsonStringify(egressPreview),
    });
  }

  return plan;
}

export type HttpExecutionStatus = "success" | "http_error" | "timeout" | "network_error" | "secret_missing" | "audit_failed" | "outbound_blocked";

export type OutboundPolicyDecision = "allow" | "block";

export type OutboundTargetType =
  | "fixed_https_origin"
  | "templated_path_or_query"
  | "arbitrary_url"
  | "localhost_or_loopback"
  | "private_network"
  | "metadata_service"
  | "non_https"
  | "invalid_url";

export interface OutboundPolicyOptions {
  allowLocalhost?: boolean;
}

export interface OutboundPolicyResult {
  decision: OutboundPolicyDecision;
  targetType: OutboundTargetType;
  reasonCode: string;
  summary: string;
  resolvedUrl: string;
  requestStarted: false;
}

export type HttpBodyKind = "json" | "text" | "empty";

export interface NormalizedHttpResponse {
  statusCode: number;
  contentType?: string;
  bodyKind: HttpBodyKind;
  output?: unknown;
  providerRateLimit?: ProviderRateLimitEvidence;
}

export interface ProviderRateLimitEvidence {
  providerStatus: 429;
  retryAfterMs?: number;
  retryAfterAt?: string;
  rateLimitResetAt?: string;
  headerNames: string[];
}

export interface HttpExecutionResult {
  ok: boolean;
  capabilityId: string;
  method: string;
  url: string;
  status: HttpExecutionStatus;
  statusCode?: number;
  contentType?: string;
  bodyKind?: HttpBodyKind;
  output?: unknown;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
    response?: unknown;
    providerRateLimit?: ProviderRateLimitEvidence;
  };
}

export interface CreateHttpExecutionEvidenceOptions {
  permissions?: CapabilityPermission[];
  requestStartedAt?: string;
  responseReceivedAt?: string;
  providerRequestId?: string;
  retryAttempt?: number;
  idempotencyKeyHash?: string;
  reconcileHint?: string;
}

function highestSideEffectKind(permissions: CapabilityPermission[] | undefined): ExecutionSideEffectKind {
  const risks = permissions?.map((permission) => permission.risk) ?? [];

  if (risks.includes("financial")) {
    return "financial";
  }
  if (risks.includes("code_execution")) {
    return "code_execution";
  }
  if (risks.includes("destructive")) {
    return "destructive";
  }
  if (risks.includes("external_send")) {
    return "send";
  }
  if (risks.some((risk) => risk === "write" || risk === "secret_access")) {
    return "write";
  }

  return "read";
}

function executionOutcomeFromHttpResult(result: HttpExecutionResult): ExecutionOutcome {
  if (result.ok) {
    return "success";
  }

  if (result.status === "timeout") {
    return "unknown_after_timeout";
  }

  if (result.status === "outbound_blocked" || result.status === "audit_failed") {
    return "blocked";
  }

  if (result.status === "secret_missing") {
    return "failed_before_request";
  }

  return "failed_after_request";
}

export function createHttpExecutionEvidence(
  result: HttpExecutionResult,
  options: CreateHttpExecutionEvidenceOptions = {},
): ExecutionEvidence {
  const requestStarted = requestStartedFromHttpResult(result);
  const responseReceived = result.status === "success" || result.status === "http_error";

  return {
    type: "http",
    method: result.method,
    targetOrigin: targetOrigin(result.url),
    statusCode: result.statusCode,
    httpStatus: result.statusCode,
    requestStarted,
    outcome: executionOutcomeFromHttpResult(result),
    sideEffectKind: highestSideEffectKind(options.permissions),
    requestStartedAt: requestStarted ? options.requestStartedAt : undefined,
    responseReceivedAt: responseReceived ? options.responseReceivedAt : undefined,
    providerRequestId: options.providerRequestId,
    retryAttempt: options.retryAttempt ?? 0,
    idempotencyKeyHash: options.idempotencyKeyHash,
    reconcileHint: options.reconcileHint,
  };
}

export const RESULT_ENVELOPE_VERSION = "opencap.result_envelope.v1";

export type ResultEnvelopeStatus = "success" | "dry_run" | "blocked" | "confirmation_required" | "failed" | "unknown";
export type ResultWarningSeverity = "info" | "warning" | "error";

export interface ResultWarningV1 {
  code: string;
  message: string;
  severity: ResultWarningSeverity;
}

export type ResultTaintLabel = "provider_untrusted" | "runtime_generated" | "secret_redacted" | "sanitized_text";

export interface ResultProvenanceV1 {
  contentDigest: string;
  transformations: string[];
  taint: Record<string, ResultTaintLabel[]>;
}

export interface ResultEvidenceSummaryV1 {
  inputHash?: string;
  risk?: string;
  policyDecision?: string;
  confirmationStatus?: string;
  requestStarted?: boolean;
  targetOrigin?: string;
  httpMethod?: string;
  httpStatus?: number;
  executionOutcome?: ExecutionOutcome;
  executionSideEffectKind?: ExecutionSideEffectKind;
  executionRetryAttempt?: number;
  executionRequestStartedAt?: string;
  executionResponseReceivedAt?: string;
  executionProviderRequestId?: string;
  executionIdempotencyKeyHash?: string;
  executionReconcileHint?: string;
  errorCode?: string;
  resolvedUrl?: string;
  outputValidationStatus?: OutputValidationStatus;
  outputValidationFindings?: OutputValidationFinding[];
  sanitizerFindings?: ResultSanitizerFinding[];
  resultContentDigest?: string;
  resultProvenance?: ResultProvenanceV1;
  egressPreview?: RedactedEgressPreview;
  policyTrace?: PolicyDecisionTraceV1;
}

export interface ResultEnvelopeV1 {
  envelopeVersion: typeof RESULT_ENVELOPE_VERSION;
  invocationId: string;
  capabilityId: string;
  status: ResultEnvelopeStatus;
  outcome: string;
  isError: boolean;
  structuredContent?: unknown;
  textSummary?: string;
  warnings: ResultWarningV1[];
  evidence: ResultEvidenceSummaryV1;
}

export type InputProvenanceSource = "user_supplied" | "model_generated" | "tool_derived" | "runtime_generated";

export interface InputProvenanceEvidence {
  inputHash: string;
  inputSource: InputProvenanceSource;
  derivedFromInvocationId?: string;
  sourceResultDigest?: string;
  dataClasses: DataEgressContext["dataClasses"];
  redactionApplied: boolean;
  minimizationApplied: boolean;
  egressTargetOrigin?: string;
  egressDecision?: DataEgressDecision;
  policyRuleId?: string;
  transformations: string[];
}

export interface CreateInputProvenanceEvidenceInput {
  input: unknown;
  inputSource: InputProvenanceSource;
  derivedFromInvocationId?: string;
  sourceResult?: unknown;
  sourceResultDigest?: string;
  dataClasses?: DataEgressContext["dataClasses"];
  egressTargetOrigin?: string;
  egressDecision?: DataEgressDecision;
  policyRuleId?: string;
  transformations?: string[];
}

export interface CreateResultEnvelopeInput {
  invocationId?: string;
  capabilityId: string;
  status: ResultEnvelopeStatus;
  outcome?: string;
  structuredContent?: unknown;
  textSummary?: string;
  warnings?: ResultWarningV1[];
  evidence?: ResultEvidenceSummaryV1;
}

export interface ResultEnvelopeBuildOptions {
  invocationId?: string;
  evidence?: ResultEvidenceSummaryV1;
  permissions?: CapabilityPermission[];
  outputSchema?: unknown;
  sanitizer?: ToolResultSanitizerOptions;
}

function resultStatusIsError(status: ResultEnvelopeStatus): boolean {
  return status !== "success" && status !== "dry_run";
}

function errorCodeFromStructuredContent(structuredContent: unknown): string | undefined {
  if (!isRecord(structuredContent)) {
    return undefined;
  }

  const error = structuredContent.error;
  if (!isRecord(error) || typeof error.code !== "string") {
    return undefined;
  }

  return error.code;
}

function defaultTextSummary(input: CreateResultEnvelopeInput): string {
  const outcome = input.outcome ?? input.status;

  if (input.status === "success") {
    return `${input.capabilityId} succeeded.`;
  }

  if (input.status === "dry_run") {
    return `${input.capabilityId} dry run generated.`;
  }

  if (input.status === "blocked") {
    return `${input.capabilityId} blocked.`;
  }

  if (input.status === "confirmation_required") {
    return `${input.capabilityId} requires confirmation.`;
  }

  if (input.status === "unknown" && outcome === "unknown_after_timeout") {
    return `${input.capabilityId} outcome is unknown after timeout.`;
  }

  const errorCode = errorCodeFromStructuredContent(input.structuredContent);
  return errorCode === undefined ? `${input.capabilityId} ${input.status}.` : `${input.capabilityId} ${input.status} with ${errorCode}.`;
}

export function createResultEnvelope(input: CreateResultEnvelopeInput): ResultEnvelopeV1 {
  return {
    envelopeVersion: RESULT_ENVELOPE_VERSION,
    invocationId: input.invocationId ?? randomUUID(),
    capabilityId: input.capabilityId,
    status: input.status,
    outcome: input.outcome ?? input.status,
    isError: resultStatusIsError(input.status),
    structuredContent: input.structuredContent,
    textSummary: input.textSummary ?? defaultTextSummary(input),
    warnings: input.warnings ?? [],
    evidence: input.evidence ?? {},
  };
}

export type OutputValidationStatus = "not_applicable" | "valid" | "invalid";

export interface OutputValidationFinding {
  path: string;
  message: string;
  keyword?: string;
}

export interface OutputValidationResult {
  ok: boolean;
  status: OutputValidationStatus;
  findings: OutputValidationFinding[];
}

function jsonPointer(parentPath: string, segment: string): string {
  const escaped = segment.replace(/~/g, "~0").replace(/\//g, "~1");
  return parentPath === "/" ? `/${escaped}` : `${parentPath}/${escaped}`;
}

function schemaRecord(schema: unknown): Record<string, unknown> {
  return isRecord(schema) ? schema : {};
}

function typeMatches(value: unknown, expectedType: string): boolean {
  if (expectedType === "array") {
    return Array.isArray(value);
  }

  if (expectedType === "object") {
    return isRecord(value);
  }

  if (expectedType === "integer") {
    return typeof value === "number" && Number.isInteger(value);
  }

  if (expectedType === "null") {
    return value === null;
  }

  return typeof value === expectedType;
}

function validateOutputNode(value: unknown, schema: unknown, path: string, findings: OutputValidationFinding[]): void {
  const record = schemaRecord(schema);
  const type = record.type;

  if (typeof type === "string" && !typeMatches(value, type)) {
    findings.push({ path, message: `must be ${type}`, keyword: "type" });
    return;
  }

  if (type === "object" || (record.properties !== undefined && isRecord(value))) {
    const properties = schemaRecord(record.properties);
    const required = Array.isArray(record.required) ? record.required.filter((field): field is string => typeof field === "string") : [];

    for (const field of required) {
      if (!isRecord(value) || value[field] === undefined) {
        findings.push({ path: jsonPointer(path, field), message: "is required", keyword: "required" });
      }
    }

    if (isRecord(value)) {
      for (const [field, fieldSchema] of Object.entries(properties)) {
        if (value[field] !== undefined) {
          validateOutputNode(value[field], fieldSchema, jsonPointer(path, field), findings);
        }
      }
    }
  }

  if (type === "array" && Array.isArray(value) && record.items !== undefined) {
    value.forEach((item, index) => validateOutputNode(item, record.items, jsonPointer(path, String(index)), findings));
  }
}

export function validateOutputAgainstSchema(output: unknown, schema: unknown): OutputValidationResult {
  const findings: OutputValidationFinding[] = [];
  validateOutputNode(output, schema, "/", findings);

  if (findings.length === 0) {
    return { ok: true, status: "valid", findings: [] };
  }

  return { ok: false, status: "invalid", findings };
}

function targetOrigin(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[(.*)\]$/, "$1");
}

function parseIpv4(hostname: string): [number, number, number, number] | undefined {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return undefined;
  }

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return undefined;
    }
    const value = Number(part);
    return value >= 0 && value <= 255 ? value : undefined;
  });

  return octets.every((octet): octet is number => octet !== undefined)
    ? [octets[0], octets[1], octets[2], octets[3]]
    : undefined;
}

function isLoopbackHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  const ipv4 = parseIpv4(host);

  return host === "localhost" || host.endsWith(".localhost") || host === "::1" || host === "0.0.0.0" || ipv4?.[0] === 127;
}

function isMetadataServiceHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return host === "169.254.169.254" || host === "metadata.google.internal";
}

function isPrivateNetworkHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  const ipv4 = parseIpv4(host);
  if (ipv4 !== undefined) {
    const [a, b] = ipv4;
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
  }

  return host.endsWith(".local") || host.endsWith(".internal") || host.startsWith("fc") || host.startsWith("fd") || /^fe[89ab]/.test(host);
}

function urlTemplateHasTemplatedHost(template: string): boolean {
  const schemeIndex = template.indexOf("://");
  if (schemeIndex < 0) {
    return FULL_TEMPLATE_PATTERN.test(template.trim());
  }

  const authorityStart = schemeIndex + 3;
  const authorityEndCandidates = ["/", "?", "#"]
    .map((marker) => template.indexOf(marker, authorityStart))
    .filter((index) => index >= 0);
  const authorityEnd = authorityEndCandidates.length === 0 ? template.length : Math.min(...authorityEndCandidates);
  const authority = template.slice(authorityStart, authorityEnd);
  return templateContainsReference(authority);
}

function outboundTargetTypeSummary(type: OutboundTargetType): string {
  switch (type) {
    case "fixed_https_origin":
      return "fixed public HTTPS origin is allowed.";
    case "templated_path_or_query":
      return "templated path or query with fixed public HTTPS origin is allowed.";
    case "arbitrary_url":
      return "arbitrary user-provided URL is blocked by outbound policy.";
    case "localhost_or_loopback":
      return "localhost or loopback target is blocked by outbound policy.";
    case "private_network":
      return "private network target is blocked by outbound policy.";
    case "metadata_service":
      return "cloud metadata service target is blocked by outbound policy.";
    case "non_https":
      return "non-HTTPS target is blocked by outbound policy.";
    case "invalid_url":
      return "invalid outbound URL is blocked by outbound policy.";
  }
}

function outboundReasonCode(type: OutboundTargetType, decision: OutboundPolicyDecision): string {
  if (decision === "allow") {
    return "OUTBOUND_ALLOWED";
  }

  switch (type) {
    case "arbitrary_url":
      return "OUTBOUND_ARBITRARY_URL_BLOCKED";
    case "localhost_or_loopback":
      return "OUTBOUND_LOCALHOST_BLOCKED";
    case "private_network":
      return "OUTBOUND_PRIVATE_NETWORK_BLOCKED";
    case "metadata_service":
      return "OUTBOUND_METADATA_SERVICE_BLOCKED";
    case "non_https":
      return "OUTBOUND_NON_HTTPS_BLOCKED";
    case "invalid_url":
      return "OUTBOUND_URL_INVALID";
    case "fixed_https_origin":
    case "templated_path_or_query":
      return "OUTBOUND_BLOCKED";
  }
}

export function classifyOutboundTarget(resolvedUrl: string, manifest: CapabilityManifest): OutboundTargetType {
  let parsed: URL;
  try {
    parsed = new URL(resolvedUrl);
  } catch {
    return "invalid_url";
  }

  if (isMetadataServiceHost(parsed.hostname)) {
    return "metadata_service";
  }

  if (isLoopbackHost(parsed.hostname)) {
    return "localhost_or_loopback";
  }

  if (isPrivateNetworkHost(parsed.hostname)) {
    return "private_network";
  }

  if (parsed.protocol !== "https:") {
    return "non_https";
  }

  const execution = manifest.execution as { url?: unknown };
  const template = typeof execution.url === "string" ? execution.url : "";
  if (detectArbitraryUrlCapability(manifest) || urlTemplateHasTemplatedHost(template)) {
    return "arbitrary_url";
  }

  return templateContainsReference(template) ? "templated_path_or_query" : "fixed_https_origin";
}

export function evaluateOutboundPolicy(
  resolvedUrl: string,
  manifest: CapabilityManifest,
  options: OutboundPolicyOptions = {},
): OutboundPolicyResult {
  const targetType = classifyOutboundTarget(resolvedUrl, manifest);
  const blocked =
    (targetType === "localhost_or_loopback" && options.allowLocalhost !== true) ||
    targetType === "arbitrary_url" ||
    targetType === "private_network" ||
    targetType === "metadata_service" ||
    targetType === "non_https" ||
    targetType === "invalid_url";
  const decision: OutboundPolicyDecision = blocked ? "block" : "allow";

  return {
    decision,
    targetType,
    reasonCode: outboundReasonCode(targetType, decision),
    summary: outboundTargetTypeSummary(targetType),
    resolvedUrl,
    requestStarted: false,
  };
}

function warningFromCode(code: string): ResultWarningV1 {
  return {
    code: code.toUpperCase(),
    message: `Runtime warning: ${code}.`,
    severity: "warning",
  };
}

function warningFromSanitizerFinding(finding: ResultSanitizerFinding): ResultWarningV1 {
  return {
    code: finding.code,
    message: finding.message,
    severity: finding.severity,
  };
}

function addTaint(taint: Record<string, ResultTaintLabel[]>, path: string, label: ResultTaintLabel): void {
  taint[path] = [...new Set([...(taint[path] ?? []), label])];
}

function addTaintTree(taint: Record<string, ResultTaintLabel[]>, value: unknown, path: string, label: ResultTaintLabel): void {
  addTaint(taint, path, label);

  if (Array.isArray(value)) {
    value.forEach((item, index) => addTaintTree(taint, item, jsonPointer(path, String(index)), label));
    return;
  }

  if (isRecord(value)) {
    for (const [field, nestedValue] of Object.entries(value)) {
      addTaintTree(taint, nestedValue, jsonPointer(path, field), label);
    }
  }
}

function transformationFromFinding(finding: ResultSanitizerFinding): string {
  if (finding.code === "SECRET_REDACTED") {
    return "secret_redaction";
  }

  return "sanitized_text";
}

function taintFromFinding(finding: ResultSanitizerFinding): ResultTaintLabel {
  if (finding.code === "SECRET_REDACTED") {
    return "secret_redacted";
  }

  return "sanitized_text";
}

function resultContentDigest(structuredContent: unknown): string {
  return `sha256:${createHash("sha256").update(stableJsonStringify(structuredContent)).digest("hex")}`;
}

function buildResultProvenance(
  structuredContent: unknown,
  status: ResultEnvelopeStatus,
  sanitizerFindings: ResultSanitizerFinding[],
): ResultProvenanceV1 {
  const transformations = new Set<string>();
  const taint: Record<string, ResultTaintLabel[]> = {};

  addTaint(taint, "/textSummary", "runtime_generated");

  if (status === "success" || status === "dry_run") {
    addTaintTree(taint, structuredContent, "/", "provider_untrusted");
  } else {
    transformations.add("runtime_error_envelope");
    addTaint(taint, "/error", "runtime_generated");
    if (isRecord(structuredContent) && isRecord(structuredContent.error) && structuredContent.error.response !== undefined) {
      addTaintTree(taint, structuredContent.error.response, "/error/response", "provider_untrusted");
    }
  }

  for (const finding of sanitizerFindings) {
    transformations.add(transformationFromFinding(finding));
    addTaint(taint, finding.path, taintFromFinding(finding));
  }

  return {
    contentDigest: resultContentDigest(structuredContent),
    transformations: [...transformations].sort(),
    taint,
  };
}

export function resultEnvelopeFromDryRunPlan(plan: HttpDryRunPlan, options: ResultEnvelopeBuildOptions = {}): ResultEnvelopeV1 {
  return createResultEnvelope({
    invocationId: options.invocationId,
    capabilityId: plan.capabilityId,
    status: "dry_run",
    outcome: "dry_run",
    structuredContent: {
      request: {
        method: plan.method,
        url: plan.url,
        body: plan.body,
      },
      authMode: plan.authMode,
      risk: plan.risk,
      egressPreview: plan.egressPreview,
    },
    warnings: (plan.warnings ?? []).map(warningFromCode),
    evidence: {
      risk: plan.risk,
      requestStarted: false,
      targetOrigin: targetOrigin(plan.url),
      httpMethod: plan.method,
      resolvedUrl: plan.url,
      egressPreview: plan.egressPreview,
      ...options.evidence,
    },
  });
}

interface ResultEnvelopeErrorOptions extends ResultEnvelopeBuildOptions {
  capabilityId: string;
  reason: string;
}

export function blockedResultEnvelope(options: ResultEnvelopeErrorOptions): ResultEnvelopeV1 {
  return createResultEnvelope({
    invocationId: options.invocationId,
    capabilityId: options.capabilityId,
    status: "blocked",
    outcome: "blocked",
    structuredContent: { error: { code: "BLOCKED", message: options.reason } },
    evidence: { requestStarted: false, ...options.evidence },
  });
}

export function confirmationRequiredResultEnvelope(options: ResultEnvelopeErrorOptions): ResultEnvelopeV1 {
  return createResultEnvelope({
    invocationId: options.invocationId,
    capabilityId: options.capabilityId,
    status: "confirmation_required",
    outcome: "confirmation_required",
    structuredContent: { error: { code: "CONFIRMATION_REQUIRED", message: options.reason } },
    evidence: { requestStarted: false, ...options.evidence },
  });
}

function envelopeStatusFromHttpResult(result: HttpExecutionResult): ResultEnvelopeStatus {
  if (result.ok) {
    return "success";
  }

  if (result.status === "timeout") {
    return "unknown";
  }

  if (result.status === "secret_missing" || result.status === "outbound_blocked") {
    return "blocked";
  }

  if (result.status === "audit_failed") {
    return "blocked";
  }

  return "failed";
}

function outcomeFromHttpResult(result: HttpExecutionResult): string {
  if (result.status === "timeout") {
    return "unknown_after_timeout";
  }

  if (result.status === "secret_missing") {
    return "blocked_before_request";
  }

  if (result.status === "outbound_blocked") {
    return "outbound_blocked";
  }

  if (result.status === "audit_failed") {
    return "audit_failed";
  }

  return result.status;
}

function requestStartedFromHttpResult(result: HttpExecutionResult): boolean {
  return result.status !== "secret_missing" && result.status !== "audit_failed" && result.status !== "outbound_blocked";
}

function structuredContentFromHttpResult(result: HttpExecutionResult, sanitizedValue: unknown): unknown {
  if (result.ok) {
    return sanitizedValue;
  }

  const error = result.error ?? { code: "HTTP_EXECUTION_ERROR", message: "HTTP execution failed." };
  return {
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      response: sanitizedValue,
      providerRateLimit: error.providerRateLimit,
    },
  };
}

function baseHttpResultEvidence(result: HttpExecutionResult, options: ResultEnvelopeBuildOptions): ResultEvidenceSummaryV1 {
  const execution = createHttpExecutionEvidence(result, {
    permissions: options.permissions,
    requestStartedAt: options.evidence?.executionRequestStartedAt,
    responseReceivedAt: options.evidence?.executionResponseReceivedAt,
    providerRequestId: options.evidence?.executionProviderRequestId,
    retryAttempt: options.evidence?.executionRetryAttempt,
    idempotencyKeyHash: options.evidence?.executionIdempotencyKeyHash,
    reconcileHint: options.evidence?.executionReconcileHint,
  });

  return {
    requestStarted: requestStartedFromHttpResult(result),
    targetOrigin: targetOrigin(result.url),
    httpMethod: result.method,
    httpStatus: result.statusCode,
    executionOutcome: execution.outcome,
    executionSideEffectKind: execution.sideEffectKind,
    executionRetryAttempt: execution.retryAttempt,
    executionRequestStartedAt: execution.requestStartedAt,
    executionResponseReceivedAt: execution.responseReceivedAt,
    executionProviderRequestId: execution.providerRequestId,
    executionIdempotencyKeyHash: execution.idempotencyKeyHash,
    executionReconcileHint: execution.reconcileHint,
    errorCode: result.error?.code,
    resolvedUrl: result.url,
    ...options.evidence,
  };
}

export function resultEnvelopeFromHttpExecutionResult(result: HttpExecutionResult, options: ResultEnvelopeBuildOptions = {}): ResultEnvelopeV1 {
  const sanitizerResult = sanitizeToolResult(result.ok ? result.output : result.error?.response, options.sanitizer);
  const outputValidation = options.outputSchema === undefined
    ? { ok: true, status: "not_applicable" as const, findings: [] }
    : validateOutputAgainstSchema(sanitizerResult.value, options.outputSchema);
  const sanitizerWarnings = sanitizerResult.findings.map(warningFromSanitizerFinding);

  if (result.ok && !outputValidation.ok) {
    const findings = outputValidation.findings;
    const structuredContent = {
      error: {
        code: "OUTPUT_SCHEMA_INVALID",
        message: "Output schema validation failed.",
        findings,
      },
    };
    const provenance = buildResultProvenance(structuredContent, "failed", sanitizerResult.findings);

    return createResultEnvelope({
      invocationId: options.invocationId,
      capabilityId: result.capabilityId,
      status: "failed",
      outcome: "output_schema_invalid",
      structuredContent,
      warnings: sanitizerWarnings,
      evidence: {
        ...baseHttpResultEvidence(result, options),
        outputValidationStatus: "invalid",
        outputValidationFindings: findings,
        sanitizerFindings: sanitizerResult.findings,
        resultContentDigest: provenance.contentDigest,
        resultProvenance: provenance,
      },
    });
  }

  const status = envelopeStatusFromHttpResult(result);
  const structuredContent = structuredContentFromHttpResult(result, sanitizerResult.value);
  const provenance = buildResultProvenance(structuredContent, status, sanitizerResult.findings);

  return createResultEnvelope({
    invocationId: options.invocationId,
    capabilityId: result.capabilityId,
    status,
    outcome: outcomeFromHttpResult(result),
    structuredContent,
    warnings: sanitizerWarnings,
    evidence: {
      ...baseHttpResultEvidence(result, options),
      outputValidationStatus: outputValidation.status,
      outputValidationFindings: outputValidation.findings,
      sanitizerFindings: sanitizerResult.findings,
      resultContentDigest: provenance.contentDigest,
      resultProvenance: provenance,
    },
  });
}

export interface HttpExecutionOptions extends HttpDryRunOptions {
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  outboundPolicy?: OutboundPolicyOptions;
  consentReceipt?: AuditConsentReceiptEvidence;
}

function parseRetryAfter(value: string | null, now = new Date()): Pick<ProviderRateLimitEvidence, "retryAfterMs" | "retryAfterAt"> {
  if (value === null) {
    return {};
  }

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const retryAfterMs = Number(trimmed) * 1000;
    return {
      retryAfterMs,
      retryAfterAt: new Date(now.getTime() + retryAfterMs).toISOString(),
    };
  }

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    return {};
  }

  return {
    retryAfterMs: Math.max(0, timestamp - now.getTime()),
    retryAfterAt: new Date(timestamp).toISOString(),
  };
}

function parseRateLimitReset(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return new Date(Number(trimmed) * 1000).toISOString();
  }

  const timestamp = Date.parse(trimmed);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
}

function providerRateLimitEvidenceFromResponse(response: Response): ProviderRateLimitEvidence | undefined {
  if (response.status !== 429) {
    return undefined;
  }

  const retryAfter = response.headers.get("retry-after");
  const rateLimitReset = response.headers.get("ratelimit-reset");
  const headerNames = [
    retryAfter === null ? undefined : "retry-after",
    rateLimitReset === null ? undefined : "ratelimit-reset",
  ].filter((header): header is string => header !== undefined);

  return {
    providerStatus: 429,
    ...parseRetryAfter(retryAfter),
    rateLimitResetAt: parseRateLimitReset(rateLimitReset),
    headerNames,
  };
}

function executionAuditEvent(
  manifest: CapabilityManifest,
  input: unknown,
  result: HttpExecutionResult,
  channel: ConfirmationChannel,
  credential?: CredentialAuditEvidence,
  consentReceipt?: AuditConsentReceiptEvidence,
): AuditEvent {
  const requestStarted = requestStartedFromHttpResult(result);
  const now = new Date().toISOString();
  const execution = createHttpExecutionEvidence(result, {
    permissions: manifest.permissions,
    requestStartedAt: requestStarted ? now : undefined,
    responseReceivedAt: requestStarted ? now : undefined,
  });

  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    channel,
    capabilityId: manifest.id,
    status: result.status === "secret_missing" || result.status === "audit_failed" || result.status === "outbound_blocked" ? "blocked" : "executed",
    policyDecision: "allow",
    confirmationStatus: "approved",
    reason: result.ok ? "HTTP execution succeeded." : result.error?.message ?? "HTTP execution failed.",
    inputHash: hashInput(input),
    inputRedactedJson: stableJsonStringify(redactInput(input)),
    resolvedUrl: result.url,
    requestStarted,
    executionOutcome: execution.outcome,
    executionSideEffectKind: execution.sideEffectKind,
    executionRequestStartedAt: execution.requestStartedAt,
    executionResponseReceivedAt: execution.responseReceivedAt,
    executionHttpStatus: execution.httpStatus,
    executionRetryAttempt: execution.retryAttempt,
    executionProviderRequestId: execution.providerRequestId,
    executionIdempotencyKeyHash: execution.idempotencyKeyHash,
    executionReconcileHint: execution.reconcileHint,
    credentialProvider: credential?.provider,
    credentialSource: credential?.source,
    credentialEnvName: credential?.envName,
    credentialPlacement: credential?.placement,
    credentialResolved: credential?.resolved,
    credentialRedacted: credential?.redacted,
    ...consentReceipt,
  };
}

export async function normalizeHttpResponse(response: Response): Promise<NormalizedHttpResponse> {
  const contentType = response.headers.get("content-type") ?? undefined;
  const text = await response.text();
  const providerRateLimit = providerRateLimitEvidenceFromResponse(response);

  if (text.length === 0) {
    return {
      statusCode: response.status,
      contentType,
      bodyKind: "empty",
      output: undefined,
      providerRateLimit,
    };
  }

  if (contentType?.toLowerCase().includes("application/json")) {
    try {
      return {
        statusCode: response.status,
        contentType,
        bodyKind: "json",
        output: JSON.parse(text),
        providerRateLimit,
      };
    } catch {
      return {
        statusCode: response.status,
        contentType,
        bodyKind: "text",
        output: text,
        providerRateLimit,
      };
    }
  }

  return {
    statusCode: response.status,
    contentType,
    bodyKind: "text",
    output: text,
    providerRateLimit,
  };
}

function timeoutErrorResult(plan: HttpDryRunPlan): HttpExecutionResult {
  return {
    ok: false,
    capabilityId: plan.capabilityId,
    method: plan.method,
    url: plan.url,
    status: "timeout",
    error: { code: "HTTP_TIMEOUT", message: `HTTP request timed out after ${plan.timeoutMs}ms.` },
  };
}

function auditPreflightFailedResult(plan: HttpDryRunPlan): HttpExecutionResult {
  return {
    ok: false,
    capabilityId: plan.capabilityId,
    method: plan.method,
    url: plan.url,
    status: "audit_failed",
    error: {
      code: "AUDIT_PREFLIGHT_FAILED",
      message: "Audit preflight failed before external request; request was not started.",
    },
  };
}

function outboundBlockedResult(plan: HttpDryRunPlan, outbound: OutboundPolicyResult): HttpExecutionResult {
  return {
    ok: false,
    capabilityId: plan.capabilityId,
    method: plan.method,
    url: plan.url,
    status: "outbound_blocked",
    error: {
      code: "OUTBOUND_BLOCKED",
      message: outbound.summary,
      response: {
        reasonCode: outbound.reasonCode,
        targetType: outbound.targetType,
      },
    },
  };
}

function outboundBlockedAuditEvent(
  manifest: CapabilityManifest,
  input: unknown,
  outbound: OutboundPolicyResult,
  channel: ConfirmationChannel,
): AuditEvent {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    channel,
    capabilityId: manifest.id,
    status: "blocked",
    policyDecision: "deny",
    confirmationStatus: "denied",
    reason: outbound.summary,
    inputHash: hashInput(input),
    inputRedactedJson: stableJsonStringify(redactInput(input)),
    resolvedUrl: outbound.resolvedUrl,
    requestStarted: false,
    outboundDecision: outbound.decision,
    outboundTargetType: outbound.targetType,
    outboundReasonCode: outbound.reasonCode,
  };
}

async function runOutboundPolicy(
  manifest: CapabilityManifest,
  input: unknown,
  plan: HttpDryRunPlan,
  options: HttpExecutionOptions,
): Promise<HttpExecutionResult | undefined> {
  const outbound = evaluateOutboundPolicy(plan.url, manifest, options.outboundPolicy);
  if (outbound.decision === "allow") {
    return undefined;
  }

  if (options.auditLogger !== undefined) {
    await options.auditLogger.record(outboundBlockedAuditEvent(manifest, input, outbound, options.channel ?? "cli"));
  }

  return outboundBlockedResult(plan, outbound);
}

function manifestRequiresAuditPreflight(manifest: CapabilityManifest): boolean {
  return buildCapabilityRiskSummary(manifest).risks.some((risk) => risk !== "read_only");
}

function createAuditPreflightCheck(
  manifest: CapabilityManifest,
  input: unknown,
  plan: HttpDryRunPlan,
  channel: ConfirmationChannel,
): AuditPreflightCheck {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    channel,
    capabilityId: manifest.id,
    reason: "Audit preflight before external request.",
    inputHash: hashInput(input),
    inputRedactedJson: stableJsonStringify(redactInput(input)),
    resolvedUrl: plan.url,
    requestStarted: false,
  };
}

async function runAuditPreflight(
  manifest: CapabilityManifest,
  input: unknown,
  plan: HttpDryRunPlan,
  options: HttpExecutionOptions,
): Promise<HttpExecutionResult | undefined> {
  if (options.auditLogger === undefined || !manifestRequiresAuditPreflight(manifest)) {
    return undefined;
  }

  try {
    await options.auditLogger.preflight(createAuditPreflightCheck(manifest, input, plan, options.channel ?? "cli"));
    return undefined;
  } catch {
    return auditPreflightFailedResult(plan);
  }
}

export async function executeHttpCapability(
  manifest: CapabilityManifest,
  input: unknown,
  options: HttpExecutionOptions = {},
): Promise<HttpExecutionResult> {
  const plan = await buildHttpDryRunPlan(manifest, input);
  const outboundFailure = await runOutboundPolicy(manifest, input, plan, options);
  if (outboundFailure !== undefined) {
    return outboundFailure;
  }

  const auditFailure = await runAuditPreflight(manifest, input, plan, options);
  if (auditFailure !== undefined) {
    return auditFailure;
  }

  const env = options.env ?? process.env;
  const headers: Record<string, string> = {};
  let credential: CredentialAuditEvidence | undefined;

  try {
    const resolvedCredential = resolveEnvCredential(
      {
        capabilityId: manifest.id,
        auth: manifest.auth,
        executionTarget: {
          method: plan.method,
          urlOrigin: new URL(plan.url).origin,
          provider: typeof manifest.metadata.provider === "string" ? manifest.metadata.provider : undefined,
        },
        mode: "execute",
      },
      env,
    );
    credential = credentialAuditEvidence(resolvedCredential);
    resolvedCredential.applyToHeaders(headers);
  } catch (error) {
    if (!(error instanceof SecretMissingError)) {
      throw error;
    }
    const result: HttpExecutionResult = {
      ok: false,
      capabilityId: manifest.id,
      method: plan.method,
      url: plan.url,
      status: "secret_missing",
      error: { code: "SECRET_MISSING", message: error.message },
    };
    if (options.auditLogger !== undefined) {
      await options.auditLogger.record(executionAuditEvent(manifest, input, result, options.channel ?? "cli", credential, options.consentReceipt));
    }
    return result;
  }

  const init: RequestInit = { method: plan.method, headers };
  if (plan.body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(plan.body);
  }

  const controller = new AbortController();
  init.signal = controller.signal;
  const timeout = setTimeout(() => controller.abort(), plan.timeoutMs);
  const fetchImpl = options.fetch ?? globalThis.fetch;
  let result: HttpExecutionResult;

  try {
    const response = await fetchImpl(plan.url, init);
    const normalized = await normalizeHttpResponse(response);
    if (response.ok) {
      result = {
        ok: true,
        capabilityId: manifest.id,
        method: plan.method,
        url: plan.url,
        status: "success",
        statusCode: normalized.statusCode,
        contentType: normalized.contentType,
        bodyKind: normalized.bodyKind,
        output: normalized.output,
      };
    } else {
      result = {
        ok: false,
        capabilityId: manifest.id,
        method: plan.method,
        url: plan.url,
        status: "http_error",
        statusCode: normalized.statusCode,
        contentType: normalized.contentType,
        bodyKind: normalized.bodyKind,
        error: {
          code: "HTTP_ERROR",
          message: `HTTP request failed with status ${normalized.statusCode}.`,
          statusCode: normalized.statusCode,
          response: redactInput(normalized.output),
          providerRateLimit: normalized.providerRateLimit,
        },
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      result = timeoutErrorResult(plan);
    } else {
      result = {
        ok: false,
        capabilityId: manifest.id,
        method: plan.method,
        url: plan.url,
        status: "network_error",
        error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : String(error) },
      };
    }
  } finally {
    clearTimeout(timeout);
  }

  if (options.auditLogger !== undefined) {
    await options.auditLogger.record(executionAuditEvent(manifest, input, result, options.channel ?? "cli", credential, options.consentReceipt));
  }

  return result;
}

export const POLICY_DECISIONS = ["allow", "ask", "deny"] as const;
export const POLICY_RISKS = [
  "read_only",
  "write",
  "external_send",
  "destructive",
  "financial",
  "code_execution",
  "secret_access",
] as const;

export type PolicyDecision = (typeof POLICY_DECISIONS)[number];
export type PolicyRisk = (typeof POLICY_RISKS)[number];

export interface PolicyMatch {
  capabilityId?: string;
  risk?: PolicyRisk;
  resource?: string;
  action?: string;
  channel?: string;
  host?: string;
  trustLevel?: string;
}

export interface PolicyRule {
  id?: string;
  match: PolicyMatch;
  decision: PolicyDecision;
  reason?: string;
}

export interface PolicySet {
  default: PolicyDecision;
  rules: PolicyRule[];
  sourcePath: string;
  id?: string;
  revision?: string;
}

export type PolicyParseErrorCode =
  | "POLICY_YAML_INVALID"
  | "POLICY_SCHEMA_INVALID"
  | "POLICY_DECISION_INVALID"
  | "POLICY_RISK_INVALID";

export class PolicyParseError extends Error {
  constructor(
    public readonly code: PolicyParseErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "PolicyParseError";
  }
}

const POLICY_DECISION_SET = new Set<string>(POLICY_DECISIONS);
const POLICY_RISK_SET = new Set<string>(POLICY_RISKS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, fieldPath: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new PolicyParseError("POLICY_SCHEMA_INVALID", `${fieldPath} must be an object.`, { fieldPath });
  }

  return value;
}

function optionalString(value: unknown, fieldPath: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PolicyParseError("POLICY_SCHEMA_INVALID", `${fieldPath} must be a non-empty string.`, { fieldPath });
  }

  return value;
}

function parseDecision(value: unknown, fieldPath: string): PolicyDecision {
  if (typeof value !== "string" || !POLICY_DECISION_SET.has(value)) {
    throw new PolicyParseError("POLICY_DECISION_INVALID", `${fieldPath} must be one of: ${POLICY_DECISIONS.join(", ")}.`, {
      fieldPath,
      value,
      allowed: POLICY_DECISIONS,
    });
  }

  return value as PolicyDecision;
}

function parseRisk(value: unknown, fieldPath: string): PolicyRisk | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !POLICY_RISK_SET.has(value)) {
    throw new PolicyParseError("POLICY_RISK_INVALID", `${fieldPath} must be one of: ${POLICY_RISKS.join(", ")}.`, {
      fieldPath,
      value,
      allowed: POLICY_RISKS,
    });
  }

  return value as PolicyRisk;
}

function parsePolicyMatch(value: unknown, fieldPath: string): PolicyMatch {
  const raw = requireRecord(value, fieldPath);

  return {
    capabilityId: optionalString(raw.capability_id, `${fieldPath}/capability_id`),
    risk: parseRisk(raw.risk, `${fieldPath}/risk`),
    resource: optionalString(raw.resource, `${fieldPath}/resource`),
    action: optionalString(raw.action, `${fieldPath}/action`),
    channel: optionalString(raw.channel, `${fieldPath}/channel`),
    host: optionalString(raw.host, `${fieldPath}/host`),
    trustLevel: optionalString(raw.trust_level, `${fieldPath}/trust_level`),
  };
}

function parsePolicyRule(value: unknown, index: number): PolicyRule {
  const fieldPath = `/rules/${index}`;
  const raw = requireRecord(value, fieldPath);

  return {
    id: optionalString(raw.id, `${fieldPath}/id`),
    match: parsePolicyMatch(raw.match, `${fieldPath}/match`),
    decision: parseDecision(raw.decision, `${fieldPath}/decision`),
    reason: optionalString(raw.reason, `${fieldPath}/reason`),
  };
}

export function defaultPolicySet(sourcePath = "<default>"): PolicySet {
  return {
    default: "ask",
    rules: [],
    sourcePath,
  };
}

export function parsePolicyYml(raw: string, sourcePath = "policies.yml"): PolicySet {
  let parsed: unknown;

  try {
    parsed = parseYaml(raw);
  } catch (error) {
    throw new PolicyParseError("POLICY_YAML_INVALID", `Policy YAML is invalid: ${error instanceof Error ? error.message : String(error)}`, {
      sourcePath,
    });
  }

  const policy = requireRecord(parsed, "");
  const rules = policy.rules ?? [];

  if (!Array.isArray(rules)) {
    throw new PolicyParseError("POLICY_SCHEMA_INVALID", "/rules must be an array.", { fieldPath: "/rules" });
  }

  return {
    default: parseDecision(policy.default, "/default"),
    rules: rules.map((rule, index) => parsePolicyRule(rule, index)),
    sourcePath,
  };
}

export async function loadPolicySet(options: ResolveStateDirOptions | string = {}): Promise<PolicySet> {
  const paths = getLocalStatePaths(options);

  try {
    return parsePolicyYml(await readFile(paths.policiesFile, "utf8"), paths.policiesFile);
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) {
      return defaultPolicySet(paths.policiesFile);
    }

    throw error;
  }
}

export interface PolicyEvaluationPermission {
  resource: string;
  action: string;
  risk: PolicyRisk;
}

export interface PolicyEvaluationInput {
  capabilityId: string;
  permissions: PolicyEvaluationPermission[];
  channel?: string;
  host?: string;
  trustLevel?: string;
  qualityScore?: number;
}

export interface PolicyPermissionDecision {
  permission: PolicyEvaluationPermission;
  decision: PolicyDecision;
  reason: string;
  matchedRuleId?: string;
  matchedRuleIndex?: number;
  defaulted: boolean;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reason: string;
  matchedRuleId?: string;
  matchedRuleIndex?: number;
  sourcePath: string;
  permissionDecisions: PolicyPermissionDecision[];
  decisionTrace: PolicyDecisionTraceV1;
}


function policySetId(policySet: PolicySet): string {
  return policySet.id ?? policySet.sourcePath;
}

function policySetRevision(policySet: PolicySet): string {
  return policySet.revision ?? `sha256:${createHash("sha256").update(stableJsonStringify({ default: policySet.default, rules: policySet.rules })).digest("hex")}`;
}

function policyTraceReasonCode(decision: PolicyPermissionDecision | undefined, policySet: PolicySet): string {
  if (decision === undefined || decision.defaulted) {
    return `RISK_POLICY_DEFAULT_${policySet.default.toUpperCase()}`;
  }

  return `RISK_POLICY_RULE_${decision.decision.toUpperCase()}`;
}

function policyDecisionAllowsSecretResolution(decision: PolicyDecision): boolean {
  return decision !== "deny";
}

function policyDecisionAllowsExecution(decision: PolicyDecision): boolean {
  return decision === "allow";
}

function riskPolicyEvaluatedFacts(input: PolicyEvaluationInput, decision: PolicyPermissionDecision | undefined): string[] {
  const facts = [
    `capability_id=${input.capabilityId}`,
    `permission_count=${input.permissions.length}`,
  ];

  if (input.channel !== undefined) {
    facts.push(`channel=${input.channel}`);
  }

  if (input.host !== undefined) {
    facts.push(`host=${input.host}`);
  }

  if (input.trustLevel !== undefined) {
    facts.push(`trust_level=${input.trustLevel}`);
  }
  if (input.qualityScore !== undefined) {
    facts.push(`quality_score=${input.qualityScore}`);
  }

  if (decision !== undefined) {
    facts.push(`resource=${decision.permission.resource}`);
    facts.push(`action=${decision.permission.action}`);
    facts.push(`risk=${decision.permission.risk}`);
  }

  return facts;
}

function riskPolicyDecisionTrace(
  policySet: PolicySet,
  input: PolicyEvaluationInput,
  decision: PolicyDecision,
  reason: string,
  finalPermissionDecision: PolicyPermissionDecision | undefined,
): PolicyDecisionTraceV1 {
  return {
    traceVersion: POLICY_TRACE_VERSION,
    policySetId: policySetId(policySet),
    policyRevision: policySetRevision(policySet),
    gate: "risk_policy",
    decision,
    matchedRuleId: finalPermissionDecision?.matchedRuleId,
    defaultDecisionUsed: finalPermissionDecision?.defaulted ?? true,
    evaluatedFacts: riskPolicyEvaluatedFacts(input, finalPermissionDecision),
    reasonCode: policyTraceReasonCode(finalPermissionDecision, policySet),
    humanReadableSummary: reason,
    secretResolutionAllowed: policyDecisionAllowsSecretResolution(decision),
    executionAllowed: policyDecisionAllowsExecution(decision),
  };
}

const POLICY_DECISION_RANK: Record<PolicyDecision, number> = {
  allow: 1,
  ask: 2,
  deny: 3,
};

function policyRuleMatches(rule: PolicyRule, input: PolicyEvaluationInput, permission: PolicyEvaluationPermission): boolean {
  const match = rule.match;

  return (
    (match.capabilityId === undefined || match.capabilityId === input.capabilityId) &&
    (match.risk === undefined || match.risk === permission.risk) &&
    (match.resource === undefined || match.resource === permission.resource) &&
    (match.action === undefined || match.action === permission.action) &&
    (match.channel === undefined || match.channel === input.channel) &&
    (match.host === undefined || match.host === input.host) &&
    (match.trustLevel === undefined || match.trustLevel === input.trustLevel)
  );
}

function evaluatePermission(
  policySet: PolicySet,
  input: PolicyEvaluationInput,
  permission: PolicyEvaluationPermission,
): PolicyPermissionDecision {
  const matchedRuleIndex = policySet.rules.findIndex((rule) => policyRuleMatches(rule, input, permission));

  if (matchedRuleIndex >= 0) {
    const matchedRule = policySet.rules[matchedRuleIndex];

    return {
      permission,
      decision: matchedRule.decision,
      reason: matchedRule.reason ?? `Matched policy rule ${matchedRule.id ?? matchedRuleIndex}.`,
      matchedRuleId: matchedRule.id,
      matchedRuleIndex,
      defaulted: false,
    };
  }

  return {
    permission,
    decision: policySet.default,
    reason: `Default policy decision: ${policySet.default}.`,
    defaulted: true,
  };
}

function stricterPolicyDecision(
  current: PolicyPermissionDecision,
  next: PolicyPermissionDecision,
): PolicyPermissionDecision {
  return POLICY_DECISION_RANK[next.decision] > POLICY_DECISION_RANK[current.decision] ? next : current;
}

export function evaluatePolicy(policySet: PolicySet, input: PolicyEvaluationInput): PolicyEvaluationResult {
  const permissionDecisions = input.permissions.map((permission) => evaluatePermission(policySet, input, permission));

  if (permissionDecisions.length === 0) {
    const reason = `Default policy decision: ${policySet.default}.`;
    return {
      decision: policySet.default,
      reason,
      sourcePath: policySet.sourcePath,
      permissionDecisions: [],
      decisionTrace: riskPolicyDecisionTrace(policySet, input, policySet.default, reason, undefined),
    };
  }

  const finalPermissionDecision = permissionDecisions.reduce(stricterPolicyDecision);

  return {
    decision: finalPermissionDecision.decision,
    reason: finalPermissionDecision.reason,
    matchedRuleId: finalPermissionDecision.matchedRuleId,
    matchedRuleIndex: finalPermissionDecision.matchedRuleIndex,
    sourcePath: policySet.sourcePath,
    permissionDecisions,
    decisionTrace: riskPolicyDecisionTrace(policySet, input, finalPermissionDecision.decision, finalPermissionDecision.reason, finalPermissionDecision),
  };
}

export type ConfirmationChannel = "cli" | "mcp";
export type ConfirmationStatus = "approved" | "rejected" | "confirmation_required" | "denied";

export interface ConfirmationEgressField {
  path: string;
  destination: DataEgressContext["renderedFields"][number]["destination"];
  dataClasses: DataEgressContext["dataClasses"];
}

export interface ConfirmationEgressSummary {
  targetOrigin: string;
  dataClasses: DataEgressContext["dataClasses"];
  fields: ConfirmationEgressField[];
  redactedPreview: unknown;
}

export interface ConfirmationRequest {
  capabilityId: string;
  policy: PolicyEvaluationResult;
  channel: ConfirmationChannel;
  operationSummary?: string;
  input?: unknown;
  egress?: ConfirmationEgressSummary;
  compositionContext?: CompositionContextEvidence;
}

export interface ConfirmationResult {
  status: ConfirmationStatus;
  channel: ConfirmationChannel;
  policyDecision: PolicyDecision;
  prompted: boolean;
  reason: string;
}

export interface ConfirmationHandler {
  confirm(request: ConfirmationRequest): Promise<ConfirmationResult>;
}

export const REDACTED_VALUE = "[REDACTED]";
export const SENSITIVE_FIELD_FRAGMENTS = [
  "token",
  "secret",
  "password",
  "api_key",
  "authorization",
  "cookie",
  "credential",
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSensitiveFieldName(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase();
  return SENSITIVE_FIELD_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function redactInput(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactInput(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, isSensitiveFieldName(key) ? REDACTED_VALUE : redactInput(nestedValue)]),
  );
}

function normalizeForStableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForStableJson(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, normalizeForStableJson(value[key])]),
  );
}

export function stableJsonStringify(value: unknown): string {
  return JSON.stringify(normalizeForStableJson(value));
}

export function hashInput(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableJsonStringify(value)).digest("hex")}`;
}

function hasTransformation(transformations: string[], fragment: string): boolean {
  return transformations.some((transformation) => transformation.toLowerCase().includes(fragment));
}

function digestEvidenceValue(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableJsonStringify(value)).digest("hex")}`;
}

export function createInputProvenanceEvidence(input: CreateInputProvenanceEvidenceInput): InputProvenanceEvidence {
  const transformations = [...new Set(input.transformations ?? [])].sort();
  return {
    inputHash: hashInput(input.input),
    inputSource: input.inputSource,
    derivedFromInvocationId: input.derivedFromInvocationId,
    sourceResultDigest: input.sourceResultDigest ?? (input.sourceResult === undefined ? undefined : digestEvidenceValue(input.sourceResult)),
    dataClasses: [...(input.dataClasses ?? [])],
    redactionApplied: hasTransformation(transformations, "redact"),
    minimizationApplied: hasTransformation(transformations, "minim"),
    egressTargetOrigin: input.egressTargetOrigin,
    egressDecision: input.egressDecision,
    policyRuleId: input.policyRuleId,
    transformations,
  };
}

export function confirmationSummaryFromDataEgress(decision: DataEgressDecisionResult): ConfirmationEgressSummary {
  return {
    targetOrigin: decision.evidence.targetOrigin,
    dataClasses: [...decision.evidence.dataClasses],
    fields: decision.evidence.renderedFields.map((field) => ({
      path: field.path,
      destination: field.destination,
      dataClasses: [...field.dataClasses],
    })),
    redactedPreview: decision.evidence.redactedPreview,
  };
}

export type CliPrompt = (message: string) => Promise<string>;

export interface CliConfirmationHandlerOptions {
  prompt?: CliPrompt;
  assumeYes?: boolean;
}

function confirmationResult(
  request: ConfirmationRequest,
  status: ConfirmationStatus,
  reason: string,
  prompted: boolean,
): ConfirmationResult {
  return {
    status,
    channel: request.channel,
    policyDecision: request.policy.decision,
    prompted,
    reason,
  };
}

async function defaultCliPrompt(message: string): Promise<string> {
  const rl = createInterface({ input: processStdin, output: processStdout });

  try {
    return await rl.question(message);
  } finally {
    rl.close();
  }
}

function egressFieldsSummary(fields: ConfirmationEgressField[]): string {
  if (fields.length === 0) {
    return "none";
  }

  return fields
    .map((field) => {
      const dataClasses = field.dataClasses.length === 0 ? "none" : field.dataClasses.join(", ");
      return `${field.path} -> ${field.destination} [${dataClasses}]`;
    })
    .join(", ");
}

function confirmationEgressText(egress: ConfirmationEgressSummary | undefined): string {
  if (egress === undefined) {
    return "";
  }

  const dataClasses = egress.dataClasses.length === 0 ? "none" : egress.dataClasses.join(", ");
  return [
    `Target origin: ${egress.targetOrigin}`,
    `Data classes: ${dataClasses}`,
    `Fields sent: ${egressFieldsSummary(egress.fields)}`,
    `Preview: ${stableJsonStringify(egress.redactedPreview)}`,
  ].join("\n");
}

function confirmationReasonWithEgress(baseReason: string, request: ConfirmationRequest): string {
  const egressText = confirmationEgressText(request.egress);
  return egressText.length === 0 ? baseReason : `${baseReason}\n${egressText}`;
}

function approvalQuestion(request: ConfirmationRequest): string {
  const summary = request.operationSummary ?? request.capabilityId;
  const egressText = confirmationEgressText(request.egress);
  const details = egressText.length === 0 ? "" : `\n${egressText}`;
  return `OpenCap wants to run ${summary}.${details}\nAllow once? [y/N] `;
}

function hasManualOnlyRisk(policy: PolicyEvaluationResult): boolean {
  return policy.permissionDecisions.some((decision) =>
    decision.permission.risk === "financial" || decision.permission.risk === "destructive",
  );
}

export class CliConfirmationHandler implements ConfirmationHandler {
  private readonly prompt: CliPrompt;
  private readonly assumeYes: boolean;

  constructor(promptOrOptions: CliPrompt | CliConfirmationHandlerOptions = defaultCliPrompt) {
    if (typeof promptOrOptions === "function") {
      this.prompt = promptOrOptions;
      this.assumeYes = false;
      return;
    }

    this.prompt = promptOrOptions.prompt ?? defaultCliPrompt;
    this.assumeYes = promptOrOptions.assumeYes ?? false;
  }

  async confirm(request: ConfirmationRequest): Promise<ConfirmationResult> {
    if (request.policy.decision === "allow") {
      return confirmationResult(request, "approved", "Policy allowed without confirmation.", false);
    }

    if (request.policy.decision === "deny") {
      return confirmationResult(request, "denied", request.policy.reason, false);
    }

    if (this.assumeYes) {
      if (hasManualOnlyRisk(request.policy)) {
        return confirmationResult(request, "rejected", "Manual confirmation is required for financial or destructive actions.", false);
      }

      return confirmationResult(request, "approved", "CLI --yes approved this invocation once.", false);
    }

    const answer = (await this.prompt(approvalQuestion(request))).trim().toLowerCase();

    if (answer === "y" || answer === "yes") {
      return confirmationResult(request, "approved", "User approved this invocation once.", true);
    }

    return confirmationResult(request, "rejected", "User rejected this invocation.", true);
  }
}

export class McpNoElicitationConfirmationHandler implements ConfirmationHandler {
  async confirm(request: ConfirmationRequest): Promise<ConfirmationResult> {
    if (request.policy.decision === "allow") {
      return confirmationResult(request, "approved", "Policy allowed without confirmation.", false);
    }

    if (request.policy.decision === "deny") {
      return confirmationResult(request, "denied", request.policy.reason, false);
    }

    return confirmationResult(
      request,
      "confirmation_required",
      confirmationReasonWithEgress("This capability requires human confirmation, but this MCP channel cannot prompt.", request),
      false,
    );
  }
}

export type AuditInvocationStatus = "blocked" | "denied" | "executed" | "dry_run";
export type AuditConsentDecision = "approved" | "rejected" | "unavailable" | "expired";
export type AuditConsentSubject = "local_user" | "unknown";
export type CompositionInitiatedBy = "host" | "user" | "runtime" | "external_agent";

export interface AuditConsentReceiptEvidence {
  consentId: string;
  consentDecision: AuditConsentDecision;
  consentDecidedAt: string;
  consentChannel: ConfirmationChannel;
  consentSubject: AuditConsentSubject;
  consentInputHash?: string;
  consentPolicyRuleId?: string;
}

export interface CompositionContextEvidence {
  compositionId: string;
  parentInvocationId?: string;
  stepId?: string;
  stepIndex?: number;
  stepName?: string;
  initiatedBy: CompositionInitiatedBy;
  planHash?: string;
  policyEffect: "none";
}

export function createCompositionContextEvidence(input: Omit<CompositionContextEvidence, "policyEffect">): CompositionContextEvidence {
  return {
    compositionId: input.compositionId,
    parentInvocationId: input.parentInvocationId,
    stepId: input.stepId,
    stepIndex: input.stepIndex,
    stepName: input.stepName,
    initiatedBy: input.initiatedBy,
    planHash: input.planHash,
    policyEffect: "none",
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  channel: ConfirmationChannel;
  capabilityId: string;
  status: AuditInvocationStatus;
  policyDecision: PolicyDecision;
  confirmationStatus: ConfirmationStatus;
  reason: string;
  matchedRuleId?: string;
  inputHash?: string;
  inputRedactedJson?: string;
  resolvedUrl?: string;
  credentialProvider?: string;
  credentialSource?: string;
  credentialEnvName?: string;
  credentialPlacement?: string;
  credentialResolved?: boolean;
  credentialRedacted?: string;
  requestStarted?: boolean;
  executionOutcome?: ExecutionOutcome;
  executionSideEffectKind?: ExecutionSideEffectKind;
  executionRequestStartedAt?: string;
  executionResponseReceivedAt?: string;
  executionHttpStatus?: number;
  executionRetryAttempt?: number;
  executionProviderRequestId?: string;
  executionIdempotencyKeyHash?: string;
  executionReconcileHint?: string;
  egressDecision?: DataEgressDecision;
  egressDataClasses?: DataEgressContext["dataClasses"];
  egressTargetOrigin?: string;
  egressMatchedRuleId?: string;
  egressRedactedPreviewJson?: string;
  outboundDecision?: OutboundPolicyDecision;
  outboundTargetType?: OutboundTargetType;
  outboundReasonCode?: string;
  consentId?: string;
  consentDecision?: AuditConsentDecision;
  consentDecidedAt?: string;
  consentChannel?: ConfirmationChannel;
  consentSubject?: AuditConsentSubject;
  consentInputHash?: string;
  consentPolicyRuleId?: string;
  inputProvenance?: InputProvenanceEvidence;
  policyTrace?: PolicyDecisionTraceV1;
  compositionContext?: CompositionContextEvidence;
}

export interface AuditPreflightCheck {
  id: string;
  timestamp: string;
  channel: ConfirmationChannel;
  capabilityId: string;
  reason: string;
  inputHash?: string;
  inputRedactedJson?: string;
  resolvedUrl?: string;
  requestStarted: false;
}

export interface AuditLogger {
  preflight(check: AuditPreflightCheck): Promise<void>;
  record(event: AuditEvent): Promise<void>;
}

export class InMemoryAuditLogger implements AuditLogger {
  readonly events: AuditEvent[] = [];

  async preflight(_check: AuditPreflightCheck): Promise<void> {
    return undefined;
  }

  async record(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }
}

function auditEventFromPreflightCheck(check: AuditPreflightCheck): AuditEvent {
  return {
    id: check.id,
    timestamp: check.timestamp,
    channel: check.channel,
    capabilityId: check.capabilityId,
    status: "blocked",
    policyDecision: "allow",
    confirmationStatus: "approved",
    reason: check.reason,
    inputHash: check.inputHash,
    inputRedactedJson: check.inputRedactedJson,
    resolvedUrl: check.resolvedUrl,
    requestStarted: check.requestStarted,
  };
}

function auditStatusFromConfirmation(status: ConfirmationStatus): AuditInvocationStatus {
  if (status === "denied") {
    return "denied";
  }

  if (status === "approved") {
    return "executed";
  }

  return "blocked";
}

function consentDecisionFromConfirmation(status: ConfirmationStatus): AuditConsentDecision | undefined {
  if (status === "approved") {
    return "approved";
  }

  if (status === "rejected") {
    return "rejected";
  }

  if (status === "confirmation_required") {
    return "unavailable";
  }

  return undefined;
}

function consentSubjectFromChannel(channel: ConfirmationChannel): AuditConsentSubject {
  return channel === "cli" ? "local_user" : "unknown";
}

export function createConsentReceiptAuditEvidence(
  request: ConfirmationRequest,
  confirmation: ConfirmationResult,
  timestamp = new Date(),
  inputHash = request.input === undefined ? undefined : hashInput(request.input),
): AuditConsentReceiptEvidence | undefined {
  if (request.policy.decision !== "ask") {
    return undefined;
  }

  const consentDecision = consentDecisionFromConfirmation(confirmation.status);
  if (consentDecision === undefined) {
    return undefined;
  }

  return {
    consentId: `consent_${randomUUID()}`,
    consentDecision,
    consentDecidedAt: timestamp.toISOString(),
    consentChannel: confirmation.channel,
    consentSubject: consentSubjectFromChannel(confirmation.channel),
    consentInputHash: inputHash,
    consentPolicyRuleId: request.policy.matchedRuleId,
  };
}

export function createConfirmationAuditEvent(
  request: ConfirmationRequest,
  confirmation: ConfirmationResult,
  timestamp = new Date(),
): AuditEvent {
  const inputHash = request.input === undefined ? undefined : hashInput(request.input);
  const consentReceipt = createConsentReceiptAuditEvidence(request, confirmation, timestamp, inputHash);

  return {
    id: randomUUID(),
    timestamp: timestamp.toISOString(),
    channel: request.channel,
    capabilityId: request.capabilityId,
    status: auditStatusFromConfirmation(confirmation.status),
    policyDecision: request.policy.decision,
    confirmationStatus: confirmation.status,
    reason: confirmation.reason,
    matchedRuleId: request.policy.matchedRuleId,
    inputHash,
    inputRedactedJson: request.input === undefined ? undefined : stableJsonStringify(redactInput(request.input)),
    ...consentReceipt,
    policyTrace: request.policy.decisionTrace,
    compositionContext: request.compositionContext,
  };
}

export async function confirmWithAudit(
  handler: ConfirmationHandler,
  request: ConfirmationRequest,
  logger: AuditLogger,
): Promise<{ confirmation: ConfirmationResult; auditEvent: AuditEvent }> {
  const confirmation = await handler.confirm(request);
  const auditEvent = createConfirmationAuditEvent(request, confirmation);
  await logger.record(auditEvent);

  return { confirmation, auditEvent };
}

function policyDecisionFromDataEgress(decision: DataEgressDecision): PolicyDecision {
  return decision === "redact" ? "ask" : decision;
}

function auditStatusFromDataEgress(decision: DataEgressDecision): AuditInvocationStatus {
  if (decision === "deny") {
    return "denied";
  }

  if (decision === "ask" || decision === "redact") {
    return "blocked";
  }

  return "executed";
}

function confirmationStatusFromDataEgress(decision: DataEgressDecision): ConfirmationStatus {
  if (decision === "deny") {
    return "denied";
  }

  if (decision === "ask" || decision === "redact") {
    return "confirmation_required";
  }

  return "approved";
}

export function createDataEgressAuditEvent(
  context: DataEgressContext,
  decision: DataEgressDecisionResult,
  channel: ConfirmationChannel,
  timestamp = new Date(),
): AuditEvent {
  return {
    id: randomUUID(),
    timestamp: timestamp.toISOString(),
    channel,
    capabilityId: context.capabilityId,
    status: auditStatusFromDataEgress(decision.decision),
    policyDecision: policyDecisionFromDataEgress(decision.decision),
    confirmationStatus: confirmationStatusFromDataEgress(decision.decision),
    reason: decision.summary,
    matchedRuleId: decision.matchedRuleId,
    inputHash: context.inputHash,
    inputRedactedJson: stableJsonStringify(decision.evidence.redactedPreview),
    requestStarted: false,
    egressDecision: decision.decision,
    egressDataClasses: [...decision.evidence.dataClasses],
    egressTargetOrigin: decision.evidence.targetOrigin,
    egressMatchedRuleId: decision.matchedRuleId,
    egressRedactedPreviewJson: stableJsonStringify(decision.evidence.redactedPreview),
    policyTrace: decision.decisionTrace,
  };
}

export async function recordDataEgressDecision(
  logger: AuditLogger,
  context: DataEgressContext,
  decision: DataEgressDecisionResult,
  channel: ConfirmationChannel,
  timestamp = new Date(),
): Promise<AuditEvent> {
  const auditEvent = createDataEgressAuditEvent(context, decision, channel, timestamp);
  await logger.record(auditEvent);
  return auditEvent;
}

export interface SqliteAuditLoggerOptions extends ResolveStateDirOptions {
  databaseFile?: string;
}

export interface AuditLogQuery {
  capabilityId?: string;
  status?: AuditInvocationStatus;
  policyDecision?: PolicyDecision;
  since?: string;
  until?: string;
}

interface AuditEventRow {
  id: string;
  timestamp: string;
  channel: ConfirmationChannel;
  capability_id: string;
  status: AuditInvocationStatus;
  policy_decision: PolicyDecision;
  confirmation_status: ConfirmationStatus;
  reason: string;
  matched_rule_id: string | null;
  input_hash: string | null;
  input_redacted_json: string | null;
  resolved_url: string | null;
  credential_provider: string | null;
  credential_source: string | null;
  credential_env_name: string | null;
  credential_placement: string | null;
  credential_resolved: 0 | 1 | null;
  credential_redacted: string | null;
  request_started: 0 | 1 | null;
  execution_outcome: ExecutionOutcome | null;
  execution_side_effect_kind: ExecutionSideEffectKind | null;
  execution_request_started_at: string | null;
  execution_response_received_at: string | null;
  execution_http_status: number | null;
  execution_retry_attempt: number | null;
  execution_provider_request_id: string | null;
  execution_idempotency_key_hash: string | null;
  execution_reconcile_hint: string | null;
  egress_decision: DataEgressDecision | null;
  egress_data_classes_json: string | null;
  egress_target_origin: string | null;
  egress_matched_rule_id: string | null;
  egress_redacted_preview_json: string | null;
  outbound_decision: OutboundPolicyDecision | null;
  outbound_target_type: OutboundTargetType | null;
  outbound_reason_code: string | null;
  consent_id: string | null;
  consent_decision: AuditConsentDecision | null;
  consent_decided_at: string | null;
  consent_channel: ConfirmationChannel | null;
  consent_subject: AuditConsentSubject | null;
  consent_input_hash: string | null;
  consent_policy_rule_id: string | null;
  input_provenance_json: string | null;
  policy_trace_json: string | null;
  composition_context_json: string | null;
}

const require = createRequire(import.meta.url);

type DatabaseSyncConstructor = typeof import("node:sqlite").DatabaseSync;

function openDatabaseSync(databaseFile: string): DatabaseSync {
  const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: DatabaseSyncConstructor };
  return new DatabaseSync(databaseFile);
}

const CREATE_INVOCATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS invocations (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  channel TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  status TEXT NOT NULL,
  policy_decision TEXT NOT NULL,
  confirmation_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  matched_rule_id TEXT,
  input_hash TEXT,
  input_redacted_json TEXT,
  resolved_url TEXT,
  credential_provider TEXT,
  credential_source TEXT,
  credential_env_name TEXT,
  credential_placement TEXT,
  credential_resolved INTEGER,
  credential_redacted TEXT,
  request_started INTEGER,
  execution_outcome TEXT,
  execution_side_effect_kind TEXT,
  execution_request_started_at TEXT,
  execution_response_received_at TEXT,
  execution_http_status INTEGER,
  execution_retry_attempt INTEGER,
  execution_provider_request_id TEXT,
  execution_idempotency_key_hash TEXT,
  execution_reconcile_hint TEXT,
  egress_decision TEXT,
  egress_data_classes_json TEXT,
  egress_target_origin TEXT,
  egress_matched_rule_id TEXT,
  egress_redacted_preview_json TEXT,
  outbound_decision TEXT,
  outbound_target_type TEXT,
  outbound_reason_code TEXT,
  consent_id TEXT,
  consent_decision TEXT,
  consent_decided_at TEXT,
  consent_channel TEXT,
  consent_subject TEXT,
  consent_input_hash TEXT,
  consent_policy_rule_id TEXT,
  input_provenance_json TEXT,
  policy_trace_json TEXT,
  composition_context_json TEXT
) STRICT;
`;


function ensureAuditSchema(database: DatabaseSync): void {
  const columns = database.prepare("PRAGMA table_info(invocations)").all() as unknown as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("resolved_url")) {
    database.exec("ALTER TABLE invocations ADD COLUMN resolved_url TEXT");
  }

  const additionalColumns: Array<[string, string]> = [
    ["credential_provider", "TEXT"],
    ["credential_source", "TEXT"],
    ["credential_env_name", "TEXT"],
    ["credential_placement", "TEXT"],
    ["credential_resolved", "INTEGER"],
    ["credential_redacted", "TEXT"],
    ["request_started", "INTEGER"],
    ["execution_outcome", "TEXT"],
    ["execution_side_effect_kind", "TEXT"],
    ["execution_request_started_at", "TEXT"],
    ["execution_response_received_at", "TEXT"],
    ["execution_http_status", "INTEGER"],
    ["execution_retry_attempt", "INTEGER"],
    ["execution_provider_request_id", "TEXT"],
    ["execution_idempotency_key_hash", "TEXT"],
    ["execution_reconcile_hint", "TEXT"],
    ["egress_decision", "TEXT"],
    ["egress_data_classes_json", "TEXT"],
    ["egress_target_origin", "TEXT"],
    ["egress_matched_rule_id", "TEXT"],
    ["egress_redacted_preview_json", "TEXT"],
    ["outbound_decision", "TEXT"],
    ["outbound_target_type", "TEXT"],
    ["outbound_reason_code", "TEXT"],
    ["consent_id", "TEXT"],
    ["consent_decision", "TEXT"],
    ["consent_decided_at", "TEXT"],
    ["consent_channel", "TEXT"],
    ["consent_subject", "TEXT"],
    ["consent_input_hash", "TEXT"],
    ["consent_policy_rule_id", "TEXT"],
    ["input_provenance_json", "TEXT"],
    ["policy_trace_json", "TEXT"],
    ["composition_context_json", "TEXT"],
  ];

  for (const [columnName, columnType] of additionalColumns) {
    if (!columnNames.has(columnName)) {
      database.exec(`ALTER TABLE invocations ADD COLUMN ${columnName} ${columnType}`);
    }
  }
}

function parseEgressDataClasses(value: string | null): DataEgressContext["dataClasses"] | undefined {
  if (value === null) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is DataEgressContext["dataClasses"][number] => typeof item === "string") : undefined;
  } catch {
    return undefined;
  }
}

function parseInputProvenance(value: string | null): InputProvenanceEvidence | undefined {
  if (value === null) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Partial<InputProvenanceEvidence>;
    if (typeof parsed.inputHash !== "string" || typeof parsed.inputSource !== "string") {
      return undefined;
    }

    return {
      inputHash: parsed.inputHash,
      inputSource: parsed.inputSource as InputProvenanceSource,
      derivedFromInvocationId: typeof parsed.derivedFromInvocationId === "string" ? parsed.derivedFromInvocationId : undefined,
      sourceResultDigest: typeof parsed.sourceResultDigest === "string" ? parsed.sourceResultDigest : undefined,
      dataClasses: Array.isArray(parsed.dataClasses) ? parsed.dataClasses.filter((item): item is DataEgressContext["dataClasses"][number] => typeof item === "string") : [],
      redactionApplied: parsed.redactionApplied === true,
      minimizationApplied: parsed.minimizationApplied === true,
      egressTargetOrigin: typeof parsed.egressTargetOrigin === "string" ? parsed.egressTargetOrigin : undefined,
      egressDecision: typeof parsed.egressDecision === "string" ? parsed.egressDecision as DataEgressDecision : undefined,
      policyRuleId: typeof parsed.policyRuleId === "string" ? parsed.policyRuleId : undefined,
      transformations: Array.isArray(parsed.transformations) ? parsed.transformations.filter((item): item is string => typeof item === "string") : [],
    };
  } catch {
    return undefined;
  }
}


function parsePolicyTrace(value: string | null): PolicyDecisionTraceV1 | undefined {
  if (value === null) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PolicyDecisionTraceV1>;
    if (parsed.traceVersion !== POLICY_TRACE_VERSION || typeof parsed.policySetId !== "string" || typeof parsed.policyRevision !== "string") {
      return undefined;
    }

    return {
      traceVersion: POLICY_TRACE_VERSION,
      policySetId: parsed.policySetId,
      policyRevision: parsed.policyRevision,
      gate: parsed.gate as PolicyDecisionTraceV1["gate"],
      decision: parsed.decision as PolicyDecisionTraceV1["decision"],
      matchedRuleId: typeof parsed.matchedRuleId === "string" ? parsed.matchedRuleId : undefined,
      defaultDecisionUsed: parsed.defaultDecisionUsed === true,
      evaluatedFacts: Array.isArray(parsed.evaluatedFacts) ? parsed.evaluatedFacts.filter((item): item is string => typeof item === "string") : [],
      reasonCode: typeof parsed.reasonCode === "string" ? parsed.reasonCode : "UNKNOWN",
      humanReadableSummary: typeof parsed.humanReadableSummary === "string" ? parsed.humanReadableSummary : "Policy trace unavailable.",
      secretResolutionAllowed: parsed.secretResolutionAllowed === true,
      executionAllowed: parsed.executionAllowed === true,
    };
  } catch {
    return undefined;
  }
}

function parseCompositionContext(value: string | null): CompositionContextEvidence | undefined {
  if (value === null) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Partial<CompositionContextEvidence>;
    if (typeof parsed.compositionId !== "string" || typeof parsed.initiatedBy !== "string" || parsed.policyEffect !== "none") {
      return undefined;
    }

    return {
      compositionId: parsed.compositionId,
      parentInvocationId: typeof parsed.parentInvocationId === "string" ? parsed.parentInvocationId : undefined,
      stepId: typeof parsed.stepId === "string" ? parsed.stepId : undefined,
      stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : undefined,
      stepName: typeof parsed.stepName === "string" ? parsed.stepName : undefined,
      initiatedBy: parsed.initiatedBy as CompositionInitiatedBy,
      planHash: typeof parsed.planHash === "string" ? parsed.planHash : undefined,
      policyEffect: "none",
    };
  } catch {
    return undefined;
  }
}

function auditEventFromRow(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    timestamp: row.timestamp,
    channel: row.channel,
    capabilityId: row.capability_id,
    status: row.status,
    policyDecision: row.policy_decision,
    confirmationStatus: row.confirmation_status,
    reason: row.reason,
    matchedRuleId: row.matched_rule_id ?? undefined,
    inputHash: row.input_hash ?? undefined,
    inputRedactedJson: row.input_redacted_json ?? undefined,
    resolvedUrl: row.resolved_url ?? undefined,
    credentialProvider: row.credential_provider ?? undefined,
    credentialSource: row.credential_source ?? undefined,
    credentialEnvName: row.credential_env_name ?? undefined,
    credentialPlacement: row.credential_placement ?? undefined,
    credentialResolved: row.credential_resolved === null ? undefined : row.credential_resolved === 1,
    credentialRedacted: row.credential_redacted ?? undefined,
    requestStarted: row.request_started === null ? undefined : row.request_started === 1,
    executionOutcome: row.execution_outcome ?? undefined,
    executionSideEffectKind: row.execution_side_effect_kind ?? undefined,
    executionRequestStartedAt: row.execution_request_started_at ?? undefined,
    executionResponseReceivedAt: row.execution_response_received_at ?? undefined,
    executionHttpStatus: row.execution_http_status ?? undefined,
    executionRetryAttempt: row.execution_retry_attempt ?? undefined,
    executionProviderRequestId: row.execution_provider_request_id ?? undefined,
    executionIdempotencyKeyHash: row.execution_idempotency_key_hash ?? undefined,
    executionReconcileHint: row.execution_reconcile_hint ?? undefined,
    egressDecision: row.egress_decision ?? undefined,
    egressDataClasses: parseEgressDataClasses(row.egress_data_classes_json),
    egressTargetOrigin: row.egress_target_origin ?? undefined,
    egressMatchedRuleId: row.egress_matched_rule_id ?? undefined,
    egressRedactedPreviewJson: row.egress_redacted_preview_json ?? undefined,
    outboundDecision: row.outbound_decision ?? undefined,
    outboundTargetType: row.outbound_target_type ?? undefined,
    outboundReasonCode: row.outbound_reason_code ?? undefined,
    consentId: row.consent_id ?? undefined,
    consentDecision: row.consent_decision ?? undefined,
    consentDecidedAt: row.consent_decided_at ?? undefined,
    consentChannel: row.consent_channel ?? undefined,
    consentSubject: row.consent_subject ?? undefined,
    consentInputHash: row.consent_input_hash ?? undefined,
    consentPolicyRuleId: row.consent_policy_rule_id ?? undefined,
    inputProvenance: parseInputProvenance(row.input_provenance_json),
    policyTrace: parsePolicyTrace(row.policy_trace_json),
    compositionContext: parseCompositionContext(row.composition_context_json),
  };
}

export class SqliteAuditLogger implements AuditLogger {
  private readonly database: DatabaseSync;
  readonly databaseFile: string;

  constructor(options: SqliteAuditLoggerOptions | string = {}) {
    this.databaseFile = typeof options === "string" ? resolve(options) : resolve(options.databaseFile ?? getLocalStatePaths(options).logsDatabaseFile);
    mkdirSync(dirname(this.databaseFile), { recursive: true });
    this.database = openDatabaseSync(this.databaseFile);
    this.database.exec(CREATE_INVOCATIONS_TABLE_SQL);
    ensureAuditSchema(this.database);
  }

  private insertEvent(event: AuditEvent): void {
    this.database
      .prepare(
        `INSERT INTO invocations (
          id, timestamp, channel, capability_id, status, policy_decision, confirmation_status, reason, matched_rule_id,
          input_hash, input_redacted_json, resolved_url, credential_provider, credential_source, credential_env_name,
          credential_placement, credential_resolved, credential_redacted, request_started, execution_outcome, execution_side_effect_kind,
          execution_request_started_at, execution_response_received_at, execution_http_status, execution_retry_attempt,
          execution_provider_request_id, execution_idempotency_key_hash, execution_reconcile_hint, egress_decision, egress_data_classes_json,
          egress_target_origin, egress_matched_rule_id, egress_redacted_preview_json, outbound_decision, outbound_target_type,
          outbound_reason_code, consent_id, consent_decision, consent_decided_at, consent_channel, consent_subject,
          consent_input_hash, consent_policy_rule_id, input_provenance_json, policy_trace_json, composition_context_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        event.id,
        event.timestamp,
        event.channel,
        event.capabilityId,
        event.status,
        event.policyDecision,
        event.confirmationStatus,
        event.reason,
        event.matchedRuleId ?? null,
        event.inputHash ?? null,
        event.inputRedactedJson ?? null,
        event.resolvedUrl ?? null,
        event.credentialProvider ?? null,
        event.credentialSource ?? null,
        event.credentialEnvName ?? null,
        event.credentialPlacement ?? null,
        event.credentialResolved === undefined ? null : event.credentialResolved ? 1 : 0,
        event.credentialRedacted ?? null,
        event.requestStarted === undefined ? null : event.requestStarted ? 1 : 0,
        event.executionOutcome ?? null,
        event.executionSideEffectKind ?? null,
        event.executionRequestStartedAt ?? null,
        event.executionResponseReceivedAt ?? null,
        event.executionHttpStatus ?? null,
        event.executionRetryAttempt ?? null,
        event.executionProviderRequestId ?? null,
        event.executionIdempotencyKeyHash ?? null,
        event.executionReconcileHint ?? null,
        event.egressDecision ?? null,
        event.egressDataClasses === undefined ? null : stableJsonStringify(event.egressDataClasses),
        event.egressTargetOrigin ?? null,
        event.egressMatchedRuleId ?? null,
        event.egressRedactedPreviewJson ?? null,
        event.outboundDecision ?? null,
        event.outboundTargetType ?? null,
        event.outboundReasonCode ?? null,
        event.consentId ?? null,
        event.consentDecision ?? null,
        event.consentDecidedAt ?? null,
        event.consentChannel ?? null,
        event.consentSubject ?? null,
        event.consentInputHash ?? null,
        event.consentPolicyRuleId ?? null,
        event.inputProvenance === undefined ? null : stableJsonStringify(event.inputProvenance),
        event.policyTrace === undefined ? null : stableJsonStringify(event.policyTrace),
        event.compositionContext === undefined ? null : stableJsonStringify(event.compositionContext),
      );
  }

  async preflight(check: AuditPreflightCheck): Promise<void> {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.insertEvent(auditEventFromPreflightCheck(check));
      this.database.exec("ROLLBACK");
    } catch (error) {
      try {
        this.database.exec("ROLLBACK");
      } catch {
        // Preserve the original audit preflight failure.
      }
      throw error;
    }
  }

  async record(event: AuditEvent): Promise<void> {
    this.insertEvent(event);
  }

  async recent(limit = 20, query: AuditLogQuery = {}): Promise<AuditEvent[]> {
    const where: string[] = [];
    const params: Array<string | number> = [];

    if (query.capabilityId !== undefined) {
      where.push("capability_id = ?");
      params.push(query.capabilityId);
    }

    if (query.status !== undefined) {
      where.push("status = ?");
      params.push(query.status);
    }

    if (query.policyDecision !== undefined) {
      where.push("policy_decision = ?");
      params.push(query.policyDecision);
    }

    if (query.since !== undefined) {
      where.push("timestamp >= ?");
      params.push(query.since);
    }

    if (query.until !== undefined) {
      where.push("timestamp <= ?");
      params.push(query.until);
    }

    params.push(limit);
    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const rows = this.database
      .prepare(
        `SELECT id, timestamp, channel, capability_id, status, policy_decision, confirmation_status, reason, matched_rule_id,
                input_hash, input_redacted_json, resolved_url, credential_provider, credential_source, credential_env_name,
                credential_placement, credential_resolved, credential_redacted, request_started, execution_outcome, execution_side_effect_kind,
                execution_request_started_at, execution_response_received_at, execution_http_status, execution_retry_attempt,
                execution_provider_request_id, execution_idempotency_key_hash, execution_reconcile_hint, egress_decision, egress_data_classes_json,
                egress_target_origin, egress_matched_rule_id, egress_redacted_preview_json, outbound_decision, outbound_target_type,
                outbound_reason_code, consent_id, consent_decision, consent_decided_at, consent_channel, consent_subject,
                consent_input_hash, consent_policy_rule_id, input_provenance_json, policy_trace_json, composition_context_json
         FROM invocations
         ${whereSql}
         ORDER BY timestamp DESC, id DESC
         LIMIT ?`,
      )
      .all(...params) as unknown as AuditEventRow[];

    return rows.map(auditEventFromRow);
  }

  close(): void {
    this.database.close();
  }
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

export function resolveStateDir(options: ResolveStateDirOptions = {}): string {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const configured = firstNonEmpty(options.stateDir, env[OPENCAP_STATE_DIR_ENV], DEFAULT_STATE_DIR_NAME);

  return resolve(cwd, configured ?? DEFAULT_STATE_DIR_NAME);
}

export function resolveRegistryDir(options: ResolveRegistryDirOptions = {}): string {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const configured = firstNonEmpty(options.registryDir, env[OPENCAP_REGISTRY_DIR_ENV], DEFAULT_REGISTRY_DIR_NAME);

  return resolve(cwd, configured ?? DEFAULT_REGISTRY_DIR_NAME);
}

export function getLocalStatePaths(options: ResolveStateDirOptions | string = {}): LocalStatePaths {
  const root = typeof options === "string" ? resolve(options) : resolveStateDir(options);

  return {
    root,
    installedDir: resolve(root, "installed"),
    tmpDir: resolve(root, "tmp"),
    cacheDir: resolve(root, "cache"),
    policiesFile: resolve(root, "policies.yml"),
    logsDatabaseFile: resolve(root, "logs.sqlite"),
  };
}

export async function ensureLocalStateDir(options: ResolveStateDirOptions | string = {}): Promise<LocalStatePaths> {
  const paths = getLocalStatePaths(options);

  await mkdir(paths.installedDir, { recursive: true });
  await mkdir(paths.tmpDir, { recursive: true });

  try {
    await writeFile(paths.policiesFile, DEFAULT_POLICIES_YML, { flag: "wx" });
  } catch (error) {
    if (!isFileExistsError(error)) {
      throw error;
    }
  }

  return paths;
}


function hasErrorCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function isFileExistsError(error: unknown): error is NodeJS.ErrnoException {
  return hasErrorCode(error, "EEXIST");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findCapabilityDirs(registryDir: string, id: string): Promise<string[]> {
  const entries = await readdir(registryDir, { withFileTypes: true });
  const matches: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = join(registryDir, entry.name);

    if (entry.name === id && (await pathExists(join(entryPath, "manifest.yml")))) {
      matches.push(entryPath);
      continue;
    }

    matches.push(...(await findCapabilityDirs(entryPath, id)));
  }

  return matches.sort();
}

export async function installCapability(options: InstallCapabilityOptions): Promise<InstallCapabilityResult> {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const registryDir = resolveRegistryDir({ cwd, env, registryDir: options.registryDir });

  if (!(await pathExists(registryDir))) {
    throw new InstallCapabilityError("REGISTRY_NOT_FOUND", `Registry directory not found: ${registryDir}`, {
      registryDir,
    });
  }

  const matches = await findCapabilityDirs(registryDir, options.id);

  if (matches.length === 0) {
    throw new InstallCapabilityError("CAPABILITY_NOT_FOUND", `Capability not found in registry: ${options.id}`, {
      id: options.id,
      registryDir,
    });
  }

  if (matches.length > 1) {
    throw new InstallCapabilityError("CAPABILITY_AMBIGUOUS", `Multiple registry entries found for capability: ${options.id}`, {
      id: options.id,
      matches,
    });
  }

  const sourceDir = matches[0];
  const manifestPath = join(sourceDir, "manifest.yml");
  const validation = await validateManifestFile(manifestPath);

  if (!validation.ok) {
    throw new InstallCapabilityError("CAPABILITY_INVALID", `Capability manifest is invalid: ${manifestPath}`, {
      id: options.id,
      issues: validation.issues,
    });
  }

  if (validation.manifest.id !== options.id) {
    throw new InstallCapabilityError("CAPABILITY_INVALID", `Capability id mismatch: expected ${options.id}, got ${validation.manifest.id}`, {
      id: options.id,
      manifestId: validation.manifest.id,
    });
  }

  const paths = await ensureLocalStateDir({ cwd, env, stateDir: options.stateDir });
  const destinationDir = join(paths.installedDir, options.id);
  const alreadyInstalled = await pathExists(destinationDir);

  if (alreadyInstalled && !options.force) {
    throw new InstallCapabilityError("CAPABILITY_ALREADY_INSTALLED", `Capability already installed: ${options.id}. Use --force to replace it.`, {
      id: options.id,
      destinationDir,
    });
  }

  const tmpInstallDir = join(paths.tmpDir, `install-${options.id}-${randomUUID()}`);

  try {
    await cp(sourceDir, tmpInstallDir, { recursive: true, errorOnExist: true });

    if (alreadyInstalled) {
      await rm(destinationDir, { recursive: true, force: true });
    }

    await rename(tmpInstallDir, destinationDir);
  } catch (error) {
    await rm(tmpInstallDir, { recursive: true, force: true });
    throw error;
  }

  return {
    id: options.id,
    sourceDir,
    destinationDir,
    manifest: validation.manifest,
    warnings: [createCapabilityLifecycleWarning(validation.manifest, "install")].filter(
      (warning): warning is CapabilityLifecycleWarning => warning !== undefined,
    ),
  };
}



async function installedEntries(installedDir: string): Promise<Array<{ name: string; installPath: string; manifestPath: string }>> {
  if (!(await pathExists(installedDir))) {
    return [];
  }

  const entries = await readdir(installedDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const installPath = join(installedDir, entry.name);
      return {
        name: entry.name,
        installPath,
        manifestPath: join(installPath, "manifest.yml"),
      };
    });
}

export async function loadInstalledCapabilities(options: ResolveStateDirOptions | string = {}): Promise<InstalledCapabilityLoadResult> {
  const paths = getLocalStatePaths(options);
  const entries = await installedEntries(paths.installedDir);
  const capabilities: InstalledCapability[] = [];
  const invalid: InstalledCapabilityLoadIssue[] = [];

  for (const entry of entries) {
    const validation = await validateManifestFile(entry.manifestPath);

    if (!validation.ok) {
      invalid.push({
        id: entry.name,
        installPath: entry.installPath,
        manifestPath: entry.manifestPath,
        error: validation.issues.map((issue) => `${issue.fieldPath} ${issue.message}`).join("; "),
      });
      continue;
    }

    capabilities.push({
      id: validation.manifest.id,
      version: validation.manifest.version,
      installPath: entry.installPath,
      manifestPath: entry.manifestPath,
      manifest: validation.manifest,
    });
  }

  return { capabilities, invalid };
}

function parseSemver(version: string): [number, number, number] | undefined {
  const match = version.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/);
  if (match === null) {
    return undefined;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(left: string, right: string): number | undefined {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);
  if (leftParts === undefined || rightParts === undefined) {
    return undefined;
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] < rightParts[index]) {
      return -1;
    }
    if (leftParts[index] > rightParts[index]) {
      return 1;
    }
  }
  return 0;
}

function versionMatchesAdvisoryRange(version: string, range: string): boolean {
  const trimmed = range.trim();
  if (trimmed === "*" || trimmed === version) {
    return true;
  }

  for (const operator of ["<=", ">=", "<", ">", "="] as const) {
    if (!trimmed.startsWith(operator)) {
      continue;
    }
    const target = trimmed.slice(operator.length).trim();
    const comparison = compareSemver(version, target);
    if (comparison === undefined) {
      return false;
    }
    if (operator === "<=") {
      return comparison <= 0;
    }
    if (operator === ">=") {
      return comparison >= 0;
    }
    if (operator === "<") {
      return comparison < 0;
    }
    if (operator === ">") {
      return comparison > 0;
    }
    return comparison === 0;
  }

  return false;
}

function advisoryAffectsInstalledCapability(advisory: CapabilityAdvisory, capability: InstalledCapability): boolean {
  return advisory.capability === capability.id && advisory.affected_versions.some((range) => versionMatchesAdvisoryRange(capability.version, range));
}

export async function checkInstalledCapabilityAdvisories(
  options: ResolveStateDirOptions & ResolveRegistryDirOptions = {},
): Promise<InstalledCapabilityAdvisoryCheckResult> {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const registryDir = resolveRegistryDir({ cwd, env, registryDir: options.registryDir });
  const installed = await loadInstalledCapabilities({ cwd, env, stateDir: options.stateDir });
  const advisoryResult = await validateCapabilityAdvisoryPath(registryDir);
  const matches: InstalledCapabilityAdvisoryMatch[] = [];

  for (const capability of installed.capabilities) {
    for (const advisory of advisoryResult.valid.map((valid) => valid.advisory)) {
      if (!advisoryAffectsInstalledCapability(advisory, capability)) {
        continue;
      }
      matches.push({
        capabilityId: capability.id,
        installedVersion: capability.version,
        advisoryId: advisory.id,
        severity: advisory.severity,
        status: advisory.status,
        affected: true,
        affectedVersions: [...advisory.affected_versions],
        registryAction: advisory.actions.registry,
        runtimeDefault: advisory.actions.runtime_default,
        fixedVersion: advisory.actions.fixed_version,
        summary: advisory.summary,
        modifiedAt: advisory.modified_at,
      });
    }
  }

  return {
    checkedInstalledCapabilities: installed.capabilities.map((capability) => capability.id).sort(),
    matches: matches.sort((left, right) => `${left.capabilityId}:${left.advisoryId}`.localeCompare(`${right.capabilityId}:${right.advisoryId}`)),
    invalidAdvisories: advisoryResult.invalid,
  };
}

export interface CapabilityRiskSummary {
  permissionSummary: string;
  riskSummary: string;
  confirmationSummary: string;
  risks: Array<CapabilityManifest["permissions"][number]["risk"]>;
}

export class CapabilityRiskSummaryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapabilityRiskSummaryValidationError";
  }
}

const RISK_SUMMARY_ORDER: Array<CapabilityManifest["permissions"][number]["risk"]> = [
  "read_only",
  "write",
  "external_send",
  "destructive",
  "financial",
  "code_execution",
  "secret_access",
];

function summarizeConfirmation(permissions: CapabilityManifest["permissions"]): string {
  const risks = new Set(permissions.map((permission) => permission.risk));
  const parts: string[] = [];

  if (risks.has("read_only")) {
    parts.push("read-only actions can run when policy allows");
  }

  if (risks.has("write")) {
    parts.push("write actions require policy approval or confirmation");
  }

  if (["external_send", "destructive", "financial", "code_execution", "secret_access"].some((risk) => risks.has(risk as CapabilityManifest["permissions"][number]["risk"]))) {
    parts.push("higher-risk actions require explicit policy approval and confirmation");
  }

  return parts.length > 0 ? parts.join("; ") : "policy decides whether confirmation is required";
}

export function buildCapabilityRiskSummary(manifest: Pick<CapabilityManifest, "permissions">): CapabilityRiskSummary {
  if (!Array.isArray(manifest.permissions) || manifest.permissions.length === 0) {
    throw new CapabilityRiskSummaryValidationError("Capability permissions are required to build a risk summary.");
  }

  const riskSet = new Set(manifest.permissions.map((permission) => permission.risk));
  const risks = RISK_SUMMARY_ORDER.filter((risk) => riskSet.has(risk));

  return {
    permissionSummary: manifest.permissions
      .map((permission) => `${permission.resource}:${permission.action}:${permission.risk}:${permission.confirmation}`)
      .join(", "),
    riskSummary: risks.join(", "),
    confirmationSummary: summarizeConfirmation(manifest.permissions),
    risks,
  };
}

function summarizeRisk(manifest: CapabilityManifest): string {
  return buildCapabilityRiskSummary(manifest).riskSummary.replaceAll(", ", ",");
}

function metadataString(manifest: CapabilityManifest, key: string): string | undefined {
  const value = manifest.metadata[key];
  return typeof value === "string" ? value : undefined;
}

function lifecycleWarningSummary(manifest: CapabilityManifest, lifecycle: CapabilityManifest["lifecycle"], phase: CapabilityLifecycleWarningPhase): string {
  const phaseText = phase === "install" ? "Installing" : phase === "list" ? "Installed capability" : "Invoking";
  const message = lifecycle?.message === undefined ? "" : ` ${lifecycle.message}`;
  return `${phaseText} ${manifest.id} is ${lifecycle?.status} since ${lifecycle?.since}: ${lifecycle?.reason}.${message}`;
}

export function createCapabilityLifecycleWarning(
  manifest: CapabilityManifest,
  phase: CapabilityLifecycleWarningPhase,
): CapabilityLifecycleWarning | undefined {
  if (manifest.lifecycle === undefined) {
    return undefined;
  }

  return {
    phase,
    capabilityId: manifest.id,
    lifecycle: manifest.lifecycle.status,
    reason: manifest.lifecycle.reason,
    since: manifest.lifecycle.since,
    advisory: manifest.lifecycle.advisory,
    replacement: manifest.lifecycle.replacement,
    message: manifest.lifecycle.message,
    summary: lifecycleWarningSummary(manifest, manifest.lifecycle, phase),
    warningRequired: true,
    policyEffect: "none",
  };
}

export async function listInstalledCapabilities(options: ResolveStateDirOptions = {}): Promise<InstalledCapabilitySummary[]> {
  const paths = await ensureLocalStateDir(options);
  const loaded = await loadInstalledCapabilities(paths.root);
  const summaries: InstalledCapabilitySummary[] = [];

  for (const capability of loaded.capabilities) {
    const lifecycleWarning = createCapabilityLifecycleWarning(capability.manifest, "list");
    summaries.push({
      id: capability.id,
      installPath: capability.installPath,
      version: capability.manifest.version,
      type: capability.manifest.type,
      risk: summarizeRisk(capability.manifest),
      lifecycle: capability.manifest.lifecycle?.status ?? "installed",
      lifecycleWarning,
      trustLevel: metadataString(capability.manifest, "trust_level"),
      maintainer: metadataString(capability.manifest, "maintainer"),
      license: metadataString(capability.manifest, "license"),
      status: "enabled",
    });
  }

  for (const invalid of loaded.invalid) {
    summaries.push({
      id: invalid.id,
      installPath: invalid.installPath,
      risk: "unknown",
      lifecycle: "invalid",
      status: "invalid",
      error: invalid.error,
    });
  }

  return summaries.sort((a, b) => a.id.localeCompare(b.id));
}

export class OpenCapRuntime {
  private readonly paths: LocalStatePaths;

  constructor(options: RuntimeOptions = {}) {
    this.paths = getLocalStatePaths(options);
  }

  get stateDir(): string {
    return this.paths.root;
  }

  get statePaths(): LocalStatePaths {
    return this.paths;
  }

  async ensureLocalStateDir(): Promise<LocalStatePaths> {
    return ensureLocalStateDir(this.paths.root);
  }

  async loadInstalledCapabilities(): Promise<InstalledCapability[]> {
    return (await loadInstalledCapabilities(this.paths.root)).capabilities;
  }

  async invoke(_request: InvocationRequest): Promise<InvocationResult> {
    return {
      ok: false,
      error: "OpenCap runtime invocation is not implemented yet.",
    };
  }
}
