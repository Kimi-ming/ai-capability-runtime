# V1 Requirements

OpenCap V1 is a local-first proof of the capability runtime model.

## Product Thesis

AI hosts and agents need a controlled way to call real-world capabilities.

The valuable open-source layer is not another Agent and not another directory.
It is the local runtime that can install, authorize, execute, verify, and audit
Capabilities.

## Target Users

### Primary

Developers building AI agents, ChatGPT apps, Claude/Cursor workflows, or internal
automation hosts who need a safer way to expose external tools.

### Secondary

Open-source maintainers and platform teams who want a Git-based registry and a
review process for AI-callable tools.

## V1 User Stories

### Developer Defines a Capability

As a developer, I can write a `manifest.yml` that describes an HTTP capability,
including input, output, auth, permissions, execution, and metadata.

Acceptance criteria:

- manifest validates against `manifest.schema.json`
- validation errors identify the broken field
- schema supports `http` capabilities

### Developer Installs a Capability

As a developer, I can install a registry Capability into a local OpenCap runtime.

Acceptance criteria:

- `opencap install github.create_issue` resolves a local registry entry
- installed manifests are stored under `opencap.local/installed`
- `opencap list` shows installed Capabilities

### Host Calls a Capability Through MCP

As an AI host user, I can configure one OpenCap MCP server and see installed
Capabilities as tools.

Acceptance criteria:

- `opencap serve --mcp` starts a local MCP server
- installed Capabilities are exposed as MCP tools
- MCP tool input schema is derived from the manifest
- tool names are deterministic

### Runtime Evaluates Policy

As a user, I can define local policy so read-only actions can run automatically
and write actions require confirmation.

Acceptance criteria:

- default policy is `ask`
- `read_only` may be configured as `allow`
- `write` may be configured as `ask`
- denied calls are not executed

### Runtime Executes HTTP Capability

As a host, I can call an installed HTTP Capability and receive structured output.

Acceptance criteria:

- input is validated before execution
- templated URL values come from validated input
- API key can be read from an environment variable
- runtime applies timeout
- output is JSON when possible

### Runtime Writes Audit Logs

As a user, I can inspect what Capabilities were called and what decisions were
made.

Acceptance criteria:

- every invocation writes a log entry
- logs include capability id, version, timestamp, policy decision, status, and
  duration
- logs redact secrets
- `opencap logs` displays recent invocations

## Non-Goals for V1

- hosted cloud runtime
- multi-tenant accounts
- payments
- full OAuth implementation
- arbitrary local command execution
- browser UI for the console
- A2A server implementation
- marketplace ranking or search
- signature verification
- enterprise RBAC

## V1 Demo Scenario

```text
Install github.create_issue.
Start opencap serve --mcp.
Connect an MCP-compatible host.
Ask the host to create a GitHub issue.
OpenCap validates input, asks for confirmation, executes the GitHub API call,
and logs the invocation.
```

## Success Criteria

OpenCap V1 is successful when a developer can clone the repo, install
dependencies, validate sample Capabilities, run the local MCP runtime, and
successfully execute one real write Capability with an audit log.
