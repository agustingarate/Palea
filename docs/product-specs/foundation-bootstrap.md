---
id: SPEC-FOUNDATION-001
status: implemented
---

# Palea foundation bootstrap

## Requirements

- **FR-01:** The repository provides independently runnable Expo, Next, and Nest applications.
- **FR-02:** Internal typed API access is available through tRPC in the Nest process.
- **FR-03:** REST/Axios remains available without coupling it to tRPC.
- **FR-04:** Mobile demonstrates a Projects feature through feature-first Clean Architecture and MVVM.
- **NFR-01:** Architecture boundaries are machine checked.
- **NFR-02:** Untrusted runtime data is validated with Zod.
- **NFR-03:** Client artifacts contain no secrets or privileged AI provider keys.
- **NFR-04:** Shared visual primitives and semantic tokens are framework neutral.

## Acceptance criteria

- **AC-01:** Root validation passes on a clean dependency installation.
- **AC-02:** Expo can render the demo from its in-memory datasource without a backend.
- **AC-03:** REST and tRPC health contracts return `status: ok`.
- **AC-04:** `projects.list` and all three mobile datasources produce the same domain shape.
- **AC-05:** Light and dark themes contain the same semantic keys.

## Non-goals

Authentication, persistence, real AI providers, product workflows, deployment, and
EAS ownership are intentionally deferred.
