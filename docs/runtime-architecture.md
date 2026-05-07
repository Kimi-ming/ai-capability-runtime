# Runtime Architecture

The OpenCap Runtime is the local or self-hosted service that executes installed
Capabilities.

## High-Level Flow

```text
AI Host
  |
MCP / HTTP / SDK
  |
OpenCap Runtime
  |
Policy Engine
Secret Manager
Capability Executor
Audit Logger
  |
External APIs / MCP Servers / Databases / SaaS Tools
```

## Runtime Responsibilities

The runtime must:

- load installed Capabilities
- expose them as MCP tools
- validate input
- evaluate permission policies
- load scoped secrets
- execute Capabilities
- validate outputs
- write invocation logs
- return structured results

## Components

### Capability Loader

Reads manifests from the local installation directory and validates them against
the OpenCap schema.

### MCP Gateway

Exposes each installed Capability as an MCP tool. Tool names should be derived
from the Capability id.

### Policy Engine

Evaluates declared permissions against local policy rules and returns `allow`,
`ask`, or `deny`.

### Secret Manager

Loads credentials from approved locations. V1 may use environment variables. A
later version should support OS keychains and scoped secret storage.

### Capability Executor

Runs the Capability implementation. V1 focuses on HTTP execution.

### Audit Logger

Writes every invocation to local SQLite storage. Logs must be queryable by CLI
and Console.

## Local State

V1 should use a local state directory:

```text
opencap.local/
  installed/
  policies.yml
  logs.sqlite
  secrets/
```

`opencap.local/` is ignored by git.
