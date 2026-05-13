import { describe, expect, it } from "vitest";
import { defaultPolicySet, evaluatePolicy, parsePolicyYml } from "./index.js";

describe("policy score boundary", () => {
  it("does not let a high quality score change default ask into allow", () => {
    const result = evaluatePolicy(defaultPolicySet(), {
      capabilityId: "github.create_issue",
      permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
      trustLevel: "verified",
      qualityScore: 100,
    });

    expect(result).toMatchObject({
      decision: "ask",
      reason: "Default policy decision: ask.",
    });
    expect(result.decisionTrace).toMatchObject({
      decision: "ask",
      secretResolutionAllowed: true,
      executionAllowed: false,
    });
    expect(result.decisionTrace.evaluatedFacts).toEqual(expect.arrayContaining([
      "trust_level=verified",
      "quality_score=100",
    ]));
  });

  it("does not let a high quality score override explicit deny rules", () => {
    const policy = parsePolicyYml(`default: ask
rules:
  - id: deny-write
    match:
      risk: write
    decision: deny
    reason: Writes are blocked by local policy.
`);

    const result = evaluatePolicy(policy, {
      capabilityId: "github.create_issue",
      permissions: [{ resource: "github.issue", action: "create", risk: "write" }],
      trustLevel: "verified",
      qualityScore: 100,
    });

    expect(result).toMatchObject({
      decision: "deny",
      matchedRuleId: "deny-write",
      reason: "Writes are blocked by local policy.",
    });
    expect(result.decisionTrace).toMatchObject({
      decision: "deny",
      secretResolutionAllowed: false,
      executionAllowed: false,
    });
    expect(result.decisionTrace.evaluatedFacts).toContain("quality_score=100");
  });
});
