# Security Policy

OpenCap exists to make AI-driven tool use safer, more auditable, and easier to
reason about. It does not guarantee that every third-party Capability is safe.

## Security Goals

- explicit permissions for every Capability
- policy checks before execution
- human confirmation for risky actions
- scoped secrets
- immutable invocation logs
- clear trust metadata for registry entries

## Risk Categories

OpenCap V1 recognizes these risk categories:

- `read_only`: reads data without changing external state
- `write`: creates or updates external state
- `external_send`: sends messages or content to people or external systems
- `destructive`: deletes, overwrites, or performs hard-to-reverse actions
- `financial`: spends money, moves money, buys, sells, or subscribes
- `code_execution`: executes local or remote code or commands
- `secret_access`: reads or handles secrets, tokens, or credentials

## Reporting a Vulnerability

Please do not open a public issue for suspected vulnerabilities.

Send a private report to the project maintainers with:

- affected component
- reproduction steps
- expected impact
- suggested mitigation if known

The project will acknowledge reports, investigate, and publish advisories when
appropriate.
