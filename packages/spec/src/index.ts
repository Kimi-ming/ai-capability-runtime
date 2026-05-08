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
let compiledRegistryTestValidator: ValidateFunction | undefined;

async function compileSchema(schemaFileName: string): Promise<ValidateFunction> {
  const schemaPath = new URL(`../schema/${schemaFileName}`, import.meta.url);
  const schema = JSON.parse(await readFile(schemaPath, "utf8")) as object;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

async function getManifestValidator() {
  if (!compiledManifestValidator) {
    compiledManifestValidator = await compileSchema("manifest.schema.json");
  }

  return compiledManifestValidator;
}

async function getRegistryTestValidator() {
  if (!compiledRegistryTestValidator) {
    compiledRegistryTestValidator = await compileSchema("registry-test.schema.json");
  }

  return compiledRegistryTestValidator;
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


export interface RegistryTestValidationIssue extends ManifestValidationIssue {}

export interface RegistryTestValidationSuccess {
  ok: true;
  filePath: string;
  testCase: unknown;
}

export interface RegistryTestValidationFailure {
  ok: false;
  filePath: string;
  issues: RegistryTestValidationIssue[];
}

export type RegistryTestValidationResult = RegistryTestValidationSuccess | RegistryTestValidationFailure;

export interface RegistryTestPathValidationResult {
  targetPath: string;
  testCases: string[];
  valid: RegistryTestValidationSuccess[];
  invalid: RegistryTestValidationFailure[];
}

function isRegistryTestFileName(fileName: string): boolean {
  return ["basic.yml", "basic.yaml", "basic.json"].includes(basename(fileName));
}

async function findRegistryTestsInDirectory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findRegistryTestsInDirectory(path)));
    } else if (entry.isFile() && isRegistryTestFileName(entry.name) && dir.endsWith("tests")) {
      files.push(path);
    }
  }

  return files.sort();
}

export async function findRegistryTestFiles(targetPath: string): Promise<string[]> {
  const info = await stat(targetPath);

  if (info.isFile()) {
    return isRegistryTestFileName(targetPath) ? [targetPath] : [];
  }

  if (info.isDirectory()) {
    return findRegistryTestsInDirectory(targetPath);
  }

  return [];
}

export async function loadRegistryTestCase(filePath: string): Promise<unknown> {
  return loadManifest(filePath);
}

export async function validateRegistryTestCase(testCase: unknown, filePath = "<memory>"): Promise<RegistryTestValidationResult> {
  const validator = await getRegistryTestValidator();
  const valid = validator(testCase);

  if (valid) {
    return {
      ok: true,
      filePath,
      testCase,
    };
  }

  return {
    ok: false,
    filePath,
    issues: issuesFromAjvErrors(filePath, validator.errors),
  };
}

export async function validateRegistryTestFile(filePath: string): Promise<RegistryTestValidationResult> {
  try {
    const testCase = await loadRegistryTestCase(filePath);
    return validateRegistryTestCase(testCase, filePath);
  } catch (error) {
    return {
      ok: false,
      filePath,
      issues: [
        {
          filePath,
          fieldPath: "/",
          message: error instanceof Error ? error.message : "failed to read registry test",
          keyword: "parse",
        },
      ],
    };
  }
}

export async function validateRegistryTestPath(targetPath: string): Promise<RegistryTestPathValidationResult> {
  const testCases = await findRegistryTestFiles(targetPath);
  const results = await Promise.all(testCases.map((testPath) => validateRegistryTestFile(testPath)));

  return {
    targetPath,
    testCases,
    valid: results.filter((result): result is RegistryTestValidationSuccess => result.ok),
    invalid: results.filter((result): result is RegistryTestValidationFailure => !result.ok),
  };
}

export function formatManifestValidationIssue(issue: ManifestValidationIssue): string {
  return `${issue.fieldPath} ${issue.message}`;
}
