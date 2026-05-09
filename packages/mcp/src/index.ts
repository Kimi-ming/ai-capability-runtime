import type { CapabilityManifest } from "@opencap/spec";

export interface CapabilityLike {
  id: string;
}

export interface McpToolNameMapping {
  capabilityId: string;
  toolName: string;
}

export class McpToolNameCollisionError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly capabilityIds: string[],
  ) {
    super(`MCP tool name collision for ${toolName}: ${capabilityIds.join(", ")}`);
    this.name = "McpToolNameCollisionError";
  }
}

export function capabilityIdToMcpToolName(id: string): string {
  return id.replaceAll(".", "_");
}

export function buildMcpToolNameMap(capabilities: CapabilityLike[]): McpToolNameMapping[] {
  const byToolName = new Map<string, string[]>();

  for (const capability of capabilities) {
    const toolName = capabilityIdToMcpToolName(capability.id);
    byToolName.set(toolName, [...(byToolName.get(toolName) ?? []), capability.id]);
  }

  for (const [toolName, capabilityIds] of byToolName) {
    if (capabilityIds.length > 1) {
      throw new McpToolNameCollisionError(toolName, capabilityIds);
    }
  }

  return capabilities.map((capability) => ({
    capabilityId: capability.id,
    toolName: capabilityIdToMcpToolName(capability.id),
  }));
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
    "Confirmation: write or higher-risk actions may require confirmation.",
  ].join(" ");

  return {
    name: capabilityIdToMcpToolName(manifest.id),
    title: manifest.name,
    description,
    inputSchema: manifest.input,
    outputSchema: manifest.output,
    metadata: {
      capabilityId: manifest.id,
    },
  };
}

export interface McpToolsListResult {
  tools: ReturnType<typeof describeCapabilityAsTool>[];
}

export function buildMcpToolsList(manifests: CapabilityManifest[]): McpToolsListResult {
  buildMcpToolNameMap(manifests);

  return {
    tools: manifests.map((manifest) => describeCapabilityAsTool(manifest)),
  };
}
