import { createHash } from "node:crypto";

export const OPENAPI_OPERATION_SELECTION_SCHEMA_VERSION = "opencap.openapi_operation_selection.v1" as const;

export type OpenApiOperationSelectionRisk =
  | "read_only"
  | "write"
  | "external_send"
  | "destructive"
  | "financial"
  | "code_execution"
  | "secret_access";

export type OpenApiOperationSelectionFindingCode =
  | "OPENAPI_DOCUMENT_NOT_OBJECT"
  | "OPENAPI_PATHS_MISSING"
  | "OPENAPI_SELECTION_PATH_INVALID"
  | "OPENAPI_SELECTION_METHOD_INVALID"
  | "OPENAPI_OPERATION_NOT_FOUND"
  | "OPENAPI_REVIEWER_HINT_INVALID"
  | "OPENAPI_SERVER_MISSING"
  | "OPENAPI_SERVER_NOT_HTTPS"
  | "OPENAPI_OPERATION_DEPRECATED"
  | "OPENAPI_REQUEST_BODY_SCHEMA_REVIEW_REQUIRED"
  | "OPENAPI_RESPONSE_SCHEMA_REVIEW_REQUIRED"
  | "OPENAPI_RESPONSE_SCHEMA_MISSING"
  | "OPENAPI_SECURITY_COOKIE_UNSUPPORTED"
  | "OPENAPI_SECURITY_SCHEME_UNSUPPORTED"
  | "OPENAPI_SENSITIVE_TEXT_REDACTED";

export interface OpenApiOperationReviewerHints {
  capabilityId: string;
  category: string;
  risk: OpenApiOperationSelectionRisk;
}

export interface OpenApiOperationSelectionInput {
  method: string;
  path: string;
  reviewerHints: OpenApiOperationReviewerHints;
}

export interface BuildOpenApiOperationSelectionReportOptions {
  generatedAt?: string;
  documentRef?: string;
}

export interface OpenApiOperationSelectionFinding {
  code: OpenApiOperationSelectionFindingCode;
  severity: "blocker" | "warning";
  path: string;
  message: string;
}

export interface OpenApiSelectedOperationEvidence {
  found: boolean;
  method: string;
  path: string;
  operationId?: string;
  deprecated: boolean;
}

export interface OpenApiSelectedServerEvidence {
  source: "operation" | "path" | "root" | "none";
  url?: string;
  https: boolean;
}

export interface OpenApiSecurityRequirementEvidence {
  scheme: string;
  type?: string;
  in?: string;
  supported: boolean;
}

export interface OpenApiSecurityEvidence {
  requirements: OpenApiSecurityRequirementEvidence[];
  unsupportedSchemes: string[];
  cookieSchemes: string[];
}

export interface OpenApiOperationSelectionReport {
  schemaVersion: typeof OPENAPI_OPERATION_SELECTION_SCHEMA_VERSION;
  generatedAt: string;
  documentRef?: string;
  selectionDigest: string;
  selectedOperation: OpenApiSelectedOperationEvidence;
  reviewerHints: OpenApiOperationReviewerHints;
  server: OpenApiSelectedServerEvidence;
  security: OpenApiSecurityEvidence;
  blockers: OpenApiOperationSelectionFinding[];
  warnings: OpenApiOperationSelectionFinding[];
  blockerCount: number;
  warningCount: number;
  findingCount: number;
  manifestGenerated: false;
  runtimeExecution: false;
  policyEffect: "none";
}

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);
const RISK_LEVELS = new Set<OpenApiOperationSelectionRisk>([
  "read_only",
  "write",
  "external_send",
  "destructive",
  "financial",
  "code_execution",
  "secret_access",
]);
const CAPABILITY_ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const SENSITIVE_TEXT_PATTERNS = [
  /authorization\s*:/i,
  /bearer\s+[A-Za-z0-9._-]+/i,
  /\b[A-Z0-9_]*(TOKEN|SECRET|PASSWORD|API_KEY)[A-Z0-9_]*\b/i,
  /sk-[A-Za-z0-9_-]+/i,
  /\/Users\/[^\s"'<>]*/i,
  /opencap\.local/i,
  /\.(sqlite|db|log)\b/i,
  /provider raw response/i,
  /raw body/i,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function containsSensitiveText(value: string): boolean {
  return SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(value));
}

function redactSensitiveText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return containsSensitiveText(value) ? "[REDACTED]" : value;
}

