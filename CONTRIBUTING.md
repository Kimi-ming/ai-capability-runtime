# Contributing to OpenCap

OpenCap welcomes contributions to the standard, runtime, registry, docs, and
tooling. The project is early, so high-quality design feedback is as valuable as
code.

## Contribution Areas

- Capability Manifest schema
- permission model and policy behavior
- runtime and MCP interface
- CLI commands
- registry entries
- adapters for OpenAPI, HTTP, MCP, and CLI tools
- documentation and examples

## Capability Registry Requirements

Every registry Capability must include:

- `manifest.yml`
- `README.md`
- at least one test case under `tests/`
- declared permissions and risk level
- maintainer and license metadata
- no hidden external network calls beyond what the manifest declares
- no destructive default behavior

## Review Levels

Registry entries can progress through these trust levels:

- `experimental`: early community entry
- `listed`: passes schema validation
- `tested`: includes passing tests
- `verified`: maintainer identity or ownership is verified
- `official`: maintained by the OpenCap core team

## RFC Process

Use an RFC for changes that affect compatibility or ecosystem behavior:

- manifest schema
- permission semantics
- runtime APIs
- MCP exposure
- registry governance
- trust metadata

Create a new file under `rfcs/` using the next numeric prefix.

## Local Development

```bash
pnpm install
pnpm build
pnpm test
```

The implementation is intentionally small and TypeScript-first so contributors
can inspect the full system without a large infrastructure setup.
