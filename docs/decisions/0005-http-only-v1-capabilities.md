# Decision 0005: HTTP-only V1 Capabilities

Date: 2026-05-07

## Status

Accepted

## Context

The current manifest concept includes future Capability types:

- `http`
- `mcp`
- `local`

However, V1 requirements and implementation milestones focus on HTTP execution.
The existing schema shape requires `execution.method`, `execution.url`, and
`execution.timeout_ms`, which only fits HTTP Capabilities.

## Decision

OpenCap V1 will support only `type: http` at runtime and in the stable schema.

`mcp` and `local` Capabilities remain roadmap items. They require separate
design review before they become schema-valid registry entries.

## Consequences

The V1 implementation should:

- validate only HTTP Capabilities
- reject `type: mcp` and `type: local`
- keep MCP proxy and local execution adapters as planned packages only
- revisit conditional schema validation in a later RFC

This avoids pretending V1 supports execution modes that have not been reviewed.
