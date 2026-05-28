import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  CapabilityIdentity,
  CapabilityLifecycleState,
  ConsentReceipt,
  GateDecision,
  InstallMetadata,
  InvocationChannel,
  RuntimeResultStatus,
  TrustSummary,
} from "./domain.js";

export const LEDGER_RECORD_VERSION = "opencap.ledger_record.v1" as const;

export type LedgerRecordVersion = typeof LEDGER_RECORD_VERSION;
export type LedgerRecordKind = "capability" | "policy" | "invocation" | "compatibility";

export interface LedgerRecordBase<Kind extends LedgerRecordKind = LedgerRecordKind> {
  ledgerVersion: LedgerRecordVersion;
  recordKind: Kind;
  recordId: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

export type CapabilityLedgerEvent =
  | "installed"
  | "updated"
  | "removed"
  | "lifecycle_changed"
  | "advisory_observed"
  | "trust_updated";

export interface CapabilityLedgerRecordV1 extends LedgerRecordBase<"capability"> {
  event: CapabilityLedgerEvent;
  capability: CapabilityIdentity;
  install?: InstallMetadata;
  trust?: TrustSummary;
  previousLifecycle?: CapabilityLifecycleState;
  lifecycle?: CapabilityLifecycleState;
  manifestDigest?: string;
  packageDigest?: string;
  registryCommit?: string;
  advisoryRefs?: string[];
}

export type PolicyLedgerEvent =
  | "activation"
  | "rollback"
  | "failed_activation"
  | "override_created"
  | "override_consumed";

export type PolicyLedgerChangedBy = "local_user" | "automation" | "future_org_admin";

export interface PolicyLedgerRecordV1 extends LedgerRecordBase<"policy"> {
  event: PolicyLedgerEvent;
  policySetId: string;
  fromRevision?: string;
  toRevision?: string;
  attemptedRevision?: string;
  activeRevision?: string;
  policyDigest?: string;
  changedBy?: PolicyLedgerChangedBy;
  reason?: string;
  diffSummary?: string[];
  errorCode?: string;
  overrideId?: string;
  traceIds?: string[];
}

export interface InvocationLedgerConsentSummary {
  consentId: string;
  decision: ConsentReceipt["decision"];
  decidedAt?: string;
  channel?: InvocationChannel;
}

export interface InvocationLedgerExecutionSummary {
  requestStarted: boolean;
  targetOrigin?: string;
  httpMethod?: string;
  httpStatus?: number;
  providerRequestId?: string;
  durationMs?: number;
  retryAttempt?: number;
}

export interface InvocationLedgerRecordV1 extends LedgerRecordBase<"invocation"> {
  requestId: string;
  invocationId?: string;
  capability: CapabilityIdentity;
  channel: InvocationChannel;
  status: RuntimeResultStatus;
  inputHash?: string;
  outputHash?: string;
  resultContentDigest?: string;
  gateDecisions: GateDecision[];
  policyTraceIds: string[];
  auditId?: string;
  consent?: InvocationLedgerConsentSummary;
  execution?: InvocationLedgerExecutionSummary;
  errorCode?: string;
}

export type CompatibilityLedgerResult = "pass" | "fail" | "pending-smoke" | "not-run" | "unknown";

export type CompatibilityCheckResult =
  | "pass"
  | "fail"
  | "pending-smoke"
  | "supported"
  | "ignored"
  | "not-implemented"
  | "not_applicable";

export interface CompatibilityLedgerProfileRef {
  id: string;
  version?: string;
}

export interface CompatibilityLedgerHostRef {
  id: string;
  name?: string;
  version?: string;
}

export interface CompatibilityLedgerCapabilityRef {
  id: string;
  version?: string;
}

export interface CompatibilityLedgerCheck {
  id: string;
  result: CompatibilityCheckResult;
  summary?: string;
}

export interface CompatibilityLedgerRecordV1 extends LedgerRecordBase<"compatibility"> {
  profile: CompatibilityLedgerProfileRef;
  host: CompatibilityLedgerHostRef;
  opencapVersion?: string;
  opencapCommit?: string;
  capability?: CompatibilityLedgerCapabilityRef;
  result: CompatibilityLedgerResult;
  checkedAt: string;
  checks: CompatibilityLedgerCheck[];
  evidenceRef?: string;
  notes?: string;
}

export type LedgerRecordV1 =
  | CapabilityLedgerRecordV1
  | PolicyLedgerRecordV1
  | InvocationLedgerRecordV1
  | CompatibilityLedgerRecordV1;

export interface LedgerAppendResult {
  recordId: string;
  recordedAt: string;
}

export interface LedgerQueryOptions {
  limit?: number;
  cursor?: string;
  since?: string;
  until?: string;
}

export interface LedgerQueryResult<Record> {
  records: Record[];
  nextCursor?: string;
}

export interface CapabilityLedgerQuery extends LedgerQueryOptions {
  capabilityId?: string;
  version?: string;
  lifecycle?: CapabilityLifecycleState;
}

export interface PolicyLedgerQuery extends LedgerQueryOptions {
  policySetId?: string;
  revision?: string;
  event?: PolicyLedgerEvent;
}

export interface InvocationLedgerQuery extends LedgerQueryOptions {
  requestId?: string;
  capabilityId?: string;
  channel?: InvocationChannel;
  status?: RuntimeResultStatus;
}

export interface CompatibilityLedgerQuery extends LedgerQueryOptions {
  hostId?: string;
  profileId?: string;
  capabilityId?: string;
  result?: CompatibilityLedgerResult;
}

export interface CompatibilityLedgerLookup {
  hostId: string;
  profileId: string;
  capabilityId?: string;
}

export interface CapabilityLedgerStore {
  appendCapabilityRecord(record: CapabilityLedgerRecordV1): Promise<LedgerAppendResult>;
  listCapabilityRecords(query?: CapabilityLedgerQuery): Promise<LedgerQueryResult<CapabilityLedgerRecordV1>>;
  getLatestCapabilityRecord(capabilityId: string): Promise<CapabilityLedgerRecordV1 | undefined>;
}

export interface PolicyLedgerStore {
  appendPolicyRecord(record: PolicyLedgerRecordV1): Promise<LedgerAppendResult>;
  listPolicyRecords(query?: PolicyLedgerQuery): Promise<LedgerQueryResult<PolicyLedgerRecordV1>>;
  getActivePolicyRecord(policySetId: string): Promise<PolicyLedgerRecordV1 | undefined>;
}

export interface InvocationLedgerStore {
  appendInvocationRecord(record: InvocationLedgerRecordV1): Promise<LedgerAppendResult>;
  listInvocationRecords(query?: InvocationLedgerQuery): Promise<LedgerQueryResult<InvocationLedgerRecordV1>>;
  getInvocationRecord(requestId: string): Promise<InvocationLedgerRecordV1 | undefined>;
}

export interface CompatibilityLedgerStore {
  appendCompatibilityRecord(record: CompatibilityLedgerRecordV1): Promise<LedgerAppendResult>;
  listCompatibilityRecords(query?: CompatibilityLedgerQuery): Promise<LedgerQueryResult<CompatibilityLedgerRecordV1>>;
  getLatestCompatibilityRecord(lookup: CompatibilityLedgerLookup): Promise<CompatibilityLedgerRecordV1 | undefined>;
}

export interface RuntimeLedgerStore
  extends CapabilityLedgerStore,
    PolicyLedgerStore,
    InvocationLedgerStore,
    CompatibilityLedgerStore {}

export interface FileRuntimeLedgerStoreOptions {
  cwd?: string;
  stateDir?: string;
  env?: Record<string, string | undefined>;
  ledgerDir?: string;
}

const LEDGER_RECORD_PREFIX: Record<LedgerRecordKind, string> = {
  capability: "cap",
  policy: "pol",
  invocation: "inv",
  compatibility: "compat",
};

export function createLedgerRecordId(kind: LedgerRecordKind): string {
  return `ledger_${LEDGER_RECORD_PREFIX[kind]}_${randomUUID()}`;
}

const DEFAULT_STATE_DIR_NAME = "opencap.local";
const OPENCAP_STATE_DIR_ENV = "OPENCAP_STATE_DIR";
const DEFAULT_LEDGER_DIR_NAME = "ledger";

const LEDGER_FILE_NAME: Record<LedgerRecordKind, string> = {
  capability: "capability.jsonl",
  policy: "policy.jsonl",
  invocation: "invocation.jsonl",
  compatibility: "compatibility.jsonl",
};

const FORBIDDEN_LEDGER_METADATA_KEYS = new Set([
  "authorization",
  "input",
  "output",
  "providerrawbody",
  "providerrawresponse",
  "rawinput",
  "rawoutput",
  "requestbody",
  "responsebody",
  "secret",
  "token",
]);

const SECRET_LIKE_VALUE_PATTERN = /(ghp_[a-z0-9_]+|bearer\s+[a-z0-9._-]+|authorization:|provider raw (body|output|response))/i;

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value.trim().length > 0);
}

