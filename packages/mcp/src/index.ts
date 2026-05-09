import type { CapabilityManifest } from "@opencap/spec";
import { buildMcpToolProjection, capabilityIdToMcpToolName } from "./tool-projection.js";
import {
  McpNoElicitationConfirmationHandler,
  confirmWithAudit,
  evaluatePolicy,
  type AuditLogger,
  type PolicySet,
} from "@opencap/runtime";

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

export {
  MCP_TOOL_PROJECTION_VERSION,
  buildMcpToolDescription,
  buildMcpToolProjection,
  capabilityIdToMcpToolName,
  type McpToolProjection,
} from "./tool-projection.js";

export function describeCapabilityAsTool(manifest: CapabilityManifest) {
  const projection = buildMcpToolProjection(manifest);

  return {
    name: projection.toolName,
    title: projection.title,
    description: projection.description,
    inputSchema: projection.inputSchema,
    outputSchema: projection.outputSchema,
    metadata: {
      capabilityId: projection.capabilityId,
      projectionVersion: projection.projectionVersion,
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

export interface McpToolCallRequest {
  name: string;
  arguments?: unknown;
}

export interface McpToolCallResult {
  isError: boolean;
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: unknown;
}

export interface McpToolCallRouterOptions {
  policySet: PolicySet;
  auditLogger: AuditLogger;
  execute: (manifest: CapabilityManifest, input: unknown) => Promise<unknown>;
}

function textResult(text: string, structuredContent: unknown, isError: boolean): McpToolCallResult {
  return {
    isError,
    content: [{ type: "text", text }],
    structuredContent,
  };
}

function confirmationRequiredResult(manifest: CapabilityManifest, policy: ReturnType<typeof evaluatePolicy>, message: string): McpToolCallResult {
  const retryHint = "OpenCap V1 does not create confirmation tokens. Update policy in the CLI/Console or retry from a future MCP elicitation-capable host.";

  return textResult(
    `Confirmation required before running capability ${manifest.id}. ${retryHint}`,
    {
      error: {
        code: "CONFIRMATION_REQUIRED",
        message,
      },
      metadata: {
        capabilityId: manifest.id,
        policyDecision: policy.decision,
        retry: {
          token: null,
          hint: retryHint,
        },
      },
    },
    true,
  );
}

function findManifestByToolName(manifests: CapabilityManifest[], toolName: string): CapabilityManifest | undefined {
  return manifests.find((manifest) => capabilityIdToMcpToolName(manifest.id) === toolName);
}

export async function routeMcpToolCall(
  manifests: CapabilityManifest[],
  request: McpToolCallRequest,
  options: McpToolCallRouterOptions,
): Promise<McpToolCallResult> {
  buildMcpToolNameMap(manifests);
  const manifest = findManifestByToolName(manifests, request.name);

  if (manifest === undefined) {
    return textResult(`Unknown MCP tool: ${request.name}`, { error: { code: "TOOL_NOT_FOUND", toolName: request.name } }, true);
  }

  const policy = evaluatePolicy(options.policySet, {
    capabilityId: manifest.id,
    permissions: manifest.permissions,
    channel: "mcp",
  });
  const { confirmation } = await confirmWithAudit(
    new McpNoElicitationConfirmationHandler(),
    { capabilityId: manifest.id, channel: "mcp", policy, input: request.arguments },
    options.auditLogger,
  );

  if (confirmation.status === "denied") {
    return textResult(confirmation.reason, { error: { code: "POLICY_DENIED", message: confirmation.reason } }, true);
  }

  if (confirmation.status === "confirmation_required") {
    return confirmationRequiredResult(manifest, policy, confirmation.reason);
  }

  if (confirmation.status !== "approved") {
    return textResult(confirmation.reason, { error: { code: "CONFIRMATION_REJECTED", message: confirmation.reason } }, true);
  }

  const output = await options.execute(manifest, request.arguments ?? {});
  return textResult("Tool call completed.", output, false);
}
