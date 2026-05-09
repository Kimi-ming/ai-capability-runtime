#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { Command } from "commander";
import { isAbsolute, resolve } from "node:path";
import YAML from "yaml";
import { formatManifestValidationIssue, validateManifestPath } from "@opencap/spec";
import {
  InstallCapabilityError,
  SqliteAuditLogger,
  type AuditInvocationStatus,
  getLocalStatePaths,
  installCapability,
  listInstalledCapabilities,
  resolveRegistryDir,
} from "@opencap/runtime";

const program = new Command();

type CliExitCode = 1 | 2;

interface NodeError extends Error {
  code?: string;
}

const USER_ERROR_CODES = new Set(["ENOENT", "ENOTDIR", "EACCES", "EPERM"]);

function setCliError(message: string, exitCode: CliExitCode): void {
  console.error(message);
  process.exitCode = exitCode;
}

function isNodeError(error: unknown): error is NodeError {
  return error instanceof Error;
}

function handleCliError(error: unknown, fallbackMessage: string): void {
  if (error instanceof InstallCapabilityError) {
    setCliError(error.message, 1);
    return;
  }

  if (isNodeError(error) && error.code && USER_ERROR_CODES.has(error.code)) {
    setCliError(error.message, 1);
    return;
  }

  setCliError(error instanceof Error ? error.message : fallbackMessage, 2);
}


async function pathStatus(path: string): Promise<"ok" | "missing"> {
  try {
    await stat(path);
    return "ok";
  } catch {
    return "missing";
  }
}

async function writableStatus(path: string): Promise<"ok" | "missing" | "not_writable"> {
  try {
    await access(path, fsConstants.W_OK);
    return "ok";
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return "missing";
    }
    return "not_writable";
  }
}

function pnpmVersion(): string {
  const result = spawnSync("pnpm", ["--version"], { encoding: "utf8" });
  if (result.status !== 0) {
    return "missing";
  }
  return result.stdout.trim() || "unknown";
}

function parseLimit(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid --limit value: ${value}`);
  }

  return parsed;
}

const AUDIT_INVOCATION_STATUSES = new Set<AuditInvocationStatus>(["blocked", "denied", "executed"]);

function parseAuditStatus(value: string | undefined): AuditInvocationStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!AUDIT_INVOCATION_STATUSES.has(value as AuditInvocationStatus)) {
    throw new Error(`Invalid --status value: ${value}`);
  }

  return value as AuditInvocationStatus;
}

function parseSince(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Invalid --since value: ${value}`);
  }

  return timestamp.toISOString();
}

function formatLogLine(event: {
  timestamp: string;
  capabilityId: string;
  policyDecision: string;
  status: string;
  confirmationStatus: string;
  reason: string;
}): string {
  return [
    event.timestamp,
    event.capabilityId,
    event.policyDecision,
    event.status,
    event.confirmationStatus,
    "-",
    event.reason,
  ].join(" ");
}

async function policyStatus(policyPath: string): Promise<string> {
  try {
    const raw = await readFile(policyPath, "utf8");
    YAML.parse(raw);
    return "ok";
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return "missing_default_ask";
    }
    return "invalid";
  }
}

