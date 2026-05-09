import { describe, expect, it } from "vitest";
import {
  McpToolNameCollisionError,
  buildMcpToolNameMap,
  capabilityIdToMcpToolName,
  describeCapabilityAsTool,
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

  it("includes original capability id in tool metadata", () => {
    expect(describeCapabilityAsTool(manifest())).toMatchObject({
      name: "github_create_issue",
      metadata: {
        capabilityId: "github.create_issue",
      },
    });
  });
});
