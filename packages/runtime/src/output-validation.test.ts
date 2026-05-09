import { describe, expect, it } from "vitest";
import {
  resultEnvelopeFromHttpExecutionResult,
  validateOutputAgainstSchema,
  type HttpExecutionResult,
} from "./index.js";

const outputSchema = {
  type: "object",
  required: ["issue_url", "issue_number"],
  properties: {
    issue_url: { type: "string" },
    issue_number: { type: "number" },
  },
};

function successResult(output: unknown): HttpExecutionResult {
  return {
    ok: true,
    capabilityId: "github.create_issue",
    method: "POST",
    url: "https://api.github.com/repos/opencap/runtime/issues",
    status: "success",
    statusCode: 201,
    output,
  };
}

describe("output schema validation", () => {
  it("accepts output that matches the declared schema", () => {
    const validation = validateOutputAgainstSchema({ issue_url: "https://example.com/1", issue_number: 1 }, outputSchema);

    expect(validation).toEqual({ ok: true, status: "valid", findings: [] });
  });

  it("reports missing required output fields", () => {
    const validation = validateOutputAgainstSchema({ issue_url: "https://example.com/1" }, outputSchema);

    expect(validation).toMatchObject({
      ok: false,
      status: "invalid",
      findings: [expect.objectContaining({ path: "/issue_number", keyword: "required" })],
    });
  });

  it("reports output type mismatches", () => {
    const validation = validateOutputAgainstSchema({ issue_url: "https://example.com/1", issue_number: "1" }, outputSchema);

    expect(validation).toMatchObject({
      ok: false,
      status: "invalid",
      findings: [expect.objectContaining({ path: "/issue_number", keyword: "type" })],
    });
  });

  it("does not mark successful HTTP output as success when output schema validation fails", () => {
    const envelope = resultEnvelopeFromHttpExecutionResult(successResult({ issue_url: "https://example.com/1" }), {
      invocationId: "inv-output-invalid",
      outputSchema,
    });

    expect(envelope).toMatchObject({
      status: "failed",
      outcome: "output_schema_invalid",
      isError: true,
      structuredContent: {
        error: {
          code: "OUTPUT_SCHEMA_INVALID",
          findings: [expect.objectContaining({ path: "/issue_number", keyword: "required" })],
        },
      },
      evidence: {
        outputValidationStatus: "invalid",
        outputValidationFindings: [expect.objectContaining({ path: "/issue_number", keyword: "required" })],
      },
    });
  });
});
