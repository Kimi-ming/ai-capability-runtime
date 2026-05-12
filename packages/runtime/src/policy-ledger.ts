import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { dirname } from "node:path";

export type PolicyChangeKind = "activation" | "rollback" | "failed_activation";
export type PolicyChangedBy = "local_user" | "automation" | "future_org_admin";

export interface PolicyActiveRevisionV1 {
  policySetId: string;
  revision: string;
  digest: string;
  activatedAt: string;
}

export interface PolicyChangeRecordV1 {
  changeId: string;
  kind: PolicyChangeKind;
  policySetId: string;
  fromRevision?: string;
  toRevision: string;
  digest: string;
  changedBy: PolicyChangedBy;
  reason?: string;
  diffSummary: string[];
  activatedAt?: string;
  failedAt?: string;
  errorCode?: string;
}

export interface FilePolicyLedgerOptions {
  ledgerFile: string;
  activeFile: string;
}

export interface ActivatePolicyRevisionInput {
  policySetId: string;
  toRevision: string;
  policyContent: string;
  reason?: string;
  changedBy?: PolicyChangedBy;
  diffSummary?: string[];
  activatedAt?: Date;
  kind?: Extract<PolicyChangeKind, "activation" | "rollback">;
}

export interface FailedPolicyActivationInput {
  policySetId: string;
  attemptedRevision: string;
  policyContent: string;
  reason?: string;
  changedBy?: PolicyChangedBy;
  diffSummary?: string[];
  failedAt?: Date;
  errorCode: string;
}

const SECRET_PATTERN = /(token|secret|password|api[_-]?key|authorization|cookie)\s*[:=]\s*[^\s,}]+/gi;

function stableDigest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function redactLedgerText(value: string): string {
  return value.replace(SECRET_PATTERN, (_match, key: string) => `${key}=[REDACTED]`);
}

function cleanReason(reason: string | undefined): string | undefined {
  return reason === undefined ? undefined : redactLedgerText(reason).slice(0, 500);
}

function cleanDiffSummary(diffSummary: string[] | undefined): string[] {
  return (diffSummary ?? []).map((item) => redactLedgerText(item).slice(0, 500));
}

async function readJsonFile<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export class FilePolicyLedger {
  constructor(private readonly options: FilePolicyLedgerOptions) {}

  async active(): Promise<PolicyActiveRevisionV1 | undefined> {
    return readJsonFile<PolicyActiveRevisionV1>(this.options.activeFile);
  }

  async records(): Promise<PolicyChangeRecordV1[]> {
    try {
      const raw = await readFile(this.options.ledgerFile, "utf8");
      return raw.split("\n").filter((line) => line.trim().length > 0).map((line) => JSON.parse(line) as PolicyChangeRecordV1);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async activate(input: ActivatePolicyRevisionInput): Promise<PolicyChangeRecordV1> {
    const active = await this.active();
    const activatedAt = input.activatedAt ?? new Date();
    const digest = stableDigest(input.policyContent);
    const record: PolicyChangeRecordV1 = {
      changeId: randomUUID(),
      kind: input.kind ?? "activation",
      policySetId: input.policySetId,
      fromRevision: active?.revision,
      toRevision: input.toRevision,
      digest,
      changedBy: input.changedBy ?? "local_user",
      reason: cleanReason(input.reason),
      diffSummary: cleanDiffSummary(input.diffSummary),
      activatedAt: activatedAt.toISOString(),
    };

    await mkdir(dirname(this.options.ledgerFile), { recursive: true });
    await appendFile(this.options.ledgerFile, `${JSON.stringify(record)}\n`, "utf8");
    await writeFile(this.options.activeFile, JSON.stringify({
      policySetId: input.policySetId,
      revision: input.toRevision,
      digest,
      activatedAt: activatedAt.toISOString(),
    }, null, 2), "utf8");

    return record;
  }

  async rollback(input: Omit<ActivatePolicyRevisionInput, "kind">): Promise<PolicyChangeRecordV1> {
    return this.activate({ ...input, kind: "rollback" });
  }

  async recordFailedActivation(input: FailedPolicyActivationInput): Promise<PolicyChangeRecordV1> {
    const failedAt = input.failedAt ?? new Date();
    const record: PolicyChangeRecordV1 = {
      changeId: randomUUID(),
      kind: "failed_activation",
      policySetId: input.policySetId,
      toRevision: input.attemptedRevision,
      digest: stableDigest(input.policyContent),
      changedBy: input.changedBy ?? "local_user",
      reason: cleanReason(input.reason),
      diffSummary: cleanDiffSummary(input.diffSummary),
      failedAt: failedAt.toISOString(),
      errorCode: input.errorCode,
    };

    await mkdir(dirname(this.options.ledgerFile), { recursive: true });
    await appendFile(this.options.ledgerFile, `${JSON.stringify(record)}\n`, "utf8");
    return record;
  }
}
