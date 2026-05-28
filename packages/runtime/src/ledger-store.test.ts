import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FileRuntimeLedgerStore,
  LEDGER_RECORD_VERSION,
  type CapabilityLedgerRecordV1,
  type CompatibilityLedgerRecordV1,
  type InvocationLedgerRecordV1,
  type PolicyLedgerRecordV1,
} from "./ledger.js";

const capabilityIdentity = {
  id: "github.create_issue",
  version: "0.1.0",
  packagePath: "/tmp/opencap-state/installed/github.create_issue",
  manifestPath: "/tmp/opencap-state/installed/github.create_issue/manifest.yml",
  manifestDigest: "sha256:manifest",
} satisfies CapabilityLedgerRecordV1["capability"];

function capabilityRecord(input: Partial<CapabilityLedgerRecordV1> = {}): CapabilityLedgerRecordV1 {
  return {
    ledgerVersion: LEDGER_RECORD_VERSION,
    recordKind: "capability",
    recordId: input.recordId ?? "ledger_cap_00000000-0000-4000-8000-000000000001",
    recordedAt: input.recordedAt ?? "2026-05-28T00:00:00.000Z",
    event: input.event ?? "installed",
    capability: input.capability ?? capabilityIdentity,
    install: input.install ?? { installedAt: "2026-05-28T00:00:00.000Z", source: "test" },
    metadata: input.metadata,
  };
}

function policyRecord(input: Partial<PolicyLedgerRecordV1> = {}): PolicyLedgerRecordV1 {
  return {
    ledgerVersion: LEDGER_RECORD_VERSION,
    recordKind: "policy",
    recordId: input.recordId ?? "ledger_pol_00000000-0000-4000-8000-000000000001",
    recordedAt: input.recordedAt ?? "2026-05-28T00:01:00.000Z",
    event: input.event ?? "activation",
    policySetId: input.policySetId ?? "local",
    toRevision: input.toRevision ?? "rev-1",
    policyDigest: input.policyDigest ?? "sha256:policy",
    changedBy: input.changedBy ?? "local_user",
  };
}

function invocationRecord(input: Partial<InvocationLedgerRecordV1> = {}): InvocationLedgerRecordV1 {
  return {
    ledgerVersion: LEDGER_RECORD_VERSION,
    recordKind: "invocation",
    recordId: input.recordId ?? "ledger_inv_00000000-0000-4000-8000-000000000001",
    recordedAt: input.recordedAt ?? "2026-05-28T00:02:00.000Z",
    requestId: input.requestId ?? "req_1",
    capability: input.capability ?? capabilityIdentity,
    channel: input.channel ?? "cli",
    status: input.status ?? "dry_run",
    inputHash: input.inputHash ?? "sha256:input",
    gateDecisions: input.gateDecisions ?? [],
    policyTraceIds: input.policyTraceIds ?? [],
    metadata: input.metadata,
  };
}

function compatibilityRecord(input: Partial<CompatibilityLedgerRecordV1> = {}): CompatibilityLedgerRecordV1 {
  return {
    ledgerVersion: LEDGER_RECORD_VERSION,
    recordKind: "compatibility",
    recordId: input.recordId ?? "ledger_compat_00000000-0000-4000-8000-000000000001",
    recordedAt: input.recordedAt ?? "2026-05-28T00:03:00.000Z",
    profile: input.profile ?? { id: "opencap.mcp.tools.v1" },
    host: input.host ?? { id: "opencap-sdk-client" },
    capability: input.capability ?? { id: "github.create_issue", version: "0.1.0" },
    result: input.result ?? "pass",
    checkedAt: input.checkedAt ?? "2026-05-28T00:03:00.000Z",
    checks: input.checks ?? [{ id: "tools/list", result: "pass" }],
  };
}

