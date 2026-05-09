import { describe, expect, it } from "vitest";
import { classifyInput } from "./input-classifier.js";
import { buildFieldLevelEgressMap } from "./egress-map.js";

const manifest = {
  id: "github.create_issue",
  execution: {
    method: "POST",
    url: "https://api.github.com/repos/{{owner}}/{{repo}}/issues?notify={{notifyEmail}}",
    timeout_ms: 10000,
    body: {
      type: "json",
      fields: {
        title: "{{title}}",
        body: "{{body}}",
        labels: "{{labels}}",
      },
    },
  },
};

describe("field-level egress map", () => {
  it("maps rendered URL, query, and body fields with destinations and data classes", () => {
    const input = {
      owner: "opencap",
      repo: "runtime",
      notifyEmail: "dev@example.com",
      title: "Bug",
      body: `diff --git a/app.ts b/app.ts\n@@ -1 +1 @@\n-old\n+new`,
      labels: ["bug"],
      unusedSecret: "ghp_secret_value_should_not_appear",
    };
    const classification = classifyInput(input);

    const map = buildFieldLevelEgressMap(manifest, input, classification);

    expect(map.fields).toEqual(expect.arrayContaining([
      { path: "/owner", destination: "url", dataClasses: [], redacted: false },
      { path: "/repo", destination: "url", dataClasses: [], redacted: false },
      { path: "/notifyEmail", destination: "query", dataClasses: ["pii"], redacted: false },
      { path: "/title", destination: "body", dataClasses: [], redacted: false },
      { path: "/body", destination: "body", dataClasses: ["source_code"], redacted: true },
      { path: "/labels", destination: "body", dataClasses: [], redacted: false },
    ]));
    expect(map.fields.map((field) => field.path)).not.toContain("/unusedSecret");
    expect(JSON.stringify(map)).not.toContain("ghp_secret_value_should_not_appear");
  });

  it("maps full URL template fields as url destination", () => {
    const input = { targetUrl: "https://example.com/hook", message: "hello" };
    const map = buildFieldLevelEgressMap({
      id: "http.request_demo",
      execution: {
        method: "POST",
        url: "{{targetUrl}}",
        timeout_ms: 10000,
        body: { type: "json", fields: { message: "{{message}}" } },
      },
    }, input, classifyInput(input));

    expect(map.fields).toEqual([
      { path: "/targetUrl", destination: "url", dataClasses: [], redacted: false },
      { path: "/message", destination: "body", dataClasses: [], redacted: false },
    ]);
  });
});
