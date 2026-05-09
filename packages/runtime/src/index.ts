import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { stdin as processStdin, stdout as processStdout } from "node:process";
import { createInterface } from "node:readline/promises";
import type { DatabaseSync } from "node:sqlite";
import { dirname, join, resolve } from "node:path";
import { validateManifestFile, type CapabilityManifest } from "@opencap/spec";
import { parse as parseYaml } from "yaml";

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

export interface InstalledCapabilitySummary {
  id: string;
  installPath: string;
  version?: string;
  type?: string;
  risk: string;
  trustLevel?: string;
  status: "enabled" | "invalid";
  error?: string;
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
    return {
      decision: policySet.default,
      reason: `Default policy decision: ${policySet.default}.`,
      sourcePath: policySet.sourcePath,
      permissionDecisions: [],
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
  };
}

export type ConfirmationChannel = "cli" | "mcp";
export type ConfirmationStatus = "approved" | "rejected" | "confirmation_required" | "denied";

export interface ConfirmationRequest {
  capabilityId: string;
  policy: PolicyEvaluationResult;
  channel: ConfirmationChannel;
  operationSummary?: string;
  input?: unknown;
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

function approvalQuestion(request: ConfirmationRequest): string {
  const summary = request.operationSummary ?? request.capabilityId;
  return `OpenCap wants to run ${summary}. Allow once? [y/N] `;
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
      "This capability requires human confirmation, but this MCP channel cannot prompt.",
      false,
    );
  }
}

export type AuditInvocationStatus = "blocked" | "denied" | "executed";

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
}

export interface AuditLogger {
  record(event: AuditEvent): Promise<void>;
}

export class InMemoryAuditLogger implements AuditLogger {
  readonly events: AuditEvent[] = [];

  async record(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }
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

export function createConfirmationAuditEvent(
  request: ConfirmationRequest,
  confirmation: ConfirmationResult,
  timestamp = new Date(),
): AuditEvent {
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
    inputHash: request.input === undefined ? undefined : hashInput(request.input),
    inputRedactedJson: request.input === undefined ? undefined : stableJsonStringify(redactInput(request.input)),
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

export interface SqliteAuditLoggerOptions extends ResolveStateDirOptions {
  databaseFile?: string;
}

export interface AuditLogQuery {
  capabilityId?: string;
  status?: AuditInvocationStatus;
  since?: string;
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
  input_redacted_json TEXT
) STRICT;
`;

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
  }

  async record(event: AuditEvent): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO invocations (
          id, timestamp, channel, capability_id, status, policy_decision, confirmation_status, reason, matched_rule_id,
          input_hash, input_redacted_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      );
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

    if (query.since !== undefined) {
      where.push("timestamp >= ?");
      params.push(query.since);
    }

    params.push(limit);
    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const rows = this.database
      .prepare(
        `SELECT id, timestamp, channel, capability_id, status, policy_decision, confirmation_status, reason, matched_rule_id,
                input_hash, input_redacted_json
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

function summarizeRisk(manifest: CapabilityManifest): string {
  const risks = [...new Set(manifest.permissions.map((permission) => permission.risk))];
  return risks.join(",");
}

function metadataString(manifest: CapabilityManifest, key: string): string | undefined {
  const value = manifest.metadata[key];
  return typeof value === "string" ? value : undefined;
}

export async function listInstalledCapabilities(options: ResolveStateDirOptions = {}): Promise<InstalledCapabilitySummary[]> {
  const paths = await ensureLocalStateDir(options);
  const loaded = await loadInstalledCapabilities(paths.root);
  const summaries: InstalledCapabilitySummary[] = [];

  for (const capability of loaded.capabilities) {
    summaries.push({
      id: capability.id,
      installPath: capability.installPath,
      version: capability.manifest.version,
      type: capability.manifest.type,
      risk: summarizeRisk(capability.manifest),
      trustLevel: metadataString(capability.manifest, "trust_level"),
      status: "enabled",
    });
  }

  for (const invalid of loaded.invalid) {
    summaries.push({
      id: invalid.id,
      installPath: invalid.installPath,
      risk: "unknown",
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