describe("FileRuntimeLedgerStore", () => {
  it("appends each ledger family to a separate JSONL file under the resolved state dir", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-ledger-store-"));

    try {
      const stateDir = join(cwd, "state");
      const store = new FileRuntimeLedgerStore({ cwd, stateDir: "state", env: {} });

      await expect(store.appendCapabilityRecord(capabilityRecord())).resolves.toMatchObject({
        recordId: "ledger_cap_00000000-0000-4000-8000-000000000001",
        recordedAt: "2026-05-28T00:00:00.000Z",
      });
      await store.appendPolicyRecord(policyRecord());
      await store.appendInvocationRecord(invocationRecord());
      await store.appendCompatibilityRecord(compatibilityRecord());

      await expect(readFile(join(stateDir, "ledger", "capability.jsonl"), "utf8")).resolves.toContain("\"recordKind\":\"capability\"");
      await expect(readFile(join(stateDir, "ledger", "policy.jsonl"), "utf8")).resolves.toContain("\"recordKind\":\"policy\"");
      await expect(readFile(join(stateDir, "ledger", "invocation.jsonl"), "utf8")).resolves.toContain("\"recordKind\":\"invocation\"");
      await expect(readFile(join(stateDir, "ledger", "compatibility.jsonl"), "utf8")).resolves.toContain("\"recordKind\":\"compatibility\"");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it("filters records by kind-specific query fields and recordedAt range", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-ledger-store-"));

    try {
      const store = new FileRuntimeLedgerStore({ stateDir, env: {} });
      await store.appendCapabilityRecord(capabilityRecord({ recordId: "ledger_cap_old", recordedAt: "2026-05-27T00:00:00.000Z" }));
      await store.appendCapabilityRecord(capabilityRecord({
        recordId: "ledger_cap_latest",
        recordedAt: "2026-05-28T00:00:00.000Z",
        capability: { ...capabilityIdentity, id: "github.search_repo" },
      }));
      await store.appendInvocationRecord(invocationRecord({ requestId: "req_write", status: "confirmation_required" }));
      await store.appendInvocationRecord(invocationRecord({
        recordId: "ledger_inv_read",
        requestId: "req_read",
        status: "dry_run",
        capability: { ...capabilityIdentity, id: "github.search_repo" },
      }));

      await expect(store.listCapabilityRecords({
        capabilityId: "github.search_repo",
        since: "2026-05-28T00:00:00.000Z",
      })).resolves.toMatchObject({
        records: [{ recordId: "ledger_cap_latest" }],
      });
      await expect(store.listInvocationRecords({ capabilityId: "github.search_repo", status: "dry_run" })).resolves.toMatchObject({
        records: [{ requestId: "req_read" }],
      });
      await expect(store.listCapabilityRecords({ limit: 1 })).resolves.toMatchObject({
        records: [{ recordId: "ledger_cap_old" }],
        nextCursor: "1",
      });
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it("returns latest capability, active policy, invocation, and compatibility records", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-ledger-store-"));

    try {
      const store = new FileRuntimeLedgerStore({ stateDir, env: {} });
      await store.appendCapabilityRecord(capabilityRecord({ recordId: "ledger_cap_first", recordedAt: "2026-05-28T00:00:00.000Z" }));
      await store.appendCapabilityRecord(capabilityRecord({ recordId: "ledger_cap_second", recordedAt: "2026-05-28T00:10:00.000Z", event: "trust_updated" }));
      await store.appendPolicyRecord(policyRecord({ recordId: "ledger_pol_failed", event: "failed_activation", attemptedRevision: "rev-bad" }));
      await store.appendPolicyRecord(policyRecord({ recordId: "ledger_pol_active", recordedAt: "2026-05-28T00:11:00.000Z", toRevision: "rev-2" }));
      await store.appendInvocationRecord(invocationRecord({ requestId: "req_lookup" }));
      await store.appendCompatibilityRecord(compatibilityRecord({ recordId: "ledger_compat_lookup" }));

      await expect(store.getLatestCapabilityRecord("github.create_issue")).resolves.toMatchObject({ recordId: "ledger_cap_second" });
      await expect(store.getActivePolicyRecord("local")).resolves.toMatchObject({ recordId: "ledger_pol_active" });
      await expect(store.getInvocationRecord("req_lookup")).resolves.toMatchObject({ recordKind: "invocation" });
      await expect(store.getLatestCompatibilityRecord({
        hostId: "opencap-sdk-client",
        profileId: "opencap.mcp.tools.v1",
        capabilityId: "github.create_issue",
      })).resolves.toMatchObject({ recordId: "ledger_compat_lookup" });
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it("rejects records that contain raw payload or secret-shaped ledger metadata", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-ledger-store-"));

    try {
      const store = new FileRuntimeLedgerStore({ stateDir, env: {} });

      await expect(store.appendInvocationRecord(invocationRecord({
        metadata: {
          rawInput: { title: "Create issue" },
          token: "ghp_secret_value",
        },
      }))).rejects.toThrow("Ledger records cannot contain raw payload or secret-like metadata");
      await expect(readFile(join(stateDir, "ledger", "invocation.jsonl"), "utf8")).rejects.toThrow();
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it("exposes the file ledger store from the runtime root entrypoint", async () => {
    const runtime = await import("./index.js");

    expect(runtime.FileRuntimeLedgerStore).toBe(FileRuntimeLedgerStore);
  });
});
