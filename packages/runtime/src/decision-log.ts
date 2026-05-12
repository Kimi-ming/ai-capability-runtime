import { createHash } from "node:crypto";
import type { AuditEvent, PolicyDecision } from "./index.js";

export interface DecisionLogRecord {
  invocationId: string;
  timestamp: string;
  capabilityId: string;
  status: AuditEvent["status"];
  policyDecision: PolicyDecision;
  confirmationStatus: AuditEvent["confirmationStatus"];
  matchedRuleId?: string;
  policySetId?: string;
  policyRevision?: string;
  traceId?: string;
  gate?: string;
  reasonCode?: string;
  decisionSummary?: string;
  requestStarted?: boolean;
  egressDecision?: AuditEvent["egressDecision"];
  egressDataClasses?: AuditEvent["egressDataClasses"];
  egressTargetOrigin?: string;
  inputHash?: string;
}

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJsonStringify(nested)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function traceId(event: AuditEvent): string | undefined {
  if (event.policyTrace === undefined) {
    return undefined;
  }

  return `sha256:${createHash("sha256").update(stableJsonStringify(event.policyTrace)).digest("hex")}`;
}

export function exportDecisionLogRecords(events: AuditEvent[]): DecisionLogRecord[] {
  return events.map((event) => ({
    invocationId: event.id,
    timestamp: event.timestamp,
    capabilityId: event.capabilityId,
    status: event.status,
    policyDecision: event.policyDecision,
    confirmationStatus: event.confirmationStatus,
    matchedRuleId: event.matchedRuleId,
    policySetId: event.policyTrace?.policySetId,
    policyRevision: event.policyTrace?.policyRevision,
    traceId: traceId(event),
    gate: event.policyTrace?.gate,
    reasonCode: event.policyTrace?.reasonCode,
    decisionSummary: event.policyTrace === undefined ? undefined : `${event.policyTrace.gate}:${event.policyTrace.decision}:${event.policyTrace.reasonCode}`,
    requestStarted: event.requestStarted,
    egressDecision: event.egressDecision,
    egressDataClasses: event.egressDataClasses,
    egressTargetOrigin: event.egressTargetOrigin,
    inputHash: event.inputHash,
  }));
}
