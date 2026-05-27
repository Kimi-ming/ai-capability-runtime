export type CompositionStepRecoveryOutcome =
  | "not_started"
  | "success"
  | "blocked"
  | "failed_before_request"
  | "failed_after_request"
  | "unknown_after_timeout"
  | "partial";

export type CompositionStepRole = "normal" | "compensation";

export type CompositionStepSideEffectKind =
  | "read"
  | "write"
  | "external_send"
  | "destructive"
  | "financial"
  | "code_execution";

export interface CompositionRecoveryStep {
  stepId: string;
  capabilityId: string;
  required?: boolean;
  role?: CompositionStepRole;
  sideEffectKind: CompositionStepSideEffectKind;
  outcome: CompositionStepRecoveryOutcome;
  requestStarted: boolean;
}

export interface CompositionFailureRecoveryInput {
  compositionId: string;
  steps: CompositionRecoveryStep[];
}

export type CompositionFailureRecoveryOutcome =
  | "completed"
  | "blocked"
  | "failed"
  | "unknown"
  | "partial"
  | "compensating"
  | "manual_review_required";

export type CompositionFailureRecoveryAction =
  | "continue"
  | "stop_after_blocked_step"
  | "reconcile_before_retry_or_compensation"
  | "retry_failed_step_or_manual_compensation"
  | "manual_review_after_compensation_failure";

export interface CompositionFailureRecoveryDecision {
  profile: "opencap.composition.failure_recovery.v1";
  compositionId: string;
  compositionOutcome: CompositionFailureRecoveryOutcome;
  requiredUnknown: boolean;
  stopDownstream: boolean;
  manualReviewRequired: boolean;
  recommendedAction: CompositionFailureRecoveryAction;
  autoCompensationAllowed: false;
  policyEffect: "none";
  evidence: {
    blockingStepId?: string;
    completedStepIds: string[];
    blockedStepIds: string[];
    failedStepIds: string[];
    unknownStepIds: string[];
    compensationStepIds: string[];
  };
}

export function evaluateCompositionFailureRecovery(input: CompositionFailureRecoveryInput): CompositionFailureRecoveryDecision {
  const completedStepIds = input.steps.filter((step) => step.outcome === "success").map((step) => step.stepId);
  const blockedStepIds = input.steps.filter((step) => step.outcome === "blocked").map((step) => step.stepId);
  const failedStepIds = input.steps
    .filter((step) => step.outcome === "failed_before_request" || step.outcome === "failed_after_request" || step.outcome === "partial")
    .map((step) => step.stepId);
  const unknownStepIds = input.steps.filter((step) => step.outcome === "unknown_after_timeout").map((step) => step.stepId);
  const compensationStepIds = input.steps.filter((step) => step.role === "compensation").map((step) => step.stepId);

  const requiredUnknownStep = input.steps.find((step) => step.required !== false && step.outcome === "unknown_after_timeout");
  const compensationFailureStep = input.steps.find((step) =>
    step.role === "compensation"
    && (step.outcome === "failed_before_request" || step.outcome === "failed_after_request" || step.outcome === "unknown_after_timeout" || step.outcome === "partial")
  );
  const blockedStep = input.steps.find((step) => step.required !== false && step.outcome === "blocked");
  const failedStep = input.steps.find((step) =>
    step.required !== false
    && step.role !== "compensation"
    && (step.outcome === "failed_before_request" || step.outcome === "failed_after_request" || step.outcome === "partial")
  );

  const evidence = {
    completedStepIds,
    blockedStepIds,
    failedStepIds,
    unknownStepIds,
    compensationStepIds,
  };

  if (compensationFailureStep !== undefined) {
    return {
      profile: "opencap.composition.failure_recovery.v1",
      compositionId: input.compositionId,
      compositionOutcome: "manual_review_required",
      requiredUnknown: requiredUnknownStep !== undefined,
      stopDownstream: true,
      manualReviewRequired: true,
      recommendedAction: "manual_review_after_compensation_failure",
      autoCompensationAllowed: false,
      policyEffect: "none",
      evidence: {
        ...evidence,
        blockingStepId: compensationFailureStep.stepId,
      },
    };
  }

  if (requiredUnknownStep !== undefined) {
    return {
      profile: "opencap.composition.failure_recovery.v1",
      compositionId: input.compositionId,
      compositionOutcome: "unknown",
      requiredUnknown: true,
      stopDownstream: true,
      manualReviewRequired: true,
      recommendedAction: "reconcile_before_retry_or_compensation",
      autoCompensationAllowed: false,
      policyEffect: "none",
      evidence: {
        ...evidence,
        blockingStepId: requiredUnknownStep.stepId,
      },
    };
  }

  if (blockedStep !== undefined) {
    return {
      profile: "opencap.composition.failure_recovery.v1",
      compositionId: input.compositionId,
      compositionOutcome: "blocked",
      requiredUnknown: false,
      stopDownstream: true,
      manualReviewRequired: false,
      recommendedAction: "stop_after_blocked_step",
      autoCompensationAllowed: false,
      policyEffect: "none",
      evidence: {
        ...evidence,
        blockingStepId: blockedStep.stepId,
      },
    };
  }

  if (failedStep !== undefined) {
    return {
      profile: "opencap.composition.failure_recovery.v1",
      compositionId: input.compositionId,
      compositionOutcome: completedStepIds.length > 0 ? "partial" : "failed",
      requiredUnknown: false,
      stopDownstream: true,
      manualReviewRequired: true,
      recommendedAction: "retry_failed_step_or_manual_compensation",
      autoCompensationAllowed: false,
      policyEffect: "none",
      evidence: {
        ...evidence,
        blockingStepId: failedStep.stepId,
      },
    };
  }

  return {
    profile: "opencap.composition.failure_recovery.v1",
    compositionId: input.compositionId,
    compositionOutcome: "completed",
    requiredUnknown: false,
    stopDownstream: false,
    manualReviewRequired: false,
    recommendedAction: "continue",
    autoCompensationAllowed: false,
    policyEffect: "none",
    evidence: {
      completedStepIds: [],
      blockedStepIds: [],
      failedStepIds: [],
      unknownStepIds: [],
      compensationStepIds: [],
    },
  };
}
