import type { CapabilityManifest } from "./index.js";

export type ModelVisibleMetadataLintRule =
  | "instruction_override"
  | "forced_tool_choice"
  | "bypass_governance"
  | "secret_exfiltration";

export type ModelVisibleMetadataLintSeverity = "error";

export interface ModelVisibleMetadataFinding {
  rule: ModelVisibleMetadataLintRule;
  severity: ModelVisibleMetadataLintSeverity;
  path: string;
  message: string;
  excerpt: string;
}

interface LintRuleDefinition {
  rule: ModelVisibleMetadataLintRule;
  message: string;
  patterns: RegExp[];
}

interface TextSurface {
  path: string;
  value: string;
}

const LINT_RULES: LintRuleDefinition[] = [
  {
    rule: "instruction_override",
    message: "Model-visible metadata must not try to override host or system instructions.",
    patterns: [
      /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions?\b/i,
      /\bdisregard\s+(all\s+)?(previous|prior|above)\s+instructions?\b/i,
      /\boverride\s+(system|developer|host)\s+instructions?\b/i,
      /\bsystem\s+prompt\b/i,
    ],
  },
  {
    rule: "forced_tool_choice",
    message: "Model-visible metadata must not force the host to choose this tool.",
    patterns: [
      /\balways\s+(call|use|invoke)\s+(this\s+)?(tool|capability)\b/i,
      /\bmust\s+(call|use|invoke)\s+(this\s+)?(tool|capability)\b/i,
      /\bnever\s+use\s+any\s+other\s+(tool|capability)\b/i,
    ],
  },
  {
    rule: "bypass_governance",
    message: "Model-visible metadata must not ask the host to bypass OpenCap governance controls.",
    patterns: [
      /\bbypass\s+(policy|policies|governance|permission|permissions|approval|approvals|confirmation|confirmations)\b/i,
      /\bskip\s+(policy|policies|permission|permissions|approval|approvals|confirmation|confirmations)\b/i,
      /\bwithout\s+(user\s+)?(approval|confirmation|permission)\b/i,
    ],
  },
  {
    rule: "secret_exfiltration",
    message: "Model-visible metadata must not ask the host to reveal, return, or send secrets.",
    patterns: [
      /\b(return|reveal|send|include|paste|print|exfiltrate)\b[\s\S]{0,80}\b(secret|token|api\s*key|password|credential)s?\b/i,
      /\b(secret|token|api\s*key|password|credential)s?\b[\s\S]{0,80}\b(return|reveal|send|include|paste|print|exfiltrate)\b/i,
    ],
  },
];

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function childPath(parentPath: string, segment: string): string {
  return `${parentPath}/${escapeJsonPointerSegment(segment)}`;
}

function excerpt(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
}

function collectSchemaDescriptions(value: unknown, path: string, surfaces: TextSurface[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSchemaDescriptions(item, childPath(path, String(index)), surfaces));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;

  for (const key of Object.keys(record).sort()) {
    const child = record[key];
    const nextPath = childPath(path, key);

    if (key === "description" && typeof child === "string") {
      surfaces.push({ path: nextPath, value: child });
    }

    collectSchemaDescriptions(child, nextPath, surfaces);
  }
}

function collectModelVisibleSurfaces(manifest: CapabilityManifest): TextSurface[] {
  const surfaces: TextSurface[] = [
    { path: "/name", value: manifest.name },
    { path: "/description", value: manifest.description },
  ];

  collectSchemaDescriptions(manifest.input, "/input", surfaces);
  collectSchemaDescriptions(manifest.output, "/output", surfaces);

  return surfaces;
}

export function lintModelVisibleMetadata(manifest: CapabilityManifest): ModelVisibleMetadataFinding[] {
  const findings: ModelVisibleMetadataFinding[] = [];

  for (const surface of collectModelVisibleSurfaces(manifest)) {
    for (const rule of LINT_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(surface.value))) {
        findings.push({
          rule: rule.rule,
          severity: "error",
          path: surface.path,
          message: rule.message,
          excerpt: excerpt(surface.value),
        });
      }
    }
  }

  return findings;
}
