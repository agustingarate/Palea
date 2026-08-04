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
6. Run `pnpm validate` before declaring work complete.

Repository-local skills live in `.codex/skills`. AI-neutral policies live in
`ai-harness`; tool-specific adapters must point there rather than duplicate it.
