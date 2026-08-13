# Definition of done

Work is complete when its acceptance criteria are demonstrably satisfied, affected
contracts and docs match the code, security boundaries remain intact, and
`pnpm validate` passes. Mobile-facing changes also require Expo Doctor and an
appropriate Expo/React Native smoke test. The branch is ready for remote review
only after these checks pass locally; incomplete work remains local unless an
intermediate push is explicitly requested.

Environment changes additionally require Zod boundary tests, updated examples and
catalog, explicit EAS profile inspection when mobile is affected, and confirmation
that no public client variable contains a secret.

Billing changes additionally require clean Supabase migration/reset evidence,
RLS tests for client reads and denied writes, duplicate and out-of-order event
tests, immutable commercial-history tests, and lifecycle coverage for trial,
cancellation, grace, renewal, refund/revocation, multiple sources, manual grants,
and account deletion. Provider mappings must use real sandbox/live IDs in their
own environments; commercial fixtures must remain transaction-scoped in tests.

No production billing change is done until Paddle and RevenueCat reconciliation
passes in staging and the Argentine accounting launch gate in `docs/BILLING.md`
has a recorded professional decision.
