export const POLICY_TRACE_VERSION = "opencap.policy_trace.v1";

export type PolicyDecisionTraceGate = "data_egress" | "risk_policy" | "quota" | "budget" | "outbound" | "lifecycle";
export type PolicyDecisionTraceDecision = "allow" | "ask" | "deny" | "redact" | "block";

export interface PolicyDecisionTraceV1 {
  traceVersion: typeof POLICY_TRACE_VERSION;
  policySetId: string;
  policyRevision: string;
  gate: PolicyDecisionTraceGate;
  decision: PolicyDecisionTraceDecision;
  matchedRuleId?: string;
  defaultDecisionUsed: boolean;
  evaluatedFacts: string[];
  reasonCode: string;
  humanReadableSummary: string;
  secretResolutionAllowed: boolean;
  executionAllowed: boolean;
}
