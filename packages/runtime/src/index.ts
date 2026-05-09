import { cp, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { validateManifestFile, type CapabilityManifest } from "@opencap/spec";

export const DEFAULT_STATE_DIR_NAME = "opencap.local";
export const OPENCAP_STATE_DIR_ENV = "OPENCAP_STATE_DIR";
export const DEFAULT_REGISTRY_DIR_NAME = "registry";
export const OPENCAP_REGISTRY_DIR_ENV = "OPENCAP_REGISTRY_DIR";

export interface ResolveStateDirOptions {
  cwd?: string;
  stateDir?: string;
  env?: Record<string, string | undefined>;
}

export interface LocalStatePaths {
  root: string;
  installedDir: string;
  tmpDir: string;
  cacheDir: string;
  policiesFile: string;
  logsDatabaseFile: string;
}

export interface ResolveRegistryDirOptions {
  cwd?: string;
  registryDir?: string;
  env?: Record<string, string | undefined>;
}

export interface RuntimeOptions extends ResolveStateDirOptions {}

export interface InstallCapabilityOptions extends ResolveStateDirOptions, ResolveRegistryDirOptions {
  id: string;
  force?: boolean;
}

export interface InstallCapabilityResult {
  id: string;
  sourceDir: string;
  destinationDir: string;
  manifest: CapabilityManifest;
}

export interface InstalledCapability {
  id: string;
  version: string;
  installPath: string;
  manifestPath: string;
  manifest: CapabilityManifest;
}

export interface InstalledCapabilityLoadIssue {
  id: string;
  installPath: string;
  manifestPath: string;
  error: string;
}

export interface InstalledCapabilityLoadResult {
  capabilities: InstalledCapability[];
  invalid: InstalledCapabilityLoadIssue[];
}

export interface InstalledCapabilitySummary {
  id: string;
  installPath: string;
  version?: string;
  type?: string;
  risk: string;
  trustLevel?: string;
  status: "enabled" | "invalid";
  error?: string;
}

export type InstallCapabilityErrorCode =
  | "REGISTRY_NOT_FOUND"
  | "CAPABILITY_NOT_FOUND"
  | "CAPABILITY_AMBIGUOUS"
  | "CAPABILITY_INVALID"
  | "CAPABILITY_ALREADY_INSTALLED";

export class InstallCapabilityError extends Error {
  constructor(
    public readonly code: InstallCapabilityErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "InstallCapabilityError";
  }
}

export interface InvocationRequest {
  capabilityId: string;
  input: unknown;
  host?: string;
}

export interface InvocationResult {
  ok: boolean;
  output?: unknown;
  error?: string;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

export function resolveStateDir(options: ResolveStateDirOptions = {}): string {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const configured = firstNonEmpty(options.stateDir, env[OPENCAP_STATE_DIR_ENV], DEFAULT_STATE_DIR_NAME);

  return resolve(cwd, configured ?? DEFAULT_STATE_DIR_NAME);
}

export function resolveRegistryDir(options: ResolveRegistryDirOptions = {}): string {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const configured = firstNonEmpty(options.registryDir, env[OPENCAP_REGISTRY_DIR_ENV], DEFAULT_REGISTRY_DIR_NAME);

  return resolve(cwd, configured ?? DEFAULT_REGISTRY_DIR_NAME);
}

export function getLocalStatePaths(options: ResolveStateDirOptions | string = {}): LocalStatePaths {
  const root = typeof options === "string" ? resolve(options) : resolveStateDir(options);

  return {
    root,
    installedDir: resolve(root, "installed"),
    tmpDir: resolve(root, "tmp"),
    cacheDir: resolve(root, "cache"),
    policiesFile: resolve(root, "policies.yml"),
    logsDatabaseFile: resolve(root, "logs.sqlite"),
  };
}

export async function ensureLocalStateDir(options: ResolveStateDirOptions | string = {}): Promise<LocalStatePaths> {
  const paths = getLocalStatePaths(options);

  await mkdir(paths.installedDir, { recursive: true });
  await mkdir(paths.tmpDir, { recursive: true });

  return paths;
}


async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findCapabilityDirs(registryDir: string, id: string): Promise<string[]> {
  const entries = await readdir(registryDir, { withFileTypes: true });
  const matches: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = join(registryDir, entry.name);

    if (entry.name === id && (await pathExists(join(entryPath, "manifest.yml")))) {
      matches.push(entryPath);
      continue;
    }

    matches.push(...(await findCapabilityDirs(entryPath, id)));
  }

  return matches.sort();
}

export async function installCapability(options: InstallCapabilityOptions): Promise<InstallCapabilityResult> {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const registryDir = resolveRegistryDir({ cwd, env, registryDir: options.registryDir });

  if (!(await pathExists(registryDir))) {
    throw new InstallCapabilityError("REGISTRY_NOT_FOUND", `Registry directory not found: ${registryDir}`, {
      registryDir,
    });
  }

  const matches = await findCapabilityDirs(registryDir, options.id);

  if (matches.length === 0) {
    throw new InstallCapabilityError("CAPABILITY_NOT_FOUND", `Capability not found in registry: ${options.id}`, {
      id: options.id,
      registryDir,
    });
  }

  if (matches.length > 1) {
    throw new InstallCapabilityError("CAPABILITY_AMBIGUOUS", `Multiple registry entries found for capability: ${options.id}`, {
      id: options.id,
      matches,
    });
  }

  const sourceDir = matches[0];
  const manifestPath = join(sourceDir, "manifest.yml");
  const validation = await validateManifestFile(manifestPath);

  if (!validation.ok) {
    throw new InstallCapabilityError("CAPABILITY_INVALID", `Capability manifest is invalid: ${manifestPath}`, {
      id: options.id,
      issues: validation.issues,
    });
  }

  if (validation.manifest.id !== options.id) {
    throw new InstallCapabilityError("CAPABILITY_INVALID", `Capability id mismatch: expected ${options.id}, got ${validation.manifest.id}`, {
      id: options.id,
      manifestId: validation.manifest.id,
    });
  }

  const paths = await ensureLocalStateDir({ cwd, env, stateDir: options.stateDir });
  const destinationDir = join(paths.installedDir, options.id);
  const alreadyInstalled = await pathExists(destinationDir);

  if (alreadyInstalled && !options.force) {
    throw new InstallCapabilityError("CAPABILITY_ALREADY_INSTALLED", `Capability already installed: ${options.id}. Use --force to replace it.`, {
      id: options.id,
      destinationDir,
    });
  }

  const tmpInstallDir = join(paths.tmpDir, `install-${options.id}-${randomUUID()}`);

  try {
    await cp(sourceDir, tmpInstallDir, { recursive: true, errorOnExist: true });

    if (alreadyInstalled) {
      await rm(destinationDir, { recursive: true, force: true });
    }

    await rename(tmpInstallDir, destinationDir);
  } catch (error) {
    await rm(tmpInstallDir, { recursive: true, force: true });
    throw error;
  }

  return {
    id: options.id,
    sourceDir,
    destinationDir,
    manifest: validation.manifest,
  };
}



async function installedEntries(installedDir: string): Promise<Array<{ name: string; installPath: string; manifestPath: string }>> {
  if (!(await pathExists(installedDir))) {
    return [];
  }

  const entries = await readdir(installedDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const installPath = join(installedDir, entry.name);
      return {
        name: entry.name,
        installPath,
        manifestPath: join(installPath, "manifest.yml"),
      };
    });
}

