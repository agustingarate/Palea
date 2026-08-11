# AI-neutral engineering harness

This directory is the canonical source for agent operating guidance. Tool-specific
directories such as `.codex` and `.chatgpt` only adapt these rules to their host.

- `principles.md`: stable engineering beliefs.
- `workflow.md`: specification-driven execution loop.
- `guardrails.md`: mechanically enforced boundaries.
- `definition-of-done.md`: completion evidence.
- `skills/`: reusable, AI-neutral skill definitions and their references,
  organized by scope:
  - `general/`: skills shared across applications and layers.
  - `web/`, `backend/`, and `mobile/`: add these scopes when concrete,
    application-specific skills exist; do not create empty categories early.

Current general skills include:

- `manage-environment-configuration`: environment-variable, variant and target
  governance.

- `create-feature-tasks`: product intent to canonical spec and ClickUp work.
- `create-pr-with-traceability`: approved delivery work to traceable PR.
- `tech-debt-clickup-sync`: technical-debt tracker entries to ClickUp chores.
- `manage-spec-driven-delivery`: shared specification, work-item, and delivery
  model.

Tool-specific adapters may live under directories such as `.codex/skills/`.
They must reference the canonical skill in this directory rather than copy its
definition. Host-specific metadata may remain in the adapter directory.

When a skill applies to multiple scopes, keep it in `general/` instead of
duplicating it. Organize by capability when that is clearer than organizing by
application.
