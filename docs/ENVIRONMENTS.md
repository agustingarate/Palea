# Environment configuration

This runbook complements [Deployment and environments](DEPLOYMENT.md) and implements `SPEC-PLATFORM-001`.

## Model

| Concept           | Values                           | Meaning                              |
| ----------------- | -------------------------------- | ------------------------------------ |
| Mobile variant    | development, preview, production | Native binary and tooling capability |
| Deployment target | development, staging, production | Data and service trust boundary      |
| Node mode         | development, test, production    | Tooling and automated-test mode      |

`NODE_ENV` never selects a deployment target. UAT is intentionally absent; add it as a new explicit target, variable set, URLs and identifiers when required.

## Public variable catalog

| Surface           | Variables                                                                     | Source                           |
| ----------------- | ----------------------------------------------------------------------------- | -------------------------------- |
| Mobile / Expo Web | `EXPO_PUBLIC_PALEA_ENV`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_PROJECTS_SOURCE` | `.env.local` or EAS              |
| Institutional web | `NEXT_PUBLIC_PALEA_ENV`, `NEXT_PUBLIC_API_URL`                                | `.env.local` or Cloudflare Pages |
| Backend           | `NODE_ENV`, `PALEA_ENV`, `PORT`, `CORS_ORIGINS`                               | `.env.local` or Cloud Run        |

All client values are public. Never put provider keys, tokens, private URLs, credentials or signing material in them.

## Web applications: setup and commands

Palea has two web surfaces. They must be configured independently because they
use different frameworks and public variable prefixes.

### Institutional site (`apps/web`)

Next.js reads `.env.local` when running locally. Create it once from the tracked
example, then set the local backend URL:

```powershell
Set-Location apps/web
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```dotenv
NEXT_PUBLIC_PALEA_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Run the site with:

```powershell
pnpm --filter @palea/web dev
```

For a local staging or production build, set both values in the current
PowerShell session before building. They do not modify files:

```powershell
$env:NEXT_PUBLIC_PALEA_ENV = 'staging'
$env:NEXT_PUBLIC_API_URL = 'https://api.staging.palea.com'
pnpm --filter @palea/web build
```

Use `production` and `https://api.palea.com` for a production build. On
Cloudflare Pages, configure the same two variables separately in the preview
(staging) and production environments before the build runs. `NEXT_PUBLIC_*`
values are embedded by `next build`; changing a Pages variable requires a new
deployment and never changes an already published static artifact.

### Product app for Expo Web (`apps/mobile`)

Expo Web uses the same public variables as the native mobile app. For local
development, create `apps/mobile/.env.local` from `.env.example` and set an API
URL reachable from the browser:

```dotenv
APP_VARIANT=development
EXPO_PUBLIC_PALEA_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_PROJECTS_SOURCE=trpc
```

Run or export it locally:

```powershell
pnpm --filter @palea/mobile web
pnpm --filter @palea/mobile build
```

Use the EAS staging and production sets without editing `.env.local`:

```powershell
pnpm --filter @palea/mobile web:staging
pnpm --filter @palea/mobile build:staging
pnpm --filter @palea/mobile build:production
```

Cloudflare Pages must receive the three `EXPO_PUBLIC_*` values matching the
target before `expo export --platform web` runs. `APP_VARIANT` is a build-time
native configuration value and is not needed by the deployed Expo Web artifact.

## Changing a web variable

1. Change the local `.env.local` only for your machine; it is ignored by Git.
2. Change the corresponding Cloudflare Pages environment variable for staging
   or production.
3. Rebuild and redeploy that surface; public web values are compiled into the
   artifact.
4. If the variable is a new contract, update its Zod schema, `.env.example`,
   this catalog, CI cache inputs and tests in the same change.

## Mobile variants and profiles

| Profile                 | Variant            | Target             | Identifier          |
| ----------------------- | ------------------ | ------------------ | ------------------- |
| `development`           | development client | staging by default | `com.palea.app.stg` |
| `development-simulator` | development client | staging by default | `com.palea.app.stg` |
| `preview-staging`       | internal release   | staging            | `com.palea.app.stg` |
| `preview-production`    | internal release   | production         | `com.palea.app`     |
| `production`            | store release      | production         | `com.palea.app`     |

