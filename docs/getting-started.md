# Getting Started

This tutorial describes the intended V1 developer workflow. Some commands are
scaffolded before full runtime implementation.

## Prerequisites

- Node.js 22 or newer
- pnpm 9 or newer
- an MCP-compatible host for runtime testing
- a GitHub token for the `github.create_issue` demo

## Install Dependencies

```bash
pnpm install
```

## Validate the Sample Registry

```bash
pnpm validate
```

This validates sample Capability manifests against the OpenCap schema.

## Inspect a Capability

Open the sample GitHub issue Capability:

```bash
registry/developer-tools/github.create_issue/manifest.yml
```

It declares:

- the tool input schema
- the output schema
- GitHub auth requirements
- a medium-risk write permission
- an HTTP execution target

## Install a Capability

The intended V1 command is:

```bash
opencap install github.create_issue
```

The runtime should store installed Capabilities in a local OpenCap state
directory and expose them through `opencap serve --mcp`.

## Configure an MCP Host

After the runtime exists, configure a host with:

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

## Expected Runtime Flow

When an AI host calls `github.create_issue`, OpenCap should:

1. validate the input against the Capability schema
2. identify required permissions
3. apply the local policy
4. request human confirmation when required
5. load the GitHub token from the secret manager
6. call the GitHub API
7. return a structured result
8. write an invocation log
