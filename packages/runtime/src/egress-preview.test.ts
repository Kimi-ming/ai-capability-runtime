import { describe, expect, it } from "vitest";
import { classifyInput } from "./input-classifier.js";
import { buildFieldLevelEgressMap } from "./egress-map.js";
import { minimizeInputByEgressMap } from "./input-minimization.js";
import { buildRedactedEgressPreview } from "./egress-preview.js";

const manifest = {
  id: "slack.send_message",
  execution: {
    method: "POST",
    url: "https://slack.com/api/chat.postMessage",
    timeout_ms: 10000,
    body: {
      type: "json",
      fields: {
        text: "{{text}}",
        tokenEcho: "{{token}}",
        email: "{{email}}",
      },
    },
  },
};

describe("redacted egress preview", () => {
  it("shows target, fields sent, data classes, and redacted preview", () => {
    const longText = `${"release notes ".repeat(80)}END_OF_LONG_TEXT`;
    const input = {
      text: longText,
      token: "ghp_secret_value_should_not_appear",
      email: "dev@example.com",
      unused: "do-not-show",
    };
    const classification = classifyInput(input, { freeTextUnknownThreshold: 100 });
    const map = buildFieldLevelEgressMap(manifest, input, classification);
    const minimized = minimizeInputByEgressMap(input, map);

    const preview = buildRedactedEgressPreview({
      targetOrigin: "https://slack.com",
      map,
      minimizedInput: minimized.input,
      classification,
      maxTextLength: 60,
    });

    expect(preview.targetOrigin).toBe("https://slack.com");
    expect(preview.dataClasses).toEqual(["free_text_unknown", "pii", "secret_like"]);
    expect(preview.fieldsSent).toEqual(expect.arrayContaining([
      { path: "/text", destination: "body", dataClasses: ["free_text_unknown"], redacted: true },
      { path: "/token", destination: "body", dataClasses: ["secret_like"], redacted: true },
      { path: "/email", destination: "body", dataClasses: ["pii"], redacted: true },
    ]));
    expect(JSON.stringify(preview.redactedInput)).not.toContain("ghp_secret_value_should_not_appear");
    expect(JSON.stringify(preview.redactedInput)).not.toContain("END_OF_LONG_TEXT");
    expect(JSON.stringify(preview.redactedInput)).not.toContain("dev@example.com");
    expect(JSON.stringify(preview)).not.toContain("do-not-show");
  });
});
