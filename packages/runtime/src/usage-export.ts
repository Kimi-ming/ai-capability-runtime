import type { CapabilityLifecycleState } from "./domain.js";
import { USAGE_EVENT_SCHEMA, type UsageEventChannel, type UsageEventOutcome, type UsageEventV1 } from "./usage-event.js";

export const USAGE_EXPORT_SCHEMA = "opencap.usage_export.v1" as const;
export const USAGE_EXPORT_HEADER_SCHEMA = "opencap.usage_export.header.v1" as const;
export const USAGE_EXPORT_VERSION = "1" as const;
export const USAGE_EXPORT_REDACTION_PROFILE = "opencap.usage_export.redaction.v1" as const;

export type UsageExportSchema = typeof USAGE_EXPORT_SCHEMA;
export type UsageExportHeaderSchema = typeof USAGE_EXPORT_HEADER_SCHEMA;
export type UsageExportVersion = typeof USAGE_EXPORT_VERSION;
export type UsageExportFormat = "json" | "jsonl";
export type UsageExportRedactionProfile = typeof USAGE_EXPORT_REDACTION_PROFILE;

export interface UsageExportFilters {
  since?: string;
  until?: string;
  capabilityIds?: string[];
  channels?: UsageEventChannel[];
  outcomes?: UsageEventOutcome[];
  dryRun?: boolean;
  lifecycleStatuses?: CapabilityLifecycleState[];
}

export interface UsageExportCompatibility {
  usageEventSchema: typeof USAGE_EVENT_SCHEMA;
  additiveFieldsAllowed: true;
  billingEffect: "none";
}

export interface CreateUsageExportOptions {
  generatedAt?: string;
  filters?: UsageExportFilters;
}

export interface UsageExportHeaderV1 {
  schema: UsageExportHeaderSchema;
  exportVersion: UsageExportVersion;
  generatedAt: string;
  format: "jsonl";
  eventCount: number;
  filters?: UsageExportFilters;
  redactionProfile: UsageExportRedactionProfile;
  compatibility: UsageExportCompatibility;
}

export interface UsageExportEnvelopeV1 {
  schema: UsageExportSchema;
  exportVersion: UsageExportVersion;
  generatedAt: string;
  format: "json";
  eventCount: number;
  filters?: UsageExportFilters;
  redactionProfile: UsageExportRedactionProfile;
  compatibility: UsageExportCompatibility;
  events: UsageEventV1[];
}

function compatibility(): UsageExportCompatibility {
  return {
    usageEventSchema: USAGE_EVENT_SCHEMA,
    additiveFieldsAllowed: true,
    billingEffect: "none",
  };
}

function generatedAt(options: CreateUsageExportOptions): string {
  return options.generatedAt ?? new Date().toISOString();
}

function assertExportableUsageEvent(event: UsageEventV1): void {
  if (event.schema !== USAGE_EVENT_SCHEMA) {
    throw new Error(`Usage export only supports ${USAGE_EVENT_SCHEMA} records.`);
  }
  if (event.billingEffect !== "none") {
    throw new Error("Usage export only supports non-billing usage events with billingEffect=none.");
  }
  if (event.policyEffect !== "none") {
    throw new Error("Usage export only supports usage events with policyEffect=none.");
  }
}

function sanitizeUsageEventForExport(event: UsageEventV1): UsageEventV1 {
  assertExportableUsageEvent(event);

  return {
    schema: event.schema,
    eventId: event.eventId,
    invocationId: event.invocationId,
    capabilityId: event.capabilityId,
    capabilityVersion: event.capabilityVersion,
    provider: event.provider,
    category: event.category,
    subject: event.subject,
    channel: event.channel,
    startedAt: event.startedAt,
    completedAt: event.completedAt,
    generatedAt: event.generatedAt,
    outcome: event.outcome,
    status: event.status,
    risk: event.risk,
    requestStarted: event.requestStarted,
    dryRun: event.dryRun,
    httpRequestCount: event.httpRequestCount,
    intentCount: event.intentCount,
    retryAttempt: event.retryAttempt,
    durationMs: event.durationMs,
    quotaDecision: event.quotaDecision,
    budgetDecision: event.budgetDecision,
    lifecycleStatus: event.lifecycleStatus,
    sourceAuditHash: event.sourceAuditHash,
    policyEffect: "none",
    billingEffect: "none",
  };
}

function sanitizeEvents(events: UsageEventV1[]): UsageEventV1[] {
  return events.map((event) => sanitizeUsageEventForExport(event));
}

export function createUsageExportEnvelope(events: UsageEventV1[], options: CreateUsageExportOptions = {}): UsageExportEnvelopeV1 {
  const sanitizedEvents = sanitizeEvents(events);

  return {
    schema: USAGE_EXPORT_SCHEMA,
    exportVersion: USAGE_EXPORT_VERSION,
    generatedAt: generatedAt(options),
    format: "json",
    eventCount: sanitizedEvents.length,
    filters: options.filters,
    redactionProfile: USAGE_EXPORT_REDACTION_PROFILE,
    compatibility: compatibility(),
    events: sanitizedEvents,
  };
}

export function createUsageExportJsonlHeader(events: UsageEventV1[], options: CreateUsageExportOptions = {}): UsageExportHeaderV1 {
  const sanitizedEvents = sanitizeEvents(events);

  return {
    schema: USAGE_EXPORT_HEADER_SCHEMA,
    exportVersion: USAGE_EXPORT_VERSION,
    generatedAt: generatedAt(options),
    format: "jsonl",
    eventCount: sanitizedEvents.length,
    filters: options.filters,
    redactionProfile: USAGE_EXPORT_REDACTION_PROFILE,
    compatibility: compatibility(),
  };
}

export function serializeUsageExportJsonl(events: UsageEventV1[], options: CreateUsageExportOptions = {}): string {
  const sanitizedEvents = sanitizeEvents(events);
  const header = createUsageExportJsonlHeader(sanitizedEvents, options);
  const lines = [header, ...sanitizedEvents].map((record) => JSON.stringify(record));

  return `${lines.join("\n")}\n`;
}
