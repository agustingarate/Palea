## Spec-driven development

- Locate the applicable specification under `specs/` before changing behavior.
- Treat an approved specification as the source of truth.
- Do not introduce behavior that contradicts an approved specification.
- If requested behavior is absent, ambiguous, or contradictory, update and review the specification before implementation.
- Reference stable requirement IDs in tests and pull requests when practical.
- Every behavioral pull request must identify the ClickUp task, canonical specification, requirements covered, tests run, and remaining risks.
- Report conflicts between code, tests, tasks, and specifications explicitly; do not silently rewrite one to match another.
- Work only on the assigned branch/worktree and preserve unrelated changes.
