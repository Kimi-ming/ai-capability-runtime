import { describe, expect, it } from "vitest";
import { validatePolicyYml } from "./policy-validator.js";

describe("policy validator", () => {
  it("returns structured errors for invalid decision and risk values", () => {
    const result = validatePolicyYml(`default: maybe
rules:
  - id: bad-risk
    match:
      risk: harmless
    decision: allow
`, { sourcePath: "policy/bad.yml" });

    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "error",
        code: "POLICY_DECISION_INVALID",
        filePath: "policy/bad.yml",
        fieldPath: "/default",
      }),
      expect.objectContaining({
        severity: "error",
        code: "POLICY_RISK_INVALID",
        filePath: "policy/bad.yml",
        fieldPath: "/rules/0/match/risk",
        ruleId: "bad-risk",
      }),
    ]));
  });

  it("returns warnings for duplicate rule ids and unnamed high-risk allow rules", () => {
    const result = validatePolicyYml(`default: ask
rules:
  - id: allow-write
    match:
      risk: write
    decision: allow
  - id: allow-write
    match:
      risk: read_only
    decision: allow
  - match:
      risk: code_execution
    decision: allow
`, { sourcePath: "opencap.local/policies.yml" });

    expect(result.ok).toBe(true);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "warning",
        code: "POLICY_RULE_ID_DUPLICATE",
        fieldPath: "/rules/1/id",
        ruleId: "allow-write",
      }),
      expect.objectContaining({
        severity: "warning",
        code: "POLICY_HIGH_RISK_ALLOW_UNNAMED",
        fieldPath: "/rules/2",
      }),
    ]));
  });

  it("reports unknown fields with field path and rule id", () => {
    const result = validatePolicyYml(`default: ask
unexpected: true
rules:
  - id: strange
    match:
      risk: write
      regexp: ".*"
    decision: ask
    expires_at: tomorrow
`, { sourcePath: "policy/unknown.yml" });

    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "error",
        code: "POLICY_FIELD_UNKNOWN",
        filePath: "policy/unknown.yml",
        fieldPath: "/unexpected",
      }),
      expect.objectContaining({
        severity: "error",
        code: "POLICY_FIELD_UNKNOWN",
        fieldPath: "/rules/0/match/regexp",
        ruleId: "strange",
      }),
      expect.objectContaining({
        severity: "error",
        code: "POLICY_FIELD_UNKNOWN",
        fieldPath: "/rules/0/expires_at",
        ruleId: "strange",
      }),
    ]));
  });
  it("flags broad allow rules that remove high-risk boundaries", () => {
    const result = validatePolicyYml(`default: ask
rules:
  - id: allow-all-write
    match:
      risk: write
    decision: allow
  - id: allow-all-send
    match:
      risk: external_send
    decision: allow
`, { sourcePath: "opencap.local/policies.yml" });

    expect(result.ok).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "warning",
        code: "POLICY_BROAD_ALLOW_HIGH_RISK",
        fieldPath: "/rules/0",
        ruleId: "allow-all-write",
      }),
      expect.objectContaining({
        severity: "error",
        code: "POLICY_BROAD_ALLOW_REQUIRES_BOUNDARY",
        fieldPath: "/rules/1",
        ruleId: "allow-all-send",
      }),
    ]));
  });

  it("does not flag scoped external send allow rules as broad allow", () => {
    const result = validatePolicyYml(`default: ask
rules:
  - id: allow-specific-slack-send
    match:
      capability_id: slack.send_message
      resource: slack.message
      action: send
      risk: external_send
    decision: allow
`, { sourcePath: "opencap.local/policies.yml" });

    expect(result.ok).toBe(true);
    expect(result.findings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "POLICY_BROAD_ALLOW_REQUIRES_BOUNDARY" }),
    ]));
  });

});
