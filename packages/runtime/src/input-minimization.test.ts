import { describe, expect, it } from "vitest";
import { classifyInput } from "./input-classifier.js";
import { buildFieldLevelEgressMap } from "./egress-map.js";
import { minimizeInputByEgressMap } from "./input-minimization.js";

const manifest = {
  id: "github.create_issue",
  execution: {
    method: "POST",
    url: "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
    timeout_ms: 10000,
    body: {
      type: "json",
      fields: {
        title: "{{title}}",
        body: "{{body}}",
        optional: "{{optional}}",
      },
    },
  },
};

describe("input minimization by execution mapping", () => {
  it("keeps only fields referenced by URL or body mapping", () => {
    const input = {
      owner: "opencap",
      repo: "runtime",
      title: "Bug",
      body: "Broken flow",
      unusedSecret: "ghp_secret_value_should_not_leave_runtime",
    };
    const map = buildFieldLevelEgressMap(manifest, input, classifyInput(input));

    const minimized = minimizeInputByEgressMap(input, map);

    expect(minimized.input).toEqual({ owner: "opencap", repo: "runtime", title: "Bug", body: "Broken flow" });
    expect(minimized.includedPaths).toEqual(["/owner", "/repo", "/title", "/body"]);
    expect(JSON.stringify(minimized)).not.toContain("ghp_secret_value_should_not_leave_runtime");
  });

  it("does not turn the entire input into a body when body mapping is absent", () => {
    const input = { targetUrl: "https://example.com/hook", message: "hello", unused: "do-not-send" };
    const map = buildFieldLevelEgressMap({
      id: "http.request_demo",
      execution: { method: "POST", url: "{{targetUrl}}", timeout_ms: 10000 },
    }, input, classifyInput(input));

    const minimized = minimizeInputByEgressMap(input, map);

    expect(minimized.input).toEqual({ targetUrl: "https://example.com/hook" });
    expect(JSON.stringify(minimized)).not.toContain("do-not-send");
  });

  it("omits optional missing fields", () => {
    const input = { owner: "opencap", repo: "runtime", title: "Bug" };
    const map = buildFieldLevelEgressMap(manifest, input, classifyInput(input));

    const minimized = minimizeInputByEgressMap(input, map);

    expect(minimized.input).toEqual({ owner: "opencap", repo: "runtime", title: "Bug" });
    expect(minimized.includedPaths).not.toContain("/optional");
  });
});
