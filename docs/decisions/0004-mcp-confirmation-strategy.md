# Decision 0004: MCP Confirmation Strategy

Date: 2026-05-07

## Status

Accepted

## Context

OpenCap V1 requires `ask` decisions for risky Capability calls. The first write
demo, `github.create_issue`, uses:

```yaml
permissions:
  - resource: github.issue
    action: create
    risk: write
    confirmation: ask
```

The runtime will be exposed through `opencap serve --mcp`. MCP servers commonly
communicate over STDIO, where arbitrary terminal prompts can corrupt the protocol
stream.

## Decision

OpenCap will not implement MCP `ask` decisions as terminal prompts.

V1 confirmation behavior:

- In MCP mode, if the client supports elicitation, OpenCap may request
  confirmation through the MCP client.
- In MCP mode, if elicitation is unavailable, OpenCap returns a structured
  `confirmation_required` result and does not execute the Capability.
- In non-MCP CLI mode, OpenCap may prompt on the terminal.
- Denied or unconfirmed calls must still be logged.

## Consequences

The runtime must know the invocation channel:

- `cli`
- `mcp`
- future `http`

The policy engine only decides `allow`, `ask`, or `deny`. The channel-specific
confirmation handler decides how `ask` is resolved.

This keeps policy evaluation independent from user interaction.
