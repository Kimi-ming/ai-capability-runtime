import type { CapabilityManifest } from "@opencap/spec";

export interface CapabilityContext {
  auth: Record<string, unknown>;
  secrets: Record<string, unknown>;
}

export interface DefinedCapability<TInput = unknown, TOutput = unknown> {
  manifest: CapabilityManifest;
  run(input: TInput, context: CapabilityContext): Promise<TOutput>;
}

export function defineCapability<TInput, TOutput>(
  capability: DefinedCapability<TInput, TOutput>
): DefinedCapability<TInput, TOutput> {
  return capability;
}
