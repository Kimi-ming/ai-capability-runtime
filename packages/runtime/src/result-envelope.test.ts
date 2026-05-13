import { describe, expect, it } from "vitest";
import {
  RESULT_ENVELOPE_VERSION,
  blockedResultEnvelope,
  confirmationRequiredResultEnvelope,
  createResultEnvelope,
  createHttpExecutionEvidence,
  resultEnvelopeFromDryRunPlan,
  resultEnvelopeFromHttpExecutionResult,
  type HttpDryRunPlan,
  type HttpExecutionResult,
} from "./index.js";

const baseEvidence = { inputHash: "sha256:input", risk: "write" };

describe("Result Envelope V1", () => {
  it("represents a successful structured result", () => {
    const envelope = createResultEnvelope({
      invocationId: "inv-success",
      capabilityId: "github.create_issue",
      status: "success",
      outcome: "success",
      structuredContent: { issue_number: 1 },
      evidence: baseEvidence,
    });

    expect(envelope).toEqual({
      envelopeVersion: RESULT_ENVELOPE_VERSION,
      invocationId: "inv-success",
      capabilityId: "github.create_issue",
      status: "success",
      outcome: "success",
      isError: false,
      structuredContent: { issue_number: 1 },
      textSummary: "github.create_issue succeeded.",
      warnings: [],
      evidence: baseEvidence,
    });
  });

  it("maps dry-run plans to dry_run envelopes", () => {
    const plan: HttpDryRunPlan = {
      status: "dry_run",
      capabilityId: "github.create_issue",
      method: "POST",
      url: "https://api.github.com/repos/opencap/runtime/issues",
      timeoutMs: 10000,
      authMode: "api_key:bearer",
      risk: "write",
      warnings: ["arbitrary_url"],
      egressPreview: {
        targetOrigin: "https://api.github.com",
        dataClasses: ["pii"],
        fieldsSent: [{ path: "/body", destination: "body", dataClasses: ["pii"], redacted: true }],
        redactedInput: { body: "d***@example.com" },
      },
    };

    const envelope = resultEnvelopeFromDryRunPlan(plan, { invocationId: "inv-dry" });

    expect(envelope).toMatchObject({
      envelopeVersion: RESULT_ENVELOPE_VERSION,
      invocationId: "inv-dry",
      capabilityId: "github.create_issue",
      status: "dry_run",
      outcome: "dry_run",
      isError: false,
      structuredContent: {
        request: { method: "POST", url: "https://api.github.com/repos/opencap/runtime/issues" },
        egressPreview: { targetOrigin: "https://api.github.com", dataClasses: ["pii"] },
      },
      warnings: [{ code: "ARBITRARY_URL", severity: "warning" }],
      evidence: { requestStarted: false, httpMethod: "POST", targetOrigin: "https://api.github.com", egressPreview: { targetOrigin: "https://api.github.com" } },
    });
  });

  it("represents blocked and confirmation_required outcomes", () => {
    expect(blockedResultEnvelope({ invocationId: "inv-block", capabilityId: "github.create_issue", reason: "Policy denied.", evidence: baseEvidence })).toMatchObject({
      status: "blocked",
      outcome: "blocked",
      isError: true,
      structuredContent: { error: { code: "BLOCKED", message: "Policy denied." } },
    });

    expect(confirmationRequiredResultEnvelope({ invocationId: "inv-confirm", capabilityId: "github.create_issue", reason: "Human confirmation required.", evidence: baseEvidence })).toMatchObject({
      status: "confirmation_required",
      outcome: "confirmation_required",
      isError: true,
      structuredContent: { error: { code: "CONFIRMATION_REQUIRED", message: "Human confirmation required." } },
    });
  });

  it("maps failed HTTP results to structured failed envelopes", () => {
    const result: HttpExecutionResult = {
      ok: false,
      capabilityId: "github.create_issue",
      method: "GET",
      url: "https://api.github.com/repos/opencap/runtime/issues",
      status: "http_error",
      statusCode: 404,
      error: { code: "HTTP_ERROR", message: "HTTP request failed with status 404.", statusCode: 404, response: { message: "not found" } },
    };

    const envelope = resultEnvelopeFromHttpExecutionResult(result, { invocationId: "inv-failed" });

    expect(envelope).toMatchObject({
      status: "failed",
      outcome: "http_error",
      isError: true,
      structuredContent: { error: { code: "HTTP_ERROR", statusCode: 404, response: { message: "not found" } } },
      textSummary: "github.create_issue failed with HTTP_ERROR.",
      evidence: { requestStarted: true, httpStatus: 404, targetOrigin: "https://api.github.com" },
    });
  });

  it("maps timeouts to structured unknown envelopes", () => {
    const result: HttpExecutionResult = {
      ok: false,
      capabilityId: "github.create_issue",
      method: "GET",
      url: "https://api.github.com/repos/opencap/runtime/issues",
      status: "timeout",
      error: { code: "HTTP_TIMEOUT", message: "HTTP request timed out after 10ms." },
    };

    const envelope = resultEnvelopeFromHttpExecutionResult(result, {
      invocationId: "inv-timeout",
      permissions: [{ resource: "github.issue", action: "create", risk: "write", confirmation: "ask" }],
    });

    expect(envelope).toMatchObject({
      status: "unknown",
      outcome: "unknown_after_timeout",
      isError: true,
      structuredContent: { error: { code: "HTTP_TIMEOUT" } },
      textSummary: "github.create_issue outcome is unknown after timeout.",
      evidence: {
        requestStarted: true,
        errorCode: "HTTP_TIMEOUT",
        executionOutcome: "unknown_after_timeout",
        executionSideEffectKind: "write",
        executionRetryAttempt: 0,
      },
    });
  });

  it("creates execution semantics evidence from HTTP results and permissions", () => {
    const result: HttpExecutionResult = {
      ok: false,
      capabilityId: "slack.send_message",
      method: "POST",
      url: "https://slack.com/api/chat.postMessage",
      status: "http_error",
      statusCode: 429,
      error: { code: "HTTP_ERROR", message: "Rate limited.", statusCode: 429 },
    };

    expect(
      createHttpExecutionEvidence(result, {
        permissions: [{ resource: "slack.message", action: "send", risk: "external_send", confirmation: "ask" }],
        requestStartedAt: "2026-05-13T00:00:00.000Z",
        responseReceivedAt: "2026-05-13T00:00:01.000Z",
      }),
    ).toMatchObject({
      outcome: "failed_after_request",
      sideEffectKind: "send",
      requestStarted: true,
      httpStatus: 429,
      retryAttempt: 0,
      requestStartedAt: "2026-05-13T00:00:00.000Z",
      responseReceivedAt: "2026-05-13T00:00:01.000Z",
    });
  });

  it("keeps response timestamps absent for unknown outcome timeouts", () => {
    const result: HttpExecutionResult = {
      ok: false,
      capabilityId: "github.create_issue",
      method: "POST",
      url: "https://api.github.com/repos/opencap/runtime/issues",
      status: "timeout",
      error: { code: "HTTP_TIMEOUT", message: "HTTP request timed out after 10ms." },
    };

    expect(
      createHttpExecutionEvidence(result, {
        permissions: [{ resource: "github.issue", action: "create", risk: "write", confirmation: "ask" }],
        requestStartedAt: "2026-05-13T00:00:00.000Z",
        responseReceivedAt: "2026-05-13T00:00:01.000Z",
      }),
    ).toMatchObject({
      outcome: "unknown_after_timeout",
      sideEffectKind: "write",
      requestStarted: true,
      requestStartedAt: "2026-05-13T00:00:00.000Z",
      responseReceivedAt: undefined,
      retryAttempt: 0,
    });
  });
});
