# Technical Plan Review

Date: 2026-05-07

Scope:

- V1 requirements
- V1 architecture
- permission model
- manifest schema
- MCP/runtime package boundary
- sample registry Capabilities

Review stance:

OpenCap's direction is technically coherent, but the plan is not yet ready for
implementation without tightening a few protocol and security edges. The main
risk is not "can we write the code"; it is whether V1 preserves the promise of a
safe capability runtime while staying small enough to ship.

## Verdict

Proceed with V1, with amendments.

The architecture should keep the V1 loop:

```text
validate -> install -> serve --mcp -> policy -> execute HTTP -> audit
```

But implementation must address the findings below before the GitHub issue demo
is considered credible.

## Findings

### P0: `ask` Confirmation Is Underspecified for MCP STDIO

The current plan says write operations should require confirmation, and the demo
expects `github.create_issue` to ask before execution. That is correct
product-wise, but the technical mechanism is not specified.

This matters because an MCP server running over STDIO cannot print arbitrary
interactive prompts to stdout without corrupting the protocol stream. If the
runtime implements `ask` as a terminal prompt inside `opencap serve --mcp`, the
first write-capability demo may break host communication.

Required amendment:

- V1 must choose an explicit confirmation path.
- If MCP elicitation is available from the client, use it.
- If elicitation is not available, return a structured `confirmation_required`
  result and do not execute.
- Terminal prompts are allowed only in non-MCP CLI flows.

Owner:

- runtime and MCP bridge

Affected docs:

- `docs/planning/v1-architecture.md`
- `docs/permission-model.md`
- `docs/decisions/0003-policy-before-execution.md`

### P0: Schema Claims `mcp` and `local` Types But Requires HTTP Execution Shape

The manifest schema currently allows `type: http`, `type: mcp`, and
`type: local`, but `execution.method`, `execution.url`, and
`execution.timeout_ms` are always required. That is only correct for HTTP
Capabilities.

This creates a compatibility trap: contributors can write a manifest with
`type: mcp` that is schema-invalid unless it includes meaningless HTTP fields.

Required amendment:

- Either restrict V1 schema to `type: http`.
- Or add conditional schema validation by Capability type.

Recommendation:

- Restrict V1 to `http` until the MCP proxy and local execution designs are
  reviewed separately.

Owner:

- spec package

Affected docs/code:

- `packages/spec/schema/manifest.schema.json`
- `docs/capability-manifest.md`
- `docs/planning/v1-requirements.md`

### P1: URL Templating Needs Guardrails

The HTTP executor plan allows templated URLs such as:

```text
https://api.github.com/repos/{{owner}}/{{repo}}/issues
```

This is fine for fixed-host APIs, but the `http.request_demo` sample accepts an
entire user-provided URL. Without outbound host policy, this becomes a broad
network-request tool.

Required amendment:

- V1 should distinguish fixed-host HTTP Capabilities from user-supplied URL
  Capabilities.
- The runtime should record the final resolved URL in the audit log.
- Registry review should flag Capabilities that allow arbitrary outbound URLs.

Recommendation:

- Keep `http.request_demo` as an example, but mark it as not suitable for default
  registry installation.

### P1: Audit Log Redaction Policy Is Too Abstract

The plan says logs should redact secrets and prefer redaction/hashing for
sensitive inputs. That is directionally right, but V1 needs a deterministic
minimum so contributors can implement consistently.

Required amendment:

- Define default redaction behavior for auth headers, env vars, tokens, and
  fields named `token`, `secret`, `password`, `api_key`, or `authorization`.
- Log policy decisions even when execution is denied.
- Log a hash of full input when redacted input is stored.

### P1: `opencap install` Needs a Local Registry Resolution Rule

The requirements say `opencap install github.create_issue` resolves a local
registry entry, but not how.

Required amendment:

- V1 should resolve `registry/**/<capability-id>/manifest.yml`.
- Installation should copy the entire Capability directory into
  `opencap.local/installed/<capability-id>/`.
- The install operation should fail if multiple matching ids are found.

### P1: MCP Tool Naming Is Deterministic But Collision Handling Is Missing

The current MCP helper maps `github.create_issue` to `github_create_issue`.

That is deterministic, but collision behavior is not defined. For example,
`a.b_c` and `a_b.c` could both map to `a_b_c`.

Required amendment:

- V1 should detect tool-name collisions at server startup and fail fast.
- The original Capability id must be included in tool metadata and audit logs.

### P2: Package Boundary Is Good, But Implementation Order Should Move MCP Later

The proposed implementation order puts MCP bridge after HTTP executor, which is
correct. The CLI should validate/install/list before any real MCP server work.

Recommendation:

- First ship local non-MCP invocation for a Capability.
- Then expose the same invocation through MCP.

This reduces protocol debugging while policy, logging, and HTTP execution are
still moving.

### P2: `secret_access` Risk Needs Narrower Semantics

The permission model includes `secret_access`, but V1 also uses environment
credentials. A Capability that uses a token to call GitHub should not
automatically be classified as `secret_access`; otherwise every authenticated
Capability becomes high-risk.

Required amendment:

- `secret_access` should mean the Capability can read, return, transform, or
  expose secret material.
- Normal credential use by the runtime on behalf of an API call should be
  represented by `auth`, not by a `secret_access` permission.

## Accepted Technical Direction

The following parts of the plan are sound:

- local-first runtime
- Git-based registry
- manifest-first design
- HTTP-only V1 execution target
- MCP bridge as the host interface
- policy before execution
- audit log as a core primitive
- OPA-inspired policy design without adopting Rego in V1
- OpenTelemetry-compatible log naming as a future path

## Required Pre-Implementation Checklist

Before implementing the GitHub issue demo:

- define confirmation behavior for MCP and non-MCP flows
- constrain the V1 schema to HTTP or add conditional validation
- define minimum audit redaction rules
- define local install resolution
- define MCP tool collision behavior
- classify `http.request_demo` as unsafe-by-default for registry install

## Recommended First Engineering Milestone

Milestone 1 should not be the full MCP demo. It should be:

```text
opencap validate registry/developer-tools/github.create_issue
opencap install github.create_issue
opencap list
opencap invoke github.create_issue --dry-run
opencap logs
```

Only after that works should we wire `opencap serve --mcp`.