function resolveLedgerStateDir(options: FileRuntimeLedgerStoreOptions): string {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  return resolve(cwd, firstNonEmpty(options.stateDir, env[OPENCAP_STATE_DIR_ENV], DEFAULT_STATE_DIR_NAME) ?? DEFAULT_STATE_DIR_NAME);
}

function resolveLedgerDir(options: FileRuntimeLedgerStoreOptions): string {
  if (options.ledgerDir !== undefined) {
    return resolve(options.cwd ?? process.cwd(), options.ledgerDir);
  }

  return resolve(resolveLedgerStateDir(options), DEFAULT_LEDGER_DIR_NAME);
}

function ledgerFilePath(ledgerDir: string, kind: LedgerRecordKind): string {
  return resolve(ledgerDir, LEDGER_FILE_NAME[kind]);
}

function assertNoRawPayloadOrSecret(value: unknown, path = "record"): void {
  if (typeof value === "string") {
    if (SECRET_LIKE_VALUE_PATTERN.test(value)) {
      throw new Error(`Ledger records cannot contain raw payload or secret-like metadata at ${path}.`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoRawPayloadOrSecret(item, `${path}/${index}`));
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [key, entryValue] of Object.entries(value)) {
    if (FORBIDDEN_LEDGER_METADATA_KEYS.has(key.replace(/[_-]/g, "").toLowerCase())) {
      throw new Error(`Ledger records cannot contain raw payload or secret-like metadata at ${path}/${key}.`);
    }
    assertNoRawPayloadOrSecret(entryValue, `${path}/${key}`);
  }
}

function recordedAtInRange(record: LedgerRecordBase, query: LedgerQueryOptions | undefined): boolean {
  if (query?.since !== undefined && record.recordedAt < query.since) {
    return false;
  }
  if (query?.until !== undefined && record.recordedAt > query.until) {
    return false;
  }
  return true;
}

function applyLimit<T>(records: T[], query: LedgerQueryOptions | undefined): LedgerQueryResult<T> {
  const cursor = query?.cursor === undefined ? 0 : Number.parseInt(query.cursor, 10);
  const start = Number.isInteger(cursor) && cursor > 0 ? cursor : 0;
  const limit = query?.limit;
  const sliced = limit === undefined ? records.slice(start) : records.slice(start, start + limit);
  const nextIndex = start + sliced.length;

  return {
    records: sliced,
    nextCursor: limit !== undefined && nextIndex < records.length ? String(nextIndex) : undefined,
  };
}

function latestByRecordedAt<Record extends LedgerRecordBase>(records: Record[]): Record | undefined {
  return records.reduce<Record | undefined>((latest, record) => {
    if (latest === undefined || record.recordedAt >= latest.recordedAt) {
      return record;
    }
    return latest;
  }, undefined);
}

export class FileRuntimeLedgerStore implements RuntimeLedgerStore {
  readonly ledgerDir: string;

  constructor(options: FileRuntimeLedgerStoreOptions = {}) {
    this.ledgerDir = resolveLedgerDir(options);
  }

  async appendCapabilityRecord(record: CapabilityLedgerRecordV1): Promise<LedgerAppendResult> {
    return this.appendRecord("capability", record);
  }

  async listCapabilityRecords(query: CapabilityLedgerQuery = {}): Promise<LedgerQueryResult<CapabilityLedgerRecordV1>> {
    return applyLimit((await this.readRecords("capability")).filter((record) =>
      recordedAtInRange(record, query)
      && (query.capabilityId === undefined || record.capability.id === query.capabilityId)
      && (query.version === undefined || record.capability.version === query.version)
      && (query.lifecycle === undefined || record.lifecycle === query.lifecycle || record.capability.lifecycle === query.lifecycle)
    ), query);
  }

  async getLatestCapabilityRecord(capabilityId: string): Promise<CapabilityLedgerRecordV1 | undefined> {
    return latestByRecordedAt((await this.listCapabilityRecords({ capabilityId })).records);
  }

  async appendPolicyRecord(record: PolicyLedgerRecordV1): Promise<LedgerAppendResult> {
    return this.appendRecord("policy", record);
  }

  async listPolicyRecords(query: PolicyLedgerQuery = {}): Promise<LedgerQueryResult<PolicyLedgerRecordV1>> {
    return applyLimit((await this.readRecords("policy")).filter((record) =>
      recordedAtInRange(record, query)
      && (query.policySetId === undefined || record.policySetId === query.policySetId)
      && (query.revision === undefined || record.toRevision === query.revision || record.activeRevision === query.revision || record.policyDigest === query.revision)
      && (query.event === undefined || record.event === query.event)
    ), query);
  }

  async getActivePolicyRecord(policySetId: string): Promise<PolicyLedgerRecordV1 | undefined> {
    return latestByRecordedAt((await this.listPolicyRecords({ policySetId })).records.filter((record) => record.event !== "failed_activation"));
  }

  async appendInvocationRecord(record: InvocationLedgerRecordV1): Promise<LedgerAppendResult> {
    return this.appendRecord("invocation", record);
  }

  async listInvocationRecords(query: InvocationLedgerQuery = {}): Promise<LedgerQueryResult<InvocationLedgerRecordV1>> {
    return applyLimit((await this.readRecords("invocation")).filter((record) =>
      recordedAtInRange(record, query)
      && (query.requestId === undefined || record.requestId === query.requestId)
      && (query.capabilityId === undefined || record.capability.id === query.capabilityId)
      && (query.channel === undefined || record.channel === query.channel)
      && (query.status === undefined || record.status === query.status)
    ), query);
  }

  async getInvocationRecord(requestId: string): Promise<InvocationLedgerRecordV1 | undefined> {
    return (await this.listInvocationRecords({ requestId })).records[0];
  }

  async appendCompatibilityRecord(record: CompatibilityLedgerRecordV1): Promise<LedgerAppendResult> {
    return this.appendRecord("compatibility", record);
  }

  async listCompatibilityRecords(query: CompatibilityLedgerQuery = {}): Promise<LedgerQueryResult<CompatibilityLedgerRecordV1>> {
    return applyLimit((await this.readRecords("compatibility")).filter((record) =>
      recordedAtInRange(record, query)
      && (query.hostId === undefined || record.host.id === query.hostId)
      && (query.profileId === undefined || record.profile.id === query.profileId)
      && (query.capabilityId === undefined || record.capability?.id === query.capabilityId)
      && (query.result === undefined || record.result === query.result)
    ), query);
  }

  async getLatestCompatibilityRecord(lookup: CompatibilityLedgerLookup): Promise<CompatibilityLedgerRecordV1 | undefined> {
    return latestByRecordedAt((await this.listCompatibilityRecords({
      hostId: lookup.hostId,
      profileId: lookup.profileId,
      capabilityId: lookup.capabilityId,
    })).records);
  }

  private async appendRecord<Record extends LedgerRecordV1>(kind: Record["recordKind"], record: Record): Promise<LedgerAppendResult> {
    assertNoRawPayloadOrSecret(record);
    await mkdir(this.ledgerDir, { recursive: true });
    await writeFile(ledgerFilePath(this.ledgerDir, kind), `${JSON.stringify(record)}\n`, { flag: "a" });
    return { recordId: record.recordId, recordedAt: record.recordedAt };
  }

  private async readRecords(kind: "capability"): Promise<CapabilityLedgerRecordV1[]>;
  private async readRecords(kind: "policy"): Promise<PolicyLedgerRecordV1[]>;
  private async readRecords(kind: "invocation"): Promise<InvocationLedgerRecordV1[]>;
  private async readRecords(kind: "compatibility"): Promise<CompatibilityLedgerRecordV1[]>;
  private async readRecords(kind: LedgerRecordKind): Promise<LedgerRecordV1[]> {
    try {
      const raw = await readFile(ledgerFilePath(this.ledgerDir, kind), "utf8");
      return raw
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as LedgerRecordV1)
        .filter((record) => record.recordKind === kind);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}
