import { describe, expect, it } from "vitest";
import { resultEnvelopeFromHttpExecutionResult, sanitizeToolResult, type HttpExecutionResult } from "./index.js";

describe("oversized result handling", () => {
  it("truncates oversized structured JSON and records a warning", () => {
    const result = sanitizeToolResult({ items: [{ id: 1, name: "large" }, { id: 2, name: "large" }] }, { maxStructuredBytes: 24 });

    expect(result.value).toBe("[TRUNCATED_RESULT]");
    expect(result.findings).toEqual([expect.objectContaining({ code: "CONTENT_TRUNCATED", path: "/" })]);
  });

  it("truncates oversized text before it can reach MCP content", () => {
    const httpResult: HttpExecutionResult = {
      ok: true,
      capabilityId: "http.request_demo",
      method: "GET",
      url: "https://example.com/result",
      status: "success",
      statusCode: 200,
      output: "abcdefghijklmnopqrstuvwxyz",
    };

    const envelope = resultEnvelopeFromHttpExecutionResult(httpResult, { invocationId: "inv-large-text", sanitizer: { maxTextLength: 8 } });

    expect(envelope.structuredContent).toBe("abcdefgh");
    expect(envelope.textSummary).toBe("http.request_demo succeeded.");
    expect(envelope.warnings).toEqual([expect.objectContaining({ code: "CONTENT_TRUNCATED", severity: "warning" })]);
  });

  it("does not let size limits bypass secret redaction evidence", () => {
    const httpResult: HttpExecutionResult = {
      ok: true,
      capabilityId: "http.request_demo",
      method: "GET",
      url: "https://example.com/result",
      status: "success",
      statusCode: 200,
      output: { token: "provider-secret", payload: "abcdefghijklmnopqrstuvwxyz" },
    };

    const envelope = resultEnvelopeFromHttpExecutionResult(httpResult, { invocationId: "inv-secret-large", sanitizer: { maxStructuredBytes: 12 } });

    expect(envelope.structuredContent).toBe("[TRUNCATED_RESULT]");
    expect(envelope.evidence.sanitizerFindings).toEqual([
      expect.objectContaining({ code: "SECRET_REDACTED", path: "/token" }),
      expect.objectContaining({ code: "CONTENT_TRUNCATED", path: "/" }),
    ]);
    expect(JSON.stringify(envelope)).not.toContain("provider-secret");
  });
});
