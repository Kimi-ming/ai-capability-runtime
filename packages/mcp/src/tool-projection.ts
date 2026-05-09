import type { CapabilityManifest } from "@opencap/spec";

export const MCP_TOOL_PROJECTION_VERSION = "opencap.mcp.tool-projection.v1";

export interface McpToolProjection {
  projectionVersion: typeof MCP_TOOL_PROJECTION_VERSION;
  capabilityId: string;
  toolName: string;
  title: string;
  description: string;
  inputSchema: CapabilityManifest["input"];
  outputSchema: CapabilityManifest["output"];
}

export function capabilityIdToMcpToolName(id: string): string {
  return id.replaceAll(".", "_");
}

function summarizePermissions(manifest: CapabilityManifest): string {
  return manifest.permissions
    .map((permission) => `${permission.resource}:${permission.action}:${permission.risk}`)
    .join(", ");
}

function summarizeRisk(manifest: CapabilityManifest): string {
  return manifest.permissions.map((permission) => permission.risk).join(", ");
}

export function buildMcpToolDescription(manifest: CapabilityManifest): string {
  return [
    `${manifest.name}.`,
    `Capability: ${manifest.id}.`,
    `Purpose: ${manifest.description}.`,
    `Permissions: ${summarizePermissions(manifest)}.`,
    `Risk: ${summarizeRisk(manifest)}.`,
    "Confirmation: write or higher-risk actions may require confirmation.",
  ].join(" ");
}

export function buildMcpToolProjection(manifest: CapabilityManifest): McpToolProjection {
  return {
    projectionVersion: MCP_TOOL_PROJECTION_VERSION,
    capabilityId: manifest.id,
    toolName: capabilityIdToMcpToolName(manifest.id),
    title: manifest.name,
    description: buildMcpToolDescription(manifest),
    inputSchema: manifest.input,
    outputSchema: manifest.output,
  };
}
