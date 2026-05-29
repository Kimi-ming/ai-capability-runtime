import YAML from "yaml";

export type CapabilityScaffoldHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type CapabilityScaffoldAuth =
  | { mode: "none" }
  | {
      mode: "api_key_bearer";
      provider: string;
      env: string;
      scopes: string[];
    };

export interface BuildCapabilityScaffoldInput {
  id: string;
  title: string;
  description: string;
  category: string;
  method: CapabilityScaffoldHttpMethod;
  urlTemplate: string;
  auth: CapabilityScaffoldAuth;
  type?: "http";
}

export interface CapabilityScaffoldFile {
  path: "manifest.yml" | "README.md" | "tests/basic.yml";
  content: string;
}

export interface CapabilityScaffold {
  files: CapabilityScaffoldFile[];
}

const CAPABILITY_ID_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const CATEGORY_PATTERN = /^[a-z][a-z0-9-]*$/;
const PROVIDER_PATTERN = /^[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*$/;
const ENV_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const UNSAFE_PATH_FRAGMENT_PATTERN = /(^|[._/\-])(token|secret|password)([._/\-]|$)|opencap\.local|(^|[._/\-])\.env([._/\-]|$)|\.(sqlite|sqlite3|db|log)$/i;

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Invalid ${label}: expected non-empty text.`);
  }
}

function assertSafePathFragment(value: string, label: string): void {
  if (UNSAFE_PATH_FRAGMENT_PATTERN.test(value)) {
    throw new Error(`Unsafe ${label}: must not contain secret, token, password, opencap.local, database, or log path fragments.`);
  }
}

function assertCapabilityId(id: string): void {
  if (!CAPABILITY_ID_PATTERN.test(id)) {
    throw new Error("Invalid capability id: expected a dotted lowercase id such as github.create_issue.");
  }
  assertSafePathFragment(id, "capability id");
}

function assertCategory(category: string): void {
  if (!CATEGORY_PATTERN.test(category)) {
    throw new Error("Invalid category: expected a lowercase registry category slug.");
  }
  assertSafePathFragment(category, "category");
}

function assertAuth(auth: CapabilityScaffoldAuth, capabilityId: string): void {
  if (auth.mode === "none") {
    return;
  }

  if (!PROVIDER_PATTERN.test(auth.provider)) {
    throw new Error("Invalid auth provider: expected a stable provider slug.");
  }
  if (!ENV_PATTERN.test(auth.env)) {
    throw new Error("Invalid auth env: expected an uppercase environment variable name.");
  }
  if (auth.scopes.length === 0 || auth.scopes.some((scope) => scope.trim().length === 0)) {
    throw new Error("Invalid auth scopes: expected at least one non-empty scope.");
  }

  const [capabilityProvider] = capabilityId.split(".");
  if (capabilityProvider !== auth.provider) {
    throw new Error("Invalid auth provider: provider must match the capability id prefix.");
  }
}

function templateVariables(urlTemplate: string): string[] {
  const variables: string[] = [];
  const pattern = /{{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(urlTemplate)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

function testUrl(urlTemplate: string, variables: string[]): string {
  return variables.reduce((url, variable) => url.replace(new RegExp(`{{\\s*${variable}\\s*}}`, "g"), "example"), urlTemplate);
}

function actionForMethod(method: CapabilityScaffoldHttpMethod): "read" | "write" {
  return method === "GET" ? "read" : "write";
}

function riskForMethod(method: CapabilityScaffoldHttpMethod): "read_only" | "write" {
  return method === "GET" ? "read_only" : "write";
}

function confirmationForMethod(method: CapabilityScaffoldHttpMethod): "allow" | "ask" {
  return method === "GET" ? "allow" : "ask";
}

function manifestAuth(auth: CapabilityScaffoldAuth): Record<string, unknown> {
  if (auth.mode === "none") {
    return { type: "none" };
  }

  return {
    type: "api_key",
    provider: auth.provider,
    env: auth.env,
    placement: {
      type: "bearer",
    },
    scopes: [...auth.scopes],
  };
}

function manifestInput(variables: string[]): Record<string, unknown> {
  return {
    type: "object",
    ...(variables.length > 0 ? { required: variables } : {}),
    properties: Object.fromEntries(variables.map((variable) => [
      variable,
      {
        type: "string",
        description: `Value for ${variable}.`,
      },
    ])),
  };
}

function buildManifest(input: BuildCapabilityScaffoldInput, variables: string[]): Record<string, unknown> {
  return {
    id: input.id,
    name: input.title.trim(),
    description: input.description.trim(),
    version: "0.1.0",
    type: "http",
    input: manifestInput(variables),
    output: {
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "Provider response after Runtime normalization.",
        },
      },
    },
    auth: manifestAuth(input.auth),
    permissions: [
      {
        resource: input.id,
        action: actionForMethod(input.method),
        risk: riskForMethod(input.method),
        confirmation: confirmationForMethod(input.method),
      },
    ],
    execution: {
      method: input.method,
      url: input.urlTemplate,
      timeout_ms: 10000,
    },
    metadata: {
      category: input.category,
      maintainer: "opencap",
      license: "MIT",
      trust_level: "experimental",
      network_access: "fixed_url",
    },
  };
}

function buildReadme(input: BuildCapabilityScaffoldInput): string {
  return [
    `# ${input.title.trim()}`,
    "",
    input.description.trim(),
    "",
    "## Usage",
    "",
    "```bash",
    `opencap validate registry/${input.category}/${input.id}`,
    `opencap invoke ${input.id} --dry-run --json`,
    "```",
    "",
    "## Security",
    "",
    "- Review permissions and data egress before registry submission.",
    "- Use environment variables for credentials; do not commit credential values.",
    "- Run registry tests and dry-run before requesting review.",
    "",
  ].join("\n");
}

function buildRegistryTest(input: BuildCapabilityScaffoldInput, variables: string[]): Record<string, unknown> {
  const risk = riskForMethod(input.method);
  return {
    name: "dry-run scaffold",
    capability: input.id,
    mode: "dry_run",
    input: Object.fromEntries(variables.map((variable) => [variable, "example"])),
    expect: {
      status: "dry_run",
      request: {
        method: input.method,
        url: testUrl(input.urlTemplate, variables),
      },
      permission: {
        risk,
        decision: risk === "read_only" ? "allow" : "ask",
      },
    },
  };
}

export function buildCapabilityScaffold(input: BuildCapabilityScaffoldInput): CapabilityScaffold {
  if (input.type !== undefined && input.type !== "http") {
    throw new Error("V1 Capability scaffold only supports HTTP capabilities.");
  }

  assertCapabilityId(input.id);
  assertCategory(input.category);
  assertNonEmpty(input.title, "title");
  assertNonEmpty(input.description, "description");
  assertNonEmpty(input.urlTemplate, "urlTemplate");
  assertAuth(input.auth, input.id);

  const variables = templateVariables(input.urlTemplate);
  const manifest = buildManifest(input, variables);
  const registryTest = buildRegistryTest(input, variables);

  return {
    files: [
      {
        path: "manifest.yml",
        content: YAML.stringify(manifest, { lineWidth: 0 }),
      },
      {
        path: "README.md",
        content: buildReadme(input),
      },
      {
        path: "tests/basic.yml",
        content: YAML.stringify(registryTest, { lineWidth: 0 }),
      },
    ],
  };
}
