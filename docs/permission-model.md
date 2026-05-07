# Permission Model

OpenCap assumes AI-driven action should be permissioned by default.

The runtime must know what a Capability can do before it executes the action.

## Risk Categories

V1 recognizes these categories:

| Risk | Meaning |
| --- | --- |
| `read_only` | Reads data without changing external state. |
| `write` | Creates or updates external state. |
| `external_send` | Sends messages or content outside the user boundary. |
| `destructive` | Deletes, overwrites, or performs hard-to-reverse actions. |
| `financial` | Spends money, moves money, buys, sells, or subscribes. |
| `code_execution` | Executes local or remote code or commands. |
| `secret_access` | Reads or handles secrets, tokens, or credentials. |

## Decisions

The policy engine returns one of:

- `allow`
- `ask`
- `deny`

The default V1 policy should be `ask`.

## Example Policy

```yaml
policies:
  default: ask

  rules:
    - match:
        risk: read_only
      decision: allow

    - match:
        risk: write
      decision: ask

    - match:
        risk: destructive
      decision: deny

    - match:
        risk: financial
      decision: ask
      require_human_confirmation: true
```

## Confirmation UX

A confirmation prompt should show:

- Capability name
- risk level
- target resource
- proposed input
- policy reason
- available decisions

Example:

```text
AI wants to call github.create_issue

Capability: Create GitHub Issue
Risk: write
Target: github.issue

Input:
- repo: opencap/opencap
- title: Add runtime permission engine

[Allow once] [Always allow this Capability] [Deny]
```

## Audit Requirements

Every invocation must log:

- timestamp
- host identifier when known
- Capability id and version
- input hash or redacted input
- policy decision
- confirmation result
- execution result
- duration
- error details when applicable
