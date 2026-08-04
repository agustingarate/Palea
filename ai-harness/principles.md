# Core principles

- Optimize for maintainability, testability, accessibility, and secure defaults.
- Keep business rules independent of UI, frameworks, and transports.
- Prefer explicit dependency injection and small ports over global service locators.
- Parse external data at the boundary and keep internal types trustworthy.
- Keep one source of truth; adapters reference it instead of copying it.
- Use boring, inspectable abstractions and encode important invariants in tooling.
