import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import YAML from "yaml";

export const CONFORMANCE_SUITE_VERSION = "0.1.0";
export const CONFORMANCE_SUMMARY_SCHEMA_VERSION = "opencap.conformance_summary.v1" as const;

export const CORE_CONFORMANCE_GROUPS = [
  "C-MAN",
  "C-PKG",
  "C-RUN",
  "C-POL",
  "C-PG",
  "C-CON",
  "C-AUD",
  "C-HTTP",
  "C-MCP",
  "C-REG",
  "C-SEC",
] as const;

export interface ConformanceRecordValidationIssue {
  fieldPath: string;
  keyword: string;
  message: string;
}

export interface BuildConformanceSummaryOptions {
  generatedAt?: string;
}

export interface ConformanceRecordSummary {
  path: string;
  subject: {
    type: string;
    name: string;
    version: string;
  };
  profile: string;
  suiteVersion: string;
  result: "pass" | "fail";
  checks: {
    total: number;
    pass: number;
    fail: number;
    skipped: number;
  };
  artifacts: {
    count: number;
    paths: string[];
  };
}

export interface InvalidConformanceRecordSummary {
  path: string;
  issues: ConformanceRecordValidationIssue[];
}

export interface ConformanceSummary {
  schemaVersion: typeof CONFORMANCE_SUMMARY_SCHEMA_VERSION;
  suiteVersion: typeof CONFORMANCE_SUITE_VERSION;
  recordRoot: string;
  generatedAt: string;
  recordCount: number;
  passedRecords: number;
  failedRecords: number;
  invalidRecords: number;
  profiles: string[];
  records: ConformanceRecordSummary[];
  invalid: InvalidConformanceRecordSummary[];
  policyEffect: "none";
}

const SUBJECT_TYPES = new Set(["runtime", "capability_package", "host_profile", "registry"]);
const CHECK_STATUSES = new Set(["pass", "fail", "skipped"]);

function issue(fieldPath: string, keyword: string, message: string): ConformanceRecordValidationIssue {
  return {
    fieldPath,
    keyword: `conformance-record:${keyword}`,
    message,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafeArtifactPath(value: string): boolean {
  return !value.startsWith("/") && !value.split(/[\\/]/).includes("..");
}

export function validateConformanceRecord(record: unknown): ConformanceRecordValidationIssue[] {
  const issues: ConformanceRecordValidationIssue[] = [];

  if (!isRecord(record)) {
    return [issue("/", "invalid_record", "Conformance record must be an object.")];
  }

  const subject = record.subject;
  if (!isRecord(subject)) {
    issues.push(issue("/subject", "missing_subject", "Conformance record must declare a subject object."));
  } else {
    if (!nonEmptyString(subject.type) || !SUBJECT_TYPES.has(subject.type)) {
      issues.push(issue("/subject/type", "invalid_subject_type", "Conformance subject type must be runtime, capability_package, host_profile, or registry."));
    }
    if (!nonEmptyString(subject.name)) {
      issues.push(issue("/subject/name", "missing_subject_name", "Conformance subject must include a name."));
    }
    if (!nonEmptyString(subject.version)) {
      issues.push(issue("/subject/version", "missing_subject_version", "Conformance subject must include a version."));
    }
  }

  if (!nonEmptyString(record.profile) || !/^opencap\.[a-z0-9_]+\.v\d+$/.test(record.profile)) {
    issues.push(issue("/profile", "invalid_profile", "Conformance profile must use opencap.<profile>.vN format."));
  }

  if (!nonEmptyString(record.suite_version)) {
    issues.push(issue("/suite_version", "missing_suite_version", "Conformance record must include suite_version."));
  }

  if (record.result !== "pass" && record.result !== "fail") {
    issues.push(issue("/result", "invalid_result", "Conformance result must be pass or fail."));
  }

  const checks = record.checks;
  if (!isRecord(checks) || Object.keys(checks).length === 0) {
    issues.push(issue("/checks", "missing_checks", "Conformance record must include at least one check."));
  } else {
    for (const [checkId, status] of Object.entries(checks)) {
      if (!CHECK_STATUSES.has(String(status))) {
        issues.push(issue(`/checks/${checkId}`, "invalid_check_status", "Conformance check status must be pass, fail, or skipped."));
      }
    }
  }

  const artifacts = record.artifacts;
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    issues.push(issue("/artifacts", "missing_artifacts", "Conformance record must include at least one artifact."));
  } else {
    artifacts.forEach((artifact, index) => {
      if (!isRecord(artifact) || !nonEmptyString(artifact.path)) {
        issues.push(issue(`/artifacts/${index}/path`, "missing_artifact_path", "Conformance artifact must include a path."));
        return;
      }
      if (!isSafeArtifactPath(artifact.path)) {
        issues.push(issue(`/artifacts/${index}/path`, "unsafe_artifact_path", "Conformance artifact paths must be repository-relative and must not traverse upward."));
      }
    });
  }

  return issues;
}

function toSummaryPath(root: string, path: string): string {
  return relative(root, path).replaceAll("\\", "/");
}

async function conformanceRecordPaths(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry): Promise<string[]> => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      return conformanceRecordPaths(path);
    }
    if (entry.isFile() && (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml"))) {
      return [path];
    }
    return [];
  }));

  return paths.flat().sort((left, right) => toSummaryPath(root, left).localeCompare(toSummaryPath(root, right)));
}

