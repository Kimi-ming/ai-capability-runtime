#!/usr/bin/env node
import {
  formatManifestValidationIssue,
  validateCapabilityAdvisoryPath,
  validateCapabilityPackagePath,
  validateCapabilityAuthoringManifestPath,
  validateRegistryTestPath,
} from "./index.js";

const targetPath = process.argv[2] ?? "../../registry";
let hasFailure = false;

try {
  const manifestResult = await validateCapabilityAuthoringManifestPath(targetPath);

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

  const packageResult = await validateCapabilityPackagePath(targetPath);

  if (packageResult.packages.length === 0) {
    console.error(`No capability packages found under ${targetPath}`);
    hasFailure = true;
  }

  for (const valid of packageResult.valid) {
    console.log(`Valid capability package: ${valid.packageDir}`);
  }

  for (const invalid of packageResult.invalid) {
    hasFailure = true;
    console.error(`Invalid capability package: ${invalid.packageDir}`);
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

  const advisoryResult = await validateCapabilityAdvisoryPath(targetPath);

  for (const valid of advisoryResult.valid) {
    console.log(`Valid capability advisory: ${valid.filePath}`);
  }

  for (const invalid of advisoryResult.invalid) {
    hasFailure = true;
    console.error(`Invalid capability advisory: ${invalid.filePath}`);
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
