#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { Command } from "commander";
import { isAbsolute, resolve } from "node:path";
import YAML from "yaml";
import { formatManifestValidationIssue, validateManifestPath, type CapabilityManifest } from "@opencap/spec";
import { serveOpenCapMcpStdio } from "@opencap/mcp";
import {
  InstallCapabilityError,
  FileRuntimeLedgerStore,
  SqliteAuditLogger,
  RuntimeLedgerAuditLogger,
  type AuditInvocationStatus,
  CliConfirmationHandler,
  blockedResultEnvelope,
  buildHttpDryRunPlan,
  createCapabilityCard,
  createTrustCardFromInstalledCapability,
  createCapabilityLedgerIdentity,
  createCapabilityIdentity,
  createCapabilityLifecycleWarning,
  createConfirmationAuditEvent,
  createConsentReceiptAuditEvidence,
  evaluatePolicy,
  executeHttpCapability,
  exportDecisionLogRecords,
  getLocalStatePaths,
  hashInput,
  installCapability,
  listInstalledCapabilities,
  loadInstalledCapabilities,
  loadPolicySet,
  redactInput,
  resolveRegistryDir,
  resultEnvelopeFromDryRunPlan,
  resultEnvelopeFromHttpExecutionResult,
  stableJsonStringify,
  simulatePolicyDiff,
  validatePolicyYml,
  type CapabilityLifecycleWarning,
  type CapabilityLifecycleState,
  type InstalledCapability,
  type InstalledCapabilityRecord,
  type LedgerRecordKind,
  type LedgerRecordV1,
  type TrustSummary,
  type PolicyDecision,
  type PolicySimulationScenario,
  type RiskSummary,
  type ResultEnvelopeV1,
} from "@opencap/runtime";

const program = new Command();

type CliExitCode = 1 | 2;

interface NodeError extends Error {
  code?: string;
}

class CliUserInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUserInputError";
  }
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

  if (error instanceof CliUserInputError) {
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
    throw new CliUserInputError(`Invalid --limit value: ${value}`);
  }

  return parsed;
}

const AUDIT_INVOCATION_STATUSES = new Set<AuditInvocationStatus>(["blocked", "denied", "executed", "dry_run"]);

const POLICY_DECISION_VALUES = new Set<PolicyDecision>(["allow", "ask", "deny"]);
const LEDGER_RECORD_KINDS = new Set<LedgerRecordKind>(["capability", "policy", "invocation", "compatibility"]);

function parseLedgerKind(value: string | undefined): LedgerRecordKind | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!LEDGER_RECORD_KINDS.has(value as LedgerRecordKind)) {
    throw new CliUserInputError(`Invalid --kind value: ${value}`);
  }

  return value as LedgerRecordKind;
}

function parsePolicyDecision(value: string | undefined): PolicyDecision | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!POLICY_DECISION_VALUES.has(value as PolicyDecision)) {
    throw new CliUserInputError(`Invalid --decision value: ${value}`);
  }

  return value as PolicyDecision;
}

function formatDecisionLogLine(record: {
  timestamp: string;
  invocationId: string;
  capabilityId: string;
  policyDecision: string;
  status: string;
  policyRevision?: string;
  traceId?: string;
  reasonCode?: string;
}): string {
  return [
    record.timestamp,
    record.invocationId,
    record.capabilityId,
    record.policyDecision,
    record.status,
    record.policyRevision ?? "-",
    record.traceId ?? "-",
    record.reasonCode ?? "-",
  ].join(" ");
}

function ledgerRecordCapabilityId(record: LedgerRecordV1): string | undefined {
  if (record.recordKind === "policy") {
    return undefined;
  }

  return record.capability?.id;
}

function formatLedgerLine(record: LedgerRecordV1): string {
  return [
    record.recordedAt,
    record.recordKind,
    ledgerRecordCapabilityId(record) ?? "-",
    "status" in record ? record.status : "event" in record ? record.event : "result" in record ? record.result : "-",
    record.recordId,
  ].join(" ");
}

