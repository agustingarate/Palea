# Delivery workflow

1. Locate the approved specification and requirement IDs.
2. Read the architecture map and relevant ADRs.
3. Record assumptions in an execution plan for non-trivial work.
4. Change behavior, tests, contracts, and documentation together.
5. Run the narrowest tests during implementation, then `pnpm validate`.
6. Report evidence, deferred work, and any spec divergence.

## Delivery and CI budget

- Keep implementation commits local on the working branch while the change is
  incomplete; do not open a pull request or push intermediate commits when that
  would trigger CI.
- Open the pull request and push the completed branch only after the approved
  slice is functionally complete and local validation passes.
- Before the final push, reproduce CI locally with `pnpm install --frozen-lockfile`,
  any required prerequisite builds, and `pnpm turbo run <task> --force` when
  cache reuse could hide failures; finish with `pnpm validate`.
- If CI is unavailable or expensive, preserve the failure evidence locally and
  fix it before pushing. Push earlier only when the user explicitly requests
  incremental remote feedback or an external dependency requires it.

Repository specifications take precedence over task trackers and conversations.
