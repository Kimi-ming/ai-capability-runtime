import { readFile } from "node:fs/promises";
import YAML from "yaml";

export type NpmPublishWorkflowLintRule =
  | "NPM_PUBLISH_WORKFLOW_PARSE_ERROR"
  | "NPM_PUBLISH_WORKFLOW_MANUAL_DISPATCH_REQUIRED"
  | "NPM_PUBLISH_WORKFLOW_AUTOMATIC_TRIGGER"
  | "NPM_PUBLISH_WORKFLOW_DRY_RUN_DEFAULT_REQUIRED"
  | "NPM_PUBLISH_WORKFLOW_PACKAGE_NOT_ALLOWED"
  | "NPM_PUBLISH_WORKFLOW_CONTENTS_READ_REQUIRED"
  | "NPM_PUBLISH_WORKFLOW_ID_TOKEN_REQUIRED"
  | "NPM_PUBLISH_WORKFLOW_FORBIDS_NPM_TOKEN"
  | "NPM_PUBLISH_WORKFLOW_REAL_PUBLISH_FORBIDDEN";

export interface NpmPublishWorkflowFinding {
  code: NpmPublishWorkflowLintRule;
  severity: "error";
  message: string;
  path?: string;
}

export interface NpmPublishWorkflowLintResult {
  ok: boolean;
  findings: NpmPublishWorkflowFinding[];
}

