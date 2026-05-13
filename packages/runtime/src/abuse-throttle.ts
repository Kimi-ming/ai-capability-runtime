import { createHash } from "node:crypto";
import { createGateDecision, type GateDecision, type GateDecisionKind } from "./domain.js";

export type AbuseThrottleDecision = "allow" | "warn" | "ask" | "deny";

export interface AbuseThrottleMatch {
  capabilityId?: string;
  risk?: string;
  channel?: string;
}

export interface AbuseThrottleLimit {
  count: number;
  window: string;
}

export interface AbuseThrottleUsageSnapshot {
  count: number;
  window: string;
  key?: string;
}

export interface AbuseThrottleRule {
  id: string;
  match: AbuseThrottleMatch;
  limit: AbuseThrottleLimit;
  decision: AbuseThrottleDecision;
}

export interface AbuseThrottleContext {
  capabilityId: string;
  risk: string;
  channel: string;
  usage: AbuseThrottleUsageSnapshot;
}

export interface AbuseThrottlePolicy {
  rules?: AbuseThrottleRule[];
}

export interface AbuseThrottleEvidence {
  throttleRuleId?: string;
  throttleDecision?: AbuseThrottleDecision;
  throttleWindow?: string;
  throttleLimit?: number;
  throttleCurrent?: number;
  throttleRemaining?: number;
  throttleKey?: string;
}

function matches(match: AbuseThrottleMatch, context: AbuseThrottleContext): boolean {
  return (
    (match.capabilityId === undefined || match.capabilityId === context.capabilityId) &&
    (match.risk === undefined || match.risk === context.risk) &&
    (match.channel === undefined || match.channel === context.channel)
  );
}

function ruleApplies(rule: AbuseThrottleRule, context: AbuseThrottleContext): boolean {
  return matches(rule.match, context) && rule.limit.window === context.usage.window;
}

function gateDecisionKind(decision: AbuseThrottleDecision): GateDecisionKind {
  if (decision === "deny") {
    return "deny";
  }

  if (decision === "ask") {
    return "ask";
  }

  return "allow";
}

function throttleKey(context: AbuseThrottleContext): string {
  const key = context.usage.key ?? `${context.channel}:${context.capabilityId}:${context.risk}:${context.usage.window}`;
  const digest = createHash("sha256").update(key).digest("hex").slice(0, 16);
  return `throttle_${digest}`;
}

function evidence(rule: AbuseThrottleRule, context: AbuseThrottleContext): AbuseThrottleEvidence {
  return {
    throttleRuleId: rule.id,
    throttleDecision: rule.decision,
    throttleWindow: rule.limit.window,
    throttleLimit: rule.limit.count,
    throttleCurrent: context.usage.count,
    throttleRemaining: Math.max(0, rule.limit.count - context.usage.count),
    throttleKey: throttleKey(context),
  };
}

function throttleGate(rule: AbuseThrottleRule, context: AbuseThrottleContext): GateDecision<AbuseThrottleEvidence> {
  const decision = gateDecisionKind(rule.decision);

  return createGateDecision({
    gateId: "abuse_throttle",
    stage: "pre_secret",
    decision,
    reasonCode: `ABUSE_THROTTLE_${rule.decision.toUpperCase()}`,
    summary: `Abuse throttle rule ${rule.id} returned ${rule.decision}.`,
    evidence: evidence(rule, context),
  });
}

export function defaultExternalSendAbuseThrottleRule(): AbuseThrottleRule {
  return {
    id: "external-send-default-burst",
    match: { risk: "external_send" },
    limit: { count: 3, window: "1m" },
    decision: "ask",
  };
}

export function evaluateAbuseThrottleGate(
  context: AbuseThrottleContext,
  policy: AbuseThrottlePolicy,
): GateDecision<AbuseThrottleEvidence> {
  const matchedRules = policy.rules?.filter((rule) => ruleApplies(rule, context)) ?? [];
  const exceededRule = matchedRules.find((rule) => rule.decision !== "warn" && context.usage.count >= rule.limit.count);
  if (exceededRule !== undefined) {
    return throttleGate(exceededRule, context);
  }

  const warningRule = matchedRules.find((rule) => rule.decision === "warn");
  if (warningRule !== undefined) {
    return throttleGate(warningRule, context);
  }

  return createGateDecision({
    gateId: "abuse_throttle",
    stage: "pre_secret",
    decision: "allow",
    reasonCode: "ABUSE_THROTTLE_ALLOW",
    summary: "No local abuse throttle rule blocked execution.",
    evidence: {},
  });
}
