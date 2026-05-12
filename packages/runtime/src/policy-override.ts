import { randomUUID } from "node:crypto";
import type { AuditEvent, ConfirmationChannel, ConfirmationStatus, PolicyDecision, PolicyEvaluationResult, PolicyRisk } from "./index.js";

export type PolicyOverrideType = "allow_once" | "allow_until" | "deny_override" | "breakglass";
export type PolicyOverrideCreatedBy = "local_user" | "future_org_admin";
export type PolicyOverrideCapabilityStatus = "active" | "revoked" | "malicious";
export type PolicyOverrideDataEgressDecision = "allow" | "ask" | "deny" | "redact";

export interface PolicyOverrideRecordV1 {
  overrideId: string;
  type: PolicyOverrideType;
  invocationId?: string;
  capabilityId?: string;
  targetOrigin?: string;
  risk?: PolicyRisk;
  dataClasses?: string[];
  reason: string;
  expiresAt: string;
  createdBy: PolicyOverrideCreatedBy;
  createdAt: string;
}

export type PolicyOverrideValidationCode =
  | "OVERRIDE_REASON_REQUIRED"
  | "OVERRIDE_EXPIRATION_INVALID"
  | "OVERRIDE_EXPIRED"
  | "BREAKGLASS_EXPIRATION_TOO_LONG";

export interface PolicyOverrideValidationFinding {
  code: PolicyOverrideValidationCode;
  severity: "error";
  overrideId: string;
  message: string;
}

export interface PolicyOverrideSafetyGates {
  dataEgressDecision?: PolicyOverrideDataEgressDecision;
  outboundAllowed?: boolean;
  capabilityStatus?: PolicyOverrideCapabilityStatus;
}

export interface PolicyOverrideContext {
  now?: Date;
  invocationId?: string;
  capabilityId: string;
  targetOrigin?: string;
  risk: PolicyRisk;
  dataClasses?: string[];
  gates?: PolicyOverrideSafetyGates;
}

export interface PolicyOverrideResult extends PolicyEvaluationResult {
  policyTrace: PolicyEvaluationResult["decisionTrace"];
  overrideApplied: boolean;
  overrideId?: string;
  overrideType?: PolicyOverrideType;
  ignoredReasons: string[];
}

export interface ConsumedPolicyOverrideResult {
  result: PolicyOverrideResult;
  remainingOverrides: PolicyOverrideRecordV1[];
}

const BREAKGLASS_MAX_MS = 15 * 60 * 1000;

function parseTimestamp(value: string): Date | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isExpired(record: PolicyOverrideRecordV1, now: Date): boolean {
  const expiresAt = parseTimestamp(record.expiresAt);
  return expiresAt === undefined || expiresAt.getTime() <= now.getTime();
}

export function validatePolicyOverrideRecord(record: PolicyOverrideRecordV1, now = new Date()): PolicyOverrideValidationFinding[] {
  const findings: PolicyOverrideValidationFinding[] = [];
  const expiresAt = parseTimestamp(record.expiresAt);

  if (record.type === "breakglass" && record.reason.trim().length === 0) {
    findings.push({
      code: "OVERRIDE_REASON_REQUIRED",
      severity: "error",
      overrideId: record.overrideId,
      message: "Breakglass override requires a human-readable reason.",
    });
  }

  if (expiresAt === undefined) {
    findings.push({
      code: "OVERRIDE_EXPIRATION_INVALID",
      severity: "error",
      overrideId: record.overrideId,
      message: "Override expiresAt must be a valid timestamp.",
    });
    return findings;
  }

  if (expiresAt.getTime() <= now.getTime()) {
    findings.push({
      code: "OVERRIDE_EXPIRED",
      severity: "error",
      overrideId: record.overrideId,
      message: "Override is expired.",
    });
  }

  if (record.type === "breakglass" && expiresAt.getTime() - now.getTime() > BREAKGLASS_MAX_MS) {
    findings.push({
      code: "BREAKGLASS_EXPIRATION_TOO_LONG",
      severity: "error",
      overrideId: record.overrideId,
      message: "Breakglass override must expire within 15 minutes.",
    });
  }

  return findings;
}

function recordMatches(record: PolicyOverrideRecordV1, context: PolicyOverrideContext): boolean {
  if (record.capabilityId !== undefined && record.capabilityId !== context.capabilityId) {
    return false;
  }

  if (record.targetOrigin !== undefined && record.targetOrigin !== context.targetOrigin) {
    return false;
  }

  if (record.risk !== undefined && record.risk !== context.risk) {
    return false;
  }

  if (record.invocationId !== undefined && record.invocationId !== context.invocationId) {
    return false;
  }

  if (record.dataClasses !== undefined && record.dataClasses.length > 0) {
    const contextClasses = new Set(context.dataClasses ?? []);
    return record.dataClasses.every((dataClass) => contextClasses.has(dataClass));
  }

  return true;
}

