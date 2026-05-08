#!/usr/bin/env node
import {
  formatManifestValidationIssue,
  validateManifestPath,
  validateRegistryTestPath,
} from "./index.js";

const targetPath = process.argv[2] ?? "../../registry";
let hasFailure = false;

try {
  const manifestResult = await validateManifestPath(targetPath);

  if (manifestResult.manifests.length === 0) {
    console.error(`No manifests found under ${targetPath}`);
    hasFailure = true;
  }

  for (const valid of manifestResult.valid) {
    console.log(`Valid manifest: ${valid.filePath}`);
  }

  for (const invalid of manifestResult.invalid) {
    hasFailure = true;
    console.error(`Invalid manifest: ${invalid.filePath}`);
    for (const issue of invalid.issues) {
      console.error(`  ${formatManifestValidationIssue(issue)}`);
    }
  }

  const registryTestResult = await validateRegistryTestPath(targetPath);

  if (registryTestResult.testCases.length === 0) {
    console.error(`No registry tests found under ${targetPath}`);
    hasFailure = true;
  }

  for (const valid of registryTestResult.valid) {
    console.log(`Valid registry test: ${valid.filePath}`);
  }

  for (const invalid of registryTestResult.invalid) {
    hasFailure = true;
    console.error(`Invalid registry test: ${invalid.filePath}`);
    for (const issue of invalid.issues) {
      console.error(`  ${formatManifestValidationIssue(issue)}`);
    }
  }

  if (hasFailure) {
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to validate registry");
  process.exit(1);
}