function parseAuditStatus(value: string | undefined): AuditInvocationStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!AUDIT_INVOCATION_STATUSES.has(value as AuditInvocationStatus)) {
    throw new CliUserInputError(`Invalid --status value: ${value}`);
  }

  return value as AuditInvocationStatus;
}

function parseSince(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new CliUserInputError(`Invalid --since value: ${value}`);
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


function resolveCliPath(path: string): string {
  return isAbsolute(path) ? path : resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

async function parseInvokeInput(options: { input?: string; inputJson?: string }): Promise<unknown> {
  if (options.input !== undefined && options.inputJson !== undefined) {
    throw new CliUserInputError("Use either --input or --input-json, not both.");
  }

  if (options.inputJson !== undefined) {
    try {
      return JSON.parse(options.inputJson);
    } catch {
      throw new CliUserInputError("Invalid --input-json value: expected valid JSON.");
    }
  }

  if (options.input !== undefined) {
    const inputPath = resolveCliPath(options.input);
    try {
      return JSON.parse(await readFile(inputPath, "utf8"));
    } catch (error) {
      if (isNodeError(error) && error.code && USER_ERROR_CODES.has(error.code)) {
        throw error;
      }
      throw new CliUserInputError(`Invalid --input JSON file: ${options.input}`);
    }
  }

  return {};
}


function cliEnvelopeSubset(envelope: ResultEnvelopeV1, verbose: boolean | undefined): Omit<ResultEnvelopeV1, "evidence"> | ResultEnvelopeV1 {
  if (verbose) {
    return envelope;
  }

  const { evidence: _evidence, ...withoutEvidence } = envelope;
  return withoutEvidence;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function egressPreviewFromEnvelope(envelope: ResultEnvelopeV1): Record<string, unknown> | undefined {
  if (!isRecord(envelope.structuredContent) || !isRecord(envelope.structuredContent.egressPreview)) {
    return undefined;
  }

  return envelope.structuredContent.egressPreview;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function printEgressPreview(preview: Record<string, unknown>): void {
  console.log("egress preview:");

  if (typeof preview.targetOrigin === "string") {
    console.log(`target: ${preview.targetOrigin}`);
  }

  const dataClasses = stringArray(preview.dataClasses);
  console.log(`data classes: ${dataClasses.length === 0 ? "none" : dataClasses.join(", ")}`);

  if (!Array.isArray(preview.fieldsSent) || preview.fieldsSent.length === 0) {
    console.log("fields sent: none");
    return;
  }

  console.log("fields sent:");
  for (const field of preview.fieldsSent) {
    if (!isRecord(field)) {
      continue;
    }

    const path = typeof field.path === "string" ? field.path : "<unknown>";
    const destination = typeof field.destination === "string" ? field.destination : "unknown";
    const fieldClasses = stringArray(field.dataClasses);
    const suffix = fieldClasses.length === 0 ? "" : ` [${fieldClasses.join(", ")}]`;
    console.log(`- ${path} -> ${destination}${suffix}`);
  }
}


function parsePolicyScenariosDocument(raw: string): PolicySimulationScenario[] {
  const parsed = YAML.parse(raw) as unknown;
  const scenarios = Array.isArray(parsed) ? parsed : isRecord(parsed) ? parsed.scenarios : undefined;

  if (!Array.isArray(scenarios)) {
    throw new Error("Policy simulation scenarios file must contain a scenarios array.");
  }

  return scenarios.map((scenario, index) => {
    if (!isRecord(scenario)) {
      throw new Error(`Policy simulation scenario at index ${index} must be an object.`);
    }

    return {
      id: String(scenario.id ?? `scenario-${index}`),
      capabilityId: String(scenario.capabilityId ?? scenario.capability_id ?? ""),
      resource: String(scenario.resource ?? ""),
      action: String(scenario.action ?? ""),
      risk: scenario.risk as PolicySimulationScenario["risk"],
      dataClasses: Array.isArray(scenario.dataClasses) ? scenario.dataClasses as PolicySimulationScenario["dataClasses"] : Array.isArray(scenario.data_classes) ? scenario.data_classes as PolicySimulationScenario["dataClasses"] : [],
      targetOrigin: typeof scenario.targetOrigin === "string" ? scenario.targetOrigin : typeof scenario.target_origin === "string" ? scenario.target_origin : undefined,
      expectedDecision: scenario.expectedDecision as PolicySimulationScenario["expectedDecision"],
    };
  });
}

function formatPolicySimulationFinding(finding: {
  severity: string;
  category: string;
  scenarioId: string;
  capabilityId: string;
  beforeDecision: string;
  afterDecision: string;
  risk: string;
  targetOrigin?: string;
}): string {
  const target = finding.targetOrigin === undefined ? "" : ` target=${finding.targetOrigin}`;
  return `${finding.severity} ${finding.category} scenario=${finding.scenarioId} capability=${finding.capabilityId} ${finding.beforeDecision}->${finding.afterDecision} risk=${finding.risk}${target}`;
}

function printPolicyExplain(trace: ResultEnvelopeV1["evidence"]["policyTrace"]): void {
  if (trace === undefined) {
    return;
  }

  console.log("policy explain:");
  console.log(`final decision: ${trace.decision}`);
  console.log(`blocking gate: ${trace.executionAllowed ? "none" : trace.gate}`);
  console.log(`matched rule: ${trace.matchedRuleId ?? "<default>"}`);
  console.log(`reason code: ${trace.reasonCode}`);
  console.log(`policy revision: ${trace.policyRevision}`);
  console.log(`secret resolution: ${trace.secretResolutionAllowed ? "allowed" : "blocked"}`);
  console.log(`execution: ${trace.executionAllowed ? "allowed" : "blocked"}`);

  if (trace.evaluatedFacts.length > 0) {
    console.log("evaluated facts:");
    for (const fact of trace.evaluatedFacts) {
      console.log(`- ${fact}`);
    }
  }
}

function printInvokeResult(envelope: ResultEnvelopeV1, options: { json?: boolean; verbose?: boolean }): void {
  if (options.json) {
    console.log(JSON.stringify(cliEnvelopeSubset(envelope, options.verbose), null, 2));
    return;
  }

  console.log(envelope.textSummary ?? `${envelope.capabilityId} ${envelope.status}.`);
  console.log(`status: ${envelope.status}`);
  if (envelope.warnings.length === 0) {
    console.log("warnings: none");
  } else {
    console.log("warnings:");
    for (const warning of envelope.warnings) {
      console.log(`- ${warning.severity} ${warning.code}: ${warning.message}`);
    }
  }

  const egressPreview = egressPreviewFromEnvelope(envelope);
  if (egressPreview !== undefined) {
    printEgressPreview(egressPreview);
  }

  if (options.verbose) {
    console.log("evidence:");
    console.log(JSON.stringify(envelope.evidence, null, 2));
  }
}

function trustLevelFromMetadata(metadata: Record<string, unknown>): string | undefined {
  return typeof metadata.trust_level === "string" ? metadata.trust_level : undefined;
}

const TRUST_LEVELS = new Set<TrustSummary["level"]>([
  "unverified",
  "listed",
  "tested",
  "maintainer_verified",
  "official",
]);

function trustSummaryFromManifest(manifest: CapabilityManifest): TrustSummary | undefined {
  const trustLevel = trustLevelFromMetadata(manifest.metadata);

  if (trustLevel === undefined || !TRUST_LEVELS.has(trustLevel as TrustSummary["level"])) {
    return undefined;
  }

  return { level: trustLevel as TrustSummary["level"] };
}

const RISK_ORDER: Array<CapabilityManifest["permissions"][number]["risk"]> = [
  "read_only",
  "write",
  "external_send",
  "destructive",
  "financial",
  "code_execution",
  "secret_access",
];

function riskSummaryFromManifest(manifest: CapabilityManifest): RiskSummary {
  const risks = new Set(manifest.permissions.map((permission) => permission.risk));
  const highestRisk = [...RISK_ORDER].reverse().find((risk) => risks.has(risk)) ?? "unknown";

  return {
    highestRisk,
    requiresConfirmation: manifest.permissions.some((permission) => permission.confirmation !== "allow"),
    permissions: manifest.permissions,
  };
}

function sha256Digest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

async function manifestDigest(manifestPath: string): Promise<string> {
  return sha256Digest(await readFile(manifestPath, "utf8"));
}

async function createCapabilityCardForInstalled(capability: InstalledCapability) {
  return createCapabilityCard({
    capability: await createCardInstalledCapabilityRecord(capability),
  });
}

async function createTrustCardForInstalled(capability: InstalledCapability) {
  return createTrustCardFromInstalledCapability({
    capability: await createCardInstalledCapabilityRecord(capability),
  });
}

async function createCardInstalledCapabilityRecord(capability: InstalledCapability): Promise<InstalledCapabilityRecord> {
  const installPathStatus = await stat(capability.installPath);

  return {
    identity: createCapabilityIdentity({
      manifest: capability.manifest,
      packagePath: capability.installPath,
      manifestPath: capability.manifestPath,
      manifestDigest: await manifestDigest(capability.manifestPath),
      lifecycle: capability.manifest.lifecycle?.status as CapabilityLifecycleState | undefined,
    }),
    manifest: capability.manifest,
    install: {
      installedAt: installPathStatus.mtime.toISOString(),
      source: "registry",
      sourceRef: capability.id,
    },
    trust: trustSummaryFromManifest(capability.manifest),
    derived: {
      riskSummary: riskSummaryFromManifest(capability.manifest),
      modelVisibleSummary: capability.manifest.description,
    },
  };
}

type CliCardKind = "capability" | "trust";

function parseCardKind(value: string | undefined): CliCardKind {
  if (value === undefined || value === "capability") {
    return "capability";
  }
  if (value === "trust") {
    return "trust";
  }

  throw new CliUserInputError(`Invalid --kind value: ${value}`);
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


function formatPolicyFinding(finding: { severity: string; code: string; filePath: string; fieldPath: string; message: string; ruleId?: string }): string {
  const rule = finding.ruleId === undefined ? "" : ` rule=${finding.ruleId}`;
  return `${finding.severity} ${finding.code} ${finding.filePath}${finding.fieldPath}${rule}: ${finding.message}`;
}

function printLifecycleWarning(warning: CapabilityLifecycleWarning | undefined): void {
  if (warning === undefined) {
    return;
  }
  console.error(`Warning: ${warning.summary}`);
}

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
    for (const warning of result.warnings) {
      printLifecycleWarning(warning);
    }
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

    console.log("id version type risk lifecycle trust maintainer license status");
    for (const capability of installed) {
      console.log(
        `${capability.id} ${capability.version ?? "-"} ${capability.type ?? "-"} ${capability.risk} ${capability.lifecycle} ${capability.trustLevel ?? "-"} ${capability.maintainer ?? "-"} ${capability.license ?? "-"} ${capability.status}`,
      );
      printLifecycleWarning(capability.lifecycleWarning);
    }
  }, "Failed to list installed capabilities"));

program
  .command("card")
  .argument("<id>", "Installed Capability id")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--kind <kind>", "Card kind: capability or trust", "capability")
  .option("--json", "Output JSON")
  .description("Generate a local Capability Card for an installed Capability.")
  .action((id: string, options: { stateDir?: string; kind?: string; json?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const cardKind = parseCardKind(options.kind);
    const loaded = await loadInstalledCapabilities({ cwd, env: process.env, stateDir: options.stateDir });
    const capability = loaded.capabilities.find((installed) => installed.id === id);

    if (capability === undefined) {
      throw new CliUserInputError(`Installed capability not found: ${id}`);
    }

    const card = cardKind === "trust"
      ? await createTrustCardForInstalled(capability)
      : await createCapabilityCardForInstalled(capability);

    if (options.json) {
      console.log(JSON.stringify(card, null, 2));
      return;
    }

    if (card.cardKind === "trust") {
      console.log(`Trust Card ${card.capability.id}@${card.capability.version}`);
      console.log(`schema: ${card.schemaVersion}`);
      console.log(`trust: ${card.trustLevel}`);
      console.log(`maintainer: ${card.maintainer.name ?? card.maintainer.status}`);
      console.log(`disclaimer: ${card.disclaimer}`);
      return;
    }

    console.log(`Capability Card ${card.capability.id}@${card.capability.version}`);
    console.log(`schema: ${card.schemaVersion}`);
    console.log(`risk: ${card.risk.highestRisk}`);
    console.log(`auth: ${card.auth.provider ?? card.auth.type ?? "none"} ${card.auth.placement}`);
    console.log(`credential: redacted`);
  }, `Failed to generate Capability Card for ${id}`));




const policyCommand = program
  .command("policy")
  .description("Inspect and validate OpenCap policy files.");

policyCommand
  .command("validate")
  .argument("<path>", "Policy YAML file")
  .option("--json", "Output JSON")
  .description("Validate and lint a policy file before activation.")
  .action((path: string, options: { json?: boolean }) => runCliAction(async () => {
    const filePath = resolveCliPath(path);
    const result = validatePolicyYml(await readFile(filePath, "utf8"), { sourcePath: filePath });

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.findings.length === 0) {
      console.log(`Policy valid: ${filePath}`);
    } else {
      for (const finding of result.findings) {
        console.log(formatPolicyFinding(finding));
      }
    }

    if (!result.ok) {
      process.exitCode = 1;
    }
  }, `Failed to validate policy ${path}`));

policyCommand
  .command("simulate")
  .option("--before <path>", "Policy YAML before the change")
  .requiredOption("--after <path>", "Policy YAML after the change")
  .requiredOption("--scenarios <path>", "Policy simulation scenarios YAML file")
  .option("--json", "Output JSON")
  .description("Simulate policy changes before activation and report decision diff findings.")
  .action((options: { before?: string; after: string; scenarios: string; json?: boolean }) => runCliAction(async () => {
    const beforePath = options.before === undefined ? undefined : resolveCliPath(options.before);
    const afterPath = resolveCliPath(options.after);
    const scenariosPath = resolveCliPath(options.scenarios);
    const report = simulatePolicyDiff({
      policyBefore: beforePath === undefined ? undefined : await readFile(beforePath, "utf8"),
      policyAfter: await readFile(afterPath, "utf8"),
      scenarios: parsePolicyScenariosDocument(await readFile(scenariosPath, "utf8")),
    });

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else if (report.findings.length === 0) {
      console.log("Policy simulation diff: no changes.");
    } else {
      for (const finding of report.findings) {
        console.log(formatPolicySimulationFinding(finding));
      }
    }

    if (!report.ok) {
      process.exitCode = 1;
    }
  }, "Failed to simulate policy diff"));

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
  .option("--input-json <json>", "Inline JSON input")
  .option("--dry-run", "Build an invocation plan without external execution")
  .option("--yes", "Approve CLI ask confirmations when allowed")
  .option("--json", "Output JSON")
  .option("--verbose", "Include redacted evidence in invoke output")
  .option("--explain", "Show policy decision trace summary")
  .description("Invoke an installed Capability.")
  .action((id: string, options: { stateDir?: string; input?: string; inputJson?: string; dryRun?: boolean; yes?: boolean; json?: boolean; verbose?: boolean; explain?: boolean }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const input = await parseInvokeInput(options);
    const loaded = await loadInstalledCapabilities({ cwd, env: process.env, stateDir: options.stateDir });
    const capability = loaded.capabilities.find((installed) => installed.id === id);

    if (capability === undefined) {
      throw new CliUserInputError(`Installed capability not found: ${id}`);
    }

    if (!options.json) {
      printLifecycleWarning(createCapabilityLifecycleWarning(capability.manifest, "invoke"));
    }

    const policySet = await loadPolicySet({ cwd, env: process.env, stateDir: options.stateDir });
    const policy = evaluatePolicy(policySet, {
      capabilityId: capability.id,
      permissions: capability.manifest.permissions,
      channel: "cli",
      trustLevel: trustLevelFromMetadata(capability.manifest.metadata),
    });
    const sqliteLogger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });
    const capabilityIdentities = new Map(loaded.capabilities.map((installed) => [installed.id, createCapabilityLedgerIdentity({
      manifest: installed.manifest,
      packagePath: installed.installPath,
      manifestPath: installed.manifestPath,
    })]));
    const logger = new RuntimeLedgerAuditLogger(
      sqliteLogger,
      new FileRuntimeLedgerStore({ cwd, env: process.env, stateDir: options.stateDir }),
      { capabilityIdentityResolver: (capabilityId) => capabilityIdentities.get(capabilityId) },
    );

    try {
      if (options.dryRun) {
        const plan = await buildHttpDryRunPlan(capability.manifest, input);
        await logger.record({
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          channel: "cli",
          capabilityId: capability.id,
          status: "dry_run",
          policyDecision: policy.decision,
          confirmationStatus: policy.decision === "deny" ? "denied" : "approved",
          reason: `Dry run plan generated. ${policy.reason}`,
          matchedRuleId: policy.matchedRuleId,
          inputHash: hashInput(input),
          inputRedactedJson: stableJsonStringify(redactInput(input)),
          resolvedUrl: plan.url,
          requestStarted: false,
          executionHttpMethod: plan.method,
          egressDataClasses: plan.egressPreview?.dataClasses,
          egressTargetOrigin: plan.egressPreview?.targetOrigin,
          egressRedactedPreviewJson: plan.egressPreview === undefined ? undefined : stableJsonStringify(plan.egressPreview),
          policyTrace: policy.decisionTrace,
        });
        const envelope = resultEnvelopeFromDryRunPlan(plan, {
          evidence: {
            policyDecision: policy.decision,
            inputHash: hashInput(input),
            policyTrace: policy.decisionTrace,
          },
        });
        printInvokeResult(envelope, { json: options.json, verbose: options.verbose });
        if (options.explain && !options.json) {
          printPolicyExplain(policy.decisionTrace);
        }
        return;
      }

      const confirmationRequest = {
        capabilityId: capability.id,
        policy,
        channel: "cli" as const,
        operationSummary: capability.id,
        input,
      };
      const confirmation = await new CliConfirmationHandler({ assumeYes: options.yes }).confirm(confirmationRequest);

      if (confirmation.status !== "approved") {
        await logger.record(createConfirmationAuditEvent(confirmationRequest, confirmation));
        process.exitCode = 1;
        const envelope = blockedResultEnvelope({
          capabilityId: capability.id,
          reason: confirmation.reason,
          evidence: {
            policyDecision: policy.decision,
            confirmationStatus: confirmation.status,
            inputHash: hashInput(input),
          },
        });
        printInvokeResult(envelope, { json: options.json, verbose: options.verbose });
        return;
      }

      const result = await executeHttpCapability(capability.manifest, input, {
        env: process.env,
        auditLogger: logger,
        channel: "cli",
        consentReceipt: createConsentReceiptAuditEvidence(confirmationRequest, confirmation),
      });
      const envelope = resultEnvelopeFromHttpExecutionResult(result, {
        evidence: {
          policyDecision: policy.decision,
          confirmationStatus: confirmation.status,
          inputHash: hashInput(input),
        },
      });
      if (envelope.isError) {
        process.exitCode = 1;
      }
      printInvokeResult(envelope, { json: options.json, verbose: options.verbose });
    } finally {
      sqliteLogger.close();
    }
  }, `Failed to invoke ${id}`));

