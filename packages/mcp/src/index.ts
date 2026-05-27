import type { CapabilityManifest } from "@opencap/spec";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type CallToolResult,
  type ListToolsResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { buildMcpToolProjection, capabilityIdToMcpToolName } from "./tool-projection.js";
import {
  McpNoElicitationConfirmationHandler,
  SqliteAuditLogger,
  confirmWithAudit,
  evaluatePolicy,
  executeHttpCapability,
  loadInstalledCapabilities,
  loadPolicySet,
  resultEnvelopeFromHttpExecutionResult,
  type AuditLogger,
  type PolicySet,
  type ResultEnvelopeV1,
} from "@opencap/runtime";

export const MCP_TYPESCRIPT_SDK_PACKAGE = "@modelcontextprotocol/sdk" as const;
export const MCP_TYPESCRIPT_SDK_VERSION_RANGE = "^1.29.0" as const;

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
  MCP_TOOL_PROJECTION_HASH_ALGORITHM,
  MCP_TOOL_PROJECTION_VERSION,
  buildMcpToolDescription,
  buildMcpToolProjection,
  hashMcpToolProjectionInput,
  stableJsonStringifyProjection,
  capabilityIdToMcpToolName,
  type McpToolProjection,
  type McpToolProjectionEvidence,
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
      projectionHash: projection.projectionHash,
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

function fallbackStructuredContent(envelope: ResultEnvelopeV1): unknown {
  return {
    status: envelope.status,
    outcome: envelope.outcome,
    capabilityId: envelope.capabilityId,
    evidence: envelope.evidence,
    warnings: envelope.warnings,
  };
}

export function resultEnvelopeToMcpToolCallResult(envelope: ResultEnvelopeV1): McpToolCallResult {
  return {
    isError: envelope.isError,
    content: [{ type: "text", text: envelope.textSummary ?? `${envelope.capabilityId} ${envelope.status}.` }],
    structuredContent: envelope.structuredContent ?? fallbackStructuredContent(envelope),
  };
}

function isResultEnvelope(value: unknown): value is ResultEnvelopeV1 {
  return typeof value === "object"
    && value !== null
    && "envelopeVersion" in value
    && (value as { envelopeVersion?: unknown }).envelopeVersion === "opencap.result_envelope.v1";
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
  if (isResultEnvelope(output)) {
    return resultEnvelopeToMcpToolCallResult(output);
  }

  return textResult("Tool call completed.", output, false);
}

export interface OpenCapMcpServerOptions extends McpToolCallRouterOptions {
  manifests: CapabilityManifest[];
  serverName?: string;
  serverVersion?: string;
}

export interface OpenCapMcpServerHandlers {
  listTools: () => Promise<ListToolsResult>;
  callTool: (request: Pick<CallToolRequest, "params">) => Promise<CallToolResult>;
}

function toSdkTool(tool: ReturnType<typeof describeCapabilityAsTool>): Tool {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema as Tool["inputSchema"],
    outputSchema: tool.outputSchema as Tool["outputSchema"],
    _meta: tool.metadata,
  };
}

function toSdkCallToolResult(result: McpToolCallResult): CallToolResult {
  const structuredContent = typeof result.structuredContent === "object" && result.structuredContent !== null && !Array.isArray(result.structuredContent)
    ? result.structuredContent as Record<string, unknown>
    : { value: result.structuredContent };

  return {
    isError: result.isError,
    content: result.content,
    structuredContent,
  };
}

export function createOpenCapMcpServerHandlers(options: OpenCapMcpServerOptions): OpenCapMcpServerHandlers {
  return {
    listTools: async () => ({
      tools: buildMcpToolsList(options.manifests).tools.map((tool) => toSdkTool(tool)),
    }),
    callTool: async (request) => toSdkCallToolResult(await routeMcpToolCall(
      options.manifests,
      {
        name: request.params.name,
        arguments: request.params.arguments,
      },
      options,
    )),
  };
}

export function createOpenCapMcpServer(options: OpenCapMcpServerOptions): Server {
  const server = new Server(
    {
      name: options.serverName ?? "opencap",
      version: options.serverVersion ?? "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  const handlers = createOpenCapMcpServerHandlers(options);

  server.setRequestHandler(ListToolsRequestSchema, async () => handlers.listTools());
  server.setRequestHandler(CallToolRequestSchema, async (request) => handlers.callTool(request));

  return server;
}

export async function connectOpenCapMcpStdioServer(
  server: Server,
  transport = new StdioServerTransport(),
): Promise<void> {
  await server.connect(transport);
}

export interface OpenCapMcpServerFromStateOptions {
  cwd?: string;
  stateDir?: string;
  env?: Record<string, string | undefined>;
}

export async function createOpenCapMcpServerFromState(options: OpenCapMcpServerFromStateOptions = {}): Promise<Server> {
  const env = options.env ?? process.env;
  const loaded = await loadInstalledCapabilities({ cwd: options.cwd, stateDir: options.stateDir, env });
  const policySet = await loadPolicySet({ cwd: options.cwd, stateDir: options.stateDir, env });
  const auditLogger = new SqliteAuditLogger({ cwd: options.cwd, stateDir: options.stateDir, env });

  return createOpenCapMcpServer({
    manifests: loaded.capabilities.map((capability) => capability.manifest),
    policySet,
    auditLogger,
    execute: async (manifest, input) => resultEnvelopeFromHttpExecutionResult(
      await executeHttpCapability(manifest, input, {
        env,
        auditLogger,
        channel: "mcp",
      }),
    ),
  });
}

export async function serveOpenCapMcpStdio(options: OpenCapMcpServerFromStateOptions = {}): Promise<void> {
  await connectOpenCapMcpStdioServer(await createOpenCapMcpServerFromState(options));
}
