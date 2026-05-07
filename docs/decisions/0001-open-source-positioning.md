# Decision 0001: Open-source Positioning

Date: 2026-05-07

## Status

Accepted

## Context

The project could be positioned as:

- an Agent platform
- an MCP marketplace
- an API marketplace
- a hosted automation product
- a capability runtime and governance layer

External research shows that MCP already has an official registry for server
metadata, OpenAI Apps SDK uses MCP as its app/tool substrate, and A2A is focused
on agent-to-agent collaboration.

## Decision

OpenCap will position itself as:

```text
an open-source capability runtime and governance layer for AI-native applications
```

It will not position itself as a generic Agent builder or marketplace.

## Consequences

OpenCap V1 must prioritize:

- manifest standard
- local runtime
- policy checks
- audit logs
- registry validation
- MCP compatibility

OpenCap V1 should defer:

- hosted cloud platform
- commercial marketplace
- agent orchestration
- visual workflow builder
- broad UI surface
