import { describe, expect, it } from "vitest";
import { simulatePolicyDiff } from "./policy-simulation.js";

describe("policy simulation diff", () => {
  it("detects ask to allow and sensitive data egress relaxation without raw input", () => {
    const report = simulatePolicyDiff({
      policyBefore: "default: ask\nrules: []\n",
      policyAfter: `default: ask
rules:
  - id: allow-slack-send
    match:
      risk: external_send
    decision: allow
`,
      scenarios: [
        {
          id: "slack.send_message.pii",
          capabilityId: "slack.send_message",
          resource: "slack.message",
          action: "send",
          risk: "external_send",
          dataClasses: ["pii"],
          targetOrigin: "https://slack.com",
          inputPreview: "customer alice@example.com",
        },
      ],
    });

    expect(report.ok).toBe(false);
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "ask_to_allow",
        severity: "warning",
        scenarioId: "slack.send_message.pii",
        beforeDecision: "ask",
        afterDecision: "allow",
      }),
      expect.objectContaining({
        category: "data_egress_relaxed",
        severity: "error",
        scenarioId: "slack.send_message.pii",
        dataClasses: ["pii"],
      }),
    ]));
    expect(JSON.stringify(report)).not.toContain("alice@example.com");
  });

  it("detects deny to ask relaxations", () => {
    const report = simulatePolicyDiff({
      policyBefore: "default: deny\nrules: []\n",
      policyAfter: "default: ask\nrules: []\n",
      scenarios: [
        {
          id: "github.delete_issue",
          capabilityId: "github.delete_issue",
          resource: "github.issue",
          action: "delete",
          risk: "destructive",
          dataClasses: [],
          targetOrigin: "https://api.github.com",
        },
      ],
    });

    expect(report.findings).toEqual([
      expect.objectContaining({
        category: "deny_to_ask",
        severity: "warning",
        beforeDecision: "deny",
        afterDecision: "ask",
      }),
    ]);
  });

  it("detects new allow from deny and leaves unchanged policies empty", () => {
    const scenario = {
      id: "github.create_issue",
      capabilityId: "github.create_issue",
      resource: "github.issue",
      action: "create",
      risk: "write" as const,
      dataClasses: [],
      targetOrigin: "https://api.github.com",
    };

    const changed = simulatePolicyDiff({
      policyBefore: "default: deny\nrules: []\n",
      policyAfter: "default: allow\nrules: []\n",
      scenarios: [scenario],
    });
    expect(changed.findings).toEqual([
      expect.objectContaining({
        category: "new_allow",
        severity: "warning",
        beforeDecision: "deny",
        afterDecision: "allow",
      }),
    ]);

    const unchanged = simulatePolicyDiff({
      policyBefore: "default: ask\nrules: []\n",
      policyAfter: "default: ask\nrules: []\n",
      scenarios: [scenario],
    });
    expect(unchanged).toMatchObject({ ok: true, findings: [] });
  });
});
