import type { FieldLevelEgressMap, FieldLevelEgressMapEntry } from "./egress-map.js";
import type { InputClassificationResult, InputDataClass } from "./input-classifier.js";

export interface RedactedEgressPreviewOptions {
  targetOrigin: string;
  map: FieldLevelEgressMap;
  minimizedInput: unknown;
  classification: InputClassificationResult;
  maxTextLength?: number;
}

export interface RedactedEgressPreview {
  targetOrigin: string;
  dataClasses: InputDataClass[];
  fieldsSent: FieldLevelEgressMapEntry[];
  redactedInput: unknown;
}

const DEFAULT_MAX_TEXT_LENGTH = 240;
const HARD_REDACT_CLASSES = new Set<InputDataClass>(["secret_like", "source_code", "internal_url", "financial_data"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function childPath(parentPath: string, segment: string): string {
  return parentPath === "/" ? `/${escapeJsonPointerSegment(segment)}` : `${parentPath}/${escapeJsonPointerSegment(segment)}`;
}

function classesAtPath(classification: InputClassificationResult, path: string): InputDataClass[] {
  return [...new Set(classification.findings.filter((finding) => finding.path === path).map((finding) => finding.dataClass))].sort();
}

function maskPii(value: string): string {
  return value.replace(/(^.).*(@.*$)/, "$1***$2").replace(/\d(?=\d{2})/g, "*");
}

function summarizeText(value: string, maxTextLength: number): string {
  if (value.length <= maxTextLength) {
    return value;
  }

  return `[summary:${value.length} chars] ${value.slice(0, maxTextLength)}`;
}

function redactValue(value: unknown, path: string, classification: InputClassificationResult, maxTextLength: number): unknown {
  const dataClasses = classesAtPath(classification, path);
  if (dataClasses.some((dataClass) => HARD_REDACT_CLASSES.has(dataClass))) {
    return `[redacted:${dataClasses.join(",")}]`;
  }

  if (typeof value === "string" && dataClasses.includes("pii")) {
    return maskPii(value);
  }

  if (typeof value === "string" && dataClasses.includes("free_text_unknown")) {
    return summarizeText(value, maxTextLength);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(item, childPath(path, String(index)), classification, maxTextLength));
  }

  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, redactValue(nestedValue, childPath(path, key), classification, maxTextLength)]));
  }

  return value;
}

function previewField(field: FieldLevelEgressMapEntry): FieldLevelEgressMapEntry {
  return {
    ...field,
    redacted: field.redacted || field.dataClasses.some((dataClass) => dataClass === "pii" || dataClass === "free_text_unknown"),
  };
}

export function buildRedactedEgressPreview(options: RedactedEgressPreviewOptions): RedactedEgressPreview {
  const fieldsSent = options.map.fields.map(previewField);
  return {
    targetOrigin: options.targetOrigin,
    dataClasses: [...new Set(fieldsSent.flatMap((field) => field.dataClasses))].sort(),
    fieldsSent,
    redactedInput: redactValue(options.minimizedInput, "/", options.classification, options.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH),
  };
}
