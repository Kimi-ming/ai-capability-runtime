# vercel.get_deployments

List recent Vercel deployments for a project.

## Risk

`read_only`

This Capability reads deployment metadata and does not change external state.

## Auth

Set:

```bash
VERCEL_TOKEN=...
```

## Example Input

```json
{
  "project_id": "prj_123",
  "limit": 5
}
```
