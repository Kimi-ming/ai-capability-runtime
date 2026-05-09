import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { classifyInput } from "./input-classifier.js";

describe("input classification engine", () => {
  it("classifies token-like fields and values as secret_like", () => {
    const result = classifyInput({ authToken: "ghp_abcdefghijklmnopqrstuvwxyz123456" });

    expect(result.dataClasses).toContain("secret_like");
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "/authToken", dataClass: "secret_like", confidence: "high", action: "deny" }),
    ]));
    expect(result.redactedPreview).toEqual({ authToken: "[redacted:secret_like]" });
  });

  it("classifies email and phone-like strings as pii", () => {
    const result = classifyInput({ email: "dev@example.com", phone: "+1 415 555 0199" });

    expect(result.dataClasses).toContain("pii");
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "/email", dataClass: "pii", action: "ask" }),
      expect.objectContaining({ path: "/phone", dataClass: "pii", action: "ask" }),
    ]));
  });

  it("classifies localhost, private IP, and metadata URLs as internal_url", () => {
    const result = classifyInput({
      local: "http://localhost:3000/health",
      privateApi: "http://192.168.1.5/admin",
      metadata: "http://169.254.169.254/latest/meta-data/",
    });

    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "/local", dataClass: "internal_url", action: "deny" }),
      expect.objectContaining({ path: "/privateApi", dataClass: "internal_url", action: "deny" }),
      expect.objectContaining({ path: "/metadata", dataClass: "internal_url", action: "deny" }),
    ]));
  });

  it("classifies env files, diffs, and stack traces as source_code and preserves secret_like findings", () => {
    const result = classifyInput({
      envFile: "DATABASE_URL=postgres://localhost/app\nAPI_KEY=super-secret",
      patch: "diff --git a/app.ts b/app.ts\n@@ -1 +1 @@\n-console.log('old')\n+console.log('new')",
      stack: "Error: boom\n    at run (/repo/app.ts:10:5)",
    });

    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "/envFile", dataClass: "source_code", action: "ask" }),
      expect.objectContaining({ path: "/envFile", dataClass: "secret_like", action: "deny" }),
      expect.objectContaining({ path: "/patch", dataClass: "source_code", action: "ask" }),
      expect.objectContaining({ path: "/stack", dataClass: "source_code", action: "ask" }),
    ]));
    expect(result.redactedPreview).toMatchObject({ envFile: "[redacted:secret_like,source_code]" });
  });

  it("classifies large uncategorized text as free_text_unknown", () => {
    const result = classifyInput({ body: `${"ordinary text ".repeat(90)}` });

    expect(result.findings).toEqual([expect.objectContaining({ path: "/body", dataClass: "free_text_unknown", action: "ask" })]);
  });
});


interface InputClassificationFixture {
  name: string;
  input: unknown;
  expectedDataClasses: string[];
  expectedFindings: Array<{
    path: string;
    dataClass: string;
    action?: string;
  }>;
  redactedPreviewContains?: string[];
  redactedPreviewNotContains?: string[];
}

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/input-classification");

function loadInputClassificationFixtures(): InputClassificationFixture[] {
  return readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(fixtureDir, file), "utf8")) as InputClassificationFixture);
}

describe("input classification fixtures", () => {
  for (const fixture of loadInputClassificationFixtures()) {
    it(`classifies fixture: ${fixture.name}`, () => {
      const result = classifyInput(fixture.input);

      expect(result.dataClasses).toEqual(expect.arrayContaining(fixture.expectedDataClasses));
      expect(result.findings).toEqual(expect.arrayContaining(
        fixture.expectedFindings.map((finding) => expect.objectContaining(finding)),
      ));

      const preview = JSON.stringify(result.redactedPreview);
      for (const expected of fixture.redactedPreviewContains ?? []) {
        expect(preview).toContain(expected);
      }
      for (const forbidden of fixture.redactedPreviewNotContains ?? []) {
        expect(preview).not.toContain(forbidden);
      }
    });
  }
});