function addFinding(
  blockers: OpenApiOperationSelectionFinding[],
  warnings: OpenApiOperationSelectionFinding[],
  severity: "blocker" | "warning",
  code: OpenApiOperationSelectionFindingCode,
  path: string,
  message: string,
): void {
  const finding = { code, severity, path, message };
  if (severity === "blocker") {
    blockers.push(finding);
  } else {
    warnings.push(finding);
  }
}

function scanSensitiveText(
  value: unknown,
  path: string,
  blockers: OpenApiOperationSelectionFinding[],
  warnings: OpenApiOperationSelectionFinding[],
): void {
  if (typeof value === "string") {
    if (containsSensitiveText(value)) {
      addFinding(
        blockers,
        warnings,
        "blocker",
        "OPENAPI_SENSITIVE_TEXT_REDACTED",
        path,
        "OpenAPI input contains sensitive text that was redacted from the selection report.",
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanSensitiveText(entry, `${path}/${index}`, blockers, warnings));
    return;
  }

  if (isRecord(value)) {
    for (const [key, entry] of Object.entries(value)) {
      scanSensitiveText(entry, `${path}/${key}`, blockers, warnings);
    }
  }
}

function normalizeMethod(method: string): string {
  return method.toLowerCase();
}

function selectedPathRecord(document: Record<string, unknown>, path: string): Record<string, unknown> | undefined {
  if (!isRecord(document.paths)) {
    return undefined;
  }
  const pathItem = document.paths[path];
  return isRecord(pathItem) ? pathItem : undefined;
}

function selectedOperationRecord(pathItem: Record<string, unknown> | undefined, method: string): Record<string, unknown> | undefined {
  if (!pathItem) {
    return undefined;
  }
  const operation = pathItem[method];
  return isRecord(operation) ? operation : undefined;
}

function firstServer(
  document: Record<string, unknown>,
  pathItem: Record<string, unknown> | undefined,
  operation: Record<string, unknown> | undefined,
): { source: OpenApiSelectedServerEvidence["source"]; server?: Record<string, unknown> } {
  const candidates: Array<[OpenApiSelectedServerEvidence["source"], unknown]> = [
    ["operation", operation?.servers],
    ["path", pathItem?.servers],
    ["root", document.servers],
  ];

  for (const [source, servers] of candidates) {
    if (Array.isArray(servers) && isRecord(servers[0])) {
      return { source, server: servers[0] };
    }
  }

  return { source: "none" };
}

function buildServerEvidence(
  document: Record<string, unknown>,
  pathItem: Record<string, unknown> | undefined,
  operation: Record<string, unknown> | undefined,
  blockers: OpenApiOperationSelectionFinding[],
  warnings: OpenApiOperationSelectionFinding[],
): OpenApiSelectedServerEvidence {
  const { source, server } = firstServer(document, pathItem, operation);
  const rawUrl = stringValue(server?.url);

  if (!rawUrl) {
    addFinding(blockers, warnings, "warning", "OPENAPI_SERVER_MISSING", "/servers", "Selected operation has no explicit server URL to review.");
    return { source, https: false };
  }

  const https = /^https:\/\//i.test(rawUrl);
  if (!https) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_SERVER_NOT_HTTPS", "/servers/0/url", "Selected operation server must use https.");
  }

  return {
    source,
    url: redactSensitiveText(rawUrl),
    https,
  };
}

function securitySchemes(document: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(document.components) || !isRecord(document.components.securitySchemes)) {
    return {};
  }
  return document.components.securitySchemes;
}

function securityRequirements(
  document: Record<string, unknown>,
  operation: Record<string, unknown> | undefined,
): unknown[] {
  if (Array.isArray(operation?.security)) {
    return operation.security;
  }
  if (Array.isArray(document.security)) {
    return document.security;
  }
  return [];
}

function addUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function isSupportedSecurityScheme(scheme: Record<string, unknown>): boolean {
  const type = stringValue(scheme.type);
  if (type === "http") {
    return stringValue(scheme.scheme)?.toLowerCase() === "bearer";
  }
  if (type === "apiKey") {
    return stringValue(scheme.in) === "header";
  }
  return false;
}

