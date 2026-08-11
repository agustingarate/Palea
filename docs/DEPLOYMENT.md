# Deployment and environments

This document operationalizes
[ADR-007](design-docs/ADR-007-managed-platform-stack.md). Palea has exactly two
persistent remote environments: staging and production. Local development is not
a shared environment and uses local or explicitly disposable resources.

The variable contract, mobile variants, provider setup and local runbook live in
[Environment configuration](ENVIRONMENTS.md).

## Promotion model

| Environment | Source branch | Purpose                                           | Deployment                                  |
| ----------- | ------------- | ------------------------------------------------- | ------------------------------------------- |
| Staging     | `development` | Integration, acceptance, and release verification | Automatic after required validation passes  |
| Production  | `main`        | Real users and data                               | Explicit promotion after staging acceptance |

A production release promotes an already validated revision. Environment-specific
behavior comes from configuration and credentials, not long-lived code divergence.

## Public endpoints

| Surface                    | Staging                 | Production      |
| -------------------------- | ----------------------- | --------------- |
| Institutional Next.js site | `staging.palea.com`     | `palea.com`     |
| Expo Web product           | `app.staging.palea.com` | `app.palea.com` |
| Nest API                   | `api.staging.palea.com` | `api.palea.com` |

The final domain remains configurable, but the three-surface separation is
contractual. Cloudflare proxies public traffic before it reaches the origin.

## Provider accounts, projects, and quotas

Providers use the word _project_ differently. In this document:

- **Account, organization, or team** is the shared billing and administration
  container.
- **Project** is a provider resource. It may or may not be a security or billing
  boundary.
- **Environment** is staging or production inside a project when the provider
  supports that distinction.
- **Shared quota** means staging consumption reduces what remains available to
  production, even when their credentials or projects are different.

### Topology summary

| Provider                      | Shared container                               | Separate provider project required?                         | Can one project represent both environments?                                                    | Quota and billing scope                                                                                                                                                          | Palea initial decision                                                                                                                          |
| ----------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase                      | One Free organization                          | **Yes:** one project for staging and one for production     | No. A Supabase project is one PostgreSQL/Auth/Storage instance                                  | Two active Free projects are available. Database size and compute are project-specific; several usage quotas are summed for the organization                                     | Create `palea-staging` and `palea-production` in the same Free organization                                                                     |
| Google Cloud                  | One billing account                            | **Yes by architecture:** one GCP project per environment    | Technically yes, but it would mix IAM, budgets, logs, APIs, and accidental access               | Cloud Run's free allowance is aggregated across every project attached to the billing account; invoices are also shared. Budgets and operational resources remain project-scoped | Create `palea-staging` and `palea-production`; attach both to the same billing account                                                          |
| Cloudflare Pages              | One Cloudflare account                         | **No:** one Pages project per frontend, not per environment | Yes. Each Pages project has production and preview deployments/configuration                    | The Free account shares build concurrency and 500 monthly builds. Static asset requests are free; Functions consume Workers account quotas                                       | Create two projects total: `palea-site` and `palea-app`. Map `main` to production and `development` to preview/staging in each                  |
| Cloudflare edge and Turnstile | One Cloudflare account and DNS zone            | No separate account or zone                                 | Yes, using hostnames, rules, and distinct Turnstile site keys                                   | Plan limits and paid usage are account/zone scoped, not isolated budgets per environment                                                                                         | Share the zone; create separate Turnstile widgets/site keys and environment-specific rules                                                      |
| Sentry                        | One Sentry organization                        | No separate project per environment                         | Yes. A Sentry project separates events with the `environment` tag                               | Subscription quota and billing are organization-wide across projects and environments                                                                                            | Create projects by application surface—backend, Expo product, and Next site—and use `staging`/`production` environments inside each             |
| PostHog                       | One PostHog organization                       | Free permits only one project                               | Staging could be tagged inside the same project, but that is not strong isolation               | Free and paid product quotas are shared by the account; staging events consume the same allowance. Pay-as-you-go currently permits more projects                                 | Send production analytics only. Keep staging analytics disabled until an isolated second project is available                                   |
| Brevo                         | One Brevo account                              | Brevo has no project/environment boundary                   | No native environment isolation; API keys and sending policy provide only logical separation    | Daily/monthly email allowance and contacts are shared by the account                                                                                                             | Use the production account. Staging uses a dedicated API key with sending disabled, sandboxed, or restricted to an explicit recipient allowlist |
| Expo/EAS                      | One Expo account and one EAS project for Palea | No separate EAS project required initially                  | Yes. EAS provides `preview` and `production` variable sets, build profiles, and update channels | EAS Build/Update quotas are account/plan scoped. Expo Push rate limits apply to the Expo project                                                                                 | Use one EAS project, separate build profiles/channels, app variants, API URLs, bundle identifiers, and push credentials                         |
| Vercel AI Gateway             | One Vercel team                                | No application project is required for Cloud Run usage      | Yes, through separate API keys, budgets, and request tags                                       | The USD 5 free credit or prepaid balance belongs to the team and is shared by both keys                                                                                          | Create `palea-staging` and `palea-production` Gateway keys with separate budgets; keep auto top-up disabled                                     |
| GitHub                        | One repository                                 | No separate repository                                      | Yes. GitHub Environments can hold separate secrets and protection rules                         | Actions allowance is governed by the account/repository plan; Dependabot is repository-wide                                                                                      | Create `staging` and `production` GitHub Environments. Production requires an approval gate                                                     |

