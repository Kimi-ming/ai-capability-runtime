export type InputDataClass = "secret_like" | "pii" | "source_code" | "internal_url" | "financial_data" | "free_text_unknown";
export type InputClassificationConfidence = "low" | "medium" | "high";
export type InputClassificationAction = "allow" | "ask" | "deny" | "redact";

export interface InputClassificationFinding {
  path: string;
  dataClass: InputDataClass;
  confidence: InputClassificationConfidence;
  action: InputClassificationAction;
  reason: string;
}

export interface InputClassificationResult {
  findings: InputClassificationFinding[];
  dataClasses: InputDataClass[];
  redactedPreview: unknown;
}

export interface InputClassificationOptions {
  freeTextUnknownThreshold?: number;
}

const SECRET_FIELD_FRAGMENTS = ["token", "api_key", "apikey", "secret", "password", "cookie", "authorization", "credential", "private_key", "refresh_token"] as const;
const PII_FIELD_FRAGMENTS = ["email", "phone", "ssn"] as const;
const DEFAULT_FREE_TEXT_UNKNOWN_THRESHOLD = 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function childPath(parentPath: string, segment: string): string {
  return parentPath === "/" ? `/${escapeJsonPointerSegment(segment)}` : `${parentPath}/${escapeJsonPointerSegment(segment)}`;
}

function normalizedField(path: string): string {
  const last = path.split("/").pop() ?? "";
  return last.replace(/~1/g, "/").replace(/~0/g, "~").toLowerCase();
}

function hasFieldFragment(path: string, fragments: readonly string[]): boolean {
  const field = normalizedField(path);
  return fragments.some((fragment) => field.includes(fragment));
}

function looksLikeSecret(value: string): boolean {
  return (
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(value) ||
    /\bBearer\s+[A-Za-z0-9._-]+\b/.test(value) ||
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/.test(value) ||
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/.test(value)
  );
}

function looksLikeEmail(value: string): boolean {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value);
}

function looksLikePhone(value: string): boolean {
  return /(?:\+?\d[\s().-]*){10,}/.test(value);
}

function looksLikeFinancialData(value: string): boolean {
  return /\b(?:\d[ -]?){13,19}\b/.test(value) || /\b(iban|routing number|account number)\b/i.test(value);
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  return first === 10 || first === 127 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168) || (first === 169 && second === 254);
}

function looksLikeInternalUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "metadata.google.internal" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isPrivateIpv4(hostname)
  );
}

function looksLikeSourceOrConfig(value: string): boolean {
  return (
    /^diff --git /m.test(value) ||
    /^@@\s+-\d+/m.test(value) ||
    /^\s*at\s+.+\(.+:\d+:\d+\)/m.test(value) ||
    /Traceback \(most recent call last\)/.test(value) ||
    /^(?:[A-Z_][A-Z0-9_]*_)?(?:TOKEN|SECRET|PASSWORD|API_KEY|DATABASE_URL)\s*=.+/m.test(value)
  );
}

function isLargeFreeText(value: string, threshold: number): boolean {
  return value.length >= threshold && /\s/.test(value);
}

function addFinding(findings: InputClassificationFinding[], finding: InputClassificationFinding): void {
  if (findings.some((existing) => existing.path === finding.path && existing.dataClass === finding.dataClass)) {
    return;
  }
  findings.push(finding);
}

function classifyString(path: string, value: string, findings: InputClassificationFinding[], options: Required<InputClassificationOptions>): void {
  if (hasFieldFragment(path, SECRET_FIELD_FRAGMENTS) || looksLikeSecret(value)) {
    addFinding(findings, { path, dataClass: "secret_like", confidence: "high", action: "deny", reason: "Field name or value looks like a secret." });
  }

  if (hasFieldFragment(path, PII_FIELD_FRAGMENTS) || looksLikeEmail(value) || looksLikePhone(value)) {
    addFinding(findings, { path, dataClass: "pii", confidence: "medium", action: "ask", reason: "Field name or value looks like personal information." });
  }

  if (looksLikeInternalUrl(value)) {
    addFinding(findings, { path, dataClass: "internal_url", confidence: "high", action: "deny", reason: "Value points to localhost, private network, link-local, metadata, or internal host." });
  }

  if (looksLikeSourceOrConfig(value)) {
    addFinding(findings, { path, dataClass: "source_code", confidence: "high", action: "ask", reason: "Value looks like source code, config, diff, stack trace, or env file." });
    if (/^(?:[A-Z_][A-Z0-9_]*_)?(?:TOKEN|SECRET|PASSWORD|API_KEY)\s*=.+/m.test(value)) {
      addFinding(findings, { path, dataClass: "secret_like", confidence: "high", action: "deny", reason: "Config text contains secret-like assignment." });
    }
  }

  if (looksLikeFinancialData(value)) {
    addFinding(findings, { path, dataClass: "financial_data", confidence: "medium", action: "ask", reason: "Value looks like financial account or payment data." });
  }

  const hasClassAtPath = findings.some((finding) => finding.path === path);
  if (!hasClassAtPath && isLargeFreeText(value, options.freeTextUnknownThreshold)) {
    addFinding(findings, { path, dataClass: "free_text_unknown", confidence: "low", action: "ask", reason: "Large free text could not be classified more specifically." });
  }
}

function walk(value: unknown, path: string, findings: InputClassificationFinding[], options: Required<InputClassificationOptions>): void {
  if (typeof value === "string") {
    classifyString(path, value, findings, options);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, childPath(path, String(index)), findings, options));
    return;
  }

  if (isRecord(value)) {
    for (const [key, nestedValue] of Object.entries(value)) {
      walk(nestedValue, childPath(path, key), findings, options);
    }
  }
}

function classesAtPath(findings: InputClassificationFinding[], path: string): InputDataClass[] {
  return [...new Set(findings.filter((finding) => finding.path === path).map((finding) => finding.dataClass))].sort();
}

function redactedPreview(value: unknown, path: string, findings: InputClassificationFinding[]): unknown {
  const dataClasses = classesAtPath(findings, path);
  if (dataClasses.includes("secret_like") || dataClasses.includes("source_code") || dataClasses.includes("internal_url") || dataClasses.includes("financial_data")) {
    return `[redacted:${dataClasses.join(",")}]`;
  }

  if (typeof value === "string" && dataClasses.includes("pii")) {
    return value.replace(/(^.).*(@.*$)/, "$1***$2").replace(/\d(?=\d{2})/g, "*");
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactedPreview(item, childPath(path, String(index)), findings));
  }

  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, redactedPreview(nestedValue, childPath(path, key), findings)]));
  }

  return value;
}

export function classifyInput(input: unknown, options: InputClassificationOptions = {}): InputClassificationResult {
  const resolvedOptions = {
    freeTextUnknownThreshold: options.freeTextUnknownThreshold ?? DEFAULT_FREE_TEXT_UNKNOWN_THRESHOLD,
  };
  const findings: InputClassificationFinding[] = [];
  walk(input, "/", findings, resolvedOptions);

  return {
    findings,
    dataClasses: [...new Set(findings.map((finding) => finding.dataClass))].sort(),
    redactedPreview: redactedPreview(input, "/", findings),
  };
}
