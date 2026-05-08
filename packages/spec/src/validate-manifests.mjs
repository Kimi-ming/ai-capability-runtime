import Ajv2020 from "ajv/dist/2020.js";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import YAML from "yaml";

const root = process.argv[2] ?? "../../registry";
const schemaPath = new URL("../schema/manifest.schema.json", import.meta.url);
const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function isManifestFileName(fileName) {
  return ["manifest.yml", "manifest.yaml", "manifest.json"].includes(basename(fileName));
}

async function findManifests(target) {
  const info = await stat(target);

  if (info.isFile()) {
    return isManifestFileName(target) ? [target] : [];
  }

  if (!info.isDirectory()) {
    return [];
  }

  const entries = await readdir(target, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findManifests(path)));
    } else if (entry.isFile() && isManifestFileName(entry.name)) {
      files.push(path);
    }
  }

  return files.sort();
}

function fieldPath(error) {
  if (error.keyword === "required" && typeof error.params?.missingProperty === "string") {
    return `${error.instancePath || ""}/${error.params.missingProperty}` || "/";
  }

  if (error.keyword === "additionalProperties" && typeof error.params?.additionalProperty === "string") {
    return `${error.instancePath || ""}/${error.params.additionalProperty}` || "/";
  }

  return error.instancePath || "/";
}

let hasFailure = false;
const manifests = await findManifests(root);

if (manifests.length === 0) {
  console.error(`No manifests found under ${root}`);
  process.exit(1);
}

for (const manifestPath of manifests) {
  try {
    const raw = await readFile(manifestPath, "utf8");
    const manifest = extname(manifestPath).toLowerCase() === ".json" ? JSON.parse(raw) : YAML.parse(raw);
    const valid = validate(manifest);

    if (!valid) {
      hasFailure = true;
      console.error(`Invalid manifest: ${manifestPath}`);
      for (const error of validate.errors ?? []) {
        console.error(`  ${fieldPath(error)} ${error.message}`);
      }
    } else {
      console.log(`Valid manifest: ${manifestPath}`);
    }
  } catch (error) {
    hasFailure = true;
    console.error(`Invalid manifest: ${manifestPath}`);
    console.error(`  / ${error instanceof Error ? error.message : "failed to read manifest"}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
