import Ajv from "ajv";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";

const root = process.argv[2] ?? "../../registry";
const schemaPath = new URL("../schema/manifest.schema.json", import.meta.url);
const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

async function findManifests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findManifests(path));
    } else if (entry.name === "manifest.yml" || entry.name === "manifest.yaml") {
      files.push(path);
    }
  }

  return files;
}

let hasFailure = false;
const manifests = await findManifests(root);

for (const manifestPath of manifests) {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = YAML.parse(raw);
  const valid = validate(manifest);

  if (!valid) {
    hasFailure = true;
    console.error(`Invalid manifest: ${manifestPath}`);
    for (const error of validate.errors ?? []) {
      console.error(`  ${error.instancePath || "/"} ${error.message}`);
    }
  } else {
    console.log(`Valid manifest: ${manifestPath}`);
  }
}

if (hasFailure) {
  process.exit(1);
}

if (manifests.length === 0) {
  console.warn(`No manifests found under ${root}`);
}
