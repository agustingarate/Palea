---
id: SPEC-DATA-001
title: Modelo de datos funcional del MVP
status: approved
version: 1.2
stories:
  - CU-86ajvbcd
  - CU-86ajvbvcg
  - CU-86ajvbvcp
  - CU-86ajvbvcw
  - CU-86ajvbvd3
  - CU-86ajvbvda
  - CU-86ajvbvdm
  - CU-86ajvbvdw
  - CU-86ajvbve4
  - CU-86ajvbve7
  - CU-86ajvbvec
  - CU-86ajvbvey
  - CU-86ajvbvf8
clickup: https://app.clickup.com/90132810606/v/li/901328057904
delivery_tasks:
  implemented: https://app.clickup.com/t/86ak0kypk
  storage: https://app.clickup.com/t/86ak0kyxg
  validation: https://app.clickup.com/t/86ak0kyxz
  legal_gate: https://app.clickup.com/t/86ak0kyy4
stitch: projects/16272299109015713935
last_reviewed: 2026-08-13
---

# Modelo de datos funcional del MVP

ClickUp es la fuente funcional y Stitch la referencia visual. El proyecto
Stitch `Palea Job Search Tracker` contiene las variantes mobile/web de las
pantallas referenciadas por las historias. Esta especificación está aprobada
para la primera entrega de base de datos. Los contratos de API quedan fuera de
esta entrega.

## Modelo relacional

| Tabla                                  | Campos y propósito                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                             | Extiende `auth.users`: identidad, nombre, nacimiento, nacionalidad, descripción profesional, experiencia y onboarding.      |
| `profile_interests` / `user_interests` | Catálogo administrable y relación usuario–catálogo; máximo tres intereses por usuario.                                      |
| `skills` / `user_skills`               | Catálogo administrable y relación usuario–catálogo; máximo diez habilidades sin duplicados.                                 |
| `work_experiences`                     | Empresa, rol, inicio, fin, empleo actual y timestamps. Onboarding captura como máximo una; Perfil permite varias.           |
| `resumes`                              | Path privado, nombre, MIME, tamaño y marca de principal. Sólo PDF, máximo 10 MiB y uno principal.                           |
| `applications`                         | Empresa, rol, fecha, estado, URL, ubicación, descripción, modalidad, dedicación, contrato, duración, horario y CV opcional. |
| `application_stages`                   | Nombre, detalles, fecha opcional e historial independiente del estado actual.                                               |
| `application_notes`                    | Una nota privada editable por postulación.                                                                                  |
| `application_resources`                | Nombre, URL y tipo opcional por postulación.                                                                                |

Todos los IDs son UUID y las tablas de producto usan timestamps del servidor.
Las entidades hijas de una postulación usan `ON DELETE CASCADE`.
`applications.resume_id` usa `ON DELETE SET NULL`, por lo que borrar una
postulación no elimina el CV y borrar un CV no elimina la postulación.

## Estados y restricciones

- `application_status`: `draft`, `applied`, `interview`, `offer`, `rejected`.
- `work_mode`: `remote`, `hybrid`, `onsite`, `unspecified`.
- `commitment`: `full_time`, `part_time`, `unspecified`.
- `contract_type`: `employment`, `freelance`, `services`, `internship`, `other`,
  `unspecified`.
- `duration_type`: `indefinite`, `temporary`, `unspecified`.
- `experience_band`: `zero_to_one`, `two_to_four`, `five_to_eight`, `over_eight`.
- `profiles.nationality` almacena códigos ISO 3166-1 alpha-2.
- Los catálogos de intereses y habilidades conservan `label_es` y `label_en`.
- `resume_upload_status`: `pending`, `ready`, `failed`. Una reserva `pending`
  tiene expiración; sólo un CV `ready` puede ser principal. El CV opcional del
  onboarding se marca principal al confirmarse.
