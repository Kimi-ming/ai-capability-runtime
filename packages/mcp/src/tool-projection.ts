import { createHash } from "node:crypto";
import type { CapabilityManifest } from "@opencap/spec";
import { buildCapabilityRiskSummary } from "@opencap/runtime";

export const MCP_TOOL_PROJECTION_VERSION = "opencap.mcp.tool-projection.v1";
export const MCP_TOOL_PROJECTION_HASH_ALGORITHM = "sha256";

export interface McpToolProjectionEvidence {
  projectionVersion: typeof MCP_TOOL_PROJECTION_VERSION;
  projectionHash: string;
  hashAlgorithm: typeof MCP_TOOL_PROJECTION_HASH_ALGORITHM;
}

export interface McpToolProjection {
  projectionVersion: typeof MCP_TOOL_PROJECTION_VERSION;
  capabilityId: string;
  toolName: string;
  title: string;
  description: string;
  inputSchema: CapabilityManifest["input"];
  outputSchema: CapabilityManifest["output"];
  projectionHash: string;
  evidence: McpToolProjectionEvidence;
}

type ProjectionHashInput = Omit<McpToolProjection, "projectionHash" | "evidence">;

export function capabilityIdToMcpToolName(id: string): string {
  return id.replaceAll(".", "_");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeForStableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForStableJson(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, normalizeForStableJson(value[key])]),
  );
}

export function stableJsonStringifyProjection(value: unknown): string {
  return JSON.stringify(normalizeForStableJson(value));
}

export function hashMcpToolProjectionInput(input: ProjectionHashInput): string {
  return `${MCP_TOOL_PROJECTION_HASH_ALGORITHM}:${createHash(MCP_TOOL_PROJECTION_HASH_ALGORITHM).update(stableJsonStringifyProjection(input)).digest("hex")}`;
}

function sanitizePurposeSummary(description: string): string {
  const sanitized = description
    .replace(/\bpermissions?\s*:[^.。]*(?:[.。]|$)/gi, " ")
    .replace(/\brisk\s*:[^.。]*(?:[.。]|$)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : "No model-visible purpose summary provided";
}

export function buildMcpToolDescription(manifest: CapabilityManifest): string {
  const riskSummary = buildCapabilityRiskSummary(manifest);

  return [
    `${manifest.name}.`,
    `Capability: ${manifest.id}.`,
    `Purpose: ${sanitizePurposeSummary(manifest.description)}.`,
    `Permissions: ${riskSummary.permissionSummary}.`,
    `Risk: ${riskSummary.riskSummary}.`,
    `Confirmation: ${riskSummary.confirmationSummary}.`,
  ].join(" ");
}

export function buildMcpToolProjection(manifest: CapabilityManifest): McpToolProjection {
  const hashInput: ProjectionHashInput = {
    projectionVersion: MCP_TOOL_PROJECTION_VERSION,
    capabilityId: manifest.id,
    toolName: capabilityIdToMcpToolName(manifest.id),
    title: manifest.name,
    description: buildMcpToolDescription(manifest),
    inputSchema: manifest.input,
    outputSchema: manifest.output,
  };
  const projectionHash = hashMcpToolProjectionInput(hashInput);

  return {
    ...hashInput,
    projectionHash,
    evidence: {
      projectionVersion: MCP_TOOL_PROJECTION_VERSION,
      projectionHash,
      hashAlgorithm: MCP_TOOL_PROJECTION_HASH_ALGORITHM,
    },
  };
}
