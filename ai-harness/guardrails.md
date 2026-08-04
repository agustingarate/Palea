# Guardrails

- No client secrets or direct calls from clients to privileged AI providers.
- No imports from one application into another.
- No transport/framework dependencies in a mobile feature domain layer.
- No data-layer imports from presentation.
- Validate environment variables, HTTP payloads, and tRPC inputs with Zod.
- Do not log authorization values, tokens, credentials, or sensitive payloads.
- Treat generated artifacts as disposable; edit their source instead.
