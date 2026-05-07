# RFC 0001: Capability Manifest V1

## Status

Draft

## Summary

Define the first stable shape of an OpenCap Capability Manifest.

## Motivation

AI hosts need a predictable way to understand what a tool does, what input it
requires, what output it returns, what permissions it needs, and how it executes.

Without a manifest standard, every Agent or host must integrate tools one by one.

## Proposal

An OpenCap Capability Manifest must include:

- identity
- description
- version
- type
- input schema
- output schema
- auth declaration
- permission declaration
- execution declaration
- metadata

V1 should support HTTP execution first.

## Compatibility

The manifest should map cleanly to MCP tool metadata, while preserving OpenCap's
permission and audit semantics.

## Open Questions

- Should manifest ids be globally namespaced?
- Should output schema be required for all Capabilities?
- Should registry trust metadata live inside the manifest or beside it?
