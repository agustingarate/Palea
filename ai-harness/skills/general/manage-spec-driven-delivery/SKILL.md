---
name: manage-spec-driven-delivery
description: Plan and execute reusable Spec-Driven Development workflows from product intent through delivery. Use when Codex needs to create or refine user stories, epics, delivery slices, features, improvements, bugs, spikes, tests, or chores; author and maintain repository Markdown specifications as the source of truth; decompose stories into ClickUp work items without paid custom fields; plan versions and sprints; choose branch and pull-request strategies for humans or AI agents; or validate implementation and release readiness against specifications.
---

# Manage Spec-Driven Delivery

Convert product intent into traceable specifications, work items, branches, implementation, tests, and releases. Keep the repository specification canonical and use ClickUp to manage execution.

## Core rules

1. Treat an approved Markdown specification in the repository as the source of truth for behavior and technical contracts.
2. Use ClickUp for ownership, priority, sprint, status, relationships, and links. Do not duplicate the complete specification there.
3. Model a user story as an independently verifiable user outcome. Derive implementation work from it.
4. Relate every Feature, Improvement, Bug, Spike, Test, or Chore to a story, delivery slice, or explicit maintenance objective.
5. Reference stable requirement IDs such as `BR-01` and `AC-02` from tasks, tests, commits, and pull requests.
6. Do not close a story because its child work is complete; close it only after validating the complete outcome against the approved specification.
7. Prefer one short-lived branch per story or independently reviewable work item. Use a temporary integration branch only when coordinated validation cannot be achieved through `main` and feature flags.
8. Give every concurrent contributor or AI agent an exclusive branch/worktree and an explicit base branch, scope, spec, and PR target.
9. Use the same branch-naming convention regardless of whether a human or AI creates the branch. Never encode the creator type in the branch name.

## Select the workflow

- For creating or decomposing work items, read [references/work-item-model.md](references/work-item-model.md).
- For authoring, reviewing, changing, or validating a specification, read [references/spec-workflow.md](references/spec-workflow.md).
- For planning repositories, branches, worktrees, commits, PRs, integration, or AI execution, read [references/branching-delivery.md](references/branching-delivery.md).
- For creating ClickUp work items or templates without paid fields, read [references/clickup-templates.md](references/clickup-templates.md).

Read every reference relevant to the requested operation before changing files, Git state, or ClickUp.

## End-to-end workflow

1. Capture product intent as an Epic, Delivery Slice, User Story, Bug, or maintenance objective.
2. Assign a stable identifier before creating dependent artifacts.
3. Locate the existing canonical specification. If none exists, create one from [assets/SPEC.template.md](assets/SPEC.template.md).
4. Define behavior, rules, acceptance criteria, failure modes, contracts, non-goals, and test mapping.
5. Review the specification. Resolve material ambiguity before implementation and mark it `approved` through normal repository review.
6. Decompose the approved outcome into the minimum independently executable work items.
7. Create ClickUp items from the relevant templates. Use names and links for classification when custom fields are unavailable.
8. Assign sprint and version only after the story is ready, decomposed, dependency-checked, and estimated.
9. Choose the branch model, create exclusive branches/worktrees, and record the branch and PR links on the work item.
10. Implement code, tests, and necessary spec changes together. Do not silently diverge from an approved spec.
11. Validate every affected requirement and acceptance criterion. Record regressions as tests.
12. Merge, release, update ClickUp, and remove temporary branches after confirming delivery.

## Classification decisions

- Use **User Story** for a user-observable outcome.
- Use **Feature** for a new implementation capability derived from a story.
- Use **Improvement** for a measurable refinement to existing behavior.
- Use **Bug** for observed behavior that violates an approved requirement or expected invariant.
- Use **Spike** for time-boxed investigation whose output is a decision or evidence, not production behavior.
- Use **Test** for independently tracked validation work when it is not already part of a Feature or Bug.
- Use **Chore** for necessary non-user-facing maintenance with explicit completion evidence.
- Use **Delivery Slice** for coordinating multiple stories that must be integrated or released together. Do not use it as a substitute for an Epic or User Story.

## Handling conflicts

- If ClickUp and the approved repository spec disagree, report the conflict and follow the approved repository spec until the owners decide otherwise.
- If the requested change contradicts the spec, update and approve the spec before implementation.
- If code contradicts the spec, do not rewrite the spec merely to match the code. Determine whether the implementation or the intended behavior is wrong.
- If a Bug is discovered before story acceptance, make it blocking work under or linked to the story. If discovered after release, create an independent Bug linked to the original story/spec and target fix version.

## Completion output

Report:

- Canonical spec path and status.
- Work items created or changed and their relationships.
- Sprint/version assumptions.
- Branch base, working branch, and PR target.
- Requirements implemented and tests proving them.
- Remaining risks, deferred improvements, and blocking bugs.
