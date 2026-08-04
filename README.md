# Palea

Palea is a TypeScript monorepo for a job-search companion.

## Applications

- `apps/mobile`: Expo SDK 54 app for iOS, Android, and Web.
- `apps/web`: Next.js institutional website.
- `apps/backend`: Nest API exposing REST and tRPC in one process.

## Quick start

```bash
pnpm install
pnpm build
pnpm mobile
pnpm web
pnpm backend
```

The mobile command builds its workspace dependencies before starting Expo, so
shared NativeWind components and design-token adapters are always current.

Mobile defaults to its in-memory Projects datasource. Copy the relevant
`.env.example` file to select `trpc` or `rest` and run the backend on port 3001.

Run `pnpm validate` before review. Architecture and agent guidance begins in
`AGENTS.md`; durable decisions live under `docs/`.
