export const CONFORMANCE_SUITE_VERSION = "0.1.0";

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
