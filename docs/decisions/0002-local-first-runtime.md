# Decision 0002: Local-first Runtime

Date: 2026-05-07

## Status

Accepted

## Context

OpenCap could start as a hosted service, but hosted infrastructure would force
early decisions around accounts, billing, multi-tenancy, cloud security, and
commercial distribution.

The open-source wedge is stronger if developers can run a local runtime and
connect it to MCP-compatible hosts.

## Decision

OpenCap V1 will be local-first.

The runtime state will live under:

```text
opencap.local/
```

The first supported auth mode for external APIs will be environment-variable API
keys for local development.

## Consequences

Benefits:

- easy to clone and try
- simpler threat model
- no hosted account dependency
- aligns with open-source adoption

Tradeoffs:

- no shared team policies in V1
- no remote registry install analytics
- no hosted OAuth broker in V1
- user must manage local environment secrets
