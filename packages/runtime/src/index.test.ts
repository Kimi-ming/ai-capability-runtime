import { mkdtemp, readFile, rm, stat, writeFile, mkdir } from "node:fs/promises";
import { createServer, type IncomingMessage } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildHttpDryRunPlan,
  capabilityRiskWarnings,
  detectArbitraryUrlCapability,
  executeHttpCapability,
  evaluateDataEgressPolicy,
  CliConfirmationHandler,
  DEFAULT_POLICIES_YML,
  confirmWithAudit,
  confirmationSummaryFromDataEgress,
  createConfirmationAuditEvent,
  createDataEgressAuditEvent,
  createInputProvenanceEvidence,
  defaultPolicySet,
  evaluatePolicy,
  DEFAULT_STATE_DIR_NAME,
  OPENCAP_STATE_DIR_ENV,
  hashInput,
  InMemoryAuditLogger,
  InstallCapabilityError,
  McpNoElicitationConfirmationHandler,
  normalizeHttpResponse,
  PolicyParseError,
  POLICY_TRACE_VERSION,
  UrlTemplateRenderError,
  renderUrlTemplate,
  SqliteAuditLogger,
  OpenCapRuntime,
  ensureLocalStateDir,
  getLocalStatePaths,
  installCapability,
  listInstalledCapabilities,
  loadInstalledCapabilities,
  loadPolicySet,
  parsePolicyYml,
  recordDataEgressDecision,
  redactInput,
  resolveStateDir,
  stableJsonStringify,
  type AuditEvent,
  type AuditLogger,
} from "./index.js";



async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

class FailingAuditPreflightLogger implements AuditLogger {
  readonly events: AuditEvent[] = [];
  readonly preflightChecks: Array<{ capabilityId?: string; resolvedUrl?: string; requestStarted?: boolean }> = [];

  async preflight(check: { capabilityId?: string; resolvedUrl?: string; requestStarted?: boolean }): Promise<void> {
    this.preflightChecks.push(check);
    throw new Error("audit store unavailable");
  }

  async record(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }
}

async function writeCapability(root: string, category: string, id: string, manifestId = id): Promise<string> {
  const dir = join(root, "registry", category, id);
  await mkdir(join(dir, "tests"), { recursive: true });
  await writeFile(
    join(dir, "manifest.yml"),
    `id: ${manifestId}
name: Test Capability
description: Test Capability.
version: 0.1.0
type: http
input:
  type: object
output:
  type: object
auth:
  type: none
permissions:
  - resource: test.resource
    action: read
    risk: read_only
    confirmation: allow
execution:
  method: GET
  url: https://example.com
  timeout_ms: 10000
metadata:
  category: developer-tools
  maintainer: opencap
  license: MIT
  trust_level: experimental
`,
  );
  await writeFile(join(dir, "README.md"), `# ${id}\n`);
  await writeFile(
    join(dir, "tests", "basic.yml"),
    `name: basic
capability: ${id}
mode: dry_run
expect:
  status: dry_run
  request:
    method: GET
    url: https://example.com
`,
  );
  return dir;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

type TempOpenCapTestProject = {
  cwd: string;
  stateDir: string;
  defaultStateDir: string;
  cleanup: () => Promise<void>;
};

async function createTempOpenCapTestProject(prefix: string): Promise<TempOpenCapTestProject> {
  const cwd = await mkdtemp(join(tmpdir(), prefix));

  return {
    cwd,
    stateDir: join(cwd, "state"),
    defaultStateDir: join(cwd, DEFAULT_STATE_DIR_NAME),
    cleanup: () => rm(cwd, { recursive: true, force: true }),
  };
}

describe("temporary OpenCap test project", () => {
  it("keeps install, list, and logs state inside an explicit temporary state dir", async () => {
    const project = await createTempOpenCapTestProject("opencap-temp-state-");

    try {
      await writeCapability(project.cwd, "developer-tools", "github.create_issue");
      const installed = await installCapability({
        cwd: project.cwd,
        stateDir: project.stateDir,
        id: "github.create_issue",
        env: {},
      });
      const logger = new SqliteAuditLogger({ cwd: project.cwd, stateDir: project.stateDir, env: {} });
      const policy = evaluatePolicy(parsePolicyYml("default: allow\nrules: []\n"), {
        capabilityId: "github.create_issue",
        permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
      });

      try {
        await logger.record(
          createConfirmationAuditEvent(
            { capabilityId: "github.create_issue", channel: "cli", policy },
            { status: "approved", channel: "cli", policyDecision: "allow", prompted: false, reason: "temp state" },
            new Date("2026-05-09T00:00:00.000Z"),
          ),
        );
      } finally {
        logger.close();
      }

      await expect(listInstalledCapabilities({ cwd: project.cwd, stateDir: project.stateDir, env: {} })).resolves.toMatchObject([
        { id: "github.create_issue", status: "enabled" },
      ]);
      expect(installed.destinationDir).toBe(resolve(project.stateDir, "installed", "github.create_issue"));
      expect(await exists(resolve(project.stateDir, "logs.sqlite"))).toBe(true);
      expect(await exists(project.defaultStateDir)).toBe(false);
    } finally {
      await project.cleanup();
    }
  });
});

function dryRunManifest() {
  return {
    id: "github.create_issue",
    name: "Create GitHub Issue",
    description: "Create a GitHub issue.",
    version: "0.1.0",
    type: "http" as const,
    input: { type: "object" },
    output: { type: "object" },
    auth: { type: "api_key" as const, provider: "github", env: "GITHUB_TOKEN", placement: { type: "bearer" } },
    permissions: [{ resource: "github.issue", action: "create", risk: "write" as const, confirmation: "ask" as const }],
    execution: {
      method: "POST" as const,
      url: "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
      timeout_ms: 10000,
      body: {
        type: "json" as const,
        fields: {
          title: "{{title}}",
          body: "Issue: {{body}}",
          labels: "{{labels}}",
        },
      },
    },
    metadata: { category: "developer-tools", maintainer: "opencap", license: "MIT", trust_level: "experimental" },
  };
}

describe("URL template rendering", () => {
  it("renders fields with URL encoding", () => {
    expect(
      renderUrlTemplate("https://api.github.com/repos/{{owner}}/{{repo}}/issues?q={{query}}", {
        owner: "open cap",
        repo: "runtime/core",
        query: "bug #1",
      }),
    ).toBe("https://api.github.com/repos/open%20cap/runtime%2Fcore/issues?q=bug%20%231");
  });

  it("throws a structured error for missing fields", () => {
    expect(() => renderUrlTemplate("https://example.com/{{missing}}", {})).toThrow(UrlTemplateRenderError);
    expect(() => renderUrlTemplate("https://example.com/{{missing}}", {})).toThrow(/missing/);
  });

  it("throws a structured error for unsupported field values", () => {
    expect(() => renderUrlTemplate("https://example.com/{{payload}}", { payload: { nested: true } })).toThrow(
      UrlTemplateRenderError,
    );
  });

  it("requires object input", () => {
    expect(() => renderUrlTemplate("https://example.com/{{field}}", null)).toThrow(UrlTemplateRenderError);
  });
});

describe("HTTP dry-run plan", () => {
  it("renders method, URL, JSON body, auth mode, and risk without reading secrets", async () => {
    const plan = await buildHttpDryRunPlan(dryRunManifest(), {
      owner: "open cap",
      repo: "runtime/core",
      title: "Bug #1",
      body: "broken",
      labels: ["bug", "p1"],
    });

    expect(plan).toMatchObject({
      status: "dry_run",
      capabilityId: "github.create_issue",
      method: "POST",
      url: "https://api.github.com/repos/open%20cap/runtime%2Fcore/issues",
      timeoutMs: 10000,
      body: {
        title: "Bug #1",
        body: "Issue: broken",
        labels: ["bug", "p1"],
      },
      authMode: "api_key:bearer",
      risk: "write",
      egressPreview: {
        targetOrigin: "https://api.github.com",
        dataClasses: [],
        fieldsSent: expect.arrayContaining([
          expect.objectContaining({ path: "/owner", destination: "url" }),
          expect.objectContaining({ path: "/repo", destination: "url" }),
          expect.objectContaining({ path: "/title", destination: "body" }),
          expect.objectContaining({ path: "/body", destination: "body" }),
          expect.objectContaining({ path: "/labels", destination: "body" }),
        ]),
      },
    });
    expect(JSON.stringify(plan)).not.toContain("GITHUB_TOKEN");
  });

  it("fails required body full-template fields when missing and omits optional missing fields", async () => {
    const manifest = {
      ...dryRunManifest(),
      input: {
        type: "object",
        required: ["owner", "repo", "title"],
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          title: { type: "string" },
          note: { type: "string" },
          metadata: { type: "object" },
          pinned: { type: "boolean" },
          priority: { type: "number" },
        },
      },
      execution: {
        ...dryRunManifest().execution,
        body: {
          type: "json" as const,
          fields: {
            title: "{{title}}",
            note: "{{note}}",
            metadata: "{{metadata}}",
            pinned: "{{pinned}}",
            priority: "{{priority}}",
            source: "opencap",
          },
        },
      },
    };

    await expect(buildHttpDryRunPlan(manifest, { owner: "opencap", repo: "runtime" })).rejects.toMatchObject({
      code: "URL_TEMPLATE_FIELD_MISSING",
      details: { fieldName: "title" },
    });

    const plan = await buildHttpDryRunPlan(manifest, {
      owner: "opencap",
      repo: "runtime",
      title: "Bug",
      metadata: { labels: ["bug"] },
      pinned: false,
      priority: 2,
      unused: "do not send",
    });

    expect(plan.body).toEqual({
      title: "Bug",
      metadata: { labels: ["bug"] },
      pinned: false,
      priority: 2,
      source: "opencap",
    });
  });

  it("writes a dry-run audit event when an audit logger is provided", async () => {
    const logger = new InMemoryAuditLogger();
    const plan = await buildHttpDryRunPlan(
      dryRunManifest(),
      { owner: "opencap", repo: "runtime", title: "Bug", body: "broken", labels: [], token: "secret" },
      { auditLogger: logger, channel: "cli" },
    );

    expect(plan.status).toBe("dry_run");
    expect(plan.egressPreview?.targetOrigin).toBe("https://api.github.com");
    expect(logger.events).toHaveLength(1);
    expect(logger.events[0]).toMatchObject({
      capabilityId: "github.create_issue",
      status: "dry_run",
      policyDecision: "allow",
      confirmationStatus: "approved",
      requestStarted: false,
      egressTargetOrigin: "https://api.github.com",
      egressRedactedPreviewJson: expect.stringContaining('"targetOrigin":"https://api.github.com"'),
      inputRedactedJson: '{"body":"broken","labels":[],"owner":"opencap","repo":"runtime","title":"Bug","token":"[REDACTED]"}',
    });
  });
});




