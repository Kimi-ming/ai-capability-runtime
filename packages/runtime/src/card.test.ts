import { describe, expect, it } from "vitest";
import type { CapabilityManifest } from "@opencap/spec";
import type { CompatibilityLedgerRecordV1 } from "./ledger.js";
import {
  CARD_SCHEMA_VERSION,
  createCapabilityCard,
  createCardId,
  createCompatibilityCard,
  createConsentCard,
  createTrustCard,
  createTrustCardFromInstalledCapability,
  type InstalledCapabilityRecord,
} from "./index.js";

const manifest = {
  id: "github.create_issue",
  name: "Create GitHub Issue",
  description: "Create a GitHub issue from structured input.",
  version: "0.1.0",
  type: "http",
  input: { type: "object" },
  output: { type: "object" },
  auth: {
    type: "api_key",
    provider: "github",
    env: "GITHUB_TOKEN",
    placement: { type: "bearer" },
    scopes: ["issues:write"],
  },
  permissions: [{
    resource: "github.issue",
    action: "create",
    risk: "write",
    confirmation: "ask",
  }],
  execution: {
    method: "POST",
    url: "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
  },
  metadata: {
    category: "developer-tools",
    maintainer: "opencap",
  },
} satisfies CapabilityManifest;

const installedCapability = {
  identity: {
    id: "github.create_issue",
    version: "0.1.0",
    packagePath: "/tmp/opencap-state/installed/github.create_issue",
    manifestPath: "/tmp/opencap-state/installed/github.create_issue/manifest.yml",
    manifestDigest: "sha256:manifest",
    packageDigest: "sha256:package",
    lifecycle: "tested",
  },
  manifest,
  install: {
    installedAt: "2026-05-13T00:00:00.000Z",
    source: "registry",
    sourceRef: "registry/developer-tools/github.create_issue",
  },
  trust: {
    level: "tested",
    advisories: ["GHSA-demo"],
    reviewDigest: "sha256:review",
  },
  derived: {
    riskSummary: {
      highestRisk: "write",
      requiresConfirmation: true,
      permissions: manifest.permissions,
    },
    toolName: "github__create_issue",
    modelVisibleSummary: "Create GitHub Issue. Risk: write. Confirmation: ask.",
  },
} satisfies InstalledCapabilityRecord;

