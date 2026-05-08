#!/usr/bin/env node
import { Command } from "commander";
import { isAbsolute, resolve } from "node:path";
import { formatManifestValidationIssue, validateManifestPath } from "@opencap/spec";

const program = new Command();

program
  .name("opencap")
  .description("OpenCap CLI for Capability development and runtime control.")
  .version("0.1.0");

program
  .command("init")
  .argument("[id]", "Capability id, for example github.create_issue")
  .description("Create a new Capability skeleton.")
  .action((id?: string) => {
    console.log(`init is not implemented yet${id ? ` for ${id}` : ""}`);
  });

program
  .command("validate")
  .argument("[path]", "Capability or registry path", ".")
  .description("Validate Capability manifests.")
  .action(async (path: string) => {
    try {
      const targetPath = isAbsolute(path) ? path : resolve(process.env.INIT_CWD ?? process.cwd(), path);
      const result = await validateManifestPath(targetPath);

      if (result.manifests.length === 0) {
        console.error(`No manifests found under ${path}`);
        process.exitCode = 1;
        return;
      }

      for (const valid of result.valid) {
        console.log(`Valid manifest: ${valid.filePath}`);
      }

      for (const invalid of result.invalid) {
        console.error(`Invalid manifest: ${invalid.filePath}`);
        for (const issue of invalid.issues) {
          console.error(`  ${formatManifestValidationIssue(issue)}`);
        }
      }

      if (result.invalid.length > 0) {
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Failed to validate manifests");
      process.exitCode = 1;
    }
  });

program
  .command("install")
  .argument("<id>", "Capability id")
  .description("Install a Capability from the registry.")
  .action((id: string) => {
    console.log(`install is not implemented yet for ${id}`);
  });

program
  .command("list")
  .description("List installed Capabilities.")
  .action(() => {
    console.log("list is not implemented yet");
  });

program
  .command("serve")
  .option("--mcp", "Expose installed Capabilities as MCP tools")
  .description("Start the OpenCap runtime.")
  .action((options: { mcp?: boolean }) => {
    console.log(options.mcp ? "MCP runtime is not implemented yet" : "runtime is not implemented yet");
  });

program
  .command("logs")
  .description("Show invocation logs.")
  .action(() => {
    console.log("logs is not implemented yet");
  });

await program.parseAsync();
