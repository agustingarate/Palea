# Palea architecture

Palea is a pnpm/Turborepo monorepo with an Expo product client, a Next.js
institutional site, and a Nest backend. Internal client-to-server calls prefer
tRPC. REST remains available for operational and interoperability endpoints,
while Axios is the generic HTTP transport for REST and external services.

## Dependency rules

- Applications may depend on packages; applications never import other apps.
- Mobile features use `presentation -> domain` and `data -> domain`.
- Domain code is framework and transport independent.
- Expo Router files only adapt URLs to feature views.
- Composition roots assemble concrete implementations; views never resolve them.
- Runtime input is parsed with Zod at the boundary.

See `docs/design-docs/` for decisions and `docs/product-specs/` for accepted
requirements.
