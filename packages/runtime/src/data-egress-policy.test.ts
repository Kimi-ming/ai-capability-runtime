import { describe, expect, it } from "vitest";
import {
  defaultDataEgressPolicy,
  evaluateDataEgressPolicy,
  type DataEgressContext,
} from "./data-egress-policy.js";

function baseContext(overrides: Partial<DataEgressContext> = {}): DataEgressContext {
  return {
    capabilityId: "github.create_issue",
    provider: "github",
    targetOrigin: "https://api.github.com",
    resource: "github.issue",
    action: "create",
    risk: "write",
    inputHash: "sha256:test",
    dataClasses: [],
    redactedPreview: { title: "hello" },
    renderedFields: [],
    ...overrides,
  };
}

describe("data egress policy gate", () => {
  it("denies secret_like data before secret resolution and execution", () => {
    const result = evaluateDataEgressPolicy(baseContext({
      dataClasses: ["secret_like"],
      redactedPreview: { token: "[redacted:secret_like]" },
      renderedFields: [{ path: "/token", destination: "body", dataClasses: ["secret_like"] }],
    }));

    expect(result.decision).toBe("deny");
    expect(result.reasonCode).toBe("DATA_EGRESS_SECRET_LIKE_DENIED");
    expect(result.secretResolutionAllowed).toBe(false);
    expect(result.executionAllowed).toBe(false);
    expect(JSON.stringify(result.evidence.redactedPreview)).not.toContain("ghp_");
  });

  it("denies internal_url data in rendered fields by default", () => {
    const result = evaluateDataEgressPolicy(baseContext({
      dataClasses: ["internal_url"],
      redactedPreview: { callbackUrl: "[redacted:internal_url]" },
      renderedFields: [{ path: "/callbackUrl", destination: "query", dataClasses: ["internal_url"] }],
    }));

    expect(result.decision).toBe("deny");
    expect(result.reasonCode).toBe("DATA_EGRESS_INTERNAL_URL_DENIED");
    expect(result.secretResolutionAllowed).toBe(false);
    expect(result.executionAllowed).toBe(false);
  });

  it.each(["pii", "source_code"] as const)("asks before sending %s to external_send targets", (dataClass) => {
    const result = evaluateDataEgressPolicy(baseContext({
      risk: "external_send",
      dataClasses: [dataClass],
      redactedPreview: { body: dataClass === "pii" ? "d***@example.com" : "[redacted:source_code]" },
      renderedFields: [{ path: "/body", destination: "body", dataClasses: [dataClass] }],
    }));

    expect(result.decision).toBe("ask");
    expect(result.reasonCode).toBe(dataClass === "pii" ? "DATA_EGRESS_PII_EXTERNAL_SEND_ASK" : "DATA_EGRESS_SOURCE_CODE_EXTERNAL_SEND_ASK");
    expect(result.secretResolutionAllowed).toBe(true);
    expect(result.executionAllowed).toBe(false);
  });

  it("allows non-sensitive data by default", () => {
    const result = evaluateDataEgressPolicy(baseContext({
      renderedFields: [{ path: "/title", destination: "body", dataClasses: [] }],
    }));

    expect(result.decision).toBe("allow");
    expect(result.secretResolutionAllowed).toBe(true);
    expect(result.executionAllowed).toBe(true);
  });

  it("uses stricter matching policy rule across provider target risk and destination", () => {
    const result = evaluateDataEgressPolicy(
      baseContext({
        provider: "slack",
        targetOrigin: "https://slack.com",
        risk: "external_send",
        dataClasses: ["free_text_unknown"],
        redactedPreview: { text: "release update" },
        renderedFields: [{ path: "/text", destination: "body", dataClasses: ["free_text_unknown"] }],
      }),
      {
        default: "allow",
        rules: [
          {
            id: "ask-slack-body-free-text",
            match: {
              provider: "slack",
              targetOrigin: "https://slack.com",
              risk: "external_send",
              destination: "body",
              dataClass: "free_text_unknown",
            },
            decision: "ask",
          },
        ],
      },
    );

    expect(result.decision).toBe("ask");
    expect(result.matchedRuleId).toBe("ask-slack-body-free-text");
    expect(result.evidence.matchedFields).toEqual([{ path: "/text", destination: "body", dataClasses: ["free_text_unknown"] }]);
  });

  it("does not apply destination-specific rules to a different rendered field", () => {
    const result = evaluateDataEgressPolicy(
      baseContext({
        provider: "slack",
        risk: "external_send",
        dataClasses: ["pii"],
        redactedPreview: { email: "d***@example.com", message: "hello" },
        renderedFields: [
          { path: "/email", destination: "query", dataClasses: ["pii"] },
          { path: "/message", destination: "body", dataClasses: [] },
        ],
      }),
      {
        default: "allow",
        rules: [
          {
            id: "ask-body-pii",
            match: { dataClass: "pii", destination: "body" },
            decision: "ask",
          },
        ],
      },
    );

    expect(result.decision).toBe("allow");
    expect(result.matchedRuleId).toBeUndefined();
  });

  it("keeps the default policy immutable for callers", () => {
    const policy = defaultDataEgressPolicy();
    policy.rules.length = 0;

    const result = evaluateDataEgressPolicy(baseContext({
      dataClasses: ["secret_like"],
      redactedPreview: { token: "[redacted:secret_like]" },
    }));

    expect(result.decision).toBe("deny");
  });
});