describe("arbitrary URL risk detection", () => {
  it("detects capabilities whose URL is fully provided by input", async () => {
    const manifest = {
      ...dryRunManifest(),
      id: "http.request_demo",
      auth: { type: "none" as const },
      execution: { method: "GET" as const, url: "{{url}}", timeout_ms: 10000 },
    };

    expect(detectArbitraryUrlCapability(manifest)).toBe(true);
    expect(capabilityRiskWarnings(manifest)).toContain("arbitrary_url");

    const plan = await buildHttpDryRunPlan(manifest, { url: "https://example.com" });
    expect(plan.url).toBe("https://example.com");
    expect(plan.warnings).toContain("arbitrary_url");
  });

  it("does not flag fixed-origin URL templates as arbitrary URL capabilities", () => {
    expect(detectArbitraryUrlCapability(dryRunManifest())).toBe(false);
    expect(capabilityRiskWarnings(dryRunManifest())).not.toContain("arbitrary_url");
  });
});

describe("HTTP output normalization", () => {
  it("normalizes JSON responses with status and content type", async () => {
    const normalized = await normalizeHttpResponse(new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { "content-type": "application/json; charset=utf-8" },
    }));

    expect(normalized).toEqual({
      statusCode: 201,
      contentType: "application/json; charset=utf-8",
      bodyKind: "json",
      output: { ok: true },
    });
  });

  it("normalizes non-JSON responses as text output", async () => {
    const normalized = await normalizeHttpResponse(new Response("created", {
      status: 200,
      headers: { "content-type": "text/plain" },
    }));

    expect(normalized).toEqual({
      statusCode: 200,
      contentType: "text/plain",
      bodyKind: "text",
      output: "created",
    });
  });

  it("normalizes empty responses without inventing output", async () => {
    const normalized = await normalizeHttpResponse(new Response(null, { status: 204 }));

    expect(normalized).toEqual({
      statusCode: 204,
      contentType: undefined,
      bodyKind: "empty",
      output: undefined,
    });
  });
});

