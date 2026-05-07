# Skills Scan

Date: 2026-05-07

This document records the skills and workflows used or considered during the
early OpenCap architecture stage.

## Local Skills Used

### find-skills

Purpose:

- discover external agent skills that may help with MCP, runtime, security, and
  architecture work.

How it was used:

- searched the public skills ecosystem for MCP/runtime/security skills.

Result:

- `mapbox/mapbox-agent-skills@mapbox-mcp-runtime-patterns` appeared relevant
  with 418 installs.
- `omer-metin/skills-for-antigravity@mcp-security` appeared relevant but had low
  install count.
- `hack23/cia@mcp-gateway-security` appeared relevant but had low install count.

Decision:

- do not install any new skill yet.
- rely on official MCP, OpenAI, A2A, OPA, and OpenTelemetry documentation for
  architecture decisions.
- revisit `mapbox-mcp-runtime-patterns` if we need implementation patterns for
  MCP runtime behavior.

### documentation-writer

Purpose:

- keep project documentation organized by audience and goal.

How it maps to OpenCap docs:

- tutorials: `docs/getting-started.md`
- how-to: `docs/registry-guidelines.md`
- reference: `docs/capability-manifest.md`
- explanation: `docs/introduction.md`, `docs/runtime-architecture.md`,
  `docs/security-model.md`

### openai-docs

Purpose:

- use official OpenAI documentation when evaluating Apps SDK, AgentKit, Agents
  SDK, MCP connectors, and security guidance.

OpenCap implication:

- OpenCap should integrate with OpenAI-facing MCP/App surfaces, but it should not
  become an OpenAI-only project.

## Skills to Add Later

Consider adding or creating skills for:

- MCP implementation review
- runtime security review
- policy engine design
- registry submission review
- OpenTelemetry instrumentation
- CLI UX review

## Internal Team Practices

Until dedicated skills exist, the project should use these standing roles during
design reviews:

- product architect: scope and user value
- protocol architect: MCP/A2A/OpenAPI compatibility
- security reviewer: auth, policy, secrets, audit
- runtime engineer: local state, execution, install flow
- DX reviewer: CLI, examples, docs, contribution flow

These are working roles, not separate products.
