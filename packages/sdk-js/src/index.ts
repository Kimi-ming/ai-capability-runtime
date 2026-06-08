import {
  validateCapabilityAuthoringManifest,
  type CapabilityManifest,
  type ManifestValidationFailure,
  type ManifestValidationIssue,
  type ManifestValidationResult,
  type ManifestValidationSuccess,
} from "@opencap/spec";

export const SDK_AUTHORING_BOUNDARY = {
  schemaVersion: "opencap.sdk_authoring_boundary.v1",
  manifestContract: "opencap.capability_manifest.v1",
  runtimePluginApi: false,
  acceptsRunHandler: false,
  installsCapability: false,
  executesCapability: false,
  readsProviderSecret: false,
  writesStateDir: false,
  networkAccess: false,
  policyEffect: "none",
} as const;

export type SdkAuthoringBoundary = typeof SDK_AUTHORING_BOUNDARY;

export interface DefineHttpCapabilityManifestOptions {
  filePath?: string;
}

export interface DefinedHttpCapabilityManifest {
  ok: true;
  filePath: string;
  manifest: CapabilityManifest & { type: "http" };
  validation: ManifestValidationSuccess;
  boundary: SdkAuthoringBoundary;
}

export interface InvalidHttpCapabilityManifest {
  ok: false;
  filePath: string;
  issues: ManifestValidationIssue[];
  validation: ManifestValidationFailure;
  boundary: SdkAuthoringBoundary;
}

export type DefineHttpCapabilityManifestResult = DefinedHttpCapabilityManifest | InvalidHttpCapabilityManifest;

export class SdkCapabilityAuthoringError extends Error {
  readonly filePath: string;
  readonly issues: ManifestValidationIssue[];

  constructor(filePath: string, issues: ManifestValidationIssue[]) {
    super(`Invalid OpenCap SDK Capability manifest draft: ${issues.length} issue(s).`);
    this.name = "SdkCapabilityAuthoringError";
    this.filePath = filePath;
    this.issues = issues;
  }
}

function sdkBoundaryFailure(filePath: string, message: string): InvalidHttpCapabilityManifest {
  const validation: ManifestValidationFailure = {
    ok: false,
    filePath,
    issues: [
      {
        filePath,
        fieldPath: "/",
        message,
        keyword: "sdk-authoring-boundary:no-runtime-handler",
      },
    ],
  };

  return {
    ok: false,
    filePath,
    issues: validation.issues,
    validation,
    boundary: SDK_AUTHORING_BOUNDARY,
  };
}

function hasRunHandler(value: unknown): boolean {
  return typeof value === "object" && value !== null && Object.prototype.hasOwnProperty.call(value, "run");
}

function sdkResultFromValidation(
  validation: ManifestValidationResult,
  filePath: string,
): DefineHttpCapabilityManifestResult {
  if (!validation.ok) {
    return {
      ok: false,
      filePath,
      issues: validation.issues,
      validation,
      boundary: SDK_AUTHORING_BOUNDARY,
    };
  }

  return {
    ok: true,
    filePath,
    manifest: validation.manifest as CapabilityManifest & { type: "http" },
    validation,
    boundary: SDK_AUTHORING_BOUNDARY,
  };
}

export async function defineHttpCapabilityManifest(
  manifestDraft: unknown,
  options: DefineHttpCapabilityManifestOptions = {},
): Promise<DefineHttpCapabilityManifestResult> {
  const filePath = options.filePath ?? "<sdk>";

  if (hasRunHandler(manifestDraft)) {
    return sdkBoundaryFailure(
      filePath,
      "SDK V1 accepts Capability Manifest data only; runtime run handlers are not part of the OpenCap authoring boundary.",
    );
  }

  const validation = await validateCapabilityAuthoringManifest(manifestDraft, filePath);
  return sdkResultFromValidation(validation, filePath);
}

export async function defineValidHttpCapabilityManifest(
  manifestDraft: unknown,
  options: DefineHttpCapabilityManifestOptions = {},
): Promise<DefinedHttpCapabilityManifest> {
  const result = await defineHttpCapabilityManifest(manifestDraft, options);

  if (!result.ok) {
    throw new SdkCapabilityAuthoringError(result.filePath, result.issues);
  }

  return result;
}
