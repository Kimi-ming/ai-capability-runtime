# V1 Architecture

OpenCap V1 is a local-first runtime and toolchain.

## System Boundary

```text
MCP-compatible Host
        |
        | MCP tool list / tool call
        v
OpenCap MCP Bridge
        |
        v
OpenCap Runtime
  - Capability Loader
  - Input Validator
  - Policy Engine
  - Secret Resolver
  - HTTP Executor
  - Audit Logger
        |
        v
External APIs
```

## Local State

V1 stores state under:

```text
opencap.local/
  installed/
    github.create_issue/
      manifest.yml
  policies.yml
  logs.sqlite
```

This directory is ignored by git.

## Packages

### `@opencap/spec`

Owns:

- manifest TypeScript types
- JSON Schema
- manifest validation

### `@opencap/cli`

Owns:

- `opencap validate`
- `opencap install`
- `opencap list`
- `opencap serve --mcp`
- `opencap logs`

### `@opencap/runtime`

Owns:

- local state paths
- installed Capability loading
- policy evaluation
- secret resolution
- invocation lifecycle
- audit logging

### `@opencap/mcp`

Owns:

- mapping Capability manifests to MCP tools
- MCP server lifecycle
- routing tool calls to runtime invocation

### `@opencap/sdk`

Deferred for V1 implementation. It remains scaffolded but should not block the
local runtime.

## Invocation Lifecycle

```text
1. Host calls MCP tool.
2. MCP bridge maps tool name to Capability id.
3. Runtime loads manifest.
4. Runtime validates input.
5. Runtime evaluates permissions against policy.
6. Runtime asks, allows, or denies.
7. Runtime resolves secrets.
8. HTTP executor performs the request.
9. Runtime validates or normalizes output.
10. Audit logger records the invocation.
11. MCP bridge returns structured result.
```

## Policy Engine V1

V1 uses a simple YAML policy format:

```yaml
default: ask
rules:
  - match:
      risk: read_only
    decision: allow
  - match:
      risk: write
    decision: ask
  - match:
      risk: destructive
    decision: deny
```

The policy engine should be designed so a later OPA/Rego backend can replace or
augment it.

## Audit Log V1

The first log schema should be SQLite-friendly:

```text
id
timestamp
host
capability_id
capability_version
risk
decision
status
duration_ms
input_redacted_json
output_redacted_json
error
```

Names should be easy to map to OpenTelemetry later.

## Security Constraints

- default decision is `ask`
- no destructive local command execution in V1
- secrets must not be logged
- all external execution must have timeouts
- runtime must validate input server-side
- token passthrough is not allowed

## Implementation Order

1. make `opencap validate` call the spec validator
2. implement local install/list
3. implement policy engine
4. implement audit log
5. implement HTTP executor
6. implement MCP bridge
7. run GitHub issue demo
