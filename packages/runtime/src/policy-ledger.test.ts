import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FilePolicyLedger } from "./policy-ledger.js";

async function createLedger(): Promise<FilePolicyLedger> {
  const root = await mkdtemp(join(tmpdir(), "opencap-policy-ledger-"));
  return new FilePolicyLedger({
    ledgerFile: join(root, "policy-ledger.jsonl"),
    activeFile: join(root, "active-policy.json"),
  });
}

describe("FilePolicyLedger", () => {
  it("records policy activation with revision, digest, from/to revision, and reason", async () => {
    const ledger = await createLedger();

    const first = await ledger.activate({
      policySetId: "local",
      toRevision: "rev-1",
      policyContent: "default: ask\nrules: []\n",
      reason: "initial policy",
      diffSummary: ["default ask"],
      activatedAt: new Date("2026-05-12T00:00:00.000Z"),
    });
    const second = await ledger.activate({
      policySetId: "local",
      toRevision: "rev-2",
      policyContent: "default: deny\nrules: []\n",
      reason: "tighten writes",
      diffSummary: ["default ask -> deny"],
      activatedAt: new Date("2026-05-12T01:00:00.000Z"),
    });

    expect(first).toMatchObject({ kind: "activation", toRevision: "rev-1", reason: "initial policy" });
    expect(first.digest).toMatch(/^sha256:/);
    expect(second).toMatchObject({ kind: "activation", fromRevision: "rev-1", toRevision: "rev-2" });
    await expect(ledger.active()).resolves.toMatchObject({ revision: "rev-2", digest: second.digest });
    await expect(ledger.records()).resolves.toMatchObject([
      { toRevision: "rev-1" },
      { fromRevision: "rev-1", toRevision: "rev-2" },
    ]);
  });

  it("records rollback as a new activation without deleting history", async () => {
    const ledger = await createLedger();

    await ledger.activate({ policySetId: "local", toRevision: "rev-1", policyContent: "default: ask\n" });
    await ledger.activate({ policySetId: "local", toRevision: "rev-2", policyContent: "default: deny\n" });
    const rollback = await ledger.rollback({
      policySetId: "local",
      toRevision: "rev-1",
      policyContent: "default: ask\n",
      reason: "rollback to known safe policy",
    });

    expect(rollback).toMatchObject({ kind: "rollback", fromRevision: "rev-2", toRevision: "rev-1" });
    await expect(ledger.active()).resolves.toMatchObject({ revision: "rev-1" });
    await expect(ledger.records()).resolves.toHaveLength(3);
  });

  it("records failed activation without overwriting the current active policy", async () => {
    const ledger = await createLedger();
    const active = await ledger.activate({ policySetId: "local", toRevision: "rev-1", policyContent: "default: ask\n" });

    const failure = await ledger.recordFailedActivation({
      policySetId: "local",
      attemptedRevision: "rev-bad",
      policyContent: "default: maybe\n",
      reason: "invalid test policy",
      errorCode: "POLICY_DECISION_INVALID",
    });

    expect(failure).toMatchObject({ kind: "failed_activation", toRevision: "rev-bad", errorCode: "POLICY_DECISION_INVALID" });
    await expect(ledger.active()).resolves.toMatchObject({ revision: "rev-1", digest: active.digest });
    await expect(ledger.records()).resolves.toHaveLength(2);
  });

  it("does not write policy content, secret values, or input originals into ledger records", async () => {
    const root = await mkdtemp(join(tmpdir(), "opencap-policy-ledger-redaction-"));
    const ledgerFile = join(root, "policy-ledger.jsonl");
    const ledger = new FilePolicyLedger({ ledgerFile, activeFile: join(root, "active-policy.json") });

    await ledger.activate({
      policySetId: "local",
      toRevision: "rev-secret",
      policyContent: "default: ask\n# token=ghp_secret_value\n",
      reason: "rotate token=ghp_secret_value",
      diffSummary: ["authorization=Bearer hidden"],
    });

    const raw = await readFile(ledgerFile, "utf8");
    expect(raw).not.toContain("ghp_secret_value");
    expect(raw).not.toContain("Bearer hidden");
    expect(raw).not.toContain("default: ask");
    expect(raw).toContain("[REDACTED]");
  });
});
