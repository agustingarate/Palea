---
name: manage-environment-configuration
description: Define, change and validate Palea environment variables, mobile variants and deployment targets without weakening trust boundaries.
---

# Manage environment configuration

Read `docs/ENVIRONMENTS.md`, `docs/DEPLOYMENT.md`, the applicable spec and ADRs before changing configuration. Keep binary variants separate from deployment targets and reserve `NODE_ENV` for tooling.

## Rules

- Parse runtime configuration with Zod at each application boundary.
- Treat `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` values as public.
- Do not add a secret, privileged endpoint or provider key to a client variable.
- Declare EAS profile environments explicitly and validate every profile with `eas config` before building.
- Add a target such as UAT atomically: schema, provider variables, URLs, CORS, mobile identity, docs, CI cache inputs and tests.
- Update examples, the variable catalog and tests with every contract change.

## Completion evidence

Report the changed variables without exposing sensitive values, profile/target matrix, validation evidence, provider changes and any required manual release step.
