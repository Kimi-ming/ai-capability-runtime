import { describe, expect, it } from "vitest";
import { gateDecisionSemantics } from "./domain.js";
import {
  defaultExternalSendAbuseThrottleRule,
  evaluateAbuseThrottleGate,
} from "./abuse-throttle.js";

describe("local abuse throttle gate", () => {
  it("denies repeated local calls before secret resolution or execution", () => {
    const decision = evaluateAbuseThrottleGate(
      {
        capabilityId: "github.create_issue",
        risk: "write",
        channel: "mcp",
        usage: { count: 12, window: "1m", key: "local_user@example.com raw input provider-secret" },
      },
      {
        rules: [{
          id: "github-issue-loop",
          match: { capabilityId: "github.create_issue" },
          limit: { count: 10, window: "1m" },
          decision: "deny",
        }],
      },
    );

    expect(decision).toMatchObject({
      gateId: "abuse_throttle",
      stage: "pre_secret",
      decision: "deny",
      reasonCode: "ABUSE_THROTTLE_DENY",
      evidence: {
        throttleRuleId: "github-issue-loop",
        throttleDecision: "deny",
        throttleWindow: "1m",
        throttleLimit: 10,
        throttleCurrent: 12,
        throttleRemaining: 0,
      },
    });
    expect(decision.evidence.throttleKey).toMatch(/^throttle_[a-f0-9]{16}$/);
    expect(gateDecisionSemantics(decision)).toMatchObject({
      secretResolutionAllowed: false,
      executionAllowed: false,
      terminalStatus: "denied",
    });
    expect(JSON.stringify(decision)).not.toContain("provider-secret");
    expect(JSON.stringify(decision)).not.toContain("raw input");
    expect(JSON.stringify(decision)).not.toContain("local_user@example.com");
  });

  it("maps ask throttles to confirmation required without executing", () => {
    const decision = evaluateAbuseThrottleGate(
      {
        capabilityId: "slack.send_message",
        risk: "external_send",
        channel: "cli",
        usage: { count: 5, window: "10m" },
      },
      {
        rules: [{
          id: "slack-send-burst",
          match: { risk: "external_send" },
          limit: { count: 5, window: "10m" },
          decision: "ask",
        }],
      },
    );

    expect(decision).toMatchObject({
      gateId: "abuse_throttle",
      stage: "pre_secret",
      decision: "ask",
      reasonCode: "ABUSE_THROTTLE_ASK",
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      confirmationRequired: true,
      executionAllowed: false,
      terminalStatus: "confirmation_required",
    });
  });

  it("keeps warn throttles as allow decisions with evidence", () => {
    const decision = evaluateAbuseThrottleGate(
      {
        capabilityId: "github.search_repo",
        risk: "read_only",
        channel: "api",
        usage: { count: 8, window: "1m" },
      },
      {
        rules: [{
          id: "read-spike-warning",
          match: { risk: "read_only" },
          limit: { count: 10, window: "1m" },
          decision: "warn",
        }],
      },
    );

    expect(decision).toMatchObject({
      decision: "allow",
      reasonCode: "ABUSE_THROTTLE_WARN",
      evidence: {
        throttleRuleId: "read-spike-warning",
        throttleDecision: "warn",
        throttleRemaining: 2,
      },
    });
    expect(gateDecisionSemantics(decision)).toMatchObject({
      secretResolutionAllowed: true,
      executionAllowed: true,
    });
  });

  it("provides a conservative default rule for external send capabilities", () => {
    expect(defaultExternalSendAbuseThrottleRule()).toEqual({
      id: "external-send-default-burst",
      match: { risk: "external_send" },
      limit: { count: 3, window: "1m" },
      decision: "ask",
    });
  });
});
