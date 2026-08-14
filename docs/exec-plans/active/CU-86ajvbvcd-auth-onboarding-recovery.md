---
story: CU-86ajvbvcd
specs:
  - SPEC-AUTH-001 v1.1
  - SPEC-DATA-001 v1.2
base: development@91d0415
branch: refactor/auth/registro-login-onboarding-CU-86ajvbvcd
status: active
---

# Recovery plan — Registro, autenticación y onboarding

## Guardrails

- La rama previa `feat/auth/registro-login-onboarding-CU-86ajvbvcd` queda como
  evidencia y no se reutiliza ni se reescribe.
- Cada commit implementa una única responsabilidad verificable y referencia los
  requisitos aplicables.
- No se publica la rama ni se crea PR hasta completar validación local.
- Stitch es la fuente visual; la implementación de vistas queda bloqueada de
  aceptación hasta disponer de sus pantallas/variantes verificables.

## Slices y commits previstos

1. `docs(auth)`: especificación, modelo y este plan de recuperación.
2. `feat(contracts)`: schemas Zod, DTOs y códigos de error compartidos, con
   tests de contratos.
3. `feat(api)`: migraciones SQL y servicios Nest de cuenta/onboarding/CV,
   pruebas SQL e integración.
4. `feat(mobile)`: puertos de dominio, casos de uso, datasources y repositorios
   aislados de Supabase/tRPC, con unit tests.
5. `feat(ui-native)`: sólo capacidades reutilizables faltantes para las vistas
   aprobadas, con pruebas del design system.
6. `feat(mobile)`: ViewModels TanStack Form/Query y vistas auth/onboarding con
   `ui-native` + NativeWind, con pruebas de formularios y navegación.
7. `test(e2e)`: E2E reales, responsive y CI/variables públicas.

## Gates

- Antes de cada slice: dependencias, contratos y criterios de aceptación
  identificados.
- Antes de vistas: comparación contra Stitch y copia ES/EN verificadas.
- Antes de push: tests de slice, SQL, Expo Doctor, export multiplataforma y
  `pnpm validate`.
