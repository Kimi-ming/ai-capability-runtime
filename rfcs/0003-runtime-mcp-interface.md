# RFC 0003: Runtime MCP Interface

## Status

Draft

## Summary

Define how OpenCap exposes installed Capabilities to MCP-compatible hosts.

## Motivation

Users should not need to install one MCP server per external service. OpenCap can
act as a single MCP gateway that exposes installed Capabilities as tools.

## Proposal

`opencap serve --mcp` starts an MCP server.

For each installed Capability:

- expose one MCP tool
- use the Capability input schema as the tool input schema
- include permission metadata in the tool description where possible
- validate input before execution
- route invocation through the policy engine
- write an audit log

## Tool Naming

Tool names should derive from Capability ids. For example:

```text
github.create_issue -> github_create_issue
```

## Open Questions

- How should host identity be captured?
- How should confirmation prompts be implemented across different hosts?
- Should OpenCap expose a separate introspection tool for installed Capabilities?
