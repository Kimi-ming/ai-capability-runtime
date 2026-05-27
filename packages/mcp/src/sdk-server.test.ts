import { describe, expect, it } from "vitest";
import { InMemoryAuditLogger, parsePolicyYml } from "@opencap/runtime";
import {
  MCP_TYPESCRIPT_SDK_PACKAGE,
  MCP_TYPESCRIPT_SDK_VERSION_RANGE,
  createOpenCapMcpServer,
  createOpenCapMcpServerHandlers,
  createOpenCapMcpServerFromState,
} from "./index.js";
import type { CapabilityManifest } from "@opencap/spec";

function manifest(): CapabilityManifest {
  return {
    id: "github.create_issue",
    name: "Create GitHub Issue",
    description: "Create a GitHub issue.",
    version: "0.1.0",
    type: "http",
    input: { type: "object" },
    output: { type: "object" },
    auth: { type: "none" },
    permissions: [
      {
        resource: "github.issue",
        action: "create",
        risk: "write",
        confirmation: "ask",
      },
    ],
    execution: { method: "POST" },
    metadata: { trust_level: "experimental" },
  };
}

describe("MCP SDK server wiring", () => {
  it("records the selected official TypeScript SDK dependency", () => {
    expect(MCP_TYPESCRIPT_SDK_PACKAGE).toBe("@modelcontextprotocol/sdk");
    expect(MCP_TYPESCRIPT_SDK_VERSION_RANGE).toBe("^1.29.0");
  });

  it("exposes tools/list and tools/call handlers backed by existing OpenCap adapters", async () => {
    const auditLogger = new InMemoryAuditLogger();
    const handlers = createOpenCapMcpServerHandlers({
      manifests: [manifest()],
      policySet: parsePolicyYml("default: allow\nrules: []\n"),
      auditLogger,
      execute: async (_manifest, input) => ({ ok: true, input }),
    });

    await expect(handlers.listTools()).resolves.toMatchObject({
      tools: [
        {
          name: "github_create_issue",
          title: "Create GitHub Issue",
          inputSchema: { type: "object" },
          _meta: {
            capabilityId: "github.create_issue",
            projectionVersion: "opencap.mcp.tool-projection.v1",
          },
        },
      ],
    });
    await expect(handlers.callTool({ params: { name: "github_create_issue", arguments: { title: "Bug" } } })).resolves.toMatchObject({
      isError: false,
      structuredContent: { ok: true, input: { title: "Bug" } },
    });
    expect(auditLogger.events).toHaveLength(1);
  });

  it("builds an SDK Server without connecting or writing to stdio", () => {
    const server = createOpenCapMcpServer({
      manifests: [manifest()],
      policySet: parsePolicyYml("default: allow\nrules: []\n"),
      auditLogger: new InMemoryAuditLogger(),
      execute: async (_manifest, input) => ({ ok: true, input }),
    });

    expect(server).toMatchObject({});
    expect(server.connect).toBeTypeOf("function");
  });

  it("exposes a state-backed server factory for opencap serve --mcp", async () => {
    const server = await createOpenCapMcpServerFromState({
      stateDir: `/private/tmp/opencap-mcp-missing-state-${Date.now()}`,
      env: {},
    });

    expect(server.connect).toBeTypeOf("function");
  });
});
