# Governance

OpenCap is designed as an open standard and open runtime for AI-callable
Capabilities.

## Project Roles

- contributors propose code, docs, registry entries, and RFCs
- maintainers review changes and manage releases
- security reviewers evaluate risk-sensitive registry entries and runtime changes
- core maintainers make final calls on compatibility and governance decisions

## Decision Making

OpenCap uses lazy consensus for routine changes. Maintainers may request an RFC
when a change affects:

- manifest compatibility
- permission semantics
- registry trust levels
- runtime invocation behavior
- MCP or host-facing interfaces

## Registry Governance

The registry is community-maintained and Git-based. Registry inclusion means a
Capability has passed project-defined checks. It is not a blanket endorsement of
the third-party service or maintainer.

OpenCap may remove or downgrade registry entries that:

- request misleading permissions
- hide external calls
- fail validation
- are abandoned and security-sensitive
- violate project conduct rules

## Commercial Use

The open-source project is OpenCap. A future hosted or enterprise distribution
may exist separately, but the core standard, runtime, and registry governance
should remain usable without a hosted service.
