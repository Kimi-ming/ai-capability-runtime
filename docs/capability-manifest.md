# Capability Manifest

The Capability Manifest is the core OpenCap standard. It describes an action or
data source that an AI host can call through the OpenCap runtime.

## Required Fields

```yaml
id: github.create_issue
name: Create GitHub Issue
description: Create a GitHub issue from structured input.
version: 0.1.0
type: http
input: {}
output: {}
auth: {}
permissions: []
execution: {}
metadata: {}
```

## Identity

`id` must be globally stable inside a registry.

Recommended format:

```text
provider.action_name
```

Examples:

- `github.create_issue`
- `vercel.get_deployments`
- `notion.create_page`

## Type

V1 supports:

- `http`: execute an HTTP request
- `mcp`: proxy an MCP tool
- `local`: execute a local command or SDK implementation

Only `http` is expected in the first runtime milestone.

## Input and Output

`input` and `output` use JSON Schema.

Input schema is used to:

- expose tool arguments to AI hosts
- validate runtime calls
- render confirmation prompts
- create test fixtures

Output schema is used to:

- validate tool results
- document return values
- help hosts reason about follow-up actions

## Auth

Auth declares what credential the runtime needs.

V1 auth types:

- `none`
- `api_key`
- `oauth2`

Example:

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
```

## Permissions

Permissions declare what external resources the Capability may touch.

```yaml
permissions:
  - resource: github.issue
    action: create
    risk: write
    confirmation: ask
```

Each permission must include:

- `resource`
- `action`
- `risk`
- `confirmation`

## Execution

HTTP Capabilities declare how the runtime calls the external endpoint.

```yaml
execution:
  method: POST
  url: https://api.github.com/repos/{{owner}}/{{repo}}/issues
  timeout_ms: 10000
```

Template variables come from validated input.

## Metadata

Metadata helps registry reviewers and users evaluate the Capability.

```yaml
metadata:
  category: developer-tools
  maintainer: opencap
  license: MIT
  trust_level: experimental
```
