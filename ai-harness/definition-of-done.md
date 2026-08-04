# Definition of done

Work is complete when its acceptance criteria are demonstrably satisfied, affected
contracts and docs match the code, security boundaries remain intact, and
`pnpm validate` passes. Mobile-facing changes also require Expo Doctor and an
appropriate Expo/React Native smoke test. The branch is ready for remote review
only after these checks pass locally; incomplete work remains local unless an
intermediate push is explicitly requested.
