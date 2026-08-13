# Guardrails

## Billing

- Paddle is authoritative for web money; App Store and Play Store will be
  authoritative for their native channels. RevenueCat is the initial authority
  for entitlements across channels. A financial subscription state never grants
  access by itself.
- Billing clients do not access base tables. Reads and writes use a privileged
  backend boundary with capability-specific responses. Future support, admin,
  and finance roles never imply unrestricted database access.
- Never store card numbers, CVV, expiry, payment tokens, bank details, or
  unnecessary billing addresses. Keep provider and webhook secrets server-side.
- Provider event envelopes, processing attempts, entitlement observations,
  financial operations, adjustments, subscription history, and administrative
  actions are append-only. Payload expiry may remove only the raw payload while
  preserving its envelope and hash.
- Access is recomputed from the latest authoritative entitlement observations
  and unrevoked manual grants. Cancellation, grace, refund, and revocation follow
  RevenueCat for access and the financial provider for money.
- The authenticated Supabase UUID is the RevenueCat App User ID. A restore must
  never transfer a purchase between different Palea accounts.
- Supabase billing data is an operational projection, not a tax ledger or general
  ledger. Preserve provider statements and statutory evidence outside it.

## General

- No client secrets or direct calls from clients to privileged AI providers.
- No imports from one application into another.
- No transport/framework dependencies in a mobile feature domain layer.
- No data-layer imports from presentation.
- Validate environment variables, HTTP payloads, and tRPC inputs with Zod.
- Keep mobile variants separate from deployment targets; never use `NODE_ENV`
  to choose staging or production.
- Treat `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` as public, never as secret stores.
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
