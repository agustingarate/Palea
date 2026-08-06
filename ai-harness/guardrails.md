# Guardrails

- No client secrets or direct calls from clients to privileged AI providers.
- No imports from one application into another.
- No transport/framework dependencies in a mobile feature domain layer.
- No data-layer imports from presentation.
- Validate environment variables, HTTP payloads, and tRPC inputs with Zod.
- Do not log authorization values, tokens, credentials, or sensitive payloads.
- Treat generated artifacts as disposable; edit their source instead.
- Do not create pull requests or push incomplete work when the remote workflow
  would consume limited CI runs; defer remote delivery until local validation
  passes, unless the user explicitly requests an intermediate push.
- Module boundaries are preserved; no cross-layer shortcuts (e.g. backend domain calling HTTP, frontend bypassing shared API).
- No invented or fictional APIs, packages, or internal utilities.
- Dependencies added are real, in the repo or registry, and already used in the monorepo where relevant.
- Types are consistent: no any or loose types where contracts or shared types exist.
- New exports or public interfaces are intentional and documented if non-obvious.
- Assumptions (missing types, unclear requirements, implicit rules) are stated explicitly, not silently assumed.
- Uncertainty is flagged instead of guessed (e.g. “If X is required, then …” or “Clarify whether …”).
- No speculative or “might be useful” code without explicit request.
