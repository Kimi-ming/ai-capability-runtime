import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE_DIR_NAME,
  OPENCAP_STATE_DIR_ENV,
  OpenCapRuntime,
  ensureLocalStateDir,
  getLocalStatePaths,
  resolveStateDir,
} from "./index.js";

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("state dir helpers", () => {
  it("uses <cwd>/opencap.local by default", () => {
    const cwd = "/tmp/opencap-project";

    expect(resolveStateDir({ cwd, env: {} })).toBe(resolve(cwd, DEFAULT_STATE_DIR_NAME));
  });

  it("uses OPENCAP_STATE_DIR before the default", () => {
    const cwd = "/tmp/opencap-project";

    expect(resolveStateDir({ cwd, env: { [OPENCAP_STATE_DIR_ENV]: "custom-state" } })).toBe(
      resolve(cwd, "custom-state"),
    );
  });

  it("uses explicit stateDir before OPENCAP_STATE_DIR", () => {
    const cwd = "/tmp/opencap-project";

    expect(
      resolveStateDir({
        cwd,
        stateDir: "flag-state",
        env: { [OPENCAP_STATE_DIR_ENV]: "env-state" },
      }),
    ).toBe(resolve(cwd, "flag-state"));
  });

  it("returns stable local state paths", () => {
    const root = "/tmp/opencap-project/opencap.local";
    const paths = getLocalStatePaths(root);

    expect(paths.root).toBe(resolve(root));
    expect(paths.installedDir).toBe(resolve(root, "installed"));
    expect(paths.tmpDir).toBe(resolve(root, "tmp"));
    expect(paths.policiesFile).toBe(resolve(root, "policies.yml"));
    expect(paths.logsDatabaseFile).toBe(resolve(root, "logs.sqlite"));
  });

  it("creates only the required V1 state directories", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "opencap-runtime-"));
    const paths = await ensureLocalStateDir({ cwd, env: {} });

    expect(await exists(paths.root)).toBe(true);
    expect(await exists(paths.installedDir)).toBe(true);
    expect(await exists(paths.tmpDir)).toBe(true);
    expect(await exists(paths.cacheDir)).toBe(false);
    expect(await exists(resolve(cwd, "registry"))).toBe(false);
  });

  it("initializes OpenCapRuntime with resolved state paths", () => {
    const runtime = new OpenCapRuntime({ cwd: "/tmp/opencap-project", env: {} });

    expect(runtime.stateDir).toBe(resolve("/tmp/opencap-project", DEFAULT_STATE_DIR_NAME));
    expect(runtime.statePaths.installedDir).toBe(resolve(runtime.stateDir, "installed"));
  });
});
