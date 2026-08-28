# Palea agent map

Start with [ARCHITECTURE.md](ARCHITECTURE.md) and the canonical guidance in
[`ai-harness/`](ai-harness/README.md). Keep this file short: it is a map, not a
manual.

## Required workflow

1. Read the relevant approved specification and ADRs before changing behavior.
2. Preserve the dependency directions documented in `ARCHITECTURE.md`.
3. Parse untrusted data with Zod at system boundaries.
4. Never place secrets, provider keys, or privileged business logic in clients.
5. Update tests and documentation with every contract or architecture change.
6. Validate in proportion to the change. Run `pnpm validate` before declaring
   source code, configuration, dependency, contract, or architecture enforcement
   changes complete. For Markdown-only documentation changes, check formatting,
   local links, and `git diff --check`; do not run application builds or tests.

## Rules

- In mobile features, TanStack Query exclusively owns remote asynchronous
  state. Zustand is limited to cross-screen client state; views and ViewModels
  do not duplicate server data in `useState`/`useEffect`.
- Every transport or provider SDK is encapsulated by a feature datasource. A
  repository depends on its datasource port, never on tRPC, HTTP clients,
  Supabase, or another provider SDK directly.
- Keep mobile views as composition and interaction adapters. Extract reusable
  feature components and non-rendering interaction coordination into dedicated
  components and hooks before a view becomes a mixed orchestration module.
- After changing localized resources, run `pnpm --filter @palea/localization build`
  before considering the change validated.
- For local development and QA, use each application's supported development
  workflow (for Expo Web, `expo start --web`). Do not replace it with static
  servers or other alternative tooling unless the user explicitly requests it.

- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.

Repository-local skill definitions live in `ai-harness/skills`. Tool-specific
directories such as `.codex/skills` contain only host adapters and metadata;
they must point to the canonical definitions rather than duplicate them.
