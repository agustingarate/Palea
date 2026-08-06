---
id: SPEC-LOCALIZATION-001
status: approved
---

# Palea localization and internationalization

## Requirements

- **BR-01:** Mobile and web support Spanish (`es`) and English (`en`).
- **BR-02:** Locale detection accepts regional tags and resolves them to a supported base locale.
- **BR-03:** Unsupported or missing locales fall back deterministically to Spanish.
- **BR-04:** Translation resources and namespaces are shared without framework dependencies and consumed through i18next/react-i18next adapters.
- **BR-05:** Spanish and English catalogs contain the same keys.
- **NFR-01:** UI strings are not hardcoded in localized surfaces.
- **NFR-02:** Domain and transport packages do not depend on UI localization adapters.
- **NFR-03:** The system supports interpolation, pluralization, fallback, and Intl-based formatting through established libraries.

## Acceptance criteria

- **AC-01:** `es-AR` and `es-MX` resolve to `es`; `en-US` resolves to `en`.
- **AC-02:** Unsupported locales resolve to `es`.
- **AC-03:** Mobile detects the device locale and web detects the request/browser locale.
- **AC-04:** Current mobile and web UI text renders in both supported languages.
- **AC-05:** Catalog parity is tested and missing keys use a detectable fallback.
- **AC-06:** A future language selector can be added without changing UI components' translation API.

## Non-goals

No visible language selector, persisted language preference, remote catalog loading,
or translation of user-provided/domain data is included in this iteration.

## Test mapping

| Requirement          | Evidence                                  |
| -------------------- | ----------------------------------------- |
| BR-02, BR-03, NFR-03 | `packages/localization/src/index.test.ts` |
| BR-01, BR-04, BR-05  | Localization package tests and typecheck  |
| AC-03, AC-04         | Mobile/web integration tests and builds   |
| AC-05                | Catalog parity and missing-key tests      |
