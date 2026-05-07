# Roadmap

## v0.1: Local Runtime

Goal:

```text
Install a Capability, expose it through MCP, execute it with policy checks, and
write an invocation log.
```

Scope:

- manifest schema
- CLI skeleton
- local registry install
- MCP server mode
- HTTP Capability executor
- local policy file
- SQLite invocation logs

## v0.2: Registry

Goal:

```text
Community members can submit Capabilities and CI validates them.
```

Scope:

- registry layout
- CI manifest validation
- mock test format
- registry contribution checklist
- trust levels

## v0.3: Adapters

Goal:

```text
Convert existing tool surfaces into OpenCap Capabilities.
```

Scope:

- OpenAPI to Capability
- MCP tool to Capability
- HTTP endpoint to Capability
- CLI command to Capability

## v0.4: Console

Goal:

```text
Users can see installed Capabilities, policies, and logs in a local UI.
```

Scope:

- installed Capability list
- policy editor
- invocation log viewer
- risk display

## v0.5: Verified Capabilities

Goal:

```text
Registry entries can carry useful trust metadata.
```

Scope:

- test status
- maintainer verification
- security review state
- permission scoring
- version signing research

## v1.0: Capability Network

Goal:

```text
OpenCap is usable as a local-first, self-hostable Capability layer across
multiple hosts and organizations.
```

Scope:

- self-hosted registry
- organization workspaces
- team policy controls
- remote runtime mode
- multi-host compatibility
- Capability composition