program
  .command("serve")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--mcp", "Expose installed Capabilities as MCP tools")
  .description("Start the OpenCap runtime.")
  .action((options: { stateDir?: string; mcp?: boolean }) => runCliAction(async () => {
    if (options.mcp) {
      await serveOpenCapMcpStdio({
        cwd: process.env.INIT_CWD ?? process.cwd(),
        stateDir: options.stateDir,
        env: process.env,
      });
      return;
    }

    console.log("runtime is not implemented yet");
  }, "Failed to start runtime"));

const ledgerCommand = program
  .command("ledger")
  .description("Inspect local Runtime Ledger records.");

ledgerCommand
  .command("export")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--kind <kind>", "Filter by ledger kind: capability, policy, invocation, compatibility")
  .option("--capability <id>", "Filter by Capability id")
  .option("--limit <number>", "Number of ledger records to export", "100")
  .description("Export redacted Runtime Ledger records.")
  .action((options: { stateDir?: string; json?: boolean; kind?: string; capability?: string; limit?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const kind = parseLedgerKind(options.kind);
    const limit = parseLimit(options.limit, 100);
    const store = new FileRuntimeLedgerStore({ cwd, env: process.env, stateDir: options.stateDir });
    const records: LedgerRecordV1[] = [];

    if (kind === undefined || kind === "capability") {
      records.push(...(await store.listCapabilityRecords({ capabilityId: options.capability })).records);
    }
    if ((kind === undefined || kind === "policy") && options.capability === undefined) {
      records.push(...(await store.listPolicyRecords()).records);
    }
    if (kind === undefined || kind === "invocation") {
      records.push(...(await store.listInvocationRecords({ capabilityId: options.capability })).records);
    }
    if (kind === undefined || kind === "compatibility") {
      records.push(...(await store.listCompatibilityRecords({ capabilityId: options.capability })).records);
    }

    const limited = records
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt) || left.recordId.localeCompare(right.recordId))
      .slice(0, limit);

    if (options.json) {
      console.log(JSON.stringify(limited, null, 2));
      return;
    }

    if (limited.length === 0) {
      console.log("No ledger records found.");
      return;
    }

    console.log("recorded_at kind capability_id status record_id");
    for (const record of limited) {
      console.log(formatLedgerLine(record));
    }
  }, "Failed to export ledger records"));

