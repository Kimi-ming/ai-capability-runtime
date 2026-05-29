import { RELEASE_EVIDENCE_SCHEMA_VERSION, type ReleaseEvidenceDecision } from "./release-evidence.js";

export const RELEASE_ARTIFACT_VALIDATION_SCHEMA_VERSION = "opencap.release_artifact_validation.v1" as const;

export type ReleaseEvidenceArtifactFindingCode =
  | "RELEASE_ARTIFACT_NOT_OBJECT"
  | "RELEASE_ARTIFACT_SCHEMA_VERSION_INVALID"
  | "RELEASE_ARTIFACT_FIELD_MISSING"
  | "RELEASE_ARTIFACT_FIELD_INVALID"
  | "RELEASE_ARTIFACT_TIMESTAMP_INVALID"
  | "RELEASE_ARTIFACT_DATE_INVALID"
  | "RELEASE_ARTIFACT_DECISION_INVALID"
  | "RELEASE_ARTIFACT_COMMAND_STATUS_INVALID"
  | "RELEASE_ARTIFACT_COMPONENT_STATUS_INVALID"
  | "RELEASE_ARTIFACT_POLICY_EFFECT_INVALID"
  | "RELEASE_ARTIFACT_DECISION_INCONSISTENT"
  | "RELEASE_ARTIFACT_DECISION_INCOMPLETE"
  | "RELEASE_ARTIFACT_SENSITIVE_TEXT";

export interface ReleaseEvidenceArtifactFinding {
  code: ReleaseEvidenceArtifactFindingCode;
  path: string;
  message: string;
}

export interface ReleaseEvidenceArtifactValidationReport {
  schemaVersion: typeof RELEASE_ARTIFACT_VALIDATION_SCHEMA_VERSION;
  artifactSchemaVersion: string | null;
  valid: boolean;
  decision: ReleaseEvidenceDecision | null;
  blockerCount: number;
  findings: ReleaseEvidenceArtifactFinding[];
  policyEffect: "none";
}

