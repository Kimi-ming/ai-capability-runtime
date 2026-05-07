# Decision 0003: Policy Before Execution

Date: 2026-05-07

## Status

Accepted

## Context

AI hosts can dynamically decide to call tools. The runtime cannot assume that a
tool call is safe because the model chose it.

OpenAI Apps SDK guidance emphasizes least privilege, explicit consent, server
validation, human confirmation for irreversible operations, and audit logs. MCP
security guidance also warns against token passthrough and confused-deputy
patterns.

## Decision

Every OpenCap invocation must pass through policy evaluation before execution.

The policy decision must be one of:

- `allow`
- `ask`
- `deny`

The default decision is `ask`.

## Consequences

Every executor must accept a policy decision and must not bypass it.

The audit log must record:

- requested Capability
- declared risk
- decision
- confirmation result when applicable
- execution status

This makes policy and audit part of the core product, not optional middleware.
