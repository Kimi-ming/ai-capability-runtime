# Registry Guidelines

The OpenCap Registry is Git-based. Developers submit Capabilities through pull
requests, and CI validates the manifest and tests.

## Directory Layout

```text
registry/
  developer-tools/
    github.create_issue/
      manifest.yml
      README.md
      tests/
        basic.yml
```

## Entry Requirements

Every registry entry must include:

- `manifest.yml`
- `README.md`
- at least one test under `tests/`
- explicit permissions
- risk declarations
- maintainer metadata
- license metadata

## Review Checklist

Reviewers should check:

- the manifest is valid
- the description matches the execution behavior
- permissions are not broader than required
- risk levels are honest
- external endpoints are declared
- tests cover at least one successful invocation
- README explains setup and expected result

## Trust Levels

| Level | Meaning |
| --- | --- |
| `experimental` | Early entry, not reviewed beyond basic structure. |
| `listed` | Schema-valid and accepted into the registry. |
| `tested` | Includes tests that pass in CI or mock validation. |
| `verified` | Maintainer or service ownership is verified. |
| `official` | Maintained by the OpenCap core team. |

## Installation

The intended V1 install flow is:

```bash
opencap install github.create_issue
```

The CLI should resolve the registry entry, copy or link the manifest into local
state, and make it available to the runtime.