- Una postulación exige empresa, rol y fecha; tiene cero o un CV asociado.
- El CV asociado debe pertenecer al mismo usuario.
- `ended_on >= started_on`, excepto empleo actual sin fecha final.
- Las etapas se ordenan por `event_on` y luego `created_at`; no se crean etapas
  iniciales automáticamente.
- Los límites de intereses y habilidades se serializan por perfil con advisory
  locks transaccionales para impedir que inserts concurrentes los excedan.

## Acceso, RLS y Storage

Nest es la frontera de datos del producto. Mobile y web usan tRPC/REST y no
acceden directamente a tablas de aplicación. Todas las tablas mantienen RLS
habilitado como defensa adicional, pero `anon` y `authenticated` no reciben
privilegios sobre las tablas base.

Los catálogos se administran mediante capacidades de backend. Los futuros roles
de administración o soporte se implementarán con endpoints y DTOs mínimos, no
con acceso indiscriminado al schema `public`.

Storage utiliza el bucket privado `resumes`:

- límite de archivo: 10 MiB;
- MIME permitido: `application/pdf`;
- paths bajo el UUID del usuario;
- Nest autoriza y genera URLs firmadas de carga o descarga;
- el cliente no recibe políticas directas sobre `storage.objects`.

Nest debe crear o reservar la fila de CV dentro del flujo de carga y limpiar
objetos abandonados. El bucket y la tabla validan MIME y tamaño de forma
independiente.

## Triggers e invariantes

SQL implementa:

- `set_updated_at()`;
- creación automática de `profiles` al crear un usuario Auth;
- límites concurrentes de tres intereses y diez habilidades;
- un único CV principal;
- ownership del CV asociado a una postulación.

Nest también valida entradas con Zod, pero las invariantes estructurales se
mantienen en PostgreSQL.

## Staging y producción

Staging y producción son proyectos Supabase separados con migraciones idénticas.
Staging usa catálogos y usuarios sintéticos; nunca copia usuarios, CVs, notas ni
postulaciones de producción. Secrets, URLs y service role keys se resuelven por
ambiente y no llegan a mobile/web.

Prisma Client se recomienda para consultas y transacciones desde Nest. Supabase
CLI es la autoridad para migraciones SQL, RLS, funciones, triggers, buckets y
seeds. Prisma Migrate no promueve cambios de esquema.

## Referencias visuales Stitch

El proyecto contiene `Applications Home (List/Board)`, `New Application (JD
Capture)`, `Application Detail`, `Add/Edit Stage`, `Edit Application: Notes`,
`Edit Application: Resources`, `CV / Resume Library`, onboarding de perfil y
skills/CV, además de variantes web y estados loading/error. La pantalla
`Onboarding: Skills & Resume` es una inconsistencia visual conocida: la función
de CV se mantiene separada en `resumes` y Biblioteca.

## Decisiones aprobadas

- `application_notes` es una única nota editable por postulación.
- Se aprueban los enums definidos en esta especificación.
- Los contratos tRPC/REST y el backoffice quedan fuera de esta entrega.
- El acceso privilegiado y los futuros roles pertenecen a Nest.

## Evidencia de staging

Staging `aosuhoyxwusszggaxouu` recibió el primer modelo el 2026-08-12. Antes del
rebaseline de 2026-08-13 debe verificarse que Auth, Storage y las tablas
funcionales estén vacías. Si lo están, el ambiente puede resetearse porque aún no
existen datos de usuarios que conservar.

## Riesgos abiertos

- Diseñar contratos tRPC/REST y capacidades de backoffice.
- Implementar el flujo completo de carga y limpieza de CVs huérfanos.
- Definir observabilidad y rate limits de los endpoints de escritura.

## Revisión 1.2

La versión 1.2 incorpora las reglas de `SPEC-AUTH-001` para CU-86ajvbvcd:
nacionalidad ISO, etiquetas localizadas y ciclo de carga de CV. Está aprobada
para contratos, migraciones y pruebas de la story.
