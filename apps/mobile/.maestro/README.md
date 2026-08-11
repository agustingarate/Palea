# Maestro smoke

Install a Palea development client, start Metro with `pnpm start:local` or
`pnpm start:staging`, then run `maestro test .maestro/projects-smoke.yaml`.
The application id differs by platform/build, so update `appId` for development
builds. Hosted execution is intentionally deferred until an emulator runner exists.
