import { describe, expect, it } from "vitest";
import { InMemoryAuditLogger, parsePolicyYml } from "@opencap/runtime";
import {
  McpToolNameCollisionError,
  buildMcpToolNameMap,
  buildMcpToolsList,
  routeMcpToolCall,
} from "./index.js";

function manifest(id = "github.create_issue") {
  return {
    id,
    name: `Capability ${id}`,
    description: `Run ${id}`,
    version: "0.1.0",
    type: "http" as const,
    input: { type: "object", properties: { title: { type: "string" } } },
    output: { type: "object", properties: { url: { type: "string" } } },
    auth: { type: "none" as const },
    permissions: [
      {
        resource: id,
        action: "run",
        risk: "read_only" as const,
        confirmation: "allow" as const,
      },
    ],
    execution: { method: "GET" as const },
    metadata: { trust_level: "experimental" },
  };
}

describe("MCP tool mapping contract", () => {
  it("maps valid capability ids deterministically and reports collisions", () => {
    const mapping = buildMcpToolNameMap([
      { id: "github.create_issue" },
      { id: "github.search_repo_v2" },
      { id: "vercel.get_deployments" },
    ]);

    let collision: Pick<McpToolNameCollisionError, "name" | "message" | "toolName" | "capabilityIds"> | undefined;
    try {
      buildMcpToolNameMap([{ id: "foo.bar_baz" }, { id: "foo_bar.baz" }]);
    } catch (error) {
      if (!(error instanceof McpToolNameCollisionError)) {
        throw error;
      }
      collision = {
        name: error.name,
        message: error.message,
        toolName: error.toolName,
        capabilityIds: error.capabilityIds,
      };
    }

    expect({ mapping, collision }).toMatchInlineSnapshot(`
      {
        "collision": {
          "capabilityIds": [
            "foo.bar_baz",
            "foo_bar.baz",
          ],
          "message": "MCP tool name collision for foo_bar_baz: foo.bar_baz, foo_bar.baz",
          "name": "McpToolNameCollisionError",
          "toolName": "foo_bar_baz",
        },
        "mapping": [
          {
            "capabilityId": "github.create_issue",
            "toolName": "github_create_issue",
          },
          {
            "capabilityId": "github.search_repo_v2",
            "toolName": "github_search_repo_v2",
          },
          {
            "capabilityId": "vercel.get_deployments",
            "toolName": "vercel_get_deployments",
          },
        ],
      }
    `);
  });

  it("projects tools/list with mapped names, original ids, and schemas", () => {
    const toolsList = buildMcpToolsList([
      manifest("github.create_issue"),
      manifest("github.search_repo"),
    ]);

    expect(toolsList).toMatchInlineSnapshot(`
      {
        "tools": [
          {
            "description": "Capability github.create_issue. Capability: github.create_issue. Purpose: Run github.create_issue. Permissions: github.create_issue:run:read_only:allow. Risk: read_only. Confirmation: read-only actions can run when policy allows.",
            "inputSchema": {
              "properties": {
                "title": {
                  "type": "string",
                },
              },
              "type": "object",
            },
            "metadata": {
              "capabilityId": "github.create_issue",
              "projectionHash": "sha256:b9f79459baa120115a317e452eabcdd27d84c9cb06230d299ba5b40e3fa8a9f6",
              "projectionVersion": "opencap.mcp.tool-projection.v1",
            },
            "name": "github_create_issue",
            "outputSchema": {
              "properties": {
                "url": {
                  "type": "string",
                },
              },
              "type": "object",
            },
            "title": "Capability github.create_issue",
          },
          {
            "description": "Capability github.search_repo. Capability: github.search_repo. Purpose: Run github.search_repo. Permissions: github.search_repo:run:read_only:allow. Risk: read_only. Confirmation: read-only actions can run when policy allows.",
            "inputSchema": {
              "properties": {
                "title": {
                  "type": "string",
                },
              },
              "type": "object",
            },
            "metadata": {
              "capabilityId": "github.search_repo",
              "projectionHash": "sha256:6689e9434bc3e160aa5b20c3994c3b45be329d2cb16873f082f3bc6ef1b6a2b9",
              "projectionVersion": "opencap.mcp.tool-projection.v1",
            },
            "name": "github_search_repo",
            "outputSchema": {
              "properties": {
                "url": {
                  "type": "string",
                },
              },
              "type": "object",
            },
            "title": "Capability github.search_repo",
          },
        ],
      }
    `);
  });

  it("routes tools/call only through mapped tool names", async () => {
    const logger = new InMemoryAuditLogger();
    const calls: Array<{ id: string; input: unknown }> = [];
    const manifests = [manifest("github.create_issue")];

    const originalIdResult = await routeMcpToolCall(manifests, { name: "github.create_issue", arguments: { title: "Bug" } }, {
      policySet: parsePolicyYml("default: allow\nrules: []\n"),
      auditLogger: logger,
      execute: async (capability, input) => {
        calls.push({ id: capability.id, input });
        return { ok: true };
      },
    });

    const mappedNameResult = await routeMcpToolCall(manifests, { name: "github_create_issue", arguments: { title: "Bug" } }, {
      policySet: parsePolicyYml("default: allow\nrules: []\n"),
      auditLogger: logger,
      execute: async (capability, input) => {
        calls.push({ id: capability.id, input });
        return { ok: true, id: capability.id };
      },
    });

    const auditEvents = logger.events.map((event) => ({
      capabilityId: event.capabilityId,
      channel: event.channel,
      policyDecision: event.policyDecision,
      confirmationStatus: event.confirmationStatus,
      status: event.status,
      reason: event.reason,
      evaluatedFacts: event.policyTrace?.evaluatedFacts,
    }));

    expect({ originalIdResult, mappedNameResult, calls, auditEvents }).toMatchInlineSnapshot(`
      {
        "auditEvents": [
          {
            "capabilityId": "github.create_issue",
            "channel": "mcp",
            "confirmationStatus": "approved",
            "evaluatedFacts": [
              "capability_id=github.create_issue",
              "permission_count=1",
              "channel=mcp",
              "resource=github.create_issue",
              "action=run",
              "risk=read_only",
            ],
            "policyDecision": "allow",
            "reason": "Policy allowed without confirmation.",
            "status": "executed",
          },
        ],
        "calls": [
          {
            "id": "github.create_issue",
            "input": {
              "title": "Bug",
            },
          },
        ],
        "mappedNameResult": {
          "content": [
            {
              "text": "Tool call completed.",
              "type": "text",
            },
          ],
          "isError": false,
          "structuredContent": {
            "id": "github.create_issue",
            "ok": true,
          },
        },
        "originalIdResult": {
          "content": [
            {
              "text": "Unknown MCP tool: github.create_issue",
              "type": "text",
            },
          ],
          "isError": true,
          "structuredContent": {
            "error": {
              "code": "TOOL_NOT_FOUND",
              "toolName": "github.create_issue",
            },
          },
        },
      }
    `);
  });
});
