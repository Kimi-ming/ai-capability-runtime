import { describe, expect, it } from "vitest";
import {
  SecretForbiddenHeaderError,
  SecretMissingError,
  SecretUnsupportedAuthError,
  SecretUnsupportedPlacementError,
  resolveEnvCredential,
} from "./secret-resolver.js";

const executionTarget = {
  method: "POST",
  urlOrigin: "https://api.github.com",
  provider: "github",
};

function apiKeyAuth(overrides: Record<string, unknown> = {}) {
  return {
    type: "api_key",
    provider: "github",
    env: "GITHUB_TOKEN",
    placement: { type: "bearer" },
    ...overrides,
  };
}

describe("Secret Resolver env provider", () => {
  it("resolves bearer credentials from declared env without exposing the secret on the credential object", () => {
    const credential = resolveEnvCredential(
      {
        capabilityId: "github.create_issue",
        auth: apiKeyAuth(),
        executionTarget,
        mode: "execute",
      },
      { GITHUB_TOKEN: "ghp_provider_secret_1234" },
    );
    const headers: Record<string, string> = {};

    credential.applyToHeaders(headers);

    expect(credential).toMatchObject({
      type: "bearer",
      provider: "github",
      source: "env",
      envName: "GITHUB_TOKEN",
      resolved: true,
      apply: "authorization_header",
    });
    expect(headers).toEqual({ Authorization: "Bearer ghp_provider_secret_1234" });
    expect(JSON.stringify(credential)).not.toContain("ghp_provider_secret_1234");
    expect(credential.redacted).not.toContain("ghp_provider_secret_1234");
  });

  it("does not read env values during dry-run", () => {
    const env = new Proxy<Record<string, string | undefined>>({}, {
      get(_target, property) {
        if (property === "GITHUB_TOKEN") {
          throw new Error("dry-run must not read the secret value");
        }
        return undefined;
      },
    });

    const credential = resolveEnvCredential(
      {
        capabilityId: "github.create_issue",
        auth: apiKeyAuth(),
        executionTarget,
        mode: "dry_run",
      },
      env,
    );

    expect(credential).toMatchObject({
      type: "bearer",
      envName: "GITHUB_TOKEN",
      resolved: false,
      redacted: "[unresolved]",
    });
  });

  it("throws SecretMissingError when the declared env credential is absent or empty", () => {
    expect(() => resolveEnvCredential({
      capabilityId: "github.create_issue",
      auth: apiKeyAuth(),
      executionTarget,
      mode: "execute",
    }, { GITHUB_TOKEN: "" })).toThrow(SecretMissingError);

    try {
      resolveEnvCredential({
        capabilityId: "github.create_issue",
        auth: apiKeyAuth(),
        executionTarget,
        mode: "execute",
      }, {});
    } catch (error) {
      expect(error).toBeInstanceOf(SecretMissingError);
      expect((error as SecretMissingError).envName).toBe("GITHUB_TOKEN");
      expect(String(error)).not.toContain("ghp_provider_secret");
    }
  });

  it("rejects query and body placements before a secret value is applied", () => {
    for (const placement of ["query", "body"]) {
      const env = new Proxy<Record<string, string | undefined>>({}, {
        get(_target, property) {
          if (property === "GITHUB_TOKEN") {
            throw new Error(`${placement} placement must be rejected before reading the secret value`);
          }
          return undefined;
        },
      });

      expect(() => resolveEnvCredential({
        capabilityId: "github.create_issue",
        auth: apiKeyAuth({ placement: { type: placement } }),
        executionTarget,
        mode: "execute",
      }, env)).toThrow(SecretUnsupportedPlacementError);
    }
  });

  it("rejects forbidden custom header names", () => {
    const env = new Proxy<Record<string, string | undefined>>({}, {
      get(_target, property) {
        if (property === "GITHUB_TOKEN") {
          throw new Error("forbidden header names must be rejected before reading the secret value");
        }
        return undefined;
      },
    });

    expect(() => resolveEnvCredential({
      capabilityId: "github.create_issue",
      auth: apiKeyAuth({ placement: { type: "header", name: "Cookie" } }),
      executionTarget,
      mode: "execute",
    }, env)).toThrow(SecretForbiddenHeaderError);
  });

  it("returns none credentials for auth none", () => {
    const credential = resolveEnvCredential({
      capabilityId: "http.request_demo",
      auth: { type: "none" },
      executionTarget: { method: "GET", urlOrigin: "https://example.test" },
      mode: "execute",
    }, {});
    const headers: Record<string, string> = {};

    credential.applyToHeaders(headers);

    expect(credential).toMatchObject({ type: "none", resolved: true });
    expect(headers).toEqual({});
  });

  it("rejects unsupported auth types without reading arbitrary input credentials", () => {
    expect(() => resolveEnvCredential({
      capabilityId: "github.create_issue",
      auth: { type: "oauth2", env: "GITHUB_TOKEN" },
      executionTarget,
      mode: "execute",
    }, { GITHUB_TOKEN: "ghp_provider_secret_1234" })).toThrow(SecretUnsupportedAuthError);
  });
});
