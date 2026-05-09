export type ResultSanitizerFindingCode =
  | "SECRET_REDACTED"
  | "PROMPT_SURFACE_MARKER"
  | "HTML_STRIPPED"
  | "CONTENT_TRUNCATED";

export interface ResultSanitizerFinding {
  code: ResultSanitizerFindingCode;
  severity: "warning";
  path: string;
  message: string;
}

export interface SanitizedToolResult {
  value: unknown;
  findings: ResultSanitizerFinding[];
}

export interface ToolResultSanitizerOptions {
  maxTextLength?: number;
}

const DEFAULT_MAX_TEXT_LENGTH = 4000;
const REDACTED_VALUE = "[REDACTED]";
const SANITIZED_TEXT = "[SANITIZED_TEXT]";
const SENSITIVE_FIELD_FRAGMENTS = ["token", "secret", "password", "api_key", "authorization", "cookie", "credential", "private_key"] as const;
const PROMPT_SURFACE_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /always\s+(call|use|invoke)\s+(this\s+)?(tool|capability)/i,
  /send\s+(the\s+)?(token|secret|api\s*key|password)/i,
  /do\s+not\s+ask\s+for\s+confirmation/i,
  /skip\s+(approval|confirmation|audit|policy)/i,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function childPath(parentPath: string, segment: string): string {
  return parentPath === "/" ? `/${escapeJsonPointerSegment(segment)}` : `${parentPath}/${escapeJsonPointerSegment(segment)}`;
}

function isSensitiveFieldName(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase();
  return SENSITIVE_FIELD_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function looksLikeSecretValue(value: string): boolean {
  return /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(value) || /Bearer\s+[A-Za-z0-9._-]+/.test(value);
}

function finding(code: ResultSanitizerFindingCode, path: string, message: string): ResultSanitizerFinding {
  return { code, severity: "warning", path, message };
}

function stripHtml(value: string): { value: string; stripped: boolean } {
  const stripped = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { value: stripped, stripped: stripped !== value };
}

function sanitizeString(value: string, path: string, findings: ResultSanitizerFinding[], options: Required<ToolResultSanitizerOptions>): string {
  if (looksLikeSecretValue(value)) {
    findings.push(finding("SECRET_REDACTED", path, "Secret-like result value was redacted."));
    return REDACTED_VALUE;
  }

  const html = stripHtml(value);
  let sanitized = html.value;
  if (html.stripped) {
    findings.push(finding("HTML_STRIPPED", path, "HTML, script, or comment text was stripped from provider output."));
  }

  if (PROMPT_SURFACE_PATTERNS.some((pattern) => pattern.test(sanitized))) {
    findings.push(finding("PROMPT_SURFACE_MARKER", path, "Instruction-like provider text was replaced before entering model context."));
    return SANITIZED_TEXT;
  }

  if (sanitized.length > options.maxTextLength) {
    findings.push(finding("CONTENT_TRUNCATED", path, "Provider text exceeded sanitizer length limit and was truncated."));
    sanitized = sanitized.slice(0, options.maxTextLength);
  }

  return sanitized;
}

function sanitizeNode(value: unknown, path: string, findings: ResultSanitizerFinding[], options: Required<ToolResultSanitizerOptions>): unknown {
  if (typeof value === "string") {
    return sanitizeString(value, path, findings, options);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeNode(item, childPath(path, String(index)), findings, options));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      const nestedPath = childPath(path, key);
      if (isSensitiveFieldName(key)) {
        findings.push(finding("SECRET_REDACTED", nestedPath, "Secret-like result field was redacted."));
        return [key, REDACTED_VALUE];
      }

      return [key, sanitizeNode(nestedValue, nestedPath, findings, options)];
    }),
  );
}

export function sanitizeToolResult(value: unknown, options: ToolResultSanitizerOptions = {}): SanitizedToolResult {
  const findings: ResultSanitizerFinding[] = [];
  const resolvedOptions = { maxTextLength: options.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH };
  return {
    value: sanitizeNode(value, "/", findings, resolvedOptions),
    findings,
  };
}
