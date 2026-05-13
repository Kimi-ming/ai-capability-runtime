import { describe, expect, it } from "vitest";
import {
  LEDGER_RECORD_VERSION,
  createLedgerRecordId,
  type CapabilityLedgerRecordV1,
  type CompatibilityLedgerRecordV1,
  type InvocationLedgerRecordV1,
  type LedgerAppendResult,
  type LedgerQueryResult,
  type PolicyLedgerRecordV1,
  type RuntimeLedgerStore,
} from "./ledger.js";

const capabilityIdentity = {
  id: "github.create_issue",
  version: "0.1.0",
  packagePath: "/tmp/opencap-state/installed/github.create_issue",
  manifestPath: "/tmp/opencap-state/installed/github.create_issue/manifest.yml",
  manifestDigest: "sha256:manifest",
  packageDigest: "sha256:package",
  lifecycle: "tested",
} satisfies CapabilityLedgerRecordV1["capability"];

function appendResult(record: { recordId: string; recordedAt: string }): LedgerAppendResult {
  return { recordId: record.recordId, recordedAt: record.recordedAt };
}

function findLast<T>(records: T[], predicate: (record: T) => boolean): T | undefined {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    if (predicate(records[index])) {
      return records[index];
    }
  }
  return undefined;
}

describe("Runtime ledger public contract", () => {
  it("creates record ids with stable prefixes for all ledger families", () => {
    expect(createLedgerRecordId("capability")).toMatch(/^ledger_cap_[0-9a-f-]{36}$/);
    expect(createLedgerRecordId("policy")).toMatch(/^ledger_pol_[0-9a-f-]{36}$/);
    expect(createLedgerRecordId("invocation")).toMatch(/^ledger_inv_[0-9a-f-]{36}$/);
    expect(createLedgerRecordId("compatibility")).toMatch(/^ledger_compat_[0-9a-f-]{36}$/);
  });

  it("models append-only records without raw payloads or secrets", () => {
    const capability = {
      ledgerVersion: LEDGER_RECORD_VERSION,
      recordKind: "capability",
      recordId: "ledger_cap_00000000-0000-4000-8000-000000000001",
      recordedAt: "2026-05-13T00:00:00.000Z",
      event: "installed",
      capability: capabilityIdentity,
      install: {
        installedAt: "2026-05-13T00:00:00.000Z",
        source: "registry",
        sourceRef: "registry/developer-tools/github.create_issue",
      },
      trust: {
        level: "tested",
        advisories: [],
        reviewDigest: "sha256:review",
      },
      metadata: { packageReadmeDigest: "sha256:readme" },
    } satisfies CapabilityLedgerRecordV1;

    const policy = {
      ledgerVersion: LEDGER_RECORD_VERSION,
      recordKind: "policy",
      recordId: "ledger_pol_00000000-0000-4000-8000-000000000002",
      recordedAt: "2026-05-13T00:01:00.000Z",
      event: "activation",
      policySetId: "local",
      fromRevision: "rev-1",
      toRevision: "rev-2",
      policyDigest: "sha256:policy",
      changedBy: "local_user",
      reason: "tighten write access",
      diffSummary: ["default ask -> deny"],
    } satisfies PolicyLedgerRecordV1;

    const invocation = {
      ledgerVersion: LEDGER_RECORD_VERSION,
      recordKind: "invocation",
      recordId: "ledger_inv_00000000-0000-4000-8000-000000000003",
      recordedAt: "2026-05-13T00:02:00.000Z",
      requestId: "req_demo",
      invocationId: "inv_demo",
      capability: capabilityIdentity,
      channel: "mcp",
      status: "confirmation_required",
      inputHash: "sha256:input",
      outputHash: "sha256:output",
      gateDecisions: [{
        gateId: "risk_policy",
        stage: "pre_secret",
        decision: "ask",
        reasonCode: "WRITE_REQUIRES_CONFIRMATION",
        summary: "Write operation requires confirmation.",
        evidence: { policyRevision: "rev-2" },
        hardBoundary: false,
        traceId: "trace_policy",
      }],
      policyTraceIds: ["trace_policy"],
      auditId: "audit_demo",
      consent: {
        consentId: "consent_demo",
        decision: "unavailable",
      },
      execution: {
        requestStarted: false,
        targetOrigin: "https://api.github.com",
      },
    } satisfies InvocationLedgerRecordV1;

    const compatibility = {
      ledgerVersion: LEDGER_RECORD_VERSION,
      recordKind: "compatibility",
      recordId: "ledger_compat_00000000-0000-4000-8000-000000000004",
      recordedAt: "2026-05-13T00:03:00.000Z",
      profile: {
        id: "opencap.mcp.tools.v1",
        version: "v1",
      },
      host: {
        id: "claude-desktop",
        name: "Claude Desktop",
        version: "1.3561.0",
      },
      opencapVersion: "0.1.0-dev",
      opencapCommit: "abcdef0",
      capability: {
        id: "github.create_issue",
        version: "0.1.0",
      },
      result: "pass",
      checkedAt: "2026-05-13T00:03:00.000Z",
      checks: [{ id: "tools_list", result: "pass" }],
      evidenceRef: "docs/生态/host-compatibility-matrix.md",
    } satisfies CompatibilityLedgerRecordV1;

    const serialized = JSON.stringify([capability, policy, invocation, compatibility]);

    expect(serialized).toContain("sha256:manifest");
    expect(serialized).toContain("sha256:policy");
    expect(serialized).toContain("sha256:input");
    expect(serialized).not.toContain("ghp_secret_value");
    expect(serialized).not.toContain("default: allow");
    expect(serialized).not.toContain("provider raw output");
  });

  it("defines adapter-neutral append and query interfaces", async () => {
    const capabilityRecords: CapabilityLedgerRecordV1[] = [];
    const policyRecords: PolicyLedgerRecordV1[] = [];
    const invocationRecords: InvocationLedgerRecordV1[] = [];
    const compatibilityRecords: CompatibilityLedgerRecordV1[] = [];

    const queryResult = <T>(records: T[]): LedgerQueryResult<T> => ({ records });

    const store = {
      appendCapabilityRecord: async (record) => {
        capabilityRecords.push(record);
        return appendResult(record);
      },
      listCapabilityRecords: async () => queryResult(capabilityRecords),
      getLatestCapabilityRecord: async (capabilityId) => findLast(capabilityRecords, (record) => record.capability.id === capabilityId),
      appendPolicyRecord: async (record) => {
        policyRecords.push(record);
        return appendResult(record);
      },
      listPolicyRecords: async () => queryResult(policyRecords),
      getActivePolicyRecord: async (policySetId) => findLast(policyRecords, (record) => record.policySetId === policySetId && record.event !== "failed_activation"),
      appendInvocationRecord: async (record) => {
        invocationRecords.push(record);
        return appendResult(record);
      },
      listInvocationRecords: async () => queryResult(invocationRecords),
      getInvocationRecord: async (requestId) => invocationRecords.find((record) => record.requestId === requestId),
      appendCompatibilityRecord: async (record) => {
        compatibilityRecords.push(record);
        return appendResult(record);
      },
      listCompatibilityRecords: async () => queryResult(compatibilityRecords),
      getLatestCompatibilityRecord: async (lookup) => findLast(compatibilityRecords, (record) =>
        record.host.id === lookup.hostId && record.profile.id === lookup.profileId
      ),
    } satisfies RuntimeLedgerStore;

    const capability = {
      ledgerVersion: LEDGER_RECORD_VERSION,
      recordKind: "capability",
      recordId: "ledger_cap_test",
      recordedAt: "2026-05-13T00:00:00.000Z",
      event: "installed",
      capability: capabilityIdentity,
      install: { installedAt: "2026-05-13T00:00:00.000Z", source: "test" },
    } satisfies CapabilityLedgerRecordV1;

    const policy = {
      ledgerVersion: LEDGER_RECORD_VERSION,
      recordKind: "policy",
      recordId: "ledger_pol_test",
      recordedAt: "2026-05-13T00:01:00.000Z",
      event: "activation",
      policySetId: "local",
      toRevision: "rev-1",
      policyDigest: "sha256:policy",
      changedBy: "local_user",
      diffSummary: [],
    } satisfies PolicyLedgerRecordV1;

    const invocation = {
      ledgerVersion: LEDGER_RECORD_VERSION,
      recordKind: "invocation",
      recordId: "ledger_inv_test",
      recordedAt: "2026-05-13T00:02:00.000Z",
      requestId: "req_test",
      capability: capabilityIdentity,
      channel: "test",
      status: "dry_run",
      gateDecisions: [],
      policyTraceIds: [],
    } satisfies InvocationLedgerRecordV1;

    const compatibility = {
      ledgerVersion: LEDGER_RECORD_VERSION,
      recordKind: "compatibility",
      recordId: "ledger_compat_test",
      recordedAt: "2026-05-13T00:03:00.000Z",
      profile: { id: "opencap.mcp.tools.v1" },
      host: { id: "opencap-cli" },
      result: "pending-smoke",
      checkedAt: "2026-05-13T00:03:00.000Z",
      checks: [],
    } satisfies CompatibilityLedgerRecordV1;

    await expect(store.appendCapabilityRecord(capability)).resolves.toEqual({ recordId: "ledger_cap_test", recordedAt: capability.recordedAt });
    await expect(store.appendPolicyRecord(policy)).resolves.toEqual({ recordId: "ledger_pol_test", recordedAt: policy.recordedAt });
    await expect(store.appendInvocationRecord(invocation)).resolves.toEqual({ recordId: "ledger_inv_test", recordedAt: invocation.recordedAt });
    await expect(store.appendCompatibilityRecord(compatibility)).resolves.toEqual({ recordId: "ledger_compat_test", recordedAt: compatibility.recordedAt });

    await expect(store.getLatestCapabilityRecord("github.create_issue")).resolves.toMatchObject({ recordKind: "capability" });
    await expect(store.getActivePolicyRecord("local")).resolves.toMatchObject({ policySetId: "local" });
    await expect(store.getInvocationRecord("req_test")).resolves.toMatchObject({ status: "dry_run" });
    await expect(store.getLatestCompatibilityRecord({ hostId: "opencap-cli", profileId: "opencap.mcp.tools.v1" })).resolves.toMatchObject({ result: "pending-smoke" });
  });

  it("exposes ledger helpers from the runtime root entrypoint", async () => {
    const runtime = await import("./index.js");

    expect(runtime.LEDGER_RECORD_VERSION).toBe(LEDGER_RECORD_VERSION);
    expect(runtime.createLedgerRecordId("invocation")).toMatch(/^ledger_inv_[0-9a-f-]{36}$/);
  });
});
