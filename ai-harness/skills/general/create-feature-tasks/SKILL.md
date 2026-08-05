---
name: create-feature-tasks
description: Turn product intent into an approved repository specification and traceable ClickUp work items for web, backend, mobile, or cross-cutting features.
---

# Create Feature Tasks

Convert product intent into a canonical specification and the minimum
independently verifiable ClickUp work items needed to deliver it. The
repository specification is authoritative; ClickUp stores execution metadata,
ownership, status, relationships, estimates, and links.

## Boundaries

- Store new canonical specifications under `docs/product-specs/`.
- Use stable IDs for the specification, requirements, and acceptance criteria.
- Do not duplicate the complete specification in ClickUp.
- Preserve the existing ClickUp workspace and lists. Do not create lists,
  custom fields, or migrate existing tasks as part of normal feature planning.
- Do not rename existing tasks, including tasks with `[Palea JST]` prefixes.
- Do not write a specification or ClickUp task until the user approves the
  preview.
- Do not invent behavior from a design. Mark unclear behavior as `A confirmar`.
- Use the relevant application profile only when the scope requires it.

## Required inputs

Collect enough information to define:

1. Product outcome, user/actor, and problem solved.
2. Feature type: Story, Feature, Bug, Improvement, Spike, Test, Chore, or
   Delivery Slice.
3. Affected scope: `mobile`, `web`, `backend`, `shared`, or cross-cutting.
4. Business rules, non-goals, dependencies, risks, and open decisions.
5. Design source, if any. Stitch is the current source for Palea. Figma is a
   future-compatible source, not a prerequisite.
6. ClickUp workspace context and intended list. Verify the list before writing;
   use the existing `Palea Backlog` or `MVP` list unless the user explicitly
   authorizes a different existing list.

If a required decision is ambiguous, ask before generating the final preview.

## Design source abstraction

Treat every design provider as a `DesignSource` with this conceptual flow:

```text
DesignSource
  -> visual and interaction context
  -> screens, states, navigation, and inferred rules
  -> explicit open questions
```

For Stitch, inspect the supplied project, screen, or generated reference and
record the relevant screen names and states. For Figma, use the same output
contract when a future adapter is available. If no provider is accessible, use
the user's description or attached image and state what was inferred.

Always identify loading, empty, error, success, validation, permission, and
navigation states when applicable.

## Workflow

1. Locate related approved specs, ADRs, and existing ClickUp work before
   proposing new work.
2. Assign a stable spec ID and define requirement IDs and acceptance IDs.
3. Draft the spec in `docs/product-specs/<slug>.md` with status `draft`.
4. Include context, outcome, scope, non-goals, rules, states, contracts,
   failure modes, dependencies, test mapping, and unresolved decisions.
5. Create a preview containing the spec summary, proposed ClickUp hierarchy,
   estimates, relationships, and all `A confirmar` items.
6. Wait for explicit approval before writing the spec or creating ClickUp
   tasks.
7. Mark the spec approved through the repository review process before work is
   considered ready.
8. Resolve the ClickUp assignee and verify the target list using the ClickUp
   connector. Use existing structure only.
9. Create one parent task for the outcome and subtasks only when ownership,
   dependency, risk, or validation justifies the split. Do not create one task
   per architectural layer automatically.
10. Omit `time_estimate` from a task that has subtasks. Set estimates only on
    leaf tasks, using the unit required by the active ClickUp connector contract.
11. Update the spec with the real ClickUp task links after creation.
12. Report the spec path/status, task hierarchy, relationships, assumptions,
    unresolved risks, and the next delivery step.

## ClickUp task content

Every new task description should contain, as applicable:

- Classification and parent outcome.
- Canonical spec path and status.
- Requirement and acceptance IDs.
- Relationships: implements, affects, blocks, blocked by, validates, or
  enables.
- Concise product context and bounded scope.
- Definition of Done.
- Branch and PR fields once execution begins.

Use type prefixes from the repository model (`[STORY]`, `[FEATURE]`,
`[BUG]`, `[CHORE]`, `[SPIKE]`, `[TEST]`, `[DELIVERY]`). Do not rely on the
prefix alone for traceability.

## Application profiles

### Mobile

Use the actual structure under `apps/mobile`, Expo Router, React Native,
NativeWind, and the repository's documented mobile architecture. Include
mobile-specific smoke-test and device/simulator evidence when relevant.

### Web

Use the actual web application structure and approved web architecture found in
the repository. Do not assume a framework or file layout that is not present.

### Backend

Use the actual backend structure and approved Nest/API architecture. Identify
contracts, boundary validation, authorization, persistence, and integration
tests when relevant.

### Shared or cross-cutting

Keep the spec in `docs/product-specs/`, identify each affected application,
and split ClickUp work only where separate ownership or validation makes it
independently reviewable.

## Completion report

Report:

- Canonical spec path and approval status.
- Requirement and acceptance IDs.
- ClickUp list, parent, subtasks, and links.
- Design source and any inferred or unresolved behavior.
- Estimates and why the hierarchy uses them.
- Dependencies, risks, and deferred work.
