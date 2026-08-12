import { describe, expect, it } from "vitest";
import {
  OPENAPI_OPERATION_SELECTION_SCHEMA_VERSION,
  buildOpenApiOperationSelectionReport,
} from "./index.js";

const generatedAt = "2026-06-08T00:00:00.000Z";

function baseOpenApiDocument(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    openapi: "3.1.0",
    servers: [{ url: "https://api.example.com" }],
    paths: {
      "/repos/{owner}/{repo}": {
        get: {
          operationId: "getRepository",
          summary: "Get repository metadata.",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Repository metadata.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      full_name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
    ...overrides,
  };
}

describe("OpenAPI operation selection evidence", () => {
  it("reports a valid selected operation without granting policy authority", () => {
    const report = buildOpenApiOperationSelectionReport(
      baseOpenApiDocument(),
      {
        method: "GET",
        path: "/repos/{owner}/{repo}",
        reviewerHints: {
          capabilityId: "github.get_repo",
          category: "developer-tools",
          risk: "read_only",
        },
      },
      { generatedAt },
    );

    expect(report).toMatchObject({
      schemaVersion: OPENAPI_OPERATION_SELECTION_SCHEMA_VERSION,
      generatedAt,
      policyEffect: "none",
      manifestGenerated: false,
      runtimeExecution: false,
      selectedOperation: {
        found: true,
        method: "get",
        path: "/repos/{owner}/{repo}",
        operationId: "getRepository",
        deprecated: false,
      },
      reviewerHints: {
        capabilityId: "github.get_repo",
        category: "developer-tools",
        risk: "read_only",
      },
      server: {
        source: "root",
        url: "https://api.example.com",
        https: true,
      },
      security: {
        requirements: [{ scheme: "bearerAuth", type: "http", supported: true }],
        unsupportedSchemes: [],
        cookieSchemes: [],
      },
      blockerCount: 0,
    });
    expect(report.selectionDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(report.warnings.map((warning) => warning.code)).toContain("OPENAPI_RESPONSE_SCHEMA_REVIEW_REQUIRED");
  });

  it("blocks selections when the explicit path or method is missing", () => {
    const report = buildOpenApiOperationSelectionReport(
      baseOpenApiDocument(),
      {
        method: "DELETE",
        path: "/repos/{owner}/{repo}",
        reviewerHints: {
          capabilityId: "github.delete_repo",
          category: "developer-tools",
          risk: "destructive",
        },
      },
      { generatedAt },
    );

    expect(report.selectedOperation).toMatchObject({
      found: false,
      method: "delete",
      path: "/repos/{owner}/{repo}",
    });
    expect(report.blockers.map((blocker) => blocker.code)).toContain("OPENAPI_OPERATION_NOT_FOUND");
    expect(report.policyEffect).toBe("none");
  });

  it("reports deprecated operations and schema review warnings", () => {
    const report = buildOpenApiOperationSelectionReport(
      baseOpenApiDocument({
        paths: {
          "/legacy/messages": {
            post: {
              operationId: "sendLegacyMessage",
              deprecated: true,
              requestBody: {
                content: {
                  "application/json": {
                    schema: { type: "object" },
                  },
                },
              },
              responses: {
                default: { description: "legacy fallback" },
              },
            },
          },
        },
      }),
      {
        method: "post",
        path: "/legacy/messages",
        reviewerHints: {
          capabilityId: "legacy.send_message",
          category: "developer-tools",
          risk: "external_send",
        },
      },
      { generatedAt },
    );

    expect(report.selectedOperation).toMatchObject({
      found: true,
      deprecated: true,
      operationId: "sendLegacyMessage",
    });
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "OPENAPI_OPERATION_DEPRECATED",
      "OPENAPI_REQUEST_BODY_SCHEMA_REVIEW_REQUIRED",
      "OPENAPI_RESPONSE_SCHEMA_MISSING",
    ]));
  });

  it("blocks unsafe servers, cookie auth, and unsupported security schemes", () => {
    const report = buildOpenApiOperationSelectionReport(
      baseOpenApiDocument({
        servers: [{ url: "http://api.example.com" }],
        paths: {
          "/payments": {
            post: {
              operationId: "createPayment",
              security: [{ cookieAuth: [], oauth: [] }],
              responses: { "201": { description: "created" } },
            },
          },
        },
        components: {
          securitySchemes: {
            cookieAuth: { type: "apiKey", in: "cookie", name: "session" },
            oauth: { type: "oauth2", flows: {} },
          },
        },
      }),
      {
        method: "post",
        path: "/payments",
        reviewerHints: {
          capabilityId: "payments.create",
          category: "developer-tools",
          risk: "financial",
        },
      },
      { generatedAt },
    );

    expect(report.server).toMatchObject({ url: "http://api.example.com", https: false });
    expect(report.security.cookieSchemes).toEqual(["cookieAuth"]);
    expect(report.security.unsupportedSchemes).toEqual(["cookieAuth", "oauth"]);
    expect(report.blockers.map((blocker) => blocker.code)).toEqual(expect.arrayContaining([
      "OPENAPI_SERVER_NOT_HTTPS",
      "OPENAPI_SECURITY_COOKIE_UNSUPPORTED",
      "OPENAPI_SECURITY_SCHEME_UNSUPPORTED",
    ]));
  });

  it("redacts sensitive OpenAPI text from findings and report fields", () => {
    const report = buildOpenApiOperationSelectionReport(
      baseOpenApiDocument({
        servers: [{ url: "https://api.example.com?token=GITHUB_TOKEN_VALUE" }],
        paths: {
          "/danger": {
            get: {
              operationId: "danger",
              description: "Authorization: Bearer sk-secret should not leak.",
              "x-example": {
                rawBody: "provider raw response from /Users/kimi/opencap.local/logs.sqlite",
              },
              responses: { "200": { description: "ok" } },
            },
          },
        },
      }),
      {
        method: "get",
        path: "/danger",
        reviewerHints: {
          capabilityId: "danger.inspect",
          category: "developer-tools",
          risk: "read_only",
        },
      },
      { generatedAt, documentRef: "/Users/kimi/opencap.local/openapi.yml" },
    );
    const serialized = JSON.stringify(report);

    expect(report.blockers.map((blocker) => blocker.code)).toContain("OPENAPI_SENSITIVE_TEXT_REDACTED");
    expect(report.server.url).toBe("[REDACTED]");
    expect(report.documentRef).toBe("[REDACTED]");
    expect(serialized).not.toContain("GITHUB_TOKEN_VALUE");
    expect(serialized).not.toContain("Authorization: Bearer");
    expect(serialized).not.toContain("sk-secret");
    expect(serialized).not.toContain("/Users/");
    expect(serialized).not.toContain("opencap.local");
    expect(serialized).not.toContain("logs.sqlite");
    expect(serialized).not.toContain("provider raw response");
  });
});
