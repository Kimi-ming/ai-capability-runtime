import { mkdtemp } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { exportDecisionLogRecords } from "./decision-log.js";
import { applyPolicyOverrides, type PolicyOverrideRecordV1 } from "./policy-override.js";
import { simulatePolicyDiff } from "./policy-simulation.js";
import { FilePolicyLedger } from "./policy-ledger.js";
import { defaultPolicySet, evaluatePolicy, type AuditEvent } from "./index.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");
const conformanceRecordPath = join(repoRoot, "packages/runtime/test/fixtures/conformance/policy-governance.yml");

function loadConformanceChecks(): string[] {
  const parsed = parseYaml(readFileSync(conformanceRecordPath, "utf8")) as { checks?: Record<string, string> };
  return Object.keys(parsed.checks ?? {});
}

function basePolicy(decision: "allow" | "ask" | "deny" = "ask") {
  return evaluatePolicy({ ...defaultPolicySet("conformance-policy"), default: decision }, {
    capabilityId: "slack.send_message",
    permissions: [{ resource: "slack.message", action: "send", risk: "external_send" }],
  });
}

describe("policy governance conformance", () => {
  it("declares the required policy governance checks", () => {
    expect(new Set(loadConformanceChecks())).toEqual(new Set([
      "C-PG-001-decision-trace-redacted",
      "C-PG-002-policy-change-ledger",
      "C-PG-003-broad-allow-simulation",
      "C-PG-004-breakglass-hard-boundary",
      "C-PG-005-audit-redaction-export",
    ]));
  });

  it("C-PG-001 emits redacted decision trace for policy decisions", () => {
    const result = basePolicy("ask");

    expect(result.decisionTrace).toMatchObject({
      policySetId: "conformance-policy",
      decision: "ask",
      gate: "risk_policy",
      reasonCode: "RISK_POLICY_DEFAULT_ASK",
    });
    expect(JSON.stringify(result.decisionTrace)).not.toContain("ghp_real_token");
  });

  it("C-PG-002 records policy change audit without policy body", async () => {
    const root = await mkdtemp(join(tmpdir(), "opencap-conformance-ledger-"));
    const ledger = new FilePolicyLedger({ ledgerFile: join(root, "ledger.jsonl"), activeFile: join(root, "active.json") });

    await ledger.activate({ policySetId: "local", toRevision: "rev-1", policyContent: "default: ask\n", reason: "initial" });
    const rollback = await ledger.rollback({ policySetId: "local", toRevision: "rev-1", policyContent: "default: ask\n", reason: "safe rollback" });

    expect(rollback.kind).toBe("rollback");
    await expect(ledger.records()).resolves.toHaveLength(2);
  });

  it("C-PG-003 detects broad allow sensitive egress simulation", () => {
    const report = simulatePolicyDiff({
      policyBefore: "default: ask\nrules: []\n",
      policyAfter: "default: allow\nrules: []\n",
      scenarios: [{
        id: "slack.send_message.pii",
        capabilityId: "slack.send_message",
        resource: "slack.message",
        action: "send",
        risk: "external_send",
        dataClasses: ["pii"],
        targetOrigin: "https://slack.com",
      }],
    });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "broad_data_egress_allow", severity: "error" }),
    ]));
  });

  it("C-PG-004 keeps breakglass behind hard safety boundaries", () => {
    const record: PolicyOverrideRecordV1 = {
      overrideId: "breakglass-1",
      type: "breakglass",
      capabilityId: "slack.send_message",
      risk: "external_send",
      reason: "incident",
      expiresAt: "2026-05-12T00:05:00.000Z",
      createdBy: "local_user",
      createdAt: "2026-05-12T00:00:00.000Z",
    };

    const result = applyPolicyOverrides(basePolicy("deny"), [record], {
      now: new Date("2026-05-12T00:00:00.000Z"),
      capabilityId: "slack.send_message",
      risk: "external_send",
      gates: { dataEgressDecision: "deny", outboundAllowed: true, capabilityStatus: "active" },
    });

    expect(result).toMatchObject({ decision: "deny", overrideApplied: false });
    expect(result.policyTrace.evaluatedFacts).toContain("override_ignored=data_egress_deny");
  });

  it("C-PG-005 exports audit decision summary without input originals", () => {
    const policy = basePolicy("ask");
    const event: AuditEvent = {
      id: "inv-conformance",
      timestamp: "2026-05-12T00:00:00.000Z",
      channel: "cli",
      capabilityId: "slack.send_message",
      status: "blocked",
      policyDecision: "ask",
      confirmationStatus: "confirmation_required",
      reason: "requires confirmation",
      inputHash: "sha256:input",
      inputRedactedJson: JSON.stringify({ token: "[REDACTED]", body: "do not export" }),
      policyTrace: policy.decisionTrace,
    };

    const exported = exportDecisionLogRecords([event]);
    expect(exported[0]).toMatchObject({ invocationId: "inv-conformance", policyRevision: expect.stringMatching(/^sha256:/) });
    expect(JSON.stringify(exported)).not.toContain("do not export");
    expect(JSON.stringify(exported)).not.toContain("token");
  });
});
