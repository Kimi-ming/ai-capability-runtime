import type { CapabilityManifest } from "@opencap/spec";

export function capabilityIdToMcpToolName(id: string): string {
  return id.replaceAll(".", "_");
}

function summarizePermissions(manifest: CapabilityManifest): string {
  return manifest.permissions
    .map((permission) => `${permission.resource}:${permission.action}:${permission.risk}`)
    .join(", ");
}

export function describeCapabilityAsTool(manifest: CapabilityManifest) {
  const permissionSummary = summarizePermissions(manifest);
  const riskSummary = manifest.permissions.map((permission) => permission.risk).join(", ");
  const description = [
    `${manifest.name}.`,
    `Capability: ${manifest.id}.`,
    `Purpose: ${manifest.description}.`,
    `Permissions: ${permissionSummary}.`,
    `Risk: ${riskSummary}.`,
    "Confirmation: write or higher-risk actions may require confirmation."
  ].join(" ");

  return {
    name: capabilityIdToMcpToolName(manifest.id),
    title: manifest.name,
    description,
    inputSchema: manifest.input,
    outputSchema: manifest.output
  };
}
