import type { CapabilityManifest } from "@opencap/spec";

export interface RuntimeOptions {
  stateDir: string;
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

export class OpenCapRuntime {
  constructor(private readonly options: RuntimeOptions) {}

  get stateDir(): string {
    return this.options.stateDir;
  }

  async loadInstalledCapabilities(): Promise<CapabilityManifest[]> {
    return [];
  }

  async invoke(_request: InvocationRequest): Promise<InvocationResult> {
    return {
      ok: false,
      error: "OpenCap runtime invocation is not implemented yet."
    };
  }
}
