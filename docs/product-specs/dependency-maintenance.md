---
id: SPEC-MAINTENANCE-001
status: approved
---

# Dependency maintenance

## Purpose

Keep the monorepo on the newest dependency versions that satisfy its supported
runtime and framework compatibility constraints.

## Requirements

- **BR-01:** The mobile application remains on Expo SDK 54 and uses the React,
  React Native, Expo modules, and native libraries selected by Expo's dependency
  compatibility check.
- **BR-02:** Web-only React dependencies may advance independently when they do
  not cross into React Native packages.
- **NFR-01:** TypeScript uses the newest stable major supported by the repository's
  linting, testing, and build toolchain.
- **NFR-02:** Dependency updates preserve architecture boundaries and runtime
  contracts.

## Acceptance criteria

- **AC-01:** `expo install --check` reports the Expo SDK 54 dependencies as current.
- **AC-02:** `expo-doctor` passes for the mobile application.
- **AC-03:** `pnpm validate` passes after a clean lockfile update.

## Non-goals

Migrating to another Expo SDK or adopting framework majors that require a product
or styling redesign is outside this maintenance objective.

## Test mapping

| Requirement           | Test/evidence                                           |
| --------------------- | ------------------------------------------------------- |
| BR-01, AC-01          | `pnpm --filter @palea/mobile exec expo install --check` |
| AC-02                 | `pnpm --filter @palea/mobile exec expo-doctor`          |
| NFR-01, NFR-02, AC-03 | `pnpm validate`                                         |
