# ADR-008: Prisma Client con Supabase CLI como autoridad de esquema

Status: accepted

ClickUp: [MVP en Palea](https://app.clickup.com/90132810606/v/li/901328057904)
Stitch: proyecto privado `Palea Job Search Tracker` (`projects/16272299109015713935`)

## Contexto

Palea necesita PostgreSQL, Auth, Storage, RLS, funciones, triggers y seeds para
dos proyectos Supabase aislados. Nest necesita acceso tipado y transaccional sin
exponer tablas de producto a mobile o web.

## Decisión propuesta

Usar `@prisma/client` en Nest para consultas, tipos y transacciones. Usar
Supabase CLI como única autoridad de cambios de base: migraciones SQL, enums,
índices, RLS, funciones, triggers, Storage y seeds de staging. No usar
`prisma migrate dev/deploy` para promover el esquema.

Flujo:

1. `supabase migration new <name>` crea SQL versionado.
2. `supabase db reset` prueba migración, RLS y seed local.
3. CI aplica a staging con `supabase db push`.
4. Se ejecutan pruebas de RLS y seeds sintéticos.
5. La misma migración aprobada se aplica a producción.
6. Prisma se regenera y valida contra el esquema promovido.

`schema.prisma` es un contrato de lectura para Prisma Client, no la fuente de
verdad. RLS, funciones, triggers y Storage permanecen en SQL. Runtime usa el
pooler apropiado; introspección/CI usa conexión directa separada. Ninguna
credencial privilegiada llega al cliente.

## Consecuencias

Se conserva la expresividad completa de PostgreSQL/Supabase y el tipado de Nest.
El coste es controlar drift entre SQL y `schema.prisma`; CI debe validar ambos
artefactos juntos.

## Alternativa rechazada

Prisma Migrate como autoridad única: no representa adecuadamente políticas RLS,
Storage, funciones y triggers de Supabase, y vuelve más frágil la promoción entre
proyectos aislados.

## Relación

- [Modelo de datos funcional del MVP](../product-specs/mvp-data-model.md)
- [ADR-007: Managed platform stack](ADR-007-managed-platform-stack.md)
- [Deployment and environments](../DEPLOYMENT.md)
