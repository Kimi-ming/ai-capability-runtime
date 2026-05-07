# Introduction

OpenCap is an open-source capability layer for AI-native applications.

It gives developers a standard way to describe real-world actions as
AI-callable Capabilities, and gives users a runtime that can install, authorize,
execute, and audit those Capabilities.

## What OpenCap Is

OpenCap is:

- a Capability Manifest standard
- a local or self-hosted runtime
- an MCP-compatible gateway
- a permission and policy system
- an invocation log
- a Git-based registry
- a developer toolchain

## What OpenCap Is Not

OpenCap is not:

- an Agent marketplace
- an AI chat app
- a general automation platform
- an API marketplace
- a model provider
- a hosted-only SaaS product

The core idea is simple:

```text
Models reason.
Agents plan.
OpenCap lets them safely act.
```

## The Capability Unit

The central object in OpenCap is the Capability.

A Capability is a declared, permissioned, testable unit of action. It can wrap an
HTTP endpoint, an API call, an MCP server tool, a data source, or a local
command. Each Capability includes:

- identity and version
- input and output schema
- auth requirements
- permissions and risk level
- execution behavior
- tests and trust metadata

## Why Capabilities Instead of Agents?

Agents are orchestration logic. They decide what to do next. Capabilities are the
safe action surface that Agents can call.

This distinction matters because:

- models and Agent frameworks will change quickly
- APIs, accounts, permissions, logs, and trust records persist
- teams need policy control around actions, not only around prompts
- multiple hosts should be able to use the same action surface

## V1 Outcome

The V1 system should let one AI host invoke one real Capability through the
OpenCap runtime with permission checks and audit logs.

The first complete demo target is:

```text
AI Host -> OpenCap MCP Runtime -> github.create_issue -> GitHub API -> Audit Log
```
