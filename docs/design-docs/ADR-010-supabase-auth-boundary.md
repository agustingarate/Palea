# ADR-010: Supabase Auth en clientes y datos de producto detrás de Nest

Status: accepted

ClickUp: [CU-86ajvbvcd](https://app.clickup.com/t/86ajvbvcd)

## Contexto

Palea necesita sesiones multiplataforma y OAuth sin exponer acceso privilegiado a
PostgreSQL o Storage. El modelo aprobado ya establece Nest como frontera de datos.

## Decisión

Expo usa `@supabase/supabase-js` directamente sólo para Auth. URL y publishable key
son públicas. Email/contraseña y OAuth PKCE producen una sesión persistida mediante
un adaptador específico de plataforma.

Cada llamada tRPC protegida adjunta el access token. Nest valida los claims con
Supabase Auth, deriva identidad sólo del `sub` y ejecuta datos y Storage con
credenciales server-side. Prisma implementa consultas y transacciones; Supabase CLI
y SQL continúan como autoridad del esquema.

Los uploads usan URLs firmadas limitadas emitidas por Nest, sin otorgar políticas
generales sobre `storage.objects`.

## Consecuencias

- El cliente nunca recibe `service_role`, conexiones ni secretos OAuth.
- Los permisos se aplican en Nest y en restricciones SQL.
- Apple queda detrás del mismo puerto de proveedor y deshabilitado hasta disponer
  de credenciales y validación nativa.

## Relación

- [SPEC-AUTH-001](../product-specs/auth-onboarding.md)
- [SPEC-DATA-001](../product-specs/mvp-data-model.md)
- [ADR-005](ADR-005-trpc-in-nest.md)
- [ADR-008](ADR-008-prisma-supabase-migrations.md)
