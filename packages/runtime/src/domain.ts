import { randomUUID } from "node:crypto";
import type { CapabilityManifest, RiskLevel } from "@opencap/spec";

export type InvocationChannel = "cli" | "mcp" | "api" | "test";

export type HostCapability = "mcp.tools" | "mcp.elicitation" | "structuredContent" | "interactiveTerminal";

export interface HostDescriptor {
  id: string;
  name?: string;
  version?: string;
  profile?: string;
  capabilities?: HostCapability[];
}

export interface RuntimeEnvironment {
  env: Record<string, string | undefined>;
  cwd: string;
  platform: NodeJS.Platform;
  processId?: number;
}

export interface RuntimeContext {
  stateDir: string;
  now: () => Date;
  environment: RuntimeEnvironment;
  channel: InvocationChannel;
  host?: HostDescriptor;
  dryRunDefault?: boolean;
}

export type CapabilityLifecycleState =
  | "draft"
  | "listed"
  | "tested"
  | "audited"
  | "deprecated"
  | "yanked"
  | "revoked";

export interface CapabilityIdentity {
  id: string;
  version: string;
  packagePath: string;
  manifestPath: string;
  manifestDigest?: string;
  packageDigest?: string;
  registryCommit?: string;
  lifecycle?: CapabilityLifecycleState;
}

export interface CapabilitySelector {
  id: string;
  version?: string;
}

export interface InstallMetadata {
  installedAt: string;
  source: "registry" | "local" | "test";
  sourceRef?: string;
}

export interface TrustSummary {
  level: "unverified" | "listed" | "tested" | "maintainer_verified" | "official";
  advisories?: string[];
  reviewDigest?: string;
}

export interface RiskSummary {
  highestRisk: RiskLevel | "unknown";
  requiresConfirmation: boolean;
  permissions?: Array<{
    resource: string;
    action: string;
    risk: RiskLevel;
    confirmation: "allow" | "ask" | "deny";
  }>;
}

export interface DerivedCapabilityMetadata {
  riskSummary: RiskSummary;
  toolName?: string;
  modelVisibleSummary?: string;
}

export interface InstalledCapabilityRecord {
  identity: CapabilityIdentity;
  manifest?: CapabilityManifest;
  install: InstallMetadata;
  trust?: TrustSummary;
  derived: DerivedCapabilityMetadata;
}

export interface CallerDescriptor {
  userId?: string;
  sessionId?: string;
  agentId?: string;
  hostInvocationId?: string;
}

export interface InvocationRequestV1 {
  capability: CapabilitySelector;
  input: unknown;
  requestId?: string;
  dryRun?: boolean;
  idempotencyKey?: string;
  caller?: CallerDescriptor;
  metadata?: Record<string, unknown>;
}

export type RuntimeGateId =
  | "input_validation"
  | "data_egress"
  | "risk_policy"
  | "confirmation"
  | "secret"
  | "outbound"
  | "audit_preflight"
  | "lifecycle"
  | "quota"
  | "budget"
  | "output_validation"
  | (string & {});

export type GateStage = "pre_secret" | "pre_execution" | "post_execution";
export type GateDecisionKind = "allow" | "ask" | "deny" | "block" | "redact";
export type GateTerminalStatus = "confirmation_required" | "denied" | "blocked";

export interface GateDecisionSemantics {
  secretResolutionAllowed: boolean;
  executionAllowed: boolean;
  confirmationRequired: boolean;
  transformedInputRequired: boolean;
  terminalStatus?: GateTerminalStatus;
}

export interface GateDecision<Evidence = unknown> {
  gateId: RuntimeGateId;
  stage: GateStage;
  decision: GateDecisionKind;
  reasonCode: string;
  summary: string;
  evidence: Evidence;
  hardBoundary: boolean;
  traceId?: string;
}

export interface GateDecisionInput<Evidence = unknown> {
  gateId: RuntimeGateId;
  stage: GateStage;
  decision: GateDecisionKind;
  reasonCode: string;
  summary: string;
  evidence: Evidence;
  hardBoundary?: boolean;
  traceId?: string;
}

export interface RuntimeGate<Input = unknown, Evidence = unknown> {
  gateId: RuntimeGateId;
  stage: GateStage;
  evaluate(input: Input): GateDecision<Evidence> | Promise<GateDecision<Evidence>>;
}

export function gateDecisionSemantics(input: GateDecisionKind | Pick<GateDecision, "decision">): GateDecisionSemantics {
  const decision = typeof input === "string" ? input : input.decision;

  switch (decision) {
    case "allow":
      return {
        secretResolutionAllowed: true,
        executionAllowed: true,
        confirmationRequired: false,
        transformedInputRequired: false,
      };
    case "ask":
      return {
        secretResolutionAllowed: true,
        executionAllowed: false,
        confirmationRequired: true,
        transformedInputRequired: false,
        terminalStatus: "confirmation_required",
      };
    case "deny":
      return {
        secretResolutionAllowed: false,
        executionAllowed: false,
        confirmationRequired: false,
        transformedInputRequired: false,
        terminalStatus: "denied",
      };
    case "block":
      return {
        secretResolutionAllowed: false,
        executionAllowed: false,
        confirmationRequired: false,
        transformedInputRequired: false,
        terminalStatus: "blocked",
      };
    case "redact":
      return {
        secretResolutionAllowed: false,
        executionAllowed: false,
        confirmationRequired: false,
        transformedInputRequired: true,
      };
  }
}