function buildSecurityEvidence(
  document: Record<string, unknown>,
  operation: Record<string, unknown> | undefined,
  blockers: OpenApiOperationSelectionFinding[],
  warnings: OpenApiOperationSelectionFinding[],
): OpenApiSecurityEvidence {
  const schemes = securitySchemes(document);
  const requirements: OpenApiSecurityRequirementEvidence[] = [];
  const unsupportedSchemes: string[] = [];
  const cookieSchemes: string[] = [];

  for (const requirement of securityRequirements(document, operation)) {
    if (!isRecord(requirement)) {
      continue;
    }

    for (const schemeName of Object.keys(requirement)) {
      const scheme = schemes[schemeName];
      const schemeRecord = isRecord(scheme) ? scheme : {};
      const type = stringValue(schemeRecord.type);
      const inValue = stringValue(schemeRecord.in);
      const supported = isSupportedSecurityScheme(schemeRecord);

      requirements.push({
        scheme: redactSensitiveText(schemeName) ?? "[REDACTED]",
        type: redactSensitiveText(type),
        in: redactSensitiveText(inValue),
        supported,
      });

      if (type === "apiKey" && inValue === "cookie") {
        addUnique(cookieSchemes, schemeName);
        addFinding(
          blockers,
          warnings,
          "blocker",
          "OPENAPI_SECURITY_COOKIE_UNSUPPORTED",
          `/components/securitySchemes/${schemeName}`,
          "Cookie-based OpenAPI security schemes are not supported by the V1 authoring boundary.",
        );
      }

      if (!supported) {
        addUnique(unsupportedSchemes, schemeName);
        addFinding(
          blockers,
          warnings,
          "blocker",
          "OPENAPI_SECURITY_SCHEME_UNSUPPORTED",
          `/components/securitySchemes/${schemeName}`,
          "Selected operation uses a security scheme that cannot be mapped directly to V1 env-only HTTP auth.",
        );
      }
    }
  }

  return {
    requirements,
    unsupportedSchemes: unsupportedSchemes.map((scheme) => redactSensitiveText(scheme) ?? "[REDACTED]"),
    cookieSchemes: cookieSchemes.map((scheme) => redactSensitiveText(scheme) ?? "[REDACTED]"),
  };
}

function responsesRecord(operation: Record<string, unknown>): Record<string, unknown> | undefined {
  return isRecord(operation.responses) ? operation.responses : undefined;
}

function responseHasSchema(response: unknown): boolean {
  if (!isRecord(response) || !isRecord(response.content)) {
    return false;
  }

  return Object.values(response.content).some((content) => isRecord(content) && isRecord(content.schema));
}

function addSchemaWarnings(
  operation: Record<string, unknown> | undefined,
  blockers: OpenApiOperationSelectionFinding[],
  warnings: OpenApiOperationSelectionFinding[],
): void {
  if (!operation) {
    return;
  }

  if (operation.requestBody !== undefined) {
    addFinding(
      blockers,
      warnings,
      "warning",
      "OPENAPI_REQUEST_BODY_SCHEMA_REVIEW_REQUIRED",
      "/paths/selected/requestBody",
      "Selected operation requestBody must be reviewed before creating a Capability input schema.",
    );
  }

  const responses = responsesRecord(operation);
  const responseEntries = responses ? Object.entries(responses) : [];
  const hasSuccessResponseSchema = responseEntries.some(([status, response]) =>
    (/^2\d\d$/.test(status) || status === "default") && responseHasSchema(response)
  );

  if (hasSuccessResponseSchema) {
    addFinding(
      blockers,
      warnings,
      "warning",
      "OPENAPI_RESPONSE_SCHEMA_REVIEW_REQUIRED",
      "/paths/selected/responses",
      "Selected operation response schema must be reviewed before creating a Capability output schema.",
    );
    return;
  }

  addFinding(
    blockers,
    warnings,
    "warning",
    "OPENAPI_RESPONSE_SCHEMA_MISSING",
    "/paths/selected/responses",
    "Selected operation has no 2xx/default response schema to map into a Capability output schema.",
  );
}

function sanitizeReviewerHints(hints: OpenApiOperationReviewerHints): OpenApiOperationReviewerHints {
  return {
    capabilityId: redactSensitiveText(hints.capabilityId) ?? "[REDACTED]",
    category: redactSensitiveText(hints.category) ?? "[REDACTED]",
    risk: hints.risk,
  };
}

