import { createHash } from "node:crypto";

export type SecretResolveMode = "execute" | "dry_run";
export type ResolvedCredentialType = "none" | "bearer" | "header";
export type SecretCredentialSource = "env";
export type SecretCredentialApplyMode = "none" | "authorization_header" | "named_header";

export interface SecretExecutionTarget {
  method: string;
  urlOrigin: string;
  provider?: string;
}

export interface SecretResolverAuth {
  type?: unknown;
  provider?: unknown;
  env?: unknown;
  placement?: {
    type?: unknown;
    name?: unknown;
  };
}

export interface SecretResolveRequest {
  invocationId?: string;
  capabilityId: string;
  auth: SecretResolverAuth;
  executionTarget: SecretExecutionTarget;
  mode: SecretResolveMode;
}

export interface CredentialAuditEvidence {
  type: ResolvedCredentialType;
  provider?: string;
  source?: SecretCredentialSource;
  envName?: string;
  placement: SecretCredentialApplyMode;
  resolved: boolean;
  redacted?: string;
}

export interface ResolvedNoneCredential extends CredentialAuditEvidence {
  type: "none";
  placement: "none";
  resolved: true;
  applyToHeaders(headers: Record<string, string>): void;
}

export interface ResolvedBearerCredential extends CredentialAuditEvidence {
  type: "bearer";
  source: "env";
  envName: string;
  apply: "authorization_header";
  placement: "authorization_header";
  redacted: string;
  applyToHeaders(headers: Record<string, string>): void;
}

export interface ResolvedHeaderCredential extends CredentialAuditEvidence {
  type: "header";
  source: "env";
  envName: string;
  headerName: string;
  apply: "named_header";
  placement: "named_header";
  redacted: string;
  applyToHeaders(headers: Record<string, string>): void;
}

export type ResolvedCredential = ResolvedNoneCredential | ResolvedBearerCredential | ResolvedHeaderCredential;

export class SecretResolverError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SecretResolverError";
  }
}

export class SecretMissingError extends SecretResolverError {
  constructor(public readonly envName: string) {
    super("SECRET_MISSING", `Missing required environment credential: ${envName}.`);
    this.name = "SecretMissingError";
  }
}

export class SecretUnsupportedAuthError extends SecretResolverError {
  constructor(public readonly authType: string) {
    super("SECRET_AUTH_UNSUPPORTED", `Unsupported auth type for Secret Resolver V1: ${authType}.`);
    this.name = "SecretUnsupportedAuthError";
  }
}

export class SecretUnsupportedPlacementError extends SecretResolverError {
  constructor(public readonly placement: string) {
    super("SECRET_PLACEMENT_UNSUPPORTED", `Unsupported secret placement for Secret Resolver V1: ${placement}.`);
    this.name = "SecretUnsupportedPlacementError";
  }
}

export class SecretForbiddenHeaderError extends SecretResolverError {
  constructor(public readonly headerName: string) {
    super("SECRET_HEADER_FORBIDDEN", `Forbidden credential header name: ${headerName}.`);
    this.name = "SecretForbiddenHeaderError";
  }
}

const FORBIDDEN_HEADER_NAMES = new Set(["host", "content-length", "connection", "transfer-encoding", "cookie"]);

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function providerName(request: SecretResolveRequest): string | undefined {
  return stringValue(request.auth.provider) ?? request.executionTarget.provider;
}

function redactedSecret(secret: string): string {
  return `sha256:${createHash("sha256").update(secret).digest("hex").slice(0, 12)}`;
}

function secretValue(request: SecretResolveRequest, env: Record<string, string | undefined>, envName: string): string | undefined {
  if (request.mode === "dry_run") {
    return undefined;
  }

  const secret = env[envName];
  return typeof secret === "string" && secret.length > 0 ? secret : undefined;
}

function applyNoop(): void {
  return undefined;
}

function bearerCredential(request: SecretResolveRequest, envName: string, secret: string | undefined): ResolvedBearerCredential {
  const resolved = secret !== undefined;

  return {
    type: "bearer",
    provider: providerName(request),
    source: "env",
    envName,
    resolved,
    apply: "authorization_header",
    placement: "authorization_header",
    redacted: resolved ? redactedSecret(secret) : "[unresolved]",
    applyToHeaders: resolved ? (headers) => {
      headers.Authorization = `Bearer ${secret}`;
    } : applyNoop,
  };
}

function headerCredential(request: SecretResolveRequest, envName: string, headerName: string, secret: string | undefined): ResolvedHeaderCredential {
  const resolved = secret !== undefined;

  return {
    type: "header",
    provider: providerName(request),
    source: "env",
    envName,
    headerName,
    resolved,
    apply: "named_header",
    placement: "named_header",
    redacted: resolved ? redactedSecret(secret) : "[unresolved]",
    applyToHeaders: resolved ? (headers) => {
      headers[headerName] = secret;
    } : applyNoop,
  };
}

function resolvePlacement(auth: SecretResolverAuth): "bearer" | "header" {
  const placement = auth.placement?.type;

  if (placement === undefined || placement === "bearer") {
    return "bearer";
  }

  if (placement === "header") {
    return "header";
  }

  if (typeof placement === "string") {
    throw new SecretUnsupportedPlacementError(placement);
  }

  throw new SecretUnsupportedPlacementError("<invalid>");
}

function resolveHeaderName(auth: SecretResolverAuth): string {
  const headerName = stringValue(auth.placement?.name);

  if (headerName === undefined) {
    throw new SecretUnsupportedPlacementError("header");
  }

  if (FORBIDDEN_HEADER_NAMES.has(headerName.toLowerCase())) {
    throw new SecretForbiddenHeaderError(headerName);
  }

  return headerName;
}

export function credentialAuditEvidence(credential: ResolvedCredential): CredentialAuditEvidence {
  const { applyToHeaders: _applyToHeaders, ...evidence } = credential;
  return evidence;
}

export function resolveEnvCredential(request: SecretResolveRequest, env: Record<string, string | undefined>): ResolvedCredential {
  if (request.auth.type === "none") {
    return {
      type: "none",
      placement: "none",
      resolved: true,
      applyToHeaders: applyNoop,
    };
  }

  if (request.auth.type !== "api_key") {
    throw new SecretUnsupportedAuthError(String(request.auth.type ?? "<missing>"));
  }

  const envName = stringValue(request.auth.env);
  if (envName === undefined) {
    throw new SecretMissingError("<unknown>");
  }

  const placement = resolvePlacement(request.auth);
  const headerName = placement === "header" ? resolveHeaderName(request.auth) : undefined;
  const secret = secretValue(request, env, envName);
  if (request.mode === "execute" && secret === undefined) {
    throw new SecretMissingError(envName);
  }

  if (placement === "header") {
    return headerCredential(request, envName, headerName as string, secret);
  }

  return bearerCredential(request, envName, secret);
}
