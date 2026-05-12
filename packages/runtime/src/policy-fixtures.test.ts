import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { validatePolicyYml } from "./policy-validator.js";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(testFile), "../../..");
const fixtureRoot = join(repoRoot, "packages/runtime/test/fixtures");

function loadYaml(path: string): unknown {
  return parseYaml(readFileSync(path, "utf8"));
}

function fixtureText(path: string): string {
  return readFileSync(path, "utf8");
}

function asRecord(value: unknown): Record<string, unknown> {
  expect(typeof value).toBe("object");
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  return value as Record<string, unknown>;
}

describe("policy simulation fixtures", () => {
  it("provides valid baseline and changed policy fixtures", () => {
    for (const fileName of ["baseline-ask.yml", "scoped-allow.yml", "broad-allow-after.yml"]) {
      const filePath = join(fixtureRoot, "policies", fileName);
      const result = validatePolicyYml(fixtureText(filePath), { sourcePath: filePath });
      expect(result.findings.filter((finding) => finding.severity === "error")).toEqual([]);
    }
  });

  it("covers risk, data, trust, lifecycle, and advisory facts without real sensitive values", () => {
    const scenariosPath = join(fixtureRoot, "policy-scenarios", "governance.yml");
    const scenarios = asRecord(loadYaml(scenariosPath)).scenarios as Array<Record<string, unknown>>;

    expect(new Set(scenarios.map((scenario) => scenario.risk))).toEqual(new Set([
      "read_only",
      "write",
      "external_send",
      "destructive",
      "financial",
    ]));

    const dataClasses = new Set(scenarios.flatMap((scenario) => Array.isArray(scenario.dataClasses) ? scenario.dataClasses : []));
    for (const dataClass of ["pii", "secret_like", "source_code", "internal_url"]) {
      expect(dataClasses.has(dataClass)).toBe(true);
    }

    expect(scenarios.every((scenario) => typeof scenario.trustLevel === "string")).toBe(true);
    expect(scenarios.every((scenario) => typeof scenario.lifecycle === "string")).toBe(true);
    expect(scenarios.every((scenario) => typeof scenario.advisoryStatus === "string")).toBe(true);

    const raw = fixtureText(scenariosPath);
    expect(raw).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(raw).not.toMatch(/gh[pousr]_[A-Za-z0-9_]{20,}/);
    expect(raw).not.toMatch(/Bearer\s+[A-Za-z0-9._-]+/);
  });
});
