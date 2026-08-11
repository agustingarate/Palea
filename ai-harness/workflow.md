# Delivery workflow

1. Locate the approved specification and requirement IDs.
2. Read the architecture map and relevant ADRs.
3. Record assumptions in an execution plan for non-trivial work.
4. Change behavior, tests, contracts, and documentation together.
5. For environment changes, update the variable catalog, examples, provider
   runbook and cache inputs with the boundary schema.
6. Run the narrowest tests during implementation, then `pnpm validate`.
7. Report evidence, deferred work, and any spec divergence.

## Efficient execution

- Prefer source code, repository context, specifications, and established domain
  knowledge before running commands or performing expensive operations.
- Defer dependency installation/reconstruction, builds, full validation, and
  other costly commands until they are necessary to answer a question, verify a
  relevant change, or complete the task.
- Do not repeat an expensive command without a concrete reason; reuse its prior
  result when the inputs and relevant files have not changed.
- During implementation, inspect and test the narrowest affected scope first;
  reserve full validation for the final verification or for cases where the
  narrower evidence is insufficient.

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
