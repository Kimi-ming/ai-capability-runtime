# Changelog

All notable changes to OpenCap will be documented in this file.

The project follows Semantic Versioning after `1.0.0`. During `0.x`, public contracts may evolve, but breaking changes must still be documented.

## Unreleased

### Added

- OpenCap V1 project architecture and Chinese documentation system.
- Capability Manifest V1 draft and HTTP-only scope.
- Local Runtime, Policy, Audit, MCP, Registry, security, and governance design docs.
- GitHub issue and pull request templates.
- Initial registry examples for developer-tool capabilities.
- Interoperability profiles, consent model, capability package contract, conformance suite, and agentic risk mapping docs.
- Identity/auth model, Secret Resolver contract, credential lifecycle runbook, least-privilege review, and remote OAuth boundary docs.
- Execution semantics, retry/idempotency rules, failure recovery runbook, and execution evidence docs.
- Composition boundary, capability graph, multi-step execution, composition failure recovery, and saga/workflow research docs.
- Trust model, capability advisory process, deprecation/revocation lifecycle, and capability quality score docs.
- Usage metering, quota/budget policy, rate limit/abuse control, commerce boundary, and usage evidence docs.
- Tool projection, prompt-surface security, discovery/selection boundary, and model-visible metadata lint docs.
- Result envelope, output validation, tool result sanitization, result provenance, and result delivery boundary docs.
- Input data governance, data classification, data egress policy, input provenance, and data minimization docs.

### Changed

- `github.create_issue` manifest now includes JSON body rendering and bearer token placement.

### Known Gaps

- CLI/runtime implementation is still scaffold-level.
- `pnpm` is not available in the current local shell, so full workspace validation has not been run in this environment.
