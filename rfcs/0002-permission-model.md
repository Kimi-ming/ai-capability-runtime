# RFC 0002: Permission Model

## Status

Draft

## Summary

Define how OpenCap declares, evaluates, and audits Capability permissions.

## Motivation

AI-driven actions need a stronger permission model than ordinary API calls. A
model can choose actions dynamically, and users need clear boundaries around what
those actions can change.

## Proposal

Each Capability declares one or more permissions:

```yaml
permissions:
  - resource: github.issue
    action: create
    risk: write
    confirmation: ask
```

The runtime evaluates these permissions against local policy and returns one of:

- `allow`
- `ask`
- `deny`

## Risk Levels

V1 risk categories:

- `read_only`
- `write`
- `external_send`
- `destructive`
- `financial`
- `code_execution`
- `secret_access`

## Audit

Every invocation records the permission decision and confirmation outcome.

## Open Questions

- Should policy rules match on host identity?
- Should policy rules match on input values?
- How should one-time confirmations be stored?