### Resources that must be duplicated

Only these providers require separate projects for Palea's two data and trust
boundaries:

1. **Supabase:** two projects. This consumes the entire allowance of two active
   Free projects. If the organization moves to Pro, the plan applies to all its
   projects and each project has its own compute cost.
2. **Google Cloud:** two projects. They share the billing account and therefore
   Cloud Run's free allowance, but isolate IAM, runtime identities, budgets, logs,
   APIs, and accidental deletion.

Other duplicated resources are smaller environment-scoped objects—API keys,
Turnstile site keys, OAuth clients, app identifiers, secrets, budgets, and release
channels—not new provider accounts.

### Services that intentionally share a project or account

- Each Cloudflare Pages frontend uses one project with `main` as production and
  `development` as its named preview deployment. Preview and production variables
  are separate, but all preview branches share the same preview configuration.
- Each Sentry application project receives both environments and separates them
  with the required `environment` tag. Alerts and dashboards must filter the tag.
- Expo/EAS uses one project with staging and production build profiles, variable
  sets, update channels, native identifiers, and credentials.
- Brevo and Vercel AI Gateway share their account/team balance. Separate API keys
  improve attribution and access control but do not create separate free quotas.

No service may copy production personal data into staging. Tests use generated or
irreversibly anonymized data. Secrets live in provider or CI secret stores and are
never committed, exposed through public Expo variables, or reused across
environments.

## Hosting model

The institutional Next.js site uses static export while it only needs build-time
public content. Cloudflare Pages serves the generated HTML, CSS, JavaScript, and
assets without running Next.js on every request.

The Expo Web product uses SPA output. Its application files are static, while its
authenticated data remains dynamic because the browser calls the Nest API. The API
runs on Cloud Run with request-based billing and scale-to-zero.

SSR means generating HTML in a running server for each request. It is intentionally
deferred. Request-time personalization, server-only cookies, or dynamic SEO are
triggers to reassess the institutional site through a new ADR; they are not reasons
to move the Expo Web product away from static hosting.

## Initial cost guardrails

- Keep payment methods absent on services whose free plan stops at a hard quota.
- Create separate Google Cloud budgets for staging and production with alerts at
  50%, 80%, and 100%.
- Use a Cloud Run minimum of zero. Start staging at a maximum of one instance and
  production at two or three; raise limits only from observed demand.
- Enable the Google Cloud spend cap for Cloud Run when available, while treating it
  as a delayed safety mechanism rather than an exact real-time cutoff.
- Keep Vercel AI Gateway auto top-up disabled. If paid credits are approved, set a
  renewable budget on each environment key and handle HTTP 402 as controlled
  capacity exhaustion.
- Keep Supabase Pro Spend Cap enabled if either environment upgrades. Review
  uncovered compute and add-on charges separately.
- Leave Sentry pay-as-you-go at zero and set PostHog product limits before enabling
  paid overages.
- Paid products, add-ons, higher instance limits, and automatic credit top-ups
  require a recorded approval.

## Release checks

Before promotion to production, verify:

1. `pnpm validate` passed for the promoted revision.
2. Environment variables parse successfully at their server boundary.
3. OAuth callback URLs, CORS origins, application identifiers, and public URLs
   reference only the target environment.
4. Database migrations completed in staging before production.
5. Health checks, Sentry release tagging, logging, and cost alerts are active.
6. Rollback identifies the previous application revision and the database recovery
   procedure; a destructive schema change cannot rely only on application rollback.

## Provider references

- [Supabase organization billing and project quotas](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)
- [Cloud Run pricing and billing-account aggregation](https://cloud.google.com/run/pricing)
- [Cloudflare Pages preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Cloudflare Pages Free limits](https://developers.cloudflare.com/pages/platform/limits/)
- [PostHog plans and project limits](https://posthog.com/pricing)
- [Expo application variants](https://docs.expo.dev/build-reference/variants/)
- [Expo environment variables](https://docs.expo.dev/eas/environment-variables/manage/)
- [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)
- [Vercel AI Gateway budgets](https://vercel.com/changelog/budgets-for-api-keys-on-ai-gateway)
