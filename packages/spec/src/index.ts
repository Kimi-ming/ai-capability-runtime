import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import YAML from "yaml";

export type RiskLevel =
  | "read_only"
  | "write"
  | "external_send"
  | "destructive"
  | "financial"
  | "code_execution"
  | "secret_access";

export type CapabilityType = "http";

export interface CapabilityPermission {
  resource: string;
  action: string;
  risk: RiskLevel;
  confirmation: "allow" | "ask" | "deny";
}

export interface CapabilityManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  type: CapabilityType;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  auth: Record<string, unknown>;
  permissions: CapabilityPermission[];
  execution: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface ManifestValidationIssue {
  filePath: string;
  fieldPath: string;
  message: string;
  keyword?: string;
}

export interface ManifestValidationSuccess {
  ok: true;
  filePath: string;
  manifest: CapabilityManifest;
}

export interface ManifestValidationFailure {
  ok: false;
  filePath: string;
  issues: ManifestValidationIssue[];
}

export type ManifestValidationResult = ManifestValidationSuccess | ManifestValidationFailure;

export interface ManifestPathValidationResult {
  targetPath: string;
  manifests: string[];
  valid: ManifestValidationSuccess[];
  invalid: ManifestValidationFailure[];
}

let compiledManifestValidator: ValidateFunction | undefined;

async function getManifestValidator() {
  if (!compiledManifestValidator) {
    const schemaPath = new URL("../schema/manifest.schema.json", import.meta.url);
    const schema = JSON.parse(await readFile(schemaPath, "utf8")) as object;
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    compiledManifestValidator = ajv.compile(schema);
  }

  return compiledManifestValidator;
}

function isManifestFileName(fileName: string): boolean {
  return ["manifest.yml", "manifest.yaml", "manifest.json"].includes(basename(fileName));
}

async function findManifestsInDirectory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findManifestsInDirectory(path)));
    } else if (entry.isFile() && isManifestFileName(entry.name)) {
      files.push(path);
    }
  }

  return files.sort();
}

export async function findManifestFiles(targetPath: string): Promise<string[]> {
  const info = await stat(targetPath);

  if (info.isFile()) {
    return isManifestFileName(targetPath) ? [targetPath] : [];
  }

  if (info.isDirectory()) {
    return findManifestsInDirectory(targetPath);
  }

  return [];
}

export async function loadManifest(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  const ext = extname(filePath).toLowerCase();

  if (ext === ".json") {
    return JSON.parse(raw);
  }

  return YAML.parse(raw);
}

function normalizeInstancePath(error: ErrorObject): string {
  if (error.keyword === "required" && typeof error.params.missingProperty === "string") {
    return `${error.instancePath || ""}/${error.params.missingProperty}` || "/";
  }

  if (error.keyword === "additionalProperties" && typeof error.params.additionalProperty === "string") {
    return `${error.instancePath || ""}/${error.params.additionalProperty}` || "/";
  }

  return error.instancePath || "/";
}

function issuesFromAjvErrors(filePath: string, errors: ErrorObject[] | null | undefined): ManifestValidationIssue[] {
  return (errors ?? []).map((error) => ({
    filePath,
    fieldPath: normalizeInstancePath(error),
    message: error.message ?? "is invalid",
    keyword: error.keyword,
  }));
}

export async function validateManifest(manifest: unknown, filePath = "<memory>"): Promise<ManifestValidationResult> {
  const validator = await getManifestValidator();
  const valid = validator(manifest);

  if (valid) {
    return {
      ok: true,
      filePath,
      manifest: manifest as CapabilityManifest,
    };
  }

  return {
    ok: false,
    filePath,
    issues: issuesFromAjvErrors(filePath, validator.errors),
  };
}

export async function validateManifestFile(filePath: string): Promise<ManifestValidationResult> {
  try {
    const manifest = await loadManifest(filePath);
    return validateManifest(manifest, filePath);
  } catch (error) {
    return {
      ok: false,
      filePath,
      issues: [
        {
          filePath,
          fieldPath: "/",
          message: error instanceof Error ? error.message : "failed to read manifest",
          keyword: "parse",
        },
      ],
    };
  }
}

export async function validateManifestPath(targetPath: string): Promise<ManifestPathValidationResult> {
  const manifests = await findManifestFiles(targetPath);
  const results = await Promise.all(manifests.map((manifestPath) => validateManifestFile(manifestPath)));

  return {
    targetPath,
    manifests,
    valid: results.filter((result): result is ManifestValidationSuccess => result.ok),
    invalid: results.filter((result): result is ManifestValidationFailure => !result.ok),
  };
}

export function formatManifestValidationIssue(issue: ManifestValidationIssue): string {
  return `${issue.fieldPath} ${issue.message}`;
}