export function createGateDecision<Evidence>(input: GateDecisionInput<Evidence>): GateDecision<Evidence> {
  return {
    gateId: input.gateId,
    stage: input.stage,
    decision: input.decision,
    reasonCode: input.reasonCode,
    summary: input.summary,
    evidence: input.evidence,
    hardBoundary: input.hardBoundary ?? (input.decision === "block"),
    traceId: input.traceId,
  };
}

export interface EgressSummary {
  targetOrigin?: string;
  dataClasses: string[];
  fieldsSent?: Array<{
    path: string;
    destination: string;
  }>;
}

export interface ConsentRequest {
  consentId: string;
  requestId: string;
  capability: CapabilityIdentity;
  actionSummary: string;
  riskSummary: RiskSummary;
  egressSummary: EgressSummary;
  policyReason: string;
  expiresAt?: string;
}

export interface ConsentReceipt {
  consentId: string;
  decision: "approved" | "rejected" | "unavailable" | "expired";
  decidedAt: string;
  channel: InvocationChannel;
  actor?: CallerDescriptor;
}

export interface PlannedExecution {
  type: "http";
  method: string;
  url: string;
  timeoutMs: number;
  body?: unknown;
}

export interface AuditPreview {
  inputHash?: string;
  redactedInputJson?: string;
  policyTraceIds?: string[];
}

export interface InvocationPlanV1 {
  requestId: string;
  capability: CapabilityIdentity;
  channel: InvocationChannel;
  validatedInput: unknown;
  inputClassification: unknown;
  egressMap: unknown;
  gates: GateDecision[];
  execution?: PlannedExecution;
  confirmation?: ConsentRequest;
  auditPreview: AuditPreview;
}

export type RuntimeErrorCategory =
  | "user_input"
  | "policy"
  | "confirmation"
  | "secret"
  | "execution"
  | "output_validation"
  | "audit"
  | "internal";

export interface RuntimeErrorV1 {
  code: string;
  category: RuntimeErrorCategory;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export type ExecutionOutcome =
  | "success"
  | "blocked"
  | "failed_before_request"
  | "failed_after_request"
  | "unknown_after_timeout"
  | "partial";

export type ExecutionSideEffectKind =
  | "read"
  | "write"
  | "send"
  | "destructive"
  | "financial"
  | "code_execution";

export interface ExecutionEvidence {
  type: "http";
  method?: string;
  targetOrigin?: string;
  statusCode?: number;
  httpStatus?: number;
  durationMs?: number;
  requestStarted?: boolean;
  outcome?: ExecutionOutcome;
  sideEffectKind?: ExecutionSideEffectKind;
  requestStartedAt?: string;
  responseReceivedAt?: string;
  providerRequestId?: string;
  retryAttempt?: number;
  idempotencyKeyHash?: string;
  reconcileHint?: string;
}

export interface ResultProvenance {
  contentDigest?: string;
  transformations?: string[];
  taintLabels?: string[];
}

export interface ResultEvidence {
  policyTraceIds: string[];
  gateDecisions: GateDecision[];
  inputHash?: string;
  outputHash?: string;
  execution?: ExecutionEvidence;
  provenance?: ResultProvenance;
}

export interface AuditWriteResult {
  status: "written" | "skipped" | "failed";
  auditId?: string;
  error?: string;
}

export type RuntimeResultStatus =
  | "success"
  | "dry_run"
  | "confirmation_required"
  | "denied"
  | "blocked"
  | "failed"
  | "unknown_after_timeout";

export interface RuntimeResultEnvelope<Output = unknown> {
  requestId: string;
  capability: CapabilityIdentity;
  status: RuntimeResultStatus;
  channel: InvocationChannel;
  output?: Output;
  error?: RuntimeErrorV1;
  evidence: ResultEvidence;
  audit: AuditWriteResult;
}

export interface RuntimeKernel {
  loadInstalledCapabilities(context: RuntimeContext): Promise<InstalledCapabilityRecord[]>;
  getCapability(identity: CapabilitySelector, context: RuntimeContext): Promise<InstalledCapabilityRecord>;
  planInvocation(request: InvocationRequestV1, context: RuntimeContext): Promise<InvocationPlanV1>;
  invoke(request: InvocationRequestV1, context: RuntimeContext): Promise<RuntimeResultEnvelope>;
}

export function createRuntimeRequestId(): string {
  return `req_${randomUUID()}`;
}

export function createDryRunEnvelope<Output>(input: {
  requestId: string;
  capability: CapabilityIdentity;
  channel: InvocationChannel;
  output?: Output;
  evidence: ResultEvidence;
  audit: AuditWriteResult;
}): RuntimeResultEnvelope<Output> {
  return {
    requestId: input.requestId,
    capability: input.capability,
    status: "dry_run",
    channel: input.channel,
    output: input.output,
    evidence: input.evidence,
    audit: input.audit,
  };
}