const RELEASE_EVIDENCE_DECISIONS = new Set(["candidate", "block-release-tag", "release"]);
const RELEASE_EVIDENCE_COMMAND_STATUSES = new Set(["pass", "fail", "not-run"]);
const RELEASE_EVIDENCE_COMPONENT_STATUSES = new Set(["pass", "fail", "not-run"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addFinding(
  findings: ReleaseEvidenceArtifactFinding[],
  code: ReleaseEvidenceArtifactFindingCode,
  path: string,
  message: string,
): void {
  findings.push({ code, path, message });
}

function stringField(
  artifact: Record<string, unknown>,
  key: string,
  findings: ReleaseEvidenceArtifactFinding[],
): string | undefined {
  const value = artifact[key];
  if (typeof value !== "string" || value.length === 0) {
    addFinding(findings, "RELEASE_ARTIFACT_FIELD_MISSING", `/${key}`, `Release evidence artifact must include non-empty ${key}.`);
    return undefined;
  }

  return value;
}

function validateDate(value: string | undefined, findings: ReleaseEvidenceArtifactFinding[]): void {
  if (value === undefined) {
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    addFinding(findings, "RELEASE_ARTIFACT_DATE_INVALID", "/date", "Release evidence artifact date must use YYYY-MM-DD.");
    return;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    addFinding(findings, "RELEASE_ARTIFACT_DATE_INVALID", "/date", "Release evidence artifact date must be a valid UTC date.");
  }
}

function validateGeneratedAt(value: string | undefined, findings: ReleaseEvidenceArtifactFinding[]): void {
  if (value === undefined) {
    return;
  }

  if (Number.isNaN(new Date(value).getTime())) {
    addFinding(findings, "RELEASE_ARTIFACT_TIMESTAMP_INVALID", "/generatedAt", "Release evidence artifact generatedAt must be a valid ISO timestamp.");
  }
}

function validateCommands(value: unknown, findings: ReleaseEvidenceArtifactFinding[]): string[] {
  if (!isRecord(value)) {
    addFinding(findings, "RELEASE_ARTIFACT_FIELD_INVALID", "/commands", "Release evidence artifact commands must be an object.");
    return [];
  }

  const statuses: string[] = [];
  for (const [command, status] of Object.entries(value)) {
    if (typeof status !== "string" || !RELEASE_EVIDENCE_COMMAND_STATUSES.has(status)) {
      addFinding(findings, "RELEASE_ARTIFACT_COMMAND_STATUS_INVALID", `/commands/${command}`, "Release evidence command status must be pass, fail, or not-run.");
      continue;
    }
    statuses.push(status);
  }

  return statuses;
}

function validateComponentStatus(value: unknown, path: string, findings: ReleaseEvidenceArtifactFinding[]): string | undefined {
  if (!isRecord(value)) {
    addFinding(findings, "RELEASE_ARTIFACT_FIELD_INVALID", path, "Release evidence component must be an object.");
    return undefined;
  }

  if (typeof value.status !== "string" || !RELEASE_EVIDENCE_COMPONENT_STATUSES.has(value.status)) {
    addFinding(findings, "RELEASE_ARTIFACT_COMPONENT_STATUS_INVALID", `${path}/status`, "Release evidence component status must be pass, fail, or not-run.");
    return undefined;
  }

  return value.status;
}

function validateComponents(value: unknown, findings: ReleaseEvidenceArtifactFinding[]): string[] {
  if (!isRecord(value)) {
    addFinding(findings, "RELEASE_ARTIFACT_FIELD_INVALID", "/components", "Release evidence artifact components must be an object.");
    return [];
  }

  const statuses = [
    validateComponentStatus(value.registry, "/components/registry", findings),
    validateComponentStatus(value.conformance, "/components/conformance", findings),
  ].filter((status): status is string => status !== undefined);

  if (!Array.isArray(value.packages)) {
    addFinding(findings, "RELEASE_ARTIFACT_FIELD_INVALID", "/components/packages", "Release evidence artifact packages component must be an array.");
    return statuses;
  }

  value.packages.forEach((packageComponent, index) => {
    const status = validateComponentStatus(packageComponent, `/components/packages/${index}`, findings);
    if (status !== undefined) {
      statuses.push(status);
    }
  });

  return statuses;
}

function validateBlockers(value: unknown, findings: ReleaseEvidenceArtifactFinding[]): number {
  if (!Array.isArray(value)) {
    addFinding(findings, "RELEASE_ARTIFACT_FIELD_INVALID", "/blockers", "Release evidence artifact blockers must be an array.");
    return 0;
  }

  value.forEach((blocker, index) => {
    if (!isRecord(blocker) || typeof blocker.code !== "string" || typeof blocker.source !== "string" || typeof blocker.message !== "string") {
      addFinding(findings, "RELEASE_ARTIFACT_FIELD_INVALID", `/blockers/${index}`, "Release evidence blockers must include code, source, and message strings.");
    }
  });

  return value.length;
}

function validateKnownGaps(value: unknown, findings: ReleaseEvidenceArtifactFinding[]): void {
  if (!Array.isArray(value) || value.some((gap) => typeof gap !== "string")) {
    addFinding(findings, "RELEASE_ARTIFACT_FIELD_INVALID", "/knownGaps", "Release evidence artifact knownGaps must be an array of strings.");
  }
}

function hasSensitiveArtifactText(artifact: unknown): boolean {
  const text = JSON.stringify(artifact);
  return [
    /\b[A-Z0-9_]*(TOKEN|SECRET|PASSWORD|AUTH|COOKIE|KEY)[A-Z0-9_]*\b/i,
    /\bAuthorization\b/i,
    /\bCookie\b/i,
    /\/Users\/[^\s"',}]+/i,
    /opencap\.local/i,
    /\.(sqlite|sqlite3|db|log)\b/i,
    /provider raw response/i,
    /provider[_-]?raw[_-]?response/i,
  ].some((pattern) => pattern.test(text));
}

function validateDecisionConsistency(
  decision: ReleaseEvidenceDecision | null,
  blockerCount: number,
  commandStatuses: string[],
  componentStatuses: string[],
  findings: ReleaseEvidenceArtifactFinding[],
): void {
  if (decision === null) {
    return;
  }

  const hasFailedEvidence = commandStatuses.includes("fail") || componentStatuses.includes("fail");
  if (decision !== "block-release-tag" && (blockerCount > 0 || hasFailedEvidence)) {
    addFinding(
      findings,
      "RELEASE_ARTIFACT_DECISION_INCONSISTENT",
      "/decision",
      "Release evidence artifact decision must block release tagging when blockers or failed evidence exist.",
    );
  }

  const hasIncompleteEvidence = commandStatuses.includes("not-run") || componentStatuses.includes("not-run");
  if (decision === "release" && hasIncompleteEvidence) {
    addFinding(
      findings,
      "RELEASE_ARTIFACT_DECISION_INCOMPLETE",
      "/decision",
      "Release evidence artifact decision cannot be release while required local evidence is not-run.",
    );
  }
}

export function validateReleaseEvidenceArtifact(artifact: unknown): ReleaseEvidenceArtifactValidationReport {
  const findings: ReleaseEvidenceArtifactFinding[] = [];

  if (!isRecord(artifact)) {
    addFinding(findings, "RELEASE_ARTIFACT_NOT_OBJECT", "", "Release evidence artifact must be a JSON object.");
    return {
      schemaVersion: RELEASE_ARTIFACT_VALIDATION_SCHEMA_VERSION,
      artifactSchemaVersion: null,
      valid: false,
      decision: null,
      blockerCount: 0,
      findings,
      policyEffect: "none",
    };
  }

  const artifactSchemaVersion = typeof artifact.schemaVersion === "string" ? artifact.schemaVersion : null;
  if (artifact.schemaVersion !== RELEASE_EVIDENCE_SCHEMA_VERSION) {
    addFinding(findings, "RELEASE_ARTIFACT_SCHEMA_VERSION_INVALID", "/schemaVersion", "Release evidence artifact schemaVersion must be opencap.release_evidence.v1.");
  }

  stringField(artifact, "target", findings);
  stringField(artifact, "commit", findings);
  const date = stringField(artifact, "date", findings);
  const generatedAt = stringField(artifact, "generatedAt", findings);
  validateDate(date, findings);
  validateGeneratedAt(generatedAt, findings);

  const decision = typeof artifact.decision === "string" && RELEASE_EVIDENCE_DECISIONS.has(artifact.decision)
    ? artifact.decision as ReleaseEvidenceDecision
    : null;
  if (decision === null) {
    addFinding(findings, "RELEASE_ARTIFACT_DECISION_INVALID", "/decision", "Release evidence artifact decision must be candidate, block-release-tag, or release.");
  }

  const commandStatuses = validateCommands(artifact.commands, findings);
  const componentStatuses = validateComponents(artifact.components, findings);
  const blockerCount = validateBlockers(artifact.blockers, findings);
  validateKnownGaps(artifact.knownGaps, findings);
  validateDecisionConsistency(decision, blockerCount, commandStatuses, componentStatuses, findings);

  if (artifact.policyEffect !== "none") {
    addFinding(findings, "RELEASE_ARTIFACT_POLICY_EFFECT_INVALID", "/policyEffect", "Release evidence artifact policyEffect must be none.");
  }

  if (hasSensitiveArtifactText(artifact)) {
    addFinding(findings, "RELEASE_ARTIFACT_SENSITIVE_TEXT", "", "Release evidence artifact contains sensitive or local-only text.");
  }

  return {
    schemaVersion: RELEASE_ARTIFACT_VALIDATION_SCHEMA_VERSION,
    artifactSchemaVersion,
    valid: findings.length === 0,
    decision,
    blockerCount,
    findings,
    policyEffect: "none",
  };
}
