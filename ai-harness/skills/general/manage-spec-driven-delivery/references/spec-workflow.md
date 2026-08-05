# Specification workflow

## Contents

1. Canonical-source policy
2. Repository organization
3. Lifecycle
4. Requirement design
5. Change control
6. AI use

## 1. Canonical-source policy

Keep the complete behavioral and technical specification as versioned Markdown in the repository. ClickUp stores execution metadata and a link, not a second full copy.

Precedence:

1. Approved repository spec.
2. Accepted ADRs and versioned interface schemas referenced by the spec.
3. Tests as executable evidence.
4. ClickUp summaries and conversations.

Do not treat current code as automatically authoritative. A mismatch is a conflict to resolve.

## 2. Repository organization

```text
specs/
├── README.md
├── onboarding/
│   ├── README.md
│   ├── profile-setup.md
│   └── work-history.md
└── applications/
    ├── create-application.md
    └── change-stage.md
architecture/
└── decisions/
    └── ADR-001-stage-history.md
```

Use one spec per cohesive behavior. Use a domain `README.md` as an index and integration overview. Store durable implementation choices in ADRs instead of task comments.

## 3. Lifecycle

Use `draft`, `review`, `approved`, `implemented`, `deprecated`, and `superseded`.

1. Create or revise `draft` before behavior-changing implementation.
2. Review behavior, edge cases, contracts, security, migration, operability, and testability.
3. Approve through normal repository review.
4. Implement against the approved revision.
5. Mark `implemented` only after integrated validation.
6. Deprecate or supersede instead of silently deleting history.

## 4. Requirement design

Assign stable IDs:

- `BR-##`: business rule.
- `AC-##`: acceptance criterion.
- `FR-##`: functional requirement when useful.
- `NFR-##`: quality requirement.

Terminology:

| Token | Meaning | Purpose |
|---|---|---|
| `SDD` | Spec-Driven Development | Drive planning, implementation, and validation from an approved specification. |
| `SPEC` | Specification | Identify the canonical behavior/contract document. |
| `BR` | Business Rule | Express an invariant or domain rule that must always hold. |
| `FR` | Functional Requirement | Express behavior the system must provide. |
| `AC` | Acceptance Criterion | Define an observable scenario proving an outcome is accepted. |
| `NFR` | Non-Functional Requirement | Define quality attributes or constraints such as performance, accessibility, security, or reliability. |
| `ADR` | Architecture Decision Record | Preserve a durable architectural decision and its rationale. |
| `HU` | Historia de Usuario / User Story | Identify the functional outcome that gives requirements product context. |
| `CU` | ClickUp | Prefix a ClickUp task identifier in branch, commit, or PR references. |
| `PR` | Pull Request | Review and integrate a bounded change. |
| `API` | Application Programming Interface | Define a system interaction contract. |
| `E2E` | End-to-End | Validate a complete user/system flow. |
| `CI/CD` | Continuous Integration / Continuous Delivery or Deployment | Automate integration, validation, delivery, and deployment. |
| `DoR` | Definition of Ready | Define when work is sufficiently specified to enter execution. |
| `DoD` | Definition of Done | Define when work or an outcome is complete and accepted. |

Include purpose, non-goals, actors/authorization, visible behavior, state transitions, invariants, contracts, failure/retry/concurrency/idempotency, migration/compatibility, telemetry, and test mapping. Avoid incidental implementation detail unless contractual or architecturally approved.

## 5. Change control

- Change spec and implementation in the same PR when small and agreed.
- Use a spec-only PR for high-risk, cross-team, expensive, or ambiguous behavior.
- If implementation reveals a behavioral change, pause, revise, and approve the spec.
- Reference task IDs in spec frontmatter and PR descriptions.
- Reference requirement IDs in tests when practical.

## 6. AI use

Give the AI repository, explicit base branch, task ID, spec path, requirement IDs, allowed/excluded scope, validation commands, working branch, and PR target. Require it to report ambiguity, missing requirements, and conflicts instead of inventing behavior. Use [../assets/AGENTS.sdd.template.md](../assets/AGENTS.sdd.template.md) as a starting policy.
