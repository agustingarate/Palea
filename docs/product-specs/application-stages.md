---
id: SPEC-APPLICATIONS-004
title: Etapas de un proceso de selección
status: approved
version: 1.0
stories: [CU-86ajvbvda]
clickup: [https://app.clickup.com/t/86ajvbvda]
owners: []
last_reviewed: 2026-08-29
supersedes: null
---

# Etapas de un proceso de selección

## Propósito y contexto

Un candidato autenticado puede registrar y mantener los hitos propios de una
postulación desde iOS, Android y Expo Web. Las etapas forman un historial
independiente del estado de la postulación en el tablero y se muestran como una
línea temporal en su detalle.

La referencia visual obligatoria es el proyecto Stitch
`16272299109015713935`: `Application Detail (Stages)`, `Add/Edit Stage Form`,
`Stage Detail`, `Edit Stage (with Delete)`, `Add/Edit Stage - Web` y
`Edit Stage (with Delete) - Web`. `apps/web` queda fuera de alcance.

## Actores y permisos

- Sólo un candidato autenticado puede consultar o mutar etapas.
- Cada operación se limita al propietario de la postulación y de la etapa.
- Una postulación o etapa inexistente o ajena produce el mismo error
  `applications.not_found`; la API no revela cuál de esas condiciones ocurrió.

## Comportamiento visible

- El detalle muestra el timeline completo y un CTA para agregar. Cada hito abre
  su detalle; el detalle navega a edición.
- Crear y editar comparten un formulario con `Stage Details`, `Status` y
  `Notes & Context`. Eliminar sólo aparece en edición y exige confirmación.
- Volver o cancelar con cambios sin guardar exige confirmar descarte; sin
  cambios vuelve directamente.
- Una etapa `pending` con `eventOn` igual o anterior a la fecha local del
  dispositivo muestra un warning contextual persistente con CTA para editar.
  No cambia datos automáticamente ni admite descarte persistido.

## Reglas de negocio

- **BR-01:** `name` se recorta y es obligatorio, de 1 a 120 caracteres.
  `questions` y `comments` son opcionales, máximo 10.000 cada uno. No se
  persisten entrevistadores.
- **BR-02:** `eventOn` es opcional. `result` admite `pending`, `waiting`,
  `successful` o `failed`, con `pending` por defecto. `waiting` se presenta como
  “Esperando resultados” / “Waiting for results”.
- **BR-03:** Sin `eventOn` sólo se admite `pending`; los demás resultados exigen
  fecha.
- **BR-04:** En `pending`, `difficulty` está deshabilitada y es `null`. Al salir
  de `pending` toma `easy` por defecto y puede ser `easy`, `medium` o `hard`. Al
  volver a `pending` se limpia.
- **BR-05:** El orden es descendente por el día calendario de `eventOn` o, si
  falta, de `createdAt`; dentro del mismo día desempata por la hora de
  `createdAt` e ID, también descendentes. La primera es la actual.
- **BR-06:** No se crean etapas iniciales automática o implícitamente.
- **BR-07:** Eliminar la actual recalcula naturalmente la anterior por el orden;
  eliminar la única deja el timeline vacío.
- **BR-08:** Crear, editar o eliminar nunca modifica `applications.status`, su
  posición ni otro dato del tablero.
- **BR-09:** El warning usa la fecha calendario local del dispositivo y se
  muestra mientras `result = pending` y `eventOn <= hoy`; su CTA abre edición.
- **BR-10:** Crear y actualizar aplican las mismas invariantes. Los strings
  opcionales vacíos se normalizan a `null`.
- **BR-11:** Todo CRUD es owner-scoped y atómico. Actualizar o eliminar comprueba
  simultáneamente etapa, postulación y dueño.
- **BR-12:** Las mutaciones refrescan exactamente la colección afectada y el
  detalle individual cuando corresponde; no duplican estado remoto.

## Criterios de aceptación

- **AC-01:** El candidato crea una etapa válida y la ve inmediatamente en la
  posición correcta en iOS, Android y Expo Web.
- **AC-02:** Abre cualquier hito, consulta todos sus campos y navega a edición.
- **AC-03:** Edita todos los campos con defaults, habilitación y limpieza de
  dificultad conforme BR-03/04.
- **AC-04:** Elimina desde edición tras confirmar; cancelar no cambia nada.
- **AC-05:** El CRUD no altera estado ni posición de la postulación en tablero.
- **AC-06:** Una postulación sin etapas muestra vacío y CTA, sin etapa inicial.
- **AC-07:** El timeline conserva BR-05 y marca actual sólo el primer elemento.
- **AC-08:** La etapa pendiente vencida muestra warning persistente con CTA, sin
  transición automática ni descarte persistido.
- **AC-09:** Volver/cancelar con borrador modificado confirma descarte; un
  borrador limpio vuelve directamente.
- **AC-10:** Lista, detalle y mutaciones cubren loading, error recuperable,
  not-found, pending y success.
- **AC-11:** ES/EN, objetivos de 48 dp, foco visible, teclado web, lector de
  pantalla, radiogroups semánticos y reduced motion.
- **AC-12:** A 390 px se usa una columna; a 768 px no hay overflow; a 1280 px
  Expo Web incluye shell/navegación, cabecera/acciones y composición asimétrica
  de dos columnas coherente con Stitch.

## Requisitos no funcionales

- **NFR-01:** Mobile conserva Clean Architecture + MVVM feature-first:
  `presentation -> domain`, `data -> domain`; Expo Router sólo adapta parámetros.
- **NFR-02:** TanStack Query posee el estado remoto y TanStack Form sólo el
  borrador local. tRPC sólo aparece en el datasource.
- **NFR-03:** Zod valida límites. Supabase CLI es autoridad de esquema y Prisma
  el contrato tipado de acceso.
- **NFR-04:** Las operaciones no filtran existencia ni exponen datos ajenos. Las
  tablas base quedan sin privilegios para `anon`/`authenticated`, con RLS.
- **NFR-05:** La UI reutiliza/extiende `@palea/ui-native` y sus tokens; las reglas
  de negocio permanecen fuera de componentes compartidos.
- **NFR-06:** La experiencia respeta safe areas, teclado nativo/web y reduced
  motion, sin depender sólo del color.

## Estados, transiciones e invariantes

`pending` puede tener o no fecha y siempre tiene `difficulty = null`.
`waiting`, `successful` y `failed` siempre tienen fecha y dificultad. La
transición `pending -> no pending` inicializa `easy`; la inversa limpia. No hay
transición automática por tiempo.

El ciclo UI de una mutación es `idle -> pending -> success|error`; sólo
`success` invalida cache y navega. Una eliminación fallida conserva la pantalla.

## Interfaces y contratos

Procedimientos tRPC protegidos con Zod en `@palea/contracts`:

- `applications.listStages({ applicationId }) -> ApplicationStage[]`
- `applications.createStage({ applicationId, name, eventOn, result,
difficulty, questions, comments }) -> ApplicationStage`
- `applications.getStage({ applicationId, stageId }) -> ApplicationStage`
- `applications.updateStage({ applicationId, stageId, name, eventOn, result,
difficulty, questions, comments }) -> ApplicationStage`
- `applications.deleteStage({ applicationId, stageId }) -> { success: true }`

`ApplicationStage` expone `id`, `applicationId`, `name`, `eventOn`, `result`,
`difficulty`, `questions`, `comments`, `createdAt` y `updatedAt`. El contrato
anterior `details` se elimina.

## Datos y migración

Una nueva migración Supabase crea `application_stage_result` y
`application_stage_difficulty`, renombra `details` a `comments`, incorpora
`result`, `difficulty` y `questions`, aplica defaults/checks/límites y reemplaza
el índice de orden. Datos existentes conservan su texto en `comments`, reciben
`pending` y `difficulty = null`. No hay fallback, alias ni compatibilidad con
`details`. Prisma se actualiza sin usar Prisma Migrate.

## Fallos, reintentos y concurrencia

- Payload inválido produce `BAD_REQUEST` antes de persistir.
- Postulación/etapa inexistente o ajena produce `applications.not_found`.
- Los fallos recuperables muestran reintento. No hay mutaciones optimistas.
- Cada escritura es atómica y no persiste una noción de “etapa actual”.
- Crear repetidamente crea identidades nuevas; actualizar/eliminar usan identidad
  estable y no requieren idempotency key.

## Seguridad, privacidad y observabilidad

Preguntas y comentarios son privados. No se registran payloads, tokens ni su
contenido; sólo request ID y código de aplicación. Nest es la única frontera de
producto y comprueba ownership en cada operación.

## Accesibilidad

Resultados y dificultades son radiogroups nombrados, con selección anunciada.
Campos, warnings y errores tienen labels y mensajes asociados; CTA e hitos son
operables por teclado/lector y miden al menos 48 dp. El warning usa icono y texto
además de color. Se reducen animaciones cuando el sistema lo solicita.

## No objetivos

- Entrevistadores, adjuntos, recordatorios o cambio automático de resultado.
- Sincronizar etapas con `applications.status` o posición del tablero.
- Etapas iniciales, `apps/web`, backoffice o compatibilidad con `details`.

## Mapeo de pruebas

| Requisito            | Prueba/evidencia                                           |
| -------------------- | ---------------------------------------------------------- |
| BR-01/02/03/04/10    | contratos Zod, servicio Nest y constraints pgTAP           |
| BR-05/07             | servicio y SQL con fechas nulas, empates y eliminación     |
| BR-06/08, AC-05/06   | servicio/SQL: cero inserts implícitos y tablero inalterado |
| BR-09, AC-08         | modelo/ViewModel y warning con fecha local controlada      |
| BR-11, NFR-04        | tRPC protegido, servicio owner-scoped y RLS/privilegios    |
| BR-12, NFR-01/02     | datasource, repositorio, casos de uso y cache Query        |
| AC-01/02/03/04/09/10 | rutas, formulario y pantallas mobile/web                   |
| AC-11, NFR-05/06     | componentes/a11y y revisión `ui-native`                    |
| AC-12                | QA visual Stitch a 390, 768 y 1280 CSS px                  |
| NFR-03               | Prisma generate/validate, `supabase db reset/test db`      |

## Decisiones relacionadas

- [SPEC-APPLICATIONS-003](application-detail.md)
- [SPEC-DATA-001](mvp-data-model.md)
- [ADR-002](../design-docs/ADR-002-mobile-architecture.md)
- [ADR-003](../design-docs/ADR-003-client-state.md)
- [ADR-005](../design-docs/ADR-005-trpc-in-nest.md)
- [ADR-008](../design-docs/ADR-008-prisma-supabase-migrations.md)

## Preguntas abiertas

Ninguna. La preview y las reglas fueron aprobadas antes de implementar.
