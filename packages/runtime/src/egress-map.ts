import type { DataEgressDestination } from "./data-egress-policy.js";
import type { InputClassificationResult, InputDataClass } from "./input-classifier.js";

export interface FieldLevelEgressMapEntry {
  path: string;
  destination: DataEgressDestination;
  dataClasses: InputDataClass[];
  redacted: boolean;
}

export interface FieldLevelEgressMap {
  fields: FieldLevelEgressMapEntry[];
}

interface HttpBodyLike {
  type?: unknown;
  fields?: Record<string, unknown>;
}

export interface EgressMapManifestLike {
  id?: unknown;
  execution?: Record<string, unknown>;
}

const TEMPLATE_PATTERN = /{{\s*([A-Za-z0-9_-]+)\s*}}/g;
const FULL_TEMPLATE_PATTERN = /^{{\s*([A-Za-z0-9_-]+)\s*}}$/;
const REDACTED_CLASSES = new Set<InputDataClass>(["secret_like", "source_code", "internal_url", "financial_data"]);

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function inputPath(fieldName: string): string {
  return `/${escapeJsonPointerSegment(fieldName)}`;
}

function dataClassesAtPath(classification: InputClassificationResult, path: string): InputDataClass[] {
  return [...new Set(classification.findings.filter((finding) => finding.path === path).map((finding) => finding.dataClass))].sort();
}

function isRedacted(dataClasses: InputDataClass[]): boolean {
  return dataClasses.some((dataClass) => REDACTED_CLASSES.has(dataClass));
}

function addField(fields: FieldLevelEgressMapEntry[], fieldName: string, destination: DataEgressDestination, classification: InputClassificationResult): void {
  const path = inputPath(fieldName);
  if (fields.some((field) => field.path === path && field.destination === destination)) {
    return;
  }

  const dataClasses = dataClassesAtPath(classification, path);
  fields.push({
    path,
    destination,
    dataClasses,
    redacted: isRedacted(dataClasses),
  });
}

function referencedFields(template: string): Array<{ fieldName: string; index: number }> {
  return [...template.matchAll(TEMPLATE_PATTERN)].map((match) => ({ fieldName: match[1], index: match.index ?? 0 }));
}

function destinationForUrlTemplate(urlTemplate: string, index: number): DataEgressDestination {
  if (FULL_TEMPLATE_PATTERN.test(urlTemplate.trim())) {
    return "url";
  }

  const queryIndex = urlTemplate.indexOf("?");
  return queryIndex >= 0 && index > queryIndex ? "query" : "url";
}

function collectFromTemplate(fields: FieldLevelEgressMapEntry[], value: unknown, destination: DataEgressDestination, classification: InputClassificationResult): void {
  if (typeof value !== "string") {
    return;
  }

  for (const reference of referencedFields(value)) {
    addField(fields, reference.fieldName, destination, classification);
  }
}

export function buildFieldLevelEgressMap(
  manifest: EgressMapManifestLike,
  _input: unknown,
  classification: InputClassificationResult,
): FieldLevelEgressMap {
  const fields: FieldLevelEgressMapEntry[] = [];
  const execution = manifest.execution;

  if (typeof execution?.url === "string") {
    for (const reference of referencedFields(execution.url)) {
      addField(fields, reference.fieldName, destinationForUrlTemplate(execution.url, reference.index), classification);
    }
  }

  const body = execution?.body;
  const bodyFields = typeof body === "object" && body !== null ? (body as HttpBodyLike).fields : undefined;

  for (const value of Object.values(bodyFields ?? {})) {
    collectFromTemplate(fields, value, "body", classification);
  }

  return { fields };
}
