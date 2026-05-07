# github.create_issue

Create a GitHub issue from structured input.

## Risk

`write`

This Capability creates external state in a GitHub repository. The default
OpenCap policy should ask before execution.

## Auth

Set:

```bash
GITHUB_TOKEN=...
```

The token must be scoped to create issues in the target repository.

## Example Input

```json
{
  "owner": "opencap",
  "repo": "opencap",
  "title": "Add runtime permission engine",
  "body": "Track the V1 policy engine implementation.",
  "labels": ["runtime", "v0.1"]
}
```
