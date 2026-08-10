---
name: create-pr-with-traceability
description: Prepare and, after final confirmation, execute traceable Conventional Commits, branch push, pull request creation, and ClickUp linkage for a completed repository work item.
---

# Create PR with Traceability

Turn a completed, reviewable work item into atomic Conventional Commits and a
pull request with bidirectional traceability to its ClickUp task and canonical
repository specification.

This skill is provider-agnostic. Git hosting and ClickUp actions are adapters;
the workflow must not assume GitHub, `gh`, `main`, or `development` without
explicit evidence from the task or user.

## Safety and authority

- Inspect before mutating: Git status, current branch, task, spec, and scope.
- Preserve unrelated user changes. Never reset, checkout away, force-push, or
  delete work without explicit authorization.
- Resolve the base branch and PR target explicitly. If either is missing or
  inconsistent, stop and ask.
- Propose the complete commit and PR plan before execution.
- Require one explicit final confirmation immediately before commit, push,
  pull-request creation, or ClickUp comment/link updates.
- Do not use a PR closing keyword such as `Closes` for ClickUp traceability.

## Prerequisites

Confirm or locate:

1. ClickUp task ID and URL.
2. Canonical spec under `docs/product-specs/`.
3. Requirement and acceptance IDs covered.
4. Current branch and its explicit base branch.
5. Explicit PR target branch.
6. Git hosting provider adapter and authentication, if execution is requested.
7. ClickUp connector, if the reverse link/comment is part of the requested
   delivery.

If the task, spec, branch, or scope cannot be reconciled, report the conflict
instead of guessing.

## Workflow

### 1. Inspect

- Run `git status` and inspect the current branch and diff.
- Inspect the relevant `git log` and, when needed, file history to distinguish
  the current work's separate intents and their dependency order.
- Verify that changed files belong to the ClickUp task and canonical spec.
- Read the relevant spec, ADRs, and acceptance criteria.
- Read the ClickUp task and its relationships/comments when available.
- Identify the narrowest relevant validation commands. Do not run expensive
  repository-wide validation for changes limited to skills or documentation.

### 2. Propose

Present:

- Base branch and PR target.
- Proposed branch name using `<type>/<scope>/<slug>-CU-<task-id>` when a new
  branch is needed.
- Atomic commit groups and Conventional Commit messages in English, with a
  first line no longer than 72 characters.
- Scope, spec path, requirement IDs, acceptance IDs, and ClickUp URL.
- Validation evidence, risks, migrations, rollout/rollback, and deferred work.
- Full PR title and body preview.

The commit body or footer must identify the ClickUp task, canonical spec, and
requirements. Use a normal `ClickUp:` reference rather than an automatic-close
trailer.

### 3. Confirm

Ask for explicit confirmation after the proposal is complete and before any
commit, push, PR creation, or ClickUp mutation. A prior approval of the feature
plan is not sufficient for this final delivery action.

### 4. Execute

After confirmation only:

1. Create or switch to the explicitly approved branch without discarding work.
2. Create the approved atomic commits.
3. Push the branch to the configured remote.
4. Create the PR against the explicitly approved target.
5. Add the ClickUp task URL, spec, requirements, validation evidence, risks,
   and deferred work to the PR body.
6. Add the PR URL and branch to the ClickUp task through the connector.
7. Re-read the resulting links when possible and report evidence.

If an action fails, stop at the failure boundary, preserve the local state, and
report what completed and what remains. Do not retry destructive or external
actions blindly.

## Commit mapping

Use the actual change, not the ClickUp classification, to choose the type:

- `feat`: new behavior or visible capability.
- `fix`: correction of a specification violation.
- `perf`: measurable performance change.
- `refactor`: behavior-preserving restructuring.
- `test`: independent validation changes.
- `docs`: specifications or documentation.
- `chore`: maintenance.
- `build` or `ci`: build and delivery infrastructure.

Create the smallest logical commits that can be independently reviewed,
validated, reverted, and understood in history. Group changes by responsibility
and intent, not by file. Keep production behavior with the tests, contracts,
and documentation that are necessary to make that one behavior correct; do not
split those merely to produce more commits.

Before staging, map the diff into commit-sized change groups using the current
diff together with the relevant repository and file history. A single file may
contribute hunks to multiple commits when those hunks implement distinct
changes. Stage those hunks deliberately (for example, with patch staging),
inspect the staged diff before every commit, and leave unrelated hunks unstaged
until their own group is ready.

Order commits so that prerequisites precede their consumers. Do not create
empty commits, force artificial groups, or put unrelated work in one commit
because it touches the same file.

## Pull request contract

The PR title identifies the actual type, scope when useful, and ClickUp task.
The body contains:

```markdown
## Context

<business reason and user value>

## What changed

<functional and technical summary>

## Acceptance criteria

- [ ] <requirement or acceptance ID and evidence>

## Traceability

- ClickUp: <task URL and ID>
- Spec: <canonical path and revision/status>
- Requirements: <IDs>

## Validation

- <command or manual evidence>

## Risks and follow-up

- <risk, migration, rollout/rollback, or deferred work>
```

## Completion report

Report the final branch, commits, PR URL, ClickUp link/comment status, spec and
requirements covered, validation evidence, and any incomplete external action.
