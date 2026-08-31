# Delivery workflow

1. Locate the approved specification and requirement IDs.
2. Read the architecture map and relevant ADRs.
3. Record assumptions in an execution plan for non-trivial work.
4. Change behavior, tests, contracts, and documentation together.
5. For environment changes, update the variable catalog, examples, provider
   runbook and cache inputs with the boundary schema.
6. Run the narrowest tests during implementation, then `pnpm validate`.
7. Report evidence, deferred work, and any spec divergence.

## Building product-quality interfaces

For a user-facing feature, design is an implementation input and a first-class
deliverable. It is not a polish pass after business behavior works.

Before creating a screen or component, the implementer must turn the approved
design source (Stitch, Figma, or an approved repository design) into a compact
construction brief in the spec or execution plan. It must name the source
screens, viewport behavior, layout regions, visual hierarchy, responsive rules,
interaction patterns, design tokens, and every required state. Reconcile any
intentional difference with the source before coding; never silently omit a
source capability such as an embedded viewer, an action menu, or a responsive
layout.

Build the feature in vertical, presentable slices. Each slice must contain its
actual layout, component structure, states, keyboard behavior, localization,
and theme behavior as it is introduced. Do not first ship a generic list,
placeholder cards, hard-coded copy, or browser-default controls with a plan to
"polish" them later. A functional shortcut is allowed only when the approved
spec explicitly marks it as a temporary non-goal.

Use the source design to guide component boundaries: extract reusable shells,
navigation, collections, cards/rows, menus, dialogs, file controls, feedback
states, and viewer controls instead of concentrating them in one screen. A
view remains a composition and interaction adapter; it must not become a mixed
layout, transport, state-machine, and mutation implementation.

While implementing, actively compare the work to the construction brief at the
target breakpoints. Correct hierarchy, density, spacing, overflow, responsive
composition, contrast, focus treatment, and touch/keyboard affordances before
adding the next slice. Treat missing empty/loading/error/disabled/pending
states as incomplete implementation, not as missing test coverage.

When a design source conflicts with an approved product decision, preserve the
approved product behavior and record the precise reconciliation. Ask before
making a product-affecting decision that is not specified. Do not replace a
specified capability with a less capable technical fallback without an explicit
spec change or user approval.

For billing work, read `docs/product-specs/web-subscriptions.md`,
`docs/design-docs/ADR-009-revenuecat-paddle-subscriptions.md`, and
`docs/BILLING.md` before changing schema or behavior. Validate migrations and
RLS locally, then in staging with real sandbox provider identifiers, before any
production promotion. Never use a seed to invent provider products or prices.

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
