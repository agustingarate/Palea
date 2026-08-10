# Palea architecture

Palea is a pnpm/Turborepo monorepo with an Expo product client, a Next.js
institutional site, and a Nest backend. Internal client-to-server calls prefer
tRPC. REST remains available for operational and interoperability endpoints,
while Axios is the generic HTTP transport for REST and external services.

## Deployment topology

- Cloudflare Pages serves the static Next.js institutional site and Expo Web SPA.
- Cloudflare provides DNS, TLS, CDN, edge filtering, and Turnstile in front of
  public surfaces.
- Google Cloud Run hosts the Nest API in São Paulo.
- Supabase provides PostgreSQL, Auth, and Storage from São Paulo.
- Staging and production are separate trust and data boundaries with distinct
  provider resources and credentials.
- Vercel AI SDK and AI Gateway provide backend-only, model-portable AI access;
  upstream providers remain configurable by capability.

See [ADR-007](docs/design-docs/ADR-007-managed-platform-stack.md) for the selected
platform and [Deployment and environments](docs/DEPLOYMENT.md) for promotion,
resource isolation, domains, and cost controls.

## Dependency rules

- Applications may depend on packages; applications never import other apps.
- Mobile features use `presentation -> domain` and `data -> domain`.
- Domain code is framework and transport independent.
- Expo Router files only adapt URLs to feature views.
- Composition roots assemble concrete implementations; views never resolve them.
- Runtime input is parsed with Zod at the boundary.

See `docs/design-docs/` for decisions and `docs/product-specs/` for accepted
requirements.
