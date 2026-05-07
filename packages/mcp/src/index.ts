import type { CapabilityManifest } from "@opencap/spec";

export function capabilityIdToMcpToolName(id: string): string {
  return id.replaceAll(".", "_");
}

export function describeCapabilityAsTool(manifest: CapabilityManifest) {
  return {
    name: capabilityIdToMcpToolName(manifest.id),
    description: `${manifest.description}\n\nRisk: ${manifest.permissions.map((permission) => permission.risk).join(", ")}`,
    inputSchema: manifest.input
  };
}
