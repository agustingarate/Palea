---
name: tech-debt-clickup-sync
description: Detect new entries in docs/exec-plans/tech-debt-tracker.md and, after confirmation, create the corresponding tasks in the existing Palea Backlog ClickUp list without duplicating entries.
---

# Sync Technical Debt to ClickUp

Keep the repository technical-debt tracker as the source of truth and create
one operational ClickUp task for each newly added tracker entry. This skill is
an explicit synchronization workflow; editing the Markdown file alone does
not silently mutate ClickUp.

## Source contract

Read `docs/exec-plans/tech-debt-tracker.md` as a Markdown table with columns:

```text
ID | Item | Trigger
```

Each row must have a stable ID such as `TD-001`, a concise debt item, and the
condition that makes the work actionable. Do not invent an ID or create a task
for malformed rows. Report malformed rows for correction.

## ClickUp boundary

- Use the existing `Palea` workspace and `Palea Backlog` list.
- Do not create or rename lists, folders, custom fields, or existing tasks.
- Do not change existing `[Palea JST]` tasks.
- Use the ClickUp connector only after the local diff and preview are approved.
- Store a concise operational summary in ClickUp; the Markdown tracker remains
  canonical and must be linked from the task description.

## Idempotency

Before creating a task, search ClickUp for the exact technical-debt ID, for
example `TD-001`, and inspect likely matches. Treat a task as already synced if
the ID appears in its name or description. Report existing matches instead of
creating duplicates.

The task name for a new entry is:

```text
[CHORE] <ID> <Item>
```

Use a description containing:

```markdown
## Technical debt
- ID: <ID>
- Item: <Item>
- Trigger: <Trigger>
- Tracker: docs/exec-plans/tech-debt-tracker.md

## Definition of Done
- [ ] The debt item is resolved or explicitly reclassified.
- [ ] The triggering condition and affected scope are validated.
- [ ] Evidence and the resolving PR are linked.
```

Do not add time estimates unless the user supplies or approves one. Do not
create subtasks automatically; a debt item becomes subtasks only through the
normal feature/work-item planning workflow.

## Workflow

The repository helper command is:

```text
pnpm tech-debt:sync
```

It reports rows added in the current Git diff. Use
`node scripts/tech-debt-sync.mjs --all --json` when a complete machine-readable
snapshot is needed. The command does not call ClickUp or create tasks; this
skill performs the ClickUp lookup, preview, confirmation, and creation steps.

1. Inspect `git diff` for the tracker and identify rows added in the current
   change. If no diff is available, compare the tracker against the last
   committed version and clearly state the basis for the comparison.
2. Parse every added row and validate ID, item, and trigger.
3. Search ClickUp for each ID and record existing matches.
4. Resolve the exact `Palea Backlog` list ID through the workspace hierarchy;
   never assume a user-provided Space or Folder ID is a List ID.
5. Show a preview containing new rows, skipped duplicates, target list, task
   names, descriptions, and any malformed entries.
6. Wait for explicit confirmation before creating anything in ClickUp.
7. Create only confirmed, non-duplicate tasks with type `Chore` semantics and
   the approved descriptions.
8. Report created task IDs/URLs, skipped duplicates, and failures.
9. Do not modify the Markdown tracker automatically. If desired, the user may
   later add a ClickUp link to the tracker in a separate approved change.

## Failure handling

- If ClickUp is unavailable, do not create a local fake ID or mark anything as
  synced; report the blocked synchronization.
- If multiple ClickUp matches exist, stop that entry and ask which task is
  canonical.
- If task creation partially succeeds, report each result and do not retry
  successful entries blindly.
- If the tracker change mixes edits and new rows, synchronize only rows proven
  to be newly added.

## Completion report

Report the source revision/diff basis, created tasks and URLs, duplicates
skipped, malformed rows, failures, and any follow-up needed. This skill does
not run `pnpm validate`; its validation is limited to Markdown structure,
diff-based row detection, and ClickUp synchronization evidence.