export async function loadInstalledCapabilities(options: ResolveStateDirOptions | string = {}): Promise<InstalledCapabilityLoadResult> {
  const paths = getLocalStatePaths(options);
  const entries = await installedEntries(paths.installedDir);
  const capabilities: InstalledCapability[] = [];
  const invalid: InstalledCapabilityLoadIssue[] = [];

  for (const entry of entries) {
    const validation = await validateManifestFile(entry.manifestPath);

    if (!validation.ok) {
      invalid.push({
        id: entry.name,
        installPath: entry.installPath,
        manifestPath: entry.manifestPath,
        error: validation.issues.map((issue) => `${issue.fieldPath} ${issue.message}`).join("; "),
      });
      continue;
    }

    capabilities.push({
      id: validation.manifest.id,
      version: validation.manifest.version,
      installPath: entry.installPath,
      manifestPath: entry.manifestPath,
      manifest: validation.manifest,
    });
  }

  return { capabilities, invalid };
}

function summarizeRisk(manifest: CapabilityManifest): string {
  const risks = [...new Set(manifest.permissions.map((permission) => permission.risk))];
  return risks.join(",");
}

function metadataString(manifest: CapabilityManifest, key: string): string | undefined {
  const value = manifest.metadata[key];
  return typeof value === "string" ? value : undefined;
}

export async function listInstalledCapabilities(options: ResolveStateDirOptions = {}): Promise<InstalledCapabilitySummary[]> {
  const loaded = await loadInstalledCapabilities(options);
  const summaries: InstalledCapabilitySummary[] = [];

  for (const capability of loaded.capabilities) {
    summaries.push({
      id: capability.id,
      installPath: capability.installPath,
      version: capability.manifest.version,
      type: capability.manifest.type,
      risk: summarizeRisk(capability.manifest),
      trustLevel: metadataString(capability.manifest, "trust_level"),
      status: "enabled",
    });
  }

  for (const invalid of loaded.invalid) {
    summaries.push({
      id: invalid.id,
      installPath: invalid.installPath,
      risk: "unknown",
      status: "invalid",
      error: invalid.error,
    });
  }

  return summaries.sort((a, b) => a.id.localeCompare(b.id));
}

export class OpenCapRuntime {
  private readonly paths: LocalStatePaths;

  constructor(options: RuntimeOptions = {}) {
    this.paths = getLocalStatePaths(options);
  }

  get stateDir(): string {
    return this.paths.root;
  }

  get statePaths(): LocalStatePaths {
    return this.paths;
  }

  async loadInstalledCapabilities(): Promise<InstalledCapability[]> {
    return (await loadInstalledCapabilities(this.paths.root)).capabilities;
  }

  async invoke(_request: InvocationRequest): Promise<InvocationResult> {
    return {
      ok: false,
      error: "OpenCap runtime invocation is not implemented yet.",
    };
  }
}
