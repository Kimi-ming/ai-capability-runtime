#!/usr/bin/env node
import { Command } from "commander";

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
  .action((path: string) => {
    console.log(`validate is scaffolded for ${path}`);
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

program.parse();
