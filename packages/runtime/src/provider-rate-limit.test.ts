import { describe, expect, it } from "vitest";
import { evaluateHttpRetryPolicy } from "./retry-policy.js";
import { executeHttpCapability } from "./index.js";

function rateLimitedManifest() {
  return {
    id: "github.create_issue",
    version: "0.1.0",
    name: "Create GitHub issue",
    description: "Create an issue.",
    type: "http" as const,
    metadata: {
      provider: "github",
      network_access: "fixed_https_origin" as const,
      risk_summary: "Creates GitHub issues.",
    },
    input: {
      type: "object",
      required: ["owner", "repo"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
      },
    },
    output: { type: "object" },
    permissions: [{ resource: "github.issue", action: "create", risk: "write" as const, confirmation: "ask" as const }],
    auth: {
      type: "api_key" as const,
      provider: "github",
      env: "GITHUB_TOKEN",
      placement: { type: "bearer" as const },
      scopes: ["issues:write"],
    },
    execution: {
      method: "POST" as const,
      url: "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
      timeout_ms: 1000,
    },
  };
}

describe("provider rate limit handling", () => {
  it("returns structured provider rate limit evidence for 429 responses", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ message: "rate limited", token: "provider-secret" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": "30",
          "ratelimit-reset": "1893456000",
          "x-provider-secret": "secret-header-value",
        },
      });

    const result = await executeHttpCapability(
      rateLimitedManifest(),
      { owner: "opencap", repo: "runtime" },
      { env: { GITHUB_TOKEN: "provider-secret" }, fetch: fetchImpl },
    );

    expect(result).toMatchObject({
      ok: false,
      status: "http_error",
      statusCode: 429,
      error: {
        code: "HTTP_ERROR",
        statusCode: 429,
        response: { message: "rate limited", token: "[REDACTED]" },
        providerRateLimit: {
          providerStatus: 429,
          retryAfterMs: 30000,
          retryAfterAt: expect.any(String),
          rateLimitResetAt: "2030-01-01T00:00:00.000Z",
          headerNames: ["retry-after", "ratelimit-reset"],
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain("provider-secret");
    expect(JSON.stringify(result)).not.toContain("secret-header-value");
    expect(JSON.stringify(result)).not.toContain("x-provider-secret");
  });

  it("does not automatically retry non-idempotent writes after provider 429", () => {
    expect(
      evaluateHttpRetryPolicy({
        method: "POST",
        statusCode: 429,
        outcome: "failed_after_request",
        sideEffectKind: "write",
        attempt: 0,
        policy: { automatic: true, maxAttempts: 3 },
      }),
    ).toMatchObject({
      shouldRetry: false,
      retryableError: true,
      operationRepeatable: false,
      reasonCode: "non_idempotent_operation",
      retryAttempt: 0,
    });
  });
});
