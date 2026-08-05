# Work item model

## Contents

1. Hierarchy and relationships
2. Type decisions
3. Story creation
4. Decomposition
5. Sprint and version rules
6. Completion rules

## 1. Hierarchy and relationships

```text
Epic
└── Delivery Slice (optional release/integration grouping)
    ├── User Story
    │   ├── Feature
    │   ├── Improvement
    │   ├── Bug
    │   ├── Spike
    │   ├── Test
    │   └── Chore
    └── User Story
```

- Epic **groups** outcomes in one product capability.
- Delivery Slice **coordinates** stories delivered or validated together.
- Feature **implements** a story.
- Improvement **improves** an existing feature or story outcome.
- Bug **violates** a requirement and **affects** a story/feature.
- Spike **informs** a decision, story, or feature.
- Test **validates** specific requirement IDs.
- Chore **enables** delivery without directly changing user behavior.

Use subtasks when work belongs exclusively to one parent and shares its lifecycle. Use independent linked tasks when work spans stories, repositories, teams, sprints, or releases.

## 2. Type decisions

| Type | Output | Use when | Do not use when |
|---|---|---|---|
| Epic | Product capability | Several outcomes share a strategic goal | Grouping only one story |
| Delivery Slice | Integrated/releasable set | Stories must be coordinated for validation or release | General product taxonomy |
| User Story | Verifiable user outcome | A user or actor receives value | Describing an implementation layer |
| Feature | New behavior/capability | Implementing part or all of a story | Merely fixing specified behavior |
| Improvement | Better existing behavior | Current behavior works but should measurably improve | Current behavior violates the spec |
| Bug | Repaired divergence | Observed behavior violates requirement/invariant | Desired behavior was never specified |
| Spike | Decision/evidence | Significant uncertainty blocks planning | Production code is the primary output |
| Test | Validation evidence | Testing needs independent planning/ownership | Normal tests fit inside implementation work |
| Chore | Maintenance result | Necessary non-user-facing work | Hiding an unarticulated feature |

Purpose by type:

- **Epic:** group a broad product capability and its outcomes across stories or releases. It does not correspond directly to implementation or a Git branch.
- **Delivery Slice:** coordinate stories that must be integrated, validated, or released together. Give it an exit condition and use an integration branch only when necessary.
- **User Story:** define independently verifiable value for an actor. Treat it as the functional acceptance unit.
- **Feature:** implement new production behavior derived from a story and mapped to approved requirements.
- **Improvement:** measurably improve behavior that already satisfies its current specification. Reclassify it as a Bug when current behavior violates the spec.
- **Bug:** repair an observed divergence from an approved requirement or invariant and add regression evidence.
- **Spike:** reduce material uncertainty through a time-boxed investigation. Finish with a decision, evidence, and follow-up work rather than production code.
- **Test:** independently plan validation when it needs separate ownership, environments, data, automation, or evidence. Do not duplicate tests naturally owned by implementation work.
- **Chore:** deliver necessary maintenance such as dependency, CI, repository, or operational work without hiding user-visible behavior changes.

## 3. Story creation

Create a story with a stable ID, outcome-oriented title, actor/capability/benefit, context, canonical spec link, acceptance-criteria IDs, dependencies, non-goals, Epic, optional Delivery Slice, and target version. Leave Sprint unset until ready.

```text
As <actor>, I want <capability>, so that <benefit>.
```

Reject stories that are implementation tasks, cannot be verified independently, combine unrelated outcomes, or lack a clear actor without a justified system/operational framing.

## 4. Decomposition

After spec approval:

1. Identify user-visible surfaces and technical boundaries.
2. Identify contracts, persistence, permissions, migration, observability, and failure handling.
3. Create only independently executable/reviewable work items.
4. Map every work item to requirement IDs.
5. Add dependency direction and blocking semantics.
6. Add validation work and regression tests.

```text
HU-42 Move an application between stages
├── FEAT-101 Implement transactional stage-change command [BR-01, BR-02]
├── FEAT-102 Implement web board interaction [AC-01, AC-03]
├── FEAT-103 Implement mobile stage selector [AC-01, AC-03]
├── TEST-104 Validate cross-view synchronization [AC-02]
└── BUG-105 Prevent duplicate concurrent transitions [BR-03]
```

Do not create one task per architectural layer automatically. Combine small work reviewed together; split when ownership, risk, dependency, or validation justifies it.

## 5. Sprint and version rules

- Version answers: **In which release must this outcome appear?**
- Sprint answers: **When will the team execute this ready work?**
- Put story points on the story. Use time estimates on derived tasks only if useful; never add both to velocity.
- A story is Ready when its spec is approved, acceptance criteria are testable, dependencies are understood, and decomposition/estimate are complete.
- Prefer vertical story slicing over splitting one non-deliverable story across sprints.
- Give each Delivery Slice an exit condition and target version.

## 6. Completion rules

A derived task is complete when its scoped output and tests are complete. A story is complete only when integrated behavior satisfies every applicable requirement, tests prove acceptance and failure modes, blocking bugs are closed, spec/code/design agree, applicable operational and quality obligations are satisfied, and the result is integrated into the intended release path.