There are intentionally only two native identities: `palea-stg` /
`com.palea.app.stg` for staging, and `palea` / `com.palea.app` for production.
Development tooling does not create a third identity; it shares the staging
identity. Consequently, a `preview-production` build and the published
production app cannot be installed side by side on the same device: installing
one replaces the other. This is an intentional trade-off that avoids duplicating
native third-party, deep-link and store configuration.

## Mobile: setup and commands

### Local development

Create `apps/mobile/.env.local` from the tracked example. This file is ignored
by Git and is the only file to edit for local mobile configuration:

```powershell
Set-Location apps/mobile
Copy-Item .env.example .env.local
```

Use a URL that the selected runtime can reach:

| Runtime          | `EXPO_PUBLIC_API_URL` example |
| ---------------- | ----------------------------- |
| iOS Simulator    | `http://localhost:3001`       |
| Android Emulator | `http://10.0.2.2:3001`        |
| Physical device  | `http://192.168.x.x:3001`     |

For a physical device, start the backend on the LAN, use the computer's private
IP address and keep both devices on the same network. Do not commit that address.

Start Metro for the installed development client:

```powershell
pnpm --filter @palea/mobile start:local
```

The first native compilation, or any change to native dependencies or
`app.config.ts`, requires rebuilding the client:

```powershell
pnpm --filter @palea/mobile exec expo run:android
pnpm --filter @palea/mobile exec expo run:android --device
pnpm --filter @palea/mobile exec expo run:ios
pnpm --filter @palea/mobile exec expo run:ios --device
```

The default commands target an Android Emulator or iOS Simulator. `--device`
selects a connected physical device. iOS device and simulator builds require
macOS/Xcode; Android works with Android Studio on Windows, macOS or Linux.

### Staging with a development client

Use the EAS preview variable set without modifying `.env.local`:

```powershell
pnpm --filter @palea/mobile start:staging
```

It runs the development-client variant while Metro receives the staging API URL
and `trpc` datasource. This is useful for a simulator or a physical device when
the local backend is unavailable.

### EAS Build in the cloud

Build a development client for Android or an iOS Simulator:

```powershell
eas build --platform android --profile development
eas build --platform ios --profile development-simulator
```

Create an internal release-like build against staging:

```powershell
eas build --platform all --profile preview-staging
```

`preview-production` is an explicit, internal-only verification profile. It uses
the production identity, so it replaces an installed production build on the
same device. Run it manually only when a production behavior cannot be
reproduced in staging:

```powershell
eas build --platform all --profile preview-production
```

The published build is the only profile submitted to stores:

```powershell
eas build --platform all --profile production
eas submit --platform all --profile production
```

### EAS Build on the local machine

Use the same profile with `--local` when debugging an EAS build:

```powershell
eas build --platform android --profile development --local
eas build --platform android --profile preview-staging --local
```

EAS local builds need the native toolchain, Expo authentication and signing
access. On Windows they require WSL and are not officially supported; use the
native `expo run:android` workflow for normal local Android development.

### EAS variables and changes

Create EAS project variables as plaintext because they are embedded in the app:

| EAS set     | `EXPO_PUBLIC_PALEA_ENV` | `EXPO_PUBLIC_API_URL`           | `EXPO_PUBLIC_PROJECTS_SOURCE` |
| ----------- | ----------------------- | ------------------------------- | ----------------------------- |
| development | staging                 | `https://api.staging.palea.com` | `trpc`                        |
| preview     | staging                 | `https://api.staging.palea.com` | `trpc`                        |
| production  | production              | `https://api.palea.com`         | `trpc`                        |

Manage them in Expo dashboard → Project settings → Environment variables, or
inspect them with `eas env:list <development|preview|production>`. After changing
an EAS value, create a new build; a value already embedded in a binary cannot be
changed remotely. `APP_VARIANT` is not an EAS variable: it is intentionally set
by each build profile in `eas.json` and selects the native identifier.

EAS Update channels are not configured yet. Add them only with an explicit OTA
update workflow that also configures `expo-updates` and `runtimeVersion`.

## Provider runbook

- EAS: configure only the public variables above in the `development`, `preview` and `production` variable sets.
- Cloudflare Pages: set `NEXT_PUBLIC_*` values separately for preview/staging and production before `next build`.
- Cloud Run: set backend variables and secrets per service environment; use separate staging and production projects and identities.
- Before release, verify CORS, OAuth callbacks, identifiers and URLs point only to the intended target.