describe("HTTP executor", () => {
  it("blocks non-read-only execution when audit preflight fails before secrets or request start", async () => {
    const logger = new FailingAuditPreflightLogger();
    let fetchCalls = 0;
    let secretReads = 0;
    const env: Record<string, string | undefined> = {};
    Object.defineProperty(env, "GITHUB_TOKEN", {
      enumerable: true,
      get() {
        secretReads += 1;
        throw new Error("secret should not be read after audit preflight failure");
      },
    });
    const fetchImpl = (async () => {
      fetchCalls += 1;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;

    const result = await executeHttpCapability(
      dryRunManifest(),
      { owner: "opencap", repo: "runtime", title: "Bug", body: "broken" },
      { env, auditLogger: logger, fetch: fetchImpl },
    );

    expect(result).toMatchObject({
      ok: false,
      status: "audit_failed",
      error: { code: "AUDIT_PREFLIGHT_FAILED" },
    });
    expect(result.error?.message).toContain("Audit preflight failed");
    expect(secretReads).toBe(0);
    expect(fetchCalls).toBe(0);
    expect(logger.events).toEqual([]);
    expect(logger.preflightChecks).toHaveLength(1);
    expect(logger.preflightChecks[0]).toMatchObject({
      capabilityId: "github.create_issue",
      resolvedUrl: "https://api.github.com/repos/opencap/runtime/issues",
      requestStarted: false,
    });
    expect(JSON.stringify(result)).not.toContain("provider-secret");
    expect(JSON.stringify(logger.preflightChecks[0])).not.toContain("provider-secret");
  });

  it("executes a POST JSON request with bearer auth and writes an audit event without leaking the secret", async () => {
    const logger = new InMemoryAuditLogger();
    const requests: Array<{ method?: string; url?: string; authorization?: string; body: string }> = [];
    const server = createServer(async (request, response) => {
      requests.push({
        method: request.method,
        url: request.url,
        authorization: request.headers.authorization,
        body: await readRequestBody(request),
      });
      response.writeHead(201, { "content-type": "application/json" });
      response.end(JSON.stringify({ issue_url: "https://example.test/issues/1", issue_number: 1 }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("expected TCP server address");
      }

      const manifest = {
        ...dryRunManifest(),
        execution: {
          ...dryRunManifest().execution,
          url: `http://127.0.0.1:${address.port}/repos/{{owner}}/{{repo}}/issues`,
        },
      };

      const result = await executeHttpCapability(
        manifest,
        { owner: "opencap", repo: "runtime", title: "Bug", body: "broken", labels: ["bug"], token: "input-secret" },
        { env: { GITHUB_TOKEN: "provider-secret" }, auditLogger: logger, channel: "cli" },
      );

      expect(result).toMatchObject({
        ok: true,
        capabilityId: "github.create_issue",
        method: "POST",
        status: "success",
        statusCode: 201,
        output: { issue_url: "https://example.test/issues/1", issue_number: 1 },
      });
      expect(requests).toEqual([
        {
          method: "POST",
          url: "/repos/opencap/runtime/issues",
          authorization: "Bearer provider-secret",
          body: JSON.stringify({ title: "Bug", body: "Issue: broken", labels: ["bug"] }),
        },
      ]);
      expect(logger.events).toHaveLength(1);
      expect(logger.events[0]).toMatchObject({
        capabilityId: "github.create_issue",
        status: "executed",
        confirmationStatus: "approved",
        resolvedUrl: `http://127.0.0.1:${address.port}/repos/opencap/runtime/issues`,
        inputRedactedJson: '{"body":"broken","labels":["bug"],"owner":"opencap","repo":"runtime","title":"Bug","token":"[REDACTED]"}',
      });
      expect(JSON.stringify(logger.events[0])).not.toContain("provider-secret");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("sends api_key auth with custom header placement", async () => {
    const logger = new InMemoryAuditLogger();
    const requests: Array<{ apiKey?: string }> = [];
    const server = createServer((request, response) => {
      requests.push({ apiKey: request.headers["x-api-key"] as string | undefined });
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("ok");
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("expected TCP server address");
      }

      const manifest = {
        ...dryRunManifest(),
        auth: { type: "api_key" as const, provider: "demo", env: "DEMO_TOKEN", placement: { type: "header", name: "X-API-Key" } },
        execution: { ...dryRunManifest().execution, method: "GET" as const, url: `http://127.0.0.1:${address.port}/search/{{repo}}`, body: undefined },
      };

      const result = await executeHttpCapability(
        manifest,
        { repo: "runtime" },
        { env: { DEMO_TOKEN: "header-secret" }, auditLogger: logger },
      );

      expect(result).toMatchObject({ ok: true, status: "success", output: "ok" });
      expect(requests).toEqual([{ apiKey: "header-secret" }]);
      expect(logger.events[0]).toMatchObject({
        credentialSource: "env",
        credentialEnvName: "DEMO_TOKEN",
        credentialPlacement: "named_header",
        credentialResolved: true,
      });
      expect(logger.events[0].credentialRedacted).toMatch(/^sha256:[a-f0-9]{12}$/);
      expect(JSON.stringify(logger.events[0])).not.toContain("header-secret");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("does not accept input tokens as replacements for manifest auth env credentials", async () => {
    const logger = new InMemoryAuditLogger();
    const requests: string[] = [];
    const server = createServer((request, response) => {
      requests.push(request.url ?? "");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("expected TCP server address");
      }

      const manifest = {
        ...dryRunManifest(),
        execution: { ...dryRunManifest().execution, method: "GET" as const, url: `http://127.0.0.1:${address.port}/search/{{repo}}`, body: undefined },
      };

      const result = await executeHttpCapability(
        manifest,
        { repo: "runtime", token: "input-token", api_key: "input-api-key", Authorization: "Bearer input-auth" },
        { env: {}, auditLogger: logger },
      );

      expect(result).toMatchObject({
        ok: false,
        status: "secret_missing",
        error: { code: "SECRET_MISSING", message: "Missing required environment credential: GITHUB_TOKEN." },
      });
      expect(requests).toEqual([]);
      expect(logger.events).toHaveLength(1);
      expect(logger.events[0]).toMatchObject({ status: "blocked", reason: "Missing required environment credential: GITHUB_TOKEN." });
      expect(logger.events[0].inputRedactedJson).toBe(
        '{"Authorization":"[REDACTED]","api_key":"[REDACTED]","repo":"runtime","token":"[REDACTED]"}',
      );
      expect(JSON.stringify(logger.events[0])).not.toContain("input-token");
      expect(JSON.stringify(logger.events[0])).not.toContain("input-api-key");
      expect(JSON.stringify(logger.events[0])).not.toContain("input-auth");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("returns a structured HTTP error for non-2xx responses", async () => {
    const server = createServer((_, response) => {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ message: "not found", token: "provider-secret" }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("expected TCP server address");
      }
      const manifest = {
        ...dryRunManifest(),
        execution: { ...dryRunManifest().execution, method: "GET" as const, url: `http://127.0.0.1:${address.port}/missing`, body: undefined },
      };

      await expect(executeHttpCapability(manifest, {}, { env: { GITHUB_TOKEN: "provider-secret" } })).resolves.toMatchObject({
        ok: false,
        status: "http_error",
        statusCode: 404,
        error: { code: "HTTP_ERROR", statusCode: 404, response: { message: "not found", token: "[REDACTED]" } },
      });
      const result = await executeHttpCapability(manifest, {}, { env: { GITHUB_TOKEN: "provider-secret" } });
      expect(JSON.stringify(result)).not.toContain("provider-secret");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("returns a structured timeout error", async () => {
    const server = createServer((_, response) => {
      setTimeout(() => {
        response.writeHead(200, { "content-type": "text/plain" });
        response.end("late");
      }, 80);
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("expected TCP server address");
      }
      const manifest = {
        ...dryRunManifest(),
        execution: { ...dryRunManifest().execution, method: "GET" as const, url: `http://127.0.0.1:${address.port}/slow`, body: undefined, timeout_ms: 10 },
      };

      await expect(executeHttpCapability(manifest, {}, { env: { GITHUB_TOKEN: "provider-secret" } })).resolves.toMatchObject({
        ok: false,
        status: "timeout",
        error: { code: "HTTP_TIMEOUT" },
      });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("returns a structured missing-secret error before sending the request", async () => {
    const logger = new InMemoryAuditLogger();
    const result = await executeHttpCapability(dryRunManifest(), { owner: "opencap", repo: "runtime", title: "Bug", body: "broken" }, { env: {}, auditLogger: logger });

    expect(result).toMatchObject({
      ok: false,
      status: "secret_missing",
      error: { code: "SECRET_MISSING" },
    });
    expect(result.error?.message).toContain("GITHUB_TOKEN");
    expect(JSON.stringify(result)).not.toContain("provider-secret");
    expect(logger.events).toHaveLength(1);
    expect(logger.events[0]).toMatchObject({ status: "blocked", resolvedUrl: "https://api.github.com/repos/opencap/runtime/issues" });
  });

  it("records credential audit evidence without leaking the secret value", async () => {
    const logger = new InMemoryAuditLogger();
    const server = createServer((_, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("expected TCP server address");
      }
      const manifest = {
        ...dryRunManifest(),
        execution: { ...dryRunManifest().execution, method: "GET" as const, url: `http://127.0.0.1:${address.port}/ok`, body: undefined },
      };

      await executeHttpCapability(manifest, {}, { env: { GITHUB_TOKEN: "provider-secret" }, auditLogger: logger });

      expect(logger.events[0]).toMatchObject({
        credentialResolved: true,
        credentialSource: "env",
        credentialEnvName: "GITHUB_TOKEN",
        credentialPlacement: "authorization_header",
      });
      expect(logger.events[0].credentialRedacted).toMatch(/^sha256:[a-f0-9]{12}$/);
      expect(JSON.stringify(logger.events[0])).not.toContain("provider-secret");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

});

describe("state dir helpers", () => {
  it("uses <cwd>/opencap.local by default", () => {
    const cwd = "/tmp/opencap-project";

    expect(resolveStateDir({ cwd, env: {} })).toBe(resolve(cwd, DEFAULT_STATE_DIR_NAME));
  });

  it("uses OPENCAP_STATE_DIR before the default", () => {
    const cwd = "/tmp/opencap-project";

    expect(resolveStateDir({ cwd, env: { [OPENCAP_STATE_DIR_ENV]: "custom-state" } })).toBe(
      resolve(cwd, "custom-state"),
    );
  });

  it("uses explicit stateDir before OPENCAP_STATE_DIR", () => {
    const cwd = "/tmp/opencap-project";

    expect(
      resolveStateDir({
        cwd,
        stateDir: "flag-state",
        env: { [OPENCAP_STATE_DIR_ENV]: "env-state" },
      }),
    ).toBe(resolve(cwd, "flag-state"));
  });

  it("returns stable local state paths", () => {
    const root = "/tmp/opencap-project/opencap.local";
    const paths = getLocalStatePaths(root);

    expect(paths.root).toBe(resolve(root));
    expect(paths.installedDir).toBe(resolve(root, "installed"));
    expect(paths.tmpDir).toBe(resolve(root, "tmp"));
    expect(paths.policiesFile).toBe(resolve(root, "policies.yml"));
    expect(paths.logsDatabaseFile).toBe(resolve(root, "logs.sqlite"));
  });

  it("creates the required V1 state files and directories", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-runtime-"));
    const paths = await ensureLocalStateDir({ cwd, env: {} });

    expect(await exists(paths.root)).toBe(true);
    expect(await exists(paths.installedDir)).toBe(true);
    expect(await exists(paths.tmpDir)).toBe(true);
    expect(await readFile(paths.policiesFile, "utf8")).toBe(DEFAULT_POLICIES_YML);
    expect(await exists(paths.logsDatabaseFile)).toBe(false);
    expect(await exists(paths.cacheDir)).toBe(false);
    expect(await exists(resolve(cwd, "registry"))).toBe(false);
  });

  it("does not overwrite an existing policies file", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-runtime-"));
    const paths = getLocalStatePaths({ cwd, env: {} });
    const customPolicy = "default: deny\nrules: []\n";

    await mkdir(paths.root, { recursive: true });
    await writeFile(paths.policiesFile, customPolicy);

    await ensureLocalStateDir({ cwd, env: {} });

    await expect(readFile(paths.policiesFile, "utf8")).resolves.toBe(customPolicy);
  });

  it("initializes OpenCapRuntime with resolved state paths", () => {
    const runtime = new OpenCapRuntime({ cwd: "/tmp/opencap-project", env: {} });

    expect(runtime.stateDir).toBe(resolve("/tmp/opencap-project", DEFAULT_STATE_DIR_NAME));
    expect(runtime.statePaths.installedDir).toBe(resolve(runtime.stateDir, "installed"));
  });

  it("lets OpenCapRuntime initialize local state on demand", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-runtime-"));
    const runtime = new OpenCapRuntime({ cwd, env: {} });
    const paths = await runtime.ensureLocalStateDir();

    expect(await exists(paths.installedDir)).toBe(true);
    await expect(readFile(paths.policiesFile, "utf8")).resolves.toBe(DEFAULT_POLICIES_YML);
  });
});


describe("policy parser", () => {
  it("loads the default ask policy when policies.yml is missing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-policy-"));
    const paths = getLocalStatePaths({ cwd, env: {} });

    await expect(loadPolicySet({ cwd, env: {} })).resolves.toEqual({
      default: "ask",
      rules: [],
      sourcePath: paths.policiesFile,
    });
  });

  it("parses a structured policy set", () => {
    expect(
      parsePolicyYml(`default: ask
rules:
  - id: allow-read
    match:
      capability_id: github.search_repo
      risk: read_only
      resource: github.repo
      action: search
      channel: mcp
      host: cursor
      trust_level: tested
    decision: allow
    reason: Tested read-only search is allowed.
`),
    ).toEqual({
      default: "ask",
      sourcePath: "policies.yml",
      rules: [
        {
          id: "allow-read",
          match: {
            capabilityId: "github.search_repo",
            risk: "read_only",
            resource: "github.repo",
            action: "search",
            channel: "mcp",
            host: "cursor",
            trustLevel: "tested",
          },
          decision: "allow",
          reason: "Tested read-only search is allowed.",
        },
      ],
    });
  });

  it("rejects invalid decisions", () => {
    expect(() => parsePolicyYml("default: maybe\nrules: []\n")).toThrow(PolicyParseError);
    expect(() => parsePolicyYml("default: maybe\nrules: []\n")).toThrow(/default/);
  });

  it("rejects invalid risk values", () => {
    expect(() =>
      parsePolicyYml(`default: ask
rules:
  - match:
      risk: harmless
    decision: allow
`),
    ).toThrow(PolicyParseError);
  });
});

describe("policy engine", () => {
  it("allows a permission when an explicit rule matches", () => {
    const policy = parsePolicyYml(`default: ask
rules:
  - id: allow-read-only
    match:
      risk: read_only
    decision: allow
    reason: Read-only is allowed.
`);

    expect(
      evaluatePolicy(policy, {
        capabilityId: "github.search_repo",
        permissions: [{ resource: "github.repo", action: "search", risk: "read_only" }],
      }),
    ).toMatchObject({
      decision: "allow",
      matchedRuleId: "allow-read-only",
      reason: "Read-only is allowed.",
    });
  });

  it("uses the default decision when no rule matches", () => {
    expect(
      evaluatePolicy(defaultPolicySet(), {
        capabilityId: "github.create_issue",
        permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
      }),
    ).toMatchObject({
      decision: "ask",
      reason: "Default policy decision: ask.",
      permissionDecisions: [{ defaulted: true }],
    });
  });

  it("uses first matching rule for each permission", () => {
    const policy = parsePolicyYml(`default: ask
rules:
  - id: first
    match:
      risk: write
    decision: ask
  - id: second
    match:
      risk: write
    decision: deny
`);

    expect(
      evaluatePolicy(policy, {
        capabilityId: "github.create_issue",
        permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
      }),
    ).toMatchObject({
      decision: "ask",
      matchedRuleId: "first",
    });
  });

  it("adds a redacted decision trace for matched risk policy rules", () => {
    const policy = parsePolicyYml(`default: ask
rules:
  - id: deny-destructive
    match:
      risk: destructive
    decision: deny
    reason: Destructive writes are blocked.
`);

    const result = evaluatePolicy(policy, {
      capabilityId: "github.delete_issue",
      permissions: [{ resource: "github.issue", action: "delete", risk: "destructive" }],
      channel: "cli",
      host: "cursor",
      trustLevel: "tested",
    });

    expect(result.decisionTrace).toMatchObject({
      traceVersion: POLICY_TRACE_VERSION,
      policySetId: "policies.yml",
      gate: "risk_policy",
      decision: "deny",
      matchedRuleId: "deny-destructive",
      defaultDecisionUsed: false,
      reasonCode: "RISK_POLICY_RULE_DENY",
      secretResolutionAllowed: false,
      executionAllowed: false,
    });
    expect(result.decisionTrace.policyRevision).toMatch(/^sha256:/);
    expect(result.decisionTrace.evaluatedFacts).toEqual(expect.arrayContaining([
      "capability_id=github.delete_issue",
      "resource=github.issue",
      "action=delete",
      "risk=destructive",
      "channel=cli",
      "host=cursor",
      "trust_level=tested",
    ]));
    expect(JSON.stringify(result.decisionTrace)).not.toContain("ghp_");
  });

  it("makes default risk policy decisions visible in the trace", () => {
    const result = evaluatePolicy(defaultPolicySet(), {
      capabilityId: "github.create_issue",
      permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
    });

    expect(result.decisionTrace).toMatchObject({
      gate: "risk_policy",
      decision: "ask",
      defaultDecisionUsed: true,
      reasonCode: "RISK_POLICY_DEFAULT_ASK",
      secretResolutionAllowed: true,
      executionAllowed: false,
    });
  });

  it("returns the strictest decision across permissions", () => {
    const policy = parsePolicyYml(`default: allow
rules:
  - id: ask-write
    match:
      risk: write
    decision: ask
  - id: deny-destructive
    match:
      risk: destructive
    decision: deny
`);

    expect(
      evaluatePolicy(policy, {
        capabilityId: "github.dangerous",
        permissions: [
          { resource: "github.issue", action: "create", risk: "write" },
          { resource: "github.issue", action: "delete", risk: "destructive" },
        ],
      }),
    ).toMatchObject({
      decision: "deny",
      matchedRuleId: "deny-destructive",
      permissionDecisions: [{ decision: "ask" }, { decision: "deny" }],
    });
  });
});

describe("confirmation handlers", () => {
  const askPolicy = evaluatePolicy(defaultPolicySet(), {
    capabilityId: "github.create_issue",
    permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
  });
  const allowPolicy = evaluatePolicy(parsePolicyYml("default: allow\nrules: []\n"), {
    capabilityId: "github.search_repo",
    permissions: [{ resource: "github.repo", action: "search", risk: "read_only" }],
  });
  const denyPolicy = evaluatePolicy(parsePolicyYml("default: deny\nrules: []\n"), {
    capabilityId: "github.delete_issue",
    permissions: [{ resource: "github.issue", action: "delete", risk: "destructive" }],
  });

  it("prompts for CLI ask decisions and approves yes responses", async () => {
    const handler = new CliConfirmationHandler(async () => "yes");

    await expect(
      handler.confirm({ capabilityId: "github.create_issue", channel: "cli", policy: askPolicy }),
    ).resolves.toMatchObject({
      status: "approved",
      channel: "cli",
      policyDecision: "ask",
      prompted: true,
    });
  });

  it("rejects CLI ask decisions when the user does not approve", async () => {
    const handler = new CliConfirmationHandler(async () => "no");

    await expect(
      handler.confirm({ capabilityId: "github.create_issue", channel: "cli", policy: askPolicy }),
    ).resolves.toMatchObject({
      status: "rejected",
      prompted: true,
    });
  });

  it("includes egress target, data classes, fields, and redacted preview in CLI prompt", async () => {
    let promptMessage = "";
    const handler = new CliConfirmationHandler(async (message) => {
      promptMessage = message;
      return "no";
    });
    const dataEgressDecision = evaluateDataEgressPolicy({
      capabilityId: "slack.send_message",
      provider: "slack",
      targetOrigin: "https://slack.com",
      resource: "slack.message",
      action: "send",
      risk: "external_send",
      inputHash: "sha256:input",
      dataClasses: ["pii"],
      redactedPreview: { text: "d***@example.com" },
      renderedFields: [{ path: "/text", destination: "body", dataClasses: ["pii"] }],
    });

    await handler.confirm({
      capabilityId: "slack.send_message",
      channel: "cli",
      policy: askPolicy,
      operationSummary: "send Slack message",
      egress: confirmationSummaryFromDataEgress(dataEgressDecision),
    });

    expect(promptMessage).toContain("Target origin: https://slack.com");
    expect(promptMessage).toContain("Data classes: pii");
    expect(promptMessage).toContain("Fields sent: /text -> body [pii]");
    expect(promptMessage).toContain('Preview: {"text":"d***@example.com"}');
    expect(promptMessage).not.toContain("dev@example.com");
  });

  it("returns confirmation_required for MCP ask decisions without prompting", async () => {
    const handler = new McpNoElicitationConfirmationHandler();

    await expect(
      handler.confirm({
        capabilityId: "github.create_issue",
        channel: "mcp",
        policy: askPolicy,
        egress: {
          targetOrigin: "https://api.github.com",
          dataClasses: ["source_code"],
          fields: [{ path: "/body", destination: "body", dataClasses: ["source_code"] }],
          redactedPreview: { body: "[redacted:source_code]" },
        },
      }),
    ).resolves.toMatchObject({
      status: "confirmation_required",
      channel: "mcp",
      policyDecision: "ask",
      prompted: false,
      reason: expect.stringContaining("https://api.github.com"),
    });
  });

  it("does not prompt for deny decisions", async () => {
    const handler = new CliConfirmationHandler(async () => {
      throw new Error("prompt should not be called");
    });

    await expect(
      handler.confirm({ capabilityId: "github.delete_issue", channel: "cli", policy: denyPolicy }),
    ).resolves.toMatchObject({
      status: "denied",
      policyDecision: "deny",
      prompted: false,
    });
  });

  it("does not prompt for allow decisions", async () => {
    const handler = new CliConfirmationHandler(async () => {
      throw new Error("prompt should not be called");
    });

    await expect(
      handler.confirm({ capabilityId: "github.search_repo", channel: "cli", policy: allowPolicy }),
    ).resolves.toMatchObject({
      status: "approved",
      policyDecision: "allow",
      prompted: false,
    });
  });

  it("approves CLI ask decisions with assumeYes", async () => {
    const handler = new CliConfirmationHandler({ assumeYes: true });

    await expect(
      handler.confirm({ capabilityId: "github.create_issue", channel: "cli", policy: askPolicy }),
    ).resolves.toMatchObject({
      status: "approved",
      policyDecision: "ask",
      prompted: false,
      reason: "CLI --yes approved this invocation once.",
    });
  });

  it("does not use assumeYes for destructive or financial ask decisions", async () => {
    const destructiveAskPolicy = evaluatePolicy(defaultPolicySet(), {
      capabilityId: "github.delete_issue",
      permissions: [{ resource: "github.issue", action: "delete", risk: "destructive" }],
    });
    const handler = new CliConfirmationHandler({ assumeYes: true });

    await expect(
      handler.confirm({ capabilityId: "github.delete_issue", channel: "cli", policy: destructiveAskPolicy }),
    ).resolves.toMatchObject({
      status: "rejected",
      policyDecision: "ask",
      prompted: false,
    });
  });

  it("does not let assumeYes override deny decisions", async () => {
    const handler = new CliConfirmationHandler({ assumeYes: true });

    await expect(
      handler.confirm({ capabilityId: "github.delete_issue", channel: "cli", policy: denyPolicy }),
    ).resolves.toMatchObject({
      status: "denied",
      policyDecision: "deny",
      prompted: false,
    });
  });
});

describe("confirmation audit", () => {
  it("records confirmation_required as a blocked audit event", async () => {
    const logger = new InMemoryAuditLogger();
    const policy = evaluatePolicy(defaultPolicySet(), {
      capabilityId: "github.create_issue",
      permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
    });

    const result = await confirmWithAudit(new McpNoElicitationConfirmationHandler(), {
      capabilityId: "github.create_issue",
      channel: "mcp",
      policy,
    }, logger);

    expect(result.confirmation.status).toBe("confirmation_required");
    expect(result.auditEvent).toMatchObject({
      capabilityId: "github.create_issue",
      status: "blocked",
      policyDecision: "ask",
      confirmationStatus: "confirmation_required",
    });
    expect(logger.events).toHaveLength(1);
  });

  it("records policy deny as a denied audit event without prompting", async () => {
    const logger = new InMemoryAuditLogger();
    const policy = evaluatePolicy(parsePolicyYml("default: deny\nrules: []\n"), {
      capabilityId: "github.delete_issue",
      permissions: [{ resource: "github.issue", action: "delete", risk: "destructive" }],
    });

    const result = await confirmWithAudit(new CliConfirmationHandler(async () => {
      throw new Error("prompt should not be called");
    }), {
      capabilityId: "github.delete_issue",
      channel: "cli",
      policy,
    }, logger);

    expect(result.confirmation.status).toBe("denied");
    expect(result.auditEvent).toMatchObject({
      capabilityId: "github.delete_issue",
      status: "denied",
      policyDecision: "deny",
      confirmationStatus: "denied",
    });
    expect(logger.events).toEqual([result.auditEvent]);
  });

  it("creates executed audit events for approved confirmations", () => {
    const policy = evaluatePolicy(parsePolicyYml("default: allow\nrules: []\n"), {
      capabilityId: "github.search_repo",
      permissions: [{ resource: "github.repo", action: "search", risk: "read_only" }],
    });
    const event = createConfirmationAuditEvent(
      { capabilityId: "github.search_repo", channel: "cli", policy },
      {
        status: "approved",
        channel: "cli",
        policyDecision: "allow",
        prompted: false,
        reason: "Policy allowed without confirmation.",
      },
      new Date("2026-05-09T00:00:00.000Z"),
    );

    expect(event).toMatchObject({
      timestamp: "2026-05-09T00:00:00.000Z",
      status: "executed",
      confirmationStatus: "approved",
      reason: "Policy allowed without confirmation.",
    });
  });
});


describe("data egress audit", () => {
  const context = {
    capabilityId: "github.create_issue",
    provider: "github",
    targetOrigin: "https://api.github.com",
    resource: "github.issue",
    action: "create",
    risk: "write",
    inputHash: "sha256:input",
    dataClasses: ["secret_like" as const],
    redactedPreview: { token: "[redacted:secret_like]" },
    renderedFields: [{ path: "/token", destination: "body" as const, dataClasses: ["secret_like" as const] }],
  };

  it("creates egress deny audit events without request start or raw secret", () => {
    const decision = evaluateDataEgressPolicy(context);
    const event = createDataEgressAuditEvent(context, decision, "mcp", new Date("2026-05-09T00:00:00.000Z"));

    expect(event).toMatchObject({
      timestamp: "2026-05-09T00:00:00.000Z",
      capabilityId: "github.create_issue",
      status: "denied",
      policyDecision: "deny",
      confirmationStatus: "denied",
      matchedRuleId: "deny-secret-like",
      requestStarted: false,
      egressDecision: "deny",
      egressDataClasses: ["secret_like"],
      egressTargetOrigin: "https://api.github.com",
      egressMatchedRuleId: "deny-secret-like",
      egressRedactedPreviewJson: '{"token":"[redacted:secret_like]"}',
      policyTrace: {
        gate: "data_egress",
        decision: "deny",
        matchedRuleId: "deny-secret-like",
        reasonCode: "DATA_EGRESS_SECRET_LIKE_DENIED",
        secretResolutionAllowed: false,
        executionAllowed: false,
      },
    });
    expect(JSON.stringify(event)).not.toContain("ghp_secret");
  });

  it("records egress decision fields through audit logger", async () => {
    const logger = new InMemoryAuditLogger();
    const decision = evaluateDataEgressPolicy(context);

    const event = await recordDataEgressDecision(logger, context, decision, "mcp", new Date("2026-05-09T00:00:00.000Z"));

    expect(logger.events).toEqual([event]);
    expect(event.requestStarted).toBe(false);
    expect(event.egressDecision).toBe("deny");
  });
});


describe("input provenance audit evidence", () => {
  it("expresses all input sources without storing raw input", () => {
    for (const inputSource of ["user_supplied", "model_generated", "tool_derived", "runtime_generated"] as const) {
      const evidence = createInputProvenanceEvidence({
        input: { prompt: "hello", token: "ghp_secret_value" },
        inputSource,
        derivedFromInvocationId: inputSource === "tool_derived" ? "inv-source" : undefined,
        dataClasses: ["secret_like"],
        egressTargetOrigin: "https://api.github.com",
        egressDecision: "deny",
        policyRuleId: "deny-secret-like",
        transformations: ["redaction"],
      });

      expect(evidence.inputHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(evidence.inputSource).toBe(inputSource);
      expect(JSON.stringify(evidence)).not.toContain("ghp_secret_value");
    }
  });

  it("records tool-derived source invocation, result digest, and transformations", () => {
    const evidence = createInputProvenanceEvidence({
      input: { issue_url: "https://github.com/opencap/opencap/issues/1" },
      inputSource: "tool_derived",
      derivedFromInvocationId: "inv-upstream",
      sourceResult: { issue_url: "https://github.com/opencap/opencap/issues/1", secret: "provider-secret" },
      dataClasses: [],
      egressTargetOrigin: "https://api.github.com",
      egressDecision: "allow",
      transformations: ["field_mapping", "minimization"],
    });

    expect(evidence).toMatchObject({
      inputSource: "tool_derived",
      derivedFromInvocationId: "inv-upstream",
      transformations: ["field_mapping", "minimization"],
      minimizationApplied: true,
    });
    expect(evidence.sourceResultDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(JSON.stringify(evidence)).not.toContain("provider-secret");
  });
});

describe("SQLite audit logger", () => {
  it("creates the SQLite database and writes audit events", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-audit-"));
    const logger = new SqliteAuditLogger({ cwd, env: {} });
    const policy = evaluatePolicy(defaultPolicySet(), {
      capabilityId: "github.create_issue",
      permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
    });
    const event = createConfirmationAuditEvent(
      { capabilityId: "github.create_issue", channel: "mcp", policy, input: { token: "abc", title: "Bug" } },
      {
        status: "confirmation_required",
        channel: "mcp",
        policyDecision: "ask",
        prompted: false,
        reason: "confirmation needed",
      },
      new Date("2026-05-09T00:00:00.000Z"),
    );

    try {
      await logger.record(event);

      expect(await exists(logger.databaseFile)).toBe(true);
      await expect(logger.recent(10)).resolves.toMatchObject([
        {
          id: event.id,
          capabilityId: "github.create_issue",
          status: "blocked",
          policyDecision: "ask",
          confirmationStatus: "confirmation_required",
          inputRedactedJson: '{"title":"Bug","token":"[REDACTED]"}',
        },
      ]);
    } finally {
      logger.close();
    }
  });

  it("audit preflight touches the SQLite write path without persisting an invocation", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-audit-preflight-"));
    const logger = new SqliteAuditLogger({ cwd, env: {} });

    try {
      await logger.preflight({
        id: "audit-preflight-check",
        timestamp: "2026-05-13T00:00:00.000Z",
        channel: "cli",
        capabilityId: "github.create_issue",
        reason: "Audit preflight before external request.",
        inputHash: "sha256:preflight",
        inputRedactedJson: '{"title":"Bug"}',
        resolvedUrl: "https://api.github.com/repos/opencap/runtime/issues",
        requestStarted: false,
      });

      await expect(logger.recent(10)).resolves.toEqual([]);
    } finally {
      logger.close();
    }
  });

  it("queries the most recent N audit events", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-audit-"));
    const logger = new SqliteAuditLogger({ cwd, env: {} });
    const policy = evaluatePolicy(parsePolicyYml("default: allow\nrules: []\n"), {
      capabilityId: "github.search_repo",
      permissions: [{ resource: "github.repo", action: "search", risk: "read_only" }],
    });

    try {
      await logger.record(
        createConfirmationAuditEvent(
          { capabilityId: "github.search_repo", channel: "cli", policy },
          { status: "approved", channel: "cli", policyDecision: "allow", prompted: false, reason: "first" },
          new Date("2026-05-09T00:00:00.000Z"),
        ),
      );
      await logger.record(
        createConfirmationAuditEvent(
          { capabilityId: "github.search_repo", channel: "cli", policy },
          { status: "approved", channel: "cli", policyDecision: "allow", prompted: false, reason: "second" },
          new Date("2026-05-09T00:00:01.000Z"),
        ),
      );

      await expect(logger.recent(1)).resolves.toMatchObject([{ reason: "second" }]);
    } finally {
      logger.close();
    }
  });

  it("persists input provenance evidence", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-audit-input-provenance-"));
    const logger = new SqliteAuditLogger({ cwd, env: {} });

    try {
      await logger.record({
        id: "evt-input-provenance",
        timestamp: "2026-05-09T00:00:00.000Z",
        channel: "cli",
        capabilityId: "github.create_issue",
        status: "denied",
        policyDecision: "deny",
        confirmationStatus: "denied",
        reason: "Data egress denied.",
        inputProvenance: createInputProvenanceEvidence({
          input: { token: "ghp_secret_value" },
          inputSource: "tool_derived",
          derivedFromInvocationId: "inv-upstream",
          dataClasses: ["secret_like"],
          egressTargetOrigin: "https://api.github.com",
          egressDecision: "deny",
          policyRuleId: "deny-secret-like",
          transformations: ["redaction"],
        }),
      });

      const recent = await logger.recent(10);
      expect(recent).toMatchObject([
        {
          capabilityId: "github.create_issue",
          inputProvenance: {
            inputSource: "tool_derived",
            derivedFromInvocationId: "inv-upstream",
            dataClasses: ["secret_like"],
            egressDecision: "deny",
            transformations: ["redaction"],
          },
        },
      ]);
      expect(JSON.stringify(recent)).not.toContain("ghp_secret_value");
    } finally {
      logger.close();
    }
  });

  it("persists egress decision evidence", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-audit-egress-"));
    const logger = new SqliteAuditLogger({ cwd, env: {} });
    const context = {
      capabilityId: "github.create_issue",
      provider: "github",
      targetOrigin: "https://api.github.com",
      resource: "github.issue",
      action: "create",
      risk: "write",
      inputHash: "sha256:input",
      dataClasses: ["secret_like" as const],
      redactedPreview: { token: "[redacted:secret_like]" },
      renderedFields: [{ path: "/token", destination: "body" as const, dataClasses: ["secret_like" as const] }],
    };

    try {
      const event = createDataEgressAuditEvent(
        context,
        evaluateDataEgressPolicy(context),
        "mcp",
        new Date("2026-05-09T00:00:00.000Z"),
      );
      await logger.record(event);

      const recent = await logger.recent(10);
      expect(recent).toMatchObject([
        {
          capabilityId: "github.create_issue",
          status: "denied",
          policyDecision: "deny",
          requestStarted: false,
          egressDecision: "deny",
          egressDataClasses: ["secret_like"],
          egressTargetOrigin: "https://api.github.com",
          egressMatchedRuleId: "deny-secret-like",
          egressRedactedPreviewJson: '{"token":"[redacted:secret_like]"}',
          policyTrace: {
            gate: "data_egress",
            decision: "deny",
            matchedRuleId: "deny-secret-like",
            reasonCode: "DATA_EGRESS_SECRET_LIKE_DENIED",
            secretResolutionAllowed: false,
            executionAllowed: false,
          },
        },
      ]);
      expect(JSON.stringify(recent)).not.toContain("ghp_secret");
    } finally {
      logger.close();
    }
  });

  it("persists resolved URL evidence for executed events", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-audit-url-"));
    const logger = new SqliteAuditLogger({ cwd, env: {} });

    try {
      await logger.record({
        id: "evt-url",
        timestamp: "2026-05-09T00:00:00.000Z",
        channel: "cli",
        capabilityId: "github.create_issue",
        status: "executed",
        policyDecision: "allow",
        confirmationStatus: "approved",
        reason: "HTTP execution succeeded.",
        resolvedUrl: "https://api.github.com/repos/opencap/runtime/issues",
        credentialSource: "env",
        credentialEnvName: "GITHUB_TOKEN",
        credentialPlacement: "authorization_header",
        credentialResolved: true,
        credentialRedacted: "sha256:abcdef123456",
      });

      await expect(logger.recent(10)).resolves.toMatchObject([
        {
          capabilityId: "github.create_issue",
          status: "executed",
          resolvedUrl: "https://api.github.com/repos/opencap/runtime/issues",
          credentialSource: "env",
          credentialEnvName: "GITHUB_TOKEN",
          credentialPlacement: "authorization_header",
          credentialResolved: true,
          credentialRedacted: "sha256:abcdef123456",
        },
      ]);
    } finally {
      logger.close();
    }
  });
});

describe("audit log filtering", () => {
  it("filters recent audit events by capability, status, and since", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-audit-filter-"));
    const logger = new SqliteAuditLogger({ cwd, env: {} });
    const issuePolicy = evaluatePolicy(defaultPolicySet(), {
      capabilityId: "github.create_issue",
      permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
    });
    const searchPolicy = evaluatePolicy(parsePolicyYml("default: allow\nrules: []\n"), {
      capabilityId: "github.search_repo",
      permissions: [{ resource: "github.repo", action: "search", risk: "read_only" }],
    });

    try {
      await logger.record(
        createConfirmationAuditEvent(
          { capabilityId: "github.create_issue", channel: "mcp", policy: issuePolicy },
          { status: "confirmation_required", channel: "mcp", policyDecision: "ask", prompted: false, reason: "blocked" },
          new Date("2026-05-09T00:00:00.000Z"),
        ),
      );
      await logger.record(
        createConfirmationAuditEvent(
          { capabilityId: "github.search_repo", channel: "cli", policy: searchPolicy },
          { status: "approved", channel: "cli", policyDecision: "allow", prompted: false, reason: "executed" },
          new Date("2026-05-09T00:00:01.000Z"),
        ),
      );

      await expect(logger.recent(10, { capabilityId: "github.create_issue" })).resolves.toMatchObject([
        { capabilityId: "github.create_issue" },
      ]);
      await expect(logger.recent(10, { status: "executed" })).resolves.toMatchObject([
        { capabilityId: "github.search_repo", status: "executed" },
      ]);
      await expect(logger.recent(10, { since: "2026-05-09T00:00:01.000Z" })).resolves.toMatchObject([
        { capabilityId: "github.search_repo" },
      ]);
    } finally {
      logger.close();
    }
  });
});

describe("input redaction and hashing", () => {
  it("redacts nested sensitive fields while preserving keys", () => {
    expect(
      redactInput({
        token: "secret-token",
        profile: { password: "pw", name: "Kimi" },
        headers: [{ Authorization: "Bearer token" }],
        regular: "value",
      }),
    ).toEqual({
      token: "[REDACTED]",
      profile: { password: "[REDACTED]", name: "Kimi" },
      headers: [{ Authorization: "[REDACTED]" }],
      regular: "value",
    });
  });

  it("creates stable JSON and input hashes independent of object key order", () => {
    const first = { b: 2, a: { d: 4, c: 3 } };
    const second = { a: { c: 3, d: 4 }, b: 2 };

    expect(stableJsonStringify(first)).toBe(stableJsonStringify(second));
    expect(hashInput(first)).toBe(hashInput(second));
    expect(hashInput(first)).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("adds redacted input and hash to confirmation audit events", () => {
    const policy = evaluatePolicy(defaultPolicySet(), {
      capabilityId: "github.create_issue",
      permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
    });
    const event = createConfirmationAuditEvent(
      {
        capabilityId: "github.create_issue",
        channel: "mcp",
        policy,
        input: { title: "Bug", api_key: "abc123" },
      },
      {
        status: "confirmation_required",
        channel: "mcp",
        policyDecision: "ask",
        prompted: false,
        reason: "confirmation needed",
      },
      new Date("2026-05-09T00:00:00.000Z"),
    );

    expect(event.inputHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(event.inputRedactedJson).toBe('{"api_key":"[REDACTED]","title":"Bug"}');
  });
});

describe("installCapability", () => {
  it("copies a registry capability into local state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");

    const result = await installCapability({ cwd, id: "github.create_issue", env: {} });

    expect(result.destinationDir).toBe(resolve(cwd, "opencap.local", "installed", "github.create_issue"));
    expect(await exists(join(result.destinationDir, "manifest.yml"))).toBe(true);
    expect(await exists(join(result.destinationDir, "README.md"))).toBe(true);
    expect(await exists(join(result.destinationDir, "tests", "basic.yml"))).toBe(true);
    expect(await exists(resolve(cwd, "registry", "developer-tools", "github.create_issue", "manifest.yml"))).toBe(true);
  });

  it("fails when the capability is missing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await mkdir(join(cwd, "registry"), { recursive: true });

    await expect(installCapability({ cwd, id: "missing.capability", env: {} })).rejects.toMatchObject({
      code: "CAPABILITY_NOT_FOUND",
    });
  });

  it("fails when more than one registry entry matches", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await writeCapability(cwd, "productivity", "github.create_issue");

    await expect(installCapability({ cwd, id: "github.create_issue", env: {} })).rejects.toMatchObject({
      code: "CAPABILITY_AMBIGUOUS",
    });
  });

  it("refuses to overwrite an installed capability without force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    await expect(installCapability({ cwd, id: "github.create_issue", env: {} })).rejects.toBeInstanceOf(
      InstallCapabilityError,
    );
    await expect(installCapability({ cwd, id: "github.create_issue", env: {} })).rejects.toMatchObject({
      code: "CAPABILITY_ALREADY_INSTALLED",
    });
  });

  it("replaces an installed capability with force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-install-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    const first = await installCapability({ cwd, id: "github.create_issue", env: {} });
    await writeFile(join(first.destinationDir, "README.md"), "local edit");

    await installCapability({ cwd, id: "github.create_issue", force: true, env: {} });

    await expect(readFile(join(first.destinationDir, "README.md"), "utf8")).resolves.toBe("# github.create_issue\n");
  });
});


describe("listInstalledCapabilities", () => {
  it("returns an empty list and initializes state when no capabilities are installed", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-list-"));
    const paths = getLocalStatePaths({ cwd, env: {} });

    await expect(listInstalledCapabilities({ cwd, env: {} })).resolves.toEqual([]);
    expect(await exists(paths.installedDir)).toBe(true);
    await expect(readFile(paths.policiesFile, "utf8")).resolves.toBe(DEFAULT_POLICIES_YML);
  });

  it("lists installed capability summaries", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-list-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    await expect(listInstalledCapabilities({ cwd, env: {} })).resolves.toMatchObject([
      {
        id: "github.create_issue",
        version: "0.1.0",
        type: "http",
        risk: "read_only",
        trustLevel: "experimental",
        status: "enabled",
      },
    ]);
  });

  it("marks invalid installed manifests without blocking valid entries", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-list-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    const badDir = join(cwd, "opencap.local", "installed", "bad.capability");
    await mkdir(badDir, { recursive: true });
    await writeFile(join(badDir, "manifest.yml"), "id: bad.capability\n");

    const result = await listInstalledCapabilities({ cwd, env: {} });

    expect(result).toHaveLength(2);
    expect(result.find((item) => item.id === "github.create_issue")?.status).toBe("enabled");
    expect(result.find((item) => item.id === "bad.capability")).toMatchObject({
      status: "invalid",
      risk: "unknown",
    });
  });
});


describe("loadInstalledCapabilities", () => {
  it("loads valid installed capabilities with install path and manifest version", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-loader-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    const result = await loadInstalledCapabilities({ cwd, env: {} });

    expect(result.invalid).toEqual([]);
    expect(result.capabilities).toMatchObject([
      {
        id: "github.create_issue",
        version: "0.1.0",
        installPath: resolve(cwd, "opencap.local", "installed", "github.create_issue"),
        manifestPath: resolve(cwd, "opencap.local", "installed", "github.create_issue", "manifest.yml"),
      },
    ]);
  });

  it("does not load invalid installed manifests", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-loader-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });

    const badDir = join(cwd, "opencap.local", "installed", "bad.capability");
    await mkdir(badDir, { recursive: true });
    await writeFile(join(badDir, "manifest.yml"), "id: bad.capability\n");

    const result = await loadInstalledCapabilities({ cwd, env: {} });

    expect(result.capabilities.map((capability) => capability.id)).toEqual(["github.create_issue"]);
    expect(result.invalid).toMatchObject([
      {
        id: "bad.capability",
        installPath: badDir,
      },
    ]);
  });

  it("wires OpenCapRuntime.loadInstalledCapabilities to the loader", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-loader-"));
    await writeCapability(cwd, "developer-tools", "github.create_issue");
    await installCapability({ cwd, id: "github.create_issue", env: {} });
    const runtime = new OpenCapRuntime({ cwd, env: {} });

    await expect(runtime.loadInstalledCapabilities()).resolves.toMatchObject([
      {
        id: "github.create_issue",
        version: "0.1.0",
      },
    ]);
  });
});
