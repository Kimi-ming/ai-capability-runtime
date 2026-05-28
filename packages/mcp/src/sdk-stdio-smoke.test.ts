import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CompatibilityCallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { installCapability } from "@opencap/runtime";
import { describe, expect, it } from "vitest";

const testSourceFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testSourceFile), "../../..");
const cliEntry = resolve(repoRoot, "packages/cli/src/index.ts");
const tsxBin = resolve(repoRoot, "packages/cli/node_modules/.bin/tsx");

describe("OpenCap MCP stdio smoke", () => {
  it("serves installed capabilities over stdio without polluting stdout", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "opencap-mcp-stdio-smoke-"));
    await installCapability({ cwd: repoRoot, stateDir, id: "github.search_repo", force: true, env: {} });
    await installCapability({ cwd: repoRoot, stateDir, id: "github.create_issue", force: true, env: {} });
    await writeFile(join(stateDir, "policies.yml"), `default: ask
rules:
  - id: allow-read-only
    match:
      risk: read_only
    decision: allow
`, "utf8");

    const client = new Client({ name: "opencap-stdio-smoke", version: "0.1.0" });
    const transport = new StdioClientTransport({
      command: tsxBin,
      args: [cliEntry, "serve", "--mcp", "--state-dir", stateDir],
      cwd: repoRoot,
      env: { ...process.env, INIT_CWD: repoRoot },
      stderr: "pipe",
    });
    const stderrChunks: Buffer[] = [];
    transport.stderr?.on("data", (chunk: Buffer | string) => {
      stderrChunks.push(Buffer.from(chunk));
    });

    try {
      await client.connect(transport);

      const tools = await client.listTools();
      expect(tools.tools).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "github_search_repo",
          inputSchema: expect.objectContaining({ type: "object" }),
          _meta: expect.objectContaining({ capabilityId: "github.search_repo" }),
        }),
        expect.objectContaining({
          name: "github_create_issue",
          description: expect.stringContaining("Risk: write"),
          _meta: expect.objectContaining({ capabilityId: "github.create_issue" }),
        }),
      ]));

      const readOnlyResult = await client.request({
        method: "tools/call",
        params: {
          name: "github_search_repo",
          arguments: { query: "opencap", kind: "repositories" },
        },
      }, CompatibilityCallToolResultSchema);
      expect(readOnlyResult.isError).toBe(true);
      expect(readOnlyResult.structuredContent).toMatchObject({
        error: { code: "SECRET_MISSING" },
      });

      const writeResult = await client.request({
        method: "tools/call",
        params: {
          name: "github_create_issue",
          arguments: { owner: "opencap", repo: "runtime", title: "Bug" },
        },
      }, CompatibilityCallToolResultSchema);
      expect(writeResult.isError).toBe(true);
      expect(writeResult.structuredContent).toMatchObject({
        error: { code: "CONFIRMATION_REQUIRED" },
        metadata: {
          capabilityId: "github.create_issue",
          policyDecision: "ask",
        },
      });
    } catch (error) {
      const stderrOutput = Buffer.concat(stderrChunks).toString("utf8").trim();
      if (stderrOutput.length > 0) {
        throw new Error(`${error instanceof Error ? error.message : String(error)}\nServer stderr:\n${stderrOutput}`, { cause: error });
      }
      throw error;
    } finally {
      await client.close();
      await rm(stateDir, { recursive: true, force: true });
    }
  }, 60_000);
});
