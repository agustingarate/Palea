# ClickUp templates without paid custom fields

## Contents

1. Naming and links
2. Common header
3. Type templates
4. Relationship rules

## 1. Naming and links

Classify ordinary tasks through stable prefixes:

```text
[EPIC] Capability name
[DELIVERY] Releasable grouping
[STORY] User outcome
[FEATURE] New capability
[IMPROVEMENT] Existing behavior improvement
[BUG] Spec violation
[SPIKE] Investigation question
[TEST] Independent validation
[CHORE] Maintenance outcome
[TEMPLATE] Type
```

Use task links and relationship verbs when paid relationship fields are unavailable:

```markdown
## Relationships

- Epic: [EPIC-01 Account and onboarding](...)
- Delivery Slice: [DELIVERY-10 Onboarding MVP](...)
- Implements: [HU-12 Work history](...)
- Affects: [FEAT-21 Save work history](...)
- Blocks: [HU-12 Work history](...)
```

Do not rely on prefixes alone for traceability.

## 2. Common header

```markdown
## Classification

- Type:
- Epic:
- Delivery Slice:
- Story/parent outcome:
- Version:
- Sprint:

## Canonical specification

- Spec:
- Status:
- Requirements:

## Relationships

- Implements/improves/affects/informs/validates/enables:
- Blocks:
- Blocked by:

## Definition of Done

- [ ] Scoped output is complete.
- [ ] Applicable requirements are validated.
- [ ] Spec and implementation agree.
- [ ] Links to branch/PR and evidence are recorded.
```

## 3. Type templates

### User Story

Include actor/capability/benefit, context, acceptance IDs, non-goals, canonical spec, derived work, and story-level Definition of Done. Do not prescribe layers before spec review.

### Feature

Include story implemented, requirement IDs, bounded scope, contracts, failure handling, tests, branch, and PR. Output is production behavior. Name the branch `feat/<scope>/<slug>-CU-<task-id>` regardless of whether a human or AI creates it.

### Improvement

Include current behavior, proposed change, measurable improvement, affected story/feature, compatibility, requirement changes, and validation. Map the branch and commit to the actual change: `feat`, `perf`, `refactor`, `test`, `docs`, or `ci`.

### Bug

Include violated requirement, environment, reproduction, current/expected results, severity, affected story/feature/version, evidence, root cause when known, fix scope, and regression test. Name the branch `fix/<scope>/<slug>-CU-<task-id>`.

### Spike

Include one decision question, uncertainty, time box, evidence to examine, output format, decision owner, and explicit non-goal of production delivery. Close with a decision, recommendation, or follow-ups.

### Test

Include requirements, level, preconditions/data, cases, expected evidence, environment, and failure ownership. Do not duplicate tests naturally owned by a Feature/Bug without a planning reason.

### Chore

Include maintenance objective, necessity, affected systems, risk, completion evidence, rollback, and linked delivery objective. Examples: dependency upgrades, CI, cleanup, and operational configuration.

### Delivery Slice

Include release outcome, stories, target version, repositories, integration strategy, base/integration branches, final PR target, cross-story risks, integrated acceptance, rollout, rollback, and exit condition. Do not use as an evergreen bucket.

## 4. Relationship rules

- Feature implements one primary story; link secondary affected stories.
- Improvement points to existing behavior and originating story/feature.
- Bug points to violated requirement and affected story/feature.
- Spike points to the decision it informs; follow-ups link back.
- Test points to requirement IDs and validated work item.
- Chore points to the delivery or operational objective it enables.
- Delivery Slice lists every included story and final integration evidence.
