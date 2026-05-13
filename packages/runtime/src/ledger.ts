import { randomUUID } from "node:crypto";
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

const LEDGER_RECORD_PREFIX: Record<LedgerRecordKind, string> = {
  capability: "cap",
  policy: "pol",
  invocation: "inv",
  compatibility: "compat",
};

export function createLedgerRecordId(kind: LedgerRecordKind): string {
  return `ledger_${LEDGER_RECORD_PREFIX[kind]}_${randomUUID()}`;
}
