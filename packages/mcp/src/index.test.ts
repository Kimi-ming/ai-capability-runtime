import { describe, expect, it } from "vitest";
import { InMemoryAuditLogger, parsePolicyYml } from "@opencap/runtime";
import {
  McpToolNameCollisionError,
  buildMcpToolNameMap,
  buildMcpToolsList,
  capabilityIdToMcpToolName,
  describeCapabilityAsTool,
  routeMcpToolCall,
} from "./index.js";

function manifest() {
  return {
    id: "github.create_issue",
    name: "Create GitHub Issue",
    description: "Create a GitHub issue.",
    version: "0.1.0",
    type: "http" as const,
    input: { type: "object" },
    output: { type: "object" },
    auth: { type: "none" },
    permissions: [
      {
        resource: "github.issue",
        action: "create",
        risk: "write" as const,
        confirmation: "ask" as const,
      },
    ],
    execution: { method: "POST" },
    metadata: { trust_level: "experimental" },
  };
}


describe("MCP tools/call routing", () => {
  it("routes allowed tool calls to the executor", async () => {
    const logger = new InMemoryAuditLogger();
    const result = await routeMcpToolCall([manifest()], { name: "github_create_issue", arguments: { title: "Bug" } }, {
      policySet: parsePolicyYml("default: allow\nrules: []\n"),
      auditLogger: logger,
      execute: async (_manifest, input) => ({ ok: true, input }),
    });

    expect(result).toMatchObject({
      isError: false,
      structuredContent: { ok: true, input: { title: "Bug" } },
    });
    expect(logger.events).toHaveLength(1);
    expect(logger.events[0]).toMatchObject({ status: "executed", confirmationStatus: "approved" });
  });

  it("returns structured errors for denied tool calls", async () => {
    const logger = new InMemoryAuditLogger();
    const result = await routeMcpToolCall([manifest()], { name: "github_create_issue", arguments: { title: "Bug" } }, {
      policySet: parsePolicyYml("default: deny\nrules: []\n"),
      auditLogger: logger,
      execute: async () => { throw new Error("should not execute"); },
    });

    expect(result).toMatchObject({
      isError: true,
      structuredContent: { error: { code: "POLICY_DENIED" } },
    });
    expect(logger.events[0]).toMatchObject({ status: "denied", confirmationStatus: "denied" });
  });

  it("returns confirmation_required for ask decisions without MCP elicitation", async () => {
    const logger = new InMemoryAuditLogger();
    const result = await routeMcpToolCall([manifest()], { name: "github_create_issue", arguments: { title: "Bug" } }, {
      policySet: parsePolicyYml("default: ask\nrules: []\n"),
      auditLogger: logger,
      execute: async () => { throw new Error("should not execute"); },
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: "text",
          text: "Confirmation required before running capability github.create_issue. OpenCap V1 does not create confirmation tokens. Update policy in the CLI/Console or retry from a future MCP elicitation-capable host.",
        },
      ],
      structuredContent: {
        error: {
          code: "CONFIRMATION_REQUIRED",
          message: "This capability requires human confirmation, but this MCP channel cannot prompt.",
        },
        metadata: {
          capabilityId: "github.create_issue",
          policyDecision: "ask",
          retry: {
            token: null,
            hint: "OpenCap V1 does not create confirmation tokens. Update policy in the CLI/Console or retry from a future MCP elicitation-capable host.",
          },
        },
      },
    });
    expect(logger.events[0]).toMatchObject({ status: "blocked", confirmationStatus: "confirmation_required" });
  });
});

describe("MCP tool name mapping", () => {
  it("maps capability ids to MCP-safe tool names", () => {
    expect(capabilityIdToMcpToolName("github.create_issue")).toBe("github_create_issue");
  });

  it("builds a stable mapping table preserving original ids", () => {
    expect(buildMcpToolNameMap([{ id: "github.create_issue" }, { id: "vercel.get_deployments" }])).toEqual([
      { capabilityId: "github.create_issue", toolName: "github_create_issue" },
      { capabilityId: "vercel.get_deployments", toolName: "vercel_get_deployments" },
    ]);
  });

  it("detects tool name collisions", () => {
    expect(() => buildMcpToolNameMap([{ id: "foo.bar_baz" }, { id: "foo_bar.baz" }])).toThrow(
      McpToolNameCollisionError,
    );
  });


  it("builds a tools/list payload from installed capability manifests", () => {
    const result = buildMcpToolsList([manifest()]);

    expect(result).toEqual({
      tools: [
        expect.objectContaining({
          name: "github_create_issue",
          title: "Create GitHub Issue",
          inputSchema: { type: "object" },
          description: expect.stringContaining("Risk: write"),
          metadata: expect.objectContaining({ capabilityId: "github.create_issue" }),
        }),
      ],
    });
  });

  it("fails tools/list when projected tool names collide", () => {
    expect(() => buildMcpToolsList([
      { ...manifest(), id: "foo.bar_baz" },
      { ...manifest(), id: "foo_bar.baz" },
    ])).toThrow(McpToolNameCollisionError);
  });

  it("includes original capability id in tool metadata", () => {
    expect(describeCapabilityAsTool(manifest())).toMatchObject({
      name: "github_create_issue",
      metadata: {
        capabilityId: "github.create_issue",
      },
    });
  });
});
