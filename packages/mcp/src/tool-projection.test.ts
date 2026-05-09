import { describe, expect, it } from "vitest";
import { buildMcpToolProjection, MCP_TOOL_PROJECTION_VERSION } from "./tool-projection.js";

function manifest() {
  return {
    id: "github.create_issue",
    name: "Create GitHub Issue",
    description: "Create a GitHub issue.",
    version: "0.1.0",
    type: "http" as const,
    input: { type: "object", properties: { title: { type: "string" } } },
    output: { type: "object", properties: { issue_url: { type: "string" } } },
    auth: { type: "none" as const },
    permissions: [
      {
        resource: "github.issue",
        action: "create",
        risk: "write" as const,
        confirmation: "ask" as const,
      },
    ],
    execution: { method: "POST" as const },
    metadata: { trust_level: "experimental" },
  };
}

describe("MCP tool projection builder", () => {
  it("builds runtime-owned model-visible metadata without reading package docs", () => {
    const projection = buildMcpToolProjection(manifest());

    expect(projection).toMatchObject({
      projectionVersion: MCP_TOOL_PROJECTION_VERSION,
      capabilityId: "github.create_issue",
      toolName: "github_create_issue",
      title: "Create GitHub Issue",
      inputSchema: { type: "object", properties: { title: { type: "string" } } },
      outputSchema: { type: "object", properties: { issue_url: { type: "string" } } },
    });
    expect(projection.description).toContain("Capability: github.create_issue.");
    expect(projection.description).toContain("Permissions: github.issue:create:write.");
    expect(projection.description).toContain("Risk: write.");
  });
});
