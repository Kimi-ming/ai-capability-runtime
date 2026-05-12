import { describe, expect, it } from "vitest";
import {
  defaultDataEgressPolicy,
  evaluateDataEgressPolicy,
  type DataEgressContext,
} from "./data-egress-policy.js";
import { buildFieldLevelEgressMap, type EgressMapManifestLike } from "./egress-map.js";
import { classifyInput } from "./input-classifier.js";

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

function contextFromInput(input: Record<string, unknown>, manifest: EgressMapManifestLike, overrides: Partial<DataEgressContext> = {}): DataEgressContext {
  const classification = classifyInput(input);
  const egressMap = buildFieldLevelEgressMap(manifest, input, classification);

  return baseContext({
    provider: "external",
    targetOrigin: "https://api.external.example",
    resource: "external.message",
    action: "send",
    risk: "external_send",
    dataClasses: classification.dataClasses,
    redactedPreview: classification.redactedPreview,
    renderedFields: egressMap.fields,
    ...overrides,
  });
}

const queryCallbackManifest: EgressMapManifestLike = {
  execution: {
    method: "POST",
    url: "https://api.external.example/send?callback={{callbackUrl}}",
    timeout_ms: 1000,
  },
};

const bodyMessageManifest: EgressMapManifestLike = {
  execution: {
    method: "POST",
    url: "https://api.external.example/send",
    timeout_ms: 1000,
    body: {
      type: "json",
      fields: {
        message: "{{message}}",
      },
    },
  },
};

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


  it.each([
    ["private IP URL in query", { callbackUrl: "http://192.168.1.10/admin" }, queryCallbackManifest, "/callbackUrl", "query"],
    ["metadata service URL in body", { message: "http://169.254.169.254/latest/meta-data/iam/security-credentials/" }, bodyMessageManifest, "/message", "body"],
  ] as const)("denies %s before secret resolution", (_name, input, manifest, path, destination) => {
    const result = evaluateDataEgressPolicy(contextFromInput(input, manifest));

    expect(result.decision).toBe("deny");
    expect(result.reasonCode).toBe("DATA_EGRESS_INTERNAL_URL_DENIED");
    expect(result.secretResolutionAllowed).toBe(false);
    expect(result.executionAllowed).toBe(false);
    expect(result.evidence.matchedFields).toHaveLength(1);
    expect(result.evidence.matchedFields[0]).toMatchObject({ path, destination });
    expect(result.evidence.matchedFields[0].dataClasses).toContain("internal_url");
    expect(JSON.stringify(result.evidence.redactedPreview)).not.toContain("169.254.169.254");
    expect(JSON.stringify(result.evidence.redactedPreview)).not.toContain("192.168.1.10");
  });

  it("denies env config with secret-like assignments before external send", () => {
    const result = evaluateDataEgressPolicy(contextFromInput({
      message: "DATABASE_URL=postgres://internal/db\nAPI_KEY=sk_live_secret_value",
    }, bodyMessageManifest));

    expect(result.decision).toBe("deny");
    expect(result.reasonCode).toBe("DATA_EGRESS_SECRET_LIKE_DENIED");
    expect(result.evidence.dataClasses).toEqual(expect.arrayContaining(["source_code", "secret_like"]));
    expect(result.evidence.matchedFields).toEqual([{ path: "/message", destination: "body", dataClasses: ["secret_like", "source_code"] }]);
    expect(JSON.stringify(result.evidence.redactedPreview)).not.toContain("sk_live_secret_value");
  });

  it.each([
    ["stack trace", "Error: boom\n    at run (/repo/src/index.ts:12:7)"],
    ["source diff", "diff --git a/app.ts b/app.ts\n@@ -1,2 +1,2 @@\n-console.log('old')\n+console.log('new')"],
  ] as const)("asks before sending %s to an external_send target", (_name, message) => {
    const result = evaluateDataEgressPolicy(contextFromInput({ message }, bodyMessageManifest));

    expect(result.decision).toBe("ask");
    expect(result.reasonCode).toBe("DATA_EGRESS_SOURCE_CODE_EXTERNAL_SEND_ASK");
    expect(result.secretResolutionAllowed).toBe(true);
    expect(result.executionAllowed).toBe(false);
    expect(result.evidence.matchedFields).toEqual([{ path: "/message", destination: "body", dataClasses: ["source_code"] }]);
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
