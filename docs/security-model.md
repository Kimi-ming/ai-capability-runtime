# Security Model

OpenCap provides permission boundaries, audit logs, and verification metadata.
It does not guarantee that every third-party Capability is safe.

## Threats

OpenCap should defend against:

- overbroad permissions
- hidden network calls
- unreviewed destructive actions
- prompt-driven misuse of write tools
- secret leakage
- untraceable AI actions
- confusing or misleading Capability descriptions

## Controls

V1 controls:

- manifest validation
- explicit permission declarations
- risk-based policy decisions
- human confirmation for risky operations
- environment-scoped secrets
- invocation logs
- registry review checklist

## Secret Handling

V1 may support environment variable credentials:

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
```

Runtime logs must never write raw secret values.

## Logging

Logs should prefer redaction and hashing for sensitive inputs. A full input log
can be useful for debugging, but it creates privacy risk. The default should be
safe for local development.

## Out of Scope for V1

- sandboxing arbitrary code execution
- hosted multi-tenant isolation
- formal verification
- payment execution
- remote secret vaults
- enterprise SSO and RBAC

These are future concerns, not V1 blockers.