async function runCliAction(action: () => Promise<void>, fallbackMessage: string): Promise<void> {
  try {
    await action();
  } catch (error) {
    handleCliError(error, fallbackMessage);
  }
}


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
  .action((path: string) => runCliAction(async () => {
    const targetPath = isAbsolute(path) ? path : resolve(process.env.INIT_CWD ?? process.cwd(), path);
    const result = await validateManifestPath(targetPath);

    if (result.manifests.length === 0) {
      setCliError(`No manifests found under ${path}`, 1);
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
  }, "Failed to validate manifests"));

program
  .command("install")
  .argument("<id>", "Capability id")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--registry <path>", "Registry root directory")
  .option("--force", "Replace an existing installed Capability")
  .description("Install a Capability from the registry.")
  .action((id: string, options: { stateDir?: string; registry?: string; force?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const result = await installCapability({
      id,
      cwd,
      env: process.env,
      stateDir: options.stateDir,
      registryDir: options.registry,
      force: options.force,
    });

    console.log(`Installed ${result.id} to ${result.destinationDir}`);
  }, `Failed to install ${id}`));

program
  .command("list")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .description("List installed Capabilities.")
  .action((options: { stateDir?: string; json?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const installed = await listInstalledCapabilities({ cwd, env: process.env, stateDir: options.stateDir });

    if (options.json) {
      console.log(JSON.stringify(installed, null, 2));
      return;
    }

    if (installed.length === 0) {
      console.log("No installed capabilities found.");
      return;
    }

    console.log("id version type risk trust status");
    for (const capability of installed) {
      console.log(
        `${capability.id} ${capability.version ?? "-"} ${capability.type ?? "-"} ${capability.risk} ${capability.trustLevel ?? "-"} ${capability.status}`,
      );
    }
  }, "Failed to list installed capabilities"));



program
  .command("doctor")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--registry <path>", "Registry root directory")
  .description("Check local OpenCap development environment health.")
  .action((options: { stateDir?: string; registry?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const registryDir = resolveRegistryDir({ cwd, env: process.env, registryDir: options.registry });
    const statePaths = getLocalStatePaths({ cwd, env: process.env, stateDir: options.stateDir });
    const installed = await listInstalledCapabilities({ cwd, env: process.env, stateDir: options.stateDir });
    const invalidInstalled = installed.filter((capability) => capability.status === "invalid");

    console.log("OpenCap doctor");
    console.log(`node: ${process.version}`);
    console.log(`pnpm: ${pnpmVersion()}`);
    console.log(`registry: ${await pathStatus(registryDir)} ${registryDir}`);
    console.log(`state_dir: ${await pathStatus(statePaths.root)} ${statePaths.root}`);
    console.log(`state_dir_writable: ${await writableStatus(statePaths.root)}`);
    console.log(`installed: ${installed.length} total, ${invalidInstalled.length} invalid`);
    console.log(`policy: ${await policyStatus(statePaths.policiesFile)} ${statePaths.policiesFile}`);
  }, "Failed to run doctor"));

program
  .command("invoke")
  .argument("<id>", "Capability id")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--input <file>", "JSON input file")
  .option("--dry-run", "Build an invocation plan without external execution")
  .description("Invoke an installed Capability.")
  .action((id: string, _options: { stateDir?: string; input?: string; dryRun?: boolean }) => {
    console.log(`invoke is not implemented yet for ${id}`);
  });

program
  .command("serve")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--mcp", "Expose installed Capabilities as MCP tools")
  .description("Start the OpenCap runtime.")
  .action((options: { stateDir?: string; mcp?: boolean }) => {
    console.log(options.mcp ? "MCP runtime is not implemented yet" : "runtime is not implemented yet");
  });

program
  .command("logs")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--limit <number>", "Number of recent log entries to show", "20")
  .option("--capability <id>", "Filter logs by Capability id")
  .option("--status <status>", "Filter logs by status: blocked, denied, executed")
  .option("--since <iso-time>", "Filter logs at or after an ISO timestamp")
  .description("Show invocation logs.")
  .action((options: { stateDir?: string; json?: boolean; limit?: string; capability?: string; status?: string; since?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const limit = parseLimit(options.limit, 20);
    const query = {
      capabilityId: options.capability,
      status: parseAuditStatus(options.status),
      since: parseSince(options.since),
    };
    const logger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });

    try {
      const events = await logger.recent(limit, query);

      if (options.json) {
        console.log(JSON.stringify(events, null, 2));
        return;
      }

      if (events.length === 0) {
        console.log("No invocation logs found.");
        return;
      }

      console.log("timestamp capability_id decision status confirmation duration_ms reason");
      for (const event of events) {
        console.log(formatLogLine(event));
      }
    } finally {
      logger.close();
    }
  }, "Failed to read invocation logs"));

const argv = process.argv[2] === "--" ? [process.argv[0], process.argv[1], ...process.argv.slice(3)] : process.argv;

await program.parseAsync(argv);
