import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { CapabilityManifest } from "@opencap/spec";

export const DEFAULT_STATE_DIR_NAME = "opencap.local";
export const OPENCAP_STATE_DIR_ENV = "OPENCAP_STATE_DIR";

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

export interface RuntimeOptions extends ResolveStateDirOptions {}

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

  async loadInstalledCapabilities(): Promise<CapabilityManifest[]> {
    return [];
  }

  async invoke(_request: InvocationRequest): Promise<InvocationResult> {
    return {
      ok: false,
      error: "OpenCap runtime invocation is not implemented yet.",
    };
  }
}
