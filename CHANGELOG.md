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

### Changed

- `github.create_issue` manifest now includes JSON body rendering and bearer token placement.

### Known Gaps

- CLI/runtime implementation is still scaffold-level.
- `pnpm` is not available in the current local shell, so full workspace validation has not been run in this environment.
