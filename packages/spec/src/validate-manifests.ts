#!/usr/bin/env node
import { formatManifestValidationIssue, validateManifestPath } from "./index.js";

const targetPath = process.argv[2] ?? "../../registry";

try {
  const result = await validateManifestPath(targetPath);

  if (result.manifests.length === 0) {
    console.error(`No manifests found under ${targetPath}`);
    process.exit(1);
  }

  for (const valid of result.valid) {
    console.log(`Valid manifest: ${valid.filePath}`);
  }

  for (const invalid of result.invalid) {
    console.error(`Invalid manifest: ${invalid.filePath}`);
    for (const issue of invalid.issues) {
      console.error(`  ${formatManifestValidationIssue(issue)}`);
    }
  }

  if (result.invalid.length > 0) {
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to validate manifests");
  process.exit(1);
}