function countChecks(checks: Record<string, unknown>): ConformanceRecordSummary["checks"] {
  const statuses = Object.values(checks).map(String);
  return {
    total: statuses.length,
    pass: statuses.filter((status) => status === "pass").length,
    fail: statuses.filter((status) => status === "fail").length,
    skipped: statuses.filter((status) => status === "skipped").length,
  };
}

function summarizeConformanceRecord(path: string, record: Record<string, unknown>): ConformanceRecordSummary {
  const subject = record.subject as Record<string, unknown>;
  const artifacts = record.artifacts as Array<{ path: string }>;
  return {
    path,
    subject: {
      type: String(subject.type),
      name: String(subject.name),
      version: String(subject.version),
    },
    profile: String(record.profile),
    suiteVersion: String(record.suite_version),
    result: record.result as "pass" | "fail",
    checks: countChecks(record.checks as Record<string, unknown>),
    artifacts: {
      count: artifacts.length,
      paths: artifacts.map((artifact) => artifact.path),
    },
  };
}

export async function buildConformanceSummary(
  recordsRoot: string,
  options: BuildConformanceSummaryOptions = {},
): Promise<ConformanceSummary> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const paths = await conformanceRecordPaths(recordsRoot);
  const records: ConformanceRecordSummary[] = [];
  const invalid: InvalidConformanceRecordSummary[] = [];

  for (const path of paths) {
    const summaryPath = toSummaryPath(recordsRoot, path);
    let parsed: unknown;
    try {
      parsed = YAML.parse(await readFile(path, "utf8"));
    } catch (error) {
      invalid.push({
        path: summaryPath,
        issues: [issue("/", "invalid_yaml", error instanceof Error ? error.message : "Conformance record YAML could not be parsed.")],
      });
      continue;
    }

    const issues = validateConformanceRecord(parsed);
    if (issues.length > 0) {
      invalid.push({ path: summaryPath, issues });
      continue;
    }

    records.push(summarizeConformanceRecord(summaryPath, parsed as Record<string, unknown>));
  }

  return {
    schemaVersion: CONFORMANCE_SUMMARY_SCHEMA_VERSION,
    suiteVersion: CONFORMANCE_SUITE_VERSION,
    recordRoot: recordsRoot,
    generatedAt,
    recordCount: paths.length,
    passedRecords: records.filter((record) => record.result === "pass").length,
    failedRecords: records.filter((record) => record.result === "fail").length,
    invalidRecords: invalid.length,
    profiles: [...new Set(records.map((record) => record.profile))].sort(),
    records,
    invalid,
    policyEffect: "none",
  };
}
