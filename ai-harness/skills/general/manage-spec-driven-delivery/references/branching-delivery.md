# Branching and delivery

## Contents

1. Naming convention
2. Default branch model
3. Delivery Slice integration
4. Feature flags
5. Parallel human and AI work
6. Commits and pull requests
7. Recovery and cleanup

## 1. Naming convention

Use the same branch name regardless of whether a human or AI creates it:

```text
<type>/<scope>/<slug>-CU-<task-id>
```

Never encode `human`, `ai`, `agent`, `codex`, a person's name, or the creator type in the branch name. Record ownership in ClickUp, the Git provider, or the PR instead.

Use lowercase kebab-case for the slug, avoid spaces/accents, and append the ClickUp task ID.

| Work                    | Branch                                  |
| ----------------------- | --------------------------------------- |
| Feature                 | `feat/<scope>/<slug>-CU-<id>`           |
| Bug                     | `fix/<scope>/<slug>-CU-<id>`            |
| Functional improvement  | `feat/<scope>/<slug>-CU-<id>`           |
| Performance improvement | `perf/<scope>/<slug>-CU-<id>`           |
| Refactor                | `refactor/<scope>/<slug>-CU-<id>`       |
| Test                    | `test/<scope>/<slug>-CU-<id>`           |
| Chore                   | `chore/<scope>/<slug>-CU-<id>`          |
| Spec/docs               | `docs/specs/<slug>-CU-<id>`             |
| Spike                   | `spike/<scope>/<slug>-CU-<id>`          |
| Integration             | `integration/<scope>/<version>-CU-<id>` |

Keep scopes controlled and stable, for example: `mobile`, `web`, `api`, `db`, `auth`, `onboarding`, `applications`, `metrics`, `shared`, `infra`, `ci`, `specs`, and `e2e`.

## 2. Explicit branch model

Require an explicit base branch and PR target for every short-lived branch per
User Story or independently reviewable work item. Never infer `main`,
`development`, or another branch when the task/spec/context does not state it:

```text
main
└── feat/applications/change-stage-CU-42
```

Create it from the explicit, updated base. Link branch and PR from ClickUp. Avoid
unrelated stories in one branch.

Keep incomplete work on the working branch locally when remote pushes trigger
costly or quota-limited CI. Open the PR and push the branch once the story or
independently reviewable work item is complete and local validation passes.
Push earlier only when the user explicitly requests incremental remote feedback
or an external dependency makes it necessary.

Do not create a branch for an Epic. A User Story may own the implementation branch when it is small and cohesive; otherwise give each independently reviewable Feature, Bug, or other work item its own branch.

## 3. Delivery Slice integration

Use a temporary integration branch when several stories must be tested together and flags or continuous integration into `main` are not viable:

```text
main
└── integration/onboarding/mvp-CU-100
    ├── feat/mobile/profile-setup-CU-101
    ├── feat/mobile/work-history-CU-102
    └── feat/mobile/skills-resume-CU-103
```

Represent it with a Delivery Slice task containing repository, base, integration branch, PR target, included stories, exit criteria, and target version. Merge each story through a reviewed PR into the integration branch, then open a final PR to `main`.

Do not let contributors commit directly to the shared integration branch except for explicitly owned integration fixes.

## 4. Feature flags

Prefer independent branches merged into `main` behind a feature flag when partial implementation can be safely hidden. Define ownership, default state, rollout, telemetry, and flag removal. Do not use flags to conceal broken builds, incompatible migrations, or security boundaries.

## 5. Parallel human and AI work

Use identical names for human-created and AI-created branches. Operational isolation, not naming, distinguishes concurrent work.

Give every contributor or agent:

- An exclusive branch and worktree.
- An explicit base branch and PR target.
- A task ID and canonical spec path.
- Requirement IDs and file/domain scope.
- Validation commands and expected evidence.

Examples:

```text
feat/mobile/work-history-CU-12
fix/api/stage-transition-race-CU-107
perf/web/stage-feedback-CU-108
```

One contributor or agent must not reuse another's active branch/worktree. Inspect existing changes, preserve unrelated work, and avoid force pushes or destructive Git operations unless explicitly authorized.

## 6. Commits and pull requests

Use Conventional Commit / Commitizen-compatible messages:

```text
<type>(<scope>): <description>
```

| Change                                         | Commit type |
| ---------------------------------------------- | ----------- |
| New behavior or visible functional improvement | `feat`      |
| Bug correction                                 | `fix`       |
| Performance improvement                        | `perf`      |
| Internal behavior-preserving restructuring     | `refactor`  |
| Tests                                          | `test`      |
| Specs or documentation                         | `docs`      |
| Maintenance                                    | `chore`     |
| Build system                                   | `build`     |
| CI/CD                                          | `ci`        |
| Reversion                                      | `revert`    |

Do not use `style` for a visual product improvement; in Conventional Commits it normally means formatting-only changes. Map an Improvement to `feat`, `perf`, `refactor`, `test`, `docs`, or `ci` according to the actual change.

Example:

```text
feat(mobile): add work history form

ClickUp: CU-86ajv8w07
Spec: SPEC-ONB-002
Requirements: BR-01, BR-02, AC-01
```

PRs must identify the ClickUp task/story, canonical spec/revision, requirements implemented, tests run, migrations, rollout/rollback, flags, risks, and deferred work. Review behavior against the spec, not only code style. Make spec changes explicit.

### Atomic commit construction

Construct commits from logical change groups, not from the list of files
changed. Inspect the current diff and relevant Git/file history before staging
to identify each change's intent and dependencies. When independent changes
share a file, split their hunks into their respective commits with deliberate
patch staging; do not combine them simply because they are in the same file.

Each commit must remain independently reviewable, understandable, and
revertible. Include the tests, contracts, and documentation required for the
behavior in that commit, and order prerequisite changes before the commits that
consume them. Inspect the staged diff immediately before committing.

Before the first commit, write a commit map whenever a change spans more than
one concern. A feature commonly produces separate commits for its canonical
specification, public contract, persistence/backend behavior, and each client
surface. Do not replace that map with a single `feat` commit merely because the
work belongs to one ClickUp task. Combine changes only when splitting would
leave a commit broken, untestable, or semantically incomplete.

For example, a new mobile capability with a tRPC contract normally becomes:

1. `docs(specs): define <capability>`
2. `feat(contracts): add <capability> API contract`
3. `feat(api): implement <capability> service`
4. `feat(mobile): add <capability> experience`

This is a decision aid, not a rigid file-type rule: keep a contract and its
essential regression test together, and split a shared file by hunk when it
contains independent changes. Never stage a broad path or `git add -A` without
first reviewing the staged diff against the commit map.

## 7. Recovery and cleanup

- Update from the base according to team policy; do not silently change the PR target.
- Use a dedicated integration-fix task/branch for failures that appear only after combining stories.
- Remove merged branches and worktrees after confirming PR and release state.
- Record reverted or abandoned work in ClickUp and preserve reasoning in Git/PR history.
