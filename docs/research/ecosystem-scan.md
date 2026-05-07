# Ecosystem Scan

Date: 2026-05-07

This scan summarizes the external standards, products, and design signals that
shape OpenCap V1.

## Research Question

Where should OpenCap sit in the AI-native ecosystem if it wants to be open-source
infrastructure rather than another Agent, marketplace, or chat UI?

## Sources Reviewed

- OpenAI Apps SDK: https://developers.openai.com/apps-sdk
- OpenAI Apps SDK MCP server concept: https://developers.openai.com/apps-sdk/concepts/mcp-server
- OpenAI Apps SDK security and privacy: https://developers.openai.com/apps-sdk/guides/security-privacy
- OpenAI Agents SDK: https://platform.openai.com/docs/guides/agents-sdk/
- OpenAI Agent Builder / AgentKit: https://platform.openai.com/docs/guides/agent-builder
- MCP server primitives: https://modelcontextprotocol.io/specification/2025-11-25/server/index
- MCP official registry: https://modelcontextprotocol.io/registry/about
- MCP elicitation: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
- MCP authorization: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- MCP security best practices: https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
- A2A official specification: https://a2a-protocol.org/dev/specification/
- Google A2A announcement: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- Open Policy Agent: https://www.openpolicyagent.org/docs/latest
- OpenTelemetry semantic conventions: https://opentelemetry.io/docs/specs/semconv/

## Key Findings

### MCP Is the Tool and Context Protocol

MCP defines the server-side primitives that hosts and models use:

- Prompts are user-controlled.
- Resources are application-controlled.
- Tools are model-controlled.

This maps directly to OpenCap's scope: Capabilities should primarily expose
tool-like actions, but they may also carry resource and prompt metadata later.

### The Official MCP Registry Is Metadata, Not Runtime Governance

The official MCP Registry is a centralized metadata repository for publicly
accessible MCP servers. It standardizes discovery, namespace management,
installation metadata, and server configuration.

This means OpenCap should not compete as a simple directory. The strategic gap is
runtime governance:

- install selected Capabilities
- apply local policy
- manage secrets
- execute or proxy calls
- record audit logs
- expose a stable host-facing gateway

### Apps SDK Confirms MCP as an App Substrate

OpenAI Apps SDK uses MCP to keep server, model, and UI in sync. A minimal app
server lists tools, handles tool calls, and returns structured content or
components.

OpenCap should not try to become an Apps SDK competitor. It should make it
easier to publish and govern the tool surface that an app or agent host can call.

### Security Is a Product Surface, Not an Implementation Detail

OpenAI Apps SDK guidance emphasizes least privilege, explicit user consent,
server-side validation, audit logs, redaction, and human confirmation for
irreversible operations.

MCP authorization guidance also creates several design constraints:

- STDIO transports should retrieve credentials from the environment.
- HTTP transports should follow MCP authorization.
- tokens must be audience-bound and validated.
- token passthrough is forbidden.
- OAuth flows should use PKCE and metadata discovery.

OpenCap V1 should avoid pretending to solve all auth modes. It should start with
local env-based credentials for STDIO/local runtime and document the future HTTP
authorization model separately.

### A2A Is Complementary, Not Competitive

A2A is an open standard for communication between independent agents. It focuses
on capability discovery between agents, task lifecycle, artifacts, streaming, and
secure collaboration.

OpenCap should position itself below or beside A2A:

```text
A2A: agent-to-agent collaboration
MCP: host-to-tool/resource protocol
OpenCap: capability runtime, permission, install, audit, verification
```

### Policy and Telemetry Should Reuse Existing Mental Models

Open Policy Agent provides a mature policy-as-code model that separates policy
decision-making from policy enforcement. OpenCap should not implement Rego in
V1, but it should borrow the architecture:

```text
Policy Enforcement Point: runtime executor
Policy Decision Point: policy engine
Input: host, capability, permissions, arguments, user, environment
Decision: allow, ask, deny
```

OpenTelemetry semantic conventions provide a shared language for traces, logs,
metrics, and generative AI operations. OpenCap's invocation logs should begin
with a simple local schema, but names should be compatible with future OTel
export.

## Strategic Implication

OpenCap should be:

```text
Capability Manifest + Local Runtime + Policy Engine + Audit Log + Registry Toolchain
```

OpenCap should not be:

```text
MCP server directory
Agent marketplace
Chat UI
Agent builder
Centralized API marketplace
Hosted-only automation platform
```

## V1 Design Direction

V1 should optimize for one credible local loop:

```text
manifest.yml
  -> opencap validate
  -> opencap install
  -> opencap serve --mcp
  -> host calls github_create_issue
  -> runtime checks policy
  -> runtime asks or allows
  -> runtime executes HTTP call
  -> runtime writes invocation log
```

The architecture should leave room for:

- MCP registry compatibility
- A2A agent capability cards later
- OpenAPI adapter later
- OPA/Rego-style policy later
- OpenTelemetry export later