program
  .command("logs")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--limit <number>", "Number of recent log entries to show", "20")
  .option("--capability <id>", "Filter logs by Capability id")
  .option("--status <status>", "Filter logs by status: blocked, denied, executed, dry_run")
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

const decisionLogCommand = program
  .command("decision-log")
  .description("Export redacted policy decision logs.");

decisionLogCommand
  .command("export")
  .option("--state-dir <path>", "Local OpenCap state directory")
  .option("--json", "Output JSON")
  .option("--limit <number>", "Number of recent decision records to export", "100")
  .option("--capability <id>", "Filter by Capability id")
  .option("--decision <decision>", "Filter by policy decision: allow, ask, deny")
  .option("--since <iso-time>", "Filter records at or after an ISO timestamp")
  .option("--until <iso-time>", "Filter records at or before an ISO timestamp")
  .description("Export redacted policy trace and decision summaries.")
  .action((options: { stateDir?: string; json?: boolean; limit?: string; capability?: string; decision?: string; since?: string; until?: string }) => runCliAction(async () => {
    const cwd = process.env.INIT_CWD ?? process.cwd();
    const logger = new SqliteAuditLogger({ cwd, env: process.env, stateDir: options.stateDir });

    try {
      const events = await logger.recent(parseLimit(options.limit, 100), {
        capabilityId: options.capability,
        policyDecision: parsePolicyDecision(options.decision),
        since: parseSince(options.since),
        until: parseSince(options.until),
      });
      const records = exportDecisionLogRecords(events);

      if (options.json) {
        console.log(JSON.stringify(records, null, 2));
        return;
      }

      if (records.length === 0) {
        console.log("No decision log records found.");
        return;
      }

      console.log("timestamp invocation_id capability_id decision status policy_revision trace_id reason_code");
      for (const record of records) {
        console.log(formatDecisionLogLine(record));
      }
    } finally {
      logger.close();
    }
  }, "Failed to export decision logs"));

const argv = process.argv[2] === "--" ? [process.argv[0], process.argv[1], ...process.argv.slice(3)] : process.argv;

await program.parseAsync(argv);