const ALLOWED_NPM_PUBLISH_PACKAGES = new Set(["@opencap/spec", "@opencap/cli"]);
const AUTOMATIC_TRIGGER_NAMES = new Set(["push", "pull_request", "pull_request_target", "schedule"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function addFinding(findings: NpmPublishWorkflowFinding[], finding: NpmPublishWorkflowFinding): void {
  if (!findings.some((existing) => existing.code === finding.code && existing.path === finding.path)) {
    findings.push(finding);
  }
}

function workflowTriggers(root: Record<string, unknown>): unknown {
  return root.on;
}

function hasManualDispatch(onConfig: unknown): boolean {
  if (typeof onConfig === "string") {
    return onConfig === "workflow_dispatch";
  }

  if (Array.isArray(onConfig)) {
    return onConfig.includes("workflow_dispatch");
  }

  return isRecord(onConfig) && isRecord(onConfig.workflow_dispatch);
}

function hasAutomaticTrigger(onConfig: unknown): boolean {
  if (typeof onConfig === "string") {
    return AUTOMATIC_TRIGGER_NAMES.has(onConfig);
  }

  if (Array.isArray(onConfig)) {
    return onConfig.some((trigger) => typeof trigger === "string" && AUTOMATIC_TRIGGER_NAMES.has(trigger));
  }

  if (!isRecord(onConfig)) {
    return false;
  }

  return Object.keys(onConfig).some((trigger) => trigger !== "workflow_dispatch" && AUTOMATIC_TRIGGER_NAMES.has(trigger));
}

function workflowDispatchInputs(onConfig: unknown): Record<string, unknown> | undefined {
  if (!isRecord(onConfig) || !isRecord(onConfig.workflow_dispatch)) {
    return undefined;
  }

  const inputs = onConfig.workflow_dispatch.inputs;
  return isRecord(inputs) ? inputs : undefined;
}

function inputDefaultIsTrue(input: unknown): boolean {
  if (!isRecord(input)) {
    return false;
  }

  return input.default === true || input.default === "true";
}

function lintTriggers(root: Record<string, unknown>, findings: NpmPublishWorkflowFinding[]): void {
  const onConfig = workflowTriggers(root);

  if (!hasManualDispatch(onConfig)) {
    addFinding(findings, {
      code: "NPM_PUBLISH_WORKFLOW_MANUAL_DISPATCH_REQUIRED",
      severity: "error",
      path: "/on/workflow_dispatch",
      message: "npm publish workflow must be manually dispatched only.",
    });
  }

  if (hasAutomaticTrigger(onConfig)) {
    addFinding(findings, {
      code: "NPM_PUBLISH_WORKFLOW_AUTOMATIC_TRIGGER",
      severity: "error",
      path: "/on",
      message: "npm publish workflow must not run from push, pull_request, pull_request_target, or schedule triggers.",
    });
  }

  const inputs = workflowDispatchInputs(onConfig);
  if (!inputDefaultIsTrue(inputs?.dry_run)) {
    addFinding(findings, {
      code: "NPM_PUBLISH_WORKFLOW_DRY_RUN_DEFAULT_REQUIRED",
      severity: "error",
      path: "/on/workflow_dispatch/inputs/dry_run/default",
      message: "npm publish workflow dry_run input must default to true.",
    });
  }

  const packageOptions = isRecord(inputs?.package) ? asStringArray(inputs.package.options) : [];
  if (packageOptions.length === 0 || packageOptions.some((packageName) => !ALLOWED_NPM_PUBLISH_PACKAGES.has(packageName))) {
    addFinding(findings, {
      code: "NPM_PUBLISH_WORKFLOW_PACKAGE_NOT_ALLOWED",
      severity: "error",
      path: "/on/workflow_dispatch/inputs/package/options",
      message: "npm publish workflow package choices must stay limited to approved alpha publish candidates.",
    });
  }
}

function lintPermissions(root: Record<string, unknown>, findings: NpmPublishWorkflowFinding[]): void {
  const permissions = root.permissions;

  if (!isRecord(permissions) || permissions.contents !== "read") {
    addFinding(findings, {
      code: "NPM_PUBLISH_WORKFLOW_CONTENTS_READ_REQUIRED",
      severity: "error",
      path: "/permissions/contents",
      message: "npm publish workflow permissions.contents must be read.",
    });
  }

  if (!isRecord(permissions) || permissions["id-token"] !== "write") {
    addFinding(findings, {
      code: "NPM_PUBLISH_WORKFLOW_ID_TOKEN_REQUIRED",
      severity: "error",
      path: "/permissions/id-token",
      message: "npm publish workflow must request id-token: write for npm trusted publishing provenance.",
    });
  }
}

function runSteps(root: Record<string, unknown>): Array<{ path: string; run: string }> {
  const jobs = root.jobs;
  if (!isRecord(jobs)) {
    return [];
  }

  const steps: Array<{ path: string; run: string }> = [];

  Object.entries(jobs).forEach(([jobName, job], jobIndex) => {
    if (!isRecord(job) || !Array.isArray(job.steps)) {
      return;
    }

    job.steps.forEach((step, stepIndex) => {
      if (isRecord(step) && typeof step.run === "string") {
        steps.push({
          path: `/jobs/${jobName || jobIndex}/steps/${stepIndex}/run`,
          run: step.run,
        });
      }
    });
  });

  return steps;
}

function runLineStartsPublishCommand(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:pnpm|npm)\b/.test(trimmed) && /\bpublish\b/.test(trimmed);
}

function lintPublishSteps(root: Record<string, unknown>, findings: NpmPublishWorkflowFinding[]): void {
  runSteps(root).forEach((step) => {
    if (/NPM_TOKEN|secrets\.NPM_TOKEN/.test(step.run)) {
      addFinding(findings, {
        code: "NPM_PUBLISH_WORKFLOW_FORBIDS_NPM_TOKEN",
        severity: "error",
        path: step.path,
        message: "npm publish workflow must not use NPM_TOKEN or secrets.NPM_TOKEN.",
      });
    }

    if (step.run.split(/\r?\n/).some((line) => runLineStartsPublishCommand(line) && !/\s--dry-run(?:\s|$)/.test(line))) {
      addFinding(findings, {
        code: "NPM_PUBLISH_WORKFLOW_REAL_PUBLISH_FORBIDDEN",
        severity: "error",
        path: step.path,
        message: "npm publish workflow must keep publish commands in --dry-run mode.",
      });
    }
  });
}

export function lintNpmPublishWorkflow(workflowYaml: string): NpmPublishWorkflowLintResult {
  const findings: NpmPublishWorkflowFinding[] = [];
  let parsed: unknown;

  try {
    parsed = YAML.parse(workflowYaml);
  } catch (error) {
    return {
      ok: false,
      findings: [
        {
          code: "NPM_PUBLISH_WORKFLOW_PARSE_ERROR",
          severity: "error",
          path: "/",
          message: error instanceof Error ? error.message : "npm publish workflow YAML could not be parsed.",
        },
      ],
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      findings: [
        {
          code: "NPM_PUBLISH_WORKFLOW_PARSE_ERROR",
          severity: "error",
          path: "/",
          message: "npm publish workflow YAML must be an object.",
        },
      ],
    };
  }

  lintTriggers(parsed, findings);
  lintPermissions(parsed, findings);
  lintPublishSteps(parsed, findings);

  return {
    ok: findings.length === 0,
    findings,
  };
}

export async function lintNpmPublishWorkflowFile(filePath: string): Promise<NpmPublishWorkflowLintResult> {
  return lintNpmPublishWorkflow(await readFile(filePath, "utf8"));
}
