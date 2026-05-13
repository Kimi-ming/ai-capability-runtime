import { describe, expect, it } from "vitest";
import {
  createDryRunEnvelope,
  createRuntimeRequestId,
  type AuditWriteResult,
  type CapabilityIdentity,
  type ConsentRequest,
  type GateDecision,
  type InstalledCapabilityRecord,
  type InvocationPlanV1,
  type InvocationRequestV1,
  type RuntimeContext,
  type RuntimeErrorV1,
  type ExecutionOutcome,
  type ExecutionSideEffectKind,
  type RuntimeKernel,
  type RuntimeResultEnvelope,
} from "./domain.js";

describe("Runtime domain public contract", () => {
  it("creates runtime request ids with a stable auditable prefix", () => {
    expect(createRuntimeRequestId()).toMatch(/^req_[0-9a-f-]{36}$/);
  });

  it("models installed capability identity, trust, and derived metadata", () => {
    const capability = {
      identity: {
        id: "github.create_issue",
        version: "0.1.0",
        packagePath: "/tmp/opencap/installed/github.create_issue",
        manifestPath: "/tmp/opencap/installed/github.create_issue/manifest.yml",
        manifestDigest: "sha256:manifest",
        packageDigest: "sha256:package",
        lifecycle: "tested",
      },
      install: {
        installedAt: "2026-05-12T00:00:00.000Z",
        source: "registry",
        sourceRef: "registry/developer-tools/github.create_issue",
      },
      trust: {
        level: "tested",
        advisories: [],
        reviewDigest: "sha256:review",
      },
      derived: {
        riskSummary: { highestRisk: "write", requiresConfirmation: true },
        toolName: "github__create_issue",
        modelVisibleSummary: "Create GitHub Issue. Risk: write. Confirmation: ask.",
      },
    } satisfies InstalledCapabilityRecord;

    expect(capability.identity.id).toBe("github.create_issue");
    expect(capability.trust.level).toBe("tested");
    expect(capability.derived.riskSummary.highestRisk).toBe("write");
  });

  it("models invocation request, plan, consent, and gate decisions", () => {
    const context = {
      stateDir: "/tmp/opencap-state",
      now: () => new Date("2026-05-12T00:00:00.000Z"),
      environment: {
        env: { GITHUB_TOKEN: "secret" },
        cwd: "/tmp/project",
        platform: "darwin",
        processId: 123,
      },
      channel: "cli",
      host: {
        id: "opencap-cli",
        name: "OpenCap CLI",
        capabilities: ["interactiveTerminal"],
      },
    } satisfies RuntimeContext;

    const request = {
      capability: { id: "github.create_issue", version: "0.1.0" },
      input: { owner: "opencap", repo: "runtime", title: "Bug" },
      requestId: "req_test",
      dryRun: true,
      caller: { userId: "local-user", sessionId: "session-1" },
    } satisfies InvocationRequestV1;

    const gate = {
      gateId: "policy",
      stage: "pre_secret",
      decision: "ask",
      reasonCode: "WRITE_REQUIRES_CONFIRMATION",
      summary: "Write operation requires confirmation.",
      evidence: { risk: "write" },
      hardBoundary: false,
      traceId: "trace_policy",
    } satisfies GateDecision;

    const identity: CapabilityIdentity = {
      id: "github.create_issue",
      version: "0.1.0",
      packagePath: "/tmp/opencap-state/installed/github.create_issue",
      manifestPath: "/tmp/opencap-state/installed/github.create_issue/manifest.yml",
    };

    const consent = {
      consentId: "consent_1",
      requestId: request.requestId,
      capability: identity,
      actionSummary: "Create a GitHub issue",
      riskSummary: { highestRisk: "write", requiresConfirmation: true },
      egressSummary: { targetOrigin: "https://api.github.com", dataClasses: ["free_text_unknown"] },
      policyReason: "Write operation requires confirmation.",
    } satisfies ConsentRequest;

    const plan = {
      requestId: request.requestId,
      capability: identity,
      channel: context.channel,
      validatedInput: request.input,
      inputClassification: { findings: [] },
      egressMap: { fields: [] },
      gates: [gate],
      confirmation: consent,
      auditPreview: { inputHash: "sha256:input" },
    } satisfies InvocationPlanV1;

    expect(plan.gates[0].stage).toBe("pre_secret");
    expect(plan.confirmation?.consentId).toBe("consent_1");
  });

  it("creates dry-run envelopes without requiring audit writes or execution evidence", () => {
    const capability: CapabilityIdentity = {
      id: "http.request_demo",
      version: "0.1.0",
      packagePath: "/tmp/opencap-state/installed/http.request_demo",
      manifestPath: "/tmp/opencap-state/installed/http.request_demo/manifest.yml",
    };
    const audit = { status: "skipped" } satisfies AuditWriteResult;

    const envelope = createDryRunEnvelope({
      requestId: "req_demo",
      capability,
      channel: "test",
      output: { method: "GET", url: "https://example.test" },
      evidence: { gateDecisions: [], policyTraceIds: [], inputHash: "sha256:input" },
      audit,
    }) satisfies RuntimeResultEnvelope<{ method: string; url: string }>;

    expect(envelope).toMatchObject({
      requestId: "req_demo",
      status: "dry_run",
      channel: "test",
      output: { method: "GET", url: "https://example.test" },
      audit: { status: "skipped" },
    });
  });

  it("keeps runtime error categories explicit and adapter-neutral", () => {
    const error = {
      code: "AUDIT_WRITE_FAILED",
      category: "audit",
      message: "Audit preflight failed.",
      retryable: false,
      details: { auditLogger: "sqlite" },
    } satisfies RuntimeErrorV1;

    expect(error.category).toBe("audit");
  });

  it("models execution semantics evidence for audit and result contracts", () => {
    const outcome: ExecutionOutcome = "unknown_after_timeout";
    const sideEffectKind: ExecutionSideEffectKind = "write";
    const evidence = {
      type: "http",
      method: "POST",
      targetOrigin: "https://api.github.com",
      requestStarted: true,
      outcome,
      sideEffectKind,
      requestStartedAt: "2026-05-13T00:00:00.000Z",
      responseReceivedAt: undefined,
      retryAttempt: 0,
      reconcileHint: "Check provider state before retrying.",
    } satisfies import("./domain.js").ExecutionEvidence;

    expect(evidence).toMatchObject({
      outcome: "unknown_after_timeout",
      sideEffectKind: "write",
      retryAttempt: 0,
    });
  });

  it("describes the RuntimeKernel adapter boundary", () => {
    const kernel = {
      loadInstalledCapabilities: async () => [],
      getCapability: async () => {
        throw new Error("not installed");
      },
      planInvocation: async (_request) => {
        throw new Error("not planned");
      },
      invoke: async (_request) => {
        throw new Error("not invoked");
      },
    } satisfies RuntimeKernel;

    expect(kernel.loadInstalledCapabilities).toBeTypeOf("function");
    expect(kernel.invoke).toBeTypeOf("function");
  });
});
