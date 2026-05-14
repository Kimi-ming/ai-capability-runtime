import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";
import YAML from "yaml";

export interface CapabilityPackageValidationIssue {
  filePath: string;
  fieldPath: string;
  message: string;
  keyword: string;
}

export interface CapabilityPackageValidationSuccess {
  ok: true;
  packageDir: string;
  capabilityId: string;
  category: string;
}

export interface CapabilityPackageValidationFailure {
  ok: false;
  packageDir: string;
  issues: CapabilityPackageValidationIssue[];
}

export type CapabilityPackageValidationResult = CapabilityPackageValidationSuccess | CapabilityPackageValidationFailure;

export interface CapabilityPackagePathValidationResult {
  targetPath: string;
  packages: string[];
  valid: CapabilityPackageValidationSuccess[];
  invalid: CapabilityPackageValidationFailure[];
}

function issue(
  packageDir: string,
  fieldPath: string,
  keyword: string,
  message: string,
): CapabilityPackageValidationIssue {
  return {
    filePath: packageDir,
    fieldPath,
    keyword: `capability-package-lint:${keyword}`,
    message,
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function loadPackageManifest(packageDir: string): Promise<Record<string, unknown> | undefined> {
  const manifestPath = join(packageDir, "manifest.yml");
  const raw = await readFile(manifestPath, "utf8");
  const parsed = YAML.parse(raw);
  return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
}

function manifestCategory(manifest: Record<string, unknown> | undefined): string | undefined {
  const metadata = manifest?.metadata;
  if (typeof metadata !== "object" || metadata === null) {
    return undefined;
  }

  const category = (metadata as Record<string, unknown>).category;
  return typeof category === "string" ? category : undefined;
}

async function hasRegistryTest(packageDir: string): Promise<boolean> {
  const testsDir = join(packageDir, "tests");

  try {
    const info = await stat(testsDir);
    if (!info.isDirectory()) {
      return false;
    }
    const entries = await readdir(testsDir, { withFileTypes: true });
    return entries.some((entry) => entry.isFile() && ["basic.yml", "basic.yaml", "basic.json"].includes(entry.name));
  } catch {
    return false;
  }
}

function isForbiddenFileName(name: string): "forbidden_file" | "forbidden_database" | undefined {
  if (name === ".env" || name.startsWith(".env.")) {
    return "forbidden_file";
  }

  if ([".sqlite", ".sqlite3", ".db"].includes(extname(name).toLowerCase())) {
    return "forbidden_database";
  }

  return undefined;
}

async function collectForbiddenPackageEntries(
  packageDir: string,
  currentDir = packageDir,
): Promise<CapabilityPackageValidationIssue[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const issues: CapabilityPackageValidationIssue[] = [];

  for (const entry of entries) {
    const path = join(currentDir, entry.name);
    const relPath = relative(packageDir, path);

    if (entry.isDirectory()) {
      if (entry.name === "opencap.local") {
        issues.push(issue(packageDir, `/${relPath}`, "forbidden_directory", "Capability package must not include opencap.local state directories."));
        continue;
      }
      issues.push(...(await collectForbiddenPackageEntries(packageDir, path)));
      continue;
    }

    if (entry.isFile()) {
      const keyword = isForbiddenFileName(entry.name);
      if (keyword) {
        issues.push(issue(packageDir, `/${relPath}`, keyword, "Capability package must not include local state, secret-shaped, or database files."));
      }
    }
  }

  return issues;
}

export async function validateCapabilityPackage(packageDir: string): Promise<CapabilityPackageValidationResult> {
  const issues: CapabilityPackageValidationIssue[] = [];
  const expectedCapabilityId = basename(packageDir);
  const expectedCategory = basename(join(packageDir, ".."));
  let capabilityId = expectedCapabilityId;
  let category = expectedCategory;

  if (!(await pathExists(join(packageDir, "manifest.yml")))) {
    issues.push(issue(packageDir, "/manifest.yml", "missing_manifest", "Capability package must contain manifest.yml."));
  } else {
    try {
      const manifest = await loadPackageManifest(packageDir);
      const manifestId = manifest?.id;
      const metadataCategory = manifestCategory(manifest);

      if (typeof manifestId === "string") {
        capabilityId = manifestId;
        if (manifestId !== expectedCapabilityId) {
          issues.push(issue(packageDir, "/id", "id_path_mismatch", "Manifest id must match the capability package directory name."));
        }
      }

      if (typeof metadataCategory === "string") {
        category = metadataCategory;
        if (metadataCategory !== expectedCategory) {
          issues.push(issue(packageDir, "/metadata/category", "category_path_mismatch", "Manifest metadata.category must match the registry category directory."));
        }
      }
    } catch (error) {
      issues.push(
        issue(
          packageDir,
          "/manifest.yml",
          "manifest_parse_failed",
          error instanceof Error ? error.message : "Failed to parse manifest.yml.",
        ),
      );
    }
  }

  if (!(await pathExists(join(packageDir, "README.md")))) {
    issues.push(issue(packageDir, "/README.md", "missing_readme", "Capability package must contain README.md."));
  }

  if (!(await hasRegistryTest(packageDir))) {
    issues.push(issue(packageDir, "/tests", "missing_registry_test", "Capability package must contain tests/basic.yml or equivalent registry test."));
  }

  issues.push(...(await collectForbiddenPackageEntries(packageDir)));

  if (issues.length > 0) {
    return {
      ok: false,
      packageDir,
      issues,
    };
  }

  return {
    ok: true,
    packageDir,
    capabilityId,
    category,
  };
}

async function findPackageDirsInDirectory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const hasManifest = entries.some((entry) => entry.isFile() && ["manifest.yml", "manifest.yaml", "manifest.json"].includes(entry.name));

  if (hasManifest) {
    return [dir];
  }

  const packageDirs: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      packageDirs.push(...(await findPackageDirsInDirectory(join(dir, entry.name))));
    }
  }

  return packageDirs.sort();
}

export async function findCapabilityPackageDirs(targetPath: string): Promise<string[]> {
  const info = await stat(targetPath);

  if (info.isFile()) {
    return [];
  }

  return findPackageDirsInDirectory(targetPath);
}

export async function validateCapabilityPackagePath(targetPath: string): Promise<CapabilityPackagePathValidationResult> {
  const packages = await findCapabilityPackageDirs(targetPath);
  const results = await Promise.all(packages.map((packageDir) => validateCapabilityPackage(packageDir)));

  return {
    targetPath,
    packages,
    valid: results.filter((result): result is CapabilityPackageValidationSuccess => result.ok),
    invalid: results.filter((result): result is CapabilityPackageValidationFailure => !result.ok),
  };
}
