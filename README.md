# OpenCap

OpenCap is an open-source capability layer for AI-native applications.

It lets developers define APIs, tools, data sources, and services as AI-callable
Capabilities, then install and run them across MCP-compatible hosts with
permissions, audit logs, and verification metadata.

OpenCap does not try to be an Agent, a chat app, or a marketplace frontend. It
provides the standard, runtime, registry, and toolchain that allow Agents to
safely act in the real world.

## Why OpenCap?

AI models are getting better at reasoning, but they still need controlled access
to real systems:

- APIs and SaaS tools
- private data sources
- account-scoped permissions
- secrets and credentials
- write operations
- audit trails
- verification and trust metadata

OpenCap provides:

- a standard Capability Manifest
- a local or self-hosted Capability Runtime
- MCP-compatible tool exposure
- permission policies
- invocation logs
- a Git-based Capability Registry
- developer CLI and SDK foundations

## Design Principles

1. Capability-first, not Agent-first.
2. Local-first, cloud-optional.
3. Permissioned by default.
4. Every invocation must be auditable.
5. Protocol-compatible, not vendor-locked.
6. Registry is community-governed.

## Core Loop

```text
Capability Manifest
        |
OpenCap CLI
        |
OpenCap Registry
        |
OpenCap Runtime
        |
MCP-compatible Host
        |
External API call
        |
Audit Log
```

## Repository Layout

```text
docs/        Project documentation
rfcs/        Design proposals for standards and runtime behavior
packages/    Spec, CLI, runtime, MCP bridge, SDK, and adapters
apps/        Console and future registry web surfaces
registry/    Git-based community Capability Registry
examples/    Example Capabilities and host configuration
```

## V1 Scope

The first useful version of OpenCap should prove one end-to-end flow:

```text
developer writes manifest.yml
        |
opencap validate
        |
opencap install
        |
opencap serve --mcp
        |
AI host calls a tool
        |
OpenCap checks policy
        |
OpenCap executes the external API call
        |
OpenCap writes an invocation log
```

V1 starts with these sample Capabilities:

- `github.create_issue`
- `github.search_repo`
- `vercel.get_deployments`
- `http.request_demo`

## Quick Start

This repository currently contains the V1 framework and documentation. The first
implementation target is the CLI/runtime path:

```bash
pnpm install
pnpm --filter @opencap/spec validate
pnpm --filter @opencap/cli dev -- validate registry/developer-tools/github.create_issue
```

After the runtime is implemented, an MCP-compatible host should be able to load:

```json
{
  "mcpServers": {
    "opencap": {
      "command": "opencap",
      "args": ["serve", "--mcp"]
    }
  }
}
```

## Documentation

- [Introduction](docs/introduction.md)
- [Getting Started](docs/getting-started.md)
- [Capability Manifest](docs/capability-manifest.md)
- [Permission Model](docs/permission-model.md)
- [Runtime Architecture](docs/runtime-architecture.md)
- [Registry Guidelines](docs/registry-guidelines.md)
- [Security Model](docs/security-model.md)
- [Roadmap](docs/roadmap.md)

## Governance

OpenCap is designed as an open standard and open runtime. See:

- [Contributing](CONTRIBUTING.md)
- [Governance](GOVERNANCE.md)
- [Security](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## License

MIT
