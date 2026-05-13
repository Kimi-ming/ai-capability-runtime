export const CAPABILITY_AUTHORING_LOOP_VERSION = "opencap.capability_authoring_loop.v1" as const;

export type CapabilityAuthoringStageId =
  | "manifest_schema"
  | "package_shape"
  | "model_visible_metadata"
  | "least_privilege_risk"
  | "secret_hygiene"
  | "registry_tests"
  | "dry_run"
  | "review_ready";

export type CapabilityAuthoringBlockTarget =
  | "tool_projection"
  | "runtime_execution"
  | "registry_publish"
  | "review_ready";

export interface CapabilityAuthoringStage {
  id: CapabilityAuthoringStageId;
  order: number;
  title: string;
  summary: string;
  required: boolean;
  blocks: CapabilityAuthoringBlockTarget[];
  commands: string[];
  docs: string[];
}

export interface CapabilityAuthoringProgress {
  completedStageIds: CapabilityAuthoringStageId[];
  unknownStageIds: string[];
  missingRequiredStages: CapabilityAuthoringStage[];
  nextRequiredStage?: CapabilityAuthoringStage;
  readyForReview: boolean;
}

const CAPABILITY_AUTHORING_LINT_ORDER: readonly CapabilityAuthoringStage[] = [
  {
    id: "manifest_schema",
    order: 1,
    title: "Manifest schema validation",
    summary: "Validate manifest.yml against the V1 HTTP Capability schema before any review or projection work.",
    required: true,
    blocks: ["tool_projection", "runtime_execution", "registry_publish", "review_ready"],
    commands: ["opencap validate <capability-path>", "pnpm validate"],
    docs: ["docs/规范/capability-manifest.md", "docs/设计/cli-contract-v1.md"],
  },
  {
    id: "package_shape",
    order: 2,
    title: "Capability package shape",
    summary: "Confirm the registry package contains manifest.yml, README.md, and tests/basic.yml with matching identity.",
    required: true,
    blocks: ["registry_publish", "review_ready"],
    commands: ["pnpm validate"],
    docs: ["docs/设计/capability-package-v1.md", "registry/README.md"],
  },
  {
    id: "model_visible_metadata",
    order: 3,
    title: "Model-visible metadata lint",
    summary: "Lint manifest name, description, and schema descriptions before they can enter tool projection.",
    required: true,
    blocks: ["tool_projection", "registry_publish", "review_ready"],
    commands: ["pnpm validate"],
    docs: ["docs/质量/model-visible-metadata-lint-v1.md", "docs/设计/tool-projection-v1.md"],
  },
  {
    id: "least_privilege_risk",
    order: 4,
    title: "Least-privilege risk review",
    summary: "Lint machine-checkable auth scope risks, then review permissions, risk levels, confirmation modes, and execution behavior.",
    required: true,
    blocks: ["runtime_execution", "registry_publish", "review_ready"],
    commands: ["pnpm validate", "manual review: docs/教程/review-a-capability.md"],
    docs: ["docs/安全/least-privilege-review.md", "docs/教程/review-a-capability.md"],
  },
  {
    id: "secret_hygiene",
    order: 5,
    title: "Secret hygiene review",
    summary: "Ensure secrets are declared through auth env descriptors and never appear in manifest, README, input, or tests.",
    required: true,
    blocks: ["runtime_execution", "registry_publish", "review_ready"],
    commands: ["manual review: docs/教程/review-a-capability.md"],
    docs: ["docs/运营/credential-lifecycle.md", "docs/决策/0027-env-credentials-only-in-v1.md"],
  },
  {
    id: "registry_tests",
    order: 6,
    title: "Registry test validation",
    summary: "Validate tests/basic.yml fixtures before registry publication and use them as future dry-run evidence.",
    required: true,
    blocks: ["registry_publish", "review_ready"],
    commands: ["pnpm validate"],
    docs: ["docs/设计/registry-test-format-v1.md", "registry/README.md"],
  },
  {
    id: "dry_run",
    order: 7,
    title: "Runtime dry-run",
    summary: "Run a non-secret-resolving dry-run to inspect URL/body rendering, permission decision, and egress preview.",
    required: true,
    blocks: ["runtime_execution", "review_ready"],
    commands: ["opencap invoke <capability-id> --dry-run --json"],
    docs: ["docs/设计/cli-contract-v1.md", "docs/设计/http-execution-v1.md"],
  },
  {
    id: "review_ready",
    order: 8,
    title: "Review-ready package",
    summary: "Mark the package ready for maintainer review only after every required lint, review, and dry-run stage passes.",
    required: true,
    blocks: ["registry_publish"],
    commands: ["pnpm validate"],
    docs: ["docs/教程/review-a-capability.md", "docs/社区/capability-review-checklist.md"],
  },
];

function cloneStage(stage: CapabilityAuthoringStage): CapabilityAuthoringStage {
  return {
    ...stage,
    blocks: [...stage.blocks],
    commands: [...stage.commands],
    docs: [...stage.docs],
  };
}

export function getCapabilityAuthoringLintOrder(): CapabilityAuthoringStage[] {
  return CAPABILITY_AUTHORING_LINT_ORDER.map(cloneStage);
}

export function isCapabilityAuthoringStageId(stageId: string): stageId is CapabilityAuthoringStageId {
  return CAPABILITY_AUTHORING_LINT_ORDER.some((stage) => stage.id === stageId);
}

export function getCapabilityAuthoringStage(stageId: CapabilityAuthoringStageId): CapabilityAuthoringStage | undefined {
  const stage = CAPABILITY_AUTHORING_LINT_ORDER.find((candidate) => candidate.id === stageId);
  return stage ? cloneStage(stage) : undefined;
}

export function evaluateCapabilityAuthoringProgress(completedStageIds: readonly string[]): CapabilityAuthoringProgress {
  const knownCompleted = new Set<CapabilityAuthoringStageId>();
  const unknownStageIds: string[] = [];

  for (const stageId of completedStageIds) {
    if (isCapabilityAuthoringStageId(stageId)) {
      knownCompleted.add(stageId);
    } else if (!unknownStageIds.includes(stageId)) {
      unknownStageIds.push(stageId);
    }
  }

  const completed = CAPABILITY_AUTHORING_LINT_ORDER
    .filter((stage) => knownCompleted.has(stage.id))
    .map((stage) => stage.id);
  const missingRequiredStages = CAPABILITY_AUTHORING_LINT_ORDER
    .filter((stage) => stage.required && !knownCompleted.has(stage.id))
    .map(cloneStage);
  const nextRequiredStage = missingRequiredStages[0];

  return {
    completedStageIds: completed,
    unknownStageIds,
    missingRequiredStages,
    nextRequiredStage,
    readyForReview: missingRequiredStages.length === 0 && unknownStageIds.length === 0,
  };
}