function safetyBlockReason(record: PolicyOverrideRecordV1, context: PolicyOverrideContext): string | undefined {
  if (record.type === "deny_override") {
    return undefined;
  }

  if (context.gates?.dataEgressDecision === "deny") {
    return "data_egress_deny";
  }

  if (context.gates?.outboundAllowed === false) {
    return "outbound_block";
  }

  if (context.gates?.capabilityStatus === "revoked" || context.gates?.capabilityStatus === "malicious") {
    return `capability_${context.gates.capabilityStatus}`;
  }

  if (context.risk === "financial") {
    return "financial_confirmation_required";
  }

  return undefined;
}

function overrideDecision(record: PolicyOverrideRecordV1): PolicyDecision {
  return record.type === "deny_override" ? "deny" : "allow";
}

function traceFacts(input: { record?: PolicyOverrideRecordV1; applied: boolean; ignoredReasons: string[] }): string[] {
  const facts = [`override_applied=${input.applied}`];

  if (input.record !== undefined) {
    facts.push(`override_id=${input.record.overrideId}`);
    facts.push(`override_type=${input.record.type}`);
  }

  for (const reason of input.ignoredReasons) {
    facts.push(`override_ignored=${reason}`);
  }

  return facts;
}

function resultFromBase(base: PolicyEvaluationResult, input: { record?: PolicyOverrideRecordV1; decision?: PolicyDecision; ignoredReasons: string[] }): PolicyOverrideResult {
  const appliedRecord = input.record !== undefined && input.decision !== undefined ? input.record : undefined;
  const applied = appliedRecord !== undefined;
  const decision = input.decision ?? base.decision;
  const reason = appliedRecord !== undefined ? `Policy override ${appliedRecord.type} applied: ${appliedRecord.reason}` : base.reason;
  const matchedRuleId = appliedRecord !== undefined ? `override:${appliedRecord.overrideId}` : base.matchedRuleId;

  const decisionTrace = {
    ...base.decisionTrace,
    decision,
    matchedRuleId,
    reasonCode: appliedRecord !== undefined ? `POLICY_OVERRIDE_${appliedRecord.type.toUpperCase()}` : base.decisionTrace.reasonCode,
    humanReadableSummary: reason,
    evaluatedFacts: [...base.decisionTrace.evaluatedFacts, ...traceFacts({ record: appliedRecord, applied, ignoredReasons: input.ignoredReasons })],
    secretResolutionAllowed: decision !== "deny",
    executionAllowed: decision === "allow",
  };

  return {
    ...base,
    decision,
    reason,
    matchedRuleId,
    overrideApplied: applied,
    overrideId: appliedRecord?.overrideId,
    overrideType: appliedRecord?.type,
    ignoredReasons: input.ignoredReasons,
    decisionTrace,
    policyTrace: decisionTrace,
  };
}

export function applyPolicyOverrides(base: PolicyEvaluationResult, records: PolicyOverrideRecordV1[], context: PolicyOverrideContext): PolicyOverrideResult {
  const now = context.now ?? new Date();
  const ignoredReasons: string[] = [];

  for (const record of records) {
    const validationFindings = validatePolicyOverrideRecord(record, now);
    if (validationFindings.some((finding) => finding.code === "OVERRIDE_EXPIRED")) {
      ignoredReasons.push("expired");
      continue;
    }

    if (validationFindings.length > 0) {
      ignoredReasons.push("invalid");
      continue;
    }

    if (!recordMatches(record, context)) {
      ignoredReasons.push("not_matched");
      continue;
    }

    const blockedBy = safetyBlockReason(record, context);
    if (blockedBy !== undefined) {
      ignoredReasons.push(blockedBy);
      continue;
    }

    return resultFromBase(base, { record, decision: overrideDecision(record), ignoredReasons });
  }

  return resultFromBase(base, { ignoredReasons });
}

export function consumePolicyOverride(base: PolicyEvaluationResult, records: PolicyOverrideRecordV1[], context: PolicyOverrideContext): ConsumedPolicyOverrideResult {
  const result = applyPolicyOverrides(base, records, context);
  if (!result.overrideApplied || result.overrideType !== "allow_once") {
    return { result, remainingOverrides: records };
  }

  return {
    result,
    remainingOverrides: records.filter((record) => record.overrideId !== result.overrideId),
  };
}

function confirmationStatus(decision: PolicyDecision): ConfirmationStatus {
  if (decision === "allow") {
    return "approved";
  }

  if (decision === "deny") {
    return "denied";
  }

  return "confirmation_required";
}

export function createPolicyOverrideAuditEvent(
  result: PolicyOverrideResult,
  input: { channel: ConfirmationChannel; capabilityId: string },
  timestamp = new Date(),
): AuditEvent {
  return {
    id: randomUUID(),
    timestamp: timestamp.toISOString(),
    channel: input.channel,
    capabilityId: input.capabilityId,
    status: result.decision === "allow" ? "executed" : result.decision === "deny" ? "denied" : "blocked",
    policyDecision: result.decision,
    confirmationStatus: confirmationStatus(result.decision),
    reason: result.reason,
    matchedRuleId: result.matchedRuleId,
    requestStarted: false,
    policyTrace: result.decisionTrace,
  };
}