describe("Runtime Card public contract", () => {
  it("creates card ids with stable prefixes", () => {
    expect(createCardId("capability")).toMatch(/^card_cap_[0-9a-f-]{36}$/);
    expect(createCardId("trust")).toMatch(/^card_trust_[0-9a-f-]{36}$/);
    expect(createCardId("consent")).toMatch(/^card_consent_[0-9a-f-]{36}$/);
    expect(createCardId("compatibility")).toMatch(/^card_compat_[0-9a-f-]{36}$/);
  });

  it("generates capability cards from installed capability records", () => {
    const card = createCapabilityCard({
      capability: installedCapability,
      cardId: "card_cap_test",
      generatedAt: "2026-05-13T00:00:00.000Z",
    });

    expect(card).toMatchObject({
      schemaVersion: CARD_SCHEMA_VERSION,
      cardKind: "capability",
      cardId: "card_cap_test",
      generatedBy: "opencap.runtime",
      capability: {
        id: "github.create_issue",
        version: "0.1.0",
        name: "Create GitHub Issue",
        lifecycle: "tested",
        manifestDigest: "sha256:manifest",
      },
      summary: "Create a GitHub issue from structured input.",
      risk: {
        highestRisk: "write",
        requiresConfirmation: true,
      },
      auth: {
        type: "api_key",
        provider: "github",
        envName: "GITHUB_TOKEN",
        placement: "bearer",
        scopes: ["issues:write"],
        credentialValueRedacted: true,
      },
      install: {
        source: "registry",
        sourceRef: "registry/developer-tools/github.create_issue",
      },
      trust: {
        level: "tested",
      },
    });
    expect(card.permissions).toEqual(manifest.permissions);
    expect(card.generatedFrom).toEqual([
      { kind: "manifest", digest: "sha256:manifest" },
      { kind: "package", digest: "sha256:package" },
      { kind: "review", digest: "sha256:review" },
    ]);
    expect(JSON.stringify(card)).not.toContain("ghp_secret_value");
  });

  it("generates trust cards as evidence summaries, not authorization", () => {
    const card = createTrustCard({
      capability: installedCapability.identity,
      trust: installedCapability.trust,
      tests: { status: "passing", lastRun: "2026-05-13", evidenceRef: "registry/developer-tools/github.create_issue/tests/basic.yml" },
      review: { leastPrivilege: "pass", reviewedAt: "2026-05-13", reviewDigest: "sha256:review" },
      advisories: { open: 1, latest: "GHSA-demo", refs: ["GHSA-demo"] },
      maintainer: { status: "community", name: "opencap" },
      quality: { score: 0.82, rubricVersion: "v1" },
      provenance: { manifestDigest: "sha256:manifest", packageDigest: "sha256:package" },
      generatedAt: "2026-05-13T00:01:00.000Z",
      cardId: "card_trust_test",
    });

    expect(card.cardKind).toBe("trust");
    expect(card.trustLevel).toBe("tested");
    expect(card.tests.status).toBe("passing");
    expect(card.review?.leastPrivilege).toBe("pass");
    expect(card.advisories.open).toBe(1);
    expect(card.disclaimer).toContain("not a security guarantee");
    expect(card.disclaimer).toContain("not an authorization decision");
    expect(JSON.stringify(card)).not.toContain("absolutely safe");
  });

  it("generates trust cards from installed capability records with derived evidence rules", () => {
    const card = createTrustCardFromInstalledCapability({
      capability: installedCapability,
      tests: { status: "passing", lastRun: "2026-05-14", evidenceRef: "registry/developer-tools/github.create_issue/tests/basic.yml" },
      generatedAt: "2026-05-14T00:00:00.000Z",
      cardId: "card_trust_generated",
    });

    expect(card).toMatchObject({
      cardKind: "trust",
      cardId: "card_trust_generated",
      trustLevel: "tested",
      lifecycle: "tested",
      capability: {
        id: "github.create_issue",
        version: "0.1.0",
        manifestDigest: "sha256:manifest",
        packageDigest: "sha256:package",
      },
      tests: {
        status: "passing",
        evidenceRef: "registry/developer-tools/github.create_issue/tests/basic.yml",
      },
      review: {
        reviewDigest: "sha256:review",
      },
      advisories: {
        open: 1,
        latest: "GHSA-demo",
        refs: ["GHSA-demo"],
      },
      maintainer: {
        status: "community",
        name: "opencap",
      },
      provenance: {
        manifestDigest: "sha256:manifest",
        packageDigest: "sha256:package",
      },
    });
    expect(card.limitations).toContain("Trust level does not override local policy, consent, outbound policy, or audit.");
    expect(card.disclaimer).toContain("not an authorization decision");
    expect(JSON.stringify(card)).not.toContain("GITHUB_TOKEN");
    expect(JSON.stringify(card)).not.toContain("ghp_secret_value");
  });

  it("generates consent cards from Runtime consent requests", () => {
    const card = createConsentCard({
      consent: {
        consentId: "consent_demo",
        requestId: "req_demo",
        capability: installedCapability.identity,
        actionSummary: "Create a GitHub issue",
        riskSummary: installedCapability.derived.riskSummary,
        egressSummary: {
          targetOrigin: "https://api.github.com",
          dataClasses: ["free_text_unknown"],
          fieldsSent: [{ path: "/title", destination: "body" }],
        },
        policyReason: "Write operation requires confirmation.",
        expiresAt: "2026-05-13T00:05:00.000Z",
      },
      generatedAt: "2026-05-13T00:02:00.000Z",
      cardId: "card_consent_test",
    });

    expect(card).toMatchObject({
      cardKind: "consent",
      consentId: "consent_demo",
      requestId: "req_demo",
      action: "Create a GitHub issue",
      targetOrigin: "https://api.github.com",
      egressDataClasses: ["free_text_unknown"],
      fieldsSent: [{ path: "/title", destination: "body" }],
      policyReason: "Write operation requires confirmation.",
      runtimeGenerated: true,
      expiresAt: "2026-05-13T00:05:00.000Z",
    });
    expect(JSON.stringify(card)).not.toContain("model says");
    expect(JSON.stringify(card)).not.toContain("ghp_secret_value");
  });

  it("generates compatibility cards from compatibility ledger records", () => {
    const record = {
      ledgerVersion: "opencap.ledger_record.v1",
      recordKind: "compatibility",
      recordId: "ledger_compat_test",
      recordedAt: "2026-05-13T00:03:00.000Z",
      profile: { id: "opencap.mcp.tools.v1", version: "v1" },
      host: { id: "claude-desktop", name: "Claude Desktop", version: "1.3561.0" },
      opencapVersion: "0.1.0-dev",
      opencapCommit: "abcdef0",
      capability: { id: "github.create_issue", version: "0.1.0" },
      result: "fail",
      checkedAt: "2026-05-13T00:03:00.000Z",
      checks: [
        { id: "tools_list", result: "pass" },
        { id: "annotations", result: "not-implemented", summary: "Annotations ignored by this Host." },
      ],
      evidenceRef: "docs/生态/host-compatibility-matrix.md",
    } satisfies CompatibilityLedgerRecordV1;

    const card = createCompatibilityCard({
      record,
      generatedAt: "2026-05-13T00:04:00.000Z",
      cardId: "card_compat_test",
    });

    expect(card).toMatchObject({
      cardKind: "compatibility",
      host: { id: "claude-desktop", name: "Claude Desktop", version: "1.3561.0" },
      profile: { id: "opencap.mcp.tools.v1", version: "v1" },
      result: "fail",
      evidenceRef: "docs/生态/host-compatibility-matrix.md",
    });
    expect(card.knownGaps).toEqual(["annotations: Annotations ignored by this Host."]);
    expect(JSON.stringify(card)).not.toContain("compatible with all hosts");
  });

  it("exposes card helpers from the runtime root entrypoint", async () => {
    const runtime = await import("./index.js");

    expect(runtime.CARD_SCHEMA_VERSION).toBe(CARD_SCHEMA_VERSION);
    expect(runtime.createCardId("trust")).toMatch(/^card_trust_[0-9a-f-]{36}$/);
    expect(typeof runtime.createTrustCardFromInstalledCapability).toBe("function");
  });
});
