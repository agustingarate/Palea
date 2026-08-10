# ADR-007: Managed platform stack and environment topology

Status: accepted

ClickUp: [CU-86ajy2gwd](https://app.clickup.com/t/86ajy2gwd)

## Context

Palea is a personal project intended to start with low traffic in Argentina and
remain viable for broader adoption. The platform must minimize fixed cost and
operational burden without choosing temporary technologies that require an early
rewrite. It must support an Expo product on iOS, Android, and Web, a public Next.js
site, and a Nest backend.

The service selection prioritizes usable free tiers, explicit spending controls,
provider portability, managed scaling, and a small provider footprint. Palea has
two persistent environments: staging and production.

## Decision

Use the following managed platform stack:

| Capability                                         | Decision                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| Relational data                                    | Supabase PostgreSQL in AWS São Paulo (`sa-east-1`)                       |
| Authentication                                     | Supabase Auth for email/password, Google, LinkedIn, and Apple            |
| Object storage                                     | Supabase Storage                                                         |
| Product analytics                                  | PostHog                                                                  |
| Error and performance monitoring                   | Sentry                                                                   |
| Transactional and marketing email                  | Brevo                                                                    |
| DNS, TLS, CDN, edge protection, and bot challenges | Cloudflare Free and Turnstile                                            |
| Public institutional site                          | Static Next.js export on Cloudflare Pages while SSR is unnecessary       |
| Authenticated product web app                      | Expo Web SPA on Cloudflare Pages                                         |
| Backend                                            | Nest on Google Cloud Run in São Paulo (`southamerica-east1`)             |
| Push notifications                                 | Expo Push Service                                                        |
| Cloud logs and metrics                             | Google Cloud Logging and Monitoring, with Sentry as the application view |
| Dependency security                                | GitHub Dependabot and repository audit checks in CI                      |
| Generative AI integration                          | Vercel AI SDK through Vercel AI Gateway                                  |

CodeQL advanced code scanning is not part of the initial stack because private
repositories require a paid GitHub security license. Reconsider it when that
license provides sufficient value.

São Paulo is selected to reduce expected latency for the initial Argentine user
base. Supabase and Cloud Run still run in different clouds, so the design must
measure cross-cloud latency and egress. Region selection does not itself satisfy
Argentine international-transfer requirements; contracts and data-processing
terms must be reviewed before production data is stored.

## Environment isolation

Staging and production are separate trust and data boundaries. They must not share
databases, storage buckets, OAuth credentials, signing keys, service credentials,
AI Gateway keys, push credentials, or user datasets. Google Cloud and Supabase use
separate projects. Public hostnames and Cloudflare deployments are also separate.

`development` deploys to staging after validation. `main` is the production source
and production deployment requires an explicit promotion gate. See
[Deployment and environments](../DEPLOYMENT.md) for the resource matrix and cost
controls.

## AI provider abstraction

Vercel AI SDK is the application integration layer and Vercel AI Gateway is the
managed routing layer. Neither choice fixes a single upstream model provider.
Backend-owned aliases such as `fast`, `quality`, and `embedding` resolve to approved
models through configuration. A model change must not require client releases.

All model calls originate in Nest. Web and mobile clients never receive provider
or Gateway secrets and cannot select arbitrary models. Structured model input and
output is parsed with Zod. Prompt content is minimized, training is disallowed,
and workflows involving sensitive personal data require an approved zero-data-
retention route and legal review.

## Cost policy

Remain on plans that stop at their free quota without a payment method wherever
possible. Google Cloud Run is the initial exception because its free allowance
requires a billing account. Use scale-to-zero, low maximum instance counts,
per-project budgets, alerts, and a spend cap where available.

Vercel AI Gateway starts with its monthly free credit. Auto top-up remains disabled.
When paid credits are enabled, every environment uses a separate API key and an
explicit key budget. Supabase Pro, PostHog paid usage, Sentry pay-as-you-go, and
Cloudflare paid products require an explicit recorded decision before activation.

## Consequences

- The initial product has no always-on application server or database fleet to
  operate directly.
- Static hosting does not make product data static: the Expo Web SPA retrieves
  dynamic data from the Nest API.
- If the institutional site later requires request-time personalization or public
  dynamic SEO, only that site moves to an SSR-capable runtime through a new ADR.
- Managed services reduce operations but introduce external subprocessors, network
  hops, quotas, and vendor outages that must be represented in telemetry and legal
  review.
- Two environments consume two Supabase Free projects. Services whose free plan
  cannot isolate staging must remain disabled there or move to a plan that supports
  isolation; production data is never reused as a workaround.

## References

- [ClickUp comparison and decision document](https://app.clickup.com/90132810606/docs/2ky5b2ve-5613)
- [Supabase regions](https://supabase.com/docs/guides/platform/regions)
- [Supabase cost control](https://supabase.com/docs/guides/platform/cost-control)
- [Cloud Run locations](https://cloud.google.com/run/docs/locations)
- [Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Cloudflare Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)
- [Argentine international data transfers](https://www.argentina.gob.ar/transferencias-internacionales)
