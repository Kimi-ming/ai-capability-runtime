import { describe, expect, it } from "vitest";
import { evaluateCompositionFailureRecovery } from "./index.js";

describe("composition failure recovery", () => {
  it("requires reconcile before retry or compensation when a required write step is unknown", () => {
    const recovery = evaluateCompositionFailureRecovery({
      compositionId: "cmp_release_update",
      steps: [
        {
          stepId: "create_issue",
          capabilityId: "github.create_issue",
          required: true,
          sideEffectKind: "write",
          outcome: "unknown_after_timeout",
          requestStarted: true,
        },
        {
          stepId: "send_slack",
          capabilityId: "slack.send_message",
          required: true,
          sideEffectKind: "external_send",
          outcome: "not_started",
          requestStarted: false,
        },
      ],
    });

    expect(recovery).toMatchObject({
      profile: "opencap.composition.failure_recovery.v1",
      compositionId: "cmp_release_update",
      compositionOutcome: "unknown",
      requiredUnknown: true,
      stopDownstream: true,
      manualReviewRequired: true,
      recommendedAction: "reconcile_before_retry_or_compensation",
      autoCompensationAllowed: false,
      policyEffect: "none",
      evidence: {
        blockingStepId: "create_issue",
        unknownStepIds: ["create_issue"],
        completedStepIds: [],
      },
    });
  });

  it("marks a required blocked step as blocked and stops downstream execution", () => {
    const recovery = evaluateCompositionFailureRecovery({
      compositionId: "cmp_blocked",
      steps: [
        {
          stepId: "create_issue",
          capabilityId: "github.create_issue",
          required: true,
          sideEffectKind: "write",
          outcome: "blocked",
          requestStarted: false,
        },
        {
          stepId: "send_slack",
          capabilityId: "slack.send_message",
          required: true,
          sideEffectKind: "external_send",
          outcome: "not_started",
          requestStarted: false,
        },
      ],
    });

    expect(recovery).toMatchObject({
      compositionOutcome: "blocked",
      stopDownstream: true,
      manualReviewRequired: false,
      recommendedAction: "stop_after_blocked_step",
      autoCompensationAllowed: false,
      evidence: {
        blockingStepId: "create_issue",
        blockedStepIds: ["create_issue"],
      },
    });
  });

  it("keeps completed work and suggests retry or manual compensation for failed external send", () => {
    const recovery = evaluateCompositionFailureRecovery({
      compositionId: "cmp_partial",
      steps: [
        {
          stepId: "create_issue",
          capabilityId: "github.create_issue",
          required: true,
          sideEffectKind: "write",
          outcome: "success",
          requestStarted: true,
        },
        {
          stepId: "send_slack",
          capabilityId: "slack.send_message",
          required: true,
          sideEffectKind: "external_send",
          outcome: "failed_after_request",
          requestStarted: true,
        },
      ],
    });

    expect(recovery).toMatchObject({
      compositionOutcome: "partial",
      requiredUnknown: false,
      stopDownstream: true,
      manualReviewRequired: true,
      recommendedAction: "retry_failed_step_or_manual_compensation",
      autoCompensationAllowed: false,
      evidence: {
        blockingStepId: "send_slack",
        completedStepIds: ["create_issue"],
        failedStepIds: ["send_slack"],
      },
    });
  });

  it("requires manual review when a compensation step fails", () => {
    const recovery = evaluateCompositionFailureRecovery({
      compositionId: "cmp_compensation_failed",
      steps: [
        {
          stepId: "create_issue",
          capabilityId: "github.create_issue",
          required: true,
          sideEffectKind: "write",
          outcome: "success",
          requestStarted: true,
        },
        {
          stepId: "close_issue",
          capabilityId: "github.close_issue",
          required: true,
          role: "compensation",
          sideEffectKind: "destructive",
          outcome: "failed_after_request",
          requestStarted: true,
        },
      ],
    });

    expect(recovery).toMatchObject({
      compositionOutcome: "manual_review_required",
      stopDownstream: true,
      manualReviewRequired: true,
      recommendedAction: "manual_review_after_compensation_failure",
      autoCompensationAllowed: false,
      evidence: {
        blockingStepId: "close_issue",
        compensationStepIds: ["close_issue"],
        failedStepIds: ["close_issue"],
      },
    });
  });
});