function validateReviewerHints(
  hints: OpenApiOperationReviewerHints,
  blockers: OpenApiOperationSelectionFinding[],
  warnings: OpenApiOperationSelectionFinding[],
): void {
  if (!CAPABILITY_ID_PATTERN.test(hints.capabilityId)) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_REVIEWER_HINT_INVALID", "/reviewerHints/capabilityId", "Reviewer capability id hint must be a stable OpenCap capability id.");
  }
  if (!hints.category || containsSensitiveText(hints.category)) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_REVIEWER_HINT_INVALID", "/reviewerHints/category", "Reviewer category hint must be present and non-sensitive.");
  }
  if (!RISK_LEVELS.has(hints.risk)) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_REVIEWER_HINT_INVALID", "/reviewerHints/risk", "Reviewer risk hint must use an OpenCap risk level.");
  }
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

export function buildOpenApiOperationSelectionReport(
  document: unknown,
  selection: OpenApiOperationSelectionInput,
  options: BuildOpenApiOperationSelectionReportOptions = {},
): OpenApiOperationSelectionReport {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const blockers: OpenApiOperationSelectionFinding[] = [];
  const warnings: OpenApiOperationSelectionFinding[] = [];
  const method = normalizeMethod(selection.method);
  const selectedPath = redactSensitiveText(selection.path) ?? "[REDACTED]";

  scanSensitiveText(document, "$", blockers, warnings);
  scanSensitiveText(selection, "$selection", blockers, warnings);
  scanSensitiveText(options.documentRef, "$documentRef", blockers, warnings);

  if (!HTTP_METHODS.has(method)) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_SELECTION_METHOD_INVALID", "/method", "OpenAPI operation selection must use a supported HTTP method.");
  }
  if (!selection.path.startsWith("/")) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_SELECTION_PATH_INVALID", "/path", "OpenAPI operation selection path must start with /.");
  }
  validateReviewerHints(selection.reviewerHints, blockers, warnings);

  const documentRecord = isRecord(document) ? document : undefined;
  if (!documentRecord) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_DOCUMENT_NOT_OBJECT", "$", "OpenAPI input must be an object.");
  }
  if (documentRecord && !isRecord(documentRecord.paths)) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_PATHS_MISSING", "/paths", "OpenAPI input must contain a paths object.");
  }

  const pathItem = documentRecord ? selectedPathRecord(documentRecord, selection.path) : undefined;
  const operation = selectedOperationRecord(pathItem, method);
  if (!operation) {
    addFinding(blockers, warnings, "blocker", "OPENAPI_OPERATION_NOT_FOUND", "/paths", "Explicit OpenAPI path and method selection did not match an operation.");
  }

  const operationId = redactSensitiveText(stringValue(operation?.operationId));
  const deprecated = operation?.deprecated === true;
  if (deprecated) {
    addFinding(blockers, warnings, "warning", "OPENAPI_OPERATION_DEPRECATED", "/paths/selected/deprecated", "Selected OpenAPI operation is deprecated and needs reviewer approval.");
  }

  const server = documentRecord
    ? buildServerEvidence(documentRecord, pathItem, operation, blockers, warnings)
    : { source: "none" as const, https: false };
  const security = documentRecord
    ? buildSecurityEvidence(documentRecord, operation, blockers, warnings)
    : { requirements: [], unsupportedSchemes: [], cookieSchemes: [] };
  addSchemaWarnings(operation, blockers, warnings);

  return {
    schemaVersion: OPENAPI_OPERATION_SELECTION_SCHEMA_VERSION,
    generatedAt,
    documentRef: redactSensitiveText(options.documentRef),
    selectionDigest: sha256({
      method,
      path: selection.path,
      reviewerHints: selection.reviewerHints,
      operationId,
      generatedAt,
    }),
    selectedOperation: {
      found: operation !== undefined,
      method,
      path: selectedPath,
      operationId,
      deprecated,
    },
    reviewerHints: sanitizeReviewerHints(selection.reviewerHints),
    server,
    security,
    blockers,
    warnings,
    blockerCount: blockers.length,
    warningCount: warnings.length,
    findingCount: blockers.length + warnings.length,
    manifestGenerated: false,
    runtimeExecution: false,
    policyEffect: "none",
  };
}
